import type { Dict } from "../../types";

export const contentMessages: Dict = {
  // ── ModManager ──────────────────────────────────────────────
  "content.mods.installed.title": "INSTALADOS",
  "content.mods.installed.count.one": "{n} mod",
  "content.mods.installed.count.other": "{n} mods",
  "content.mods.installed.meta": "MC {mcVersion} · {loader}",
  "content.mods.installed.loading": "carregando...",
  "content.mods.installed.empty": "nenhum mod instalado",
  "content.mods.installed.toggle.enable": "ativar",
  "content.mods.installed.toggle.disable": "desativar",
  "content.mods.installed.remove": "remover",
  "content.mods.installed.confirmRemove": "Remover {filename}?",
  "content.mods.installed.removeNetworkError": "erro de rede ao remover o mod",

  "content.mods.search.title": "BUSCAR",
  "content.mods.search.subtitle": "via Modrinth",
  "content.mods.search.tab.mods": "mods",
  "content.mods.search.tab.modpacks": "modpacks",
  "content.mods.search.placeholder.mods": "sodium, iron chest, lithium...",
  "content.mods.search.placeholder.modpacks": "all the mods, BMC, vault hunters...",
  "content.mods.search.searching": "buscando...",
  "content.mods.search.minChars": "digite ao menos 2 letras",
  "content.mods.search.emptyMod": "nenhum mod compatível",
  "content.mods.search.emptyModpack": "nenhum modpack compatível",
  "content.mods.search.downloads": "{n} downloads",

  "content.mods.installingModpack": "instalando modpack \"{title}\" (pode demorar)...",
  "content.mods.modpackInstalled": "modpack instalado: {installed} mods ({errors} erros). MC {mcVersion} + {loader}. Reinicie o server.",
  "content.mods.error": "erro: {message}",

  // ── FileManager ─────────────────────────────────────────────
  "content.files.error.generic": "erro {status}",
  "content.files.error.failed": "falha",
  "content.files.browser.root": "raiz (/data)",
  "content.files.browser.back": "voltar",
  "content.files.browser.empty": "pasta vazia",
  "content.files.editor.noSelection": "selecione um arquivo na lista",
  "content.files.editor.noSelectionHint": "só arquivos de texto podem ser editados",
  "content.files.editor.saved": "✓ salvo",
  "content.files.editor.save": "salvar",
  "content.files.editor.truncated": "⚠ arquivo grande (truncado em 1MB). salvar vai sobrescrever só o que está aqui.",
  "content.files.editor.stats": "{chars} chars · {lines} linhas",

  // ── BackupsPanel ────────────────────────────────────────────
  "content.backups.create.title": "CRIAR BACKUP",
  "content.backups.create.subtitle": "snapshot do mundo ou /data inteiro",
  "content.backups.create.scopeWorld": "só mundo",
  "content.backups.create.scopeFull": "tudo (mods + config + mundo)",
  "content.backups.create.creating": "criando (pode demorar...)",
  "content.backups.create.action": "criar backup agora",

  "content.backups.list.title": "BACKUPS SALVOS",
  "content.backups.list.count.one": "{n} backup",
  "content.backups.list.count.other": "{n} backups",
  "content.backups.list.empty": "nenhum backup ainda",
  "content.backups.list.download": "download",
  "content.backups.list.restore": "restaurar",
  "content.backups.list.delete": "deletar",
  "content.backups.list.restoringHint": "restaurando... isso pode levar alguns minutos para backups grandes. não feche a página.",

  "content.backups.confirmDelete": "Deletar backup de {date}?",
  "content.backups.confirmRestore": "Restaurar este backup vai SOBRESCREVER o mundo atual. Continuar?",
  "content.backups.deleteNetworkError": "erro de rede ao deletar o backup",
  "content.backups.restored": "mundo restaurado! server reiniciando.",
  "content.backups.restoreError": "erro ao restaurar",
  "content.backups.error": "erro: {message}"
};
