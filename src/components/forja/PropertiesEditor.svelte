<script lang="ts">
  import { Loader2, Save, RotateCcw, AlertTriangle, FileText, Settings as SettingsIcon, Globe, Network, Shield } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import { t } from '$lib/i18n';

  let { containerName }: { containerName: string } = $props();

  type FieldType = 'string' | 'int' | 'bool' | 'enum' | 'text';

  interface Field {
    key: string;
    labelKey: string;
    type: FieldType;
    options?: string[];
    min?: number;
    max?: number;
    placeholder?: string;
    placeholderKey?: string;
    helpKey?: string;
  }

  interface Group {
    titleKey: string;
    descKey: string;
    icon: string;
    fields: Field[];
  }

  const GROUPS: Group[] = [
    {
      titleKey: 'serverconfig.props.gameplay.title',
      icon: 'diamond_sword.png',
      descKey: 'serverconfig.props.gameplay.desc',
      fields: [
        { key: 'gamemode', labelKey: 'serverconfig.props.field.gamemode', type: 'enum', options: ['survival', 'creative', 'adventure', 'spectator'] },
        { key: 'difficulty', labelKey: 'serverconfig.props.field.difficulty', type: 'enum', options: ['peaceful', 'easy', 'normal', 'hard'] },
        { key: 'hardcore', labelKey: 'serverconfig.props.field.hardcore', type: 'bool', helpKey: 'serverconfig.props.field.hardcore.help' },
        { key: 'pvp', labelKey: 'serverconfig.props.field.pvp', type: 'bool' },
        { key: 'force-gamemode', labelKey: 'serverconfig.props.field.forceGamemode', type: 'bool' },
        { key: 'online-mode', labelKey: 'serverconfig.props.field.onlineMode', type: 'bool', helpKey: 'serverconfig.props.field.onlineMode.help' },
        { key: 'allow-flight', labelKey: 'serverconfig.props.field.allowFlight', type: 'bool' },
        { key: 'spawn-protection', labelKey: 'serverconfig.props.field.spawnProtection', type: 'int', min: 0, max: 64 },
        { key: 'op-permission-level', labelKey: 'serverconfig.props.field.opPermissionLevel', type: 'enum', options: ['1', '2', '3', '4'], helpKey: 'serverconfig.props.field.opPermissionLevel.help' }
      ]
    },
    {
      titleKey: 'serverconfig.props.world.title',
      icon: 'grass_block_top.png',
      descKey: 'serverconfig.props.world.desc',
      fields: [
        { key: 'level-name', labelKey: 'serverconfig.props.field.levelName', type: 'string', placeholder: 'world' },
        { key: 'level-seed', labelKey: 'serverconfig.props.field.levelSeed', type: 'string', placeholderKey: 'serverconfig.props.field.levelSeed.placeholder' },
        { key: 'level-type', labelKey: 'serverconfig.props.field.levelType', type: 'enum', options: ['minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified', 'minecraft:single_biome_surface'] },
        { key: 'allow-nether', labelKey: 'serverconfig.props.field.allowNether', type: 'bool' },
        { key: 'generate-structures', labelKey: 'serverconfig.props.field.generateStructures', type: 'bool' },
        { key: 'spawn-monsters', labelKey: 'serverconfig.props.field.spawnMonsters', type: 'bool' },
        { key: 'spawn-animals', labelKey: 'serverconfig.props.field.spawnAnimals', type: 'bool' },
        { key: 'spawn-npcs', labelKey: 'serverconfig.props.field.spawnNpcs', type: 'bool' },
        { key: 'max-world-size', labelKey: 'serverconfig.props.field.maxWorldSize', type: 'int', min: 1, max: 29999984, helpKey: 'serverconfig.props.field.maxWorldSize.help' }
      ]
    },
    {
      titleKey: 'serverconfig.props.network.title',
      icon: 'redstone.png',
      descKey: 'serverconfig.props.network.desc',
      fields: [
        { key: 'server-port', labelKey: 'serverconfig.props.field.serverPort', type: 'int', min: 1, max: 65535, helpKey: 'serverconfig.props.field.serverPort.help' },
        { key: 'max-players', labelKey: 'serverconfig.props.field.maxPlayers', type: 'int', min: 1, max: 1000 },
        { key: 'view-distance', labelKey: 'serverconfig.props.field.viewDistance', type: 'int', min: 3, max: 32 },
        { key: 'simulation-distance', labelKey: 'serverconfig.props.field.simulationDistance', type: 'int', min: 3, max: 32 },
        { key: 'network-compression-threshold', labelKey: 'serverconfig.props.field.networkCompressionThreshold', type: 'int', min: -1, max: 65535, helpKey: 'serverconfig.props.field.networkCompressionThreshold.help' },
        { key: 'rate-limit', labelKey: 'serverconfig.props.field.rateLimit', type: 'int', min: 0, max: 1000 },
        { key: 'enable-query', labelKey: 'serverconfig.props.field.enableQuery', type: 'bool' },
        { key: 'prevent-proxy-connections', labelKey: 'serverconfig.props.field.preventProxyConnections', type: 'bool' }
      ]
    },
    {
      titleKey: 'serverconfig.props.motd.title',
      icon: 'experience_bottle.png',
      descKey: 'serverconfig.props.motd.desc',
      fields: [
        { key: 'motd', labelKey: 'serverconfig.props.field.motd', type: 'text', placeholder: 'A Minecraft Server' },
        { key: 'white-list', labelKey: 'serverconfig.props.field.whiteList', type: 'bool', helpKey: 'serverconfig.props.field.whiteList.help' },
        { key: 'enforce-whitelist', labelKey: 'serverconfig.props.field.enforceWhitelist', type: 'bool', helpKey: 'serverconfig.props.field.enforceWhitelist.help' },
        { key: 'enforce-secure-profile', labelKey: 'serverconfig.props.field.enforceSecureProfile', type: 'bool' },
        { key: 'broadcast-rcon-to-ops', labelKey: 'serverconfig.props.field.broadcastRconToOps', type: 'bool' },
        { key: 'broadcast-console-to-ops', labelKey: 'serverconfig.props.field.broadcastConsoleToOps', type: 'bool' },
        { key: 'hide-online-players', labelKey: 'serverconfig.props.field.hideOnlinePlayers', type: 'bool' }
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
        throw new Error(e.message ?? t('serverconfig.error.status', { status: res.status }));
      }
      const data = await res.json();
      original = { ...data.properties };
      edited = { ...data.properties };
    } catch (e) {
      error = e instanceof Error ? e.message : t('serverconfig.error.failLoad');
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
        throw new Error(e.message ?? t('serverconfig.error.status', { status: res.status }));
      }
      const data = await res.json();
      original = { ...edited };
      restartNeeded = !!data.restartNeeded;
      saved = true;
      setTimeout(() => (saved = false), 2500);
    } catch (e) {
      error = e instanceof Error ? e.message : t('serverconfig.error.fail');
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
    <p class="text-sm text-white/60 mt-3" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverconfig.props.loading')}</p>
  </div>
{:else if error && Object.keys(original).length === 0}
  <div class="mc-card border-destructive">
    <div class="flex items-start gap-3">
      <AlertTriangle class="size-6 text-destructive shrink-0" />
      <div class="flex-1">
        <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverconfig.props.error.load')}</p>
        <p class="text-xs text-white/60 mt-1 font-mono">{error}</p>
        <button type="button" onclick={load} class="mc-btn mt-3">
          <RotateCcw class="size-4" /> {t('serverconfig.props.retry')}
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
          <div class="flex-1 text-xs">{t(g.titleKey)}</div>
        </button>
      {/each}
    </aside>

    <section class="mc-card space-y-4">
      <header class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl" style="text-shadow: 2px 2px 0 #3f3f3f;">{t(GROUPS[activeTab].titleKey)}</h2>
          <p class="text-xs text-white/60 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t(GROUPS[activeTab].descKey)}</p>
        </div>
        {#if isDirty()}
          <span class="text-xs text-mc-yellow flex items-center gap-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
            <span class="size-2 bg-mc-yellow rounded-full animate-pulse"></span>
            {t('serverconfig.props.changes', { n: changedKeys().length })}
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
                {t(f.labelKey)}
                <code class="text-[10px] text-white/40 ml-2 font-mono">{f.key}</code>
              </label>
              {#if changed}
                <span class="text-[10px] text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('serverconfig.props.modified')}</span>
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
              <input id={f.key} type="text" value={v} placeholder={f.placeholderKey ? t(f.placeholderKey) : f.placeholder} oninput={(e) => setValue(f.key, (e.target as HTMLInputElement).value)} class="mc-input" />
            {:else}
              <input id={f.key} type="text" value={v} placeholder={f.placeholderKey ? t(f.placeholderKey) : f.placeholder} oninput={(e) => setValue(f.key, (e.target as HTMLInputElement).value)} class="mc-input" />
            {/if}

            {#if f.helpKey}
              <p class="text-xs text-white/50" style="text-shadow: 2px 2px 0 #3f3f3f;">ℹ {t(f.helpKey)}</p>
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
        {t('serverconfig.props.footer.dirty', { n: changedKeys().length })}
      {:else if saved}
        <span class="text-success">{t('serverconfig.props.footer.saved')}</span>
        {#if restartNeeded}<span class="text-mc-yellow ml-2">{t('serverconfig.props.footer.restartNeeded')}</span>{/if}
      {:else}
        {t('serverconfig.props.footer.clean')}
      {/if}
    </div>

    <div class="flex gap-2">
      <button type="button" onclick={reset} disabled={!isDirty() || saving} class="mc-btn">
        <RotateCcw class="size-4" /> {t('serverconfig.props.undo')}
      </button>
      <button type="button" onclick={save} disabled={!isDirty() || saving} class="mc-btn mc-btn-primary">
        {#if saving}
          <Loader2 class="size-4 animate-spin" /> {t('serverconfig.props.saving')}
        {:else}
          <Save class="size-4" /> {t('serverconfig.props.save')}
        {/if}
      </button>
    </div>
  </div>

  {#if error && Object.keys(original).length > 0}
    <p class="text-sm text-destructive mt-3" style="text-shadow: 2px 2px 0 #3f3f3f;">⚠ {error}</p>
  {/if}
{/if}
