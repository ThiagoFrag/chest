<script lang="ts">
  import { Loader2, UserPlus, UserX, Check, AlertCircle, Shield } from 'lucide-svelte';
  import { t, plural } from '$lib/i18n';

  let { containerName }: { containerName: string } = $props();

  interface Subuser {
    id: string;
    userId: string;
    username: string;
    userRole: 'admin' | 'operator' | 'viewer';
    permissions: string[];
    createdAt: string | Date;
  }

  const PERMISSION_KEYS = new Set([
    'control',
    'console',
    'edit_config',
    'edit_world',
    'manage_backups',
    'manage_files',
    'manage_players',
    'manage_scheduled',
    'manage_discord',
    'view_logs',
    'delete'
  ]);

  function permLabel(perm: string): string {
    return PERMISSION_KEYS.has(perm) ? t(`integrations.subusers.perm.${perm}`) : perm;
  }

  let subusers = $state<Subuser[]>([]);
  let availablePermissions = $state<string[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let busy = $state<string | null>(null);

  let newUsername = $state('');
  let newPerms = $state<Set<string>>(new Set(['view_logs']));

  let editingId = $state<string | null>(null);
  let editingPerms = $state<Set<string>>(new Set());

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await fetch(`/api/servers/${containerName}/subusers`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? t('integrations.subusers.error.generic', { status: res.status }));
      }
      const data = await res.json();
      subusers = data.subusers ?? [];
      availablePermissions = data.availablePermissions ?? [];
    } catch (e) {
      error = e instanceof Error ? e.message : t('integrations.subusers.error.fail');
    } finally {
      loading = false;
    }
  }

  async function add() {
    if (!newUsername.trim()) return;
    busy = 'add';
    error = null;
    try {
      const res = await fetch(`/api/servers/${containerName}/subusers`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          permissions: [...newPerms]
        })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? t('integrations.subusers.error.fail'));
      }
      newUsername = '';
      newPerms = new Set(['view_logs']);
      await load();
    } catch (e) {
      error = e instanceof Error ? e.message : t('integrations.subusers.error.fail');
    } finally {
      busy = null;
    }
  }

  function startEdit(s: Subuser) {
    editingId = s.id;
    editingPerms = new Set(s.permissions);
  }

  async function saveEdit() {
    if (!editingId) return;
    busy = `edit-${editingId}`;
    error = null;
    try {
      const res = await fetch(`/api/servers/${containerName}/subusers`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          subuserId: editingId,
          permissions: [...editingPerms]
        })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? t('integrations.subusers.error.fail'));
      }
      editingId = null;
      await load();
    } catch (e) {
      error = e instanceof Error ? e.message : t('integrations.subusers.error.fail');
    } finally {
      busy = null;
    }
  }

  async function remove(id: string, username: string) {
    if (!confirm(t('integrations.subusers.confirm.remove', { username }))) return;
    busy = `del-${id}`;
    error = null;
    try {
      const res = await fetch(`/api/servers/${containerName}/subusers`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subuserId: id })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? t('integrations.subusers.error.fail'));
      }
      await load();
    } catch (e) {
      error = e instanceof Error ? e.message : t('integrations.subusers.error.fail');
    } finally {
      busy = null;
    }
  }

  function togglePerm(set: Set<string>, perm: string): Set<string> {
    const next = new Set(set);
    if (next.has(perm)) next.delete(perm);
    else next.add(perm);
    return next;
  }

  load();
</script>

