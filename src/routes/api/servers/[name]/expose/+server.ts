import { requireRole } from '$lib/auth/permissions';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { getSetting } from '$lib/settings';
import { upsertCnameRecord, findZoneByName } from '$lib/cloudflare/client';
import type { RequestHandler } from './$types';

const schemaBody = z.object({
  subdomain: z
    .string()
    .trim()
    .min(1)
    .max(63)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i, 'subdomain inválido')
});

export const POST: RequestHandler = async ({ params, request, locals }) => {
  requireRole(locals.user, 'admin');
  if (!params.name) throw error(400);

  const body = await request.json().catch(() => null);
  const parsed = schemaBody.safeParse(body);
  if (!parsed.success)
    throw error(400, parsed.error.issues[0]?.message ?? 'subdomain inválido');

  const server = await db()
    .select()
    .from(schema.servers)
    .where(eq(schema.servers.containerName, params.name))
    .get();
  if (!server) throw error(404, 'server não encontrado');

  const [token, zoneIdSetting, baseUrl, cnameTarget] = await Promise.all([
    getSetting('cloudflare.api_token'),
    getSetting('cloudflare.zone_id'),
    getSetting('forja.public_base_url'),
    getSetting('cloudflare.cname_target')
  ]);

  if (!token) throw error(400, 'cloudflare.api_token não configurado em Settings');
  if (!cnameTarget)
    throw error(400, 'cloudflare.cname_target não configurado em Settings');
  if (!baseUrl) throw error(400, 'forja.public_base_url não configurado em Settings');

  const zoneApex = new URL(
    baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
  ).hostname
    .split('.')
    .slice(-2)
    .join('.');

  let zoneId = zoneIdSetting;
  if (!zoneId) {
    const zone = await findZoneByName(token, zoneApex);
    if (!zone) throw error(404, `zone ${zoneApex} não encontrada na CF`);
    zoneId = zone.id;
  }

  const fullName = `${parsed.data.subdomain}.${zoneApex}`;
  const record = await upsertCnameRecord(token, zoneId, fullName, cnameTarget, false);

  const publicUrl = `${fullName}:${server.hostPortHttp}`;
  await db()
    .update(schema.servers)
    .set({
      publicUrl,
      publicMode: 'domain',
      cfDnsRecordId: record.id,
      updatedAt: new Date()
    })
    .where(eq(schema.servers.id, server.id));

  return json({
    publicUrl,
    hostname: fullName,
    port: server.hostPortHttp,
    dnsRecord: { id: record.id, name: record.name, content: record.content }
  });
};
