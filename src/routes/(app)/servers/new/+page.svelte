<script lang="ts">
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import { ArrowLeft, ArrowRight, Loader2, Check, Globe, Home, Network, AlertCircle, Settings as SettingsIcon, MessageSquare } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import Achievement from '$components/forja/Achievement.svelte';
  import VersionPicker from '$components/forja/VersionPicker.svelte';

  let { data } = $props();
  const configured = $derived(data.configured);
  const template = $derived(data.template);

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
    { id: 'VANILLA', label: 'Vanilla', desc: 'sem mods, server oficial', tex: '/textures/block/grass_block_top.png' },
    { id: 'PAPER', label: 'Paper', desc: 'plugins Bukkit, performance', tex: '/textures/item/iron_pickaxe.png' },
    { id: 'FABRIC', label: 'Fabric', desc: 'mods modernos, leve', tex: '/textures/item/diamond.png' },
    { id: 'FORGE', label: 'Forge', desc: 'modpacks tradicionais', tex: '/textures/item/iron_ingot.png' },
    { id: 'NEOFORGE', label: 'NeoForge', desc: 'fork moderno do Forge', tex: '/textures/item/netherite_ingot.png' },
    { id: 'PURPUR', label: 'Purpur', desc: 'fork Paper com mais features', tex: '/textures/item/diamond_pickaxe.png' },
    { id: 'SPIGOT', label: 'Spigot', desc: 'legacy, compat plugins', tex: '/textures/item/gold_ingot.png' },
    { id: 'QUILT', label: 'Quilt', desc: 'fork Fabric', tex: '/textures/item/emerald.png' }
  ] as const;

  const difficulties = [
    { id: 'peaceful', label: 'pacífico' },
    { id: 'easy', label: 'fácil' },
    { id: 'normal', label: 'normal' },
    { id: 'hard', label: 'difícil' }
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
        throw new Error(data?.message ?? `erro ${res.status}`);
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
          title: 'Server criado! Instalando modpack...',
          desc: `${template.title} (pode demorar alguns minutos)`,
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
          title: 'Conquista feita!',
          desc: `${displayName} criado e iniciado`,
          icon: '/textures/item/emerald.png'
        };
      }

      setTimeout(() => goto(`/servers/${respData.containerName}`), 2200);
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha';
      submitting = false;
    }
  }

  const steps = [
    { n: 1, label: 'info' },
    { n: 2, label: 'modloader' },
    { n: 3, label: 'recursos' },
    { n: 4, label: 'acesso' },
    { n: 5, label: 'confirmar' }
  ];
</script>

<svelte:head><title>Chest · Novo Server</title></svelte:head>

