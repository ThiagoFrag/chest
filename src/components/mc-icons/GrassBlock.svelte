<script lang="ts">
  let { size = 16, class: cls = '' }: { size?: number; class?: string } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16" shape-rendering="crispEdges" class={cls}>
  <!-- grass top -->
  <rect x="0" y="0" width="16" height="4" fill="#5BA34D"/>
  <rect x="2" y="0" width="2" height="2" fill="#6BB85B"/>
  <rect x="6" y="0" width="2" height="2" fill="#6BB85B"/>
  <rect x="10" y="0" width="2" height="2" fill="#6BB85B"/>
  <rect x="0" y="2" width="2" height="2" fill="#4A8C3D"/>
  <rect x="4" y="2" width="2" height="2" fill="#4A8C3D"/>
  <rect x="14" y="0" width="2" height="2" fill="#4A8C3D"/>
  <!-- dirt -->
  <rect x="0" y="4" width="16" height="12" fill="#866043"/>
  <rect x="2" y="6" width="2" height="2" fill="#9A7150"/>
  <rect x="8" y="6" width="2" height="2" fill="#9A7150"/>
  <rect x="4" y="10" width="2" height="2" fill="#735237"/>
  <rect x="12" y="10" width="2" height="2" fill="#9A7150"/>
  <rect x="6" y="12" width="2" height="2" fill="#735237"/>
  <rect x="10" y="14" width="2" height="2" fill="#9A7150"/>
</svg>
