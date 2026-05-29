<script lang="ts">
  import { enhance } from '$app/forms';
  import Logo from '$components/mc-icons/Logo.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
  let submitting = $state(false);
</script>

<svelte:head>
  <title>Chest · Entrar</title>
</svelte:head>

<main class="flex min-h-svh items-center justify-center px-4">
  <div class="w-full max-w-md">
    <div class="mb-10 text-center">
      <div class="flex justify-center">
        <Logo size={2.2} />
      </div>
      <p class="mt-6 text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
        painel de servidores minecraft
      </p>
      <p class="mt-1 text-xs" style="color: #ffff55; text-shadow: 2px 2px 0 #3f3f3f;">
        community edition · v0.1.0
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
        <label for="username" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">usuário</label>
        <input id="username" name="username" type="text" required autocomplete="username" value={form?.username ?? ''} class="mc-input" />
      </div>

      <div class="space-y-2">
        <label for="password" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">senha</label>
        <input id="password" name="password" type="password" required autocomplete="current-password" class="mc-input" />
      </div>

      {#if form?.error}
        <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {form.error}</p>
      {/if}

      <button type="submit" disabled={submitting} class="mc-btn mc-btn-primary w-full text-lg">
        {submitting ? 'entrando...' : 'entrar no jogo'}
      </button>
    </form>

    <p class="text-xs text-white/60 text-center mt-6" style="text-shadow: 2px 2px 0 #3f3f3f;">
      open source · AGPL-3.0
    </p>
  </div>
</main>
