import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/auth/session';
import type { Actions, PageServerLoad } from './$types';

const SESSION_COOKIE = 'forja_session';

export const load: PageServerLoad = () => {
  throw redirect(303, '/login');
};

export const actions: Actions = {
  default: async ({ cookies, locals }) => {
    if (locals.sessionId) {
      await deleteSession(locals.sessionId);
    }
    cookies.delete(SESSION_COOKIE, { path: '/' });
    throw redirect(303, '/login');
  }
};
