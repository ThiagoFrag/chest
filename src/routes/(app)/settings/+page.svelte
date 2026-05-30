<script lang="ts">
  import { Settings, Check, Loader2, Eye, EyeOff, Trash2, Send, Plus, ExternalLink, X } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import { invalidateAll } from '$app/navigation';
  import { t } from '$lib/i18n';

  let testingDiscord = $state(false);
  async function testDiscord() {
    testingDiscord = true;
    try {
      const res = await fetch('/api/discord/test', { method: 'POST' });
      if (res.ok) alert(t('admin.settings.testWebhookOk'));
      else {
        const e = await res.json().catch(() => ({}));
        alert(t('admin.settings.error', { message: e.message ?? res.status }));
      }
    } finally {
      testingDiscord = false;
    }
  }

  interface BotStatus {
    configured: boolean;
    connected: boolean;
    username: string | null;
    applicationId: string | null;
    inviteUrl: string | null;
    guilds: Array<{ id: string; name: string; iconUrl: string | null }>;
  }

  let botStatus = $state<BotStatus | null>(null);
  let loadingBot = $state(false);
  async function loadBotStatus() {
    loadingBot = true;
    try {
      const res = await fetch('/api/discord/status');
      if (res.ok) botStatus = await res.json();
    } finally {
      loadingBot = false;
    }
  }
  onMount(() => {
    loadBotStatus();
  });

  let { data } = $props();
  const current = $derived(data.settings);

  let origin = $state('<sua-origin>');
  onMount(() => {
    origin = window.location.origin;
  });
  const discordRedirectUri = $derived(`${origin}/login/discord/callback`);

  interface Section {
    id: string;
    title: string;
    icon: string;
    desc: string;
    fields: Array<{
      key: string;
      label: string;
      placeholder: string;
      type: 'text' | 'url' | 'secret';
      help?: string;
    }>;
  }

  const sections: Section[] = $derived([
    {
      id: 'DRASL',
      title: t('admin.settings.drasl.title'),
      icon: '/textures/item/ender_eye.png',
      desc: t('admin.settings.drasl.desc'),
      fields: [
        {
          key: 'drasl.url',
          label: t('admin.settings.drasl.url.label'),
          placeholder: 'https://mc.exemplo.com',
          type: 'url',
          help: t('admin.settings.drasl.url.help')
        },
        {
          key: 'drasl.admin_token',
          label: t('admin.settings.drasl.token.label'),
          placeholder: 'token...',
          type: 'secret',
          help: t('admin.settings.drasl.token.help')
        }
      ]
    },
    {
      id: 'CLOUDFLARE',
      title: t('admin.settings.cloudflare.title'),
      icon: '/textures/item/ender_eye.png',
      desc: t('admin.settings.cloudflare.desc'),
      fields: [
        {
          key: 'cloudflare.api_token',
          label: t('admin.settings.cloudflare.apiToken.label'),
          placeholder: 'token...',
          type: 'secret',
          help: t('admin.settings.cloudflare.apiToken.help')
        },
        {
          key: 'cloudflare.zone_id',
          label: t('admin.settings.cloudflare.zoneId.label'),
          placeholder: 'a1b2c3d4...',
          type: 'text',
          help: t('admin.settings.cloudflare.zoneId.help')
        },
        {
          key: 'cloudflare.cname_target',
          label: t('admin.settings.cloudflare.cnameTarget.label'),
          placeholder: 'tinyserver.exemplo.com',
          type: 'text',
          help: t('admin.settings.cloudflare.cnameTarget.help')
        }
      ]
    },
    {
      id: 'PLAYIT.GG',
      title: t('admin.settings.playit.title'),
      icon: '/textures/item/netherite_ingot.png',
      desc: t('admin.settings.playit.desc'),
      fields: [
        {
          key: 'playit.secret_key',
          label: t('admin.settings.playit.secretKey.label'),
          placeholder: 'SK_xxxxx...',
          type: 'secret',
          help: t('admin.settings.playit.secretKey.help')
        }
      ]
    },
    {
      id: 'DISCORD',
      title: t('admin.settings.discord.title'),
      icon: '/textures/item/diamond.png',
      desc: t('admin.settings.discord.desc'),
      fields: [
        {
          key: 'discord.webhook_url',
          label: t('admin.settings.discord.webhookUrl.label'),
          placeholder: 'https://discord.com/api/webhooks/...',
          type: 'secret',
          help: t('admin.settings.discord.webhookUrl.help')
        },
        {
          key: 'discord.bot_token',
          label: t('admin.settings.discord.botToken.label'),
          placeholder: 'MTI...',
          type: 'secret',
          help: t('admin.settings.discord.botToken.help')
        },
        {
          key: 'discord.admin_user_id',
          label: t('admin.settings.discord.adminUserId.label'),
          placeholder: '123456789012345678',
          type: 'text',
          help: t('admin.settings.discord.adminUserId.help')
        },
        {
          key: 'discord.oauth_client_id',
          label: t('admin.settings.discord.oauthClientId.label'),
          placeholder: '123456789012345678',
          type: 'text',
          help: t('admin.settings.discord.oauthClientId.help')
        },
        {
          key: 'discord.oauth_client_secret',
          label: t('admin.settings.discord.oauthClientSecret.label'),
          placeholder: 'xxxxxxxx...',
          type: 'secret',
          help: t('admin.settings.discord.oauthClientSecret.help')
        },
        {
          key: 'discord.oauth_guild_id',
          label: t('admin.settings.discord.oauthGuildId.label'),
          placeholder: '123456789012345678',
          type: 'text',
          help: t('admin.settings.discord.oauthGuildId.help')
        }
      ]
    },
    {
      id: 'CHEST',
      title: t('admin.settings.chest.title'),
      icon: '/textures/item/iron_pickaxe.png',
      desc: t('admin.settings.chest.desc'),
      fields: [
        {
          key: 'forja.public_base_url',
          label: t('admin.settings.chest.baseUrl.label'),
          placeholder: 'https://chest.exemplo.com',
          type: 'url',
          help: t('admin.settings.chest.baseUrl.help')
        },
        {
          key: 'forja.mc_host_address',
          label: t('admin.settings.chest.mcHost.label'),
          placeholder: 'mc.exemplo.com ou [2001:db8::200] ou 192.168.1.50',
          type: 'text',
          help: t('admin.settings.chest.mcHost.help')
        }
      ]
    },
    {
      id: 'STORAGE',
      title: t('admin.settings.storage.title'),
      icon: '/textures/item/iron_ingot.png',
      desc: t('admin.settings.storage.desc'),
      fields: [
        { key: 'chest.storage.driver', label: t('admin.settings.storage.driver.label'), placeholder: 'local OR s3', type: 'text', help: t('admin.settings.storage.driver.help') },
        { key: 'chest.storage.local.dir', label: t('admin.settings.storage.localDir.label'), placeholder: '/app/data/backups', type: 'text' },
        { key: 'chest.storage.s3.endpoint', label: t('admin.settings.storage.s3Endpoint.label'), placeholder: '', type: 'text' },
        { key: 'chest.storage.s3.region', label: t('admin.settings.storage.s3Region.label'), placeholder: 'auto OR us-east-1', type: 'text' },
        { key: 'chest.storage.s3.bucket', label: t('admin.settings.storage.s3Bucket.label'), placeholder: 'chest-backups', type: 'text' },
        { key: 'chest.storage.s3.access_key', label: t('admin.settings.storage.s3AccessKey.label'), placeholder: 'AKIA...', type: 'secret' },
        { key: 'chest.storage.s3.secret_key', label: t('admin.settings.storage.s3SecretKey.label'), placeholder: '...', type: 'secret' },
        { key: 'chest.storage.s3.path_prefix', label: t('admin.settings.storage.s3PathPrefix.label'), placeholder: 'chest-backups/', type: 'text' },
        { key: 'chest.storage.s3.force_path_style', label: t('admin.settings.storage.s3ForcePathStyle.label'), placeholder: 'true OR false', type: 'text' }
      ]
    }
  ]);

  let inputs = $state<Record<string, string>>({});
  let saving = $state<string | null>(null);
  let saved = $state<string | null>(null);
  let showSecret = $state<Record<string, boolean>>({});

  function getInitial(key: string): string {
    const s = current[key];
    if (!s) return '';
    return s.isSecret ? '' : s.value;
  }

  async function save(key: string) {
    const value = inputs[key] ?? '';
    saving = key;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        saved = key;
        setTimeout(() => (saved = null), 2000);
        inputs[key] = '';
        await invalidateAll();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(t('admin.settings.error', { message: err.message ?? res.status }));
      }
    } finally {
      saving = null;
    }
  }

  async function clear(key: string) {
    if (!confirm(t('admin.settings.confirmClear', { key }))) return;
    saving = key;
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, value: '' })
      });
      await invalidateAll();
    } finally {
      saving = null;
    }
  }
