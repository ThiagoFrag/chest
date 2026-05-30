<script lang="ts">
  import { Loader2, MessageSquare, AlertCircle, Check, X, ExternalLink, Plus } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import { t, plural } from '$lib/i18n';

  let { containerName }: { containerName: string } = $props();

  interface BotStatus {
    configured: boolean;
    connected: boolean;
    username: string | null;
    applicationId: string | null;
    inviteUrl: string | null;
    guilds: Array<{ id: string; name: string; iconUrl: string | null }>;
  }

  let botStatus = $state<BotStatus | null>(null);
  let loadingStatus = $state(true);

  let currentChannelId = $state<string | null>(null);
  let loadingCurrent = $state(true);

  let selectedGuildId = $state<string>('');
  let channels = $state<Array<{ id: string; name: string }>>([]);
  let loadingChannels = $state(false);

  let saving = $state(false);
  let saved = $state(false);

  async function loadBot() {
    loadingStatus = true;
    try {
      const res = await fetch('/api/discord/status');
      if (res.ok) botStatus = await res.json();
    } finally {
      loadingStatus = false;
    }
  }

  async function loadCurrent() {
    loadingCurrent = true;
    try {
      const res = await fetch(`/api/servers/${containerName}/discord`);
      if (res.ok) {
        const d = await res.json();
        currentChannelId = d.channelId;
      }
    } finally {
      loadingCurrent = false;
    }
  }

  async function loadChannels(guildId: string) {
    if (!guildId) {
      channels = [];
      return;
    }
    loadingChannels = true;
    try {
      const res = await fetch(`/api/discord/channels/${guildId}`);
      if (res.ok) {
        const d = await res.json();
        channels = d.channels ?? [];
      }
    } finally {
      loadingChannels = false;
    }
  }

  $effect(() => {
    void selectedGuildId;
    loadChannels(selectedGuildId);
  });

  async function saveChannel(channelId: string | null) {
    saving = true;
    try {
      const res = await fetch(`/api/servers/${containerName}/discord`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channelId })
      });
      if (res.ok) {
        currentChannelId = channelId;
        saved = true;
        setTimeout(() => (saved = false), 2000);
      } else {
        const e = await res.json().catch(() => ({}));
        alert(t('integrations.discord.alert.saveError', { error: e.message ?? res.status }));
      }
    } finally {
      saving = false;
    }
  }

  loadBot();
  loadCurrent();
</script>

