import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/auth/permissions';
import { queryAudit, countAudit, distinctActions } from '$lib/audit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  requireRole(locals.user, 'admin');

  const limit = 50;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const action = url.searchParams.get('action') ?? undefined;
  const username = url.searchParams.get('username') ?? undefined;
  const status = (url.searchParams.get('status') as 'ok' | 'fail' | null) ?? undefined;

  try {
    const [events, total, actions] = await Promise.all([
      queryAudit({ limit, offset: (page - 1) * limit, action, username, status }),
      countAudit({ action, username, status }),
      distinctActions()
    ]);

    return {
      events,
      total,
      page,
      pageSize: limit,
      pages: Math.ceil(total / limit),
      filters: { action, username, status },
      knownActions: actions
    };
  } catch (err) {
    throw error(500, err instanceof Error ? err.message : 'falha');
  }
};
