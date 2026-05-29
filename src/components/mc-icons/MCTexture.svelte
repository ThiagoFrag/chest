<script lang="ts">
  let {
    src,
    alt = '',
    size = 32,
    class: cls = ''
  }: { src: string; alt?: string; size?: number; class?: string } = $props();
</script>

<img
  {src}
  {alt}
  width={size}
  height={size}
  class={cls}
  style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;"
/>
