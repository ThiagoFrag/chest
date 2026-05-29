<script lang="ts">
  let { size = 16, class: cls = '' }: { size?: number; class?: string } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16" shape-rendering="crispEdges" class={cls}>
  <!-- top -->
  <rect x="1" y="2" width="14" height="3" fill="#a87547"/>
  <rect x="1" y="2" width="14" height="1" fill="#c98d5b"/>
  <rect x="1" y="4" width="14" height="1" fill="#88582e"/>
  <!-- body -->
  <rect x="1" y="5" width="14" height="9" fill="#88582e"/>
  <rect x="1" y="5" width="14" height="1" fill="#a87547"/>
  <rect x="1" y="13" width="14" height="1" fill="#6b4423"/>
  <!-- lock -->
  <rect x="7" y="6" width="2" height="3" fill="#3a3a3a"/>
  <rect x="7" y="6" width="2" height="1" fill="#5a5a5a"/>
  <rect x="7" y="8" width="2" height="1" fill="#1a1a1a"/>
</svg>
