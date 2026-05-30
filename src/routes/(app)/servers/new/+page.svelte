<script lang="ts">
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import { ArrowLeft, ArrowRight, Loader2, Check, Globe, Home, Network, AlertCircle, Settings as SettingsIcon, MessageSquare, Server } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import Achievement from '$components/forja/Achievement.svelte';
  import VersionPicker from '$components/forja/VersionPicker.svelte';
  import { t } from '$lib/i18n';

  let { data } = $props();
  const configured = $derived(data.configured);
  const template = $derived(data.template);
  const hosts = $derived(data.hosts);
  const showHostPicker = $derived(hosts.length > 1);

  let hostId = $state('local');
  const selectedHostName = $derived(hosts.find((h) => h.id === hostId)?.name ?? hostId);

  let achievement = $state<{ title: string; desc: string; icon: string } | null>(null);

  type Step = 1 | 2 | 3 | 4 | 5;
  let step = $state<Step>(1);
  let submitting = $state(false);
  let error = $state<string | null>(null);

  const initialTemplate = untrack(() => template);
  let displayName = $state(initialTemplate?.title ?? '');
  let modloaderType = $state<'VANILLA' | 'PAPER' | 'FABRIC' | 'FORGE' | 'NEOFORGE' | 'PURPUR' | 'SPIGOT' | 'QUILT'>(initialTemplate?.loader ?? 'VANILLA');
  let mcVersion = $state(initialTemplate?.mcVersion ?? '1.21.1');
  let memoryGb = $state(initialTemplate?.memoryGb ?? 4);
  let maxPlayers = $state(10);
  let difficulty = $state<'peaceful' | 'easy' | 'normal' | 'hard'>('normal');
  let motd = $state(initialTemplate?.title ?? '');
  let draslEnabled = $state(false);
  let accessMode = $state<'local' | 'domain' | 'playit'>('local');
  let customDomain = $state('');
  let installTemplateMod = $state(!!initialTemplate);

  interface DiscordGuild { id: string; name: string; iconUrl: string | null }
  interface DiscordChannel { id: string; name: string }

  let discordGuilds = $state<DiscordGuild[]>([]);
  let discordChannels = $state<DiscordChannel[]>([]);
  let discordGuildId = $state('');
  let discordChannelId = $state<string | null>(null);
  let discordBotConnected = $state(false);
  let loadingDiscordGuilds = $state(false);
  let loadingDiscordChannels = $state(false);

  async function loadDiscordGuilds() {
    if (!configured.discord) return;
    loadingDiscordGuilds = true;
    try {
      const res = await fetch('/api/discord/status');
      if (res.ok) {
        const s = await res.json();
        discordBotConnected = !!s.connected;
        discordGuilds = s.guilds ?? [];
      }
    } finally {
      loadingDiscordGuilds = false;
    }
  }
  $effect(() => {
    loadDiscordGuilds();
  });

  async function loadDiscordChannels(guildId: string) {
    if (!guildId) {
      discordChannels = [];
      return;
    }
    loadingDiscordChannels = true;
    try {
      const res = await fetch(`/api/discord/channels/${guildId}`);
      if (res.ok) {
        const d = await res.json();
        discordChannels = d.channels ?? [];
      }
    } finally {
      loadingDiscordChannels = false;
    }
  }

  $effect(() => {
    void discordGuildId;
    discordChannelId = null;
    loadDiscordChannels(discordGuildId);
  });

  const loaders = [
    { id: 'VANILLA', label: 'Vanilla', descKey: 'serverdetail.loader.vanilla.desc', tex: '/textures/block/grass_block_top.png' },
    { id: 'PAPER', label: 'Paper', descKey: 'serverdetail.loader.paper.desc', tex: '/textures/item/iron_pickaxe.png' },
    { id: 'FABRIC', label: 'Fabric', descKey: 'serverdetail.loader.fabric.desc', tex: '/textures/item/diamond.png' },
    { id: 'FORGE', label: 'Forge', descKey: 'serverdetail.loader.forge.desc', tex: '/textures/item/iron_ingot.png' },
    { id: 'NEOFORGE', label: 'NeoForge', descKey: 'serverdetail.loader.neoforge.desc', tex: '/textures/item/netherite_ingot.png' },
    { id: 'PURPUR', label: 'Purpur', descKey: 'serverdetail.loader.purpur.desc', tex: '/textures/item/diamond_pickaxe.png' },
    { id: 'SPIGOT', label: 'Spigot', descKey: 'serverdetail.loader.spigot.desc', tex: '/textures/item/gold_ingot.png' },
    { id: 'QUILT', label: 'Quilt', descKey: 'serverdetail.loader.quilt.desc', tex: '/textures/item/emerald.png' }
  ] as const;

  const difficulties = [
    { id: 'peaceful', labelKey: 'serverdetail.difficulty.peaceful' },
    { id: 'easy', labelKey: 'serverdetail.difficulty.easy' },
    { id: 'normal', labelKey: 'serverdetail.difficulty.normal' },
    { id: 'hard', labelKey: 'serverdetail.difficulty.hard' }
  ] as const;

  function canAdvance(): boolean {
    if (step === 1) return displayName.trim().length > 0;
    if (step === 2) return mcVersion.trim().length > 0;
    if (step === 3) return memoryGb >= 1 && maxPlayers >= 1;
    if (step === 4) return accessMode !== 'domain' || customDomain.trim().length > 0;
    return true;
  }

  async function submit() {
    submitting = true;
    error = null;
    try {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          hostId,
          modloaderType,
          mcVersion: mcVersion.trim(),
          memoryMb: memoryGb * 1024,
          maxPlayers,
          difficulty,
          motd: motd.trim() || undefined,
          draslEnabled,
          eggSlug:
            initialTemplate && 'source' in initialTemplate && initialTemplate.source === 'egg'
              ? initialTemplate.slug
              : undefined
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? t('serverdetail.new.error', { status: res.status }));
      }
      const respData = await res.json();

      if (discordChannelId) {
        try {
          await fetch(`/api/servers/${respData.containerName}/discord`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ channelId: discordChannelId })
          });
        } catch {
          /* ignore - usuário pode reconfigurar na tab discord */
        }
      }

      if (template && installTemplateMod) {
        achievement = {
          title: t('serverdetail.new.installingTitle'),
          desc: t('serverdetail.new.installingDesc', { title: template.title }),
          icon: '/textures/item/ender_eye.png'
        };
        try {
          await fetch(`/api/servers/${respData.containerName}/modpack`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ projectId: template.modrinthId })
          });
        } catch {
          /* ignore - usuário pode reinstalar manualmente */
        }
      } else {
        achievement = {
          title: t('serverdetail.new.achievementTitle'),
          desc: t('serverdetail.new.achievementDesc', { name: displayName }),
          icon: '/textures/item/emerald.png'
        };
      }

      setTimeout(() => goto(`/servers/${respData.containerName}`), 2200);
    } catch (e) {
      error = e instanceof Error ? e.message : t('serverdetail.new.errorFallback');
      submitting = false;
    }
  }

  const steps = [
    { n: 1, labelKey: 'serverdetail.step.info' },
    { n: 2, labelKey: 'serverdetail.step.modloader' },
    { n: 3, labelKey: 'serverdetail.step.resources' },
    { n: 4, labelKey: 'serverdetail.step.access' },
    { n: 5, labelKey: 'serverdetail.step.confirm' }
  ];
