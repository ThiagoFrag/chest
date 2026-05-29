<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { ArrowLeft, Play, Square, RotateCw, Send, Trash2, Terminal, Cpu, Server as ServerIcon, Loader2 } from 'lucide-svelte';
  import StatusPill from '$components/forja/StatusPill.svelte';
  import ModManager from '$components/forja/ModManager.svelte';
  import WorldPanel from '$components/forja/WorldPanel.svelte';
  import BackupsPanel from '$components/forja/BackupsPanel.svelte';
  import SchedulerPanel from '$components/forja/SchedulerPanel.svelte';
  import NetworkPanel from '$components/forja/NetworkPanel.svelte';
  import DiscordBridgePanel from '$components/forja/DiscordBridgePanel.svelte';
  import PropertiesEditor from '$components/forja/PropertiesEditor.svelte';
  import PlayersConfig from '$components/forja/PlayersConfig.svelte';
  import FileManager from '$components/forja/FileManager.svelte';
  import ConnectCard from '$components/forja/ConnectCard.svelte';
  import AuthModePanel from '$components/forja/AuthModePanel.svelte';
  import MapPanel from '$components/forja/MapPanel.svelte';
  import SubusersPanel from '$components/forja/SubusersPanel.svelte';
  import MetricsChart from '$components/forja/MetricsChart.svelte';
  import { formatUptime, formatBytes } from '$lib/utils';

  let { data } = $props();
  const server = $derived(data.server);
  const mc = $derived(data.mc);

  let tab = $state<'overview' | 'console' | 'players' | 'mods' | 'world' | 'map' | 'properties' | 'files' | 'backups' | 'agenda' | 'network' | 'discord' | 'access' | 'settings'>('overview');

  const isAdmin = $derived(data.user?.role === 'admin');
  const tabs = $derived([
    {id:'overview',l:'overview'},
    {id:'console',l:'console'},
    {id:'players',l:'players'},
    {id:'mods',l:'mods'},
    {id:'world',l:'mundo'},
    {id:'map',l:'🗺️ mapa'},
    {id:'properties',l:'properties'},
    {id:'files',l:'arquivos'},
    {id:'backups',l:'backups'},
    {id:'agenda',l:'agenda'},
    {id:'network',l:'rede'},
    {id:'discord',l:'discord'},
    ...(isAdmin ? [{id:'access',l:'🔑 acesso'}] : []),
    {id:'settings',l:'settings'}
  ]);

  let pending = $state<'start' | 'stop' | 'restart' | 'delete' | null>(null);
  let logs = $state<string[]>([]);
  let logBox: HTMLDivElement | undefined = $state();
  let cmd = $state('');
  let cmdHistory: string[] = [];
  let cmdIdx = 0;
  let rconResponses = $state<string[]>([]);
  let cpuPct = $state<number | null>(null);
  let memUsedMb = $state<number | null>(null);
  let memLimitMb = $state<number | null>(null);
  let logsSrc: EventSource | null = null;
  let statsSrc: EventSource | null = null;
  let players = $state<string[]>([]);

  async function act(action: 'start' | 'stop' | 'restart') {
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

  let deleteConfirm = $state('');
  async function doDelete() {
    if (deleteConfirm !== server.containerName) return;
    pending = 'delete';
    try {
      await fetch(`/api/servers/${server.containerName}`, { method: 'DELETE' });
      goto('/servers');
    } finally {
      pending = null;
    }
  }

  async function sendRcon() {
    if (!cmd.trim()) return;
    const c = cmd.trim();
    cmdHistory.push(c);
    cmdIdx = cmdHistory.length;
    cmd = '';
    rconResponses = [...rconResponses, `> ${c}`];
    try {
      const res = await fetch(`/api/servers/${server.containerName}/rcon`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ command: c })
      });
      const data = await res.json();
      rconResponses = [...rconResponses, data.response ?? `(erro: ${data.message ?? '?'})`];
    } catch (e) {
      rconResponses = [...rconResponses, `(erro: ${e instanceof Error ? e.message : '?'})`];
    }
  }

  function handleCmdKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendRcon();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdIdx > 0) {
        cmdIdx -= 1;
        cmd = cmdHistory[cmdIdx] ?? '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdIdx < cmdHistory.length - 1) {
        cmdIdx += 1;
        cmd = cmdHistory[cmdIdx] ?? '';
      } else {
        cmdIdx = cmdHistory.length;
        cmd = '';
      }
    }
  }

  function openLogs() {
    if (logsSrc) return;
    logsSrc = new EventSource(`/api/servers/${server.containerName}/logs`);
    logsSrc.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'log') {
          logs = [...logs.slice(-499), data.line];
          queueMicrotask(() => {
            if (logBox) logBox.scrollTop = logBox.scrollHeight;
          });
        }
      } catch {}
    };
    logsSrc.onerror = () => { logsSrc?.close(); logsSrc = null; };
  }

  function openStats() {
    if (statsSrc) return;
    statsSrc = new EventSource(`/api/servers/${server.containerName}/stats`);
    statsSrc.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        cpuPct = data.cpuPercent;
        memUsedMb = data.memUsedMb;
        memLimitMb = data.memLimitMb;
      } catch {}
    };
    statsSrc.onerror = () => { statsSrc?.close(); statsSrc = null; };
  }

  let metricsRange = $state<'1h' | '6h' | '24h' | '7d'>('1h');
  let metricsPoints = $state<Array<{ ts: number; cpu: number | null; ram: number | null; players: number | null }>>([]);
  let metricsNote = $state<string | null>(null);

  async function loadMetrics() {
    try {
      const res = await fetch(`/api/servers/${server.containerName}/metrics?range=${metricsRange}`);
      const data = await res.json();
      metricsPoints = data.points ?? [];
      metricsNote = data.note ?? null;
    } catch {}
  }

  let rconUnavailable = $state(false);
  async function refreshPlayers() {
    if (server.state !== 'running') return;
    try {
      const res = await fetch(`/api/servers/${server.containerName}/rcon`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ command: 'list' })
      });
      if (res.status === 409) {
        rconUnavailable = true;
        return;
      }
      const data = await res.json();
      const match = (data.response ?? '').match(/:\s*(.+)$/);
      players = match ? match[1].split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      rconUnavailable = false;
    } catch {}
  }

  $effect(() => {
    if (tab === 'console' && server.state === 'running') openLogs();
    else { logsSrc?.close(); logsSrc = null; }
  });

  $effect(() => {
    if (tab === 'overview' && server.state === 'running') openStats();
    else { statsSrc?.close(); statsSrc = null; }
  });

  $effect(() => {
    if (tab === 'players') refreshPlayers();
  });

  $effect(() => {
    if (tab === 'overview') {
      void metricsRange;
      loadMetrics();
    }
  });

  onDestroy(() => {
    logsSrc?.close();
    statsSrc?.close();
  });
