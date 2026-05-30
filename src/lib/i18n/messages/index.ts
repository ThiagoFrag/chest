import type { Dict, Locale } from '../types';

import { navMessages as navPtBr } from './pt-br/nav';
import { authMessages as authPtBr } from './pt-br/auth';
import { dashboardMessages as dashboardPtBr } from './pt-br/dashboard';
import { serverdetailMessages as serverdetailPtBr } from './pt-br/serverdetail';
import { serverconfigMessages as serverconfigPtBr } from './pt-br/serverconfig';
import { contentMessages as contentPtBr } from './pt-br/content';
import { integrationsMessages as integrationsPtBr } from './pt-br/integrations';
import { adminMessages as adminPtBr } from './pt-br/admin';
import { serverrorsMessages as serverrorsPtBr } from './pt-br/serverrors';

import { navMessages as navEn } from './en/nav';
import { authMessages as authEn } from './en/auth';
import { dashboardMessages as dashboardEn } from './en/dashboard';
import { serverdetailMessages as serverdetailEn } from './en/serverdetail';
import { serverconfigMessages as serverconfigEn } from './en/serverconfig';
import { contentMessages as contentEn } from './en/content';
import { integrationsMessages as integrationsEn } from './en/integrations';
import { adminMessages as adminEn } from './en/admin';
import { serverrorsMessages as serverrorsEn } from './en/serverrors';

import { navMessages as navEs } from './es/nav';
import { authMessages as authEs } from './es/auth';
import { dashboardMessages as dashboardEs } from './es/dashboard';
import { serverdetailMessages as serverdetailEs } from './es/serverdetail';
import { serverconfigMessages as serverconfigEs } from './es/serverconfig';
import { contentMessages as contentEs } from './es/content';
import { integrationsMessages as integrationsEs } from './es/integrations';
import { adminMessages as adminEs } from './es/admin';
import { serverrorsMessages as serverrorsEs } from './es/serverrors';

export const messages: Record<Locale, Dict> = {
  'pt-BR': {
    ...navPtBr,
    ...authPtBr,
    ...dashboardPtBr,
    ...serverdetailPtBr,
    ...serverconfigPtBr,
    ...contentPtBr,
    ...integrationsPtBr,
    ...adminPtBr,
    ...serverrorsPtBr
  },
  en: {
    ...navEn,
    ...authEn,
    ...dashboardEn,
    ...serverdetailEn,
    ...serverconfigEn,
    ...contentEn,
    ...integrationsEn,
    ...adminEn,
    ...serverrorsEn
  },
  es: {
    ...navEs,
    ...authEs,
    ...dashboardEs,
    ...serverdetailEs,
    ...serverconfigEs,
    ...contentEs,
    ...integrationsEs,
    ...adminEs,
    ...serverrorsEs
  }
};
