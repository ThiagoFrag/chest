<script lang="ts">
  let { size = 16, class: cls = '' }: { size?: number; class?: string } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16" shape-rendering="crispEdges" class={cls}>
  <!-- blade diamond -->
  <rect x="2" y="2" width="2" height="2" fill="#4AEDD9"/>
  <rect x="4" y="2" width="2" height="2" fill="#7BFEEF"/>
  <rect x="4" y="4" width="2" height="2" fill="#4AEDD9"/>
  <rect x="6" y="4" width="2" height="2" fill="#7BFEEF"/>
  <rect x="6" y="6" width="2" height="2" fill="#4AEDD9"/>
  <rect x="8" y="6" width="2" height="2" fill="#7BFEEF"/>
  <rect x="8" y="8" width="2" height="2" fill="#2BC1B1"/>
  <!-- guard -->
  <rect x="8" y="10" width="2" height="2" fill="#A8A8A8"/>
  <rect x="10" y="8" width="2" height="2" fill="#D8D8D8"/>
  <!-- handle -->
  <rect x="10" y="10" width="2" height="2" fill="#866043"/>
  <rect x="12" y="12" width="2" height="2" fill="#735237"/>
</svg>
