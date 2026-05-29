<script lang="ts">
  import { onMount } from 'svelte';

  const SPEC_URL = '/api/openapi.json';
  const SCALAR_CDN = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference';

  onMount(() => {
    const ref = document.createElement('script');
    ref.id = 'api-reference';
    ref.setAttribute('data-url', SPEC_URL);
    ref.setAttribute('data-configuration', JSON.stringify({ theme: 'default', darkMode: true }));
    document.body.appendChild(ref);

    const loader = document.createElement('script');
    loader.src = SCALAR_CDN;
    document.body.appendChild(loader);

    return () => {
      ref.remove();
      loader.remove();
    };
  });
</script>

<svelte:head>
  <title>Chest API — Docs</title>
</svelte:head>

<div class="docs-root"></div>

<style>
  :global(html, body) {
    margin: 0;
    height: 100%;
  }
  .docs-root {
    min-height: 100vh;
  }
</style>
