<script lang="ts">
  type State = 'running' | 'exited' | 'created' | 'restarting' | 'paused' | 'dead' | 'creating' | 'stopped' | 'failed' | 'deleting';
  let { state }: { state: State } = $props();

  const label: Record<State, string> = {
    running: 'online',
    exited: 'offline',
    stopped: 'offline',
    created: 'criado',
    restarting: 'restart',
    paused: 'pausado',
    dead: 'morto',
    creating: 'criando',
    failed: 'falhou',
    deleting: 'deletando'
  };

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
