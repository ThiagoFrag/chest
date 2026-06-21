import type { Dict } from '../../types';

export const integrationsMessages: Dict = {
  // DiscordBridgePanel
  'integrations.discord.botStatus.title': 'BOT STATUS',
  'integrations.discord.botStatus.subtitle': 'discord.js v14 bridge',
  'integrations.discord.botStatus.notConfigured': 'bot not configured',
  'integrations.discord.botStatus.notConfiguredHintBefore': 'Set',
  'integrations.discord.botStatus.notConfiguredHintMid': 'in',
  'integrations.discord.botStatus.notConfiguredHintAfter': 'to enable the chat bridge.',
  'integrations.discord.botStatus.settings': 'Settings',
  'integrations.discord.botStatus.notConnected': 'bot configured but not connected',
  'integrations.discord.botStatus.notConnectedHint':
    'invalid token or network failure. check Settings.',
  'integrations.discord.botStatus.connectedAs': 'connected as {username}',
  'integrations.discord.botStatus.guildsCount.one': '{n} server reachable',
  'integrations.discord.botStatus.guildsCount.other': '{n} servers reachable',
  'integrations.discord.botStatus.addBot': 'add bot to a server',
  'integrations.discord.botStatus.addBotHint':
    'opens Discord OAuth. you must be a server admin.',
  'integrations.discord.channel.title': 'BRIDGE CHANNEL',
  'integrations.discord.channel.subtitle': 'MC ⇄ Discord two-way',
  'integrations.discord.channel.bridgeActive': '✓ bridge active',
  'integrations.discord.channel.channelLabel': 'channel: {id}',
  'integrations.discord.channel.disconnect': 'disconnect',
  'integrations.discord.channel.connectBotFirst': 'connect the bot first',
  'integrations.discord.channel.serverLabel': 'Discord server',
  'integrations.discord.channel.serverPlaceholder': 'select...',
  'integrations.discord.channel.textChannelLabel': 'text channel',
  'integrations.discord.channel.noChannels':
    'no reachable channels. the bot needs "View Channel" + "Send Messages" + "Manage Webhooks" permissions.',
  'integrations.discord.howItWorks.title': 'HOW IT WORKS',
  'integrations.discord.howItWorks.mcToDiscord': 'MC → Discord',
  'integrations.discord.howItWorks.mcToDiscord.chat':
    'in-game chat (with player skin avatar)',
  'integrations.discord.howItWorks.mcToDiscord.events': 'join/leave events',
  'integrations.discord.howItWorks.mcToDiscord.death':
    'deaths (embed style with 💀 emoji)',
  'integrations.discord.howItWorks.discordToMc': 'Discord → MC',
  'integrations.discord.howItWorks.discordToMc.messages': 'messages become',
  'integrations.discord.howItWorks.discordToMc.messagesSuffix': 'in chat',
  'integrations.discord.howItWorks.discordToMc.rcon': 'via RCON tellraw (colored)',
  'integrations.discord.howItWorks.discordToMc.selectedOnly':
    'only the selected channel, others ignored',
  'integrations.discord.alert.saveError': 'error: {error}',

  // SchedulerPanel
  'integrations.scheduler.preset.hourly': 'hourly',
  'integrations.scheduler.preset.every6h': 'every 6 hours',
  'integrations.scheduler.preset.every12h': 'every 12 hours',
  'integrations.scheduler.preset.daily3am': 'daily at 3am',
  'integrations.scheduler.preset.daily4am': 'daily at 4am',
  'integrations.scheduler.preset.daily6am': 'daily at 6am',
  'integrations.scheduler.preset.weeklySunday3am': 'Sunday at 3am',
  'integrations.scheduler.note.wizardHintBefore':
    'to use scheduling, create the server through the wizard (the',
  'integrations.scheduler.note.wizardHintButton': '+ new server',
  'integrations.scheduler.note.wizardHintAfter': 'button).',
  'integrations.scheduler.list.title': 'TASKS',
  'integrations.scheduler.list.count.one': '{n} scheduled',
  'integrations.scheduler.list.count.other': '{n} scheduled',
  'integrations.scheduler.list.new': 'new',
  'integrations.scheduler.list.empty': 'no scheduled tasks',
  'integrations.scheduler.task.toggleEnable': 'enable',
  'integrations.scheduler.task.toggleDisable': 'disable',
  'integrations.scheduler.task.delete': 'delete',
  'integrations.scheduler.task.lastBefore': 'last:',
  'integrations.scheduler.task.nextBefore': 'next:',
  'integrations.scheduler.confirm.delete': 'Delete this task?',
  'integrations.scheduler.form.title': 'NEW TASK',
  'integrations.scheduler.form.typeLabel': 'type',
  'integrations.scheduler.form.type.backup': 'backup',
  'integrations.scheduler.form.type.restart': 'restart',
  'integrations.scheduler.form.type.command': 'command',
  'integrations.scheduler.form.scopeLabel': 'scope',
  'integrations.scheduler.form.scope.world': 'world only',
  'integrations.scheduler.form.scope.full': 'everything',
  'integrations.scheduler.form.commandLabel': 'RCON command',
  'integrations.scheduler.form.commandPlaceholder': 'say "announcement"',
  'integrations.scheduler.form.presetsLabel': 'presets',
  'integrations.scheduler.form.cronLabel': 'cron expression',
  'integrations.scheduler.form.cronPlaceholder': '0 4 * * *',
  'integrations.scheduler.form.cronHintBefore': 'min hour dom mon dow · e.g.:',
  'integrations.scheduler.form.cronHintAfter': '= every 6h',
  'integrations.scheduler.form.cancel': 'cancel',
  'integrations.scheduler.form.create': 'create',
  'integrations.scheduler.empty.title': 'schedule automatic tasks',
  'integrations.scheduler.empty.subtitle':
    'daily backup, nightly restart, RCON commands, etc.',
  'integrations.scheduler.empty.new': 'new task',
  'integrations.scheduler.alert.createError': 'error: {error}',

  // MapPanel
  'integrations.map.header.title': 'WORLD MAP',
  'integrations.map.header.subtitle':
    '3D world rendering via BlueMap — see live players, biomes, structures',
  'integrations.map.unmanagedNoticeBefore':
    'This container was created outside Chest. Only',
  'integrations.map.unmanagedNoticeAfter':
    'is available (embedded requires Chest to know the exact loader).',
  'integrations.map.chooseMode.title': 'CHOOSE A MODE',
  'integrations.map.chooseMode.supportsBoth':
    'Your loader ({loader}) supports both modes. Embedded is better for live data (players), sidecar is standalone and works offline.',
  'integrations.map.chooseMode.managedNoEmbedded':
    'Loader {loader} does not support embedded (no mods/plugins). Sidecar is the way — it works with any world.',
  'integrations.map.chooseMode.unmanaged':
    'Sidecar reads /data/world directly from the container and renders it in a separate container. Works with any world.',
  'integrations.map.embedded.title': 'EMBEDDED (mod/plugin)',
  'integrations.map.embedded.pro.live': 'live players on the map',
  'integrations.map.embedded.pro.chat': 'live chat (Paper)',
  'integrations.map.embedded.pro.markers': 'POI markers',
  'integrations.map.embedded.con.restart': 'requires a server restart',
  'integrations.map.embedded.con.loaders': 'Paper/Fabric/Forge/etc only',
  'integrations.map.sidecar.title': 'SIDECAR (separate container)',
  'integrations.map.sidecar.pro.anyWorldBefore': 'works with',
  'integrations.map.sidecar.pro.anyWorldAfter': 'and any world',
  'integrations.map.sidecar.pro.noRestart': 'no MC server restart needed',
  'integrations.map.sidecar.pro.isolated': 'isolated container, easy to debug',
  'integrations.map.sidecar.con.noLive': 'no live players',
  'integrations.map.sidecar.con.ram': 'uses +1GB RAM (dedicated sidecar)',
  'integrations.map.auto': 'or leave it on auto (we pick the best for you)',
  'integrations.map.chosenModeBefore': 'chosen mode:',
  'integrations.map.installing': 'installing...',
  'integrations.map.install': 'install BlueMap',
  'integrations.map.installed.title': 'BlueMap installed',
  'integrations.map.installed.sidecar': 'sidecar',
  'integrations.map.installed.embedded': 'embedded',
  'integrations.map.installed.portBefore': 'port',
  'integrations.map.installed.reachableBefore': '✓ embedded below · also available at',
  'integrations.map.installed.notReachable':
    '⚠ server has not responded on port {port} yet.',
  'integrations.map.installed.notReachableSidecar':
    'Sidecar may be downloading the jar or rendering (1-2 min). Refresh in a few seconds.',
  'integrations.map.installed.notReachableEmbedded':
    'It may still be generating the map (first time is slow) or the server was not restarted.',
  'integrations.map.fullscreen': 'fullscreen',
  'integrations.map.wipeCache': 'wipe map cache',
  'integrations.map.uninstall': 'disable',
  'integrations.map.iframeTitle': 'World map',
  'integrations.map.waiting.title': 'waiting for BlueMap to respond...',
  'integrations.map.waiting.sidecar':
    'sidecar may take 1-2 min on first run (jar download + initial render). Auto-refresh in 10s.',
  'integrations.map.waiting.embedded':
    'if the server was just installed, restart it and wait 1-2 min for the initial render',
  'integrations.map.refreshNow': 'refresh now',
  'integrations.map.detectedFiles': 'files detected in the container:',
  'integrations.map.confirm.uninstall': 'Disable BlueMap?',
  'integrations.map.confirm.wipeWarning':
    '\n\n⚠ "wipe" also deletes the ENTIRE rendered map cache (it will re-render from scratch if reinstalled).',
  'integrations.map.error.generic': 'error {status}',
  'integrations.map.error.fail': 'failed',

  // Achievement
  'integrations.achievement.defaultTitle': 'Achievement unlocked!',

  // ConnectCard
  'integrations.connect.title': 'HOW TO CONNECT',
  'integrations.connect.serverNotRunning': 'server must be running to show the address',
  'integrations.connect.version.warning':
    'HEADS UP — version required on the Minecraft client:',
  'integrations.connect.version.hintBefore':
    'in your launcher (Prism/official/etc), pick the profile',
  'integrations.connect.version.profile': 'Release {version}',
  'integrations.connect.version.hintAfter':
    '. a different version = connection drops with "Failed to decode packet".',
  'integrations.connect.version.copyTitle': 'copy version',
  'integrations.connect.version.copyFailTitle': 'copy failed — copy it manually',
  'integrations.connect.direct.title': 'DIRECT (LAN/IPv6)',
  'integrations.connect.copyTitle': 'copy',
  'integrations.connect.copyFailTitle': 'copy failed — select and copy manually',
  'integrations.connect.copyFailMsg':
    'could not copy (clipboard blocked) — select the address above and copy it manually',
  'integrations.connect.direct.hint':
    'paste it into Minecraft → Multiplayer → Add Server',
  'integrations.connect.direct.configureBefore': 'set',
  'integrations.connect.direct.configureAfter': 'in',
  'integrations.connect.direct.settings': 'Settings',
  'integrations.connect.direct.configureSuffix': 'to show the full address',
  'integrations.connect.direct.allocatedPort': 'allocated port:',
  'integrations.connect.public.playit': 'PUBLIC (Playit.gg tunnel)',
  'integrations.connect.public.cloudflare': 'PUBLIC (Cloudflare CNAME)',
  'integrations.connect.public.worksAnywhere': 'works from anywhere in the world',
  'integrations.connect.public.title': 'PUBLIC',
  'integrations.connect.public.noUrl': 'no public URL configured.',
  'integrations.connect.public.exposeNow': 'expose it now in the NETWORK tab →',

  // AuthModePanel
  'integrations.auth.confirm.switch':
    'Switch to "{mode}" mode? The server will be recreated (volume preserved, it will stop and come back in ~30s).',
  'integrations.auth.mode.mojang.label': 'Mojang/Microsoft',
  'integrations.auth.mode.mojang.desc':
    'official auth. only players with a paid account can join.',
  'integrations.auth.mode.mojang.pro1': '+ secure against impersonation',
  'integrations.auth.mode.mojang.pro2': '+ official skins/capes',
  'integrations.auth.mode.mojang.pro3': '+ default',
  'integrations.auth.mode.mojang.con1': '- paid account only',
  'integrations.auth.mode.mojang.con2': '- cracked launchers do not work',
  'integrations.auth.mode.drasl.label': 'Drasl (self-hosted)',
  'integrations.auth.mode.drasl.desc':
    'auth via your own Drasl. compatible with Prism Launcher, FjordLauncher, HMCL.',
  'integrations.auth.mode.drasl.pro1': '+ friends without Microsoft can join',
  'integrations.auth.mode.drasl.pro2': '+ you control the accounts',
  'integrations.auth.mode.drasl.pro3': '+ skins via Drasl',
  'integrations.auth.mode.drasl.con1':
    '- players need an authlib-injector compatible launcher',
  'integrations.auth.mode.offline.label': 'Offline (cracked)',
  'integrations.auth.mode.offline.desc':
    'any username connects without auth. server fully open.',
  'integrations.auth.mode.offline.pro1': '+ any launcher works',
  'integrations.auth.mode.offline.pro2': '+ maximum compatibility',
  'integrations.auth.mode.offline.con1': '- an impostor can join as any nick',
  'integrations.auth.mode.offline.con2': '- no protection at all',
  'integrations.auth.header.title': 'AUTHENTICATION MODE',
  'integrations.auth.header.subtitle':
    'how the server validates who the connecting player is',
  'integrations.auth.saved':
    '✓ mode switched! container recreated. wait ~30s for the server to come back.',
  'integrations.auth.active': '✓ ACTIVE',
  'integrations.auth.recreating': 'recreating...',
  'integrations.auth.activeBtn': 'active',
  'integrations.auth.activate': 'activate',
  'integrations.auth.draslUrlBefore': 'current Drasl URL:',
  'integrations.auth.footerBefore': 'switching mode',
  'integrations.auth.footerRecreate': 'recreates the container',
  'integrations.auth.footerAfter':
    '(volume preserved, world and mods intact). the server is down for ~30 seconds during the switch.',
  'integrations.auth.error.generic': 'error {status}',
  'integrations.auth.error.fail': 'failed',

  // SubusersPanel
  'integrations.subusers.perm.control': 'start / stop / restart',
  'integrations.subusers.perm.console': 'RCON console',
  'integrations.subusers.perm.edit_config': 'edit properties',
  'integrations.subusers.perm.edit_world': 'reset/change seed',
  'integrations.subusers.perm.manage_backups': 'backups (create/restore)',
  'integrations.subusers.perm.manage_files': 'file browser',
  'integrations.subusers.perm.manage_players': 'whitelist / ops / bans',
  'integrations.subusers.perm.manage_scheduled': 'scheduled tasks',
  'integrations.subusers.perm.manage_discord': 'Discord bridge',
  'integrations.subusers.perm.view_logs': 'real-time logs',
  'integrations.subusers.perm.delete': 'delete server (dangerous)',
  'integrations.subusers.list.title': 'SUBUSERS OF THIS SERVER',
  'integrations.subusers.list.subtitle':
    'grant granular access to this specific server. panel admins already have everything automatically.',
  'integrations.subusers.list.empty': 'no subusers yet',
  'integrations.subusers.permCount.one': '{n} permission',
  'integrations.subusers.permCount.other': '{n} permissions',
  'integrations.subusers.cancel': 'cancel',
  'integrations.subusers.save': 'save',
  'integrations.subusers.edit': 'edit',
  'integrations.subusers.add.title': 'ADD SUBUSER',
  'integrations.subusers.add.usernameLabel': 'username (must already exist)',
  'integrations.subusers.add.usernamePlaceholder': 'moderator-1',
  'integrations.subusers.add.permsLabel': 'permissions on this server',
  'integrations.subusers.add.submit': 'add',
  'integrations.subusers.confirm.remove': 'Remove {username} from this server?',
  'integrations.subusers.error.fail': 'failed',
  'integrations.subusers.error.generic': 'error {status}'
};
