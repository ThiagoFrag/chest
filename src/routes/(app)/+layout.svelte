<script lang="ts">
  import { page } from '$app/state';
  import { LayoutGrid, ServerCog, LogOut, Settings, Users, ShieldAlert, Shield, Egg, Webhook } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import Logo from '$components/mc-icons/Logo.svelte';

  let { children, data } = $props();

  const isAdmin = $derived(data.user.role === 'admin');

  const nav = $derived(
    [
      { href: '/dashboard', label: 'dashboard', icon: LayoutGrid, show: true },
      { href: '/servers', label: 'servers', icon: ServerCog, show: true },
      { href: '/eggs', label: 'eggs', icon: Egg, show: true },
      { href: '/users', label: 'usuários', icon: Users, show: isAdmin },
      { href: '/audit', label: 'audit log', icon: ShieldAlert, show: isAdmin },
      { href: '/webhooks', label: 'webhooks', icon: Webhook, show: isAdmin },
      { href: '/security', label: 'segurança 2FA', icon: Shield, show: true },
      { href: '/settings', label: 'configurações', icon: Settings, show: isAdmin }
    ].filter((i) => i.show)
  );

  function isActive(href: string) {
    return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
  }
</script>

<div class="flex min-h-svh">
  <aside class="flex w-64 shrink-0 flex-col mc-bg-obsidian" style="border-right: 2px solid #000000; box-shadow: inset -2px 0 0 0 rgba(0,0,0,0.4);">
    <a href="/dashboard" class="flex items-center px-5 py-5" style="border-bottom: 2px solid #000000; background: rgba(0,0,0,0.4);">
      <Logo size={0.75} />
    </a>

    <nav class="flex-1 space-y-1 p-3">
      {#each nav as item}
        {@const Icon = item.icon}
        <a
          href={item.href}
          class="flex items-center gap-3 px-3 py-2.5 text-sm transition-none {isActive(
            item.href
          )
            ? 'bg-primary text-white'
            : 'text-white/70 hover:bg-white/10 hover:text-mc-yellow'}"
          style="text-shadow: 2px 2px 0 #3f3f3f; {isActive(item.href) ? 'border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(255,255,255,0.2), inset -2px -2px 0 0 rgba(0,0,0,0.4);' : ''}"
        >
          <Icon class="size-4" />
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="p-3 space-y-2" style="border-top: 2px solid #000000; background: rgba(0,0,0,0.3);">
      <div class="px-3 pb-2 text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">
        logado: <span class="text-primary">{data.user.username}</span>
        <div class="text-white/40 text-xs mt-0.5">
          role: <span class="{data.user.role === 'admin' ? 'text-warning' : data.user.role === 'operator' ? 'text-diamond' : 'text-white/60'}">{data.user.role}</span>
        </div>
      </div>
      <form method="POST" action="/logout">
        <button
          type="submit"
          class="flex w-full items-center gap-3 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-mc-yellow"
          style="text-shadow: 2px 2px 0 #3f3f3f;"
        >
          <LogOut class="size-4" />
          sair
        </button>
      </form>
    </div>
  </aside>

  <main class="flex-1 overflow-auto">
    {@render children()}
  </main>
</div>
