<script lang="ts">
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import { t } from '$lib/i18n';
  let { data } = $props();
  const counts = $derived(data.counts);
</script>

<svelte:head><title>{t('dashboard.title')}</title></svelte:head>

<div class="px-8 py-6">
  <div class="mc-banner mb-6 flex items-center gap-4">
    <MCTexture src="/textures/block/grass_block_top.png" size={48} alt="grass" />
    <div>
      <h1 class="mc-heading text-3xl">{t('dashboard.heading')}</h1>
      <p class="mt-1 text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('dashboard.welcome')} <span class="text-primary">{data.user.username}</span>
      </p>
    </div>
  </div>

  <div class="grid gap-4 md:grid-cols-4 mb-6">
    <div class="mc-card">
      <div class="flex items-center gap-3 mb-3">
        <div class="mc-slot">
          <MCTexture src="/textures/item/diamond_pickaxe.png" size={24} alt="" />
        </div>
        <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('dashboard.cards.servers')}</p>
      </div>
      <p class="mc-heading text-3xl">{counts.total}</p>
      <p class="text-xs text-white/70 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
        <span class="text-success">{counts.running}</span> {t('dashboard.cards.serversOnline')}
      </p>
    </div>

    <div class="mc-card">
      <div class="flex items-center gap-3 mb-3">
        <div class="mc-slot">
          <MCTexture src="/textures/item/diamond_sword.png" size={24} alt="" />
        </div>
        <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('dashboard.cards.players')}</p>
      </div>
      <p class="mc-heading text-3xl">
        <span class="text-success">{counts.playersOnline}</span>
        <span class="text-white/40 text-xl">/ {counts.playersMax}</span>
      </p>
      <p class="text-xs text-white/70 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('dashboard.cards.playersOnline')}</p>
    </div>

    <div class="mc-card">
      <div class="flex items-center gap-3 mb-3">
        <div class="mc-slot">
          <MCTexture src="/textures/item/diamond.png" size={24} alt="" />
        </div>
        <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('dashboard.cards.chest')}</p>
      </div>
      <p class="mc-heading text-xl text-diamond">v0.1.0</p>
      <p class="text-xs text-white/70 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('dashboard.cards.chestEdition')}</p>
    </div>

    <div class="mc-card">
      <div class="flex items-center gap-3 mb-3">
        <div class="mc-slot mc-torch">
          <MCTexture src="/textures/item/redstone.png" size={24} alt="" />
        </div>
        <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('dashboard.cards.status')}</p>
      </div>
      <p class="mc-heading text-xl text-success">ONLINE</p>
      <p class="text-xs text-white/70 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('dashboard.cards.statusHealthy')}</p>
    </div>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <a href="/servers/new" class="mc-card mc-card-hover">
      <div class="flex items-center gap-4">
        <div class="mc-slot">
          <MCTexture src="/textures/item/iron_pickaxe.png" size={32} alt="" />
        </div>
        <div>
          <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('dashboard.actions.newTitle')}</h3>
          <p class="text-xs text-white/70 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('dashboard.actions.newDesc')}
          </p>
        </div>
      </div>
    </a>
    <a href="/servers" class="mc-card mc-card-hover">
      <div class="flex items-center gap-4">
        <div class="mc-slot">
          <MCTexture src="/textures/item/ender_eye.png" size={32} alt="" />
        </div>
        <div>
          <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('dashboard.actions.manageTitle')}</h3>
          <p class="text-xs text-white/70 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('dashboard.actions.manageDesc')}
          </p>
        </div>
      </div>
    </a>
  </div>
</div>
