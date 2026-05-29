<script lang="ts">
  import { Search, Download, Trash2, Power, Loader2, ExternalLink, Package } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';

  interface Mod {
    filename: string;
    enabled: boolean;
    sizeBytes: number;
  }

  interface SearchHit {
    project_id: string;
    slug: string;
    title: string;
    description: string;
    author: string;
    icon_url: string | null;
    downloads: number;
    follows: number;
  }

  let { containerName, mcVersion, loader }: { containerName: string; mcVersion: string; loader: string } = $props();

  let mods = $state<Mod[]>([]);
  let loadingMods = $state(true);
  let kind = $state<'mod' | 'modpack'>('mod');
  let search = $state('');
  let searchResults = $state<SearchHit[]>([]);
  let searching = $state(false);
  let installing = $state<string | null>(null);
  let installingMessage = $state<string | null>(null);
  let pending = $state<string | null>(null);
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  async function loadMods() {
    loadingMods = true;
    try {
      const res = await fetch(`/api/servers/${containerName}/mods`);
      const data = await res.json();
      mods = data.mods ?? [];
    } finally {
      loadingMods = false;
    }
  }

  function doSearch(q: string, type: 'mod' | 'modpack') {
    if (searchTimer) clearTimeout(searchTimer);
    if (q.trim().length < 2) {
      searchResults = [];
      return;
    }
    searchTimer = setTimeout(async () => {
      searching = true;
      try {
        const params = new URLSearchParams({ q: q.trim(), mc: mcVersion, type });
        if (loader !== 'vanilla') params.set('loader', loader);
        const res = await fetch(`/api/modrinth/search?${params}`);
        const data = await res.json();
        searchResults = data.hits ?? [];
      } finally {
        searching = false;
      }
    }, 300);
  }

  $effect(() => {
    doSearch(search, kind);
  });

  async function install(projectId: string, title: string) {
    installing = projectId;
    installingMessage = kind === 'modpack' ? `instalando modpack "${title}" (pode demorar)...` : null;
    try {
      const endpoint = kind === 'modpack'
        ? `/api/servers/${containerName}/modpack`
        : `/api/servers/${containerName}/mods`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`erro: ${err.message ?? res.status}`);
        return;
      }
      if (kind === 'modpack') {
        const data = await res.json();
        alert(`modpack instalado: ${data.installed} mods (${data.errors.length} erros). MC ${data.mcVersion} + ${data.loader}. Reinicie o server.`);
      }
      await loadMods();
    } finally {
      installing = null;
      installingMessage = null;
    }
  }

  async function toggleEnabled(mod: Mod) {
    pending = mod.filename;
    try {
      await fetch(`/api/servers/${containerName}/mods/${encodeURIComponent(mod.filename)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: !mod.enabled })
      });
      mod.enabled = !mod.enabled;
      mods = mods;
    } finally {
      pending = null;
    }
  }

  async function remove(mod: Mod) {
    if (!confirm(`Remover ${mod.filename}?`)) return;
    pending = mod.filename;
    try {
      const res = await fetch(`/api/servers/${containerName}/mods/${encodeURIComponent(mod.filename)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`erro: ${err.message ?? res.status}`);
        return;
      }
      mods = mods.filter((m) => m.filename !== mod.filename);
    } catch {
      alert('erro de rede ao remover o mod');
    } finally {
      pending = null;
    }
  }

  function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }

  loadMods();
</script>