<div class="grid gap-6 lg:grid-cols-2">
  <!-- Bot status -->
  <section class="mc-card">
    <header class="mb-4 flex items-center gap-3">
      <div class="mc-slot"><MCTexture src="/textures/item/ender_eye.png" size={24} /></div>
      <div>
        <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.discord.botStatus.title')}</h3>
        <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.discord.botStatus.subtitle')}</p>
      </div>
    </header>

    {#if loadingStatus}
      <div class="text-center py-6"><Loader2 class="size-5 animate-spin mx-auto text-white/50" /></div>
    {:else if !botStatus?.configured}
      <div class="p-3 bg-black/40 border-2 border-warning" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
        <div class="flex items-start gap-2">
          <AlertCircle class="size-5 text-warning mt-0.5 shrink-0" />
          <div>
            <p class="text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.discord.botStatus.notConfigured')}</p>
            <p class="text-xs text-white/60 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
              {t('integrations.discord.botStatus.notConfiguredHintBefore')} <span class="text-mc-yellow">discord.bot_token</span>
              {t('integrations.discord.botStatus.notConfiguredHintMid')}
              <a href="/settings" class="text-mc-yellow underline">{t('integrations.discord.botStatus.settings')}</a>
              {t('integrations.discord.botStatus.notConfiguredHintAfter')}
            </p>
          </div>
        </div>
      </div>
    {:else if !botStatus.connected}
      <div class="p-3 bg-black/40 border-2 border-destructive">
        <div class="flex items-center gap-2 text-destructive">
          <X class="size-5" />
          <span class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.discord.botStatus.notConnected')}</span>
        </div>
        <p class="text-xs text-white/60 mt-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('integrations.discord.botStatus.notConnectedHint')}
        </p>
      </div>
    {:else}
      <div class="space-y-3">
        <div class="flex items-center gap-2 text-success">
          <Check class="size-5" />
          <span class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.discord.botStatus.connectedAs', { username: botStatus.username ?? '' })}</span>
        </div>
        <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {plural(botStatus.guilds.length, {
            one: t('integrations.discord.botStatus.guildsCount.one'),
            other: t('integrations.discord.botStatus.guildsCount.other')
          })}
        </p>

        {#if botStatus.inviteUrl}
          <a
            href={botStatus.inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="mc-btn mc-btn-primary w-full inline-flex items-center justify-center gap-2"
          >
            <Plus class="size-4" />
            {t('integrations.discord.botStatus.addBot')}
            <ExternalLink class="size-3" />
          </a>
          <p class="text-[10px] text-white/50 text-center" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.discord.botStatus.addBotHint')}
          </p>
        {/if}
      </div>
    {/if}
  </section>

  <!-- Channel selector -->
  <section class="mc-card">
    <header class="mb-4 flex items-center gap-3">
      <div class="mc-slot"><MessageSquare class="size-5 text-diamond" /></div>
      <div>
        <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.discord.channel.title')}</h3>
        <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.discord.channel.subtitle')}</p>
      </div>
    </header>

    {#if loadingCurrent}
      <div class="text-center py-6"><Loader2 class="size-5 animate-spin mx-auto text-white/50" /></div>
    {:else if currentChannelId}
      <div class="space-y-3">
        <div class="p-3 bg-black/40 border-2 border-success" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
          <p class="text-sm text-success" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.discord.channel.bridgeActive')}
          </p>
          <p class="text-xs text-white/60 font-mono mt-1">{t('integrations.discord.channel.channelLabel', { id: currentChannelId })}</p>
        </div>
        <button type="button" onclick={() => saveChannel(null)} disabled={saving} class="mc-btn mc-btn-destructive w-full">
          {#if saving}<Loader2 class="size-4 animate-spin" />{:else}<X class="size-4" />{/if}
          {t('integrations.discord.channel.disconnect')}
        </button>
      </div>
    {:else if !botStatus?.connected}
      <p class="text-sm text-white/60 text-center py-6" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('integrations.discord.channel.connectBotFirst')}
      </p>
    {:else}
      <div class="space-y-3">
        <div>
          <label for="dbp-guild" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.discord.channel.serverLabel')}</label>
          <select id="dbp-guild" bind:value={selectedGuildId} class="mc-input">
            <option value="">{t('integrations.discord.channel.serverPlaceholder')}</option>
            {#each botStatus.guilds as g}
              <option value={g.id}>{g.name}</option>
            {/each}
          </select>
        </div>

        {#if selectedGuildId}
          <div>
            <span class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.discord.channel.textChannelLabel')}</span>
            {#if loadingChannels}
              <div class="text-center py-3"><Loader2 class="size-4 animate-spin mx-auto text-white/50" /></div>
            {:else if channels.length === 0}
              <p class="text-xs text-warning" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {t('integrations.discord.channel.noChannels')}
              </p>
            {:else}
              <div class="space-y-1 max-h-64 overflow-y-auto">
                {#each channels as ch}
                  <button
                    type="button"
                    onclick={() => saveChannel(ch.id)}
                    disabled={saving}
                    class="w-full text-left px-3 py-2 bg-black/40 border-2 border-black hover:bg-primary/40 hover:text-mc-yellow text-sm text-white"
                    style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1); text-shadow: 2px 2px 0 #3f3f3f;"
                  >
                    # {ch.name}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </section>

  <!-- Como funciona -->
  <section class="mc-card lg:col-span-2">
    <h3 class="text-lg mb-3" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.discord.howItWorks.title')}</h3>
    <div class="grid gap-4 md:grid-cols-2 text-sm">
      <div>
        <p class="text-mc-yellow mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.discord.howItWorks.mcToDiscord')}</p>
        <ul class="text-xs text-white/70 space-y-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
          <li>• {t('integrations.discord.howItWorks.mcToDiscord.chat')}</li>
          <li>• {t('integrations.discord.howItWorks.mcToDiscord.events')}</li>
          <li>• {t('integrations.discord.howItWorks.mcToDiscord.death')}</li>
        </ul>
      </div>
      <div>
        <p class="text-diamond mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.discord.howItWorks.discordToMc')}</p>
        <ul class="text-xs text-white/70 space-y-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
          <li>• {t('integrations.discord.howItWorks.discordToMc.messages')} <code class="text-mc-yellow">[Discord] &lt;user&gt; msg</code> {t('integrations.discord.howItWorks.discordToMc.messagesSuffix')}</li>
          <li>• {t('integrations.discord.howItWorks.discordToMc.rcon')}</li>
          <li>• {t('integrations.discord.howItWorks.discordToMc.selectedOnly')}</li>
        </ul>
      </div>
    </div>
  </section>
</div>
