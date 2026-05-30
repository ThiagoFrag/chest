import { requireServerPermission } from "$lib/auth/require-server-permission";
import { error } from '@sveltejs/kit';
import { dockerForContainer } from '$lib/docker/client';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const { params } = event;
  if (!params.name) throw error(400);
  await requireServerPermission(event, params.name, "view_logs");

  const container = (await dockerForContainer(params.name)).getContainer(params.name);
  try {
    await container.inspect();
  } catch {
    throw error(404, 'container não existe');
  }

  const logsStream = (await container.logs({
    follow: true,
    stdout: true,
    stderr: true,
    tail: 200,
    timestamps: false
  })) as unknown as NodeJS.ReadableStream;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      let buf = Buffer.alloc(0);
      logsStream.on('data', (chunk: Buffer) => {
        buf = Buffer.concat([buf, chunk]);
        while (buf.length >= 8) {
          const size = buf.readUInt32BE(4);
          if (buf.length < 8 + size) break;
          const payload = buf.subarray(8, 8 + size).toString('utf8');
          buf = buf.subarray(8 + size);
          for (const line of payload.split('\n')) {
            if (line.trim()) send(JSON.stringify({ type: 'log', line }));
          }
        }
      });

      logsStream.on('end', () => {
        send(JSON.stringify({ type: 'end' }));
        controller.close();
      });

      logsStream.on('error', (err: Error) => {
        send(JSON.stringify({ type: 'error', message: err.message }));
        controller.close();
      });
    },
    cancel() {
      try {
        (logsStream as unknown as { destroy?: () => void }).destroy?.();
      } catch {
        /* ignore */
      }
    }
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no'
    }
  });
};
