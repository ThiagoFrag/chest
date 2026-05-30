<script lang="ts">
  import { ArrowLeft, Star, Search, Loader2, ExternalLink, Download, Heart } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import { CATEGORIES, CURATED_TEMPLATES } from '$lib/templates';
  import { MODPACK_CATEGORIES, POPULAR_MC_VERSIONS } from '$lib/modrinth/modpacks';
  import { t, formatNumber } from '$lib/i18n';

  interface Hit {
    project_id: string;
    slug: string;
    title: string;
    description: string;
    icon_url: string | null;
    author: string;
    downloads: number;
    follows: number;
    versions: string[];
    loaders: string[];
    categories: string[];
  }

  let search = $state('');
  let loader = $state<'' | 'fabric' | 'forge' | 'neoforge' | 'quilt'>('');
  let mcVersion = $state('');
  let category = $state('');
  let sort = $state<'downloads' | 'follows' | 'newest' | 'updated' | 'relevance'>('downloads');

  let hits = $state<Hit[]>([]);
  let total = $state(0);
  let offset = $state(0);
  let loading = $state(false);
  let loadingMore = $state(false);
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  async function load(reset = true) {
    if (reset) {
      loading = true;
      offset = 0;
    } else {
      loadingMore = true;
    }

    try {
      const params = new URLSearchParams({
        q: search.trim(),
        sort,
        offset: String(reset ? 0 : offset)
      });
      if (loader) params.set('loader', loader);
      if (mcVersion) params.set('mc', mcVersion);
      if (category) params.set('category', category);

      const res = await fetch(`/api/modrinth/modpacks?${params}`);
      const data = await res.json();
      const newHits = data.hits ?? [];

      hits = reset ? newHits : [...hits, ...newHits];
      total = data.total_hits ?? 0;
      offset = reset ? newHits.length : offset + newHits.length;
    } finally {
      loading = false;
      loadingMore = false;
    }
  }

  function debouncedSearch() {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => load(true), 300);
  }

  $effect(() => {
    void search;
    void loader;
    void mcVersion;
    void category;
    void sort;
    debouncedSearch();
  });

  function detectLoader(hit: Hit): string {
    const all = [...(hit.loaders ?? []), ...(hit.categories ?? [])];
    if (all.includes('fabric')) return 'FABRIC';
    if (all.includes('neoforge')) return 'NEOFORGE';
    if (all.includes('forge')) return 'FORGE';
    if (all.includes('quilt')) return 'QUILT';
    return 'VANILLA';
  }

  function detectMcVersion(versions: string[] | undefined): string {
    const v = versions ?? [];
    const release = v.filter((s) => /^\d+\.\d+(\.\d+)?$/.test(s));
    return release[release.length - 1] ?? '1.21.1';
  }

  function fmtNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
  }
</script>

<svelte:head><title>Chest · Templates</title></svelte:head>

