import { fail } from '@sveltejs/kit';
import { requireRole } from '$lib/auth/permissions';
import { logAudit } from '$lib/audit';
import {
  listHosts,
  createHost,
  updateHost,
  deleteHost,
  testConnection,
  LOCAL_HOST_ID
} from '$lib/docker/hosts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  requireRole(locals.user, 'admin');
  return { hosts: await listHosts() };
};

function str(data: FormData, key: string): string {
  const v = data.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

function optionalPem(data: FormData, key: string): string | undefined {
  const v = data.get(key);
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export const actions: Actions = {
  createHost: async (event) => {
    requireRole(event.locals.user, 'admin');
    const data = await event.request.formData();
    const name = str(data, 'name');
    const endpoint = str(data, 'endpoint');
    const hostAddress = str(data, 'hostAddress');

    try {
      const host = await createHost({
        name,
        endpoint,
        hostAddress: hostAddress || undefined,
        tlsCa: optionalPem(data, 'tlsCa'),
        tlsCert: optionalPem(data, 'tlsCert'),
        tlsKey: optionalPem(data, 'tlsKey')
      });
      await logAudit(event, {
        action: 'host.create',
        resourceType: 'host',
        resourceId: host.id,
        details: { name: host.name, endpoint: host.endpoint }
      });
      return { created: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await logAudit(event, {
        action: 'host.create',
        resourceType: 'host',
        status: 'fail',
        details: { name, message }
      });
      return fail(400, { action: 'createHost', message });
    }
  },

  updateHost: async (event) => {
    requireRole(event.locals.user, 'admin');
    const data = await event.request.formData();
    const id = str(data, 'id');
    const name = str(data, 'name');
    const endpoint = str(data, 'endpoint');
    const hostAddress = str(data, 'hostAddress');

    try {
      await updateHost(id, {
        name,
        endpoint,
        hostAddress: hostAddress || null,
        enabled: data.get('enabled') === 'on',
        tlsCa: optionalPem(data, 'tlsCa'),
        tlsCert: optionalPem(data, 'tlsCert'),
        tlsKey: optionalPem(data, 'tlsKey')
      });
      await logAudit(event, {
        action: 'host.update',
        resourceType: 'host',
        resourceId: id,
        details: { name, endpoint }
      });
      return { updated: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await logAudit(event, {
        action: 'host.update',
        resourceType: 'host',
        resourceId: id,
        status: 'fail',
        details: { message }
      });
      return fail(400, { action: 'updateHost', id, message });
    }
  },

  deleteHost: async (event) => {
    requireRole(event.locals.user, 'admin');
    const data = await event.request.formData();
    const id = str(data, 'id');

    try {
      await deleteHost(id);
      await logAudit(event, {
        action: 'host.delete',
        resourceType: 'host',
        resourceId: id
      });
      return { deleted: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await logAudit(event, {
        action: 'host.delete',
        resourceType: 'host',
        resourceId: id,
        status: 'fail',
        details: { message }
      });
      return fail(400, { action: 'deleteHost', id, message });
    }
  },

  testConnection: async (event) => {
    requireRole(event.locals.user, 'admin');
    const data = await event.request.formData();
    const id = str(data, 'id');

    const result = await testConnection(id);
    await logAudit(event, {
      action: 'host.test',
      resourceType: 'host',
      resourceId: id,
      status: result.ok ? 'ok' : 'fail',
      details: result.ok ? { version: result.version } : { error: result.error }
    });

    return {
      action: 'testConnection',
      id,
      ok: result.ok,
      version: result.version,
      error: result.error,
      isLocal: id === LOCAL_HOST_ID
    };
  }
};
