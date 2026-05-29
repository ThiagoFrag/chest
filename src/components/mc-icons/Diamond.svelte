<script lang="ts">
  let { size = 16, class: cls = '' }: { size?: number; class?: string } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16" shape-rendering="crispEdges" class={cls}>
  <rect x="6" y="2" width="4" height="2" fill="#4AEDD9"/>
  <rect x="4" y="4" width="2" height="2" fill="#4AEDD9"/>
  <rect x="6" y="4" width="4" height="2" fill="#7BFEEF"/>
  <rect x="10" y="4" width="2" height="2" fill="#2BC1B1"/>
  <rect x="2" y="6" width="2" height="2" fill="#4AEDD9"/>
  <rect x="4" y="6" width="6" height="2" fill="#7BFEEF"/>
  <rect x="10" y="6" width="2" height="2" fill="#4AEDD9"/>
  <rect x="12" y="6" width="2" height="2" fill="#2BC1B1"/>
  <rect x="2" y="8" width="12" height="2" fill="#2BC1B1"/>
  <rect x="4" y="10" width="8" height="2" fill="#2BC1B1"/>
  <rect x="6" y="12" width="4" height="2" fill="#1FA095"/>
</svg>
