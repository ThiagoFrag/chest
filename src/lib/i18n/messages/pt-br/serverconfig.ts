import type { Dict } from '../../types';

export const serverconfigMessages: Dict = {
  // PropertiesEditor — groups
  'serverconfig.props.gameplay.title': 'GAMEPLAY',
  'serverconfig.props.gameplay.desc': 'mecânica e regras',
  'serverconfig.props.world.title': 'MUNDO',
  'serverconfig.props.world.desc': 'geração e física',
  'serverconfig.props.network.title': 'NETWORK',
  'serverconfig.props.network.desc': 'porta, performance, distância',
  'serverconfig.props.motd.title': 'MOTD & PLAYERS',
  'serverconfig.props.motd.desc': 'mensagem do server e listas',

  // PropertiesEditor — gameplay fields
  'serverconfig.props.field.gamemode': 'modo de jogo',
  'serverconfig.props.field.difficulty': 'dificuldade',
  'serverconfig.props.field.hardcore': 'hardcore',
  'serverconfig.props.field.hardcore.help': 'morte = banido',
  'serverconfig.props.field.pvp': 'PvP entre players',
  'serverconfig.props.field.forceGamemode': 'forçar gamemode no login',
  'serverconfig.props.field.onlineMode': 'auth Mojang/Microsoft',
  'serverconfig.props.field.onlineMode.help': 'desligar pra usar Drasl',
  'serverconfig.props.field.allowFlight': 'permitir voar (creative/mods)',
  'serverconfig.props.field.spawnProtection': 'raio de proteção spawn',
  'serverconfig.props.field.opPermissionLevel': 'level dos operadores',
  'serverconfig.props.field.opPermissionLevel.help': '4 = todos os comandos',

  // PropertiesEditor — world fields
  'serverconfig.props.field.levelName': 'nome do world (pasta)',
  'serverconfig.props.field.levelSeed': 'seed',
  'serverconfig.props.field.levelSeed.placeholder': 'random se vazio',
  'serverconfig.props.field.levelType': 'tipo de mundo',
  'serverconfig.props.field.allowNether': 'nether ativo',
  'serverconfig.props.field.generateStructures': 'gerar vilas/dungeons/etc',
  'serverconfig.props.field.spawnMonsters': 'spawn de mobs hostis',
  'serverconfig.props.field.spawnAnimals': 'spawn de animais',
  'serverconfig.props.field.spawnNpcs': 'spawn de aldeões',
  'serverconfig.props.field.maxWorldSize': 'raio máx do world',
  'serverconfig.props.field.maxWorldSize.help': '29999984 = ilimitado',

  // PropertiesEditor — network fields
  'serverconfig.props.field.serverPort': 'porta MC',
  'serverconfig.props.field.serverPort.help': 'normalmente 25565',
  'serverconfig.props.field.maxPlayers': 'max players online',
  'serverconfig.props.field.viewDistance': 'view distance (chunks)',
  'serverconfig.props.field.simulationDistance': 'simulation distance',
  'serverconfig.props.field.networkCompressionThreshold': 'compression threshold (bytes)',
  'serverconfig.props.field.networkCompressionThreshold.help': '-1 desativa, 256 default',
  'serverconfig.props.field.rateLimit': 'rate limit pkt/s (0 desliga)',
  'serverconfig.props.field.enableQuery': 'protocolo query (GameSpy)',
  'serverconfig.props.field.preventProxyConnections': 'bloquear VPN/proxy',

  // PropertiesEditor — motd/players fields
  'serverconfig.props.field.motd': 'MOTD (linha 1 da lista)',
  'serverconfig.props.field.whiteList': 'whitelist ativa',
  'serverconfig.props.field.whiteList.help': 'só players da allowlist entram',
  'serverconfig.props.field.enforceWhitelist': 'expulsar não-whitelisted',
  'serverconfig.props.field.enforceWhitelist.help': 'aplica a quem já está online',
  'serverconfig.props.field.enforceSecureProfile': 'exigir chave de chat assinada',
  'serverconfig.props.field.broadcastRconToOps': 'mostrar comandos RCON pros OPs',
  'serverconfig.props.field.broadcastConsoleToOps': 'mostrar comandos console pros OPs',
  'serverconfig.props.field.hideOnlinePlayers': 'esconder lista de players',

  // PropertiesEditor — states / footer
  'serverconfig.props.loading': 'lendo server.properties...',
  'serverconfig.props.error.load': 'erro ao carregar',
  'serverconfig.props.retry': 'tentar de novo',
  'serverconfig.props.changes': '{n} mudanças',
  'serverconfig.props.modified': 'modificado',
  'serverconfig.props.footer.dirty': '{n} propriedade(s) modificada(s). salvar exige restart do server pra aplicar.',
  'serverconfig.props.footer.saved': '✓ salvo!',
  'serverconfig.props.footer.restartNeeded': '⚠ reinicie o server pra aplicar',
  'serverconfig.props.footer.clean': 'sem mudanças',
  'serverconfig.props.undo': 'desfazer',
  'serverconfig.props.save': 'salvar',
  'serverconfig.props.saving': 'salvando...',

  // WorldPanel — info
  'serverconfig.world.title': 'MUNDO',
  'serverconfig.world.subtitle': 'level + seed',
  'serverconfig.world.name': 'nome',
  'serverconfig.world.difficulty': 'dificuldade',
  'serverconfig.world.gamemode': 'gamemode',
  'serverconfig.world.hardcore': 'hardcore',
  'serverconfig.world.pvp': 'pvp',
  'serverconfig.world.yes': 'sim',
  'serverconfig.world.no': 'não',
  'serverconfig.world.seedLabel': 'seed atual / nova seed',
  'serverconfig.world.seedPlaceholder': '(aleatório)',
  'serverconfig.world.randomTitle': 'aleatório',
  'serverconfig.world.saveSeed': 'salvar seed',
  'serverconfig.world.seedHint': 'aplica em chunks novos. pra todo o mundo, use reset abaixo.',
  'serverconfig.world.seedSaved': 'seed salva! aplica na próxima geração de chunks (ou reset do mundo).',

  // WorldPanel — reset
  'serverconfig.world.reset.title': 'RESET MUNDO',
  'serverconfig.world.reset.subtitle': 'apaga mundo, preserva mods',
  'serverconfig.world.reset.willDelete': 'vai apagar:',
  'serverconfig.world.reset.preserves': 'preserva:',
  'serverconfig.world.reset.preservesList': 'mods, config, server.properties, whitelist, ops, player data',
  'serverconfig.world.reset.deleteNether': 'apagar nether também',
  'serverconfig.world.reset.deleteEnd': 'apagar end também',
  'serverconfig.world.reset.useNewSeed': 'usar seed nova',
  'serverconfig.world.reset.confirmLabel': 'digite RESET pra confirmar',
  'serverconfig.world.reset.confirm': 'resetar mundo',
  'serverconfig.world.reset.done': 'mundo resetado! server reiniciando com mundo novo. mods preservados.',
  'serverconfig.world.reset.error': 'erro: {message}',

  // VersionPicker
  'serverconfig.version.loading': 'carregando versões...',
  'serverconfig.version.placeholder': 'selecione versão MC',
  'serverconfig.version.latest': '(latest)',
  'serverconfig.version.latestTag': 'latest',
  'serverconfig.version.snapshotTag': 'snapshot',
  'serverconfig.version.filterPlaceholder': 'filtrar (1.21, 1.20.4...)',
  'serverconfig.version.showSnapshots': 'mostrar snapshots',
  'serverconfig.version.empty': 'nenhuma versão encontrada',
  'serverconfig.version.count': '{shown} de {total} versões',

  // PlayersConfig — tabs
  'serverconfig.players.tab.online': 'online',
  'serverconfig.players.tab.whitelist': 'whitelist',
  'serverconfig.players.tab.ops': 'operadores',
  'serverconfig.players.tab.bans': 'banidos',
  'serverconfig.players.tab.banIps': 'IPs banidos',
  'serverconfig.players.refresh': 'refresh',

  // PlayersConfig — online
  'serverconfig.players.online.title': 'PLAYERS ONLINE',
  'serverconfig.players.online.empty': 'ninguém jogando agora',
  'serverconfig.players.online.addWhitelist': 'adicionar à whitelist',
  'serverconfig.players.online.giveOp': 'dar OP',
  'serverconfig.players.online.ban': 'banir',

  // PlayersConfig — whitelist
  'serverconfig.players.namePlaceholder': 'nome do player',
  'serverconfig.players.add': 'adicionar',
  'serverconfig.players.whitelist.empty': 'whitelist vazia',
  'serverconfig.players.remove': 'remover',

  // PlayersConfig — ops
  'serverconfig.players.ops.give': 'dar OP',
  'serverconfig.players.ops.empty': 'nenhum operador',
  'serverconfig.players.ops.level': 'lv {level}',
  'serverconfig.players.ops.deop': 'deop',

  // PlayersConfig — bans
  'serverconfig.players.bans.reasonPlaceholder': 'motivo (opcional)',
  'serverconfig.players.bans.ban': 'banir player',
  'serverconfig.players.bans.empty': 'ninguém banido',
  'serverconfig.players.bans.expires': 'expira: {date}',
  'serverconfig.players.bans.permanent': 'permanente',
  'serverconfig.players.bans.unban': 'desbanir',

  // PlayersConfig — ban IPs
  'serverconfig.players.banIps.ipPlaceholder': 'IP (ex: 192.168.1.50)',
  'serverconfig.players.banIps.ban': 'banir IP',
  'serverconfig.players.banIps.empty': 'nenhum IP banido',

  // NetworkPanel — public access
  'serverconfig.network.access.title': 'ACESSO PÚBLICO',
  'serverconfig.network.access.subtitle': 'como players conectam',
  'serverconfig.network.access.copyTitle': 'copiar',
  'serverconfig.network.access.mode': 'modo:',
  'serverconfig.network.access.connectHint': 'players colam esse endereço no Minecraft pra conectar.',
  'serverconfig.network.access.none': '⚠ server ainda sem acesso público configurado',

  // NetworkPanel — cloudflare
  'serverconfig.network.cf.title': 'EXPOR VIA CLOUDFLARE',
  'serverconfig.network.cf.subtitle': 'cria CNAME automático',
  'serverconfig.network.cf.notConfigured': 'Cloudflare não configurado',
  'serverconfig.network.cf.notConfiguredHint': 'Configure API token, zone ID e CNAME target em',
  'serverconfig.network.cf.settingsLink': 'Settings',
  'serverconfig.network.cf.toEnable': 'pra liberar.',
  'serverconfig.network.cf.subdomain': 'subdomain',
  'serverconfig.network.cf.subdomainPlaceholder': 'meu-server',
  'serverconfig.network.cf.subdomainHint': 'só letras, números e hífen. cria CNAME apontando pro target configurado.',
  'serverconfig.network.cf.creatingDns': 'criando DNS...',
  'serverconfig.network.cf.updateDns': 'atualizar DNS',
  'serverconfig.network.cf.expose': 'expor publicamente',

  // shared errors
  'serverconfig.error.status': 'erro {status}',
  'serverconfig.error.fail': 'falha',
  'serverconfig.error.failLoad': 'falha ao carregar'
};
