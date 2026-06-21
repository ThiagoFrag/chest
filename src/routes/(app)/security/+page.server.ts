import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { getSetting } from '$lib/settings';
import { logAudit } from '$lib/audit';
import { tServer } from '$lib/i18n/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw error(401);

  const discordEnabled = !!(await getSetting('discord.oauth_client_id'));
  const discord = locals.user.discordId
    ? {
        id: locals.user.discordId,
        username: locals.user.discordUsername,
        avatar: locals.user.discordAvatar
      }
    : null;

  return { discordEnabled, discord };
};

export const actions: Actions = {
  unlinkDiscord: async (event) => {
    const { locals } = event;
    if (!locals.user) throw error(401);

    if (!locals.user.discordId) {
      return fail(400, {
        unlink: tServer(locals.locale, 'serverrors.security.discordNotLinked')
      });
    }

    if (!locals.user.passwordHash) {
      return fail(400, {
        unlink: tServer(locals.locale, 'serverrors.security.setPasswordFirst')
      });
    }

    await db()
      .update(schema.users)
      .set({ discordId: null, discordUsername: null, discordAvatar: null })
      .where(eq(schema.users.id, locals.user.id));

    locals.user = {
      ...locals.user,
      discordId: null,
      discordUsername: null,
      discordAvatar: null
    };

    await logAudit(event, {
      action: 'auth.discord.unlink',
      resourceType: 'user',
      resourceId: locals.user.id
    });

    return { unlinked: true };
  }
};
