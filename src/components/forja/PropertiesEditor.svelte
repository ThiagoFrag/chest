<script lang="ts">
  import { Loader2, Save, RotateCcw, AlertTriangle, FileText, Settings as SettingsIcon, Globe, Network, Shield } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';

  let { containerName }: { containerName: string } = $props();

  type FieldType = 'string' | 'int' | 'bool' | 'enum' | 'text';

  interface Field {
    key: string;
    label: string;
    type: FieldType;
    options?: string[];
    min?: number;
    max?: number;
    placeholder?: string;
    help?: string;
  }

  interface Group {
    title: string;
    icon: string;
    desc: string;
    fields: Field[];
  }

  const GROUPS: Group[] = [
    {
      title: 'GAMEPLAY',
      icon: 'diamond_sword.png',
      desc: 'mecânica e regras',
      fields: [
        { key: 'gamemode', label: 'modo de jogo', type: 'enum', options: ['survival', 'creative', 'adventure', 'spectator'] },
        { key: 'difficulty', label: 'dificuldade', type: 'enum', options: ['peaceful', 'easy', 'normal', 'hard'] },
        { key: 'hardcore', label: 'hardcore', type: 'bool', help: 'morte = banido' },
        { key: 'pvp', label: 'PvP entre players', type: 'bool' },
        { key: 'force-gamemode', label: 'forçar gamemode no login', type: 'bool' },
        { key: 'online-mode', label: 'auth Mojang/Microsoft', type: 'bool', help: 'desligar pra usar Drasl' },
        { key: 'allow-flight', label: 'permitir voar (creative/mods)', type: 'bool' },
        { key: 'spawn-protection', label: 'raio de proteção spawn', type: 'int', min: 0, max: 64 },
        { key: 'op-permission-level', label: 'level dos operadores', type: 'enum', options: ['1', '2', '3', '4'], help: '4 = todos os comandos' }
      ]
    },
    {
      title: 'MUNDO',
      icon: 'grass_block_top.png',
      desc: 'geração e física',
      fields: [
        { key: 'level-name', label: 'nome do world (pasta)', type: 'string', placeholder: 'world' },
        { key: 'level-seed', label: 'seed', type: 'string', placeholder: 'random se vazio' },
        { key: 'level-type', label: 'tipo de mundo', type: 'enum', options: ['minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified', 'minecraft:single_biome_surface'] },
        { key: 'allow-nether', label: 'nether ativo', type: 'bool' },
        { key: 'generate-structures', label: 'gerar vilas/dungeons/etc', type: 'bool' },
        { key: 'spawn-monsters', label: 'spawn de mobs hostis', type: 'bool' },
        { key: 'spawn-animals', label: 'spawn de animais', type: 'bool' },
        { key: 'spawn-npcs', label: 'spawn de aldeões', type: 'bool' },
        { key: 'max-world-size', label: 'raio máx do world', type: 'int', min: 1, max: 29999984, help: '29999984 = ilimitado' }
      ]
    },
    {
      title: 'NETWORK',
      icon: 'redstone.png',
      desc: 'porta, performance, distância',
      fields: [
        { key: 'server-port', label: 'porta MC', type: 'int', min: 1, max: 65535, help: 'normalmente 25565' },
        { key: 'max-players', label: 'max players online', type: 'int', min: 1, max: 1000 },
        { key: 'view-distance', label: 'view distance (chunks)', type: 'int', min: 3, max: 32 },
        { key: 'simulation-distance', label: 'simulation distance', type: 'int', min: 3, max: 32 },
        { key: 'network-compression-threshold', label: 'compression threshold (bytes)', type: 'int', min: -1, max: 65535, help: '-1 desativa, 256 default' },
        { key: 'rate-limit', label: 'rate limit pkt/s (0 desliga)', type: 'int', min: 0, max: 1000 },
        { key: 'enable-query', label: 'protocolo query (GameSpy)', type: 'bool' },
        { key: 'prevent-proxy-connections', label: 'bloquear VPN/proxy', type: 'bool' }
      ]
    },
    {
      title: 'MOTD & PLAYERS',
      icon: 'experience_bottle.png',
      desc: 'mensagem do server e listas',
      fields: [
        { key: 'motd', label: 'MOTD (linha 1 da lista)', type: 'text', placeholder: 'A Minecraft Server' },
        { key: 'white-list', label: 'whitelist ativa', type: 'bool', help: 'só players da allowlist entram' },
        { key: 'enforce-whitelist', label: 'expulsar não-whitelisted', type: 'bool', help: 'aplica a quem já está online' },
        { key: 'enforce-secure-profile', label: 'exigir chave de chat assinada', type: 'bool' },
        { key: 'broadcast-rcon-to-ops', label: 'mostrar comandos RCON pros OPs', type: 'bool' },
        { key: 'broadcast-console-to-ops', label: 'mostrar comandos console pros OPs', type: 'bool' },
        { key: 'hide-online-players', label: 'esconder lista de players', type: 'bool' }
      ]
    }
  ];

  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let saved = $state(false);
  let restartNeeded = $state(false);
  let activeTab = $state(0);

  let original = $state<Record<string, string>>({});
  let edited = $state<Record<string, string>>({});

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch(`/api/servers/${containerName}/properties`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? `erro ${res.status}`);
      }
      const data = await res.json();
      original = { ...data.properties };
      edited = { ...data.properties };
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha ao carregar';
    } finally {
      loading = false;
    }
  }

  function getValue(key: string): string {
    return edited[key] ?? original[key] ?? '';
  }

  function setValue(key: string, value: string) {
    edited = { ...edited, [key]: value };
  }

  function isDirty(): boolean {
    for (const k of Object.keys(edited)) {
      if ((edited[k] ?? '') !== (original[k] ?? '')) return true;
    }
    return false;
  }

  function changedKeys(): string[] {
    return Object.keys(edited).filter((k) => (edited[k] ?? '') !== (original[k] ?? ''));
  }

  async function save() {
    saving = true;
    error = null;
    saved = false;
    try {
      const changed: Record<string, string> = {};
      for (const k of changedKeys()) changed[k] = edited[k];
      const res = await fetch(`/api/servers/${containerName}/properties`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ properties: changed })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? `erro ${res.status}`);
      }
      const data = await res.json();
      original = { ...edited };
      restartNeeded = !!data.restartNeeded;
      saved = true;
      setTimeout(() => (saved = false), 2500);
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha';
    } finally {
      saving = false;
    }
  }

  function reset() {
    edited = { ...original };
    error = null;
    saved = false;
  }

  load();
