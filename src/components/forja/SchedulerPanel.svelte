<script lang="ts">
  import { Plus, Trash2, Power, Loader2, Clock, Save, Square, RotateCw, Terminal } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import { t, plural, formatDate } from '$lib/i18n';

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

  const presets = $derived([
    { id: 'hourly', label: t('integrations.scheduler.preset.hourly'), cron: '0 * * * *' },
    { id: 'every6h', label: t('integrations.scheduler.preset.every6h'), cron: '0 */6 * * *' },
    { id: 'every12h', label: t('integrations.scheduler.preset.every12h'), cron: '0 */12 * * *' },
    { id: 'daily3am', label: t('integrations.scheduler.preset.daily3am'), cron: '0 3 * * *' },
    { id: 'daily4am', label: t('integrations.scheduler.preset.daily4am'), cron: '0 4 * * *' },
    { id: 'daily6am', label: t('integrations.scheduler.preset.daily6am'), cron: '0 6 * * *' },
    { id: 'weeklySunday3am', label: t('integrations.scheduler.preset.weeklySunday3am'), cron: '0 3 * * 0' }
  ]);

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
        alert(t('integrations.scheduler.alert.createError', { error: err.message ?? res.status }));
      }
    } finally {
      saving = false;
    }
  }

  async function toggle(task: Task) {
    pending = task.id;
    try {
      await fetch(`/api/servers/${containerName}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: !task.enabled })
      });
      task.enabled = !task.enabled;
      tasks = tasks;
    } finally {
      pending = null;
    }
  }

  async function remove(task: Task) {
    if (!confirm(t('integrations.scheduler.confirm.delete'))) return;
    pending = task.id;
    try {
      await fetch(`/api/servers/${containerName}/tasks/${task.id}`, { method: 'DELETE' });
      tasks = tasks.filter((x) => x.id !== task.id);
    } finally {
      pending = null;
    }
  }

  function fmtDate(ts: number | null): string {
    return ts ? formatDate(ts * 1000, { dateStyle: 'short', timeStyle: 'short' }) : '—';
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
      {t('integrations.scheduler.note.wizardHintBefore')} "{t('integrations.scheduler.note.wizardHintButton')}"{t('integrations.scheduler.note.wizardHintAfter')}
    </p>
  </div>
{/if}

<div class="grid gap-6 lg:grid-cols-2">
  <section class="mc-card">
    <header class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="mc-slot"><MCTexture src="/textures/item/iron_pickaxe.png" size={24} /></div>
        <div>
          <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.scheduler.list.title')}</h3>
          <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {plural(tasks.length, {
              one: t('integrations.scheduler.list.count.one'),
              other: t('integrations.scheduler.list.count.other')
            })}
          </p>
        </div>
      </div>
      <button type="button" onclick={() => (showAdd = true)} disabled={!!note} class="mc-btn mc-btn-primary text-xs py-1.5 px-3">
        <Plus class="size-3.5" /> {t('integrations.scheduler.list.new')}
      </button>
    </header>

    {#if loading}
      <div class="text-center py-8"><Loader2 class="size-6 animate-spin mx-auto text-white/60" /></div>
    {:else if tasks.length === 0}
      <p class="text-sm text-white/60 text-center py-8" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('integrations.scheduler.list.empty')}
      </p>
    {:else}
      <ul class="space-y-2">
        {#each tasks as task (task.id)}
          <li class="flex items-start gap-3 px-3 py-3 bg-black/40 border-2 border-black" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
            <button type="button" onclick={() => toggle(task)} disabled={pending === task.id} title={task.enabled ? t('integrations.scheduler.task.toggleDisable') : t('integrations.scheduler.task.toggleEnable')}>
              <Power class="size-4 mt-1 {task.enabled ? 'text-success' : 'text-white/30'}" />
            </button>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white flex items-center gap-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {#if task.taskType === 'backup'}<Save class="size-3.5 text-diamond" /> backup{/if}
                {#if task.taskType === 'restart'}<RotateCw class="size-3.5 text-warning" /> restart{/if}
                {#if task.taskType === 'command'}<Terminal class="size-3.5 text-accent" /> command{/if}
                <span class="text-xs text-white/50 ml-2">{fmtParams(task.params)}</span>
              </p>
              <p class="text-xs text-diamond mt-1 font-mono">{task.cronExpr}</p>
              <p class="text-xs text-white/40 mt-1">
                {t('integrations.scheduler.task.lastBefore')} <span class={task.lastRunStatus === 'ok' ? 'text-success' : 'text-warning'}>{fmtDate(task.lastRunAt)}</span>
                · {t('integrations.scheduler.task.nextBefore')} <span class="text-white/60">{fmtDate(task.nextRunAt)}</span>
              </p>
            </div>
            <button type="button" onclick={() => remove(task)} disabled={pending === task.id} class="text-destructive hover:text-mc-yellow" title={t('integrations.scheduler.task.delete')}>
              <Trash2 class="size-3.5" />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  {#if showAdd}
    <section class="mc-card">
      <h3 class="text-lg mb-4" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.scheduler.form.title')}</h3>

      <div class="space-y-3">
        <div>
          <span class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.scheduler.form.typeLabel')}</span>
          <div class="grid grid-cols-3 gap-1">
            {#each [{ id: 'backup', l: t('integrations.scheduler.form.type.backup') }, { id: 'restart', l: t('integrations.scheduler.form.type.restart') }, { id: 'command', l: t('integrations.scheduler.form.type.command') }] as opt}
              <button type="button" onclick={() => (newType = opt.id as typeof newType)}
                class="px-3 py-2 text-xs {newType === opt.id ? 'bg-primary text-white' : 'bg-secondary text-white'}"
                style="border: 2px solid #000; box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.15), inset -1px -1px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;">
                {opt.l}
              </button>
            {/each}
          </div>
        </div>

        {#if newType === 'backup'}
          <div>
            <span class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.scheduler.form.scopeLabel')}</span>
            <div class="grid grid-cols-2 gap-1">
              <button type="button" onclick={() => (newScope = 'world')} class="px-3 py-2 text-xs {newScope === 'world' ? 'bg-primary text-white' : 'bg-secondary text-white'}"
                style="border: 2px solid #000; box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.15), inset -1px -1px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.scheduler.form.scope.world')}</button>
              <button type="button" onclick={() => (newScope = 'full')} class="px-3 py-2 text-xs {newScope === 'full' ? 'bg-primary text-white' : 'bg-secondary text-white'}"
                style="border: 2px solid #000; box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.15), inset -1px -1px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.scheduler.form.scope.full')}</button>
            </div>
          </div>
        {/if}

        {#if newType === 'command'}
          <div>
            <label for="sp-cmd" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.scheduler.form.commandLabel')}</label>
            <input id="sp-cmd" type="text" bind:value={newCommand} placeholder={t('integrations.scheduler.form.commandPlaceholder')} class="mc-input" />
          </div>
        {/if}

        <div>
          <span class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.scheduler.form.presetsLabel')}</span>
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
          <label for="sp-cron" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.scheduler.form.cronLabel')}</label>
          <input id="sp-cron" type="text" bind:value={newCron} placeholder="0 4 * * *" class="mc-input font-mono" />
          <p class="text-xs text-white/50 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.scheduler.form.cronHintBefore')} <span class="text-diamond">0 */6 * * *</span> {t('integrations.scheduler.form.cronHintAfter')}
          </p>
        </div>

        <div class="flex gap-2">
          <button type="button" onclick={() => (showAdd = false)} class="mc-btn flex-1">{t('integrations.scheduler.form.cancel')}</button>
          <button type="button" onclick={create} disabled={saving} class="mc-btn mc-btn-primary flex-1">
            {#if saving}<Loader2 class="size-4 animate-spin" />{:else}<Plus class="size-4" />{/if}
            {t('integrations.scheduler.form.create')}
          </button>
        </div>
      </div>
    </section>
  {:else}
    <section class="mc-card flex flex-col items-center justify-center text-center py-12">
      <Clock class="size-12 text-white/40 mb-3" />
      <p class="text-sm text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('integrations.scheduler.empty.title')}
      </p>
      <p class="text-xs text-white/50 mt-1 max-w-xs" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('integrations.scheduler.empty.subtitle')}
      </p>
      <button type="button" onclick={() => (showAdd = true)} disabled={!!note} class="mc-btn mc-btn-primary mt-4">
        <Plus class="size-4" /> {t('integrations.scheduler.empty.new')}
      </button>
    </section>
  {/if}
</div>
