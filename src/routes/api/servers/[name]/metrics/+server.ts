import { requireRole } from "$lib/auth/permissions";
import { json, error } from '@sveltejs/kit';
import { eq, and, gte } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import type { RequestHandler } from './$types';

const RANGES: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000
};

export const GET: RequestHandler = async ({ params, url, locals }) => {
  requireRole(locals.user, "viewer");
  if (!params.name) throw error(400);

  const range = url.searchParams.get('range') ?? '1h';
  const windowMs = RANGES[range] ?? RANGES['1h'];
  const since = new Date(Date.now() - windowMs);

  let serverRow: typeof schema.servers.$inferSelect | undefined;
  try {
    serverRow = await db()
      .select()
      .from(schema.servers)
      .where(eq(schema.servers.containerName, params.name))
      .get();
  } catch {
    serverRow = undefined;
  }

  if (!serverRow) {
    return json({ points: [], note: 'server sem histórico (não criado pela Forja)' });
  }

  const rows = await db()
    .select({
      ts: schema.metricSnapshots.timestamp,
      cpu: schema.metricSnapshots.cpuPercent,
      ram: schema.metricSnapshots.ramUsedMb,
      players: schema.metricSnapshots.playersOnline
    })
    .from(schema.metricSnapshots)
    .where(
      and(
        eq(schema.metricSnapshots.serverId, serverRow.id),
        gte(schema.metricSnapshots.timestamp, since)
      )
    )
    .orderBy(schema.metricSnapshots.timestamp);

  return json({
    points: rows.map((r) => ({
      ts: r.ts instanceof Date ? r.ts.getTime() : Number(r.ts),
      cpu: r.cpu,
      ram: r.ram,
      players: r.players
    })),
    range
  });
};
