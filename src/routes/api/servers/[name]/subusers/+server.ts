import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { requireRole } from '$lib/auth/permissions';
import {
  SERVER_PERMISSIONS,
  parsePermissions,
  serializePermissions
} from '$lib/auth/server-permissions';
import { logAudit } from '$lib/audit';
import { encodeHexLowerCase } from '@oslojs/encoding';
import type { RequestHandler } from './$types';

async function getServerByContainer(name: string) {
  return db()
    .select()
    .from(schema.servers)
    .where(eq(schema.servers.containerName, name))
    .get();
}

export const GET: RequestHandler = async ({ params, locals }) => {
  requireRole(locals.user, 'admin');
  if (!params.name) throw error(400);
  const server = await getServerByContainer(params.name);
  if (!server) throw error(404, 'server não encontrado');

  const rows = await db()
    .select({
      id: schema.serverUsers.id,
      userId: schema.users.id,
      username: schema.users.username,
      userRole: schema.users.role,
      permissions: schema.serverUsers.permissions,
      addedBy: schema.serverUsers.addedBy,
      createdAt: schema.serverUsers.createdAt
    })
    .from(schema.serverUsers)
    .innerJoin(schema.users, eq(schema.serverUsers.userId, schema.users.id))
    .where(eq(schema.serverUsers.serverId, server.id));

  return json({
    subusers: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      username: r.username,
      userRole: r.userRole,
      permissions: parsePermissions(r.permissions),
      addedBy: r.addedBy,
      createdAt: r.createdAt
    })),
    availablePermissions: SERVER_PERMISSIONS
  });
};

const addSchema = z.object({
  username: z.string().min(1).max(32),
  permissions: z.array(z.enum([...SERVER_PERMISSIONS] as [string, ...string[]])).default([])
});

function newId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return encodeHexLowerCase(bytes);
}

export const POST: RequestHandler = async (event) => {
  const { params, locals, request } = event;
  requireRole(locals.user, 'admin');
  if (!params.name) throw error(400);

  const server = await getServerByContainer(params.name);
  if (!server) throw error(404, 'server não encontrado');

  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) throw error(400, parsed.error.issues[0]?.message ?? 'body inválido');

  const target = await db()
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, parsed.data.username))
    .get();
  if (!target) throw error(404, `usuário "${parsed.data.username}" não existe`);
  if (target.role === 'admin') throw error(400, 'admins já tem acesso global, não precisa subuser');

  const existing = await db()
    .select()
    .from(schema.serverUsers)
    .where(and(eq(schema.serverUsers.serverId, server.id), eq(schema.serverUsers.userId, target.id)))
    .get();
  if (existing) throw error(409, 'este usuário já tem acesso a este server');

  await db().insert(schema.serverUsers).values({
    id: newId(),
    serverId: server.id,
    userId: target.id,
    permissions: serializePermissions(parsed.data.permissions as never),
    addedBy: locals.user!.id
  });

  await logAudit(event, {
    action: 'server.subuser.add',
    resourceType: 'server',
    resourceId: params.name,
    details: { username: parsed.data.username, permissions: parsed.data.permissions }
  });

  return json({ ok: true }, { status: 201 });
};

const updateSchema = z.object({
  subuserId: z.string().min(1),
  permissions: z.array(z.enum([...SERVER_PERMISSIONS] as [string, ...string[]]))
});

export const PUT: RequestHandler = async (event) => {
  const { params, locals, request } = event;
  requireRole(locals.user, 'admin');
  if (!params.name) throw error(400);

  const server = await getServerByContainer(params.name);
  if (!server) throw error(404, 'server não encontrado');

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) throw error(400, parsed.error.issues[0]?.message ?? 'body inválido');

  const existingRow = await db()
    .select()
    .from(schema.serverUsers)
    .where(
      and(
        eq(schema.serverUsers.id, parsed.data.subuserId),
        eq(schema.serverUsers.serverId, server.id)
      )
    )
    .get();
  if (!existingRow) throw error(404, 'subuser não encontrado neste server');

  await db()
    .update(schema.serverUsers)
    .set({ permissions: serializePermissions(parsed.data.permissions as never) })
    .where(eq(schema.serverUsers.id, parsed.data.subuserId));

  await logAudit(event, {
    action: 'server.subuser.update',
    resourceType: 'server',
    resourceId: params.name,
    details: { subuserId: parsed.data.subuserId, permissions: parsed.data.permissions }
  });

  return json({ ok: true });
};

const deleteSchema = z.object({ subuserId: z.string().min(1) });

export const DELETE: RequestHandler = async (event) => {
  const { params, locals, request } = event;
  requireRole(locals.user, 'admin');
  if (!params.name) throw error(400);

  const server = await getServerByContainer(params.name);
  if (!server) throw error(404);

  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) throw error(400, 'subuserId obrigatório');

  await db()
    .delete(schema.serverUsers)
    .where(
      and(
        eq(schema.serverUsers.id, parsed.data.subuserId),
        eq(schema.serverUsers.serverId, server.id)
      )
    );

  await logAudit(event, {
    action: 'server.subuser.remove',
    resourceType: 'server',
    resourceId: params.name,
    details: { subuserId: parsed.data.subuserId }
  });

  return json({ ok: true });
};
