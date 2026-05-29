<script lang="ts">
  import { Loader2, ShieldCheck, ShieldOff, Key, Check, AlertCircle, RefreshCw } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';

  let { containerName }: { containerName: string } = $props();

  type AuthMode = 'mojang' | 'drasl' | 'offline';

  interface AuthStatus {
    mode: AuthMode;
    onlineMode: boolean;
    draslUrl: string | null;
    jvmOpts: string | null;
  }

  let status = $state<AuthStatus | null>(null);
  let loading = $state(true);
  let switching = $state<AuthMode | null>(null);
  let error = $state<string | null>(null);
  let saved = $state(false);

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch(`/api/servers/${containerName}/auth-mode`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? `erro ${res.status}`);
      }
      status = await res.json();
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha';
    } finally {
      loading = false;
    }
  }

  async function switchTo(mode: AuthMode) {
    if (status?.mode === mode) return;
    if (!confirm(`Mudar pra modo "${mode}"? O server vai ser recriado (volume preservado, vai parar e voltar em ~30s).`)) return;

    switching = mode;
    error = null;
    saved = false;
    try {
      const res = await fetch(`/api/servers/${containerName}/auth-mode`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? `erro ${res.status}`);
      }
      saved = true;
      setTimeout(() => (saved = false), 3000);
      await load();
      await invalidateAll();
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha';
    } finally {
      switching = null;
    }
  }

  load();

  const modes: Array<{
    id: AuthMode;
    label: string;
    desc: string;
    icon: typeof ShieldCheck;
    color: string;
    pros: string[];
    cons: string[];
  }> = [
    {
      id: 'mojang',
      label: 'Mojang/Microsoft',
      desc: 'auth oficial. só players com conta paga entram.',
      icon: ShieldCheck,
      color: 'success',
      pros: ['+ seguro contra impostor', '+ skins/capas oficiais', '+ padrão'],
      cons: ['- só conta paga', '- launchers crackados não funcionam']
    },
    {
      id: 'drasl',
      label: 'Drasl (self-hosted)',
      desc: 'auth via seu próprio Drasl. compatível com Prism Launcher, FjordLauncher, HMCL.',
      icon: Key,
      color: 'mc-yellow',
      pros: ['+ amigos sem Microsoft entram', '+ você controla as contas', '+ skins via Drasl'],
      cons: ['- players precisam launcher compatível com authlib-injector']
    },
    {
      id: 'offline',
      label: 'Offline (cracked)',
      desc: 'qualquer username conecta sem auth. server totalmente aberto.',
      icon: ShieldOff,
      color: 'destructive',
      pros: ['+ qualquer launcher funciona', '+ máxima compatibilidade'],
      cons: ['- impostor pode entrar como qualquer nick', '- sem proteção alguma']
    }
  ];
</script>

<section class="mc-card space-y-4">
  <header class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <ShieldCheck class="size-5 text-mc-yellow" />
      <div>
        <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">MODO DE AUTENTICAÇÃO</h3>
        <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
          como o server valida quem é o player que conecta
        </p>
      </div>
    </div>
    <button type="button" onclick={load} disabled={loading} class="mc-btn text-xs">
      {#if loading}<Loader2 class="size-3 animate-spin" />{:else}<RefreshCw class="size-3" />{/if}
    </button>
  </header>

  {#if loading && !status}
    <div class="text-center py-6"><Loader2 class="size-6 animate-spin mx-auto text-mc-yellow" /></div>
  {:else if error && !status}
    <div class="flex items-center gap-2 text-destructive p-3 bg-black/40 border-2 border-destructive">
      <AlertCircle class="size-5" />
      <span class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{error}</span>
    </div>
  {:else if status}
    {#if saved}
      <div class="p-3 bg-success/20 border-2 border-success">
        <p class="text-sm text-success" style="text-shadow: 2px 2px 0 #3f3f3f;">
          ✓ modo trocado! container recriado. espere ~30s pro server voltar.
        </p>
      </div>
    {/if}

    {#if error}
      <div class="p-3 bg-destructive/20 border-2 border-destructive">
        <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {error}</p>
      </div>
    {/if}

    <div class="grid gap-3 lg:grid-cols-3">
      {#each modes as m}
        {@const active = status.mode === m.id}
        {@const isSwitching = switching === m.id}
        <div
          class="p-4 border-2 {active ? 'border-success bg-success/10' : 'border-black bg-black/40'}"
          style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);"
        >
          <div class="flex items-start gap-2 mb-2">
            <m.icon class="size-5 shrink-0 {active ? 'text-success' : 'text-white/60'}" />
            <div class="flex-1">
              <p class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {m.label}
                {#if active}<span class="text-success text-xs ml-2">✓ ATIVO</span>{/if}
              </p>
              <p class="text-xs text-white/70 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{m.desc}</p>
            </div>
          </div>

          <div class="space-y-1 mt-3 text-[10px]">
            {#each m.pros as p}
              <p class="text-success/80" style="text-shadow: 2px 2px 0 #3f3f3f;">{p}</p>
            {/each}
            {#each m.cons as c}
              <p class="text-white/40" style="text-shadow: 2px 2px 0 #3f3f3f;">{c}</p>
            {/each}
          </div>

          <button
            type="button"
            onclick={() => switchTo(m.id)}
            disabled={active || isSwitching || switching !== null}
            class="mc-btn {active ? '' : 'mc-btn-primary'} w-full mt-3 text-xs"
          >
            {#if isSwitching}
              <Loader2 class="size-3 animate-spin" /> recriando...
            {:else if active}
              <Check class="size-3" /> ativo
            {:else}
              ativar
            {/if}
          </button>
        </div>
      {/each}
    </div>

    {#if status.draslUrl}
      <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">
        Drasl URL atual: <code class="text-diamond">{status.draslUrl}</code>
      </p>
    {/if}

    <p class="text-[10px] text-white/40" style="text-shadow: 2px 2px 0 #3f3f3f;">
      trocar de modo <strong>recria o container</strong> (volume preservado, world e mods intactos).
      o server fica fora do ar por ~30 segundos durante a troca.
    </p>
  {/if}
</section>