</script>

<svelte:head><title>Chest · Novo Server</title></svelte:head>

{#if achievement}
  <Achievement {...achievement} onclose={() => (achievement = null)} />
{/if}

<div class="px-8 py-6 max-w-3xl">
  <a href="/servers" class="text-xs text-white/70 hover:text-mc-yellow inline-flex items-center gap-1 mb-3" style="text-shadow: 2px 2px 0 #3f3f3f;">
    <ArrowLeft class="size-3" /> {t('serverdetail.nav.back')}
  </a>

  <div class="mc-banner mb-6 flex items-center gap-4">
    {#if template}
      <img src={template.iconUrl} alt={template.title} class="size-12" style="image-rendering: pixelated;" />
    {:else}
      <MCTexture src="/textures/item/iron_pickaxe.png" size={48} alt="" />
    {/if}
    <div>
      <h1 class="mc-heading text-3xl">{template ? template.title.toUpperCase() : t('serverdetail.new.title')}</h1>
      {#if template}
        <p class="text-xs text-mc-yellow mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('serverdetail.new.templateMeta', { title: template.title, loader: template.loader, version: template.mcVersion })}
        </p>
      {/if}
    </div>
  </div>

  <div class="flex gap-1 mb-6">
    {#each steps as s}
      <div class="flex-1">
        <div class="h-2 border-2 border-black {s.n <= step ? 'bg-primary' : 'bg-stone'}" style="box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.2), inset -1px -1px 0 0 rgba(0,0,0,0.4);"></div>
        <p class="text-xs mt-1 text-center {s.n <= step ? 'text-primary' : 'text-white/50'}" style="text-shadow: 2px 2px 0 #3f3f3f;">{t(s.labelKey)}</p>
      </div>
    {/each}
  </div>

  <div class="mc-card space-y-5">
    {#if step === 1}
      <div class="space-y-4">
        <h2 class="mc-heading text-2xl">{t('serverdetail.step1.heading')}</h2>
        <div class="space-y-2">
          <label for="name" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.step1.nameLabel')}</label>
          <!-- svelte-ignore a11y_autofocus -->
          <input id="name" type="text" bind:value={displayName} placeholder={t('serverdetail.step1.namePlaceholder')} class="mc-input" autofocus />
          <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('serverdetail.step1.containerPrefix')} <span class="text-diamond">forja-{displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || '...'}</span>
          </p>
        </div>

        {#if showHostPicker}
          <div class="space-y-2">
            <label for="host" class="flex items-center gap-2 text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">
              <Server class="size-4 text-diamond" /> {t('serverdetail.step1.hostLabel')}
            </label>
            <select id="host" bind:value={hostId} class="mc-input text-sm">
              {#each hosts as h}
                <option value={h.id}>{h.name}</option>
              {/each}
            </select>
            <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
              {t('serverdetail.step1.hostHint')}
            </p>
          </div>
        {/if}
      </div>
    {:else if step === 2}
      <div class="space-y-4">
        <h2 class="mc-heading text-2xl">{t('serverdetail.step2.heading')}</h2>

        <div class="space-y-2">
          <span class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.step2.typeLabel')}</span>
          <div class="grid grid-cols-2 gap-2">
            {#each loaders as l}
              <button
                type="button"
                onclick={() => (modloaderType = l.id)}
                class="text-left px-3 py-3 flex items-center gap-3 {modloaderType === l.id ? 'bg-primary text-white' : 'bg-secondary text-white hover:bg-stone'}"
                style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
              >
                <div class="mc-slot shrink-0" style="padding: 2px;">
                  <MCTexture src={l.tex} size={24} alt="" />
                </div>
                <div>
                  <div class="text-sm">{l.label}</div>
                  <div class="text-xs opacity-80">{t(l.descKey)}</div>
                </div>
              </button>
            {/each}
          </div>
        </div>

        <div class="space-y-2">
          <span class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.step2.versionLabel')}</span>
          <VersionPicker bind:value={mcVersion} />
          <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('serverdetail.step2.versionHint')}
          </p>
          <div class="p-3 bg-mc-yellow/10 border-2 border-mc-yellow flex items-start gap-2" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
            <AlertCircle class="size-4 text-mc-yellow shrink-0 mt-0.5" />
            <p class="text-xs text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
              <strong>{t('serverdetail.step2.clientWarning')} <code class="text-mc-yellow">{mcVersion}</code></strong>.
              {t('serverdetail.step2.clientWarningRest')}
            </p>
          </div>
        </div>
      </div>
    {:else if step === 3}
      <div class="space-y-4">
        <h2 class="mc-heading text-2xl">{t('serverdetail.step3.heading')}</h2>

        <div class="space-y-2">
          <label for="ram" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('serverdetail.step3.ramLabel')} <span class="text-diamond">{memoryGb} GB</span>
          </label>
          <input id="ram" type="range" min="1" max="16" bind:value={memoryGb} class="w-full" />
          <div class="flex justify-between text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
            <span>1 GB</span><span>16 GB</span>
          </div>
        </div>

        <div class="space-y-2">
          <label for="players" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.step3.maxPlayersLabel')}</label>
          <input id="players" type="number" min="1" max="200" bind:value={maxPlayers} class="mc-input" />
        </div>

        <div class="space-y-2">
          <span class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.step3.difficultyLabel')}</span>
          <div class="grid grid-cols-4 gap-2">
            {#each difficulties as d}
              <button
                type="button"
                onclick={() => (difficulty = d.id)}
                class="px-3 py-2 text-xs {difficulty === d.id ? 'bg-primary text-white' : 'bg-secondary text-white'}"
                style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
              >
                {t(d.labelKey)}
              </button>
            {/each}
          </div>
        </div>

        <div class="space-y-2">
          <label for="motd" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.step3.motdLabel')}</label>
          <input id="motd" type="text" bind:value={motd} placeholder={t('serverdetail.step3.motdPlaceholder')} class="mc-input" maxlength="120" />
        </div>
      </div>
    {:else if step === 4}
      <div class="space-y-4">
        <h2 class="mc-heading text-2xl">{t('serverdetail.step4.heading')}</h2>
        <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.step4.subtitle')}</p>

        <div class="grid gap-3">
          <button
            type="button"
            onclick={() => (accessMode = 'local')}
            class="text-left px-4 py-3 flex items-start gap-3 {accessMode === 'local' ? 'bg-primary text-white' : 'bg-secondary text-white'}"
            style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
          >
            <Home class="size-5 mt-0.5" />
            <div>
              <div class="text-sm">{t('serverdetail.step4.localTitle')}</div>
              <div class="text-xs opacity-80 mt-0.5">{t('serverdetail.step4.localDesc')}</div>
            </div>
          </button>

          <button
            type="button"
            onclick={() => (accessMode = 'domain')}
            class="text-left px-4 py-3 flex items-start gap-3 {accessMode === 'domain' ? 'bg-primary text-white' : 'bg-secondary text-white'}"
            style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
          >
            <Globe class="size-5 mt-0.5" />
            <div class="flex-1">
              <div class="text-sm flex items-center gap-2">
                {t('serverdetail.step4.domainTitle')}
                {#if configured.cloudflare}<span class="text-xs text-success">{t('serverdetail.step4.cfOk')}</span>{:else}<span class="text-xs text-warning">{t('serverdetail.step4.cfMissing')}</span>{/if}
              </div>
              <div class="text-xs opacity-80 mt-0.5">
                {#if configured.cloudflare}
                  {t('serverdetail.step4.cfAuto')}
                {:else}
                  <a href="/settings" class="text-mc-yellow underline">{t('serverdetail.step4.cfConfigureLink')}</a> {t('serverdetail.step4.cfConfigureRest')}
                {/if}
              </div>
            </div>
          </button>

          {#if accessMode === 'domain'}
            <input
              type="text"
              bind:value={customDomain}
              placeholder={t('serverdetail.step4.domainPlaceholder')}
              class="mc-input ml-8"
            />
          {/if}

          <button
            type="button"
            onclick={() => (accessMode = 'playit')}
            class="text-left px-4 py-3 flex items-start gap-3 {accessMode === 'playit' ? 'bg-primary text-white' : 'bg-secondary text-white'}"
            style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
          >
            <Network class="size-5 mt-0.5" />
            <div class="flex-1">
              <div class="text-sm flex items-center gap-2">
                {t('serverdetail.step4.playitTitle')}
                {#if configured.playit}<span class="text-xs text-success">{t('serverdetail.step4.playitOk')}</span>{:else}<span class="text-xs text-warning">{t('serverdetail.step4.playitMissing')}</span>{/if}
              </div>
              <div class="text-xs opacity-80 mt-0.5">
                {#if configured.playit}
                  {t('serverdetail.step4.playitAuto')}
                {:else}
                  <a href="/settings" class="text-mc-yellow underline">{t('serverdetail.step4.playitConfigureLink')}</a> {t('serverdetail.step4.playitConfigureRest')}
                {/if}
              </div>
            </div>
          </button>
        </div>

        <hr class="border-black border-t-2 my-4" />

        {#if configured.drasl}
          <label class="flex items-start gap-2 text-sm cursor-pointer" style="text-shadow: 2px 2px 0 #3f3f3f;">
            <input type="checkbox" bind:checked={draslEnabled} class="mt-1" />
            <div>
              <div>{t('serverdetail.step4.draslLabel')}</div>
              <p class="text-xs text-white/60 mt-0.5">
                {t('serverdetail.step4.draslUrl')} <span class="text-diamond">{configured.draslUrl}</span>
              </p>
              <p class="text-xs text-white/60 mt-0.5">
                {t('serverdetail.step4.draslHint')}
              </p>
            </div>
          </label>
        {:else}
          <div class="p-4 bg-black/40 border-2 border-warning" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
            <div class="flex items-start gap-3">
              <AlertCircle class="size-5 text-warning mt-0.5 shrink-0" />
              <div class="flex-1">
                <p class="text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  {t('serverdetail.step4.draslMissingTitle')}
                </p>
                <p class="text-xs text-white/60 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  {t('serverdetail.step4.draslMissingDesc')}
                </p>
                <a href="/settings" class="inline-flex items-center gap-2 mt-3 text-xs text-mc-yellow hover:underline" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  <SettingsIcon class="size-3.5" />
                  {t('serverdetail.step4.draslConfigureNow')}
                </a>
              </div>
            </div>
          </div>
        {/if}

        <hr class="border-black border-t-2 my-2" />

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <MessageSquare class="size-5 text-diamond" />
            <h3 class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.step4.discordHeading')}</h3>
          </div>

          {#if !configured.discord}
            <div class="p-3 bg-black/40 border-2 border-warning" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
              <div class="flex items-start gap-2">
                <AlertCircle class="size-4 text-warning mt-0.5 shrink-0" />
                <div>
                  <p class="text-xs text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.step4.discordBotMissing')}</p>
                  <a href="/settings" class="inline-flex items-center gap-1 mt-1 text-xs text-mc-yellow hover:underline" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    <SettingsIcon class="size-3" /> {t('serverdetail.step4.discordConfigureBot')}
                  </a>
                </div>
              </div>
            </div>
          {:else if loadingDiscordGuilds}
            <div class="text-center py-3"><Loader2 class="size-4 animate-spin mx-auto text-white/50" /></div>
          {:else if !discordBotConnected}
            <p class="text-xs text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">
              {t('serverdetail.step4.discordTokenError')}
            </p>
          {:else if discordGuilds.length === 0}
            <p class="text-xs text-warning" style="text-shadow: 2px 2px 0 #3f3f3f;">
              {t('serverdetail.step4.discordNoGuilds')} <a href="/settings" class="text-mc-yellow underline">{t('serverdetail.step4.discordAddBot')}</a>
            </p>
          {:else}
            <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
              {t('serverdetail.step4.discordIntro')}
            </p>
            <div class="grid gap-2 sm:grid-cols-2">
              <div>
                <label for="wiz-discord-guild" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.step4.discordGuildLabel')}</label>
                <select id="wiz-discord-guild" bind:value={discordGuildId} class="mc-input text-sm">
                  <option value="">{t('serverdetail.step4.discordNoBridge')}</option>
                  {#each discordGuilds as g}
                    <option value={g.id}>{g.name}</option>
                  {/each}
                </select>
              </div>
              <div>
                <span class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.step4.discordChannelLabel')}</span>
                {#if !discordGuildId}
                  <select disabled class="mc-input text-sm opacity-50">
                    <option>{t('serverdetail.step4.discordSelectGuildFirst')}</option>
                  </select>
                {:else if loadingDiscordChannels}
                  <div class="mc-input text-sm flex items-center gap-2 text-white/50">
                    <Loader2 class="size-3 animate-spin" /> {t('serverdetail.step4.discordLoadingChannels')}
                  </div>
                {:else if discordChannels.length === 0}
                  <p class="text-xs text-warning" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    {t('serverdetail.step4.discordNoChannels')}
                  </p>
                {:else}
                  <select bind:value={discordChannelId} class="mc-input text-sm">
                    <option value={null}>{t('serverdetail.step4.discordChoose')}</option>
                    {#each discordChannels as ch}
                      <option value={ch.id}># {ch.name}</option>
                    {/each}
                  </select>
                {/if}
              </div>
            </div>
            {#if discordChannelId}
              <p class="text-xs text-success" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {t('serverdetail.step4.discordBridgeReady')}
              </p>
            {/if}
          {/if}
        </div>
      </div>
    {:else}
      <div class="space-y-4">
        <h2 class="mc-heading text-2xl">{t('serverdetail.step5.heading')}</h2>

        <dl class="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.confirm.name')}</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{displayName}</dd>
          {#if showHostPicker}
            <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.confirm.host')}</dt><dd class="text-diamond" style="text-shadow: 2px 2px 0 #3f3f3f;">{selectedHostName}</dd>
          {/if}
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.confirm.modloader')}</dt><dd class="text-diamond" style="text-shadow: 2px 2px 0 #3f3f3f;">{modloaderType}</dd>
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.confirm.version')}</dt><dd class="text-diamond" style="text-shadow: 2px 2px 0 #3f3f3f;">{mcVersion}</dd>
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.confirm.ram')}</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{memoryGb} GB</dd>
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.confirm.maxPlayers')}</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{maxPlayers}</dd>
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.confirm.difficulty')}</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{difficulty}</dd>
          {#if motd}
            <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.confirm.motd')}</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{motd}</dd>
          {/if}
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.confirm.access')}</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{accessMode === 'local' ? t('serverdetail.confirm.accessLocal') : accessMode === 'domain' ? customDomain : 'Playit.gg'}</dd>
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.confirm.drasl')}</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{draslEnabled ? t('serverdetail.confirm.yes') : t('serverdetail.confirm.no')}</dd>
          {#if discordChannelId}
            {@const ch = discordChannels.find((c) => c.id === discordChannelId)}
            {@const guild = discordGuilds.find((g) => g.id === discordGuildId)}
            <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverdetail.confirm.discordBridge')}</dt>
            <dd class="text-diamond" style="text-shadow: 2px 2px 0 #3f3f3f;">
              {guild?.name ?? '?'} → #{ch?.name ?? discordChannelId}
            </dd>
          {/if}
        </dl>

        {#if error}
          <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {error}</p>
        {/if}

        <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('serverdetail.confirm.summary')}
        </p>
      </div>
    {/if}
  </div>

  <div class="flex justify-between mt-6">
    {#if step > 1}
      <button type="button" onclick={() => (step = (step - 1) as Step)} class="mc-btn">
        <ArrowLeft class="size-4" /> {t('serverdetail.nav.back')}
      </button>
    {:else}
      <div></div>
    {/if}

    {#if step < 5}
      <button
        type="button"
        onclick={() => canAdvance() && (step = (step + 1) as Step)}
        disabled={!canAdvance()}
        class="mc-btn mc-btn-primary"
      >
        {t('serverdetail.nav.next')} <ArrowRight class="size-4" />
      </button>
    {:else}
      <button type="button" onclick={submit} disabled={submitting} class="mc-btn mc-btn-primary">
        {#if submitting}
          <Loader2 class="size-4 animate-spin" /> {t('serverdetail.nav.creating')}
        {:else}
          <Check class="size-4" /> {t('serverdetail.nav.createStart')}
        {/if}
      </button>
    {/if}
  </div>
</div>
