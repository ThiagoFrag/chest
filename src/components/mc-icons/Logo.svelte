<script lang="ts">
  let {
    size = 1,
    showIcon = true
  }: { size?: number; showIcon?: boolean } = $props();

  const scale = $derived(size);
</script>

<div class="logo-wrap" style="--scale: {scale};">
  {#if showIcon}
    <svg
      class="logo-icon"
      viewBox="0 0 16 16"
      shape-rendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- tampa do baú -->
      <rect x="1" y="2" width="14" height="3" fill="#9a6c3c" />
      <rect x="1" y="2" width="14" height="1" fill="#c98d5b" />
      <rect x="1" y="4" width="14" height="1" fill="#74522a" />
      <!-- corpo -->
      <rect x="1" y="5" width="14" height="9" fill="#7d5829" />
      <rect x="1" y="5" width="14" height="1" fill="#a87547" />
      <rect x="1" y="13" width="14" height="1" fill="#5a3e1e" />
      <!-- borda lateral -->
      <rect x="1" y="5" width="1" height="9" fill="#5a3e1e" />
      <rect x="14" y="5" width="1" height="9" fill="#5a3e1e" />
      <!-- pranchas verticais (detalhe madeira) -->
      <rect x="5" y="6" width="1" height="7" fill="#6a4720" />
      <rect x="10" y="6" width="1" height="7" fill="#6a4720" />
      <!-- fechadura central -->
      <rect x="7" y="3" width="2" height="4" fill="#2d2d2d" />
      <rect x="7" y="3" width="2" height="1" fill="#4d4d4d" />
      <rect x="7" y="6" width="2" height="1" fill="#1a1a1a" />
      <!-- highlight superior -->
      <rect x="3" y="2" width="1" height="1" fill="#d4a273" />
      <rect x="11" y="2" width="1" height="1" fill="#d4a273" />
    </svg>
  {/if}

  <div class="logo-text">
    <span class="letter c">C</span>
    <span class="letter h">H</span>
    <span class="letter e">E</span>
    <span class="letter s">S</span>
    <span class="letter t">T</span>
  </div>
</div>

<style>
  .logo-wrap {
    display: inline-flex;
    align-items: center;
    gap: calc(8px * var(--scale));
    line-height: 1;
  }

  .logo-icon {
    width: calc(28px * var(--scale));
    height: calc(28px * var(--scale));
    image-rendering: pixelated;
    filter: drop-shadow(2px 2px 0 rgba(0, 0, 0, 0.6));
  }

  .logo-text {
    display: inline-flex;
    align-items: baseline;
    font-family: 'Minecraft', monospace;
    font-size: calc(28px * var(--scale));
    letter-spacing: calc(2px * var(--scale));
    line-height: 1;
  }

  .letter {
    display: inline-block;
    text-shadow:
      calc(3px * var(--scale)) calc(3px * var(--scale)) 0 rgba(0, 0, 0, 0.55);
  }

  /* Cores estilo logo Minecraft Title — dourado/laranja */
  .c { color: #ffd24d; }
  .h { color: #f5b733; }
  .e { color: #ec9c1f; }
  .s { color: #db8717; }
  .t { color: #b86e10; }
</style>
