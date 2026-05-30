<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { ShieldAlert, Check, X, RefreshCw, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import { t, formatNumber, formatDate } from '$lib/i18n';

  let { data } = $props();

  const events = $derived(data.events);
  const total = $derived(data.total);
  const pageNum = $derived(data.page);
  const pages = $derived(data.pages);

  import { untrack } from 'svelte';
  const initialFilters = untrack(() => data.filters);
  let actionFilter = $state(initialFilters.action ?? '');
  let usernameFilter = $state(initialFilters.username ?? '');
  let statusFilter = $state(initialFilters.status ?? '');

  function applyFilters() {
    const params = new URLSearchParams();
    if (actionFilter) params.set('action', actionFilter);
    if (usernameFilter) params.set('username', usernameFilter);
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', '1');
    goto(`/audit?${params}`);
  }

  function clearFilters() {
    goto('/audit');
  }

  function goToPage(n: number) {
    const params = new URLSearchParams(page.url.searchParams);
    params.set('page', String(n));
    goto(`/audit?${params}`);
  }

  function formatTimestamp(ts: Date | string | number): string {
    const d = typeof ts === 'object' ? ts : new Date(ts);
    return formatDate(d, { dateStyle: 'short', timeStyle: 'medium', hour12: false });
  }

  function actionColor(action: string): string {
    if (action.startsWith('auth.')) return 'text-mc-yellow';
    if (action.includes('delete') || action.includes('remove')) return 'text-destructive';
    if (action.includes('create') || action.includes('start')) return 'text-success';
    return 'text-diamond';
  }
</script>

<svelte:head><title>{t('admin.audit.head')}</title></svelte:head>

<div class="px-8 py-6">
  <div class="mc-banner mb-6 flex items-center gap-4">
    <ShieldAlert class="size-10 text-mc-yellow" />
    <div>
      <h1 class="mc-heading text-3xl">{t('admin.audit.title')}</h1>
      <p class="mt-1 text-xs text-white/80" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('admin.audit.subtitle', { count: formatNumber(total), page: pageNum, pages: pages || 1 })}
      </p>
    </div>
  </div>

  <section class="mc-card mb-4">
    <div class="grid gap-3 sm:grid-cols-4 items-end">
      <div>
        <label for="audit-action" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.audit.filter.actionLabel')}</label>
        <input
          id="audit-action"
          type="text"
          list="action-list"
          bind:value={actionFilter}
          placeholder={t('admin.audit.filter.actionPlaceholder')}
          class="mc-input text-sm"
          onkeydown={(e) => e.key === 'Enter' && applyFilters()}
        />
        <datalist id="action-list">
          {#each data.knownActions as a}
            <option value={a}></option>
          {/each}
        </datalist>
      </div>
      <div>
        <label for="audit-user" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.audit.filter.userLabel')}</label>
        <input
          id="audit-user"
          type="text"
          bind:value={usernameFilter}
          placeholder={t('admin.audit.filter.userPlaceholder')}
          class="mc-input text-sm"
          onkeydown={(e) => e.key === 'Enter' && applyFilters()}
        />
      </div>
      <div>
        <label for="audit-status" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.audit.filter.statusLabel')}</label>
        <select id="audit-status" bind:value={statusFilter} class="mc-input text-sm">
          <option value="">{t('admin.audit.filter.statusAll')}</option>
          <option value="ok">ok</option>
          <option value="fail">fail</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button type="button" onclick={applyFilters} class="mc-btn mc-btn-primary flex-1">
          {t('admin.audit.filter.apply')}
        </button>
        <button type="button" onclick={clearFilters} class="mc-btn">
          {t('admin.audit.filter.clear')}
        </button>
      </div>
    </div>
  </section>

  {#if events.length === 0}
    <div class="mc-card text-center py-12">
      <RefreshCw class="size-8 text-white/30 mx-auto" />
      <p class="text-sm text-white/60 mt-3" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('admin.audit.empty')}
      </p>
    </div>
  {:else}
    <div class="mc-card overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-white/60 border-b-2 border-black">
            <th class="pb-2 pr-3" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.audit.col.when')}</th>
            <th class="pb-2 pr-3" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.audit.col.who')}</th>
            <th class="pb-2 pr-3" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.audit.col.action')}</th>
            <th class="pb-2 pr-3" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.audit.col.resource')}</th>
            <th class="pb-2 pr-3" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.audit.col.ip')}</th>
            <th class="pb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.audit.col.status')}</th>
          </tr>
        </thead>
        <tbody>
          {#each events as e (e.id)}
            <tr class="border-b border-black/40 hover:bg-stone/30">
              <td class="py-2 pr-3 font-mono text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{formatTimestamp(e.timestamp)}</td>
              <td class="py-2 pr-3" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {#if e.username}
                  <span class="inline-flex items-center gap-1">
                    <UserIcon class="size-3 text-mc-yellow" />
                    {e.username}
                  </span>
                {:else}
                  <span class="text-white/40">—</span>
                {/if}
              </td>
              <td class="py-2 pr-3 font-mono {actionColor(e.action)}" style="text-shadow: 2px 2px 0 #3f3f3f;">{e.action}</td>
              <td class="py-2 pr-3" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {#if e.resourceId}
                  <span class="text-white/80">{e.resourceType}/{e.resourceId}</span>
                {:else}
                  <span class="text-white/40">—</span>
                {/if}
              </td>
              <td class="py-2 pr-3 font-mono text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">{e.ipAddress ?? '—'}</td>
              <td class="py-2">
                {#if e.status === 'ok'}
                  <span class="inline-flex items-center gap-1 text-success" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    <Check class="size-3" /> ok
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-1 text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    <X class="size-3" /> fail
                  </span>
                {/if}
              </td>
            </tr>
            {#if e.details}
              <tr class="bg-black/20">
                <td colspan="6" class="px-3 py-1 text-[10px] text-white/40 font-mono break-all" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  {e.details}
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>

    {#if pages > 1}
      <nav class="flex items-center justify-center gap-2 mt-4">
        <button
          type="button"
          onclick={() => goToPage(pageNum - 1)}
          disabled={pageNum <= 1}
          class="mc-btn text-xs"
        >
          <ChevronLeft class="size-3" /> {t('admin.audit.page.prev')}
        </button>
        <span class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('admin.audit.page.info', { page: pageNum, pages })}
        </span>
        <button
          type="button"
          onclick={() => goToPage(pageNum + 1)}
          disabled={pageNum >= pages}
          class="mc-btn text-xs"
        >
          {t('admin.audit.page.next')} <ChevronRight class="size-3" />
        </button>
      </nav>
    {/if}
  {/if}
</div>
