import { db, schema } from '$lib/db';
import { and, eq } from 'drizzle-orm';
import type { User } from '$lib/db/schema';
import {
  SERVER_PERMISSIONS,
  ROLE_DEFAULTS,
  parsePermissions,
  type ServerPermission
} from './permissions-constants';

export {
  SERVER_PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_DEFAULTS,
  parsePermissions,
  serializePermissions,
  type ServerPermission
} from './permissions-constants';

export interface EffectivePermissions {
  isAdmin: boolean;
  isOwner: boolean;
  granular: ServerPermission[];
}

export async function getEffectivePermissions(
  user: User | null,
  serverId: string
): Promise<EffectivePermissions> {
  if (!user) return { isAdmin: false, isOwner: false, granular: [] };

  if (user.role === 'admin') {
    return { isAdmin: true, isOwner: true, granular: [...SERVER_PERMISSIONS] };
  }

  const row = await db()
    .select()
    .from(schema.serverUsers)
    .where(and(eq(schema.serverUsers.serverId, serverId), eq(schema.serverUsers.userId, user.id)))
    .get();

  if (row) {
    return { isAdmin: false, isOwner: false, granular: parsePermissions(row.permissions) };
  }

  return {
    isAdmin: false,
    isOwner: false,
    granular: ROLE_DEFAULTS[user.role] ?? []
  };
}

export async function userCan(
  user: User | null,
  serverId: string,
  permission: ServerPermission
): Promise<boolean> {
  const eff = await getEffectivePermissions(user, serverId);
  if (eff.isAdmin) return true;
  return eff.granular.includes(permission);
}
