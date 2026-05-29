<script lang="ts">
  import { onMount } from 'svelte';
  import { Webhook, Plus, Loader2, Trash2, Send, Check, X, AlertCircle, Copy } from 'lucide-svelte';

  let { data } = $props();

  interface WebhookRow {
    id: string;
    name: string;
    url: string;
    secret: string;
    events: string[];
    serverId: string | null;
    enabled: boolean;
    createdAt: string | Date;
    lastDeliveryAt: string | Date | null;
    lastDeliveryStatus: 'ok' | 'fail' | null;
    lastDeliveryMessage: string | null;
    consecutiveFailures: number;
  }

  let webhooks = $state<WebhookRow[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let busy = $state<string | null>(null);
  let copiedSecret = $state<string | null>(null);

  let newName = $state('');
  let newUrl = $state('');
  let newEvents = $state<Set<string>>(new Set(['*']));

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/webhooks');
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? `erro ${res.status}`);
      }
      const d = await res.json();
      webhooks = d.webhooks ?? [];
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha';
    } finally {
      loading = false;
    }
  }

  async function create() {
    if (!newName.trim() || !newUrl.trim()) return;
    busy = 'create';
    error = null;
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          url: newUrl.trim(),
          events: [...newEvents]
        })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? 'falha');
      }
      const d = await res.json();
      copiedSecret = d.secret;
      newName = '';
      newUrl = '';
      newEvents = new Set(['*']);
      await load();
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha';
    } finally {
      busy = null;
    }
  }

  async function toggle(id: string, enabled: boolean) {
    busy = `toggle-${id}`;
    try {
      await fetch(`/api/webhooks/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled })
      });
      await load();
    } finally {
      busy = null;
    }
  }

  async function test(id: string) {
    busy = `test-${id}`;
    error = null;
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message ?? `erro ${res.status}`);
      await load();
    } catch (e) {
      error = e instanceof Error ? e.message : 'falha';
    } finally {
      busy = null;
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Remover webhook "${name}"?`)) return;
    busy = `del-${id}`;
    try {
      await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      await load();
    } finally {
      busy = null;
    }
  }

  function toggleEvent(ev: string) {
    const next = new Set(newEvents);
    if (next.has(ev)) next.delete(ev);
    else next.add(ev);
    newEvents = next;
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  onMount(() => {
    load();
  });
</script>

<svelte:head><title>Chest · Webhooks</title></svelte:head>

<div class="px-8 py-6 max-w-4xl">
  <div class="mc-banner mb-6 flex items-center gap-4">
    <Webhook class="size-10 text-mc-yellow" />
    <div>
      <h1 class="mc-heading text-3xl">WEBHOOKS</h1>
      <p class="mt-1 text-xs text-white/80" style="text-shadow: 2px 2px 0 #3f3f3f;">
        notifique sistemas externos quando eventos acontecem (Slack, n8n, Zapier, etc)
      </p>
    </div>
  </div>

  {#if copiedSecret}
    <div class="mc-card mb-4 border-2 border-mc-yellow bg-mc-yellow/10">
      <p class="text-sm text-mc-yellow mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
        ✓ webhook criado! Guarde o secret — será mostrado apenas uma vez:
      </p>
      <div class="flex items-center gap-2">
        <code class="flex-1 px-3 py-2 bg-black/40 font-mono text-xs break-all">{copiedSecret}</code>
        <button type="button" onclick={() => copy(copiedSecret!)} class="mc-btn text-xs">
          <Copy class="size-3" /> copiar
        </button>
        <button type="button" onclick={() => (copiedSecret = null)} class="mc-btn text-xs">já anotei</button>
      </div>
      <p class="text-[10px] text-white/70 mt-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
        seu endpoint deve verificar header <code class="text-mc-yellow">x-chest-signature: sha256=&lt;hmac&gt;</code>.
      </p>
    </div>
  {/if}

  {#if error}
    <div class="mc-card mb-4 border-l-4 border-l-destructive flex items-start gap-2">
      <AlertCircle class="size-4 text-destructive shrink-0 mt-1" />
      <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">{error}</p>
    </div>
  {/if}

  <section class="mc-card mb-6 space-y-3">
    <h2 class="text-lg mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">CRIAR WEBHOOK</h2>

    <div class="grid sm:grid-cols-2 gap-3">
      <div>
        <label for="wh-name" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">nome</label>
        <input id="wh-name" type="text" bind:value={newName} placeholder="Slack #ops" class="mc-input" />
      </div>
      <div>
        <label for="wh-url" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">URL</label>
        <input id="wh-url" type="url" bind:value={newUrl} placeholder="https://hooks.slack.com/..." class="mc-input" />
      </div>
    </div>

    <div>
      <span class="block text-xs text-white/70 mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
        eventos (use <code class="text-mc-yellow">*</code> pra todos ou <code class="text-mc-yellow">server.*</code> pra grupos)
      </span>
      <div class="flex flex-wrap gap-1">
        <button type="button" onclick={() => toggleEvent('*')}
          class="px-2 py-1 text-xs {newEvents.has('*') ? 'bg-primary text-white' : 'bg-secondary text-white/70'}"
          style="border: 2px solid #000; box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.15), inset -1px -1px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;">
          * todos
        </button>
        {#each data.availableEvents as ev}
          <button type="button" onclick={() => toggleEvent(ev)}
            class="px-2 py-1 text-xs {newEvents.has(ev) ? 'bg-primary text-white' : 'bg-secondary text-white/70'}"
            style="border: 2px solid #000; box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.15), inset -1px -1px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;">
            {ev}
          </button>
        {/each}
      </div>
    </div>

    <button
      type="button"
      onclick={create}
      disabled={!newName.trim() || !newUrl.trim() || busy === 'create'}
      class="mc-btn mc-btn-primary w-full"
    >
      {#if busy === 'create'}<Loader2 class="size-4 animate-spin" />{:else}<Plus class="size-4" />{/if}
      criar webhook
    </button>
  </section>

  <section>
    <h2 class="text-lg mb-3" style="text-shadow: 2px 2px 0 #3f3f3f;">
      WEBHOOKS CONFIGURADOS {#if !loading}({webhooks.length}){/if}
    </h2>

    {#if loading}
      <div class="text-center py-8"><Loader2 class="size-6 animate-spin mx-auto text-white/50" /></div>
    {:else if webhooks.length === 0}
      <p class="text-sm text-white/60 text-center py-8" style="text-shadow: 2px 2px 0 #3f3f3f;">
        nenhum webhook ainda. crie o primeiro acima.
      </p>
    {:else}
      <div class="space-y-3">
        {#each webhooks as wh (wh.id)}
          <article class="mc-card">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="min-w-0 flex-1">
                <h3 class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  {wh.name}
                  {#if !wh.enabled}<span class="text-xs text-destructive ml-2">desativado</span>{/if}
                  {#if wh.consecutiveFailures >= 5}<span class="text-xs text-warning ml-2">⚠ {wh.consecutiveFailures} falhas</span>{/if}
                </h3>
                <p class="text-xs text-white/60 font-mono truncate" style="text-shadow: 2px 2px 0 #3f3f3f;">{wh.url}</p>
              </div>
              <div class="flex gap-1">
                <button type="button" onclick={() => test(wh.id)} disabled={busy === `test-${wh.id}`} class="mc-btn text-xs">
                  {#if busy === `test-${wh.id}`}<Loader2 class="size-3 animate-spin" />{:else}<Send class="size-3" />{/if}
                  testar
                </button>
                <button type="button" onclick={() => toggle(wh.id, wh.enabled)} disabled={busy === `toggle-${wh.id}`} class="mc-btn text-xs">
                  {wh.enabled ? 'pausar' : 'ativar'}
                </button>
                <button type="button" onclick={() => remove(wh.id, wh.name)} disabled={busy === `del-${wh.id}`} class="mc-btn mc-btn-destructive text-xs">
                  {#if busy === `del-${wh.id}`}<Loader2 class="size-3 animate-spin" />{:else}<Trash2 class="size-3" />{/if}
                </button>
              </div>
            </div>

            <div class="flex flex-wrap gap-1 mb-2">
              {#each wh.events as ev}
                <span class="text-[10px] px-1.5 py-0.5 bg-primary/20 border border-primary/40 text-diamond font-mono">{ev}</span>
              {/each}
            </div>

            <p class="text-[10px] text-white/40" style="text-shadow: 2px 2px 0 #3f3f3f;">
              secret: <code class="font-mono">{wh.secret}</code>
            </p>

            {#if wh.lastDeliveryAt}
              <div class="mt-2 text-[10px] {wh.lastDeliveryStatus === 'ok' ? 'text-success' : 'text-destructive'}" style="text-shadow: 2px 2px 0 #3f3f3f;">
                {#if wh.lastDeliveryStatus === 'ok'}<Check class="size-2.5 inline" />{:else}<X class="size-2.5 inline" />{/if}
                última entrega: {new Date(wh.lastDeliveryAt).toLocaleString('pt-BR')}
                {#if wh.lastDeliveryMessage}— {wh.lastDeliveryMessage}{/if}
              </div>
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  </section>

  <details class="mt-6 mc-card">
    <summary class="text-sm cursor-pointer" style="text-shadow: 2px 2px 0 #3f3f3f;">📖 como verificar a assinatura (HMAC SHA-256)</summary>
    <div class="mt-3 text-xs text-white/70 space-y-2" style="text-shadow: 2px 2px 0 #3f3f3f;">
      <p>cada request POST tem o header:</p>
      <code class="block bg-black/40 p-2 font-mono">x-chest-signature: sha256=&lt;hex&gt;</code>
      <p>compare com HMAC SHA-256 do raw body usando o secret:</p>
      <pre class="bg-black/40 p-2 font-mono text-[10px] overflow-x-auto">{`// Node.js
const crypto = require('crypto');
const expected = 'sha256=' + crypto
  .createHmac('sha256', SECRET)
  .update(rawBody)
  .digest('hex');
if (!crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
  return res.status(401).end();
}`}</pre>
    </div>
  </details>
</div>
