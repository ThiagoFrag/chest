<script lang="ts">
  import { Save, Download, Trash2, Loader2, Upload, Loader, RefreshCw } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';

  let { containerName }: { containerName: string } = $props();

  interface Backup {
    id: string;
    filename: string;
    sizeBytes: number;
    createdAt: number;
    scope: 'world' | 'full';
  }

  let backups = $state<Backup[]>([]);
  let loading = $state(true);
  let creating = $state(false);
  let pending = $state<string | null>(null);
  let scope = $state<'world' | 'full'>('world');

  async function load() {
    loading = true;
    try {
      const res = await fetch(`/api/servers/${containerName}/backups`);
      const data = await res.json();
      backups = data.backups ?? [];
    } finally {
      loading = false;
    }
  }

  async function create() {
    creating = true;
    try {
      const res = await fetch(`/api/servers/${containerName}/backups`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope })
      });
      if (res.ok) await load();
      else {
        const err = await res.json().catch(() => ({}));
        alert(`erro: ${err.message ?? res.status}`);
      }
    } finally {
      creating = false;
    }
  }

  async function remove(b: Backup) {
    if (!confirm(`Deletar backup de ${formatDate(b.createdAt)}?`)) return;
    pending = b.id;
    try {
      await fetch(`/api/servers/${containerName}/backups/${b.id}`, { method: 'DELETE' });
      backups = backups.filter((x) => x.id !== b.id);
    } finally {
      pending = null;
    }
  }

  async function restore(b: Backup) {
    if (!confirm(`Restaurar este backup vai SOBRESCREVER o mundo atual. Continuar?`)) return;
    pending = b.id;
    try {
      const res = await fetch(`/api/servers/${containerName}/backups/${b.id}/restore`, {
        method: 'POST'
      });
      if (res.ok) alert('mundo restaurado! server reiniciando.');
      else alert('erro ao restaurar');
    } finally {
      pending = null;
    }
  }

  function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  function formatDate(ts: number): string {
    return new Date(ts * 1000).toLocaleString('pt-BR');
  }

  load();
</script>

<div class="space-y-6">
  <section class="mc-card">
    <header class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="mc-slot"><MCTexture src="/textures/item/ender_eye.png" size={24} /></div>
        <div>
          <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">CRIAR BACKUP</h3>
          <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">snapshot do mundo ou /data inteiro</p>
        </div>
      </div>
      <button type="button" onclick={load} class="mc-btn text-xs">
        <RefreshCw class="size-3.5" />
      </button>
    </header>

    <div class="flex gap-2 mb-3">
      <button
        type="button"
        onclick={() => (scope = 'world')}
        class="flex-1 px-3 py-2 text-sm {scope === 'world' ? 'bg-primary text-white' : 'bg-secondary text-white'}"
        style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
      >
        só mundo
      </button>
      <button
        type="button"
        onclick={() => (scope = 'full')}
        class="flex-1 px-3 py-2 text-sm {scope === 'full' ? 'bg-primary text-white' : 'bg-secondary text-white'}"
        style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
      >
        tudo (mods + config + mundo)
      </button>
    </div>

    <button type="button" onclick={create} disabled={creating} class="mc-btn mc-btn-primary w-full">
      {#if creating}<Loader2 class="size-4 animate-spin" /> criando (pode demorar...){:else}<Save class="size-4" /> criar backup agora{/if}
    </button>
  </section>

  <section class="mc-card">
    <header class="mb-4 flex items-center gap-3">
      <div class="mc-slot"><MCTexture src="/textures/item/diamond.png" size={24} /></div>
      <div>
        <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">BACKUPS SALVOS</h3>
        <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">{backups.length} backup{backups.length === 1 ? '' : 's'}</p>
      </div>
    </header>

    {#if loading}
      <div class="text-center py-8"><Loader2 class="size-6 animate-spin mx-auto text-white/60" /></div>
    {:else if backups.length === 0}
      <p class="text-sm text-white/60 text-center py-8" style="text-shadow: 2px 2px 0 #3f3f3f;">
        nenhum backup ainda
      </p>
    {:else}
      <ul class="space-y-2">
        {#each backups as b (b.id)}
          <li class="flex items-center gap-3 px-3 py-3 bg-black/40 border-2 border-black" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
            <div class="mc-slot">
              <MCTexture src={b.scope === 'full' ? '/textures/item/netherite_ingot.png' : '/textures/item/emerald.png'} size={24} />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {formatDate(b.createdAt)}
                <span class="text-diamond text-xs ml-2">{b.scope}</span>
              </p>
              <p class="text-xs text-white/50">{formatBytes(b.sizeBytes)}</p>
            </div>
            <a
              href={`/api/servers/${containerName}/backups/${b.id}`}
              download
              class="mc-btn text-xs py-1 px-2"
              title="download"
            >
              <Download class="size-3.5" />
            </a>
            <button
              type="button"
              onclick={() => restore(b)}
              disabled={pending === b.id}
              class="mc-btn mc-btn-accent text-xs py-1 px-2"
              title="restaurar"
            >
              {#if pending === b.id}<Loader2 class="size-3.5 animate-spin" />{:else}<Upload class="size-3.5" />{/if}
            </button>
            <button
              type="button"
              onclick={() => remove(b)}
              disabled={pending === b.id}
              class="mc-btn mc-btn-destructive text-xs py-1 px-2"
              title="deletar"
            >
              <Trash2 class="size-3.5" />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>