<div class="space-y-4">
  <section class="mc-card">
    <header class="flex items-start gap-3 mb-3">
      <Shield class="size-5 text-mc-yellow mt-1" />
      <div>
        <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.subusers.list.title')}</h3>
        <p class="text-xs text-white/60 mt-0.5" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('integrations.subusers.list.subtitle')}
        </p>
      </div>
    </header>

    {#if error}
      <div class="p-3 bg-destructive/20 border-2 border-destructive flex items-start gap-2 mb-3">
        <AlertCircle class="size-4 text-destructive shrink-0 mt-0.5" />
        <p class="text-sm text-destructive" style="text-shadow: 2px 2px 0 #3f3f3f;">{error}</p>
      </div>
    {/if}

    {#if loading}
      <div class="text-center py-6"><Loader2 class="size-5 animate-spin mx-auto text-white/50" /></div>
    {:else if subusers.length === 0}
      <p class="text-sm text-white/60 text-center py-4" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('integrations.subusers.list.empty')}
      </p>
    {:else}
      <ul class="space-y-2">
        {#each subusers as s (s.id)}
          <li class="bg-black/40 border-2 border-black p-3" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
            <div class="flex items-center justify-between gap-2">
              <div class="flex-1 min-w-0">
                <p class="text-sm" style="text-shadow: 2px 2px 0 #3f3f3f;">
                  <strong>{s.username}</strong>
                  <span class="text-xs text-white/40 ml-1">({s.userRole})</span>
                </p>
                {#if editingId !== s.id}
                  <p class="text-[10px] text-white/50 mt-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    {plural(s.permissions.length, {
                      one: t('integrations.subusers.permCount.one'),
                      other: t('integrations.subusers.permCount.other')
                    })}
                  </p>
                {/if}
              </div>
              <div class="flex gap-1">
                {#if editingId === s.id}
                  <button type="button" onclick={() => (editingId = null)} class="mc-btn text-xs">{t('integrations.subusers.cancel')}</button>
                  <button type="button" onclick={saveEdit} disabled={busy === `edit-${s.id}`} class="mc-btn mc-btn-primary text-xs">
                    {#if busy === `edit-${s.id}`}<Loader2 class="size-3 animate-spin" />{:else}<Check class="size-3" />{/if}
                    {t('integrations.subusers.save')}
                  </button>
                {:else}
                  <button type="button" onclick={() => startEdit(s)} class="mc-btn text-xs">{t('integrations.subusers.edit')}</button>
                  <button type="button" onclick={() => remove(s.id, s.username)} disabled={busy === `del-${s.id}`} class="mc-btn mc-btn-destructive text-xs">
                    {#if busy === `del-${s.id}`}<Loader2 class="size-3 animate-spin" />{:else}<UserX class="size-3" />{/if}
                  </button>
                {/if}
              </div>
            </div>

            {#if editingId === s.id}
              <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1">
                {#each availablePermissions as perm}
                  <label class="flex items-center gap-2 text-xs cursor-pointer hover:text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    <input
                      type="checkbox"
                      checked={editingPerms.has(perm)}
                      onchange={() => (editingPerms = togglePerm(editingPerms, perm))}
                    />
                    <span>{permLabel(perm)}</span>
                  </label>
                {/each}
              </div>
            {:else if s.permissions.length > 0}
              <div class="mt-2 flex flex-wrap gap-1">
                {#each s.permissions as p}
                  <span class="text-[10px] px-1.5 py-0.5 bg-primary/20 border border-primary/40 text-success" style="text-shadow: 2px 2px 0 #3f3f3f;">
                    {p}
                  </span>
                {/each}
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="mc-card">
    <header class="flex items-center gap-2 mb-3">
      <UserPlus class="size-5 text-mc-yellow" />
      <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.subusers.add.title')}</h3>
    </header>

    <div class="space-y-3">
      <div>
        <label for="sub-username" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.subusers.add.usernameLabel')}</label>
        <input
          id="sub-username"
          type="text"
          bind:value={newUsername}
          placeholder={t('integrations.subusers.add.usernamePlaceholder')}
          class="mc-input"
        />
      </div>

      <div>
        <span class="block text-xs text-white/70 mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('integrations.subusers.add.permsLabel')}</span>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {#each availablePermissions as perm}
            <label class="flex items-center gap-2 text-xs cursor-pointer hover:text-mc-yellow" style="text-shadow: 2px 2px 0 #3f3f3f;">
              <input
                type="checkbox"
                checked={newPerms.has(perm)}
                onchange={() => (newPerms = togglePerm(newPerms, perm))}
              />
              <span>{permLabel(perm)}</span>
            </label>
          {/each}
        </div>
      </div>

      <button
        type="button"
        onclick={add}
        disabled={!newUsername.trim() || busy === 'add'}
        class="mc-btn mc-btn-primary w-full"
      >
        {#if busy === 'add'}<Loader2 class="size-4 animate-spin" />{:else}<UserPlus class="size-4" />{/if}
        {t('integrations.subusers.add.submit')}
      </button>
    </div>
  </section>
</div>
