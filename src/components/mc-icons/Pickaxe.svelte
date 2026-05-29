<script lang="ts">
  let { size = 16, class: cls = '' }: { size?: number; class?: string } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16" shape-rendering="crispEdges" class={cls}>
  <!-- head iron -->
  <rect x="2" y="2" width="2" height="2" fill="#D8D8D8"/>
  <rect x="4" y="2" width="6" height="2" fill="#F0F0F0"/>
  <rect x="10" y="2" width="2" height="2" fill="#A8A8A8"/>
  <rect x="4" y="4" width="2" height="2" fill="#D8D8D8"/>
  <rect x="6" y="4" width="2" height="2" fill="#F0F0F0"/>
  <rect x="8" y="4" width="2" height="2" fill="#A8A8A8"/>
  <!-- handle -->
  <rect x="6" y="6" width="2" height="2" fill="#866043"/>
  <rect x="8" y="8" width="2" height="2" fill="#735237"/>
  <rect x="8" y="10" width="2" height="2" fill="#866043"/>
  <rect x="10" y="12" width="2" height="2" fill="#735237"/>
</svg>
