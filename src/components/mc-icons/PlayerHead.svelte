<script lang="ts">
  let {
    name = 'Steve',
    size = 16,
    class: cls = ''
  }: { name?: string; size?: number; class?: string } = $props();

  const src = $derived(`https://mc-heads.net/avatar/${encodeURIComponent(name)}/${size}/nohelm`);
</script>

<img
  {src}
  alt={name}
  width={size}
  height={size}
  loading="lazy"
  class={cls}
  style="image-rendering: pixelated;"
/>
