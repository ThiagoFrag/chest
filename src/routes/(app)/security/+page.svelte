<script lang="ts">
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Shield, Loader2, Check, X, Copy, RefreshCw, AlertCircle, Link2, Link2Off } from 'lucide-svelte';

  let { data, form } = $props();

  interface Status {
    enabled: boolean;
    enabledAt: string | null;
  }

  let unlinking = $state(false);

  let status = $state<Status | null>(null);
  let loading = $state(true);
  let setupData = $state<{ qrDataUrl: string; secret: string; otpAuthUrl: string } | null>(null);
  let enableCode = $state('');
  let disableCode = $state('');
  let busy = $state<string | null>(null);
  let error = $state<string | null>(null);
  let backupCodes = $state<string[] | null>(null);
  let copied = $state<string | null>(null);

  async function loadStatus() {
    loading = true;
    try {
      const res = await fetch('/api/auth/totp');
      if (res.ok) status = await res.json();
    } finally {
      loading = false;
    }
  }

  async function startSetup() {
    busy = 'setup';
    error = null;
    try {
      const res = await fetch('/api/auth/totp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? 'falha');
      }
      setupData = await res.json();
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha';
    } finally {
      busy = null;
    }
  }

  async function enable() {
    if (!enableCode.trim()) return;
    busy = 'enable';
    error = null;
    try {
      const res = await fetch('/api/auth/totp', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: enableCode.trim() })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? 'código inválido');
      }
      const data = await res.json();
      backupCodes = data.backupCodes;
      setupData = null;
      enableCode = '';
      await loadStatus();
      await invalidateAll();
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha';
    } finally {
      busy = null;
    }
  }

  async function disable() {
    if (!disableCode.trim()) return;
    if (!confirm('Tem certeza? Isso remove a proteção 2FA da sua conta.')) return;
    busy = 'disable';
    error = null;
    try {
      const res = await fetch('/api/auth/totp', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: disableCode.trim() })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? 'falha');
      }
      disableCode = '';
      backupCodes = null;
      await loadStatus();
      await invalidateAll();
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha';
    } finally {
      busy = null;
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      copied = key;
      setTimeout(() => (copied = null), 1500);
    });
  }

  onMount(() => {
    loadStatus();
  });
</script>

<svelte:head><title>Chest · Segurança</title></svelte:head>

