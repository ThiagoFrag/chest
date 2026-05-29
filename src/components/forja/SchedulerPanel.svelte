<script lang="ts">
  import { Plus, Trash2, Power, Loader2, Clock, Save, Square, RotateCw, Terminal } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';

  let { containerName }: { containerName: string } = $props();

  interface Task {
    id: string;
    taskType: 'backup' | 'restart' | 'command';
    cronExpr: string;
    params: string;
    enabled: boolean;
    lastRunAt: number | null;
    lastRunStatus: string | null;
    nextRunAt: number | null;
  }

  const presets = [
    { id: 'hourly', label: 'a cada hora', cron: '0 * * * *' },
    { id: 'every6h', label: 'a cada 6 horas', cron: '0 */6 * * *' },
    { id: 'every12h', label: 'a cada 12 horas', cron: '0 */12 * * *' },
    { id: 'daily3am', label: 'diário às 3am', cron: '0 3 * * *' },
    { id: 'daily4am', label: 'diário às 4am', cron: '0 4 * * *' },
    { id: 'daily6am', label: 'diário às 6am', cron: '0 6 * * *' },
    { id: 'weeklySunday3am', label: 'domingo às 3am', cron: '0 3 * * 0' }
  ];

  let tasks = $state<Task[]>([]);
  let loading = $state(true);
  let note = $state<string | null>(null);

  let showAdd = $state(false);
  let newType = $state<'backup' | 'restart' | 'command'>('backup');
  let newCron = $state('0 4 * * *');
  let newScope = $state<'world' | 'full'>('world');
  let newCommand = $state('');
  let saving = $state(false);
  let pending = $state<string | null>(null);

  async function load() {
    loading = true;
    try {
      const res = await fetch(`/api/servers/${containerName}/tasks`);
      const data = await res.json();
      tasks = data.tasks ?? [];
      note = data.note ?? null;
    } finally {
      loading = false;
    }
  }

  async function create() {
    saving = true;
    try {
      const params: Record<string, unknown> = {};
      if (newType === 'backup') params.scope = newScope;
      if (newType === 'command') params.command = newCommand;

      const res = await fetch(`/api/servers/${containerName}/tasks`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          taskType: newType,
          cronExpr: newCron.trim(),
          params,
          enabled: true
        })
      });
      if (res.ok) {
        showAdd = false;
        newCommand = '';
        await load();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`erro: ${err.message ?? res.status}`);
      }
    } finally {
      saving = false;
    }
  }

  async function toggle(t: Task) {
    pending = t.id;
    try {
      await fetch(`/api/servers/${containerName}/tasks/${t.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: !t.enabled })
      });
      t.enabled = !t.enabled;
      tasks = tasks;
    } finally {
      pending = null;
    }
  }

  async function remove(t: Task) {
    if (!confirm('Deletar essa tarefa?')) return;
    pending = t.id;
    try {
      await fetch(`/api/servers/${containerName}/tasks/${t.id}`, { method: 'DELETE' });
      tasks = tasks.filter((x) => x.id !== t.id);
    } finally {
      pending = null;
    }
  }

  function fmtDate(ts: number | null): string {
    return ts ? new Date(ts * 1000).toLocaleString('pt-BR') : '—';
  }

  function fmtParams(p: string): string {
    try {
      const o = JSON.parse(p);
      return Object.entries(o).map(([k, v]) => `${k}=${v}`).join(', ');
    } catch { return ''; }
  }

  load();
</script>

{#if note}
  <div class="mc-card mb-4" style="border-color: var(--color-warning);">
    <p class="text-sm text-warning" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {note}</p>
    <p class="text-xs text-white/60 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
      pra ter agenda, crie o server pelo wizard (botão "+ novo server").
    </p>
  </div>
{/if}

<div class="grid gap-6 lg:grid-cols-2">
  <section class="mc-card">
    <header class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="mc-slot"><MCTexture src="/textures/item/iron_pickaxe.png" size={24} /></div>
        <div>
          <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">TAREFAS</h3>
          <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {tasks.length} agendada{tasks.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>
      <button type="button" onclick={() => (showAdd = true)} disabled={!!note} class="mc-btn mc-btn-primary text-xs py-1.5 px-3">
        <Plus class="size-3.5" /> nova
      </button>
    </header>

    {#if loading}
      <div class="text-center py-8"><Loader2 class="size-6 animate-spin mx-auto text-white/60" /></div>
    {:else if tasks.length === 0}
      <p class="text-sm text-white/60 text-center py-8" style="text-shadow: 2px 2px 0 #3f3f3f;">
        nenhuma tarefa agendada
      </p>
    {:else}
      <ul class="space-y-2">
        {#each tasks as t (t.id)}
          <li class="flex items-start gap-3 px-3 py-3 bg-black/40 border-2 border-black" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
            <button type="button" onclick={() => toggle(t)} disabled={pending === t.id} title={t.enabled ? 'desativar' : 'ativar'}>
              <Power class="size-4 mt-1 {t.enabled ? 'text-success' : 'text-white/30'}" />
            </button>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white flex items-center gap-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {#if t.taskType === 'backup'}<Save class="size-3.5 text-diamond" /> backup{/if}
                {#if t.taskType === 'restart'}<RotateCw class="size-3.5 text-warning" /> restart{/if}
                {#if t.taskType === 'command'}<Terminal class="size-3.5 text-accent" /> command{/if}
                <span class="text-xs text-white/50 ml-2">{fmtParams(t.params)}</span>
              </p>
              <p class="text-xs text-diamond mt-1 font-mono">{t.cronExpr}</p>
              <p class="text-xs text-white/40 mt-1">
                última: <span class={t.lastRunStatus === 'ok' ? 'text-success' : 'text-warning'}>{fmtDate(t.lastRunAt)}</span>
                · próx: <span class="text-white/60">{fmtDate(t.nextRunAt)}</span>
              </p>
            </div>
            <button type="button" onclick={() => remove(t)} disabled={pending === t.id} class="text-destructive hover:text-mc-yellow" title="deletar">
              <Trash2 class="size-3.5" />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  {#if showAdd}
    <section class="mc-card">
      <h3 class="text-lg mb-4" style="text-shadow: 2px 2px 0 #3f3f3f;">NOVA TAREFA</h3>

      <div class="space-y-3">
        <div>
          <span class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">tipo</span>
          <div class="grid grid-cols-3 gap-1">
            {#each [{id:'backup',l:'backup'},{id:'restart',l:'restart'},{id:'command',l:'comando'}] as t}
              <button type="button" onclick={() => (newType = t.id as typeof newType)}
                class="px-3 py-2 text-xs {newType === t.id ? 'bg-primary text-white' : 'bg-secondary text-white'}"
                style="border: 2px solid #000; box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.15), inset -1px -1px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;">
                {t.l}
              </button>
            {/each}
          </div>
        </div>

        {#if newType === 'backup'}
          <div>
            <span class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">scope</span>
            <div class="grid grid-cols-2 gap-1">
              <button type="button" onclick={() => (newScope = 'world')} class="px-3 py-2 text-xs {newScope === 'world' ? 'bg-primary text-white' : 'bg-secondary text-white'}"
                style="border: 2px solid #000; box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.15), inset -1px -1px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;">só mundo</button>
              <button type="button" onclick={() => (newScope = 'full')} class="px-3 py-2 text-xs {newScope === 'full' ? 'bg-primary text-white' : 'bg-secondary text-white'}"
                style="border: 2px solid #000; box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.15), inset -1px -1px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;">tudo</button>
            </div>
          </div>
        {/if}

        {#if newType === 'command'}
          <div>
            <label for="sp-cmd" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">comando RCON</label>
            <input id="sp-cmd" type="text" bind:value={newCommand} placeholder='say "anúncio"' class="mc-input" />
          </div>
        {/if}

        <div>
          <span class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">presets</span>
          <div class="grid grid-cols-2 gap-1">
            {#each presets as p}
              <button type="button" onclick={() => (newCron = p.cron)} class="px-2 py-1.5 text-xs bg-secondary text-white hover:text-mc-yellow"
                style="border: 2px solid #000; box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.15), inset -1px -1px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;">
                {p.label}
              </button>
            {/each}
          </div>
        </div>

        <div>
          <label for="sp-cron" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">cron expression</label>
          <input id="sp-cron" type="text" bind:value={newCron} placeholder="0 4 * * *" class="mc-input font-mono" />
          <p class="text-xs text-white/50 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
            min hour dom mon dow · ex: <span class="text-diamond">0 */6 * * *</span> = a cada 6h
          </p>
        </div>

        <div class="flex gap-2">
          <button type="button" onclick={() => (showAdd = false)} class="mc-btn flex-1">cancelar</button>
          <button type="button" onclick={create} disabled={saving} class="mc-btn mc-btn-primary flex-1">
            {#if saving}<Loader2 class="size-4 animate-spin" />{:else}<Plus class="size-4" />{/if}
            criar
          </button>
        </div>
      </div>
    </section>
  {:else}
    <section class="mc-card flex flex-col items-center justify-center text-center py-12">
      <Clock class="size-12 text-white/40 mb-3" />
      <p class="text-sm text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
        agende tarefas automáticas
      </p>
      <p class="text-xs text-white/50 mt-1 max-w-xs" style="text-shadow: 2px 2px 0 #3f3f3f;">
        backup diário, restart noturno, comandos RCON, etc.
      </p>
      <button type="button" onclick={() => (showAdd = true)} disabled={!!note} class="mc-btn mc-btn-primary mt-4">
        <Plus class="size-4" /> nova tarefa
      </button>
    </section>
  {/if}
</div>
