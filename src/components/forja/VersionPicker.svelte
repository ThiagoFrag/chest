<script lang="ts">
  import { Search, ChevronDown, Check, Loader2 } from 'lucide-svelte';
  import { onMount } from 'svelte';

  let { value = $bindable('') }: { value?: string } = $props();

  let releases = $state<string[]>([]);
  let snapshots = $state<string[]>([]);
  let latest = $state<string>('');
  let loading = $state(true);

  let open = $state(false);
  let filter = $state('');
  let showSnapshots = $state(false);
  let inputEl: HTMLInputElement | undefined = $state();
  let listEl: HTMLDivElement | undefined = $state();

  async function load() {
    loading = true;
    try {
      const res = await fetch('/api/minecraft/versions');
      if (res.ok) {
        const data = await res.json();
        releases = data.release ?? [];
        snapshots = data.snapshot ?? [];
        latest = data.latest ?? '';
        if (!value && latest) value = latest;
      }
    } finally {
      loading = false;
    }
  }

  const visible = $derived.by(() => {
    const source = showSnapshots ? [...releases, ...snapshots] : releases;
    if (!filter.trim()) return source.slice(0, 200);
    const q = filter.toLowerCase();
    return source.filter((v) => v.toLowerCase().includes(q)).slice(0, 200);
  });

  function pick(v: string) {
    value = v;
    open = false;
    filter = '';
  }

  function toggle() {
    open = !open;
    if (open) {
      setTimeout(() => inputEl?.focus(), 50);
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
    if (e.key === 'Enter' && visible.length > 0) pick(visible[0]);
  }

  function handleClickOutside(e: MouseEvent) {
    if (open && listEl && !listEl.contains(e.target as Node)) {
      open = false;
    }
  }

  onMount(() => {
    load();
  });
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative" bind:this={listEl}>
  <button
    type="button"
    onclick={toggle}
    class="mc-input flex items-center justify-between cursor-pointer text-left"
  >
    <span class="text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
      {#if loading}
        <span class="text-white/50">carregando versões...</span>
      {:else if value}
        {value}
        {#if value === latest}<span class="text-mc-yellow text-xs ml-2">(latest)</span>{/if}
      {:else}
        <span class="text-white/50">selecione versão MC</span>
      {/if}
    </span>
    <ChevronDown class="size-4 text-white/60" />
  </button>

  {#if open}
    <div
      class="absolute z-50 left-0 right-0 mt-1 mc-card max-h-96 flex flex-col"
      style="padding: 0;"
    >
      <div class="p-2 border-b-2 border-black">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40 pointer-events-none" />
          <input
            bind:this={inputEl}
            bind:value={filter}
            onkeydown={onKeyDown}
            type="text"
            placeholder="filtrar (1.21, 1.20.4...)"
            class="mc-input pl-10"
          />
        </div>
        <label class="flex items-center gap-2 text-xs mt-2 cursor-pointer text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
          <input type="checkbox" bind:checked={showSnapshots} />
          mostrar snapshots
        </label>
      </div>

      <div class="overflow-y-auto flex-1">
        {#if loading}
          <div class="text-center py-6 text-white/60">
            <Loader2 class="size-5 animate-spin mx-auto" />
          </div>
        {:else if visible.length === 0}
          <p class="text-center py-6 text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">
            nenhuma versão encontrada
          </p>
        {:else}
          <ul>
            {#each visible as v (v)}
              <li>
                <button
                  type="button"
                  onclick={() => pick(v)}
                  class="w-full text-left px-3 py-1.5 text-sm flex items-center justify-between hover:bg-primary/30 hover:text-mc-yellow {value === v ? 'bg-primary/40 text-white' : 'text-white/80'}"
                  style="text-shadow: 2px 2px 0 #3f3f3f;"
                >
                  <span>
                    {v}
                    {#if v === latest}<span class="text-mc-yellow text-xs ml-2">latest</span>{/if}
                    {#if snapshots.includes(v)}<span class="text-warning text-xs ml-2">snapshot</span>{/if}
                  </span>
                  {#if value === v}<Check class="size-4 text-success" />{/if}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="p-2 border-t-2 border-black text-xs text-white/50 text-center" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {visible.length} de {showSnapshots ? releases.length + snapshots.length : releases.length} versões
      </div>
    </div>
  {/if}
</div>
