<script lang="ts">
  import { Globe, Loader2, Check, Copy, ExternalLink, AlertCircle } from 'lucide-svelte';
  import { untrack } from 'svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';

  let { containerName, publicUrl: initialPublicUrl, publicMode: initialPublicMode, baseHostname }: {
    containerName: string;
    publicUrl: string | null;
    publicMode: 'local' | 'domain' | 'playit' | null;
    baseHostname: string | null;
  } = $props();

  let publicUrl = $state(untrack(() => initialPublicUrl));
  let publicMode = $state(untrack(() => initialPublicMode));

  let subdomain = $state('');
  let exposing = $state(false);
  let error = $state<string | null>(null);
  let copied = $state(false);

  async function expose() {
    if (!subdomain.trim()) return;
    exposing = true;
    error = null;
    try {
      const res = await fetch(`/api/servers/${containerName}/expose`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subdomain: subdomain.trim().toLowerCase() })
      });
      const data = await res.json();
      if (!res.ok) {
        error = data.message ?? `erro ${res.status}`;
        return;
      }
      publicUrl = data.publicUrl;
      publicMode = 'domain';
      subdomain = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha';
    } finally {
      exposing = false;
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {}
  }
</script>

<div class="grid gap-6 lg:grid-cols-2">
  <section class="mc-card">
    <header class="mb-4 flex items-center gap-3">
      <div class="mc-slot"><MCTexture src="/textures/item/ender_eye.png" size={24} /></div>
      <div>
        <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">ACESSO PÚBLICO</h3>
        <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">como players conectam</p>
      </div>
    </header>

    {#if publicUrl}
      <div class="space-y-3">
        <div class="flex items-center gap-2 bg-black/40 border-2 border-success px-3 py-2" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
          <span class="text-success">●</span>
          <span class="flex-1 text-sm text-white font-mono" style="text-shadow: 2px 2px 0 #3f3f3f;">{publicUrl}</span>
          <button type="button" onclick={() => copy(publicUrl!)} class="text-white/60 hover:text-mc-yellow" title="copiar">
            {#if copied}<Check class="size-4 text-success" />{:else}<Copy class="size-4" />{/if}
          </button>
        </div>
        <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
          modo: <span class="text-diamond">{publicMode}</span>
        </p>
        <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">
          players colam esse endereço no Minecraft pra conectar.
        </p>
      </div>
    {:else}
      <div class="p-3 bg-black/40 border-2 border-black mb-4" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
        <p class="text-sm text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
          ⚠ server ainda sem acesso público configurado
        </p>
      </div>
    {/if}
  </section>

  <section class="mc-card">
    <header class="mb-4 flex items-center gap-3">
      <div class="mc-slot"><Globe class="size-5 text-diamond" /></div>
      <div>
        <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">EXPOR VIA CLOUDFLARE</h3>
        <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">cria CNAME automático</p>
      </div>
    </header>

    {#if !baseHostname}
      <div class="p-3 bg-black/40 border-2 border-warning" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
        <div class="flex items-start gap-2">
          <AlertCircle class="size-5 text-warning mt-0.5 shrink-0" />
          <div>
            <p class="text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">Cloudflare não configurado</p>
            <p class="text-xs text-white/60 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
              Configure API token, zone ID e CNAME target em
              <a href="/settings" class="text-mc-yellow underline">Settings</a> pra liberar.
            </p>
          </div>
        </div>
      </div>
    {:else}
      <div class="space-y-3">
        <div>
          <label for="sub" class="block text-sm mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">subdomain</label>
          <div class="flex items-center gap-2">
            <input
              id="sub"
              type="text"
              bind:value={subdomain}
              placeholder="meu-server"
              class="mc-input flex-1"
              autocomplete="off"
            />
            <span class="text-sm text-white/60 whitespace-nowrap" style="text-shadow: 2px 2px 0 #3f3f3f;">
              .{baseHostname}
            </span>
          </div>
          <p class="text-xs text-white/50 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
            só letras, números e hífen. cria CNAME apontando pro target configurado.
          </p>
        </div>

        {#if error}
          <p class="text-xs text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {error}</p>
        {/if}

        <button
          type="button"
          onclick={expose}
          disabled={!subdomain.trim() || exposing}
          class="mc-btn mc-btn-primary w-full"
        >
          {#if exposing}
            <Loader2 class="size-4 animate-spin" /> criando DNS...
          {:else}
            <Globe class="size-4" /> {publicUrl ? 'atualizar DNS' : 'expor publicamente'}
          {/if}
        </button>
      </div>
    {/if}
  </section>
</div>
