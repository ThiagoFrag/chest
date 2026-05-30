import type { Dict } from '../../types';

export const serverconfigMessages: Dict = {
  // PropertiesEditor — groups
  'serverconfig.props.gameplay.title': 'GAMEPLAY',
  'serverconfig.props.gameplay.desc': 'mechanics and rules',
  'serverconfig.props.world.title': 'WORLD',
  'serverconfig.props.world.desc': 'generation and physics',
  'serverconfig.props.network.title': 'NETWORK',
  'serverconfig.props.network.desc': 'port, performance, distance',
  'serverconfig.props.motd.title': 'MOTD & PLAYERS',
  'serverconfig.props.motd.desc': 'server message and lists',

  // PropertiesEditor — gameplay fields
  'serverconfig.props.field.gamemode': 'game mode',
  'serverconfig.props.field.difficulty': 'difficulty',
  'serverconfig.props.field.hardcore': 'hardcore',
  'serverconfig.props.field.hardcore.help': 'death = banned',
  'serverconfig.props.field.pvp': 'player PvP',
  'serverconfig.props.field.forceGamemode': 'force gamemode on login',
  'serverconfig.props.field.onlineMode': 'Mojang/Microsoft auth',
  'serverconfig.props.field.onlineMode.help': 'turn off to use Drasl',
  'serverconfig.props.field.allowFlight': 'allow flight (creative/mods)',
  'serverconfig.props.field.spawnProtection': 'spawn protection radius',
  'serverconfig.props.field.opPermissionLevel': 'operator level',
  'serverconfig.props.field.opPermissionLevel.help': '4 = all commands',

  // PropertiesEditor — world fields
  'serverconfig.props.field.levelName': 'world name (folder)',
  'serverconfig.props.field.levelSeed': 'seed',
  'serverconfig.props.field.levelSeed.placeholder': 'random if empty',
  'serverconfig.props.field.levelType': 'world type',
  'serverconfig.props.field.allowNether': 'nether enabled',
  'serverconfig.props.field.generateStructures': 'generate villages/dungeons/etc',
  'serverconfig.props.field.spawnMonsters': 'spawn hostile mobs',
  'serverconfig.props.field.spawnAnimals': 'spawn animals',
  'serverconfig.props.field.spawnNpcs': 'spawn villagers',
  'serverconfig.props.field.maxWorldSize': 'max world radius',
  'serverconfig.props.field.maxWorldSize.help': '29999984 = unlimited',

  // PropertiesEditor — network fields
  'serverconfig.props.field.serverPort': 'MC port',
  'serverconfig.props.field.serverPort.help': 'usually 25565',
  'serverconfig.props.field.maxPlayers': 'max players online',
  'serverconfig.props.field.viewDistance': 'view distance (chunks)',
  'serverconfig.props.field.simulationDistance': 'simulation distance',
  'serverconfig.props.field.networkCompressionThreshold': 'compression threshold (bytes)',
  'serverconfig.props.field.networkCompressionThreshold.help': '-1 disables, 256 default',
  'serverconfig.props.field.rateLimit': 'rate limit pkt/s (0 off)',
  'serverconfig.props.field.enableQuery': 'query protocol (GameSpy)',
  'serverconfig.props.field.preventProxyConnections': 'block VPN/proxy',

  // PropertiesEditor — motd/players fields
  'serverconfig.props.field.motd': 'MOTD (list line 1)',
  'serverconfig.props.field.whiteList': 'whitelist enabled',
  'serverconfig.props.field.whiteList.help': 'only allowlisted players can join',
  'serverconfig.props.field.enforceWhitelist': 'kick non-whitelisted',
  'serverconfig.props.field.enforceWhitelist.help': 'applies to players already online',
  'serverconfig.props.field.enforceSecureProfile': 'require signed chat key',
  'serverconfig.props.field.broadcastRconToOps': 'show RCON commands to OPs',
  'serverconfig.props.field.broadcastConsoleToOps': 'show console commands to OPs',
  'serverconfig.props.field.hideOnlinePlayers': 'hide player list',

  // PropertiesEditor — states / footer
  'serverconfig.props.loading': 'reading server.properties...',
  'serverconfig.props.error.load': 'failed to load',
  'serverconfig.props.retry': 'try again',
  'serverconfig.props.changes': '{n} changes',
  'serverconfig.props.modified': 'modified',
  'serverconfig.props.footer.dirty': '{n} property(ies) modified. saving requires a server restart to apply.',
  'serverconfig.props.footer.saved': '✓ saved!',
  'serverconfig.props.footer.restartNeeded': '⚠ restart the server to apply',
  'serverconfig.props.footer.clean': 'no changes',
  'serverconfig.props.undo': 'undo',
  'serverconfig.props.save': 'save',
  'serverconfig.props.saving': 'saving...',

  // WorldPanel — info
  'serverconfig.world.title': 'WORLD',
  'serverconfig.world.subtitle': 'level + seed',
  'serverconfig.world.name': 'name',
  'serverconfig.world.difficulty': 'difficulty',
  'serverconfig.world.gamemode': 'gamemode',
  'serverconfig.world.hardcore': 'hardcore',
  'serverconfig.world.pvp': 'pvp',
  'serverconfig.world.yes': 'yes',
  'serverconfig.world.no': 'no',
  'serverconfig.world.seedLabel': 'current seed / new seed',
  'serverconfig.world.seedPlaceholder': '(random)',
  'serverconfig.world.randomTitle': 'random',
  'serverconfig.world.saveSeed': 'save seed',
  'serverconfig.world.seedHint': 'applies to new chunks. for the whole world, use reset below.',
  'serverconfig.world.seedSaved': 'seed saved! applies on the next chunk generation (or world reset).',

  // WorldPanel — reset
  'serverconfig.world.reset.title': 'RESET WORLD',
  'serverconfig.world.reset.subtitle': 'wipes the world, keeps mods',
  'serverconfig.world.reset.willDelete': 'will delete:',
  'serverconfig.world.reset.preserves': 'keeps:',
  'serverconfig.world.reset.preservesList': 'mods, config, server.properties, whitelist, ops, player data',
  'serverconfig.world.reset.deleteNether': 'delete nether too',
  'serverconfig.world.reset.deleteEnd': 'delete end too',
  'serverconfig.world.reset.useNewSeed': 'use a new seed',
  'serverconfig.world.reset.confirmLabel': 'type RESET to confirm',
  'serverconfig.world.reset.confirm': 'reset world',
  'serverconfig.world.reset.done': 'world reset! server restarting with a fresh world. mods preserved.',
  'serverconfig.world.reset.error': 'error: {message}',

  // VersionPicker
  'serverconfig.version.loading': 'loading versions...',
  'serverconfig.version.placeholder': 'select MC version',
  'serverconfig.version.latest': '(latest)',
  'serverconfig.version.latestTag': 'latest',
  'serverconfig.version.snapshotTag': 'snapshot',
  'serverconfig.version.filterPlaceholder': 'filter (1.21, 1.20.4...)',
  'serverconfig.version.showSnapshots': 'show snapshots',
  'serverconfig.version.empty': 'no version found',
  'serverconfig.version.count': '{shown} of {total} versions',

  // PlayersConfig — tabs
  'serverconfig.players.tab.online': 'online',
  'serverconfig.players.tab.whitelist': 'whitelist',
  'serverconfig.players.tab.ops': 'operators',
  'serverconfig.players.tab.bans': 'banned',
  'serverconfig.players.tab.banIps': 'banned IPs',
  'serverconfig.players.refresh': 'refresh',

  // PlayersConfig — online
  'serverconfig.players.online.title': 'PLAYERS ONLINE',
  'serverconfig.players.online.empty': 'nobody playing right now',
  'serverconfig.players.online.addWhitelist': 'add to whitelist',
  'serverconfig.players.online.giveOp': 'give OP',
  'serverconfig.players.online.ban': 'ban',

  // PlayersConfig — whitelist
  'serverconfig.players.namePlaceholder': 'player name',
  'serverconfig.players.add': 'add',
  'serverconfig.players.whitelist.empty': 'whitelist is empty',
  'serverconfig.players.remove': 'remove',

  // PlayersConfig — ops
  'serverconfig.players.ops.give': 'give OP',
  'serverconfig.players.ops.empty': 'no operators',
  'serverconfig.players.ops.level': 'lv {level}',
  'serverconfig.players.ops.deop': 'deop',

  // PlayersConfig — bans
  'serverconfig.players.bans.reasonPlaceholder': 'reason (optional)',
  'serverconfig.players.bans.ban': 'ban player',
  'serverconfig.players.bans.empty': 'nobody banned',
  'serverconfig.players.bans.expires': 'expires: {date}',
  'serverconfig.players.bans.permanent': 'permanent',
  'serverconfig.players.bans.unban': 'unban',

  // PlayersConfig — ban IPs
  'serverconfig.players.banIps.ipPlaceholder': 'IP (e.g. 192.168.1.50)',
  'serverconfig.players.banIps.ban': 'ban IP',
  'serverconfig.players.banIps.empty': 'no IP banned',

  // NetworkPanel — public access
  'serverconfig.network.access.title': 'PUBLIC ACCESS',
  'serverconfig.network.access.subtitle': 'how players connect',
  'serverconfig.network.access.copyTitle': 'copy',
  'serverconfig.network.access.mode': 'mode:',
  'serverconfig.network.access.connectHint': 'players paste this address in Minecraft to connect.',
  'serverconfig.network.access.none': '⚠ server has no public access configured yet',

  // NetworkPanel — cloudflare
  'serverconfig.network.cf.title': 'EXPOSE VIA CLOUDFLARE',
  'serverconfig.network.cf.subtitle': 'creates a CNAME automatically',
  'serverconfig.network.cf.notConfigured': 'Cloudflare not configured',
  'serverconfig.network.cf.notConfiguredHint': 'Set API token, zone ID and CNAME target in',
  'serverconfig.network.cf.settingsLink': 'Settings',
  'serverconfig.network.cf.toEnable': 'to enable.',
  'serverconfig.network.cf.subdomain': 'subdomain',
  'serverconfig.network.cf.subdomainPlaceholder': 'my-server',
  'serverconfig.network.cf.subdomainHint': 'letters, numbers and hyphens only. creates a CNAME pointing to the configured target.',
  'serverconfig.network.cf.creatingDns': 'creating DNS...',
  'serverconfig.network.cf.updateDns': 'update DNS',
  'serverconfig.network.cf.expose': 'expose publicly',

  // shared errors
  'serverconfig.error.status': 'error {status}',
  'serverconfig.error.fail': 'failed',
  'serverconfig.error.failLoad': 'failed to load'
};
