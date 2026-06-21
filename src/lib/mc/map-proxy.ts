import { error, type RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '$lib/db';
import { getSidecarStatus } from './world-map-sidecar';

const UPSTREAM_HOST = process.env.MAP_PROXY_UPSTREAM_HOST ?? 'host.docker.internal';

const PORT_CACHE_TTL_MS = 60_000;
const portCache = new Map<string, { port: number; expiresAt: number }>();

function nowMs(): number {
  return performance.now();
}

function sanitizeSlug(name: string): string {
  return name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

export function invalidateMapPortCache(containerName: string): void {
  portCache.delete(containerName);
}

async function resolveMapPort(containerName: string): Promise<number | null> {
  const cached = portCache.get(containerName);
  if (cached && cached.expiresAt > nowMs()) {
    return cached.port;
  }

  const row = await db()
    .select({ slug: schema.servers.slug, hostPortMap: schema.servers.hostPortMap })
    .from(schema.servers)
    .where(eq(schema.servers.containerName, containerName))
    .get();

  let port: number | null = null;
  if (row?.hostPortMap) {
    port = row.hostPortMap;
  } else {
    const slug = row?.slug ?? sanitizeSlug(containerName);
    const sidecar = await getSidecarStatus(slug);
    port = sidecar.hostPort;
  }

  if (port != null) {
    portCache.set(containerName, { port, expiresAt: nowMs() + PORT_CACHE_TTL_MS });
  }
  return port;
}

const FORWARD_REQUEST = new Set([
  'accept',
  'accept-language',
  'cache-control',
  'if-none-match',
  'if-modified-since',
  'range',
  'user-agent'
]);

const STRIP_RESPONSE = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-security-policy',
  'x-frame-options',
  'content-encoding',
  'content-length',
  'set-cookie',
  'clear-site-data',
  'location',
  'strict-transport-security'
]);

function filterRequestHeaders(h: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  h.forEach((v, k) => {
    if (FORWARD_REQUEST.has(k.toLowerCase())) out[k] = v;
  });
  return out;
}

function filterResponseHeaders(h: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  h.forEach((v, k) => {
    if (STRIP_RESPONSE.has(k.toLowerCase())) return;
    out[k] = v;
  });
  return out;
}

/**
 * Reverse-proxies a request to the BlueMap webserver on host:port.
 *
 * Used by both `/proxy/+server.ts` (root: serves index.html) and
 * `/proxy/[...path]/+server.ts` (assets, tiles, settings.json, etc).
 */
export async function proxyToMap(
  event: RequestEvent,
  containerName: string,
  pathPart: string
): Promise<Response> {
  const method = event.request.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    throw error(405, 'método não permitido');
  }

  const port = await resolveMapPort(containerName);
  if (!port) throw error(404, 'mapa não está instalado para este server');

  const url = new URL(event.request.url);
  const upstream = `http://${UPSTREAM_HOST}:${port}/${pathPart}${url.search}`;

  let res: Response;
  try {
    res = await fetch(upstream, {
      method,
      headers: {
        ...filterRequestHeaders(event.request.headers),
        'accept-encoding': 'identity'
      },
      signal: AbortSignal.any([event.request.signal, AbortSignal.timeout(30_000)])
    });
  } catch (err) {
    console.error('[map-proxy] upstream fetch falhou', {
      containerName,
      upstream,
      method,
      error: err instanceof Error ? { message: err.message, stack: err.stack } : err
    });
    throw error(502, 'proxy upstream indisponível');
  }

  const stripQuotes = (v: string) => v.replace(/^"|"$/g, '');

  const upstreamEtagRaw = res.headers.get('etag');
  const upstreamLastModified = res.headers.get('last-modified');
  const reqIfNoneMatch = event.request.headers.get('if-none-match');
  const reqIfModifiedSince = event.request.headers.get('if-modified-since');

  if (res.status === 200) {
    const etagNormalized = upstreamEtagRaw ? stripQuotes(upstreamEtagRaw) : null;
    const ifNoneMatchNormalized = reqIfNoneMatch ? stripQuotes(reqIfNoneMatch) : null;

    let etagMatch = false;
    if (etagNormalized && ifNoneMatchNormalized) {
      etagMatch = etagNormalized === ifNoneMatchNormalized;
    }

    let modifiedSinceMatch = false;
    if (reqIfModifiedSince && upstreamLastModified) {
      const reqTs = new Date(reqIfModifiedSince).getTime();
      const upstreamTs = new Date(upstreamLastModified).getTime();
      if (Number.isFinite(reqTs) && Number.isFinite(upstreamTs)) {
        modifiedSinceMatch = reqTs >= upstreamTs;
      }
    }

    if (etagMatch || modifiedSinceMatch) {
      res.body?.cancel().catch(() => {});

      const notModifiedHeaders: Record<string, string> = {};
      if (etagNormalized) notModifiedHeaders['etag'] = `"${etagNormalized}"`;
      if (upstreamLastModified)
        notModifiedHeaders['last-modified'] = upstreamLastModified;
      const cacheControl = res.headers.get('cache-control');
      if (cacheControl) notModifiedHeaders['cache-control'] = cacheControl;

      return new Response(null, {
        status: 304,
        headers: notModifiedHeaders
      });
    }
  }

  const outHeaders = filterResponseHeaders(res.headers);
  if (upstreamEtagRaw && !/^".*"$/.test(upstreamEtagRaw)) {
    const normalized = stripQuotes(upstreamEtagRaw);
    for (const key of Object.keys(outHeaders)) {
      if (key.toLowerCase() === 'etag') delete outHeaders[key];
    }
    outHeaders['etag'] = `"${normalized}"`;
  }

  return new Response(res.body, {
    status: res.status,
    headers: outHeaders
  });
}
