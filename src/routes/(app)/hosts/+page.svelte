<script lang="ts">
  import { Server, Plus, Trash2, Loader2, Plug, Pencil, X } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import { t } from '$lib/i18n';

  const LOCAL_HOST_ID = 'local';

  let { data, form } = $props();

  let showCreate = $state(false);
  let editingId = $state<string | null>(null);
  let creating = $state(false);
  let savingId = $state<string | null>(null);
  let testingId = $state<string | null>(null);
  let removingId = $state<string | null>(null);

  type TestState = { ok: boolean; version?: string; error?: string };
  let testResults = $state<Record<string, TestState>>({});

  function isLocal(id: string) {
    return id === LOCAL_HOST_ID;
  }
</script>

<svelte:head><title>{t('hosts.head')}</title></svelte:head>

<div class="px-8 py-6">
  <div class="mc-banner mb-6 flex items-center gap-4">
    <Server class="size-10 text-mc-yellow" />
    <div>
      <h1 class="mc-heading text-3xl">{t('hosts.title')}</h1>
      <p class="mt-1 text-xs text-white/80" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('hosts.subtitle')}
      </p>
    </div>
  </div>

  {#if form?.message}
    <div class="mb-4 p-3 bg-destructive/30 border-2 border-black text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
      {t('hosts.error', { message: form.message })}
    </div>
  {/if}

  <section class="mc-card mb-6">
    <header class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('hosts.list.title')}</h3>
      </div>
    </header>

    {#if data.hosts.length === 0}
      <p class="text-sm text-white/60 text-center py-6" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('hosts.list.empty')}
      </p>
    {:else}
      <ul class="space-y-2">
        {#each data.hosts as host (host.id)}
          {@const result = testResults[host.id]}
          <li class="px-3 py-3 bg-black/40 border-2 border-black" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
            {#if editingId === host.id}
              <form
                method="POST"
                action="?/updateHost"
                use:enhance={() => {
                  savingId = host.id;
                  return async ({ update }) => {
                    await update();
                    savingId = null;
                    editingId = null;
                  };
                }}
                class="space-y-3"
              >
                <input type="hidden" name="id" value={host.id} />
                <div class="grid gap-3 md:grid-cols-2">
                  <div>
                    <label for="edit-name-{host.id}" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('hosts.form.name.label')}</label>
                    <input id="edit-name-{host.id}" name="name" type="text" value={host.name} required class="mc-input" />
                  </div>
                  <div>
                    <label for="edit-endpoint-{host.id}" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('hosts.form.endpoint.label')}</label>
                    <input id="edit-endpoint-{host.id}" name="endpoint" type="text" value={host.endpoint} required class="mc-input font-mono" />
                  </div>
                </div>
                <div>
                  <label for="edit-addr-{host.id}" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('hosts.form.hostAddress.label')}</label>
                  <input id="edit-addr-{host.id}" name="hostAddress" type="text" value={host.hostAddress ?? ''} placeholder={t('hosts.form.hostAddress.placeholder')} class="mc-input" />
                  <p class="text-xs text-white/40 mt-1">{t('hosts.form.hostAddress.help')}</p>
                </div>

                <details class="border-2 border-black bg-black/30 p-3">
                  <summary class="text-xs text-white/70 cursor-pointer" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('hosts.form.tls.title')}</summary>
                  <p class="text-xs text-white/40 my-2">{t('hosts.form.tls.help')} · {t('hosts.form.tls.keep')}</p>
                  <div class="space-y-2">
                    <div>
                      <label for="edit-ca-{host.id}" class="block text-xs text-white/70 mb-1">{t('hosts.form.tlsCa.label')}</label>
                      <textarea id="edit-ca-{host.id}" name="tlsCa" rows="2" placeholder={t('hosts.form.tls.placeholder')} class="mc-input font-mono text-xs"></textarea>
                    </div>
                    <div>
                      <label for="edit-cert-{host.id}" class="block text-xs text-white/70 mb-1">{t('hosts.form.tlsCert.label')}</label>
                      <textarea id="edit-cert-{host.id}" name="tlsCert" rows="2" placeholder={t('hosts.form.tls.placeholder')} class="mc-input font-mono text-xs"></textarea>
                    </div>
                    <div>
                      <label for="edit-key-{host.id}" class="block text-xs text-white/70 mb-1">{t('hosts.form.tlsKey.label')}</label>
                      <textarea id="edit-key-{host.id}" name="tlsKey" rows="2" placeholder={t('hosts.form.tls.placeholder')} class="mc-input font-mono text-xs"></textarea>
                    </div>
                  </div>
                </details>

                {#if !isLocal(host.id)}
                  <label class="flex items-center gap-2 text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    <input type="checkbox" name="enabled" checked={host.enabled} />
                    {t('hosts.form.enabled.label')}
                  </label>
                {/if}

                <div class="flex gap-2">
                  <button type="button" onclick={() => (editingId = null)} class="mc-btn flex-1">{t('hosts.cancel')}</button>
                  <button type="submit" disabled={savingId === host.id} class="mc-btn mc-btn-primary flex-1">
                    {#if savingId === host.id}<Loader2 class="size-4 animate-spin" /> {t('hosts.saving')}{:else}{t('hosts.save')}{/if}
                  </button>
                </div>
              </form>
            {:else}
              <div class="flex items-start gap-3">
                <div class="mc-slot shrink-0"><Server class="size-5 text-mc-yellow" /></div>
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">{host.name}</span>
                    {#if host.isDefault}
                      <span class="text-xs px-1.5 py-0.5 bg-primary/40 border-2 border-black text-mc-yellow">{t('hosts.badge.default')}</span>
                    {/if}
                    {#if isLocal(host.id)}
                      <span class="text-xs px-1.5 py-0.5 bg-secondary border-2 border-black text-diamond">{t('hosts.badge.local')}</span>
                    {/if}
                    {#if host.hasTls}
                      <span class="text-xs px-1.5 py-0.5 bg-black/50 border-2 border-black text-white/70">{t('hosts.hasTls')}</span>
                    {/if}
                    <span class="text-xs px-1.5 py-0.5 border-2 border-black {host.enabled ? 'text-success' : 'text-white/40'}">
                      {host.enabled ? t('hosts.status.enabled') : t('hosts.status.disabled')}
                    </span>
                  </div>
                  <p class="text-xs text-white/50 font-mono truncate mt-1">{host.endpoint}</p>
                  {#if host.hostAddress}
                    <p class="text-xs text-white/40 mt-0.5">{t('hosts.field.hostAddress')}: <span class="font-mono">{host.hostAddress}</span></p>
                  {:else}
                    <p class="text-xs text-white/30 mt-0.5">{t('hosts.field.hostAddress')}: {t('hosts.field.hostAddress.none')}</p>
                  {/if}

                  {#if result}
                    <p class="text-xs mt-1.5 {result.ok ? 'text-success' : 'text-destructive'}" style="text-shadow: 2px 2px 0 #3f3f3f;">
                      {#if result.ok}{t('hosts.test.ok', { version: result.version ?? '' })}{:else}{t('hosts.test.fail', { error: result.error ?? '' })}{/if}
                    </p>
                  {/if}
                </div>

                <div class="flex items-center gap-1 shrink-0">
                  <form
                    method="POST"
                    action="?/testConnection"
                    use:enhance={() => {
                      testingId = host.id;
                      return async ({ result, update }) => {
                        if (result.type === 'success' && result.data) {
                          const d = result.data as { ok: boolean; version?: string; error?: string };
                          testResults[host.id] = { ok: d.ok, version: d.version, error: d.error };
                        }
                        await update({ reset: false });
                        testingId = null;
                      };
                    }}
                  >
                    <input type="hidden" name="id" value={host.id} />
                    <button type="submit" disabled={testingId === host.id} class="mc-btn text-xs py-1 px-2" title={t('hosts.test.button')}>
                      {#if testingId === host.id}<Loader2 class="size-3.5 animate-spin" /> {t('hosts.test.testing')}{:else}<Plug class="size-3.5" /> {t('hosts.test.button')}{/if}
                    </button>
                  </form>

                  <button type="button" onclick={() => (editingId = host.id)} class="text-white/60 hover:text-mc-yellow p-1" title={t('hosts.edit')}>
                    <Pencil class="size-4" />
                  </button>

                  {#if !isLocal(host.id)}
                    <form
                      method="POST"
                      action="?/deleteHost"
                      use:enhance={() => {
                        removingId = host.id;
                        return async ({ update }) => {
                          await update();
                          removingId = null;
                        };
                      }}
                      onsubmit={(e) => {
                        if (!confirm(t('hosts.confirmRemove', { name: host.name }))) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={host.id} />
                      <button type="submit" disabled={removingId === host.id} class="text-destructive hover:text-mc-yellow p-1" title={t('hosts.remove')}>
                        {#if removingId === host.id}<Loader2 class="size-4 animate-spin" />{:else}<Trash2 class="size-4" />{/if}
                      </button>
                    </form>
                  {:else}
                    <span class="text-white/20 p-1" title={t('hosts.localCannotRemove')}>
                      <Trash2 class="size-4" />
                    </span>
                  {/if}
                </div>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="mc-card">
    <header class="mb-4 flex items-center justify-between">
      <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('hosts.create.title')}</h3>
      {#if !showCreate}
        <button type="button" onclick={() => (showCreate = true)} class="mc-btn mc-btn-primary text-xs py-1.5 px-3">
          <Plus class="size-3.5" /> {t('hosts.create.button')}
        </button>
      {:else}
        <button type="button" onclick={() => (showCreate = false)} class="text-white/60 hover:text-mc-yellow p-1" title={t('hosts.cancel')}>
          <X class="size-4" />
        </button>
      {/if}
    </header>

    {#if showCreate}
      <form
        method="POST"
        action="?/createHost"
        use:enhance={() => {
          creating = true;
          return async ({ result, update }) => {
            await update();
            creating = false;
            if (result.type === 'success') showCreate = false;
          };
        }}
        class="space-y-3"
      >
        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <label for="new-name" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('hosts.form.name.label')}</label>
            <input id="new-name" name="name" type="text" required placeholder={t('hosts.form.name.placeholder')} class="mc-input" />
          </div>
          <div>
            <label for="new-endpoint" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('hosts.form.endpoint.label')}</label>
            <input id="new-endpoint" name="endpoint" type="text" required placeholder={t('hosts.form.endpoint.placeholder')} class="mc-input font-mono" />
            <p class="text-xs text-white/40 mt-1">{t('hosts.form.endpoint.help')}</p>
          </div>
        </div>

        <div>
          <label for="new-addr" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('hosts.form.hostAddress.label')}</label>
          <input id="new-addr" name="hostAddress" type="text" placeholder={t('hosts.form.hostAddress.placeholder')} class="mc-input" />
          <p class="text-xs text-white/40 mt-1">{t('hosts.form.hostAddress.help')}</p>
        </div>

        <details class="border-2 border-black bg-black/30 p-3">
          <summary class="text-xs text-white/70 cursor-pointer" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('hosts.form.tls.title')}</summary>
          <p class="text-xs text-white/40 my-2">{t('hosts.form.tls.help')}</p>
          <div class="space-y-2">
            <div>
              <label for="new-ca" class="block text-xs text-white/70 mb-1">{t('hosts.form.tlsCa.label')}</label>
              <textarea id="new-ca" name="tlsCa" rows="2" placeholder={t('hosts.form.tls.placeholder')} class="mc-input font-mono text-xs"></textarea>
            </div>
            <div>
              <label for="new-cert" class="block text-xs text-white/70 mb-1">{t('hosts.form.tlsCert.label')}</label>
              <textarea id="new-cert" name="tlsCert" rows="2" placeholder={t('hosts.form.tls.placeholder')} class="mc-input font-mono text-xs"></textarea>
            </div>
            <div>
              <label for="new-key" class="block text-xs text-white/70 mb-1">{t('hosts.form.tlsKey.label')}</label>
              <textarea id="new-key" name="tlsKey" rows="2" placeholder={t('hosts.form.tls.placeholder')} class="mc-input font-mono text-xs"></textarea>
            </div>
          </div>
        </details>

        <div class="flex gap-2">
          <button type="button" onclick={() => (showCreate = false)} class="mc-btn flex-1">{t('hosts.cancel')}</button>
          <button type="submit" disabled={creating} class="mc-btn mc-btn-primary flex-1">
            {#if creating}<Loader2 class="size-4 animate-spin" /> {t('hosts.create.creating')}{:else}<Plus class="size-4" /> {t('hosts.create.button')}{/if}
          </button>
        </div>
      </form>
    {/if}
  </section>
</div>
