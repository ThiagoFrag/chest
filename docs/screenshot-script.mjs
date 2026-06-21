import { chromium } from 'playwright';

const PANEL_URL = process.env.PANEL_URL ?? 'https://panel.example.com';
const USER = process.env.PANEL_USER ?? 'admin';
const PASS = process.env.PANEL_PASS;
if (!PASS) {
  console.error(
    'set PANEL_PASS env var (e.g. PANEL_PASS=... node docs/screenshot-script.mjs)'
  );
  process.exit(1);
}
const OUT = process.env.OUT_DIR ?? './docs/screenshots';

const SHOTS = [
  { path: '/dashboard', file: '01-dashboard.png', wait: 'networkidle' },
  { path: '/servers', file: '02-servers-list.png', wait: 'networkidle' },
  { path: '/servers/forja-a-3', file: '03-server-overview.png', wait: 'networkidle' },
  { path: '/servers/forja-a-3?tab=console', file: '04-console.png', wait: 2000 },
  { path: '/servers/forja-a-3?tab=mods', file: '05-mods.png', wait: 1500 },
  { path: '/servers/forja-a-3?tab=mundo', file: '06-world.png', wait: 1500 },
  { path: '/servers/forja-a-3?tab=map', file: '07-bluemap-iframe.png', wait: 4000 },
  {
    path: '/servers/forja-a-3?tab=properties',
    file: '08-properties-editor.png',
    wait: 1500
  },
  { path: '/servers/forja-a-3?tab=files', file: '09-file-manager.png', wait: 2500 },
  { path: '/servers/forja-a-3?tab=backups', file: '10-backups.png', wait: 1500 },
  { path: '/servers/forja-a-3?tab=agenda', file: '11-scheduler.png', wait: 1500 },
  { path: '/servers/forja-a-3?tab=network', file: '12-network.png', wait: 1500 },
  { path: '/servers/forja-a-3?tab=discord', file: '13-discord-bridge.png', wait: 1500 },
  { path: '/servers/forja-a-3?tab=access', file: '14-subusers.png', wait: 1500 },
  { path: '/servers/forja-a-3?tab=settings', file: '15-server-settings.png', wait: 1500 },
  { path: '/eggs', file: '16-eggs.png', wait: 1500 },
  { path: '/users', file: '17-users.png', wait: 1500 },
  { path: '/audit', file: '18-audit-log.png', wait: 1500 },
  { path: '/security', file: '19-security-2fa.png', wait: 1500 },
  { path: '/webhooks', file: '20-webhooks.png', wait: 1500 },
  { path: '/settings', file: '21-settings.png', wait: 1500 },
  { path: '/servers/new', file: '22-new-server-wizard.png', wait: 1500 }
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  ignoreHTTPSErrors: true,
  deviceScaleFactor: 2
});

// Login via form (cria session cookie pro contexto)
const loginPage = await context.newPage();
await loginPage.goto(PANEL_URL + '/login');
await loginPage.fill('input[name="username"]', USER);
await loginPage.fill('input[name="password"]', PASS);
await Promise.all([
  loginPage.waitForNavigation(),
  loginPage.click('button[type="submit"]')
]);
await loginPage.close();

for (const shot of SHOTS) {
  const page = await context.newPage();
  try {
    console.log(`shot: ${shot.path}`);
    await page.goto(PANEL_URL + shot.path, {
      waitUntil: shot.wait === 'networkidle' ? 'networkidle' : 'load',
      timeout: 30000
    });
    if (typeof shot.wait === 'number') await page.waitForTimeout(shot.wait);
    await page.screenshot({ path: `${OUT}/${shot.file}`, fullPage: false });
    console.log(`  saved: ${shot.file}`);
  } catch (err) {
    console.error(`  FAILED ${shot.file}: ${err.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log('done');
