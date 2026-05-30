<script lang="ts">
  import { enhance } from '$app/forms';
  import { t } from '$lib/i18n';
  import { Shield, Wrench, Eye } from 'lucide-svelte';
  import Logo from '$components/mc-icons/Logo.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let submitting = $state(false);

  const roleIcon = $derived(data.role === 'admin' ? Shield : data.role === 'operator' ? Wrench : Eye);
</script>

<svelte:head><title>{t('auth.invite.pageTitle')}</title></svelte:head>

<main class="flex min-h-svh items-center justify-center px-4">
  <div class="w-full max-w-md">
    <div class="mb-8 text-center">
      <div class="flex justify-center">
        <Logo size={1.5} />
      </div>
      <p class="mt-6 text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('auth.invite.invited')}
      </p>
    </div>

    <div class="mc-card mb-4 flex items-center gap-3" style="border-color: var(--color-mc-yellow);">
      {#snippet RoleIcon()}
        {@const Icon = roleIcon}
        <Icon class="size-5" />
      {/snippet}
      <div class="text-mc-yellow">{@render RoleIcon()}</div>
      <div>
        <p class="text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('auth.invite.roleLabel')} <span class="text-mc-yellow">{data.role}</span>
        </p>
        {#if data.note}
          <p class="text-xs text-white/60 mt-0.5" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('auth.invite.noteLabel', { note: data.note })}
          </p>
        {/if}
      </div>
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
      <h2 class="text-lg mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('auth.invite.createHeading')}</h2>

      <div class="space-y-2">
        <label for="username" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('auth.invite.username')}</label>
        <input id="username" name="username" type="text" required minlength="3" maxlength="32" pattern="[a-zA-Z0-9_-]+" autocomplete="username" class="mc-input" />
        <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('auth.invite.usernameHint')}</p>
      </div>

      <div class="space-y-2">
        <label for="password" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('auth.invite.password')}</label>
        <input id="password" name="password" type="password" required minlength="8" autocomplete="new-password" class="mc-input" />
        <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('auth.invite.passwordHint')}</p>
      </div>

      {#if form?.error}
        <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {form.error}</p>
      {/if}

      <button type="submit" disabled={submitting} class="mc-btn mc-btn-primary w-full">
        {submitting ? t('auth.invite.submitting') : t('auth.invite.submit')}
      </button>
    </form>

    <p class="text-xs text-white/50 text-center mt-6" style="text-shadow: 2px 2px 0 #3f3f3f;">
      {t('auth.invite.footer')}
    </p>
  </div>
</main>
