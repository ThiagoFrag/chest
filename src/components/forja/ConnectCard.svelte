<script lang="ts">
  import { Copy, Check, Globe, Network, Home, AlertCircle, Package } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import { t } from '$lib/i18n';

  let {
    hostPort,
    mcHostAddress = null,
    publicUrl = null,
    publicMode = null,
    mcVersion = null
  }: {
    hostPort: number | null;
    mcHostAddress?: string | null;
    publicUrl?: string | null;
    publicMode?: string | null;
    mcVersion?: string | null;
  } = $props();

  let copied = $state<string | null>(null);
  let copyFailed = $state<string | null>(null);

  async function copy(text: string, key: string) {
    copyFailed = null;
    try {
      await navigator.clipboard.writeText(text);
      copied = key;
      setTimeout(() => (copied = null), 1500);
    } catch {
      copyFailed = key;
      setTimeout(() => (copyFailed = null), 2500);
    }
  }

  function formatAddress(host: string | null, port: number | null): string {
    if (!host || !port) return '';
    const isIpv6 = host.includes(':') && !host.startsWith('[');
    const formatted = isIpv6 ? `[${host}]` : host;
    return port === 25565 ? formatted : `${formatted}:${port}`;
  }

  const localAddress = $derived(formatAddress(mcHostAddress, hostPort));
</script>

<div class="mc-card md:col-span-3">
  <div class="flex items-center gap-2 mb-4">
    <div class="mc-slot"><MCTexture src="/textures/item/ender_eye.png" size={20} /></div>
    <p class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.connect.title')}</p>
  </div>

  {#if !hostPort}
    <div class="flex items-center gap-2 text-warning text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">
      <AlertCircle class="size-4" />
      {t('integrations.connect.serverNotRunning')}
    </div>
  {:else}
    {#if mcVersion}
      <div class="mb-3 p-3 bg-mc-yellow/10 border-2 border-mc-yellow flex items-start gap-3" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
        <Package class="size-5 text-mc-yellow shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-sm text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.connect.version.warning')}
            <strong class="ml-1">{mcVersion}</strong>
          </p>
          <p class="text-[10px] text-white/70 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.connect.version.hintBefore')} <code class="text-mc-yellow">{t('integrations.connect.version.profile', { version: mcVersion })}</code>{t('integrations.connect.version.hintAfter')}
          </p>
        </div>
        <button
          type="button"
          onclick={() => copy(mcVersion ?? '', 'version')}
          class="mc-btn text-xs px-2"
          title={copyFailed === 'version' ? t('integrations.connect.version.copyFailTitle') : t('integrations.connect.version.copyTitle')}
        >
          {#if copied === 'version'}<Check class="size-3 text-success" />{:else if copyFailed === 'version'}<AlertCircle class="size-3 text-warning" />{:else}<Copy class="size-3" />{/if}
        </button>
      </div>
    {/if}

    <div class="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
      <!-- LAN / direto pelo host -->
      <div class="bg-black/40 border-2 border-black p-3" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
        <div class="flex items-center gap-2 mb-2">
          <Home class="size-4 text-mc-yellow" />
          <span class="text-xs text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.connect.direct.title')}</span>
        </div>
        {#if mcHostAddress}
          <div class="flex items-center gap-2">
            <code class="flex-1 text-sm text-success font-mono break-all" style="text-shadow: 2px 2px 0 #3f3f3f;">
              {localAddress}
            </code>
            <button
              type="button"
              onclick={() => copy(localAddress, 'local')}
              class="mc-btn text-xs px-2"
              title={copyFailed === 'local' ? t('integrations.connect.copyFailTitle') : t('integrations.connect.copyTitle')}
            >
              {#if copied === 'local'}<Check class="size-3 text-success" />{:else if copyFailed === 'local'}<AlertCircle class="size-3 text-warning" />{:else}<Copy class="size-3" />{/if}
            </button>
          </div>
          {#if copyFailed === 'local'}
            <p class="text-[10px] text-warning mt-2 flex items-center gap-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
              <AlertCircle class="size-3 shrink-0" />
              {t('integrations.connect.copyFailMsg')}
            </p>
          {/if}
          <p class="text-[10px] text-white/50 mt-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.connect.direct.hint')}
          </p>
        {:else}
          <p class="text-xs text-warning" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.connect.direct.configureBefore')} <code class="text-mc-yellow">forja.mc_host_address</code> {t('integrations.connect.direct.configureAfter')}
            <a href="/settings" class="text-mc-yellow underline">{t('integrations.connect.direct.settings')}</a>
            {t('integrations.connect.direct.configureSuffix')}
          </p>
          <p class="text-xs text-white/60 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.connect.direct.allocatedPort')} <code class="text-diamond">{hostPort}</code>
          </p>
        {/if}
      </div>

      <!-- Public URL (domain custom via CF / Playit) -->
      {#if publicUrl}
        <div class="bg-black/40 border-2 border-success p-3" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
          <div class="flex items-center gap-2 mb-2">
            {#if publicMode === 'playit'}
              <Network class="size-4 text-mc-yellow" />
              <span class="text-xs text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.connect.public.playit')}</span>
            {:else}
              <Globe class="size-4 text-mc-yellow" />
              <span class="text-xs text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.connect.public.cloudflare')}</span>
            {/if}
          </div>
          <div class="flex items-center gap-2">
            <code class="flex-1 text-sm text-success font-mono break-all" style="text-shadow: 2px 2px 0 #3f3f3f;">
              {publicUrl}
            </code>
            <button
              type="button"
              onclick={() => copy(publicUrl ?? '', 'public')}
              class="mc-btn text-xs px-2"
              title={copyFailed === 'public' ? t('integrations.connect.copyFailTitle') : t('integrations.connect.copyTitle')}
            >
              {#if copied === 'public'}<Check class="size-3 text-success" />{:else if copyFailed === 'public'}<AlertCircle class="size-3 text-warning" />{:else}<Copy class="size-3" />{/if}
            </button>
          </div>
          {#if copyFailed === 'public'}
            <p class="text-[10px] text-warning mt-2 flex items-center gap-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
              <AlertCircle class="size-3 shrink-0" />
              {t('integrations.connect.copyFailMsg')}
            </p>
          {/if}
          <p class="text-[10px] text-white/50 mt-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.connect.public.worksAnywhere')}
          </p>
        </div>
      {:else}
        <div class="bg-black/40 border-2 border-black p-3" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
          <div class="flex items-center gap-2 mb-2">
            <Globe class="size-4 text-white/40" />
            <span class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.connect.public.title')}</span>
          </div>
          <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.connect.public.noUrl')}
          </p>
          <a href="#rede" class="text-xs text-mc-yellow underline mt-1 inline-block" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('integrations.connect.public.exposeNow')}
          </a>
        </div>
      {/if}
    </div>
  {/if}
</div>
