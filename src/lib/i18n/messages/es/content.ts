import type { Dict } from '../../types';

export const contentMessages: Dict = {
  // ── ModManager ──────────────────────────────────────────────
  'content.mods.installed.title': 'INSTALADOS',
  'content.mods.installed.count.one': '{n} mod',
  'content.mods.installed.count.other': '{n} mods',
  'content.mods.installed.meta': 'MC {mcVersion} · {loader}',
  'content.mods.installed.loading': 'cargando...',
  'content.mods.installed.empty': 'ningún mod instalado',
  'content.mods.installed.toggle.enable': 'activar',
  'content.mods.installed.toggle.disable': 'desactivar',
  'content.mods.installed.remove': 'eliminar',
  'content.mods.installed.confirmRemove': '¿Eliminar {filename}?',
  'content.mods.installed.removeNetworkError': 'error de red al eliminar el mod',

  'content.mods.search.title': 'BUSCAR',
  'content.mods.search.subtitle': 'vía Modrinth',
  'content.mods.search.tab.mods': 'mods',
  'content.mods.search.tab.modpacks': 'modpacks',
  'content.mods.search.placeholder.mods': 'sodium, iron chest, lithium...',
  'content.mods.search.placeholder.modpacks': 'all the mods, BMC, vault hunters...',
  'content.mods.search.searching': 'buscando...',
  'content.mods.search.minChars': 'escribe al menos 2 letras',
  'content.mods.search.emptyMod': 'ningún mod compatible',
  'content.mods.search.emptyModpack': 'ningún modpack compatible',
  'content.mods.search.downloads': '{n} descargas',

  'content.mods.installingModpack': 'instalando modpack "{title}" (puede tardar)...',
  'content.mods.modpackInstalled':
    'modpack instalado: {installed} mods ({errors} errores). MC {mcVersion} + {loader}. Reinicia el servidor.',
  'content.mods.error': 'error: {message}',

  // ── FileManager ─────────────────────────────────────────────
  'content.files.error.generic': 'error {status}',
  'content.files.error.failed': 'fallo',
  'content.files.browser.root': 'raíz (/data)',
  'content.files.browser.back': 'volver',
  'content.files.browser.empty': 'carpeta vacía',
  'content.files.editor.noSelection': 'selecciona un archivo de la lista',
  'content.files.editor.noSelectionHint': 'solo se pueden editar archivos de texto',
  'content.files.editor.saved': '✓ guardado',
  'content.files.editor.save': 'guardar',
  'content.files.editor.truncated':
    '⚠ archivo grande (truncado en 1MB). guardar sobrescribirá solo lo que se ve aquí.',
  'content.files.editor.stats': '{chars} chars · {lines} líneas',

  // ── BackupsPanel ────────────────────────────────────────────
  'content.backups.create.title': 'CREAR BACKUP',
  'content.backups.create.subtitle': 'snapshot del mundo o de /data completo',
  'content.backups.create.scopeWorld': 'solo mundo',
  'content.backups.create.scopeFull': 'todo (mods + config + mundo)',
  'content.backups.create.creating': 'creando (puede tardar...)',
  'content.backups.create.action': 'crear backup ahora',

  'content.backups.list.title': 'BACKUPS GUARDADOS',
  'content.backups.list.count.one': '{n} backup',
  'content.backups.list.count.other': '{n} backups',
  'content.backups.list.empty': 'ningún backup todavía',
  'content.backups.list.download': 'descargar',
  'content.backups.list.restore': 'restaurar',
  'content.backups.list.delete': 'eliminar',
  'content.backups.list.restoringHint':
    'restaurando... esto puede tardar unos minutos para backups grandes. no cierres la página.',

  'content.backups.confirmDelete': '¿Eliminar el backup del {date}?',
  'content.backups.confirmRestore':
    'Restaurar este backup SOBRESCRIBIRÁ el mundo actual. ¿Continuar?',
  'content.backups.deleteNetworkError': 'error de red al eliminar el backup',
  'content.backups.restored': '¡mundo restaurado! el servidor se está reiniciando.',
  'content.backups.restoreError': 'error al restaurar',
  'content.backups.error': 'error: {message}'
};
