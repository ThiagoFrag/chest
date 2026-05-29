import { CURATED_TEMPLATES } from '$lib/templates';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  return { templates: CURATED_TEMPLATES };
};
