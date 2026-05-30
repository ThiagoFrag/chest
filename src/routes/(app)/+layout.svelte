<script lang="ts">
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import { LayoutGrid, ServerCog, LogOut, Settings, Users, ShieldAlert, Shield, Egg, Webhook, Server } from 'lucide-svelte';
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import Logo from '$components/mc-icons/Logo.svelte';
  import { t, getLocale, setLocale, LOCALES, LOCALE_LABELS, type Locale } from '$lib/i18n';
  import { getTheme, setTheme, THEMES, THEME_LABELS, type Theme } from '$lib/theme';

  let { children, data } = $props();

  const isAdmin = $derived(data.user.role === 'admin');

  const nav = $derived(
    [
      { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutGrid, show: true },
      { href: '/servers', label: t('nav.servers'), icon: ServerCog, show: true },
      { href: '/eggs', label: t('nav.eggs'), icon: Egg, show: true },
      { href: '/users', label: t('nav.users'), icon: Users, show: isAdmin },
      { href: '/audit', label: t('nav.audit'), icon: ShieldAlert, show: isAdmin },
      { href: '/webhooks', label: t('nav.webhooks'), icon: Webhook, show: isAdmin },
      { href: '/hosts', label: t('nav.hosts'), icon: Server, show: isAdmin },
      { href: '/security', label: t('nav.security'), icon: Shield, show: true },
      { href: '/settings', label: t('nav.settings'), icon: Settings, show: isAdmin }
    ].filter((i) => i.show)
  );

  function isActive(href: string) {
    return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
  }

  async function changeLocale(value: string) {
    setLocale(value as Locale);
    await invalidateAll();
  }

  async function changeTheme(value: string) {
    setTheme(value as Theme);
    await invalidateAll();
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
        {t('nav.loggedAs')}: <span class="text-primary">{data.user.username}</span>
        <div class="text-white/40 text-xs mt-0.5">
          {t('nav.role')}: <span class="{data.user.role === 'admin' ? 'text-warning' : data.user.role === 'operator' ? 'text-diamond' : 'text-white/60'}">{data.user.role}</span>
        </div>
      </div>

      <div class="px-3 pb-1">
        <label for="locale-select" class="block text-xs text-white/60 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('nav.language')}
        </label>
        <select
          id="locale-select"
          class="w-full bg-input text-white text-sm px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(0,0,0,0.4);"
          value={getLocale()}
          onchange={(e) => changeLocale(e.currentTarget.value)}
        >
          {#each LOCALES as l}
            <option value={l}>{LOCALE_LABELS[l]}</option>
          {/each}
        </select>
      </div>

      <div class="px-3 pb-1">
        <label for="theme-select" class="block text-xs text-white/60 mb-1" style="text-shadow: 2px 2px 0 #3f3f3f;">
          {t('nav.theme')}
        </label>
        <select
          id="theme-select"
          class="w-full bg-input text-white text-sm px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style="border: 2px solid #000000; box-shadow: inset 2px 2px 0 0 rgba(0,0,0,0.4);"
          value={getTheme()}
          onchange={(e) => changeTheme(e.currentTarget.value)}
        >
          {#each THEMES as th}
            <option value={th}>{THEME_LABELS[th]}</option>
          {/each}
        </select>
      </div>

      <form method="POST" action="/logout">
        <button
          type="submit"
          class="flex w-full items-center gap-3 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-mc-yellow"
          style="text-shadow: 2px 2px 0 #3f3f3f;"
        >
          <LogOut class="size-4" />
          {t('nav.logout')}
        </button>
      </form>
    </div>
  </aside>

  <main class="flex-1 overflow-auto">
    {@render children()}
  </main>
</div>
