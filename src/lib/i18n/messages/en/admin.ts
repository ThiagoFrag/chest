import type { Dict } from '../../types';

export const adminMessages: Dict = {
  // settings
  'admin.settings.head': 'Chest · Settings',
  'admin.settings.title': 'SETTINGS',
  'admin.settings.subtitle': 'global panel settings',
  'admin.settings.configured': 'configured',
  'admin.settings.replaceHint': '↓ enter a new value to replace it',
  'admin.settings.delete': 'delete',
  'admin.settings.hide': 'hide',
  'admin.settings.show': 'show',
  'admin.settings.save': 'save',
  'admin.settings.saved': 'ok',
  'admin.settings.confirmClear': 'Delete {key}?',
  'admin.settings.testWebhookOk': '✓ webhook ok! check your Discord channel.',
  'admin.settings.error': 'error: {message}',

  // settings sections
  'admin.settings.drasl.title': 'DRASL (Auth Server)',
  'admin.settings.drasl.desc':
    'Self-hosted auth server so players without a Microsoft account can join',
  'admin.settings.drasl.url.label': 'Drasl URL',
  'admin.settings.drasl.url.help':
    'Base URL of your Drasl. The wizard will offer a "use Drasl" toggle once configured.',
  'admin.settings.drasl.token.label': 'Admin token (optional)',
  'admin.settings.drasl.token.help': 'To manage players directly from the panel',

  'admin.settings.cloudflare.title': 'CLOUDFLARE',
  'admin.settings.cloudflare.desc':
    'To create DNS automatically when exposing a server publicly',
  'admin.settings.cloudflare.apiToken.label': 'API Token (Edit zone DNS)',
  'admin.settings.cloudflare.apiToken.help':
    'Cloudflare → My Profile → API Tokens → Create → "Edit zone DNS" template',
  'admin.settings.cloudflare.zoneId.label': 'Zone ID',
  'admin.settings.cloudflare.zoneId.help':
    'Visible on the CF dashboard in the right sidebar of the zone',
  'admin.settings.cloudflare.cnameTarget.label': 'CNAME target',
  'admin.settings.cloudflare.cnameTarget.help':
    "Hostname the created subdomains will point to (e.g. the server's A record host)",

  'admin.settings.playit.title': 'PLAYIT.GG',
  'admin.settings.playit.desc': 'Automatic TCP tunnels for servers behind CGNAT',
  'admin.settings.playit.secretKey.label': 'Agent SECRET_KEY',
  'admin.settings.playit.secretKey.help':
    'Create it at playit.gg/account/agents → Self managed (Docker)',

  'admin.settings.discord.title': 'DISCORD',
  'admin.settings.discord.desc': 'Event notifications (server up/down, joins, backup)',
  'admin.settings.discord.webhookUrl.label': 'Webhook URL (notifications)',
  'admin.settings.discord.webhookUrl.help':
    'for simple notifications (server up/down, backup, crash)',
  'admin.settings.discord.botToken.label': 'Bot Token (MC ⇄ Discord chat bridge)',
  'admin.settings.discord.botToken.help':
    'Create a bot at discord.com/developers/applications → Bot → token. Permissions: Send Messages, View Channel, Manage Webhooks. Invite it with the bot scope.',
  'admin.settings.discord.adminUserId.label': 'Your Discord User ID (admin)',
  'admin.settings.discord.adminUserId.help':
    'to get a DM when a server crashes. Enable Developer Mode in Discord → right-click your name → Copy User ID.',
  'admin.settings.discord.oauthClientId.label': 'OAuth Client ID (login with Discord)',
  'admin.settings.discord.oauthClientId.help':
    'discord.com/developers/applications → your app → OAuth2 → Client ID. Enables "sign in with Discord" and account linking.',
  'admin.settings.discord.oauthClientSecret.label': 'OAuth Client Secret',
  'admin.settings.discord.oauthClientSecret.help':
    'OAuth2 → Client Secret. Keep it secret — it is encrypted in the database.',
  'admin.settings.discord.oauthGuildId.label': 'OAuth Guild ID (optional)',
  'admin.settings.discord.oauthGuildId.help':
    'Optional. If set, members of this Discord server can create an account automatically (as viewer). Empty = manual linking only.',

  'admin.settings.chest.title': 'CHEST',
  'admin.settings.chest.desc': 'General panel settings',
  'admin.settings.chest.baseUrl.label': 'Public base URL of Chest',
  'admin.settings.chest.baseUrl.help': 'Used in notifications, email links, etc.',
  'admin.settings.chest.mcHost.label': 'Address to connect to MC servers',
  'admin.settings.chest.mcHost.help':
    'Hostname/IP of the Docker host. Shown in "HOW TO CONNECT" on each server\'s overview. IPv6 in brackets.',

  'admin.settings.storage.title': 'STORAGE',
  'admin.settings.storage.desc':
    'Where to store backups — local (FS) or S3-compatible (AWS/R2/B2/MinIO)',
  'admin.settings.storage.driver.label': 'Driver',
  'admin.settings.storage.driver.help': 'value: local OR s3',
  'admin.settings.storage.localDir.label': 'Local directory (if driver=local)',
  'admin.settings.storage.s3Endpoint.label':
    'S3 endpoint (empty = AWS; R2: https://accountid.r2.cloudflarestorage.com)',
  'admin.settings.storage.s3Region.label': 'S3 region',
  'admin.settings.storage.s3Bucket.label': 'S3 bucket',
  'admin.settings.storage.s3AccessKey.label': 'S3 access key ID',
  'admin.settings.storage.s3SecretKey.label': 'S3 secret access key',
  'admin.settings.storage.s3PathPrefix.label': 'Path prefix (optional)',
  'admin.settings.storage.s3ForcePathStyle.label': 'Force path style (true for MinIO)',

  // settings - discord redirect uri block
  'admin.settings.discord.redirect.title':
    'ℹ Redirect URI (register it in the Discord Developer Portal)',
  'admin.settings.discord.redirect.desc': 'Under OAuth2 → Redirects, add exactly:',
  'admin.settings.discord.test.button': 'test webhook',
  'admin.settings.discord.test.hint': 'sends a test message to the channel',

  // settings - bot status
  'admin.settings.bot.title': 'BOT STATUS',
  'admin.settings.bot.needToken': 'set the bot token above to unlock installation',
  'admin.settings.bot.invalidToken': 'invalid token or network failure',
  'admin.settings.bot.connectedAs': 'connected as',
  'admin.settings.bot.installedIn': 'installed in',
  'admin.settings.bot.serverOne': 'server',
  'admin.settings.bot.serverOther': 'servers',
  'admin.settings.bot.noGuild': 'bot is not in any server yet',
  'admin.settings.bot.addToServer': 'add bot to a server',
  'admin.settings.bot.addHint':
    'opens Discord OAuth in a new tab. you must be a server admin.',

  // settings - discord guided flow
  'admin.settings.discord.flow.title': 'DISCORD',
  'admin.settings.discord.flow.desc':
    'connect the bot in 3 steps. self-hosted, so the token is yours.',

  'admin.settings.discord.step1.title': '1. Connect the bot',
  'admin.settings.discord.step1.desc':
    'paste your bot token and validate it before saving.',
  'admin.settings.discord.step1.tokenLabel': 'Bot Token',
  'admin.settings.discord.step1.validate': 'validate token',
  'admin.settings.discord.step1.validating': 'validating...',
  'admin.settings.discord.step1.valid': 'Bot: {username}',
  'admin.settings.discord.step1.invalid': 'invalid token: {reason}',
  'admin.settings.discord.step1.invalidGeneric': 'invalid token or network failure',
  'admin.settings.discord.step1.helpToggle': 'How to create the bot?',
  'admin.settings.discord.step1.helpBody':
    'create an application, open the Bot tab and copy the token.',
  'admin.settings.discord.step1.helpLink': 'Discord Developer Portal',

  'admin.settings.discord.step2.title': '2. Add it to your server',
  'admin.settings.discord.step2.desc':
    'you will pick which server to add it to, right on the Discord screen.',
  'admin.settings.discord.step2.add': 'Add bot to Discord',
  'admin.settings.discord.step2.permissions': 'requested permissions: {hint}',
  'admin.settings.discord.step2.refresh': 'I added it / refresh',
  'admin.settings.discord.step2.locked':
    'validate or save a valid token in step 1 to unlock.',

  'admin.settings.discord.step3.title': '3. Status',
  'admin.settings.discord.step3.channelNote':
    "which channel each server uses is set in that server's Discord tab (DiscordBridgePanel). no need to configure it here.",

  'admin.settings.discord.advanced.summary': 'Advanced',
  'admin.settings.discord.advanced.webhookLabel': 'Webhook URL (legacy)',
  'admin.settings.discord.advanced.webhookHelp':
    "Optional. Simple notifications (server up/down/crash) WITHOUT running the bot 24/7. If you already use the bot above, you don't need this.",
  'admin.settings.discord.advanced.adminIdHelp':
    'Optional. Gets a DM when a server crashes.',
  'admin.settings.discord.advanced.loginTitle': 'Login with Discord',
  'admin.settings.discord.advanced.loginDesc':
    'OAuth for "sign in with Discord". A separate feature, independent of the bot.',

  // webhooks
  'admin.webhooks.head': 'Chest · Webhooks',
  'admin.webhooks.title': 'WEBHOOKS',
  'admin.webhooks.subtitle':
    'notify external systems when events happen (Slack, n8n, Zapier, etc)',
  'admin.webhooks.errorGeneric': 'failed',
  'admin.webhooks.errorStatus': 'error {status}',
  'admin.webhooks.secretCreated':
    '✓ webhook created! Save the secret — it is shown only once:',
  'admin.webhooks.copy': 'copy',
  'admin.webhooks.noted': 'got it',
  'admin.webhooks.verifyHeader': 'your endpoint must verify the header',
  'admin.webhooks.create.title': 'CREATE WEBHOOK',
  'admin.webhooks.create.nameLabel': 'name',
  'admin.webhooks.create.namePlaceholder': 'Slack #ops',
  'admin.webhooks.create.urlLabel': 'URL',
  'admin.webhooks.create.urlPlaceholder': 'https://hooks.slack.com/...',
  'admin.webhooks.create.eventsHelp': 'events (use {star} for all or {group} for groups)',
  'admin.webhooks.create.allEvents': '* all',
  'admin.webhooks.create.button': 'create webhook',
  'admin.webhooks.list.title': 'CONFIGURED WEBHOOKS',
  'admin.webhooks.list.empty': 'no webhooks yet. create the first one above.',
  'admin.webhooks.row.disabled': 'disabled',
  'admin.webhooks.row.failures': '⚠ {n} failures',
  'admin.webhooks.row.test': 'test',
  'admin.webhooks.row.pause': 'pause',
  'admin.webhooks.row.activate': 'enable',
  'admin.webhooks.row.confirmRemove': 'Remove webhook "{name}"?',
  'admin.webhooks.row.secret': 'secret:',
  'admin.webhooks.row.lastDelivery': 'last delivery: {when}',
  'admin.webhooks.docs.summary': '📖 how to verify the signature (HMAC SHA-256)',
  'admin.webhooks.docs.eachRequest': 'each POST request has the header:',
  'admin.webhooks.docs.compare':
    'compare it with the HMAC SHA-256 of the raw body using the secret:',

  // audit
  'admin.audit.head': 'Chest · Audit log',
  'admin.audit.title': 'AUDIT LOG',
  'admin.audit.subtitle': '{count} recorded events · {page}/{pages}',
  'admin.audit.filter.actionLabel': 'action',
  'admin.audit.filter.actionPlaceholder': 'server.start',
  'admin.audit.filter.userLabel': 'user',
  'admin.audit.filter.userPlaceholder': 'admin',
  'admin.audit.filter.statusLabel': 'status',
  'admin.audit.filter.statusAll': 'all',
  'admin.audit.filter.apply': 'filter',
  'admin.audit.filter.clear': 'clear',
  'admin.audit.empty': 'no events found with these filters',
  'admin.audit.col.when': 'when',
  'admin.audit.col.who': 'who',
  'admin.audit.col.action': 'action',
  'admin.audit.col.resource': 'resource',
  'admin.audit.col.ip': 'IP',
  'admin.audit.col.status': 'status',
  'admin.audit.page.prev': 'previous',
  'admin.audit.page.next': 'next',
  'admin.audit.page.info': 'page {page} of {pages}',

  // security
  'admin.security.head': 'Chest · Security',
  'admin.security.title': 'SECURITY',
  'admin.security.subtitle': 'protect your account with two-factor authentication',
  'admin.security.fail': 'failed',
  'admin.security.invalidCode': 'invalid code',
  'admin.security.confirmDisable':
    'Are you sure? This removes 2FA protection from your account.',
  'admin.security.totp.title': '2FA AUTHENTICATION (TOTP)',
  'admin.security.totp.desc':
    '6-digit code from your authenticator app (Google Authenticator, Authy, Aegis, 1Password)',
  'admin.security.totp.active': 'active',
  'admin.security.totp.inactive': 'disabled',
  'admin.security.backup.saved':
    '✓ 2FA ENABLED! Save these backup codes in a safe place:',
  'admin.security.backup.copyAll': 'copy all',
  'admin.security.backup.noted': 'got it',
  'admin.security.backup.onceHint':
    '⚠ each code can be used once. they replace the app code if you lose access to your authenticator.',
  'admin.security.enabledAt': 'enabled on',
  'admin.security.disable.summary': 'disable 2FA',
  'admin.security.disable.confirmHint': 'enter your current code to confirm',
  'admin.security.disable.button': 'disable',
  'admin.security.setup.step1': 'Scan the QR in your authenticator app',
  'admin.security.setup.qrAlt': 'QR code',
  'admin.security.setup.manual': 'or enter it manually:',
  'admin.security.setup.step2': 'Enter the code generated by the app to confirm',
  'admin.security.setup.enable': 'enable',
  'admin.security.setup.cancel': 'cancel setup',
  'admin.security.intro':
    "adding 2FA makes your account much safer. even if someone learns your password, they can't get in without the app code.",
  'admin.security.enable2fa': 'enable 2FA',
  'admin.security.connections.title': 'CONNECTIONS',
  'admin.security.connections.desc': 'link external accounts to sign in faster',
  'admin.security.discord.avatarAlt': "{username}'s Discord avatar",
  'admin.security.discord.label': 'Discord',
  'admin.security.discord.connectedAs': 'connected as',
  'admin.security.discord.unlink': 'unlink',
  'admin.security.discord.linkPrompt': 'link your Discord to sign in with one click',
  'admin.security.discord.connect': 'connect Discord',

  // users
  'admin.users.head': 'Chest · Users',
  'admin.users.title': 'USERS',
  'admin.users.subtitle': 'manage accounts + roles + invites',
  'admin.users.error': 'error: {message}',
  'admin.users.confirmDeleteInvite': 'Delete this invite?',
  'admin.users.confirmDeleteUser': 'Delete user {username}?',
  'admin.users.accounts.title': 'ACCOUNTS',
  'admin.users.accounts.countOne': '{n} user',
  'admin.users.accounts.countOther': '{n} users',
  'admin.users.row.created': 'created: {created} · last login: {lastLogin}',
  'admin.users.row.you': '(you)',
  'admin.users.role.admin': 'admin',
  'admin.users.role.operator': 'operator',
  'admin.users.role.viewer': 'viewer',
  'admin.users.role.adminDesc': 'everything: create/delete servers, settings, users',
  'admin.users.role.operatorDesc':
    'manage existing servers (start/stop, console, mods, backups)',
  'admin.users.role.viewerDesc': 'read-only (overview, console read, metrics)',
  'admin.users.deleteUser': 'delete',
  'admin.users.invites.title': 'INVITES',
  'admin.users.invites.subtitle': 'signup links with a predefined role',
  'admin.users.invites.new': 'new invite',
  'admin.users.invites.roleLabel': 'role',
  'admin.users.invites.noteLabel': 'note (optional)',
  'admin.users.invites.notePlaceholder': 'who for? e.g. my friend John',
  'admin.users.invites.cancel': 'cancel',
  'admin.users.invites.generate': 'generate link',
  'admin.users.invites.empty': 'no invites yet',
  'admin.users.invites.used': 'used',
  'admin.users.invites.expired': 'expired',
  'admin.users.invites.pending': 'pending',
  'admin.users.invites.created': 'created: {created} · expires: {expires}',
  'admin.users.invites.copyLink': 'copy link',
  'admin.users.invites.delete': 'delete',

  // eggs
  'admin.eggs.head': 'Chest · Eggs',
  'admin.eggs.title': 'EGGS',
  'admin.eggs.subtitleOne': 'declarative server templates · {n} available',
  'admin.eggs.subtitleOther': 'declarative server templates · {n} available',
  'admin.eggs.searchPlaceholder': 'search by name, tag, description...',
  'admin.eggs.category.all': 'all',
  'admin.eggs.category.vanilla': 'vanilla',
  'admin.eggs.category.performance': 'performance',
  'admin.eggs.category.modded': 'modded',
  'admin.eggs.category.modpack': 'modpack',
  'admin.eggs.category.pvp': 'pvp',
  'admin.eggs.category.creative': 'creative',
  'admin.eggs.category.minigames': 'minigames',
  'admin.eggs.category.other': 'other',
  'admin.eggs.empty.title': 'no egg found',
  'admin.eggs.empty.hint': 'add a .json file in {path} and restart the panel',
  'admin.eggs.noDescription': 'no description',
  'admin.eggs.use': 'use this egg',
  'admin.eggs.contribute.title': 'WANT TO CONTRIBUTE AN EGG?',
  'admin.eggs.contribute.body1': 'create a JSON file in',
  'admin.eggs.contribute.body2': 'following the schema in',
  'admin.eggs.contribute.body3': '. Restart the panel or call',
  'admin.eggs.contribute.body4': 'to reload.'
};
