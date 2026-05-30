<script lang="ts">
  import {
    Map as MapIcon, Loader2, AlertCircle, Check, ExternalLink,
    Download, RefreshCw, Trash2, Maximize2, Box, Container
  } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import { t } from '$lib/i18n';

  let { containerName, loader, mcHostAddress, managed = true }: {
    containerName: string;
    loader: string;
    mcHostAddress: string | null;
    managed?: boolean;
  } = $props();

  type MapType = 'bluemap' | 'dynmap' | 'squaremap' | 'pl3xmap';
  type MapMode = 'embedded' | 'sidecar';

  interface MapStatus {
    installed: boolean;
    type: MapType | null;
    hostPort: number | null;
    reachable: boolean;
    detectedFiles: string[];
    mode: MapMode | null;
    sidecarState?: string | null;
  }

  let status = $state<MapStatus | null>(null);
  let loading = $state(true);
  let busy = $state<'install' | 'uninstall' | 'refresh' | null>(null);
  let error = $state<string | null>(null);
  let message = $state<string | null>(null);
  let chosenMode = $state<'auto' | 'embedded' | 'sidecar'>('auto');

  $effect(() => {
    if (!managed && chosenMode === 'embedded') chosenMode = 'sidecar';
  });

  $effect(() => {
    if (!status?.installed || status?.reachable) return;
    const id = setInterval(() => {
      void load();
    }, 10000);
    return () => clearInterval(id);
  });

  let wipeOnDelete = $state(false);

  const EMBEDDED_SUPPORTED = ['PAPER', 'PURPUR', 'SPIGOT', 'FABRIC', 'FORGE', 'NEOFORGE', 'QUILT'];
  const supportsEmbedded = $derived(managed && EMBEDDED_SUPPORTED.includes(loader));

  function formatHost(h: string | null): string | null {
    if (!h) return null;
    return h.includes(':') && !h.startsWith('[') ? `[${h}]` : h;
  }

  const externalMapUrl = $derived.by(() => {
    if (!status?.hostPort || !mcHostAddress) return null;
    const host = formatHost(mcHostAddress);
    return `http://${host}:${status.hostPort}/`;
  });

  // Use the in-panel proxy (same-origin HTTPS) for the iframe to avoid
  // mixed-content blocking. Cache-bust on each status refresh so the iframe
  // reloads when the user clicks refresh.
  // Force iframe to reload whenever the user clicks refresh by appending a
  // cache-bust query. Without this, browser may keep showing a previously-failed
  // load even after the sidecar has come up.
  let iframeNonce = $state(Date.now());

  const proxiedMapUrl = $derived.by(() => {
    if (!status?.installed || !status?.hostPort) return null;
    // index.html avoids SvelteKit's trailing-slash normalization on bare /proxy/
    return `/api/servers/${containerName}/map/proxy/index.html?v=${iframeNonce}`;
  });

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch(`/api/servers/${containerName}/map`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? t('integrations.map.error.generic', { status: res.status }));
      }
      status = await res.json();
      iframeNonce = Date.now();
    } catch (e) {
      error = e instanceof Error ? e.message : t('integrations.map.error.fail');
    } finally {
      loading = false;
    }
  }

  async function install() {
    busy = 'install';
    error = null;
    message = null;
    try {
      const res = await fetch(`/api/servers/${containerName}/map`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: chosenMode })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? t('integrations.map.error.generic', { status: res.status }));
      }
      const data = await res.json();
      message = data.message;
      await load();
    } catch (e) {
      error = e instanceof Error ? e.message : t('integrations.map.error.fail');
    } finally {
      busy = null;
    }
  }

  async function uninstall() {
    const wipeMsg = wipeOnDelete ? t('integrations.map.confirm.wipeWarning') : '';
    if (!confirm(t('integrations.map.confirm.uninstall') + wipeMsg)) return;
    busy = 'uninstall';
    error = null;
    try {
      const qs = wipeOnDelete ? '?wipe=1' : '';
      const res = await fetch(`/api/servers/${containerName}/map${qs}`, { method: 'DELETE' });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? t('integrations.map.error.generic', { status: res.status }));
      }
      const data = await res.json();
      message = data.message;
      wipeOnDelete = false;
      await load();
    } catch (e) {
      error = e instanceof Error ? e.message : t('integrations.map.error.fail');
    } finally {
      busy = null;
    }
  }

  load();
</script>

