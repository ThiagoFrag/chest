<script lang="ts">
  import { Users, Plus, Trash2, Loader2, Copy, Check, Shield, Wrench, Eye } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import PlayerHead from '$components/mc-icons/PlayerHead.svelte';
  import { invalidateAll } from '$app/navigation';
  import { t, formatDate } from '$lib/i18n';

  let { data } = $props();

  let showCreate = $state(false);
  let newRole = $state<'admin' | 'operator' | 'viewer'>('viewer');
  let newNote = $state('');
  let creating = $state(false);
  let pending = $state<string | null>(null);
  let copiedToken = $state<string | null>(null);

  async function createInvite() {
    creating = true;
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: newRole, note: newNote.trim() || undefined })
      });
      if (res.ok) {
        showCreate = false;
        newNote = '';
        await invalidateAll();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(t('admin.users.error', { message: err.message ?? res.status }));
      }
    } finally {
      creating = false;
    }
  }

  async function deleteInvite(id: string) {
    if (!confirm(t('admin.users.confirmDeleteInvite'))) return;
    pending = id;
    try {
      await fetch(`/api/invites/${id}`, { method: 'DELETE' });
      await invalidateAll();
    } finally {
      pending = null;
    }
  }

  async function setRole(userId: string, role: string) {
    pending = userId;
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role })
      });
      await invalidateAll();
    } finally {
      pending = null;
    }
  }

  async function deleteUser(userId: string, username: string) {
    if (!confirm(t('admin.users.confirmDeleteUser', { username }))) return;
    pending = userId;
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      await invalidateAll();
    } finally {
      pending = null;
    }
  }

  async function copyInviteLink(token: string) {
    const url = `${data.baseUrl}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    copiedToken = token;
    setTimeout(() => (copiedToken = null), 1500);
  }

  function fmtDate(d: Date | string | null | number): string {
    if (!d) return '—';
    const ms = typeof d === 'number' ? d * 1000 : new Date(d).getTime();
    return formatDate(new Date(ms), { dateStyle: 'short', timeStyle: 'short' });
  }

  function roleColor(role: string): string {
    if (role === 'admin') return 'text-warning';
    if (role === 'operator') return 'text-diamond';
    return 'text-white/60';
  }

  function roleIcon(role: string) {
    if (role === 'admin') return Shield;
    if (role === 'operator') return Wrench;
    return Eye;
  }

  const roleDescriptions = $derived({
    admin: t('admin.users.role.adminDesc'),
    operator: t('admin.users.role.operatorDesc'),
    viewer: t('admin.users.role.viewerDesc')
  });
</script>

<svelte:head><title>{t('admin.users.head')}</title></svelte:head>

<div class="px-8 py-6">
  <div class="mc-banner mb-6 flex items-center gap-4">
    <Users class="size-10 text-mc-yellow" />
    <div>
      <h1 class="mc-heading text-3xl">{t('admin.users.title')}</h1>
      <p class="mt-1 text-xs text-white/80" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('admin.users.subtitle')}
      </p>
    </div>
  </div>

  <section class="mc-card mb-6">
    <header class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="mc-slot"><MCTexture src="/textures/item/iron_pickaxe.png" size={24} /></div>
        <div>
          <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.users.accounts.title')}</h3>
          <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {data.users.length === 1 ? t('admin.users.accounts.countOne', { n: data.users.length }) : t('admin.users.accounts.countOther', { n: data.users.length })}
          </p>
        </div>
      </div>
    </header>

    <ul class="space-y-2">
      {#each data.users as u (u.id)}
        {@const Icon = roleIcon(u.role)}
        <li class="flex items-center gap-3 px-3 py-3 bg-black/40 border-2 border-black" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
          <div class="mc-slot">
            <PlayerHead name={u.username} size={32} />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">{u.username}</p>
            <p class="text-xs text-white/50">
              {t('admin.users.row.created', { created: fmtDate(u.createdAt as unknown as number), lastLogin: fmtDate(u.lastLoginAt as unknown as number) })}
            </p>
          </div>
          {#if data.user.id === u.id}
            <span class="text-xs px-2 py-1 bg-primary/40 border-2 border-black {roleColor(u.role)}" style="text-shadow: 2px 2px 0 #3f3f3f;">
              <Icon class="size-3 inline" /> {u.role} {t('admin.users.row.you')}
            </span>
          {:else}
            <select
              value={u.role}
              onchange={(e) => setRole(u.id, (e.currentTarget as HTMLSelectElement).value)}
              disabled={pending === u.id}
              class="mc-input text-xs px-2 py-1 w-32"
            >
              <option value="admin">{t('admin.users.role.admin')}</option>
              <option value="operator">{t('admin.users.role.operator')}</option>
              <option value="viewer">{t('admin.users.role.viewer')}</option>
            </select>
            <button type="button" onclick={() => deleteUser(u.id, u.username)} disabled={pending === u.id} class="text-destructive hover:text-mc-yellow" title={t('admin.users.deleteUser')}>
              {#if pending === u.id}<Loader2 class="size-4 animate-spin" />{:else}<Trash2 class="size-4" />{/if}
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  </section>

  <section class="mc-card">
    <header class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="mc-slot"><MCTexture src="/textures/item/ender_eye.png" size={24} /></div>
        <div>
          <h3 class="text-lg" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.users.invites.title')}</h3>
          <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
            {t('admin.users.invites.subtitle')}
          </p>
        </div>
      </div>
      <button type="button" onclick={() => (showCreate = true)} class="mc-btn mc-btn-primary text-xs py-1.5 px-3">
        <Plus class="size-3.5" /> {t('admin.users.invites.new')}
      </button>
    </header>

    {#if showCreate}
      <div class="mb-4 p-4 bg-black/40 border-2 border-black" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
        <div class="space-y-3">
          <div>
            <span class="block text-xs text-white/70 mb-2" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.users.invites.roleLabel')}</span>
            <div class="grid grid-cols-3 gap-1">
              {#each ['viewer', 'operator', 'admin'] as r}
                <button type="button" onclick={() => (newRole = r as typeof newRole)}
                  class="px-2 py-2 text-xs flex flex-col items-start {newRole === r ? 'bg-primary text-white' : 'bg-secondary text-white'}"
                  style="border: 2px solid #000; box-shadow: inset 1px 1px 0 0 rgba(255,255,255,0.15), inset -1px -1px 0 0 rgba(0,0,0,0.4); text-shadow: 2px 2px 0 #3f3f3f;">
                  <span class="text-sm">{t(`admin.users.role.${r}`)}</span>
                  <span class="text-xs opacity-75 text-left mt-0.5">{roleDescriptions[r as 'admin' | 'operator' | 'viewer']}</span>
                </button>
              {/each}
            </div>
          </div>
          <div>
            <label for="inv-note" class="block text-xs text-white/70 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">{t('admin.users.invites.noteLabel')}</label>
            <input id="inv-note" type="text" bind:value={newNote} placeholder={t('admin.users.invites.notePlaceholder')} class="mc-input" />
          </div>
          <div class="flex gap-2">
            <button type="button" onclick={() => (showCreate = false)} class="mc-btn flex-1">{t('admin.users.invites.cancel')}</button>
            <button type="button" onclick={createInvite} disabled={creating} class="mc-btn mc-btn-primary flex-1">
              {#if creating}<Loader2 class="size-4 animate-spin" />{:else}<Plus class="size-4" />{/if}
              {t('admin.users.invites.generate')}
            </button>
          </div>
        </div>
      </div>
    {/if}

    {#if data.invites.length === 0}
      <p class="text-sm text-white/60 text-center py-6" style="text-shadow: 2px 2px 0 #3f3f3f;">
        {t('admin.users.invites.empty')}
      </p>
    {:else}
      <ul class="space-y-2">
        {#each data.invites as inv (inv.id)}
          {@const url = `${data.baseUrl}/invite/${inv.token}`}
          {@const expired = new Date(inv.expiresAt as unknown as number * 1000).getTime() < Date.now()}
          {@const used = !!inv.usedAt}
          <li class="flex items-center gap-3 px-3 py-3 bg-black/40 border-2 border-black" style="box-shadow: inset 1px 1px 0 0 rgba(60,60,60,1);">
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white" style="text-shadow: 2px 2px 0 #3f3f3f;">
                <span class={roleColor(inv.role)}>{inv.role}</span>
                {#if inv.note}<span class="text-white/60 ml-2">· {inv.note}</span>{/if}
                {#if used}<span class="text-success ml-2">· usado</span>
                {:else if expired}<span class="text-destructive ml-2">· expirado</span>
                {:else}<span class="text-warning ml-2">· pendente</span>{/if}
              </p>
              <p class="text-xs text-white/40 font-mono truncate">{url}</p>
              <p class="text-xs text-white/40">
                criado: {fmtDate(inv.createdAt as unknown as number)} · expira: {fmtDate(inv.expiresAt as unknown as number)}
              </p>
            </div>
            {#if !used && !expired}
              <button type="button" onclick={() => copyInviteLink(inv.token)} class="mc-btn text-xs py-1 px-2" title="copiar link">
                {#if copiedToken === inv.token}<Check class="size-3 text-success" />{:else}<Copy class="size-3" />{/if}
              </button>
            {/if}
            <button type="button" onclick={() => deleteInvite(inv.id)} disabled={pending === inv.id} class="text-destructive hover:text-mc-yellow" title="deletar">
              <Trash2 class="size-3.5" />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>
