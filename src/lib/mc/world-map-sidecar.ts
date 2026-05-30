import { dockerForHost, dockerForContainer, LOCAL_HOST_ID } from '$lib/docker/client';
import { db, schema } from '$lib/db';
import { eq } from 'drizzle-orm';
import type Docker from 'dockerode';

/**
 * Resolve the Docker host that a sidecar must run on: the SAME host as its parent
 * Minecraft server. The sidecar only carries a `slug`, so we look up the parent
 * server row by slug to learn its hostId and route there. Unmanaged containers
 * (no server row — slug is the sanitized container name) fall back to local.
 */
async function dockerForSidecar(slug: string): Promise<Docker> {
  try {
    const row = db()
      .select({ hostId: schema.servers.hostId, containerName: schema.servers.containerName })
      .from(schema.servers)
      .where(eq(schema.servers.slug, slug))
      .get();
    if (row) {
      // Route via the parent container so the host stays in sync with the server.
      return await dockerForContainer(row.containerName);
    }
  } catch {
    /* fall through to local */
  }
  return dockerForHost(LOCAL_HOST_ID);
}

const BLUEMAP_CLI_VERSION = '3.20';
const BLUEMAP_CLI_URL = `https://github.com/BlueMap-Minecraft/BlueMap/releases/download/v${BLUEMAP_CLI_VERSION}/BlueMap-${BLUEMAP_CLI_VERSION}-cli.jar`;
const SIDECAR_IMAGE = 'eclipse-temurin:21-jre';
const SIDECAR_CONTAINER_PORT = 8100;

export const SIDECAR_LABEL = 'forja.bluemap';
export const SIDECAR_PARENT_LABEL = 'forja.bluemap.parent';

const sidecarLocks = new Map<string, Promise<void>>();

async function withSidecarLock<T>(slug: string, fn: () => Promise<T>): Promise<T> {
  const prev = sidecarLocks.get(slug);
  if (prev) await prev.catch(() => undefined);
  let release: () => void = () => undefined;
  const lock = new Promise<void>((r) => {
    release = r;
  });
  sidecarLocks.set(slug, lock);
  try {
    return await fn();
  } finally {
    release();
    if (sidecarLocks.get(slug) === lock) sidecarLocks.delete(slug);
  }
}

export function sidecarName(slug: string): string {
  return `chest-bluemap-${slug}`;
}

export function sidecarVolumeName(slug: string): string {
  return `forja-bluemap-${slug}`;
}

/**
 * Returns the bind source for `/data` on a Minecraft server container.
 * Works for both Chest-managed servers (named volume) and externally-created
 * containers (host bind or different volume name).
 */
export async function resolveServerDataMount(containerName: string): Promise<string | null> {
  try {
    const info = await (await dockerForContainer(containerName)).getContainer(containerName).inspect();
    const mounts = info.Mounts ?? [];
    const dataMount = mounts.find((m) => m.Destination === '/data');
    if (!dataMount) return null;
    return dataMount.Name ?? dataMount.Source ?? null;
  } catch {
    return null;
  }
}

/**
 * Inline entrypoint script:
 *  1. download CLI jar once (cached in /bluemap volume)
 *  2. ensure config exists with accept-download=true
 *  3. ensure maps/world.conf points at /mc-data/world
 *  4. run BlueMap with render + watch + webserver
 */
