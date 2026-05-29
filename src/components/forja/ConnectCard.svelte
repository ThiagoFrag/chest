<script lang="ts">
  import { Copy, Check, Globe, Network, Home, AlertCircle, Package } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';

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

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      copied = key;
      setTimeout(() => (copied = null), 1500);
    });
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
    <p class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">COMO CONECTAR</p>
  </div>

  {#if !hostPort}
    <div class="flex items-center gap-2 text-warning text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">
      <AlertCircle class="size-4" />
      server precisa estar rodando pra mostrar endereço
    </div>
  {:else}
    {#if mcVersion}
      <div class="mb-3 p-3 bg-mc-yellow/10 border-2 border-mc-yellow flex items-start gap-3" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
        <Package class="size-5 text-mc-yellow shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-sm text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
            ATENÇÃO — versão exigida no cliente Minecraft:
            <strong class="ml-1">{mcVersion}</strong>
          </p>
          <p class="text-[10px] text-white/70 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
            no launcher (Prism/oficial/etc), escolha perfil <code class="text-mc-yellow">Release {mcVersion}</code>.
            versão diferente = conexão cai com "Failed to decode packet".
          </p>
        </div>
        <button
          type="button"
          onclick={() => copy(mcVersion ?? '', 'version')}
          class="mc-btn text-xs px-2"
          title="copiar versão"
        >
          {#if copied === 'version'}<Check class="size-3 text-success" />{:else}<Copy class="size-3" />{/if}
        </button>
      </div>
    {/if}

    <div class="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
      <!-- LAN / direto pelo host -->
      <div class="bg-black/40 border-2 border-black p-3" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
        <div class="flex items-center gap-2 mb-2">
          <Home class="size-4 text-mc-yellow" />
          <span class="text-xs text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">DIRETO (LAN/IPv6)</span>
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
              title="copiar"
            >
              {#if copied === 'local'}<Check class="size-3 text-success" />{:else}<Copy class="size-3" />{/if}
            </button>
          </div>
          <p class="text-[10px] text-white/50 mt-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
            cole no Minecraft → Multiplayer → Add Server
          </p>
        {:else}
          <p class="text-xs text-warning" style="text-shadow: 2px 2px 0 #3f3f3f;">
            configure <code class="text-mc-yellow">forja.mc_host_address</code> em
            <a href="/settings" class="text-mc-yellow underline">Settings</a>
            pra mostrar endereço completo
          </p>
          <p class="text-xs text-white/60 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
            porta alocada: <code class="text-diamond">{hostPort}</code>
          </p>
        {/if}
      </div>

      <!-- Public URL (domain custom via CF / Playit) -->
      {#if publicUrl}
        <div class="bg-black/40 border-2 border-success p-3" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
          <div class="flex items-center gap-2 mb-2">
            {#if publicMode === 'playit'}
              <Network class="size-4 text-mc-yellow" />
              <span class="text-xs text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">PÚBLICO (Playit.gg túnel)</span>
            {:else}
              <Globe class="size-4 text-mc-yellow" />
              <span class="text-xs text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">PÚBLICO (Cloudflare CNAME)</span>
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
              title="copiar"
            >
              {#if copied === 'public'}<Check class="size-3 text-success" />{:else}<Copy class="size-3" />{/if}
            </button>
          </div>
          <p class="text-[10px] text-white/50 mt-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
            funciona em qualquer lugar do mundo
          </p>
        </div>
      {:else}
        <div class="bg-black/40 border-2 border-black p-3" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
          <div class="flex items-center gap-2 mb-2">
            <Globe class="size-4 text-white/40" />
            <span class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">PÚBLICO</span>
          </div>
          <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
            sem URL pública configurada.
          </p>
          <a href="#rede" class="text-xs text-mc-yellow underline mt-1 inline-block" style="text-shadow: 2px 2px 0 #3f3f3f;">
            expor agora na aba REDE →
          </a>
        </div>
      {/if}
    </div>
  {/if}
</div>
