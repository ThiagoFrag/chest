<script lang="ts">
  import { resolveHeadSource } from '$lib/mc/skin';
  import type { AuthMode } from '$lib/mc/auth-mode';

  let {
    name = 'Steve',
    uuid = null,
    mode = undefined,
    draslUrl = null,
    containerName = null,
    size = 16,
    class: cls = ''
  }: {
    name?: string;
    uuid?: string | null;
    mode?: AuthMode;
    draslUrl?: string | null;
    containerName?: string | null;
    size?: number;
    class?: string;
  } = $props();

  const source = $derived(resolveHeadSource({ mode, uuid, name, draslUrl, size, containerName }));

  let canvas = $state<HTMLCanvasElement | null>(null);
  let canvasFailed = $state(false);

  function drawFace(c: HTMLCanvasElement, skinUrl: string) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ctx = c.getContext('2d');
      if (!ctx) {
        canvasFailed = true;
        return;
      }
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);
      // face: 8x8 at (8,8); hat overlay: 8x8 at (40,8) on a 64xN skin
      ctx.drawImage(img, 8, 8, 8, 8, 0, 0, size, size);
      ctx.drawImage(img, 40, 8, 8, 8, 0, 0, size, size);
    };
    img.onerror = () => {
      canvasFailed = true;
    };
    img.src = skinUrl;
  }

  $effect(() => {
    canvasFailed = false;
    if (source.kind === 'proxy' && canvas) {
      drawFace(canvas, source.url);
    }
  });
</script>

{#if source.kind === 'proxy' && !canvasFailed}
  <canvas
    bind:this={canvas}
    width={size}
    height={size}
    aria-label={name}
    class={cls}
    style="image-rendering: pixelated; width: {size}px; height: {size}px;"
  ></canvas>
{:else if source.kind === 'steve' || (source.kind === 'proxy' && canvasFailed)}
  <img
    src="/textures/steve.png"
    alt={name}
    width={size}
    height={size}
    loading="lazy"
    class={cls}
    style="image-rendering: pixelated;"
    onerror={(e) => {
      const el = e.currentTarget as HTMLImageElement;
      el.onerror = null;
      el.src = `https://mc-heads.net/avatar/${encodeURIComponent(name)}/${size}/nohelm`;
    }}
  />
{:else if source.kind === 'url'}
  <img
    src={source.url}
    alt={name}
    width={size}
    height={size}
    loading="lazy"
    class={cls}
    style="image-rendering: pixelated;"
  />
{/if}
