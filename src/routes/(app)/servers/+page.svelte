<script lang="ts">
  import ServerCard from '$components/forja/ServerCard.svelte';
  import { Plus } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  let { data } = $props();
</script>

<svelte:head><title>Chest · Servers</title></svelte:head>

<div class="px-8 py-6">
  <div class="mc-banner mb-6 flex items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <MCTexture src="/textures/item/diamond_pickaxe.png" size={48} alt="" />
      <div>
        <h1 class="mc-heading text-3xl">SERVERS</h1>
        <p class="mt-1 text-xs text-white/80" style="text-shadow: 2px 2px 0 #3f3f3f;">
          containers com label <span class="text-diamond">forja.managed=true</span>
        </p>
      </div>
    </div>
    <div class="flex gap-2">
      <a href="/servers/templates" class="mc-btn mc-btn-accent">
        templates
      </a>
      <a href="/servers/new" class="mc-btn mc-btn-primary">
        <Plus class="size-4" />
        novo server
      </a>
    </div>
  </div>

  {#if data.servers.length === 0}
    <div class="mc-card text-center py-16">
      <div class="flex justify-center mb-4 opacity-60">
        <MCTexture src="/textures/item/ender_eye.png" size={64} alt="" />
      </div>
      <p class="text-lg text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
        inventário vazio
      </p>
      <p class="mt-2 text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
        crie um novo server ou adicione label <span class="text-diamond">forja.managed=true</span> em container existente.
      </p>
      <a href="/servers/new" class="mc-btn mc-btn-primary mt-6 inline-flex">
        <Plus class="size-4" />
        criar primeiro server
      </a>
    </div>
  {:else}
    <p class="text-sm text-white/70 mb-4" style="text-shadow: 2px 2px 0 #3f3f3f;">
      {data.servers.length} server{data.servers.length === 1 ? '' : 's'}
    </p>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each data.servers as server (server.id)}
        <ServerCard {server} />
      {/each}
    </div>
  {/if}
</div>
