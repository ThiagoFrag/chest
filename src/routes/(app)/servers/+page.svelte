<script lang="ts">
  import ServerCard from '$components/forja/ServerCard.svelte';
  import { Plus } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import { t, plural } from '$lib/i18n';
  let { data } = $props();
</script>

<svelte:head><title>{t('dashboard.list.title')}</title></svelte:head>

<div class="px-8 py-6">
  <div class="mc-banner mb-6 flex items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <MCTexture src="/textures/item/diamond_pickaxe.png" size={48} alt="" />
      <div>
        <h1 class="mc-heading text-3xl">{t('dashboard.list.heading')}</h1>
        <p class="mt-1 text-xs text-white/80" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('dashboard.list.subtitle')} <span class="text-diamond">forja.managed=true</span>
        </p>
      </div>
    </div>
    <div class="flex gap-2">
      <a href="/servers/templates" class="mc-btn mc-btn-accent">
        {t('dashboard.list.templates')}
      </a>
      <a href="/servers/new" class="mc-btn mc-btn-primary">
        <Plus class="size-4" />
        {t('dashboard.list.new')}
      </a>
    </div>
  </div>

  {#if data.servers.length === 0}
    <div class="mc-card text-center py-16">
      <div class="flex justify-center mb-4 opacity-60">
        <MCTexture src="/textures/item/ender_eye.png" size={64} alt="" />
      </div>
      <p class="text-lg text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('dashboard.list.emptyTitle')}
      </p>
      <p class="mt-2 text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('dashboard.list.emptyDesc')} <span class="text-diamond">forja.managed=true</span> {t('dashboard.list.emptyDescTail')}
      </p>
      <a href="/servers/new" class="mc-btn mc-btn-primary mt-6 inline-flex">
        <Plus class="size-4" />
        {t('dashboard.list.createFirst')}
      </a>
    </div>
  {:else}
    <p class="text-sm text-white/70 mb-4" style="text-shadow: 2px 2px 0 #3f3f3f;">
      {plural(data.servers.length, { one: t('dashboard.list.count.one'), other: t('dashboard.list.count.other') })}
    </p>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each data.servers as server (server.id)}
        <ServerCard {server} showHost={data.hasMultipleHosts} />
      {/each}
    </div>
  {/if}
</div>
