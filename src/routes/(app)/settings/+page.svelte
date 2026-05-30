<script lang="ts">
  import { Settings, Check, Loader2, Eye, EyeOff, Trash2, Send, Plus, ExternalLink, X } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import { invalidateAll } from '$app/navigation';

  let testingDiscord = $state(false);
  async function testDiscord() {
    testingDiscord = true;
    try {
      const res = await fetch('/api/discord/test', { method: 'POST' });
      if (res.ok) alert('✓ webhook ok! verifique seu canal Discord.');
      else {
        const e = await res.json().catch(() => ({}));
        alert(`erro: ${e.message ?? res.status}`);
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

  const sections: Section[] = [
    {
      title: 'DRASL (Auth Server)',
      icon: '/textures/item/ender_eye.png',
      desc: 'Auth server self-hosted pra players sem conta Microsoft entrarem',
      fields: [
        {
          key: 'drasl.url',
          label: 'URL do Drasl',
          placeholder: 'https://mc.exemplo.com',
          type: 'url',
          help: 'URL base do seu Drasl. Wizard vai oferecer toggle "usar Drasl" quando configurado.'
        },
        {
          key: 'drasl.admin_token',
          label: 'Token admin (opcional)',
          placeholder: 'token...',
          type: 'secret',
          help: 'Pra gerenciar players direto do painel'
        }
      ]
    },
    {
      title: 'CLOUDFLARE',
      icon: '/textures/item/ender_eye.png',
      desc: 'Pra criar DNS automaticamente quando expor server publicamente',
      fields: [
        {
          key: 'cloudflare.api_token',
          label: 'API Token (Edit zone DNS)',
          placeholder: 'token...',
          type: 'secret',
          help: 'Cloudflare → My Profile → API Tokens → Create → "Edit zone DNS" template'
        },
        {
          key: 'cloudflare.zone_id',
          label: 'Zone ID',
          placeholder: 'a1b2c3d4...',
          type: 'text',
          help: 'Visível no dashboard CF na sidebar direita da zona'
        },
        {
          key: 'cloudflare.cname_target',
          label: 'CNAME target',
          placeholder: 'tinyserver.exemplo.com',
          type: 'text',
          help: 'Hostname pra onde os subdomínios criados vão apontar (ex: o host A record do servidor)'
        }
      ]
    },
    {
      title: 'PLAYIT.GG',
      icon: '/textures/item/netherite_ingot.png',
      desc: 'Túneis TCP automáticos pra servers em CGNAT',
      fields: [
        {
          key: 'playit.secret_key',
          label: 'SECRET_KEY do agent',
          placeholder: 'SK_xxxxx...',
          type: 'secret',
          help: 'Criar em playit.gg/account/agents → Self managed (Docker)'
        }
      ]
    },
    {
      title: 'DISCORD',
      icon: '/textures/item/diamond.png',
      desc: 'Notificações de eventos (server up/down, joins, backup)',
      fields: [
        {
          key: 'discord.webhook_url',
          label: 'Webhook URL (notificações)',
          placeholder: 'https://discord.com/api/webhooks/...',
          type: 'secret',
          help: 'pra notificações simples (server up/down, backup, crash)'
        },
        {
          key: 'discord.bot_token',
          label: 'Bot Token (chat bridge MC ⇄ Discord)',
          placeholder: 'MTI...',
          type: 'secret',
          help: 'Crie bot em discord.com/developers/applications → Bot → token. Permissões: Send Messages, View Channel, Manage Webhooks. Convide com scope bot.'
        },
        {
          key: 'discord.admin_user_id',
          label: 'Seu Discord User ID (admin)',
          placeholder: '123456789012345678',
          type: 'text',
          help: 'pra receber DM quando algum server crashar. Ative Developer Mode no Discord → clique direito no seu nick → Copy User ID.'
        },
        {
          key: 'discord.oauth_client_id',
          label: 'OAuth Client ID (login com Discord)',
          placeholder: '123456789012345678',
          type: 'text',
          help: 'discord.com/developers/applications → sua app → OAuth2 → Client ID. Habilita "entrar com Discord" e vínculo de conta.'
        },
        {
          key: 'discord.oauth_client_secret',
          label: 'OAuth Client Secret',
          placeholder: 'xxxxxxxx...',
          type: 'secret',
          help: 'OAuth2 → Client Secret. Mantém em segredo — fica criptografado no banco.'
        },
        {
          key: 'discord.oauth_guild_id',
          label: 'OAuth Guild ID (opcional)',
          placeholder: '123456789012345678',
          type: 'text',
          help: 'Opcional. Se preenchido, membros deste servidor Discord podem criar conta automaticamente (como viewer). Vazio = somente vínculo manual.'
        }
      ]
    },
    {
      title: 'CHEST',
      icon: '/textures/item/iron_pickaxe.png',
      desc: 'Configurações gerais do painel',
      fields: [
        {
          key: 'forja.public_base_url',
          label: 'URL base pública do Chest',
          placeholder: 'https://chest.exemplo.com',
          type: 'url',
          help: 'Usado em notifications, links em emails, etc.'
        },
        {
          key: 'forja.mc_host_address',
          label: 'Endereço pra conectar nos MC servers',
          placeholder: 'mc.exemplo.com ou [2001:db8::200] ou 192.168.1.50',
          type: 'text',
          help: 'Hostname/IP do host Docker. Aparece em "COMO CONECTAR" no overview de cada server. IPv6 entre colchetes.'
        }
      ]
    },
    {
      title: 'STORAGE',
      icon: '/textures/item/iron_ingot.png',
      desc: 'Onde guardar backups — local (FS) ou S3-compatível (AWS/R2/B2/MinIO)',
      fields: [
        { key: 'chest.storage.driver', label: 'Driver', placeholder: 'local OR s3', type: 'text', help: 'valor: local OU s3' },
        { key: 'chest.storage.local.dir', label: 'Diretório local (se driver=local)', placeholder: '/app/data/backups', type: 'text' },
        { key: 'chest.storage.s3.endpoint', label: 'S3 endpoint (vazio = AWS; R2: https://accountid.r2.cloudflarestorage.com)', placeholder: '', type: 'text' },
        { key: 'chest.storage.s3.region', label: 'S3 region', placeholder: 'auto OR us-east-1', type: 'text' },
        { key: 'chest.storage.s3.bucket', label: 'S3 bucket', placeholder: 'chest-backups', type: 'text' },
        { key: 'chest.storage.s3.access_key', label: 'S3 access key ID', placeholder: 'AKIA...', type: 'secret' },
        { key: 'chest.storage.s3.secret_key', label: 'S3 secret access key', placeholder: '...', type: 'secret' },
        { key: 'chest.storage.s3.path_prefix', label: 'Path prefix (opcional)', placeholder: 'chest-backups/', type: 'text' },
        { key: 'chest.storage.s3.force_path_style', label: 'Force path style (true pra MinIO)', placeholder: 'true OR false', type: 'text' }
      ]
    }
  ];

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
        alert(`erro: ${err.message ?? res.status}`);
      }
    } finally {
      saving = null;
    }
  }

  async function clear(key: string) {
    if (!confirm(`Apagar ${key}?`)) return;
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

<svelte:head><title>Chest · Settings</title></svelte:head>

<div class="px-8 py-6">
  <div class="mc-banner mb-6 flex items-center gap-4">
    <Settings class="size-10 text-mc-yellow" />
    <div>
      <h1 class="mc-heading text-3xl">SETTINGS</h1>
      <p class="mt-1 text-xs text-white/80" style="text-shadow: 2px 2px 0 #3f3f3f;">
        configurações globais do painel
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
                    <Check class="size-3" /> configurado
                  </span>
                {/if}
              </div>

              {#if hasValue && field.type === 'secret'}
                <div class="flex items-center gap-2 bg-input border-2 border-black px-3 py-2" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
                  <span class="flex-1 font-mono text-sm text-white/70">{stored.value}</span>
                  <button type="button" onclick={() => clear(field.key)} disabled={saving === field.key} class="text-destructive hover:text-mc-yellow" title="apagar">
                    {#if saving === field.key}<Loader2 class="size-3.5 animate-spin" />{:else}<Trash2 class="size-3.5" />{/if}
                  </button>
                </div>
                <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  ↓ digite novo valor pra substituir
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
                  <button type="button" onclick={() => (showSecret[field.key] = !isShowing)} class="mc-btn px-3" title={isShowing ? 'ocultar' : 'mostrar'}>
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
                    <Check class="size-4" /> ok
                  {:else}
                    salvar
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

          {#if section.title === 'DISCORD'}
            <div class="border-2 border-mc-yellow/40 bg-black/40 px-3 py-3 space-y-1" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
              <p class="text-xs text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
                ℹ Redirect URI (registre no Discord Developer Portal)
              </p>
              <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
                Em OAuth2 → Redirects, adicione exatamente:
              </p>
              <code class="block break-all font-mono text-xs text-white bg-input border-2 border-black px-2 py-1">{discordRedirectUri}</code>
            </div>
          {/if}

          {#if section.title === 'DISCORD' && current['discord.webhook_url']}
            <div class="border-t-2 border-black pt-4 mt-2">
              <button type="button" onclick={testDiscord} disabled={testingDiscord} class="mc-btn mc-btn-accent">
                {#if testingDiscord}<Loader2 class="size-4 animate-spin" />{:else}<Send class="size-4" />{/if}
                testar webhook
              </button>
              <p class="text-xs text-white/50 mt-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
                envia uma mensagem de teste pro canal
              </p>
            </div>
          {/if}

          {#if section.title === 'DISCORD'}
            <div class="border-t-2 border-black pt-4 mt-2 space-y-3">
              <h4 class="text-sm text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
                STATUS DO BOT
              </h4>
              {#if loadingBot}
                <div class="text-center py-2">
                  <Loader2 class="size-4 animate-spin mx-auto text-white/50" />
                </div>
              {:else if !botStatus?.configured}
                <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  configure bot token acima pra liberar instalação
                </p>
              {:else if !botStatus.connected}
                <div class="flex items-center gap-2 text-destructive text-xs">
                  <X class="size-4" />
                  <span style="text-shadow: 2px 2px 0 #3f3f3f;">token inválido ou falha de rede</span>
                </div>
              {:else}
                <div class="flex items-center gap-2 text-success text-xs">
                  <Check class="size-4" />
                  <span style="text-shadow: 2px 2px 0 #3f3f3f;">
                    conectado como <strong>{botStatus.username}</strong>
                  </span>
                </div>

                {#if botStatus.guilds.length > 0}
                  <div class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    instalado em <strong class="text-white">{botStatus.guilds.length}</strong>
                    {botStatus.guilds.length === 1 ? 'servidor' : 'servidores'}:
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
                    bot ainda não está em nenhum servidor
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
                    adicionar bot a um servidor
                    <ExternalLink class="size-3" />
                  </a>
                  <p class="text-[10px] text-white/50 text-center" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    abre OAuth do Discord em nova aba. precisa ser admin do servidor.
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