const ENTRYPOINT_SCRIPT = `set -eu
CACHE=/bluemap
JAR=$CACHE/bluemap-cli.jar
if [ ! -f "$JAR" ]; then
  echo "[bluemap-sidecar] downloading BlueMap CLI ${BLUEMAP_CLI_VERSION}..."
  if command -v curl >/dev/null 2>&1; then
    curl -fSL --retry 3 -o "$JAR.tmp" "${BLUEMAP_CLI_URL}"
  else
    wget -qO "$JAR.tmp" "${BLUEMAP_CLI_URL}"
  fi
  mv "$JAR.tmp" "$JAR"
fi

cd "$CACHE"

# 1st run: generates defaults (exits cleanly), then we patch + run for real
if [ ! -f "core.conf" ] && [ ! -f "config/core.conf" ]; then
  echo "[bluemap-sidecar] generating default config (1st run)..."
  java -jar "$JAR" || true
fi

# detect config layout (v3.x uses CWD, v5.x uses config/)
if [ -f "config/core.conf" ]; then
  CFG_DIR="config"
else
  CFG_DIR="."
fi
echo "[bluemap-sidecar] using config dir: $CFG_DIR"

# accept download (required to fetch MC client jar resources)
CORE="$CFG_DIR/core.conf"
if [ -f "$CORE" ]; then
  if grep -q '^accept-download:' "$CORE"; then
    sed -i 's|^accept-download:.*|accept-download: true|' "$CORE"
  else
    echo 'accept-download: true' >> "$CORE"
  fi
fi

# bind webserver on all interfaces
WEB="$CFG_DIR/webserver.conf"
if [ -f "$WEB" ]; then
  if grep -q '^ip:' "$WEB"; then
    sed -i 's|^ip:.*|ip: "0.0.0.0"|' "$WEB"
  else
    echo 'ip: "0.0.0.0"' >> "$WEB"
  fi
fi

MAPS_DIR="$CFG_DIR/maps"
mkdir -p "$MAPS_DIR"

# Always overwrite chest-managed map configs to guarantee correct world path.
# Marker line tells future runs (or humans) this file is auto-generated.
CHEST_MARKER='# managed-by: chest-bluemap-sidecar'

cat > "$MAPS_DIR/overworld.conf" <<EOF
$CHEST_MARKER
world: "/mc-data/world"
name: "Overworld"
sky-color: "#7dabff"
ambient-light: 0.1
world-sky-light: 15
remove-caves-below-y: 55
EOF

if [ -d /mc-data/world_nether ] || [ -d /mc-data/world/DIM-1 ]; then
  NETHER_PATH=/mc-data/world_nether
  if [ -d /mc-data/world/DIM-1 ]; then NETHER_PATH=/mc-data/world; fi
  cat > "$MAPS_DIR/nether.conf" <<EOF
$CHEST_MARKER
world: "$NETHER_PATH"
name: "Nether"
dimension: "minecraft:the_nether"
sky-color: "#290000"
ambient-light: 0.6
world-sky-light: 0
EOF
else
  rm -f "$MAPS_DIR/nether.conf"
fi

if [ -d /mc-data/world_the_end ] || [ -d /mc-data/world/DIM1 ]; then
  END_PATH=/mc-data/world_the_end
  if [ -d /mc-data/world/DIM1 ]; then END_PATH=/mc-data/world; fi
  cat > "$MAPS_DIR/end.conf" <<EOF
$CHEST_MARKER
world: "$END_PATH"
name: "End"
dimension: "minecraft:the_end"
sky-color: "#080010"
ambient-light: 0.6
world-sky-light: 0
EOF
else
  rm -f "$MAPS_DIR/end.conf"
fi

echo "[bluemap-sidecar] starting BlueMap webserver + render + watch"
exec java "-Xmx\${BLUEMAP_HEAP_MB:-1024}m" -jar "$JAR" -u -w -r
`;

export interface SidecarStatus {
  exists: boolean;
  state: string | null;
  hostPort: number | null;
  uptime: string | null;
  containerName: string;
}

export async function getSidecarStatus(slug: string): Promise<SidecarStatus> {
  const name = sidecarName(slug);
  try {
    const info = await (await dockerForSidecar(slug)).getContainer(name).inspect();
    const hostPort = parseInt(
      info.NetworkSettings?.Ports?.[`${SIDECAR_CONTAINER_PORT}/tcp`]?.[0]?.HostPort ?? '0',
      10
    );
    return {
      exists: true,
      state: info.State.Status,
      hostPort: hostPort || null,
      uptime: info.State.StartedAt ?? null,
      containerName: name
    };
  } catch {
    return { exists: false, state: null, hostPort: null, uptime: null, containerName: name };
  }
}

export interface CreateSidecarInput {
  slug: string;
  dataVolume: string;
  hostPort: number;
  network?: string;
  heapMb?: number;
}

