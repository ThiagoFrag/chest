<script lang="ts">
  let { size = 16, class: cls = '' }: { size?: number; class?: string } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16" shape-rendering="crispEdges" class={cls}>
  <!-- flame -->
  <rect x="6" y="2" width="4" height="2" fill="#FF4444"/>
  <rect x="5" y="3" width="6" height="2" fill="#FF6666"/>
  <rect x="6" y="4" width="4" height="1" fill="#FF8888"/>
  <!-- handle -->
  <rect x="7" y="6" width="2" height="8" fill="#866043"/>
  <rect x="7" y="6" width="1" height="8" fill="#A07854"/>
</svg>
