import { chromium } from 'playwright';
const URL = process.env.PANEL_URL ?? 'https://panel.example.com';
const USER = process.env.PANEL_USER ?? 'admin';
const PASS = process.env.PANEL_PASS;
if (!PASS) {
  console.error(
    'set PANEL_PASS env var (e.g. PANEL_PASS=... node docs/screenshot-missing.mjs)'
  );
  process.exit(1);
}
const OUT = process.env.OUT_DIR ?? './docs/screenshots';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  ignoreHTTPSErrors: true,
  deviceScaleFactor: 2
});
const login = await ctx.newPage();
await login.goto(URL + '/login');
await login.fill('input[name="username"]', USER);
await login.fill('input[name="password"]', PASS);
await Promise.all([login.waitForNavigation(), login.click('button[type="submit"]')]);
await login.close();

const targets = [
  { path: '/servers/forja-a-3', file: '03-server-overview.png', waitMs: 3500 },
  {
    path: '/servers/forja-a-3?tab=overview',
    file: '03b-server-overview-alt.png',
    waitMs: 3500
  }
];

for (const t of targets) {
  const p = await ctx.newPage();
  try {
    console.log('shot:', t.path);
    await p.goto(URL + t.path, { waitUntil: 'load', timeout: 20000 });
    await p.waitForTimeout(t.waitMs);
    await p.screenshot({ path: `${OUT}/${t.file}`, fullPage: false });
    console.log('  saved:', t.file);
  } catch (err) {
    console.error('  FAIL:', t.file, err.message);
  } finally {
    await p.close();
  }
}
await browser.close();
