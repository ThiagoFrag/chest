import { requireRole } from '$lib/auth/permissions';
import { WEBHOOK_EVENTS } from '$lib/webhooks/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
  requireRole(locals.user, 'admin');
  return { availableEvents: WEBHOOK_EVENTS };
};
