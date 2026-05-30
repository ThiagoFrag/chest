<script lang="ts">
  import { goto } from '$app/navigation';
  import { t } from '$lib/i18n';
  import { Shield, Loader2, AlertCircle } from 'lucide-svelte';
  import Logo from '$components/mc-icons/Logo.svelte';

  let code = $state('');
  let submitting = $state(false);
  let error = $state<string | null>(null);

  async function submit() {
    const clean = code.trim();
    if (!clean) return;
    submitting = true;
    error = null;
    try {
      const res = await fetch('/api/auth/totp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: clean })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? t('auth.twofa.invalidCode'));
      }
      const data = await res.json();
      if (data.usedBackup) {
        alert(t('auth.twofa.backupUsed'));
      }
      goto('/servers');
    } catch (e) {
      error = e instanceof Error ? e.message : t('auth.twofa.genericError');
      submitting = false;
    }
  }
</script>

<svelte:head><title>{t('auth.twofa.pageTitle')}</title></svelte:head>

<main class="flex min-h-svh items-center justify-center px-4">
  <div class="w-full max-w-md">
    <div class="mb-8 text-center">
      <div class="flex justify-center">
        <Logo size={1.5} />
      </div>
      <p class="mt-6 text-sm text-white inline-flex items-center gap-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
        <Shield class="size-4 text-mc-yellow" />
        {t('auth.twofa.heading')}
      </p>
    </div>

    <form onsubmit={(e) => { e.preventDefault(); submit(); }} class="mc-card space-y-4">
      <div class="space-y-2">
        <label for="totp" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('auth.twofa.codeLabel')}
        </label>
        <input
          id="totp"
          name="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="15"
          required
          bind:value={code}
          placeholder={t('auth.twofa.placeholder')}
          class="mc-input text-center font-mono text-xl tracking-widest"
        />
        <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('auth.twofa.hintBefore')} <code class="text-mc-yellow">xxxxx-xxxxx</code>{t('auth.twofa.hintAfter')}
        </p>
      </div>

      {#if error}
        <div class="p-3 bg-destructive/20 border-2 border-destructive flex items-start gap-2">
          <AlertCircle class="size-4 text-destructive shrink-0 mt-0.5" />
          <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">{error}</p>
        </div>
      {/if}

      <button type="submit" disabled={submitting || !code.trim()} class="mc-btn mc-btn-primary w-full">
        {#if submitting}<Loader2 class="size-4 animate-spin" />{/if}
        {t('auth.twofa.submit')}
      </button>

      <a href="/logout" class="block text-center text-xs text-white/50 hover:text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('auth.twofa.logout')}
      </a>
    </form>
  </div>
</main>
