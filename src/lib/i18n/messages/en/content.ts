import type { Dict } from '../../types';

export const contentMessages: Dict = {
  // ── ModManager ──────────────────────────────────────────────
  'content.mods.installed.title': 'INSTALLED',
  'content.mods.installed.count.one': '{n} mod',
  'content.mods.installed.count.other': '{n} mods',
  'content.mods.installed.meta': 'MC {mcVersion} · {loader}',
  'content.mods.installed.loading': 'loading...',
  'content.mods.installed.empty': 'no mods installed',
  'content.mods.installed.toggle.enable': 'enable',
  'content.mods.installed.toggle.disable': 'disable',
  'content.mods.installed.remove': 'remove',
  'content.mods.installed.confirmRemove': 'Remove {filename}?',
  'content.mods.installed.removeNetworkError': 'network error while removing the mod',

  'content.mods.search.title': 'SEARCH',
  'content.mods.search.subtitle': 'via Modrinth',
  'content.mods.search.tab.mods': 'mods',
  'content.mods.search.tab.modpacks': 'modpacks',
  'content.mods.search.placeholder.mods': 'sodium, iron chest, lithium...',
  'content.mods.search.placeholder.modpacks': 'all the mods, BMC, vault hunters...',
  'content.mods.search.searching': 'searching...',
  'content.mods.search.minChars': 'type at least 2 letters',
  'content.mods.search.emptyMod': 'no compatible mod found',
  'content.mods.search.emptyModpack': 'no compatible modpack found',
  'content.mods.search.downloads': '{n} downloads',

  'content.mods.installingModpack':
    'installing modpack "{title}" (this may take a while)...',
  'content.mods.modpackInstalled':
    'modpack installed: {installed} mods ({errors} errors). MC {mcVersion} + {loader}. Restart the server.',
  'content.mods.error': 'error: {message}',

  // ── FileManager ─────────────────────────────────────────────
  'content.files.error.generic': 'error {status}',
  'content.files.error.failed': 'failed',
  'content.files.browser.root': 'root (/data)',
  'content.files.browser.back': 'back',
  'content.files.browser.empty': 'empty folder',
  'content.files.editor.noSelection': 'select a file from the list',
  'content.files.editor.noSelectionHint': 'only text files can be edited',
  'content.files.editor.saved': '✓ saved',
  'content.files.editor.save': 'save',
  'content.files.editor.truncated':
    "⚠ large file (truncated at 1MB). saving will overwrite only what's shown here.",
  'content.files.editor.stats': '{chars} chars · {lines} lines',

  // ── BackupsPanel ────────────────────────────────────────────
  'content.backups.create.title': 'CREATE BACKUP',
  'content.backups.create.subtitle': 'snapshot of the world or the full /data',
  'content.backups.create.scopeWorld': 'world only',
  'content.backups.create.scopeFull': 'everything (mods + config + world)',
  'content.backups.create.creating': 'creating (this may take a while...)',
  'content.backups.create.action': 'create backup now',

  'content.backups.list.title': 'SAVED BACKUPS',
  'content.backups.list.count.one': '{n} backup',
  'content.backups.list.count.other': '{n} backups',
  'content.backups.list.empty': 'no backups yet',
  'content.backups.list.download': 'download',
  'content.backups.list.restore': 'restore',
  'content.backups.list.delete': 'delete',
  'content.backups.list.restoringHint':
    "restoring... this can take a few minutes for large backups. don't close the page.",

  'content.backups.confirmDelete': 'Delete backup from {date}?',
  'content.backups.confirmRestore':
    'Restoring this backup will OVERWRITE the current world. Continue?',
  'content.backups.deleteNetworkError': 'network error while deleting the backup',
  'content.backups.restored': 'world restored! server restarting.',
  'content.backups.restoreError': 'error while restoring',
  'content.backups.error': 'error: {message}'
};
