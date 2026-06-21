import { dockerForHost, LOCAL_HOST_ID } from '$lib/docker/client';
import { createConnection } from 'node:net';

const MC_RANGE_START = 25565;
const MC_RANGE_END = 25600;
const RCON_RANGE_START = 25700;
const RCON_RANGE_END = 25800;

interface PortPair {
  http: number;
  rcon: number;
}

const HOST_PROBE_HOSTNAME = process.env.HOST_PROBE_HOSTNAME ?? 'host.docker.internal';

async function isPortInUseOnHost(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: HOST_PROBE_HOSTNAME, port, timeout: 400 });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

// Each host owns its own copy of the port ranges below — the daemon scan is
// per-host, so allocations on different hosts never need to coordinate and
// identical port numbers across hosts are fine (they bind different machines).
async function collectDockerPorts(hostId: string = LOCAL_HOST_ID): Promise<Set<number>> {
  const d = await dockerForHost(hostId);
  const containers = await d.listContainers({ all: true });
  const used = new Set<number>();

  for (const c of containers) {
    for (const port of c.Ports ?? []) {
      if (port.PublicPort) used.add(port.PublicPort);
    }
  }

  for (const c of containers) {
    if (c.HostConfig?.NetworkMode !== 'host') continue;
    try {
      const info = await d.getContainer(c.Id).inspect();
      const exposed = info.Config?.ExposedPorts ?? {};
      for (const key of Object.keys(exposed)) {
        const num = parseInt(key.split('/')[0], 10);
        if (!Number.isNaN(num)) used.add(num);
      }
    } catch {
      /* ignore */
    }
  }

  return used;
}

async function findFreePort(
  start: number,
  end: number,
  dockerUsed: Set<number>,
  alsoUsed: Set<number>,
  probeHost: boolean
): Promise<number | null> {
  for (let p = start; p <= end; p++) {
    if (dockerUsed.has(p) || alsoUsed.has(p)) continue;
    // The TCP probe targets host.docker.internal, which only resolves to the
    // local daemon's host. For remote hosts we trust the container port scan
    // and skip the probe — it would just hit (or miss) the wrong machine.
    if (probeHost) {
      const busyOnHost = await isPortInUseOnHost(p);
      if (busyOnHost) {
        alsoUsed.add(p);
        continue;
      }
    }
    return p;
  }
  return null;
}

export async function allocatePorts(hostId: string = LOCAL_HOST_ID): Promise<PortPair> {
  const dockerUsed = await collectDockerPorts(hostId);
  const alsoUsed = new Set<number>();
  const probeHost = hostId === LOCAL_HOST_ID;

  const http = await findFreePort(
    MC_RANGE_START,
    MC_RANGE_END,
    dockerUsed,
    alsoUsed,
    probeHost
  );
  if (http === null) {
    throw new Error(`sem portas MC livres no range ${MC_RANGE_START}-${MC_RANGE_END}`);
  }
  alsoUsed.add(http);

  const rcon = await findFreePort(
    RCON_RANGE_START,
    RCON_RANGE_END,
    dockerUsed,
    alsoUsed,
    probeHost
  );
  if (rcon === null) {
    throw new Error(
      `sem portas RCON livres no range ${RCON_RANGE_START}-${RCON_RANGE_END}`
    );
  }

  return { http, rcon };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}
