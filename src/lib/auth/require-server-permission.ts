import { error, type RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { userCan } from './server-permissions';
import type { ServerPermission } from './permissions-constants';

/**
 * Resolves server by containerName, checks if the user can perform `permission`,
 * throws 401/403/404 as appropriate, and returns the server row for reuse.
 *
 * Admin role bypasses all checks (via userCan).
 * Operator role gets defaults from ROLE_DEFAULTS (via userCan).
 * Viewer with explicit server_users entry uses granular perms (via userCan).
 */
export async function requireServerPermission(
  event: RequestEvent,
  containerName: string,
  permission: ServerPermission
) {
  const user = event.locals.user;
  if (!user) throw error(401, 'não autenticado');
  if (!containerName) throw error(400, 'containerName ausente');

  const server = await db()
    .select()
    .from(schema.servers)
    .where(eq(schema.servers.containerName, containerName))
    .get();

  if (!server) throw error(404, 'server não encontrado');

  const allowed = await userCan(user, server.id, permission);
  if (!allowed) {
    throw error(403, `sem permissão "${permission}" neste server`);
  }

  return { server, user };
}

/**
 * Soft version: returns boolean instead of throwing.
 * Useful for conditional UI rendering (hide buttons, disable actions).
 */
export async function canServerAction(
  user: { id: string; role: string } | null,
  containerName: string,
  permission: ServerPermission
): Promise<boolean> {
  if (!user) return false;

  const server = await db()
    .select({ id: schema.servers.id })
    .from(schema.servers)
    .where(eq(schema.servers.containerName, containerName))
    .get();

  if (!server) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return userCan(user as any, server.id, permission);
}