</script>

<svelte:head><title>{t('admin.settings.head')}</title></svelte:head>

<div class="px-8 py-6">
  <div class="mc-banner mb-6 flex items-center gap-4">
    <Settings class="size-10 text-mc-yellow" />
    <div>
      <h1 class="mc-heading text-3xl">{t('admin.settings.title')}</h1>
      <p class="mt-1 text-xs text-white/80" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('admin.settings.subtitle')}
      </p>
    </div>
  </div>

  <div class="space-y-6 max-w-4xl">
    {#each sections as section}
      <section class="mc-card">
        <header class="mb-4 flex items-start gap-3">
          <div class="mc-slot shrink-0"><MCTexture src={section.icon} size={24} /></div>
          <div>
            <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">{section.title}</h3>
            <p class="text-xs text-white/60 mt-0.5" style="text-shadow: 2px 2px 0 #3f3f3f;">
              {section.desc}
            </p>
          </div>
        </header>

        <div class="space-y-4">
          {#each section.fields as field}
            {@const stored = current[field.key]}
            {@const hasValue = !!stored}
            {@const isShowing = showSecret[field.key]}
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label for={field.key} class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  {field.label}
                </label>
                {#if hasValue}
                  <span class="text-xs text-success flex items-center gap-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    <Check class="size-3" /> {t('admin.settings.configured')}
                  </span>
                {/if}
              </div>

              {#if hasValue && field.type === 'secret'}
                <div class="flex items-center gap-2 bg-input border-2 border-black px-3 py-2" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
                  <span class="flex-1 font-mono text-sm text-white/70">{stored.value}</span>
                  <button type="button" onclick={() => clear(field.key)} disabled={saving === field.key} class="text-destructive hover:text-mc-yellow" title={t('admin.settings.delete')}>
                    {#if saving === field.key}<Loader2 class="size-3.5 animate-spin" />{:else}<Trash2 class="size-3.5" />{/if}
                  </button>
                </div>
                <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  {t('admin.settings.replaceHint')}
                </p>
              {/if}

              <div class="flex gap-2">
                <input
                  id={field.key}
                  type={field.type === 'secret' && !isShowing ? 'password' : 'text'}
                  bind:value={inputs[field.key]}
                  placeholder={hasValue && !field.type.includes('secret') ? stored.value : field.placeholder}
                  class="mc-input flex-1"
                />
                {#if field.type === 'secret'}
                  <button type="button" onclick={() => (showSecret[field.key] = !isShowing)} class="mc-btn px-3" title={isShowing ? t('admin.settings.hide') : t('admin.settings.show')}>
                    {#if isShowing}<EyeOff class="size-4" />{:else}<Eye class="size-4" />{/if}
                  </button>
                {/if}
                <button
                  type="button"
                  onclick={() => save(field.key)}
                  disabled={saving === field.key || !inputs[field.key]?.trim()}
                  class="mc-btn mc-btn-primary"
                >
                  {#if saving === field.key}
                    <Loader2 class="size-4 animate-spin" />
                  {:else if saved === field.key}
                    <Check class="size-4" /> {t('admin.settings.saved')}
                  {:else}
                    {t('admin.settings.save')}
                  {/if}
                </button>
              </div>

              {#if field.help}
                <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  ℹ {field.help}
                </p>
              {/if}
            </div>
          {/each}

          {#if section.id === 'DISCORD'}
            <div class="border-2 border-mc-yellow/40 bg-black/40 px-3 py-3 space-y-1" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
              <p class="text-xs text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {t('admin.settings.discord.redirect.title')}
              </p>
              <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {t('admin.settings.discord.redirect.desc')}
              </p>
              <code class="block break-all font-mono text-xs text-white bg-input border-2 border-black px-2 py-1">{discordRedirectUri}</code>
            </div>
          {/if}

          {#if section.id === 'DISCORD' && current['discord.webhook_url']}
            <div class="border-t-2 border-black pt-4 mt-2">
              <button type="button" onclick={testDiscord} disabled={testingDiscord} class="mc-btn mc-btn-accent">
                {#if testingDiscord}<Loader2 class="size-4 animate-spin" />{:else}<Send class="size-4" />{/if}
                {t('admin.settings.discord.test.button')}
              </button>
              <p class="text-xs text-white/50 mt-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {t('admin.settings.discord.test.hint')}
              </p>
            </div>
          {/if}

          {#if section.id === 'DISCORD'}
            <div class="border-t-2 border-black pt-4 mt-2 space-y-3">
              <h4 class="text-sm text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {t('admin.settings.bot.title')}
              </h4>
              {#if loadingBot}
                <div class="text-center py-2">
                  <Loader2 class="size-4 animate-spin mx-auto text-white/50" />
                </div>
              {:else if !botStatus?.configured}
                <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  {t('admin.settings.bot.needToken')}
                </p>
              {:else if !botStatus.connected}
                <div class="flex items-center gap-2 text-destructive text-xs">
                  <X class="size-4" />
                  <span style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.settings.bot.invalidToken')}</span>
                </div>
              {:else}
                <div class="flex items-center gap-2 text-success text-xs">
                  <Check class="size-4" />
                  <span style="text-shadow: 2px 2px 0 #3f3f3f;">
                    {t('admin.settings.bot.connectedAs')} <strong>{botStatus.username}</strong>
                  </span>
                </div>

                {#if botStatus.guilds.length > 0}
                  <div class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    {t('admin.settings.bot.installedIn')} <strong class="text-white">{botStatus.guilds.length}</strong>
                    {botStatus.guilds.length === 1 ? t('admin.settings.bot.serverOne') : t('admin.settings.bot.serverOther')}:
                  </div>
                  <ul class="space-y-1 max-h-32 overflow-y-auto">
                    {#each botStatus.guilds as g}
                      <li class="flex items-center gap-2 text-xs bg-black/40 border border-black px-2 py-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
                        {#if g.iconUrl}
                          <img src={g.iconUrl} alt={g.name} class="size-4" style="image-rendering: pixelated;" />
                        {:else}
                          <div class="size-4 bg-primary/40 border border-black"></div>
                        {/if}
                        <span class="text-white">{g.name}</span>
                        <span class="text-white/40 font-mono text-[10px] ml-auto">{g.id}</span>
                      </li>
                    {/each}
                  </ul>
                {:else}
                  <p class="text-xs text-warning" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    {t('admin.settings.bot.noGuild')}
                  </p>
                {/if}

                {#if botStatus.inviteUrl}
                  <a
                    href={botStatus.inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mc-btn mc-btn-primary w-full inline-flex items-center justify-center gap-2"
                  >
                    <Plus class="size-4" />
                    {t('admin.settings.bot.addToServer')}
                    <ExternalLink class="size-3" />
                  </a>
                  <p class="text-[10px] text-white/50 text-center" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    {t('admin.settings.bot.addHint')}
                  </p>
                {/if}
              {/if}
            </div>
          {/if}
        </div>
      </section>
    {/each}
  </div>
</div>
