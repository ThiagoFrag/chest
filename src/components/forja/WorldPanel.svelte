<script lang="ts">
  import { AlertTriangle, RefreshCw, Loader2, Dices, Save, Globe } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';

  let { containerName }: { containerName: string } = $props();

  let info = $state<null | {
    seed: string | null;
    levelName: string;
    difficulty: string;
    gameMode: string | null;
    hardcore: boolean;
    pvp: boolean;
  }>(null);
  let loading = $state(true);

  let newSeed = $state('');
  let savingSeed = $state(false);

  let resetSeedToo = $state(false);
  let resetSeedValue = $state('');
  let resetNether = $state(true);
  let resetEnd = $state(true);
  let confirmText = $state('');
  let resetting = $state(false);

  async function load() {
    loading = true;
    try {
      const res = await fetch(`/api/servers/${containerName}/world`);
      info = await res.json();
      newSeed = info?.seed ?? '';
    } finally {
      loading = false;
    }
  }

  async function saveSeed() {
    if (!newSeed.trim()) return;
    savingSeed = true;
    try {
      const res = await fetch(`/api/servers/${containerName}/world`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ seed: newSeed.trim() })
      });
      if (res.ok) {
        await load();
        alert('seed salva! aplica na próxima geração de chunks (ou reset do mundo).');
      }
    } finally {
      savingSeed = false;
    }
  }

  function genRandomSeed() {
    const n = Math.floor(Math.random() * (2 ** 53));
    resetSeedValue = String(n);
  }

  async function doReset() {
    if (confirmText !== 'RESET') return;
    resetting = true;
    try {
      const res = await fetch(`/api/servers/${containerName}/world/reset`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          newSeed: resetSeedToo ? resetSeedValue.trim() || undefined : undefined,
          resetNether,
          resetEnd,
          confirm: true
        })
      });
      if (res.ok) {
        confirmText = '';
        await load();
        alert('mundo resetado! server reiniciando com mundo novo. mods preservados.');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`erro: ${err.message ?? res.status}`);
      }
    } finally {
      resetting = false;
    }
  }

  load();
</script>

<div class="grid gap-6 lg:grid-cols-2">
  <!-- World info + seed change -->
  <section class="mc-card">
    <header class="mb-4 flex items-center gap-3">
      <div class="mc-slot"><MCTexture src="/textures/block/grass_block_top.png" size={24} /></div>
      <div>
        <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">MUNDO</h3>
        <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">level + seed</p>
      </div>
    </header>

    {#if loading || !info}
      <div class="text-center py-8"><Loader2 class="size-6 animate-spin mx-auto text-white/60" /></div>
    {:else}
      <dl class="grid grid-cols-2 gap-y-3 text-sm mb-5">
        <dt class="text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">nome</dt>
        <dd class="text-diamond" style="text-shadow: 2px 2px 0 #3f3f3f;">{info.levelName}</dd>

        <dt class="text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">dificuldade</dt>
        <dd style="text-shadow: 2px 2px 0 #3f3f3f;">{info.difficulty}</dd>

        <dt class="text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">gamemode</dt>
        <dd style="text-shadow: 2px 2px 0 #3f3f3f;">{info.gameMode ?? '—'}</dd>

        <dt class="text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">hardcore</dt>
        <dd style="text-shadow: 2px 2px 0 #3f3f3f;">{info.hardcore ? 'sim' : 'não'}</dd>

        <dt class="text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">pvp</dt>
        <dd style="text-shadow: 2px 2px 0 #3f3f3f;">{info.pvp ? 'sim' : 'não'}</dd>
      </dl>

      <div class="border-t-2 border-black pt-4 space-y-2">
        <label for="seed" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">seed atual / nova seed</label>
        <div class="flex gap-2">
          <input id="seed" type="text" bind:value={newSeed} placeholder="(aleatório)" class="mc-input flex-1" />
          <button type="button" onclick={() => (newSeed = String(Math.floor(Math.random() * 2 ** 53)))} class="mc-btn px-3" title="aleatório">
            <Dices class="size-4" />
          </button>
        </div>
        <button type="button" onclick={saveSeed} disabled={savingSeed || newSeed === (info.seed ?? '')} class="mc-btn mc-btn-primary w-full">
          {#if savingSeed}<Loader2 class="size-4 animate-spin" />{:else}<Save class="size-4" />{/if}
          salvar seed
        </button>
        <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">
          aplica em chunks novos. pra todo o mundo, use reset abaixo.
        </p>
      </div>
    {/if}
  </section>

  <!-- Reset world (danger) -->
  <section class="mc-card" style="border-color: #aa2828;">
    <header class="mb-4 flex items-center gap-3">
      <div class="mc-slot"><MCTexture src="/textures/item/redstone.png" size={24} /></div>
      <div>
        <h3 class="text-lg text-destructive mc-heading">RESET MUNDO</h3>
        <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">apaga mundo, preserva mods</p>
      </div>
    </header>

    <div class="space-y-3 mb-4 text-sm">
      <p style="text-shadow: 2px 2px 0 #3f3f3f;">
        ⚠ <span class="text-warning">vai apagar:</span> /data/world{resetNether ? ', /data/world_nether' : ''}{resetEnd ? ', /data/world_the_end' : ''}
      </p>
      <p style="text-shadow: 2px 2px 0 #3f3f3f;">
        ✓ <span class="text-success">preserva:</span> mods, config, server.properties, whitelist, ops, player data
      </p>
    </div>

    <div class="space-y-3 mb-4">
      <label class="flex items-center gap-2 text-sm cursor-pointer" style="text-shadow: 2px 2px 0 #3f3f3f;">
        <input type="checkbox" bind:checked={resetNether} />
        apagar nether também
      </label>
      <label class="flex items-center gap-2 text-sm cursor-pointer" style="text-shadow: 2px 2px 0 #3f3f3f;">
        <input type="checkbox" bind:checked={resetEnd} />
        apagar end também
      </label>
      <label class="flex items-center gap-2 text-sm cursor-pointer" style="text-shadow: 2px 2px 0 #3f3f3f;">
        <input type="checkbox" bind:checked={resetSeedToo} />
        usar seed nova
      </label>
      {#if resetSeedToo}
        <div class="flex gap-2 ml-6">
          <input type="text" bind:value={resetSeedValue} placeholder="(aleatório)" class="mc-input flex-1" />
          <button type="button" onclick={genRandomSeed} class="mc-btn px-3" title="aleatório">
            <Dices class="size-4" />
          </button>
        </div>
      {/if}
    </div>

    <div class="space-y-2">
      <label for="confirm" class="block text-xs" style="text-shadow: 2px 2px 0 #3f3f3f;">
        digite <span class="text-warning">RESET</span> pra confirmar
      </label>
      <input id="confirm" type="text" bind:value={confirmText} placeholder="RESET" class="mc-input" />
      <button
        type="button"
        onclick={doReset}
        disabled={confirmText !== 'RESET' || resetting}
        class="mc-btn mc-btn-destructive w-full"
      >
        {#if resetting}<Loader2 class="size-4 animate-spin" />{:else}<RefreshCw class="size-4" />{/if}
        resetar mundo
      </button>
    </div>
  </section>
</div>
