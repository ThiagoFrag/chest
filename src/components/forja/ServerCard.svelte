<script lang="ts">
  import { invalidateAll, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Play, Square, RotateCw, Loader2 } from 'lucide-svelte';
  import StatusPill from './StatusPill.svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import { formatUptime } from '$lib/utils';
  import { t } from '$lib/i18n';

  const canControl = $derived.by(() => {
    const role = (page.data as { user?: { role?: string } }).user?.role;
    return role === 'admin' || role === 'operator';
  });

  interface ServerData {
    id: string;
    containerName: string;
    displayName: string;
    image: string;
    state: 'running' | 'exited' | 'created' | 'restarting' | 'paused' | 'dead';
    status: string;
    uptime: number | null;
    hostPort: number | null;
    mc:
      | { online: true; motd: string; version: string; players: { online: number; max: number }; latencyMs: number }
      | { online: false; error: string }
      | null;
  }

  let { server }: { server: ServerData } = $props();
  let pending = $state<'start' | 'stop' | 'restart' | null>(null);

  async function act(e: Event, action: 'start' | 'stop' | 'restart') {
    e.stopPropagation();
    pending = action;
    try {
      await fetch(`/api/servers/${server.containerName}/control`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action })
      });
      await invalidateAll();
    } finally {
      pending = null;
    }
  }
</script>

<div
  class="mc-card mc-card-hover cursor-pointer"
  role="link"
  tabindex="0"
  onclick={() => goto(`/servers/${server.containerName}`)}
  onkeydown={(e) => e.key === 'Enter' && goto(`/servers/${server.containerName}`)}
>
  <header class="flex items-start justify-between gap-3 mb-4">
    <div class="min-w-0 flex items-start gap-3">
      <div class="mc-slot shrink-0">
        <MCTexture src="/textures/block/grass_block_top.png" size={32} alt="" />
      </div>
      <div class="min-w-0">
        <h3 class="truncate text-lg text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {server.displayName}
        </h3>
        <p class="mt-0.5 truncate text-xs text-white/60">{server.containerName}</p>
      </div>
    </div>
    <StatusPill state={server.state} />
  </header>

  <dl class="grid grid-cols-3 gap-3 text-xs mb-4">
    <div>
      <dt class="text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('dashboard.card.version')}</dt>
      <dd class="mt-1 text-diamond" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {server.mc?.online ? server.mc.version : '—'}
      </dd>
    </div>
    <div>
      <dt class="text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('dashboard.card.players')}</dt>
      <dd class="mt-1 text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {server.mc?.online ? `${server.mc.players.online}/${server.mc.players.max}` : '—'}
      </dd>
    </div>
    <div>
      <dt class="text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('dashboard.card.uptime')}</dt>
      <dd class="mt-1 text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {server.uptime ? formatUptime(server.uptime) : '—'}
      </dd>
    </div>
  </dl>

  {#if server.mc?.online}
    <div class="mb-4 px-3 py-2 text-xs text-white bg-black border-2 border-black" style="text-shadow: 2px 2px 0 #3f3f3f; box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
      <span class="text-white/50">motd:</span> {server.mc.motd || t('dashboard.card.noMotd')}
    </div>
  {/if}

  <footer class="flex gap-2">
    {#if !canControl}
      <div class="flex-1 text-center text-xs text-white/40 py-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('dashboard.card.noPermission')}
      </div>
    {:else if server.state === 'running'}
      <button type="button" onclick={(e) => act(e, 'restart')} disabled={pending !== null} class="mc-btn flex-1 text-sm py-2">
        {#if pending === 'restart'}<Loader2 class="size-3.5 animate-spin" />{:else}<RotateCw class="size-3.5" />{/if}
        {t('dashboard.card.restart')}
      </button>
      <button type="button" onclick={(e) => act(e, 'stop')} disabled={pending !== null} class="mc-btn mc-btn-destructive flex-1 text-sm py-2">
        {#if pending === 'stop'}<Loader2 class="size-3.5 animate-spin" />{:else}<Square class="size-3.5 fill-current" />{/if}
        {t('dashboard.card.stop')}
      </button>
    {:else}
      <button type="button" onclick={(e) => act(e, 'start')} disabled={pending !== null} class="mc-btn mc-btn-primary flex-1 text-sm py-2">
        {#if pending === 'start'}<Loader2 class="size-3.5 animate-spin" />{:else}<Play class="size-3.5 fill-current" />{/if}
        {t('dashboard.card.start')}
      </button>
    {/if}
  </footer>
</div>
