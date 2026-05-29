<script lang="ts">
  import { goto } from '$app/navigation';
  import { Egg, Search, Tag, ArrowRight } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';

  let { data } = $props();
  let query = $state('');
  let activeCategory = $state<string>('all');

  const categories = ['all', 'vanilla', 'performance', 'modded', 'modpack', 'pvp', 'creative', 'minigames', 'other'];

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return data.eggs.filter((e) => {
      if (activeCategory !== 'all' && e.category !== activeCategory) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.slug.includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.includes(q))
      );
    });
  });

  function useEgg(slug: string) {
    goto(`/servers/new?egg=${slug}`);
  }
</script>

<svelte:head><title>Chest · Eggs</title></svelte:head>

<div class="px-8 py-6">
  <div class="mc-banner mb-6 flex items-center gap-4">
    <Egg class="size-10 text-mc-yellow" />
    <div>
      <h1 class="mc-heading text-3xl">EGGS</h1>
      <p class="mt-1 text-xs text-white/80" style="text-shadow: 2px 2px 0 #3f3f3f;">
        templates declarativos de servers · {data.eggs.length} disponível{data.eggs.length === 1 ? '' : 'is'}
      </p>
    </div>
  </div>

  <section class="mc-card mb-4 space-y-3">
    <div class="flex items-center gap-2">
      <Search class="size-4 text-white/60" />
      <input
        type="text"
        placeholder="buscar por nome, tag, descrição..."
        bind:value={query}
        class="mc-input flex-1"
      />
    </div>
    <div class="flex flex-wrap gap-1">
      {#each categories as cat}
        <button
          type="button"
          onclick={() => (activeCategory = cat)}
          class="px-3 py-1.5 text-xs {activeCategory === cat ? 'bg-primary text-white' : 'bg-secondary text-white/70 hover:bg-stone'}"
          style="border: 2px solid #000000; box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.15), inset -1px -1px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
        >
          {cat}
        </button>
      {/each}
    </div>
  </section>

  {#if filtered.length === 0}
    <div class="mc-card text-center py-16">
      <Egg class="size-12 text-white/30 mx-auto" />
      <p class="text-sm text-white/60 mt-3" style="text-shadow: 2px 2px 0 #3f3f3f;">
        nenhum egg encontrado
      </p>
      <p class="text-xs text-white/40 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
        adicione um arquivo .json em <code class="text-mc-yellow">/eggs/</code> e reinicie o painel
      </p>
    </div>
  {:else}
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each filtered as egg (egg.slug)}
        <article class="mc-card mc-card-hover flex flex-col">
          <header class="flex items-start gap-3 mb-3">
            <div class="mc-slot shrink-0">
              {#if egg.icon}
                <MCTexture src={egg.icon} size={32} alt="" />
              {:else}
                <Egg class="size-6 text-mc-yellow" />
              {/if}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm truncate" style="text-shadow: 2px 2px 0 #3f3f3f;">{egg.name}</h3>
              <p class="text-[10px] text-white/40 font-mono mt-0.5">{egg.slug} · v{egg.version}</p>
            </div>
          </header>

          <p class="text-xs text-white/70 flex-1 mb-3" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {egg.description || 'sem descrição'}
          </p>

          <div class="flex items-center gap-2 text-[10px] text-white/50 mb-3" style="text-shadow: 2px 2px 0 #3f3f3f;">
            <span class="px-1.5 py-0.5 bg-black/40 border border-black">{egg.loader}</span>
            <span class="text-diamond">MC {egg.mcVersion}</span>
            <span>·</span>
            <span>{egg.category}</span>
          </div>

          {#if egg.tags.length > 0}
            <div class="flex flex-wrap gap-1 mb-3">
              {#each egg.tags.slice(0, 4) as t}
                <span class="text-[10px] text-mc-yellow inline-flex items-center gap-0.5" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  <Tag class="size-2.5" />{t}
                </span>
              {/each}
            </div>
          {/if}

          <button
            type="button"
            onclick={() => useEgg(egg.slug)}
            class="mc-btn mc-btn-primary w-full text-xs"
          >
            usar este egg <ArrowRight class="size-3" />
          </button>
        </article>
      {/each}
    </div>
  {/if}

  <div class="mt-8 mc-card border-l-4 border-l-mc-yellow">
    <h3 class="text-sm mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">QUER CONTRIBUIR COM UM EGG?</h3>
    <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
      crie um arquivo JSON em <code class="text-mc-yellow">/eggs/seu-egg.json</code> seguindo o schema em
      <code class="text-mc-yellow">src/lib/eggs/types.ts</code>. Reinicie o painel ou chame
      <code class="text-mc-yellow">GET /api/eggs?refresh=1</code> pra recarregar.
    </p>
  </div>
</div>