{#if achievement}
  <Achievement {...achievement} onclose={() => (achievement = null)} />
{/if}

<div class="px-8 py-6 max-w-3xl">
  <a href="/servers" class="text-xs text-white/70 hover:text-mc-yellow inline-flex items-center gap-1 mb-3" style="text-shadow: 2px 2px 0 #3f3f3f;">
    <ArrowLeft class="size-3" /> voltar
  </a>

  <div class="mc-banner mb-6 flex items-center gap-4">
    {#if template}
      <img src={template.iconUrl} alt={template.title} class="size-12" style="image-rendering: pixelated;" />
    {:else}
      <MCTexture src="/textures/item/iron_pickaxe.png" size={48} alt="" />
    {/if}
    <div>
      <h1 class="mc-heading text-3xl">{template ? template.title.toUpperCase() : 'NOVO SERVER'}</h1>
      {#if template}
        <p class="text-xs text-mc-yellow mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
          template: {template.title} · {template.loader} · MC {template.mcVersion}
        </p>
      {/if}
    </div>
  </div>

  <div class="flex gap-1 mb-6">
    {#each steps as s}
      <div class="flex-1">
        <div class="h-2 border-2 border-black {s.n <= step ? 'bg-primary' : 'bg-stone'}" style="box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.2), inset -1px -1px 0 0 rgba(0,0,0,0.4);"></div>
        <p class="text-xs mt-1 text-center {s.n <= step ? 'text-primary' : 'text-white/50'}" style="text-shadow: 2px 2px 0 #3f3f3f;">{s.label}</p>
      </div>
    {/each}
  </div>

  <div class="mc-card space-y-5">
    {#if step === 1}
      <div class="space-y-4">
        <h2 class="mc-heading text-2xl">INFO BÁSICA</h2>
        <div class="space-y-2">
          <label for="name" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">nome do server</label>
          <!-- svelte-ignore a11y_autofocus -->
          <input id="name" type="text" bind:value={displayName} placeholder="Meu Server" class="mc-input" autofocus />
          <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
            container: <span class="text-diamond">forja-{displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || '...'}</span>
          </p>
        </div>
      </div>
    {:else if step === 2}
      <div class="space-y-4">
        <h2 class="mc-heading text-2xl">MODLOADER & VERSÃO</h2>

        <div class="space-y-2">
          <span class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">tipo</span>
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
                  <div class="text-xs opacity-80">{l.desc}</div>
                </div>
              </button>
            {/each}
          </div>
        </div>

        <div class="space-y-2">
          <span class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">versão MC</span>
          <VersionPicker bind:value={mcVersion} />
          <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
            qualquer versão Mojang (release ou snapshot). itzg/minecraft-server baixa na hora.
          </p>
          <div class="p-3 bg-mc-yellow/10 border-2 border-mc-yellow flex items-start gap-2" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
            <AlertCircle class="size-4 text-mc-yellow shrink-0 mt-0.5" />
            <p class="text-xs text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
              <strong>cliente Minecraft precisa estar EXATAMENTE em <code class="text-mc-yellow">{mcVersion}</code></strong>.
              versões diferentes desconectam com "Failed to decode packet". no launcher (Prism Launcher/oficial/Modrinth),
              crie/edite o perfil pra essa versão antes de conectar.
            </p>
          </div>
        </div>
      </div>
    {:else if step === 3}
      <div class="space-y-4">
        <h2 class="mc-heading text-2xl">RECURSOS</h2>

        <div class="space-y-2">
          <label for="ram" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">
            RAM: <span class="text-diamond">{memoryGb} GB</span>
          </label>
          <input id="ram" type="range" min="1" max="16" bind:value={memoryGb} class="w-full" />
          <div class="flex justify-between text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
            <span>1 GB</span><span>16 GB</span>
          </div>
        </div>

        <div class="space-y-2">
          <label for="players" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">max players</label>
          <input id="players" type="number" min="1" max="200" bind:value={maxPlayers} class="mc-input" />
        </div>

        <div class="space-y-2">
          <span class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">dificuldade</span>
          <div class="grid grid-cols-4 gap-2">
            {#each difficulties as d}
              <button
                type="button"
                onclick={() => (difficulty = d.id)}
                class="px-3 py-2 text-xs {difficulty === d.id ? 'bg-primary text-white' : 'bg-secondary text-white'}"
                style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
              >
                {d.label}
              </button>
            {/each}
          </div>
        </div>

        <div class="space-y-2">
          <label for="motd" class="block text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">MOTD (opcional)</label>
          <input id="motd" type="text" bind:value={motd} placeholder="Bem-vindo ao server!" class="mc-input" maxlength="120" />
        </div>
      </div>
    {:else if step === 4}
      <div class="space-y-4">
        <h2 class="mc-heading text-2xl">ACESSO PÚBLICO</h2>
        <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">como players vão conectar</p>

        <div class="grid gap-3">
          <button
            type="button"
            onclick={() => (accessMode = 'local')}
            class="text-left px-4 py-3 flex items-start gap-3 {accessMode === 'local' ? 'bg-primary text-white' : 'bg-secondary text-white'}"
            style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
          >
            <Home class="size-5 mt-0.5" />
            <div>
              <div class="text-sm">Local apenas</div>
              <div class="text-xs opacity-80 mt-0.5">acesso por IP do host + porta. recomendado pra LAN/IPv6.</div>
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
                Domínio próprio
                {#if configured.cloudflare}<span class="text-xs text-success">✓ CF configurado</span>{:else}<span class="text-xs text-warning">⚠ CF não configurado</span>{/if}
              </div>
              <div class="text-xs opacity-80 mt-0.5">
                {#if configured.cloudflare}
                  Vou criar CNAME automático via Cloudflare API.
                {:else}
                  <a href="/settings" class="text-mc-yellow underline">Configure CF</a> primeiro pra DNS auto.
                {/if}
              </div>
            </div>
          </button>

          {#if accessMode === 'domain'}
            <input
              type="text"
              bind:value={customDomain}
              placeholder="meu-server.exemplo.com"
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
                Playit.gg túnel
                {#if configured.playit}<span class="text-xs text-success">✓ agent configurado</span>{:else}<span class="text-xs text-warning">⚠ agent não configurado</span>{/if}
              </div>
              <div class="text-xs opacity-80 mt-0.5">
                {#if configured.playit}
                  IPv4 público garantido via túnel TCP.
                {:else}
                  <a href="/settings" class="text-mc-yellow underline">Configure Playit</a> pra túnel automático.
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
              <div>usar Drasl pra autenticação custom</div>
              <p class="text-xs text-white/60 mt-0.5">
                URL: <span class="text-diamond">{configured.draslUrl}</span>
              </p>
              <p class="text-xs text-white/60 mt-0.5">
                players sem conta Microsoft podem entrar via launcher compatível (Prism Launcher, FjordLauncher, HMCL).
              </p>
            </div>
          </label>
        {:else}
          <div class="p-4 bg-black/40 border-2 border-warning" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
            <div class="flex items-start gap-3">
              <AlertCircle class="size-5 text-warning mt-0.5 shrink-0" />
              <div class="flex-1">
                <p class="text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  Drasl não configurado
                </p>
                <p class="text-xs text-white/60 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  Configure a URL do Drasl em Configurações pra liberar autenticação custom (players sem conta Microsoft).
                </p>
                <a href="/settings" class="inline-flex items-center gap-2 mt-3 text-xs text-mc-yellow hover:underline" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  <SettingsIcon class="size-3.5" />
                  configurar Drasl agora →
                </a>
              </div>
            </div>
          </div>
        {/if}

        <hr class="border-black border-t-2 my-2" />

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <MessageSquare class="size-5 text-diamond" />
            <h3 class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">CHAT BRIDGE COM DISCORD (opcional)</h3>
          </div>

          {#if !configured.discord}
            <div class="p-3 bg-black/40 border-2 border-warning" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
              <div class="flex items-start gap-2">
                <AlertCircle class="size-4 text-warning mt-0.5 shrink-0" />
                <div>
                  <p class="text-xs text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">bot Discord não configurado</p>
                  <a href="/settings" class="inline-flex items-center gap-1 mt-1 text-xs text-mc-yellow hover:underline" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    <SettingsIcon class="size-3" /> configurar bot →
                  </a>
                </div>
              </div>
            </div>
          {:else if loadingDiscordGuilds}
            <div class="text-center py-3"><Loader2 class="size-4 animate-spin mx-auto text-white/50" /></div>
          {:else if !discordBotConnected}
            <p class="text-xs text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">
              ⚠ token configurado mas bot não conectou. cheque token em Settings.
            </p>
          {:else if discordGuilds.length === 0}
            <p class="text-xs text-warning" style="text-shadow: 2px 2px 0 #3f3f3f;">
              bot conectado mas não está em nenhum servidor Discord. <a href="/settings" class="text-mc-yellow underline">adicionar bot a um servidor →</a>
            </p>
          {:else}
            <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
              players do MC e do Discord conversam no mesmo chat. join/leave/morte também aparecem.
            </p>
            <div class="grid gap-2 sm:grid-cols-2">
              <div>
                <label for="wiz-discord-guild" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">servidor Discord</label>
                <select id="wiz-discord-guild" bind:value={discordGuildId} class="mc-input text-sm">
                  <option value="">— sem bridge —</option>
                  {#each discordGuilds as g}
                    <option value={g.id}>{g.name}</option>
                  {/each}
                </select>
              </div>
              <div>
                <span class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">canal de texto</span>
                {#if !discordGuildId}
                  <select disabled class="mc-input text-sm opacity-50">
                    <option>selecione servidor primeiro</option>
                  </select>
                {:else if loadingDiscordChannels}
                  <div class="mc-input text-sm flex items-center gap-2 text-white/50">
                    <Loader2 class="size-3 animate-spin" /> carregando...
                  </div>
                {:else if discordChannels.length === 0}
                  <p class="text-xs text-warning" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    sem canais acessíveis. bot precisa View Channel + Send Messages.
                  </p>
                {:else}
                  <select bind:value={discordChannelId} class="mc-input text-sm">
                    <option value={null}>— escolha —</option>
                    {#each discordChannels as ch}
                      <option value={ch.id}># {ch.name}</option>
                    {/each}
                  </select>
                {/if}
              </div>
            </div>
            {#if discordChannelId}
              <p class="text-xs text-success" style="text-shadow: 2px 2px 0 #3f3f3f;">
                ✓ bridge será ativada automaticamente após criar o server
              </p>
            {/if}
          {/if}
        </div>
      </div>
    {:else}
      <div class="space-y-4">
        <h2 class="mc-heading text-2xl">CONFIRMAR</h2>

        <dl class="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">nome</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{displayName}</dd>
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">modloader</dt><dd class="text-diamond" style="text-shadow: 2px 2px 0 #3f3f3f;">{modloaderType}</dd>
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">versão MC</dt><dd class="text-diamond" style="text-shadow: 2px 2px 0 #3f3f3f;">{mcVersion}</dd>
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">RAM</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{memoryGb} GB</dd>
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">max players</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{maxPlayers}</dd>
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">dificuldade</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{difficulty}</dd>
          {#if motd}
            <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">MOTD</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{motd}</dd>
          {/if}
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">acesso</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{accessMode === 'local' ? 'local' : accessMode === 'domain' ? customDomain : 'Playit.gg'}</dd>
          <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">Drasl</dt><dd style="text-shadow: 2px 2px 0 #3f3f3f;">{draslEnabled ? 'sim' : 'não'}</dd>
          {#if discordChannelId}
            {@const ch = discordChannels.find((c) => c.id === discordChannelId)}
            {@const guild = discordGuilds.find((g) => g.id === discordGuildId)}
            <dt class="text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">Discord bridge</dt>
            <dd class="text-diamond" style="text-shadow: 2px 2px 0 #3f3f3f;">
              {guild?.name ?? '?'} → #{ch?.name ?? discordChannelId}
            </dd>
          {/if}
        </dl>

        {#if error}
          <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {error}</p>
        {/if}

        <p class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
          Vou criar o container, baixar a imagem (se necessário), alocar porta livre, iniciar o server.
        </p>
      </div>
    {/if}
  </div>

  <div class="flex justify-between mt-6">
    {#if step > 1}
      <button type="button" onclick={() => (step = (step - 1) as Step)} class="mc-btn">
        <ArrowLeft class="size-4" /> voltar
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
        avançar <ArrowRight class="size-4" />
      </button>
    {:else}
      <button type="button" onclick={submit} disabled={submitting} class="mc-btn mc-btn-primary">
        {#if submitting}
          <Loader2 class="size-4 animate-spin" /> criando...
        {:else}
          <Check class="size-4" /> criar e iniciar
        {/if}
      </button>
    {/if}
  </div>
</div>