<div class="px-8 py-6 max-w-3xl">
  <div class="mc-banner mb-6 flex items-center gap-4">
    <Shield class="size-10 text-mc-yellow" />
    <div>
      <h1 class="mc-heading text-3xl">SEGURANÇA</h1>
      <p class="mt-1 text-xs text-white/80" style="text-shadow: 2px 2px 0 #3f3f3f;">
        proteja sua conta com autenticação em dois fatores
      </p>
    </div>
  </div>

  <section class="mc-card space-y-4">
    <header class="flex items-start justify-between">
      <div>
        <h2 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">AUTENTICAÇÃO 2FA (TOTP)</h2>
        <p class="text-xs text-white/60 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
          código de 6 dígitos do app autenticador (Google Authenticator, Authy, Aegis, 1Password)
        </p>
      </div>
      {#if loading}
        <Loader2 class="size-5 animate-spin text-white/50" />
      {:else if status?.enabled}
        <span class="inline-flex items-center gap-1 text-success" style="text-shadow: 2px 2px 0 #3f3f3f;">
          <Check class="size-4" /> ativo
        </span>
      {:else}
        <span class="inline-flex items-center gap-1 text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">
          <X class="size-4" /> desativado
        </span>
      {/if}
    </header>

    {#if error}
      <div class="p-3 bg-destructive/20 border-2 border-destructive flex items-start gap-2">
        <AlertCircle class="size-4 text-destructive shrink-0 mt-0.5" />
        <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">{error}</p>
      </div>
    {/if}

    {#if backupCodes}
      <div class="p-4 bg-mc-yellow/10 border-2 border-mc-yellow space-y-3">
        <p class="text-sm text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
          ✓ 2FA ATIVADO! Salve estes códigos de backup em local seguro:
        </p>
        <div class="grid grid-cols-2 gap-2 font-mono text-sm">
          {#each backupCodes as bc}
            <div class="px-3 py-1.5 bg-black/40 border border-black" style="text-shadow: 2px 2px 0 #3f3f3f;">{bc}</div>
          {/each}
        </div>
        <div class="flex gap-2">
          <button type="button" onclick={() => copy(backupCodes!.join('\n'), 'codes')} class="mc-btn text-xs">
            {#if copied === 'codes'}<Check class="size-3 text-success" />{:else}<Copy class="size-3" />{/if}
            copiar todos
          </button>
          <button type="button" onclick={() => (backupCodes = null)} class="mc-btn text-xs">já anotei</button>
        </div>
        <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
          ⚠ cada código pode ser usado <strong>uma vez</strong>. eles substituem o código do app se você perder acesso ao autenticador.
        </p>
      </div>
    {/if}

    {#if !loading}
      {#if status?.enabled && !setupData}
        <div class="space-y-3 border-t-2 border-black pt-4">
          <p class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">
            ativado em <strong>{status.enabledAt ? new Date(status.enabledAt).toLocaleString('pt-BR') : '—'}</strong>
          </p>
          <details>
            <summary class="text-sm text-destructive cursor-pointer" style="text-shadow: 2px 2px 0 #3f3f3f;">
              desativar 2FA
            </summary>
            <div class="mt-3 space-y-2">
              <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
                digite seu código atual pra confirmar
              </p>
              <div class="flex gap-2">
                <input type="text" inputmode="numeric" maxlength="6" bind:value={disableCode} placeholder="123456" class="mc-input flex-1 text-center font-mono" />
                <button type="button" onclick={disable} disabled={!disableCode.trim() || busy === 'disable'} class="mc-btn mc-btn-destructive">
                  {#if busy === 'disable'}<Loader2 class="size-4 animate-spin" />{/if}
                  desativar
                </button>
              </div>
            </div>
          </details>
        </div>
      {:else if setupData}
        <div class="space-y-4 border-t-2 border-black pt-4">
          <div>
            <p class="text-sm mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
              <strong class="text-mc-yellow">1.</strong> Escaneie o QR no seu app autenticador
            </p>
            <div class="flex items-start gap-4">
              <img src={setupData.qrDataUrl} alt="QR code" class="size-48 bg-white p-2" style="image-rendering: pixelated;" />
              <div class="flex-1 space-y-2">
                <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">ou insira manualmente:</p>
                <div class="flex items-center gap-2">
                  <code class="flex-1 text-xs font-mono bg-black/40 px-2 py-1.5 break-all">{setupData.secret}</code>
                  <button type="button" onclick={() => copy(setupData!.secret, 'secret')} class="mc-btn text-xs px-2">
                    {#if copied === 'secret'}<Check class="size-3 text-success" />{:else}<Copy class="size-3" />{/if}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p class="text-sm mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
              <strong class="text-mc-yellow">2.</strong> Digite o código gerado pelo app pra confirmar
            </p>
            <div class="flex gap-2">
              <input type="text" inputmode="numeric" maxlength="6" bind:value={enableCode} placeholder="123456" class="mc-input flex-1 text-center font-mono text-lg tracking-widest" />
              <button type="button" onclick={enable} disabled={!enableCode.trim() || busy === 'enable'} class="mc-btn mc-btn-primary">
                {#if busy === 'enable'}<Loader2 class="size-4 animate-spin" />{/if}
                ativar
              </button>
            </div>
          </div>

          <button type="button" onclick={() => (setupData = null)} class="text-xs text-white/50 hover:text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
            cancelar configuração
          </button>
        </div>
      {:else}
        <div class="border-t-2 border-black pt-4">
          <p class="text-sm text-white/70 mb-3" style="text-shadow: 2px 2px 0 #3f3f3f;">
            adicionar 2FA torna sua conta muito mais segura. mesmo se alguém descobrir sua senha, não consegue entrar sem o código do app.
          </p>
          <button type="button" onclick={startSetup} disabled={busy === 'setup'} class="mc-btn mc-btn-primary">
            {#if busy === 'setup'}<Loader2 class="size-4 animate-spin" />{:else}<Shield class="size-4" />{/if}
            ativar 2FA
          </button>
        </div>
      {/if}
    {/if}
  </section>

  {#if data.discordEnabled}
    <section class="mc-card space-y-4 mt-6">
      <header>
        <h2 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">CONEXÕES</h2>
        <p class="text-xs text-white/60 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
          vincule contas externas pra entrar mais rápido
        </p>
      </header>

      {#if form?.unlink}
        <div class="p-3 bg-destructive/20 border-2 border-destructive flex items-start gap-2" role="alert">
          <AlertCircle class="size-4 text-destructive shrink-0 mt-0.5" />
          <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">{form.unlink}</p>
        </div>
      {/if}

      <div class="border-t-2 border-black pt-4 flex items-center justify-between gap-4 flex-wrap">
        {#if data.discord}
          <div class="flex items-center gap-3 min-w-0">
            {#if data.discord.avatar}
              <img
                src={`https://cdn.discordapp.com/avatars/${data.discord.id}/${data.discord.avatar}.png`}
                alt="avatar do Discord de {data.discord.username}"
                class="size-10 shrink-0 border-2 border-black"
                width="40"
                height="40"
              />
            {:else}
              <div class="size-10 shrink-0 border-2 border-black bg-primary/40 flex items-center justify-center" aria-hidden="true">
                <Link2 class="size-5 text-white/70" />
              </div>
            {/if}
            <div class="min-w-0">
              <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">Discord</p>
              <p class="text-sm truncate" style="text-shadow: 2px 2px 0 #3f3f3f;">
                conectado como <strong class="text-mc-yellow">{data.discord.username ?? data.discord.id}</strong>
              </p>
            </div>
          </div>

          <form
            method="POST"
            action="?/unlinkDiscord"
            use:enhance={() => {
              unlinking = true;
              return async ({ update }) => {
                await update();
                unlinking = false;
                await invalidateAll();
              };
            }}
          >
            <button type="submit" disabled={unlinking} class="mc-btn mc-btn-destructive">
              {#if unlinking}<Loader2 class="size-4 animate-spin" />{:else}<Link2Off class="size-4" />{/if}
              desvincular
            </button>
          </form>
        {:else}
          <div class="flex items-center gap-3">
            <div class="size-10 shrink-0 border-2 border-black bg-black/40 flex items-center justify-center" aria-hidden="true">
              <Link2 class="size-5 text-white/50" />
            </div>
            <p class="text-sm text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
              vincule seu Discord pra entrar com um clique
            </p>
          </div>

          <a
            href="/login/discord?mode=link"
            data-sveltekit-reload
            class="mc-btn mc-btn-primary inline-flex items-center gap-2"
          >
            <Link2 class="size-4" />
            conectar Discord
          </a>
        {/if}
      </div>
    </section>
  {/if}
</div>
