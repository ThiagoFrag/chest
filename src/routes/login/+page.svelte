<script lang="ts">
  import { enhance } from '$app/forms';
  import { t } from '$lib/i18n';
  import Logo from '$components/mc-icons/Logo.svelte';
  import ParallaxBackground from '$components/forja/ParallaxBackground.svelte';
  import type { ActionData, PageData } from './$types';

  let { form, data }: { form: ActionData; data: PageData } = $props();
  let submitting = $state(false);
</script>

<svelte:head>
  <title>{t('auth.login.pageTitle')}</title>
</svelte:head>

<ParallaxBackground />

<main class="relative z-10 flex min-h-svh items-center justify-center px-4">
  <div class="w-full max-w-md">
    <div class="mb-10 text-center">
      <div class="flex justify-center">
        <Logo size={2.2} />
      </div>
      <p class="mt-6 text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('auth.login.tagline')}
      </p>
      <p class="mt-1 text-xs" style="color: #ffff55; text-shadow: 2px 2px 0 #3f3f3f;">
        {t('auth.login.edition')}
      </p>
    </div>

    <form
      method="POST"
      class="mc-card space-y-4"
      use:enhance={() => {
        submitting = true;
        return async ({ update }) => {
          await update();
          submitting = false;
        };
      }}
    >
      <div class="space-y-2">
        <label for="username" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('auth.login.username')}</label>
        <input id="username" name="username" type="text" required autocomplete="username" value={form?.username ?? ''} class="mc-input" />
      </div>

      <div class="space-y-2">
        <label for="password" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('auth.login.password')}</label>
        <input id="password" name="password" type="password" required autocomplete="current-password" class="mc-input" />
      </div>

      {#if form?.error}
        <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {form.error}</p>
      {/if}

      <button type="submit" disabled={submitting} class="mc-btn mc-btn-primary w-full text-lg">
        {submitting ? t('auth.login.submitting') : t('auth.login.submit')}
      </button>
    </form>

    {#if data.discordEnabled}
      {#if data.discordError}
        <p class="mt-4 text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">
          ⚠ {t('auth.login.discordError', { error: data.discordError })}
        </p>
      {/if}

      <div class="mc-divider mt-4" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('auth.login.or')}</div>

      <a
        href="/login/discord"
        class="mc-btn mc-btn-discord w-full mt-4 text-base"
        aria-label={t('auth.login.discordAria')}
        style="text-shadow: 2px 2px 0 #3f3f3f;"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.036A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
          />
        </svg>
        {t('auth.login.discordButton')}
      </a>
    {/if}

    <p class="text-xs text-white/60 text-center mt-6" style="text-shadow: 2px 2px 0 #3f3f3f;">
      {t('auth.login.footer')}
    </p>
  </div>
</main>