export async function createBlueMapSidecar(input: CreateSidecarInput): Promise<void> {
  return withSidecarLock(input.slug, async () => {
    const d = await dockerForSidecar(input.slug);
    const name = sidecarName(input.slug);
    const volumeName = sidecarVolumeName(input.slug);

    await removeBlueMapSidecarUnlocked(input.slug, {}, d).catch(() => undefined);
    await ensureSidecarImage(d);
    await d.createVolume({ Name: volumeName, Labels: { [SIDECAR_LABEL]: 'true', 'forja.slug': input.slug } }).catch(() => undefined);

    const networkConfig = input.network
      ? { EndpointsConfig: { [input.network]: {} } }
      : undefined;

    const container = await d.createContainer({
      name,
      Image: SIDECAR_IMAGE,
      Cmd: ['sh', '-c', ENTRYPOINT_SCRIPT],
      Env: [`BLUEMAP_HEAP_MB=${input.heapMb ?? 1024}`],
      Labels: {
        'forja.managed': 'true',
        [SIDECAR_LABEL]: 'true',
        [SIDECAR_PARENT_LABEL]: input.slug,
        'forja.display': `BlueMap (${input.slug})`
      },
      ExposedPorts: { [`${SIDECAR_CONTAINER_PORT}/tcp`]: {} },
      HostConfig: {
        RestartPolicy: { Name: 'unless-stopped' },
        Memory: ((input.heapMb ?? 1024) + 512) * 1024 * 1024,
        Binds: [`${input.dataVolume}:/mc-data`, `${volumeName}:/bluemap`],
        PortBindings: {
          [`${SIDECAR_CONTAINER_PORT}/tcp`]: [{ HostPort: String(input.hostPort) }]
        }
      },
      NetworkingConfig: networkConfig
    });

    await container.start();
  });
}

async function ensureSidecarImage(d: Docker): Promise<void> {
  try {
    await d.getImage(SIDECAR_IMAGE).inspect();
    return;
  } catch {
    /* not present, pull */
  }
  const stream = (await d.pull(SIDECAR_IMAGE)) as unknown as NodeJS.ReadableStream;
  await new Promise<void>((resolve, reject) => {
    d.modem.followProgress(
      stream as never,
      (err) => (err ? reject(err) : resolve()),
      () => undefined
    );
  });
}

export async function stopBlueMapSidecar(slug: string): Promise<void> {
  const name = sidecarName(slug);
  try {
    await (await dockerForSidecar(slug)).getContainer(name).stop({ t: 10 });
  } catch {
    /* ignore */
  }
}

async function removeBlueMapSidecarUnlocked(
  slug: string,
  opts: { wipeVolume?: boolean } = {},
  client?: Docker
): Promise<void> {
  const d = client ?? (await dockerForSidecar(slug));
  const name = sidecarName(slug);
  try {
    await d.getContainer(name).remove({ force: true });
  } catch {
    /* ignore */
  }
  if (opts.wipeVolume) {
    try {
      await d.getVolume(sidecarVolumeName(slug)).remove({ force: true });
    } catch {
      /* ignore */
    }
  }
}

export async function removeBlueMapSidecar(slug: string, opts: { wipeVolume?: boolean } = {}): Promise<void> {
  return withSidecarLock(slug, () => removeBlueMapSidecarUnlocked(slug, opts));
}

export async function listAllSidecars(): Promise<Array<{ slug: string; containerName: string; state: string; hostPort: number | null }>> {
  // Cross-host aggregation is out of scope for this wave: a single Docker client
  // only sees one host. Keep prior behavior by listing on the local host.
  const containers = await (await dockerForHost(LOCAL_HOST_ID)).listContainers({
    all: true,
    filters: { label: [`${SIDECAR_LABEL}=true`] }
  });
  return containers.map((c) => {
    const name = c.Names[0]?.replace(/^\//, '') ?? '';
    const slug = c.Labels?.[SIDECAR_PARENT_LABEL] ?? '';
    const hostPort = c.Ports?.find((p) => p.PrivatePort === SIDECAR_CONTAINER_PORT)?.PublicPort ?? null;
    return { slug, containerName: name, state: c.State, hostPort: hostPort ?? null };
  });
}
