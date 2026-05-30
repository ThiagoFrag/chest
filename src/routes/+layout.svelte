<script lang="ts">
  import '../app.css';
  import { initLocale } from '$lib/i18n';

  let { children, data } = $props();

  // Inicializa o locale a partir do valor resolvido no servidor (cookie / accept-language).
  // No SSR roda por request no render deste layout; no client confirma na hidratacao.
  initLocale(data.locale);
</script>

{@render children()}
