<script lang="ts">
  import '../app.css';
  import { initLocale } from '$lib/i18n';
  import { initTheme } from '$lib/theme';
  import { initMotion } from '$lib/fx';

  let { children, data } = $props();

  // Inicializa o locale a partir do valor resolvido no servidor (cookie / accept-language).
  // No SSR roda por request no render deste layout; no client confirma na hidratacao.
  initLocale(data.locale);

  // Inicializa o tema (cookie -> locals.theme). O data-theme no <html> ja foi
  // aplicado no SSR via hooks.server.ts (sem flash); aqui so sincroniza o store.
  initTheme(data.theme);

  // Sincroniza o toggle de animacoes de fundo (cookie -> locals.motion).
  initMotion(data.motion);
</script>

{@render children()}
