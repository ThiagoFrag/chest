<script lang="ts">
  import { Loader2, UserPlus, UserX, Shield, Ban, RefreshCw, Plus, Crown } from 'lucide-svelte';

  let { containerName, onlinePlayers = [] }: {
    containerName: string;
    onlinePlayers?: string[];
  } = $props();

  type ListKey = 'online' | 'whitelist' | 'ops' | 'bans' | 'banIps';
  let activeTab = $state<ListKey>('online');

  interface WhitelistEntry { uuid?: string; name: string }
  interface OpEntry { uuid?: string; name: string; level: number }
  interface BanEntry { uuid?: string; name?: string; ip?: string; reason?: string; expires?: string; source?: string }

  let whitelist = $state<WhitelistEntry[]>([]);
  let ops = $state<OpEntry[]>([]);
  let bans = $state<BanEntry[]>([]);
  let banIps = $state<BanEntry[]>([]);

  let loading = $state(true);
  let mutating = $state<string | null>(null);
  let error = $state<string | null>(null);

  let addInput = $state('');
  let addReason = $state('');
  let addIp = $state('');

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch(`/api/servers/${containerName}/players-config`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? `erro ${res.status}`);
      }
      const d = await res.json();
      whitelist = d.whitelist ?? [];
      ops = d.ops ?? [];
      bans = d.bans ?? [];
      banIps = d.banIps ?? [];
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha';
    } finally {
      loading = false;
    }
  }

  async function mutate(body: Record<string, unknown>, key: string) {
    mutating = key;
    error = null;
    try {
      const res = await fetch(`/api/servers/${containerName}/players-config`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? `erro ${res.status}`);
      }
      await load();
      addInput = '';
      addReason = '';
      addIp = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha';
    } finally {
      mutating = null;
    }
  }

  function avatar(name: string): string {
    return `https://mc-heads.net/avatar/${encodeURIComponent(name)}/40/nohelm`;
  }

  load();

  const tabs: Array<{ id: ListKey; label: string; icon: typeof UserPlus; count: () => number }> = [
    { id: 'online', label: 'online', icon: UserPlus, count: () => onlinePlayers.length },
    { id: 'whitelist', label: 'whitelist', icon: Shield, count: () => whitelist.length },
    { id: 'ops', label: 'operadores', icon: Crown, count: () => ops.length },
    { id: 'bans', label: 'banidos', icon: Ban, count: () => bans.length },
    { id: 'banIps', label: 'IPs banidos', icon: UserX, count: () => banIps.length }
  ];
</script>