</script>

{#if loading}
  <div class="text-center py-12">
    <Loader2 class="size-8 animate-spin mx-auto text-mc-yellow" />
    <p class="text-sm text-white/60 mt-3" style="text-shadow: 2px 2px 0 #3f3f3f;">lendo server.properties...</p>
  </div>
{:else if error && Object.keys(original).length === 0}
  <div class="mc-card border-destructive">
    <div class="flex items-start gap-3">
      <AlertTriangle class="size-6 text-destructive shrink-0" />
      <div class="flex-1">
        <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">erro ao carregar</p>
        <p class="text-xs text-white/60 mt-1 font-mono">{error}</p>
        <button type="button" onclick={load} class="mc-btn mt-3">
          <RotateCcw class="size-4" /> tentar de novo
        </button>
      </div>
    </div>
  </div>
{:else}
  <div class="grid gap-4 lg:grid-cols-[200px_1fr]">
    <!-- Sidebar de tabs -->
    <aside class="space-y-1">
      {#each GROUPS as g, i}
        <button
          type="button"
          onclick={() => (activeTab = i)}
          class="w-full text-left px-3 py-2 flex items-center gap-2 text-sm {activeTab === i ? 'bg-primary text-white' : 'bg-secondary text-white hover:bg-stone'}"
          style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
        >
          <div class="mc-slot shrink-0" style="padding: 1px;">
            <MCTexture src={`/textures/item/${g.icon}`} size={20} />
          </div>
          <div class="flex-1 text-xs">{g.title}</div>
        </button>
      {/each}
    </aside>

    <section class="mc-card space-y-4">
      <header class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl" style="text-shadow: 2px 2px 0 #3f3f3f;">{GROUPS[activeTab].title}</h2>
          <p class="text-xs text-white/60 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{GROUPS[activeTab].desc}</p>
        </div>
        {#if isDirty()}
          <span class="text-xs text-mc-yellow flex items-center gap-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
            <span class="size-2 bg-mc-yellow rounded-full animate-pulse"></span>
            {changedKeys().length} mudanças
          </span>
        {/if}
      </header>

      <div class="space-y-3">
        {#each GROUPS[activeTab].fields as f}
          {@const v = getValue(f.key)}
          {@const orig = original[f.key] ?? ''}
          {@const changed = (edited[f.key] ?? '') !== orig}
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label for={f.key} class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {f.label}
                <code class="text-[10px] text-white/40 ml-2 font-mono">{f.key}</code>
              </label>
              {#if changed}
                <span class="text-[10px] text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">modificado</span>
              {/if}
            </div>

            {#if f.type === 'bool'}
              <div class="flex gap-2">
                <button
                  type="button"
                  onclick={() => setValue(f.key, 'true')}
                  class="flex-1 px-3 py-2 text-sm {v === 'true' ? 'bg-success text-white' : 'bg-secondary text-white/70'}"
                  style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
                >
                  ✓ true
                </button>
                <button
                  type="button"
                  onclick={() => setValue(f.key, 'false')}
                  class="flex-1 px-3 py-2 text-sm {v === 'false' ? 'bg-destructive text-white' : 'bg-secondary text-white/70'}"
                  style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.15), inset -2px -2px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;"
                >
                  ✗ false
                </button>
              </div>
            {:else if f.type === 'enum'}
              <select id={f.key} value={v} onchange={(e) => setValue(f.key, (e.target as HTMLSelectElement).value)} class="mc-input">
                {#each f.options ?? [] as opt}
                  <option value={opt}>{opt}</option>
                {/each}
              </select>
            {:else if f.type === 'int'}
              <input
                id={f.key}
                type="number"
                value={v}
                min={f.min}
                max={f.max}
                oninput={(e) => setValue(f.key, (e.target as HTMLInputElement).value)}
                class="mc-input"
              />
            {:else if f.type === 'text'}
              <input id={f.key} type="text" value={v} placeholder={f.placeholder} oninput={(e) => setValue(f.key, (e.target as HTMLInputElement).value)} class="mc-input" />
            {:else}
              <input id={f.key} type="text" value={v} placeholder={f.placeholder} oninput={(e) => setValue(f.key, (e.target as HTMLInputElement).value)} class="mc-input" />
            {/if}

            {#if f.help}
              <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">ℹ {f.help}</p>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  </div>

  <!-- Footer fixo -->
  <div class="mt-4 mc-card flex items-center justify-between gap-4">
    <div class="text-xs text-white/70" style="text-shadow: 2px 2px 0 #3f3f3f;">
      {#if isDirty()}
        <strong class="text-mc-yellow">{changedKeys().length}</strong> propriedade(s) modificada(s).
        salvar exige <strong>restart do server</strong> pra aplicar.
      {:else if saved}
        <span class="text-success">✓ salvo!</span>
        {#if restartNeeded}<span class="text-mc-yellow ml-2">⚠ reinicie o server pra aplicar</span>{/if}
      {:else}
        sem mudanças
      {/if}
    </div>

    <div class="flex gap-2">
      <button type="button" onclick={reset} disabled={!isDirty() || saving} class="mc-btn">
        <RotateCcw class="size-4" /> desfazer
      </button>
      <button type="button" onclick={save} disabled={!isDirty() || saving} class="mc-btn mc-btn-primary">
        {#if saving}
          <Loader2 class="size-4 animate-spin" /> salvando...
        {:else}
          <Save class="size-4" /> salvar
        {/if}
      </button>
    </div>
  </div>

  {#if error && Object.keys(original).length > 0}
    <p class="text-sm text-destructive mt-3" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {error}</p>
  {/if}
{/if}
