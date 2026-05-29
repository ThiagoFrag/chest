import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
  if (!locals.user) throw redirect(303, '/login');
  return {
    user: {
      id: locals.user.id,
      username: locals.user.username,
      role: locals.user.role ?? 'admin'
    }
  };
};
