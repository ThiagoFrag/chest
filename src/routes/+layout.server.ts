import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    locale: locals.locale,
    theme: locals.theme,
    user: locals.user ? { id: locals.user.id, username: locals.user.username } : null
  };
};