</script>

<svelte:head><title>Chest · {server.displayName}</title></svelte:head>

<div class="px-8 py-6">
  <a href="/servers" class="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2" style="text-shadow: 1px 1px 0 rgba(0,0,0,0.5);">
    <ArrowLeft class="size-3" /> voltar
  </a>

  <header class="flex items-start justify-between gap-3 mb-6">
    <div class="flex items-start gap-3">
      <div class="bg-grass p-3" style="box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.2), inset -1px -1px 0 0 rgba(0,0,0,0.4);">
        <ServerIcon class="size-6 text-white" />
      </div>
      <div>
        <h1 class="mc-heading text-3xl text-foreground">{server.displayName}</h1>
        <p class="text-xs text-muted-foreground mt-1">{server.containerName}</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <StatusPill state={server.state} />
      {#if server.state === 'running'}
        <button type="button" onclick={() => act('restart')} disabled={pending !== null} class="mc-btn text-xs">
          {#if pending === 'restart'}<Loader2 class="size-3 animate-spin" />{:else}<RotateCw class="size-3" />{/if}
          restart
        </button>
        <button type="button" onclick={() => act('stop')} disabled={pending !== null} class="mc-btn mc-btn-destructive text-xs">
          {#if pending === 'stop'}<Loader2 class="size-3 animate-spin" />{:else}<Square class="size-3 fill-current" />{/if}
          stop
        </button>
      {:else}
        <button type="button" onclick={() => act('start')} disabled={pending !== null} class="mc-btn mc-btn-primary text-xs">
          {#if pending === 'start'}<Loader2 class="size-3 animate-spin" />{:else}<Play class="size-3 fill-current" />{/if}
          start
        </button>
      {/if}
    </div>
  </header>

  <nav class="flex gap-1 mb-4 border-b border-border">
    {#each tabs as t}
      <button
        type="button"
        onclick={() => (tab = t.id as typeof tab)}
        class="px-4 py-2 text-sm {tab === t.id ? 'bg-grass text-white' : 'text-muted-foreground hover:text-foreground'}"
        style="text-shadow: 1px 1px 0 rgba(0,0,0,0.5); box-shadow: {tab === t.id ? 'inset 1px 1px 0 0 rgba(255,255,255,0.15), inset -1px -1px 0 0 rgba(0,0,0,0.4)' : 'none'};"
      >
        {t.l}
      </button>
    {/each}
  </nav>

  {#key tab}<div class="mc-tab-content">
  {#if tab === 'overview'}
    <div class="grid gap-4 md:grid-cols-3">
      <div class="mc-card">
        <p class="text-xs text-muted-foreground mb-2" style="text-shadow: 1px 1px 0 rgba(0,0,0,0.5);">VERSÃO</p>
        <p class="mc-heading text-xl">{mc?.online ? mc.version : '—'}</p>
      </div>
      <div class="mc-card">
        <p class="text-xs text-muted-foreground mb-2" style="text-shadow: 1px 1px 0 rgba(0,0,0,0.5);">PLAYERS</p>
        <p class="mc-heading text-xl">{mc?.online ? `${mc.players.online}/${mc.players.max}` : '—'}</p>
      </div>
      <div class="mc-card">
        <p class="text-xs text-muted-foreground mb-2" style="text-shadow: 1px 1px 0 rgba(0,0,0,0.5);">UPTIME</p>
        <p class="mc-heading text-xl">{server.uptime ? formatUptime(server.uptime) : '—'}</p>
      </div>
      <div class="mc-card md:col-span-3">
        <div class="flex items-center gap-2 mb-3">
          <Cpu class="size-4 text-diamond" />
          <p class="text-xs text-muted-foreground" style="text-shadow: 1px 1px 0 rgba(0,0,0,0.5);">RECURSOS EM TEMPO REAL</p>
        </div>
        <div class="grid grid-cols-2 gap-6">
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-muted-foreground">CPU</span>
              <span class="text-diamond">{cpuPct !== null ? cpuPct.toFixed(1) : '—'}%</span>
            </div>
            <div class="h-3 bg-input" style="box-shadow: inset 2px 2px 0 0 rgba(0,0,0,0.5);">
              <div class="h-full bg-grass" style="width: {Math.min(100, cpuPct ?? 0)}%;"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-muted-foreground">RAM</span>
              <span class="text-diamond">{memUsedMb !== null && memLimitMb ? `${memUsedMb} / ${memLimitMb} MB` : '—'}</span>
            </div>
            <div class="h-3 bg-input" style="box-shadow: inset 2px 2px 0 0 rgba(0,0,0,0.5);">
              <div class="h-full bg-grass" style="width: {memLimitMb ? Math.min(100, ((memUsedMb ?? 0) / memLimitMb) * 100) : 0}%;"></div>
            </div>
          </div>
        </div>
      </div>
      {#if mc?.online}
        <div class="mc-card md:col-span-3">
          <p class="text-xs text-muted-foreground mb-2" style="text-shadow: 1px 1px 0 rgba(0,0,0,0.5);">MOTD</p>
          <p class="text-foreground" style="text-shadow: 2px 2px 0 rgba(0,0,0,0.5);">{mc.motd}</p>
        </div>
      {/if}

      <ConnectCard
        hostPort={server.hostPort}
        mcHostAddress={data.mcHostAddress ?? null}
        publicUrl={data.publicUrl ?? null}
        publicMode={data.publicMode ?? null}
        mcVersion={mc?.online ? mc.version : null}
      />
    </div>

    <div class="mt-6">
      <div class="flex items-center gap-2 mb-3">
        <p class="text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">HISTÓRICO</p>
        <div class="flex gap-1 ml-auto">
          {#each ['1h', '6h', '24h', '7d'] as r}
            <button
              type="button"
              onclick={() => (metricsRange = r as typeof metricsRange)}
              class="px-2 py-1 text-xs {metricsRange === r ? 'bg-primary text-white' : 'bg-secondary text-white/70'}"
              style="border: 2px solid #000; box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.15), inset -1px -1px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
            >{r}</button>
          {/each}
        </div>
      </div>
      {#if metricsNote}
        <p class="text-xs text-warning mb-3" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {metricsNote}</p>
      {/if}
      <div class="grid gap-3 md:grid-cols-3">
        <MetricsChart label="CPU %" color="#4aedd9" unit="%" points={metricsPoints.map((p) => ({ ts: p.ts, value: p.cpu }))} />
        <MetricsChart label="RAM MB" color="#fcdf52" unit=" MB" points={metricsPoints.map((p) => ({ ts: p.ts, value: p.ram }))} />
        <MetricsChart label="Players" color="#5ba34d" points={metricsPoints.map((p) => ({ ts: p.ts, value: p.players }))} />
      </div>
    </div>
  {:else if tab === 'console'}
    <div class="mc-card p-0 overflow-hidden">
      <div class="bg-input p-3 border-b border-border flex items-center gap-2 text-xs text-muted-foreground" style="text-shadow: 1px 1px 0 rgba(0,0,0,0.5);">
        <Terminal class="size-3" />
        console — {logs.length} linhas
      </div>
      <div bind:this={logBox} class="bg-input text-xs p-3 h-96 overflow-y-auto font-mono text-foreground" style="line-height: 1.5;">
        {#each logs as line}
          <div>{line}</div>
        {:else}
          <div class="text-muted-foreground">{server.state === 'running' ? 'aguardando logs...' : 'server parado — start pra ver logs'}</div>
        {/each}
        {#each rconResponses as r}
          <div class="text-diamond">{r}</div>
        {/each}
      </div>
      <div class="flex border-t border-border">
        <input
          type="text"
          bind:value={cmd}
          onkeydown={handleCmdKey}
          placeholder={server.state === 'running' ? 'comando RCON (ex: list, say oi)' : 'server precisa estar online'}
          disabled={server.state !== 'running'}
          class="flex-1 bg-input text-foreground px-3 py-2 text-sm outline-none font-mono"
          style="border-radius: 0;"
        />
        <button type="button" onclick={sendRcon} disabled={!cmd.trim() || server.state !== 'running'} class="mc-btn mc-btn-primary px-4 text-xs" style="border-radius: 0;">
          <Send class="size-3" />
        </button>
      </div>
    </div>
  {:else if tab === 'players'}
    <PlayersConfig containerName={server.containerName} onlinePlayers={players} />
  {:else if tab === 'mods'}
    <ModManager
      containerName={server.containerName}
      mcVersion={data.mc?.online ? data.mc.version : '1.21.1'}
      loader={'fabric'}
    />
  {:else if tab === 'world'}
    <WorldPanel containerName={server.containerName} />
  {:else if tab === 'backups'}
    <BackupsPanel containerName={server.containerName} />
  {:else if tab === 'agenda'}
    <SchedulerPanel containerName={server.containerName} />
  {:else if tab === 'network'}
    <NetworkPanel
      containerName={server.containerName}
      publicUrl={data.publicUrl ?? null}
      publicMode={data.publicMode ?? null}
      baseHostname={data.baseHostname ?? null}
    />
  {:else if tab === 'discord'}
    <DiscordBridgePanel containerName={server.containerName} />
  {:else if tab === 'properties'}
    <PropertiesEditor containerName={server.containerName} />
  {:else if tab === 'map'}
    <MapPanel
      containerName={server.containerName}
      loader={data.modloaderType}
      mcHostAddress={data.mcHostAddress ?? null}
      managed={data.managed}
    />
  {:else if tab === 'files'}
    <FileManager containerName={server.containerName} />
  {:else if tab === 'access' && isAdmin}
    <SubusersPanel containerName={server.containerName} />
  {:else if tab === 'settings'}
    <div class="space-y-4">
    <AuthModePanel containerName={server.containerName} />
    <SubusersPanel containerName={server.containerName} />
    <div class="mc-card border-l-4 border-l-destructive">
      <h3 class="mc-heading text-lg text-destructive mb-2">DANGER ZONE</h3>
      <p class="text-sm text-muted-foreground mb-4" style="text-shadow: 1px 1px 0 rgba(0,0,0,0.5);">
        deletar server remove container + volume permanentemente. mundo perdido.
      </p>
      <div class="space-y-3">
        <input
          type="text"
          bind:value={deleteConfirm}
          placeholder="digite {server.containerName} pra confirmar"
          class="mc-input"
        />
        <button
          type="button"
          onclick={doDelete}
          disabled={deleteConfirm !== server.containerName || pending !== null}
          class="mc-btn mc-btn-destructive"
        >
          {#if pending === 'delete'}<Loader2 class="size-4 animate-spin" />{:else}<Trash2 class="size-4" />{/if}
          deletar server
        </button>
      </div>
    </div>
    </div>
  {/if}
  </div>{/key}
</div>
