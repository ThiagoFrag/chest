import Docker from 'dockerode';
import { env } from '$env/dynamic/private';

let instance: Docker | null = null;

export function docker(): Docker {
  if (instance) return instance;

  const host = env.DOCKER_HOST ?? '';

  if (host.startsWith('tcp://')) {
    const url = new URL(host);
    instance = new Docker({
      host: url.hostname,
      port: Number(url.port || 2375),
      protocol: 'http'
    });
  } else if (host.startsWith('unix://')) {
    instance = new Docker({ socketPath: host.replace(/^unix:\/\//, '') });
  } else {
    instance = new Docker({ socketPath: '/var/run/docker.sock' });
  }

  return instance;
}
