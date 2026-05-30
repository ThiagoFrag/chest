<script lang="ts">
  import {
    Folder, FolderOpen, FileText, FileCode, FileJson, File as FileIcon,
    ArrowLeft, Loader2, Save, RefreshCw, AlertTriangle, ChevronRight, Home
  } from 'lucide-svelte';
  import { t } from '$lib/i18n';

  let { containerName }: { containerName: string } = $props();

  interface Entry {
    name: string;
    path: string;
    type: 'file' | 'dir' | 'link';
    size: number;
    modified: string | null;
  }

  let currentPath = $state('/data');
  let entries = $state<Entry[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  let selectedFile = $state<Entry | null>(null);
  let fileContent = $state('');
  let originalContent = $state('');
  let loadingFile = $state(false);
  let savingFile = $state(false);
  let truncated = $state(false);
  let savedFlash = $state(false);

  async function loadDir(path: string) {
    loading = true;
    error = null;
    try {
      const res = await fetch(`/api/servers/${containerName}/files?path=${encodeURIComponent(path)}&mode=list`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? t('content.files.error.generic', { status: res.status }));
      }
      const data = await res.json();
      entries = data.entries ?? [];
      currentPath = data.path ?? path;
      selectedFile = null;
      fileContent = '';
      originalContent = '';
    } catch (e) {
      error = e instanceof Error ? e.message : t('content.files.error.failed');
    } finally {
      loading = false;
    }
  }

  async function openFile(e: Entry) {
    if (e.type !== 'file') return;
    selectedFile = e;
    loadingFile = true;
    error = null;
    truncated = false;
    try {
      const res = await fetch(`/api/servers/${containerName}/files?path=${encodeURIComponent(e.path)}&mode=read`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? t('content.files.error.generic', { status: res.status }));
      }
      const data = await res.json();
      fileContent = data.content ?? '';
      originalContent = fileContent;
      truncated = !!data.truncated;
    } catch (err) {
      error = err instanceof Error ? err.message : t('content.files.error.failed');
      selectedFile = null;
    } finally {
      loadingFile = false;
    }
  }

  async function saveFile() {
    if (!selectedFile) return;
    savingFile = true;
    error = null;
    try {
      const res = await fetch(`/api/servers/${containerName}/files`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: selectedFile.path, content: fileContent })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? t('content.files.error.generic', { status: res.status }));
      }
      originalContent = fileContent;
      savedFlash = true;
      setTimeout(() => (savedFlash = false), 2000);
    } catch (err) {
      error = err instanceof Error ? err.message : t('content.files.error.failed');
    } finally {
      savingFile = false;
    }
  }

  function navigate(e: Entry) {
    if (e.type === 'dir') {
      loadDir(e.path);
    } else if (e.type === 'file') {
      openFile(e);
    }
  }

  function goUp() {
    if (currentPath === '/data') return;
    const parent = currentPath.replace(/\/[^/]+$/, '') || '/data';
    loadDir(parent);
  }

  function goRoot() {
    loadDir('/data');
  }

  function fileIcon(name: string) {
    const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : '';
    if (ext === 'json') return FileJson;
    if (['log', 'txt', 'md'].includes(ext ?? '')) return FileText;
    if (['ts', 'js', 'yml', 'yaml', 'toml', 'properties', 'sh', 'conf'].includes(ext ?? '')) return FileCode;
    return FileIcon;
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function isDirty(): boolean {
    return fileContent !== originalContent;
  }

  function pathSegments() {
    return currentPath.replace(/^\/+/, '').split('/').filter(Boolean);
  }

  loadDir('/data');
</script>

<div class="grid gap-4 lg:grid-cols-[380px_1fr] min-h-[500px]">
  <!-- Browser -->
  <section class="mc-card flex flex-col">
    <header class="mb-3 space-y-2">
      <div class="flex items-center gap-1 flex-wrap text-xs">
        <button type="button" onclick={goRoot} class="p-1 hover:text-mc-yellow" title={t('content.files.browser.root')}>
          <Home class="size-3.5" />
        </button>
        <span class="text-white/40">/data</span>
        {#each pathSegments().slice(1) as seg, i}
          {@const seekPath = '/data/' + pathSegments().slice(1, i + 2).join('/')}
          <ChevronRight class="size-3 text-white/40" />
          <button type="button" onclick={() => loadDir(seekPath)} class="text-white/80 hover:text-mc-yellow truncate max-w-[120px]" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {seg}
          </button>
        {/each}
      </div>

      <div class="flex gap-1">
        <button type="button" onclick={goUp} disabled={currentPath === '/data'} class="mc-btn text-xs flex-1">
          <ArrowLeft class="size-3" /> {t('content.files.browser.back')}
        </button>
        <button type="button" onclick={() => loadDir(currentPath)} disabled={loading} class="mc-btn text-xs">
          {#if loading}<Loader2 class="size-3 animate-spin" />{:else}<RefreshCw class="size-3" />{/if}
        </button>
      </div>
    </header>

    {#if loading}
      <div class="flex-1 flex items-center justify-center">
        <Loader2 class="size-6 animate-spin text-mc-yellow" />
      </div>
    {:else if error && entries.length === 0}
      <div class="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <AlertTriangle class="size-8 text-destructive mx-auto" />
          <p class="text-sm text-destructive mt-2" style="text-shadow: 2px 2px 0 #3f3f3f;">{error}</p>
        </div>
      </div>
    {:else if entries.length === 0}
      <p class="text-sm text-white/50 text-center py-12" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('content.files.browser.empty')}</p>
    {:else}
      <ul class="space-y-0.5 overflow-y-auto flex-1">
        {#each entries as e}
          {@const Icon = e.type === 'dir' ? Folder : fileIcon(e.name)}
          <li>
            <button
              type="button"
              onclick={() => navigate(e)}
              class="w-full text-left px-2 py-1.5 flex items-center gap-2 text-sm {selectedFile?.path === e.path ? 'bg-primary text-white' : 'hover:bg-stone text-white/80'}"
              style="text-shadow: 2px 2px 0 #3f3f3f;"
            >
              <Icon class="size-4 shrink-0 {e.type === 'dir' ? 'text-mc-yellow' : ''}" />
              <span class="flex-1 truncate">{e.name}</span>
              {#if e.type === 'file'}
                <span class="text-[10px] text-white/40">{formatSize(e.size)}</span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <!-- Editor -->
  <section class="mc-card flex flex-col">
    {#if !selectedFile}
      <div class="flex-1 flex items-center justify-center text-center text-white/40">
        <div>
          <FolderOpen class="size-12 mx-auto opacity-50" />
          <p class="text-sm mt-3" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('content.files.editor.noSelection')}</p>
          <p class="text-xs mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('content.files.editor.noSelectionHint')}</p>
        </div>
      </div>
    {:else if loadingFile}
      <div class="flex-1 flex items-center justify-center">
        <Loader2 class="size-6 animate-spin text-mc-yellow" />
      </div>
    {:else}
      <header class="flex items-start justify-between gap-2 mb-3">
        <div class="min-w-0 flex-1">
          <h3 class="text-sm truncate" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {selectedFile.name}
            {#if isDirty()}<span class="text-mc-yellow ml-2">●</span>{/if}
          </h3>
          <p class="text-[10px] text-white/40 truncate font-mono">{selectedFile.path}</p>
        </div>
        <div class="flex items-center gap-2">
          {#if savedFlash}
            <span class="text-xs text-success" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('content.files.editor.saved')}</span>
          {/if}
          <button
            type="button"
            onclick={saveFile}
            disabled={!isDirty() || savingFile}
            class="mc-btn mc-btn-primary text-xs"
          >
            {#if savingFile}<Loader2 class="size-3 animate-spin" />{:else}<Save class="size-3" />{/if}
            {t('content.files.editor.save')}
          </button>
        </div>
      </header>

      {#if truncated}
        <p class="text-xs text-warning mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('content.files.editor.truncated')}
        </p>
      {/if}

      {#if error}
        <p class="text-xs text-destructive mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {error}</p>
      {/if}

      <textarea
        bind:value={fileContent}
        spellcheck="false"
        class="flex-1 bg-black/40 text-white font-mono text-xs p-3 resize-none focus:outline-none"
        style="border: 2px solid #000000; box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1); min-height: 400px;"
      ></textarea>

      <div class="text-[10px] text-white/40 mt-2 flex justify-between" style="text-shadow: 2px 2px 0 #3f3f3f;">
        <span>{t('content.files.editor.stats', { chars: fileContent.length, lines: fileContent.split('\n').length })}</span>
        <span>UTF-8</span>
      </div>
    {/if}
  </section>
</div>