{#if installingMessage}
  <div class="mc-card mb-4 flex items-center gap-3" style="border-color: var(--color-diamond);">
    <Loader2 class="size-5 animate-spin text-diamond" />
    <p class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{installingMessage}</p>
  </div>
{/if}

<div class="grid gap-6 lg:grid-cols-2">
  <!-- Mods instalados -->
  <section class="mc-card">
    <header class="mb-4 flex items-center gap-3">
      <div class="mc-slot"><MCTexture src="/textures/item/iron_pickaxe.png" size={24} /></div>
      <div>
        <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">INSTALADOS</h3>
        <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {mods.length} mod{mods.length === 1 ? '' : 's'} · MC {mcVersion} · {loader}
        </p>
      </div>
    </header>

    {#if loadingMods}
      <div class="text-center py-8 text-white/60">
        <Loader2 class="size-6 animate-spin mx-auto mb-2" />
        carregando...
      </div>
    {:else if mods.length === 0}
      <p class="text-sm text-white/60 text-center py-8" style="text-shadow: 2px 2px 0 #3f3f3f;">
        nenhum mod instalado
      </p>
    {:else}
      <ul class="space-y-1 max-h-[480px] overflow-y-auto pr-2">
        {#each mods as mod (mod.filename)}
          <li class="flex items-center gap-2 px-3 py-2 bg-black/40 border-2 border-black" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
            <button type="button" onclick={() => toggleEnabled(mod)} disabled={pending === mod.filename} title={mod.enabled ? 'desativar' : 'ativar'} class="shrink-0">
              <Power class="size-4 {mod.enabled ? 'text-success' : 'text-white/30'}" />
            </button>
            <div class="flex-1 min-w-0">
              <p class="text-xs truncate {mod.enabled ? 'text-white' : 'text-white/40 line-through'}" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {mod.filename}
              </p>
              <p class="text-xs text-white/40">{formatBytes(mod.sizeBytes)}</p>
            </div>
            <button type="button" onclick={() => remove(mod)} disabled={pending === mod.filename} class="shrink-0 text-destructive hover:text-mc-yellow" title="remover">
              {#if pending === mod.filename}<Loader2 class="size-3.5 animate-spin" />{:else}<Trash2 class="size-3.5" />{/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <!-- Search Modrinth -->
  <section class="mc-card">
    <header class="mb-4 flex items-center gap-3">
      <div class="mc-slot mc-enchanted"><MCTexture src={kind === 'modpack' ? '/textures/item/ender_eye.png' : '/textures/item/experience_bottle.png'} size={24} /></div>
      <div>
        <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">BUSCAR</h3>
        <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">via Modrinth</p>
      </div>
    </header>

    <div class="flex gap-2 mb-3">
      <button
        type="button"
        onclick={() => (kind = 'mod')}
        class="flex-1 px-3 py-2 text-sm flex items-center justify-center gap-2 {kind === 'mod' ? 'bg-primary text-white' : 'bg-secondary text-white'}"
        style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
      >
        <Package class="size-3.5" /> mods
      </button>
      <button
        type="button"
        onclick={() => (kind = 'modpack')}
        class="flex-1 px-3 py-2 text-sm flex items-center justify-center gap-2 {kind === 'modpack' ? 'bg-primary text-white' : 'bg-secondary text-white'}"
        style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
      >
        <Package class="size-3.5" /> modpacks
      </button>
    </div>

    <div class="relative mb-4">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40 pointer-events-none" />
      <input
        type="text"
        bind:value={search}
        placeholder={kind === 'modpack' ? 'all the mods, BMC, vault hunters...' : 'sodium, iron chest, lithium...'}
        class="mc-input pl-10"
      />
    </div>

    {#if searching}
      <div class="text-center py-8 text-white/60">
        <Loader2 class="size-6 animate-spin mx-auto mb-2" />
        buscando...
      </div>
    {:else if search.trim().length < 2}
      <p class="text-sm text-white/50 text-center py-8" style="text-shadow: 2px 2px 0 #3f3f3f;">
        digite ao menos 2 letras
      </p>
    {:else if searchResults.length === 0}
      <p class="text-sm text-white/50 text-center py-8" style="text-shadow: 2px 2px 0 #3f3f3f;">
        nenhum {kind === 'modpack' ? 'modpack' : 'mod'} compatível
      </p>
    {:else}
      <ul class="space-y-2 max-h-[420px] overflow-y-auto pr-2">
        {#each searchResults as hit (hit.project_id)}
          <li class="flex items-start gap-3 px-3 py-3 bg-black/40 border-2 border-black" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
            {#if hit.icon_url}
              <div class="mc-slot shrink-0">
                <img src={hit.icon_url} alt="" class="size-8" style="image-rendering: pixelated;" />
              </div>
            {:else}
              <div class="mc-slot shrink-0"><MCTexture src="/textures/item/iron_ingot.png" size={24} /></div>
            {/if}
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white truncate" style="text-shadow: 2px 2px 0 #3f3f3f;">{hit.title}</p>
              <p class="text-xs text-white/60 line-clamp-2" style="text-shadow: 2px 2px 0 #3f3f3f;">{hit.description}</p>
              <p class="text-xs text-white/40 mt-1">
                <span class="text-diamond">{hit.author}</span> · {hit.downloads.toLocaleString('pt-BR')} downloads
              </p>
            </div>
            <div class="flex flex-col gap-1 shrink-0">
              <button
                type="button"
                onclick={() => install(hit.project_id, hit.title)}
                disabled={installing !== null}
                class="mc-btn mc-btn-primary text-xs py-1 px-2"
              >
                {#if installing === hit.project_id}<Loader2 class="size-3 animate-spin" />{:else}<Download class="size-3" />{/if}
              </button>
              <a
                href="https://modrinth.com/{kind}/{hit.slug}"
                target="_blank"
                rel="noopener"
                class="mc-btn text-xs py-1 px-2"
              >
                <ExternalLink class="size-3" />
              </a>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>
