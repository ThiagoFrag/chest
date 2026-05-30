import type { Dict } from '../../types';

export const serverconfigMessages: Dict = {
  // PropertiesEditor — groups
  'serverconfig.props.gameplay.title': 'GAMEPLAY',
  'serverconfig.props.gameplay.desc': 'mecánica y reglas',
  'serverconfig.props.world.title': 'MUNDO',
  'serverconfig.props.world.desc': 'generación y física',
  'serverconfig.props.network.title': 'RED',
  'serverconfig.props.network.desc': 'puerto, rendimiento, distancia',
  'serverconfig.props.motd.title': 'MOTD Y JUGADORES',
  'serverconfig.props.motd.desc': 'mensaje del servidor y listas',

  // PropertiesEditor — gameplay fields
  'serverconfig.props.field.gamemode': 'modo de juego',
  'serverconfig.props.field.difficulty': 'dificultad',
  'serverconfig.props.field.hardcore': 'hardcore',
  'serverconfig.props.field.hardcore.help': 'muerte = baneo',
  'serverconfig.props.field.pvp': 'PvP entre jugadores',
  'serverconfig.props.field.forceGamemode': 'forzar modo de juego al entrar',
  'serverconfig.props.field.onlineMode': 'auth Mojang/Microsoft',
  'serverconfig.props.field.onlineMode.help': 'apagar para usar Drasl',
  'serverconfig.props.field.allowFlight': 'permitir volar (creativo/mods)',
  'serverconfig.props.field.spawnProtection': 'radio de protección del spawn',
  'serverconfig.props.field.opPermissionLevel': 'nivel de operadores',
  'serverconfig.props.field.opPermissionLevel.help': '4 = todos los comandos',

  // PropertiesEditor — world fields
  'serverconfig.props.field.levelName': 'nombre del mundo (carpeta)',
  'serverconfig.props.field.levelSeed': 'seed',
  'serverconfig.props.field.levelSeed.placeholder': 'aleatorio si está vacío',
  'serverconfig.props.field.levelType': 'tipo de mundo',
  'serverconfig.props.field.allowNether': 'nether activo',
  'serverconfig.props.field.generateStructures': 'generar aldeas/mazmorras/etc',
  'serverconfig.props.field.spawnMonsters': 'spawn de mobs hostiles',
  'serverconfig.props.field.spawnAnimals': 'spawn de animales',
  'serverconfig.props.field.spawnNpcs': 'spawn de aldeanos',
  'serverconfig.props.field.maxWorldSize': 'radio máx del mundo',
  'serverconfig.props.field.maxWorldSize.help': '29999984 = ilimitado',

  // PropertiesEditor — network fields
  'serverconfig.props.field.serverPort': 'puerto MC',
  'serverconfig.props.field.serverPort.help': 'normalmente 25565',
  'serverconfig.props.field.maxPlayers': 'máx jugadores en línea',
  'serverconfig.props.field.viewDistance': 'distancia de vista (chunks)',
  'serverconfig.props.field.simulationDistance': 'distancia de simulación',
  'serverconfig.props.field.networkCompressionThreshold': 'umbral de compresión (bytes)',
  'serverconfig.props.field.networkCompressionThreshold.help': '-1 desactiva, 256 por defecto',
  'serverconfig.props.field.rateLimit': 'límite pkt/s (0 apaga)',
  'serverconfig.props.field.enableQuery': 'protocolo query (GameSpy)',
  'serverconfig.props.field.preventProxyConnections': 'bloquear VPN/proxy',

  // PropertiesEditor — motd/players fields
  'serverconfig.props.field.motd': 'MOTD (línea 1 de la lista)',
  'serverconfig.props.field.whiteList': 'whitelist activa',
  'serverconfig.props.field.whiteList.help': 'solo entran jugadores de la allowlist',
  'serverconfig.props.field.enforceWhitelist': 'expulsar a los no whitelisted',
  'serverconfig.props.field.enforceWhitelist.help': 'aplica a quien ya está en línea',
  'serverconfig.props.field.enforceSecureProfile': 'exigir clave de chat firmada',
  'serverconfig.props.field.broadcastRconToOps': 'mostrar comandos RCON a los OPs',
  'serverconfig.props.field.broadcastConsoleToOps': 'mostrar comandos de consola a los OPs',
  'serverconfig.props.field.hideOnlinePlayers': 'ocultar lista de jugadores',

  // PropertiesEditor — states / footer
  'serverconfig.props.loading': 'leyendo server.properties...',
  'serverconfig.props.error.load': 'error al cargar',
  'serverconfig.props.retry': 'intentar de nuevo',
  'serverconfig.props.changes': '{n} cambios',
  'serverconfig.props.modified': 'modificado',
  'serverconfig.props.footer.dirty': '{n} propiedad(es) modificada(s). guardar requiere reiniciar el servidor para aplicar.',
  'serverconfig.props.footer.saved': '✓ ¡guardado!',
  'serverconfig.props.footer.restartNeeded': '⚠ reinicia el servidor para aplicar',
  'serverconfig.props.footer.clean': 'sin cambios',
  'serverconfig.props.undo': 'deshacer',
  'serverconfig.props.save': 'guardar',
  'serverconfig.props.saving': 'guardando...',

  // WorldPanel — info
  'serverconfig.world.title': 'MUNDO',
  'serverconfig.world.subtitle': 'level + seed',
  'serverconfig.world.name': 'nombre',
  'serverconfig.world.difficulty': 'dificultad',
  'serverconfig.world.gamemode': 'modo de juego',
  'serverconfig.world.hardcore': 'hardcore',
  'serverconfig.world.pvp': 'pvp',
  'serverconfig.world.yes': 'sí',
  'serverconfig.world.no': 'no',
  'serverconfig.world.seedLabel': 'seed actual / nueva seed',
  'serverconfig.world.seedPlaceholder': '(aleatorio)',
  'serverconfig.world.randomTitle': 'aleatorio',
  'serverconfig.world.saveSeed': 'guardar seed',
  'serverconfig.world.seedHint': 'aplica en chunks nuevos. para todo el mundo, usa reset abajo.',
  'serverconfig.world.seedSaved': '¡seed guardada! aplica en la próxima generación de chunks (o reset del mundo).',

  // WorldPanel — reset
  'serverconfig.world.reset.title': 'RESET MUNDO',
  'serverconfig.world.reset.subtitle': 'borra el mundo, conserva los mods',
  'serverconfig.world.reset.willDelete': 'va a borrar:',
  'serverconfig.world.reset.preserves': 'conserva:',
  'serverconfig.world.reset.preservesList': 'mods, config, server.properties, whitelist, ops, player data',
  'serverconfig.world.reset.deleteNether': 'borrar nether también',
  'serverconfig.world.reset.deleteEnd': 'borrar end también',
  'serverconfig.world.reset.useNewSeed': 'usar seed nueva',
  'serverconfig.world.reset.confirmLabel': 'escribe RESET para confirmar',
  'serverconfig.world.reset.confirm': 'resetear mundo',
  'serverconfig.world.reset.done': '¡mundo reseteado! servidor reiniciando con mundo nuevo. mods conservados.',
  'serverconfig.world.reset.error': 'error: {message}',

  // VersionPicker
  'serverconfig.version.loading': 'cargando versiones...',
  'serverconfig.version.placeholder': 'selecciona versión MC',
  'serverconfig.version.latest': '(latest)',
  'serverconfig.version.latestTag': 'latest',
  'serverconfig.version.snapshotTag': 'snapshot',
  'serverconfig.version.filterPlaceholder': 'filtrar (1.21, 1.20.4...)',
  'serverconfig.version.showSnapshots': 'mostrar snapshots',
  'serverconfig.version.empty': 'ninguna versión encontrada',
  'serverconfig.version.count': '{shown} de {total} versiones',

  // PlayersConfig — tabs
  'serverconfig.players.tab.online': 'en línea',
  'serverconfig.players.tab.whitelist': 'whitelist',
  'serverconfig.players.tab.ops': 'operadores',
  'serverconfig.players.tab.bans': 'baneados',
  'serverconfig.players.tab.banIps': 'IPs baneadas',
  'serverconfig.players.refresh': 'refrescar',

  // PlayersConfig — online
  'serverconfig.players.online.title': 'JUGADORES EN LÍNEA',
  'serverconfig.players.online.empty': 'nadie jugando ahora',
  'serverconfig.players.online.addWhitelist': 'añadir a la whitelist',
  'serverconfig.players.online.giveOp': 'dar OP',
  'serverconfig.players.online.ban': 'banear',

  // PlayersConfig — whitelist
  'serverconfig.players.namePlaceholder': 'nombre del jugador',
  'serverconfig.players.add': 'añadir',
  'serverconfig.players.whitelist.empty': 'whitelist vacía',
  'serverconfig.players.remove': 'quitar',

  // PlayersConfig — ops
  'serverconfig.players.ops.give': 'dar OP',
  'serverconfig.players.ops.empty': 'ningún operador',
  'serverconfig.players.ops.level': 'lv {level}',
  'serverconfig.players.ops.deop': 'quitar OP',

  // PlayersConfig — bans
  'serverconfig.players.bans.reasonPlaceholder': 'motivo (opcional)',
  'serverconfig.players.bans.ban': 'banear jugador',
  'serverconfig.players.bans.empty': 'nadie baneado',
  'serverconfig.players.bans.expires': 'expira: {date}',
  'serverconfig.players.bans.permanent': 'permanente',
  'serverconfig.players.bans.unban': 'desbanear',

  // PlayersConfig — ban IPs
  'serverconfig.players.banIps.ipPlaceholder': 'IP (ej: 192.168.1.50)',
  'serverconfig.players.banIps.ban': 'banear IP',
  'serverconfig.players.banIps.empty': 'ninguna IP baneada',

  // NetworkPanel — public access
  'serverconfig.network.access.title': 'ACCESO PÚBLICO',
  'serverconfig.network.access.subtitle': 'cómo conectan los jugadores',
  'serverconfig.network.access.copyTitle': 'copiar',
  'serverconfig.network.access.mode': 'modo:',
  'serverconfig.network.access.connectHint': 'los jugadores pegan esta dirección en Minecraft para conectar.',
  'serverconfig.network.access.none': '⚠ el servidor aún no tiene acceso público configurado',

  // NetworkPanel — cloudflare
  'serverconfig.network.cf.title': 'EXPONER VÍA CLOUDFLARE',
  'serverconfig.network.cf.subtitle': 'crea un CNAME automático',
  'serverconfig.network.cf.notConfigured': 'Cloudflare no configurado',
  'serverconfig.network.cf.notConfiguredHint': 'Configura API token, zone ID y CNAME target en',
  'serverconfig.network.cf.settingsLink': 'Settings',
  'serverconfig.network.cf.toEnable': 'para habilitar.',
  'serverconfig.network.cf.subdomain': 'subdominio',
  'serverconfig.network.cf.subdomainPlaceholder': 'mi-server',
  'serverconfig.network.cf.subdomainHint': 'solo letras, números y guiones. crea un CNAME apuntando al target configurado.',
  'serverconfig.network.cf.creatingDns': 'creando DNS...',
  'serverconfig.network.cf.updateDns': 'actualizar DNS',
  'serverconfig.network.cf.expose': 'exponer públicamente',

  // shared errors
  'serverconfig.error.status': 'error {status}',
  'serverconfig.error.fail': 'fallo',
  'serverconfig.error.failLoad': 'fallo al cargar'
};