<div class="px-8 py-6">
  <a href="/servers" class="text-xs text-white/70 hover:text-mc-yellow inline-flex items-center gap-1 mb-3" style="text-shadow: 2px 2px 0 #3f3f3f;">
    <ArrowLeft class="size-3" /> {t('serverdetail.templates.back')}
  </a>

  <div class="mc-banner mb-6 flex items-center gap-4">
    <MCTexture src="/textures/block/grass_block_top.png" size={48} />
    <div>
      <h1 class="mc-heading text-3xl">{t('serverdetail.templates.heading')}</h1>
      <p class="mt-1 text-xs text-white/80" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {total > 0 ? t('serverdetail.templates.countModrinth', { count: formatNumber(total) }) : t('serverdetail.templates.subtitleEmpty')}
      </p>
    </div>
  </div>

  <section class="mb-8">
    <h2 class="flex items-center gap-2 mb-3 text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
      <Star class="size-4 fill-current" /> {t('serverdetail.templates.featured')}
    </h2>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {#each CURATED_TEMPLATES.filter((t) => t.featured) as t (t.slug)}
        <a href={`/servers/new?template=${t.slug}`} class="mc-card mc-card-hover">
          <div class="flex items-start gap-3">
            <div class="mc-slot shrink-0" style="padding: 4px;">
              <img src={t.iconUrl} alt={t.title} class="size-12" style="image-rendering: pixelated;" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm text-white truncate" style="text-shadow: 2px 2px 0 #3f3f3f;">{t.title}</h3>
              <p class="text-xs mt-0.5" style="color: {CATEGORIES[t.category].color}; text-shadow: 2px 2px 0 #3f3f3f;">
                {t.loader} · {t.memoryGb}GB
              </p>
            </div>
          </div>
        </a>
      {/each}
    </div>
  </section>

  <section class="mc-card mb-4">
    <h2 class="text-sm text-white mb-3" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.templates.explore')}</h2>
    <div class="space-y-3">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40 pointer-events-none" />
        <input
          type="text"
          bind:value={search}
          placeholder={t('serverdetail.templates.searchPlaceholder')}
          class="mc-input pl-10"
        />
      </div>

      <div class="grid gap-2 md:grid-cols-4">
        <select bind:value={loader} class="mc-input text-sm">
          <option value="">{t('serverdetail.templates.allLoaders')}</option>
          <option value="fabric">Fabric</option>
          <option value="forge">Forge</option>
          <option value="neoforge">NeoForge</option>
          <option value="quilt">Quilt</option>
        </select>

        <select bind:value={mcVersion} class="mc-input text-sm">
          <option value="">{t('serverdetail.templates.allVersions')}</option>
          {#each POPULAR_MC_VERSIONS as v}
            <option value={v}>MC {v}</option>
          {/each}
        </select>

        <select bind:value={category} class="mc-input text-sm">
          <option value="">{t('serverdetail.templates.allCategories')}</option>
          {#each MODPACK_CATEGORIES as c}
            <option value={c.id}>{c.label}</option>
          {/each}
        </select>

        <select bind:value={sort} class="mc-input text-sm">
          <option value="downloads">{t('serverdetail.templates.sortDownloads')}</option>
          <option value="follows">{t('serverdetail.templates.sortFollows')}</option>
          <option value="updated">{t('serverdetail.templates.sortUpdated')}</option>
          <option value="newest">{t('serverdetail.templates.sortNewest')}</option>
          <option value="relevance">{t('serverdetail.templates.sortRelevance')}</option>
        </select>
      </div>
    </div>
  </section>

  {#if loading}
    <div class="mc-card text-center py-12">
      <Loader2 class="size-8 animate-spin mx-auto text-white/60" />
      <p class="text-sm text-white/60 mt-3" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.templates.searching')}</p>
    </div>
  {:else if hits.length === 0}
    <div class="mc-card text-center py-12">
      <p class="text-sm text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('serverdetail.templates.empty')}
      </p>
      <p class="text-xs text-white/50 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('serverdetail.templates.emptyHint')}
      </p>
    </div>
  {:else}
    <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each hits as h (h.project_id)}
        {@const detectedLoader = detectLoader(h)}
        {@const detectedMc = detectMcVersion(h.versions)}
        <article class="mc-card mc-card-hover">
          <header class="flex items-start gap-3 mb-3">
            <div class="mc-slot shrink-0" style="padding: 2px;">
              {#if h.icon_url}
                <img src={h.icon_url} alt={h.title} class="size-10" style="image-rendering: pixelated;" />
              {:else}
                <MCTexture src="/textures/item/ender_eye.png" size={32} />
              {/if}
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm text-white truncate" style="text-shadow: 2px 2px 0 #3f3f3f;">{h.title}</h3>
              <p class="text-xs text-diamond mt-0.5 truncate" style="text-shadow: 2px 2px 0 #3f3f3f;">{h.author}</p>
            </div>
          </header>

          <p class="text-xs text-white/70 mb-3 line-clamp-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {h.description}
          </p>

          <div class="flex items-center justify-between text-xs mb-3">
            <span class="text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
              {detectedLoader} · {detectedMc}
            </span>
            <span class="flex items-center gap-2 text-white/50">
              <span class="flex items-center gap-0.5"><Download class="size-3" /> {fmtNumber(h.downloads)}</span>
              <span class="flex items-center gap-0.5"><Heart class="size-3" /> {fmtNumber(h.follows)}</span>
            </span>
          </div>

          <div class="flex gap-2">
            <a
              href="/servers/new?modrinthId={h.project_id}&title={encodeURIComponent(h.title)}&loader={detectedLoader}&mc={detectedMc}&icon={encodeURIComponent(h.icon_url ?? '')}"
              class="mc-btn mc-btn-primary flex-1 text-xs py-1.5"
            >
              {t('serverdetail.templates.createServer')}
            </a>
            <a href="https://modrinth.com/modpack/{h.slug}" target="_blank" rel="noopener" class="mc-btn text-xs px-2 py-1.5" title={t('serverdetail.templates.viewOnModrinth')}>
              <ExternalLink class="size-3" />
            </a>
          </div>
        </article>
      {/each}
    </div>

    {#if hits.length < total}
      <div class="mt-6 text-center">
        <button type="button" onclick={() => load(false)} disabled={loadingMore} class="mc-btn">
          {#if loadingMore}
            <Loader2 class="size-4 animate-spin" /> {t('serverdetail.templates.loadingMore')}
          {:else}
            {t('serverdetail.templates.loadMore', { shown: hits.length, total: formatNumber(total) })}
          {/if}
        </button>
      </div>
    {/if}
  {/if}
</div>