<div class="space-y-4">
  <!-- Tabs -->
  <nav class="flex flex-wrap gap-1">
    {#each tabs as t}
      <button
        type="button"
        onclick={() => (activeTab = t.id)}
        class="px-3 py-2 text-xs flex items-center gap-2 {activeTab === t.id ? 'bg-primary text-white' : 'bg-secondary text-white/70 hover:bg-stone'}"
        style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
      >
        <t.icon class="size-3.5" />
        {t.label}
        <span class="bg-black/40 px-1.5 py-0.5 text-[10px]">{t.count()}</span>
      </button>
    {/each}
    <button type="button" onclick={load} disabled={loading} class="mc-btn text-xs ml-auto">
      {#if loading}<Loader2 class="size-3 animate-spin" />{:else}<RefreshCw class="size-3" />{/if}
      refresh
    </button>
  </nav>

  {#if error}
    <div class="mc-card border-l-4 border-destructive p-3">
      <p class="text-xs text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {error}</p>
    </div>
  {/if}

  <!-- Conteúdo de cada tab -->
  {#if activeTab === 'online'}
    <div class="mc-card">
      <h3 class="text-lg mb-3" style="text-shadow: 2px 2px 0 #3f3f3f;">PLAYERS ONLINE</h3>
      {#if onlinePlayers.length === 0}
        <p class="text-sm text-white/60 text-center py-6" style="text-shadow: 2px 2px 0 #3f3f3f;">
          ninguém jogando agora
        </p>
      {:else}
        <ul class="space-y-2">
          {#each onlinePlayers as p}
            <li class="flex items-center gap-3 bg-black/40 px-3 py-2" style="box-shadow: inset 1px 1px 0 0 rgba(0,0,0,0.4); border: 2px solid #000000;">
              <img src={avatar(p)} alt={p} class="size-10" style="image-rendering: pixelated;" />
              <span class="flex-1 text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{p}</span>
              <button
                type="button"
                onclick={() => mutate({ list: 'whitelist', action: 'add', player: p }, `wl-${p}`)}
                disabled={mutating === `wl-${p}`}
                class="mc-btn text-xs"
                title="adicionar à whitelist"
              >
                <Shield class="size-3" />
              </button>
              <button
                type="button"
                onclick={() => mutate({ list: 'ops', action: 'add', player: p }, `op-${p}`)}
                disabled={mutating === `op-${p}`}
                class="mc-btn text-xs"
                title="dar OP"
              >
                <Crown class="size-3" />
              </button>
              <button
                type="button"
                onclick={() => mutate({ list: 'bans', action: 'add', player: p, reason: 'banned by Chest' }, `ban-${p}`)}
                disabled={mutating === `ban-${p}`}
                class="mc-btn mc-btn-destructive text-xs"
                title="banir"
              >
                <Ban class="size-3" />
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {:else if activeTab === 'whitelist'}
    <div class="mc-card">
      <div class="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="nome do player"
          bind:value={addInput}
          onkeydown={(e) => { if (e.key === 'Enter' && addInput.trim()) mutate({ list: 'whitelist', action: 'add', player: addInput.trim() }, 'wl-add'); }}
          class="mc-input flex-1"
        />
        <button
          type="button"
          onclick={() => mutate({ list: 'whitelist', action: 'add', player: addInput.trim() }, 'wl-add')}
          disabled={!addInput.trim() || mutating === 'wl-add'}
          class="mc-btn mc-btn-primary"
        >
          {#if mutating === 'wl-add'}<Loader2 class="size-4 animate-spin" />{:else}<Plus class="size-4" />{/if}
          adicionar
        </button>
      </div>
      {#if whitelist.length === 0}
        <p class="text-sm text-white/60 text-center py-6" style="text-shadow: 2px 2px 0 #3f3f3f;">whitelist vazia</p>
      {:else}
        <ul class="space-y-2">
          {#each whitelist as e}
            <li class="flex items-center gap-3 bg-black/40 px-3 py-2" style="box-shadow: inset 1px 1px 0 0 rgba(0,0,0,0.4); border: 2px solid #000000;">
              <img src={avatar(e.name)} alt={e.name} class="size-10" style="image-rendering: pixelated;" />
              <div class="flex-1">
                <p class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{e.name}</p>
                {#if e.uuid}<p class="text-[10px] text-white/40 font-mono">{e.uuid}</p>{/if}
              </div>
              <button
                type="button"
                onclick={() => mutate({ list: 'whitelist', action: 'remove', player: e.name }, `wl-rm-${e.name}`)}
                disabled={mutating === `wl-rm-${e.name}`}
                class="mc-btn mc-btn-destructive text-xs"
              >
                {#if mutating === `wl-rm-${e.name}`}<Loader2 class="size-3 animate-spin" />{:else}<UserX class="size-3" />{/if}
                remover
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {:else if activeTab === 'ops'}
    <div class="mc-card">
      <div class="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="nome do player"
          bind:value={addInput}
          onkeydown={(e) => { if (e.key === 'Enter' && addInput.trim()) mutate({ list: 'ops', action: 'add', player: addInput.trim() }, 'op-add'); }}
          class="mc-input flex-1"
        />
        <button
          type="button"
          onclick={() => mutate({ list: 'ops', action: 'add', player: addInput.trim() }, 'op-add')}
          disabled={!addInput.trim() || mutating === 'op-add'}
          class="mc-btn mc-btn-primary"
        >
          {#if mutating === 'op-add'}<Loader2 class="size-4 animate-spin" />{:else}<Crown class="size-4" />{/if}
          dar OP
        </button>
      </div>
      {#if ops.length === 0}
        <p class="text-sm text-white/60 text-center py-6" style="text-shadow: 2px 2px 0 #3f3f3f;">nenhum operador</p>
      {:else}
        <ul class="space-y-2">
          {#each ops as e}
            <li class="flex items-center gap-3 bg-black/40 px-3 py-2" style="box-shadow: inset 1px 1px 0 0 rgba(0,0,0,0.4); border: 2px solid #000000;">
              <img src={avatar(e.name)} alt={e.name} class="size-10" style="image-rendering: pixelated;" />
              <div class="flex-1">
                <p class="text-sm flex items-center gap-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  {e.name}
                  <span class="text-xs text-mc-yellow">lv {e.level}</span>
                </p>
                {#if e.uuid}<p class="text-[10px] text-white/40 font-mono">{e.uuid}</p>{/if}
              </div>
              <button
                type="button"
                onclick={() => mutate({ list: 'ops', action: 'remove', player: e.name }, `op-rm-${e.name}`)}
                disabled={mutating === `op-rm-${e.name}`}
                class="mc-btn mc-btn-destructive text-xs"
              >
                {#if mutating === `op-rm-${e.name}`}<Loader2 class="size-3 animate-spin" />{:else}<UserX class="size-3" />{/if}
                deop
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {:else if activeTab === 'bans'}
    <div class="mc-card">
      <div class="flex flex-col gap-2 mb-4">
        <div class="flex items-center gap-2">
          <input type="text" placeholder="nome do player" bind:value={addInput} class="mc-input flex-1" />
          <input type="text" placeholder="motivo (opcional)" bind:value={addReason} class="mc-input flex-1" />
        </div>
        <button
          type="button"
          onclick={() => mutate({ list: 'bans', action: 'add', player: addInput.trim(), reason: addReason.trim() || undefined }, 'ban-add')}
          disabled={!addInput.trim() || mutating === 'ban-add'}
          class="mc-btn mc-btn-destructive w-full"
        >
          {#if mutating === 'ban-add'}<Loader2 class="size-4 animate-spin" />{:else}<Ban class="size-4" />{/if}
          banir player
        </button>
      </div>
      {#if bans.length === 0}
        <p class="text-sm text-white/60 text-center py-6" style="text-shadow: 2px 2px 0 #3f3f3f;">ninguém banido</p>
      {:else}
        <ul class="space-y-2">
          {#each bans as e}
            <li class="flex items-center gap-3 bg-black/40 px-3 py-2" style="box-shadow: inset 1px 1px 0 0 rgba(0,0,0,0.4); border: 2px solid #000000;">
              <img src={avatar(e.name ?? '?')} alt={e.name} class="size-10" style="image-rendering: pixelated;" />
              <div class="flex-1 min-w-0">
                <p class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{e.name ?? '?'}</p>
                {#if e.reason}<p class="text-xs text-white/60 truncate" style="text-shadow: 2px 2px 0 #3f3f3f;">"{e.reason}"</p>{/if}
                <p class="text-[10px] text-white/40">expira: {e.expires ?? 'permanente'}</p>
              </div>
              <button
                type="button"
                onclick={() => e.name && mutate({ list: 'bans', action: 'remove', player: e.name }, `ban-rm-${e.name}`)}
                disabled={!e.name || mutating === `ban-rm-${e.name}`}
                class="mc-btn text-xs"
              >
                {#if mutating === `ban-rm-${e.name}`}<Loader2 class="size-3 animate-spin" />{:else}<UserPlus class="size-3" />{/if}
                desbanir
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {:else if activeTab === 'banIps'}
    <div class="mc-card">
      <div class="flex flex-col gap-2 mb-4">
        <div class="flex items-center gap-2">
          <input type="text" placeholder="IP (ex: 192.168.1.50)" bind:value={addIp} class="mc-input flex-1" />
          <input type="text" placeholder="motivo (opcional)" bind:value={addReason} class="mc-input flex-1" />
        </div>
        <button
          type="button"
          onclick={() => mutate({ list: 'banIps', action: 'add', ip: addIp.trim(), reason: addReason.trim() || undefined }, 'banip-add')}
          disabled={!addIp.trim() || mutating === 'banip-add'}
          class="mc-btn mc-btn-destructive w-full"
        >
          {#if mutating === 'banip-add'}<Loader2 class="size-4 animate-spin" />{:else}<Ban class="size-4" />{/if}
          banir IP
        </button>
      </div>
      {#if banIps.length === 0}
        <p class="text-sm text-white/60 text-center py-6" style="text-shadow: 2px 2px 0 #3f3f3f;">nenhum IP banido</p>
      {:else}
        <ul class="space-y-2">
          {#each banIps as e}
            <li class="flex items-center gap-3 bg-black/40 px-3 py-2" style="box-shadow: inset 1px 1px 0 0 rgba(0,0,0,0.4); border: 2px solid #000000;">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-mono" style="text-shadow: 2px 2px 0 #3f3f3f;">{e.ip}</p>
                {#if e.reason}<p class="text-xs text-white/60 truncate" style="text-shadow: 2px 2px 0 #3f3f3f;">"{e.reason}"</p>{/if}
              </div>
              <button
                type="button"
                onclick={() => e.ip && mutate({ list: 'banIps', action: 'remove', ip: e.ip }, `banip-rm-${e.ip}`)}
                disabled={!e.ip || mutating === `banip-rm-${e.ip}`}
                class="mc-btn text-xs"
              >
                {#if mutating === `banip-rm-${e.ip}`}<Loader2 class="size-3 animate-spin" />{:else}<UserPlus class="size-3" />{/if}
                desbanir
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