<div class="space-y-4">
  <header class="mc-card">
    <div class="flex items-center gap-3">
      <div class="mc-slot">
        <MCTexture src="/textures/item/ender_eye.png" size={24} />
      </div>
      <div class="flex-1">
        <h2 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.map.header.title')}</h2>
        <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('integrations.map.header.subtitle')}
        </p>
      </div>
      <button type="button" onclick={load} disabled={loading} class="mc-btn text-xs">
        {#if loading}<Loader2 class="size-3 animate-spin" />{:else}<RefreshCw class="size-3" />{/if}
      </button>
    </div>
  </header>

  {#if message}
    <div class="mc-card border-l-4 border-l-success">
      <p class="text-sm text-success" style="text-shadow: 2px 2px 0 #3f3f3f;">✓ {message}</p>
    </div>
  {/if}

  {#if error}
    <div class="mc-card border-l-4 border-l-destructive">
      <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {error}</p>
    </div>
  {/if}

  {#if loading && !status}
    <div class="mc-card text-center py-12">
      <Loader2 class="size-8 animate-spin mx-auto text-mc-yellow" />
    </div>
  {:else if !status?.installed}
    <!-- Picker de modo -->
    <div class="mc-card space-y-4">
      {#if !managed}
        <div class="p-3 bg-mc-yellow/10 border-2 border-mc-yellow">
          <p class="text-xs text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
            ℹ {t('integrations.map.unmanagedNoticeBefore')} <strong>sidecar</strong> {t('integrations.map.unmanagedNoticeAfter')}
          </p>
        </div>
      {/if}

      <div>
        <h3 class="text-sm mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.map.chooseMode.title')}</h3>
        <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {#if supportsEmbedded}
            {t('integrations.map.chooseMode.supportsBoth', { loader })}
          {:else if managed}
            {t('integrations.map.chooseMode.managedNoEmbedded', { loader })}
          {:else}
            {t('integrations.map.chooseMode.unmanaged')}
          {/if}
        </p>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onclick={() => (chosenMode = 'embedded')}
          disabled={!supportsEmbedded}
          class="text-left p-3 border-2 {chosenMode === 'embedded' ? 'border-success bg-success/10' : 'border-black bg-black/40'} {!supportsEmbedded ? 'opacity-40 cursor-not-allowed' : ''}"
          style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);"
        >
          <div class="flex items-center gap-2 mb-1">
            <Box class="size-4 text-mc-yellow" />
            <span class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.map.embedded.title')}</span>
          </div>
          <ul class="text-[10px] text-white/70 space-y-0.5" style="text-shadow: 2px 2px 0 #3f3f3f;">
            <li>✓ {t('integrations.map.embedded.pro.live')}</li>
            <li>✓ {t('integrations.map.embedded.pro.chat')}</li>
            <li>✓ {t('integrations.map.embedded.pro.markers')}</li>
            <li>× {t('integrations.map.embedded.con.restart')}</li>
            <li>× {t('integrations.map.embedded.con.loaders')}</li>
          </ul>
        </button>

        <button
          type="button"
          onclick={() => (chosenMode = 'sidecar')}
          class="text-left p-3 border-2 {chosenMode === 'sidecar' ? 'border-success bg-success/10' : 'border-black bg-black/40'}"
          style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);"
        >
          <div class="flex items-center gap-2 mb-1">
            <Container class="size-4 text-mc-yellow" />
            <span class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.map.sidecar.title')}</span>
          </div>
          <ul class="text-[10px] text-white/70 space-y-0.5" style="text-shadow: 2px 2px 0 #3f3f3f;">
            <li>✓ {t('integrations.map.sidecar.pro.anyWorldBefore')} <strong>VANILLA</strong> {t('integrations.map.sidecar.pro.anyWorldAfter')}</li>
            <li>✓ {t('integrations.map.sidecar.pro.noRestart')}</li>
            <li>✓ {t('integrations.map.sidecar.pro.isolated')}</li>
            <li>× {t('integrations.map.sidecar.con.noLive')}</li>
            <li>× {t('integrations.map.sidecar.con.ram')}</li>
          </ul>
        </button>
      </div>

      <button
        type="button"
        onclick={() => (chosenMode = 'auto')}
        class="text-xs {chosenMode === 'auto' ? 'text-mc-yellow' : 'text-white/50 hover:text-mc-yellow'}"
        style="text-shadow: 2px 2px 0 #3f3f3f;"
      >
        {t('integrations.map.auto')}
      </button>

      <div class="border-t-2 border-black pt-4">
        <p class="text-xs text-white/70 mb-3" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('integrations.map.chosenModeBefore')} <strong class="text-mc-yellow">{chosenMode}</strong>
          {#if chosenMode === 'auto'}
            (→ {supportsEmbedded ? 'embedded' : 'sidecar'})
          {/if}
        </p>
        <button
          type="button"
          onclick={install}
          disabled={busy === 'install'}
          class="mc-btn mc-btn-primary w-full"
        >
          {#if busy === 'install'}
            <Loader2 class="size-4 animate-spin" /> {t('integrations.map.installing')}
          {:else}
            <Download class="size-4" /> {t('integrations.map.install')}
          {/if}
        </button>
      </div>
    </div>
  {:else}
    <!-- Mapa instalado -->
    <div class="grid gap-3 md:grid-cols-3">
      <div class="mc-card md:col-span-2">
        <div class="flex items-center gap-2 mb-2">
          <Check class="size-4 text-success" />
          <p class="text-sm text-success" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.map.installed.title')}
            {#if status.mode === 'sidecar'}
              <span class="inline-flex items-center gap-1 ml-2 text-mc-yellow text-xs">
                <Container class="size-3" /> {t('integrations.map.installed.sidecar')} {status.sidecarState ? `(${status.sidecarState})` : ''}
              </span>
            {:else if status.mode === 'embedded'}
              <span class="inline-flex items-center gap-1 ml-2 text-mc-yellow text-xs">
                <Box class="size-3" /> {t('integrations.map.installed.embedded')}
              </span>
            {/if}
            · {t('integrations.map.installed.portBefore')} <code class="text-diamond">{status.hostPort}</code>
          </p>
        </div>
        {#if status.reachable}
          <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.map.installed.reachableBefore')}
            {#if externalMapUrl}
              <a href={externalMapUrl} target="_blank" rel="noopener" class="text-mc-yellow underline">{externalMapUrl}</a>
            {/if}
          </p>
        {:else}
          <p class="text-xs text-warning" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.map.installed.notReachable', { port: status.hostPort ?? '' })}
            {#if status.mode === 'sidecar'}
              {t('integrations.map.installed.notReachableSidecar')}
            {:else}
              {t('integrations.map.installed.notReachableEmbedded')}
            {/if}
          </p>
        {/if}
      </div>
      <div class="mc-card flex flex-col gap-2">
        {#if externalMapUrl}
          <a
            href={externalMapUrl}
            target="_blank"
            rel="noopener"
            class="mc-btn mc-btn-primary w-full text-xs inline-flex items-center justify-center gap-1"
          >
            <Maximize2 class="size-3" /> {t('integrations.map.fullscreen')}
            <ExternalLink class="size-3" />
          </a>
        {/if}
        <label class="text-[10px] text-white/60 inline-flex items-center gap-1.5 cursor-pointer" style="text-shadow: 2px 2px 0 #3f3f3f;">
          <input type="checkbox" bind:checked={wipeOnDelete} class="size-3" />
          {t('integrations.map.wipeCache')}
        </label>
        <button type="button" onclick={uninstall} disabled={busy === 'uninstall'} class="mc-btn mc-btn-destructive w-full text-xs">
          {#if busy === 'uninstall'}<Loader2 class="size-3 animate-spin" />{:else}<Trash2 class="size-3" />{/if}
          {t('integrations.map.uninstall')}
        </button>
      </div>
    </div>

    {#if proxiedMapUrl && status.reachable}
      <div class="mc-card p-0 overflow-hidden">
        <iframe
          src={proxiedMapUrl}
          title={t('integrations.map.iframeTitle')}
          class="w-full h-[600px] block"
          style="border: 0;"
          referrerpolicy="no-referrer"
          allow="fullscreen"
        ></iframe>
      </div>
    {:else if proxiedMapUrl}
      <div class="mc-card text-center py-12">
        <MapIcon class="size-12 text-white/30 mx-auto animate-pulse" />
        <p class="text-sm text-white/60 mt-3" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('integrations.map.waiting.title')}
        </p>
        <p class="text-xs text-white/40 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {#if status.mode === 'sidecar'}
            {t('integrations.map.waiting.sidecar')}
          {:else}
            {t('integrations.map.waiting.embedded')}
          {/if}
        </p>
        <button type="button" onclick={load} class="mc-btn text-xs mt-3">{t('integrations.map.refreshNow')}</button>
      </div>
    {/if}

    {#if status.detectedFiles.length > 0}
      <div class="mc-card">
        <p class="text-xs text-white/60 mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('integrations.map.detectedFiles')}
        </p>
        <ul class="space-y-1 text-[10px] font-mono text-white/50">
          {#each status.detectedFiles as f}
            <li>/data/{f}</li>
          {/each}
        </ul>
      </div>
    {/if}
  {/if}
</div>
