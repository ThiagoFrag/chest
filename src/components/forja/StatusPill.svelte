<script lang="ts">
  import { t } from '$lib/i18n';

  type State = 'running' | 'exited' | 'created' | 'restarting' | 'paused' | 'dead' | 'creating' | 'stopped' | 'failed' | 'deleting';
  let { state }: { state: State } = $props();

  const label = $derived<Record<State, string>>({
    running: t('dashboard.status.running'),
    exited: t('dashboard.status.exited'),
    stopped: t('dashboard.status.stopped'),
    created: t('dashboard.status.created'),
    restarting: t('dashboard.status.restarting'),
    paused: t('dashboard.status.paused'),
    dead: t('dashboard.status.dead'),
    creating: t('dashboard.status.creating'),
    failed: t('dashboard.status.failed'),
    deleting: t('dashboard.status.deleting')
  });

  const bg: Record<State, string> = {
    running: '#5ba34d',
    exited: '#5a5a5a',
    stopped: '#5a5a5a',
    created: '#5a5a5a',
    restarting: '#f0a526',
    paused: '#f0a526',
    dead: '#aa2828',
    creating: '#2eb3a3',
    failed: '#aa2828',
    deleting: '#aa2828'
  };
</script>

<span class="mc-pill" style="background-color: {bg[state]}; color: white;">
  <span
    class="size-2 {state === 'running' || state === 'restarting' || state === 'creating' ? 'mc-pulse' : ''}"
    style="background-color: white;"
  ></span>
  {label[state]}
</span>
