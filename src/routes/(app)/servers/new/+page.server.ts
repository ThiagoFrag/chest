import { getSetting } from '$lib/settings';
import { CURATED_TEMPLATES } from '$lib/templates';
import { getEgg } from '$lib/eggs/loader';
import { listHosts } from '$lib/docker/hosts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const [draslUrl, cfToken, playitSecret, discordToken, allHosts] = await Promise.all([
    getSetting('drasl.url'),
    getSetting('cloudflare.api_token'),
    getSetting('playit.secret_key'),
    getSetting('discord.bot_token'),
    listHosts().catch(() => [])
  ]);

  const hosts = allHosts
    .filter((h) => h.enabled)
    .map((h) => ({ id: h.id, name: h.name }));

  const eggSlug = url.searchParams.get('egg');
  const eggTemplate = eggSlug
    ? await (async () => {
        const e = await getEgg(eggSlug);
        if (!e) return null;
        return {
          slug: e.slug,
          modrinthId: e.modrinthProjectId,
          title: e.name,
          description: e.description,
          iconUrl: e.icon ?? '',
          loader: e.loader,
          mcVersion: e.mcVersion,
          memoryGb: e.defaults.memoryGb,
          category: 'egg' as const,
          featured: false,
          source: 'egg' as const,
          egg: e
        };
      })()
    : null;

  const templateSlug = url.searchParams.get('template');
  const curatedTemplate = templateSlug
    ? CURATED_TEMPLATES.find((t) => t.slug === templateSlug) ?? null
    : null;

  const modrinthId = url.searchParams.get('modrinthId');
  const dynamicTemplate = modrinthId
    ? {
        slug: modrinthId,
        modrinthId,
        title: url.searchParams.get('title') ?? 'Modpack',
        description: '',
        iconUrl: url.searchParams.get('icon') ?? '',
        loader: (url.searchParams.get('loader') ?? 'FABRIC') as
          | 'VANILLA' | 'PAPER' | 'FABRIC' | 'FORGE' | 'NEOFORGE' | 'PURPUR' | 'SPIGOT' | 'QUILT',
        mcVersion: url.searchParams.get('mc') ?? '1.21.1',
        memoryGb: Number(url.searchParams.get('ram') ?? '6'),
        category: 'kitchen-sink' as const,
        featured: false
      }
    : null;

  return {
    configured: {
      drasl: !!draslUrl,
      draslUrl,
      cloudflare: !!cfToken,
      playit: !!playitSecret,
      discord: !!discordToken
    },
    hosts,
    template: eggTemplate ?? curatedTemplate ?? dynamicTemplate
  };
};
