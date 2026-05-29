const BASE = 'https://api.cloudflare.com/client/v4';

interface CFResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: unknown[];
  result: T;
}

export interface CFDnsRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
  ttl: number;
  zone_id: string;
  zone_name: string;
}

export interface CFZone {
  id: string;
  name: string;
  status: string;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

async function call<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(token), ...(init.headers ?? {}) }
  });
  const data = (await res.json()) as CFResponse<T>;
  if (!data.success) {
    const msg = data.errors?.[0]?.message ?? `HTTP ${res.status}`;
    throw new Error(`Cloudflare: ${msg}`);
  }
  return data.result;
}

export async function verifyToken(token: string): Promise<{ valid: boolean; status: string }> {
  const res = await fetch(`${BASE}/user/tokens/verify`, {
    headers: authHeaders(token)
  });
  const data = (await res.json()) as CFResponse<{ id: string; status: string }>;
  if (!data.success) return { valid: false, status: 'invalid' };
  return { valid: true, status: data.result.status };
}

export async function listZones(token: string): Promise<CFZone[]> {
  return call<CFZone[]>(token, '/zones?per_page=50');
}

export async function findZoneByName(token: string, name: string): Promise<CFZone | null> {
  const zones = await call<CFZone[]>(token, `/zones?name=${encodeURIComponent(name)}`);
  return zones[0] ?? null;
}

export async function listDnsRecords(
  token: string,
  zoneId: string,
  name?: string
): Promise<CFDnsRecord[]> {
  const qs = name ? `?name=${encodeURIComponent(name)}` : '';
  return call<CFDnsRecord[]>(token, `/zones/${zoneId}/dns_records${qs}`);
}

export interface CreateRecordInput {
  type: 'A' | 'AAAA' | 'CNAME' | 'SRV';
  name: string;
  content: string;
  proxied?: boolean;
  ttl?: number;
}

export async function createDnsRecord(
  token: string,
  zoneId: string,
  input: CreateRecordInput
): Promise<CFDnsRecord> {
  return call<CFDnsRecord>(token, `/zones/${zoneId}/dns_records`, {
    method: 'POST',
    body: JSON.stringify({
      type: input.type,
      name: input.name,
      content: input.content,
      proxied: input.proxied ?? false,
      ttl: input.ttl ?? 1
    })
  });
}

export async function updateDnsRecord(
  token: string,
  zoneId: string,
  recordId: string,
  input: Partial<CreateRecordInput>
): Promise<CFDnsRecord> {
  return call<CFDnsRecord>(token, `/zones/${zoneId}/dns_records/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  });
}

export async function deleteDnsRecord(token: string, zoneId: string, recordId: string): Promise<void> {
  await call<{ id: string }>(token, `/zones/${zoneId}/dns_records/${recordId}`, {
    method: 'DELETE'
  });
}

export async function upsertCnameRecord(
  token: string,
  zoneId: string,
  name: string,
  target: string,
  proxied: boolean = false
): Promise<CFDnsRecord> {
  const existing = await listDnsRecords(token, zoneId, name);
  const match = existing.find((r) => r.name === name && (r.type === 'CNAME' || r.type === 'A' || r.type === 'AAAA'));
  if (match) {
    return updateDnsRecord(token, zoneId, match.id, {
      type: 'CNAME',
      name,
      content: target,
      proxied,
      ttl: 1
    });
  }
  return createDnsRecord(token, zoneId, {
    type: 'CNAME',
    name,
    content: target,
    proxied,
    ttl: 1
  });
}
