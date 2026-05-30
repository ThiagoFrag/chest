<!--
  ParallaxBackground — fundo pixel-art animado, tematico, dirigido pelos tokens
  do tema ativo (var(--color-*)). Trocar de tema recolore o parallax de graca.

  ESCOLHA: CANVAS 2D (um unico <canvas> fixed inset-0), nao N divs.
  Motivo: cada tema renderiza dezenas de particulas em 3 camadas de profundidade.
  Fazer isso com divs animadas via rAF custaria layout/composite por particula e
  poluiria o DOM. Um canvas desenha quadradinhos com fillRect num unico no, com um
  unico rAF, e combina com o image-rendering: pixelated do projeto
  (imageSmoothingEnabled = false -> pixels duros, cara de Minecraft).

  Movimento: cada particula desloca = (mouse normalizado * profundidade) + drift
  senoidal lento no tempo. O pointermove e throttled por um flag de rAF.

  Acessibilidade: prefers-reduced-motion OU toggle desligado => ZERO movimento.
  Nesses casos nao registramos pointermove nem iniciamos o rAF; desenhamos um
  unico frame estatico bem discreto (particulas paradas, opacidade baixa).

  Performance: so canvas (1 layer), rAF pausado em document.hidden, throttle no
  ponteiro, e onDestroy limpa tudo (rAF + todos os listeners).
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getTheme, type Theme } from '$lib/theme';
  import { getMotion } from '$lib/fx';

  const theme = $derived(getTheme());
  const motionEnabled = $derived(getMotion());

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  type Behavior = 'fall' | 'rise' | 'twinkle' | 'float' | 'breathe' | 'spark';

  // depth: 0..1 (perto = reage mais ao mouse e move mais rapido)
  type Layer = {
    count: number;
    depth: number;
    color: 'primary' | 'accent' | 'grass';
    behavior: Behavior;
    size: [number, number];
    speed: number;
    opacity: number;
  };

  type Style = { layers: Layer[] };

  // Mapa tema -> estilo. Cores SEMPRE por token; nada de hex.
  // grass: folhas/poeira verdes caindo devagar.
  // nether: brasas laranja/vermelho subindo.
  // end: estrelas roxo/branco cintilando (quase paradas).
  // diamond: brilhos ciano flutuando.
  // gold: particulas douradas flutuando pra cima.
  // deep-dark: pulsos sculk "respirando" devagar (poucos, grandes).
  // redstone: faiscas vermelhas rapidas e curtas caindo.
  // ocean: bolhas azuis subindo devagar (flutuacao neutra).
  const STYLES: Record<Theme, Style> = {
    grass: {
      layers: [
        { count: 14, depth: 0.25, color: 'grass', behavior: 'fall', size: [2, 3], speed: 0.18, opacity: 0.28 },
        { count: 18, depth: 0.55, color: 'primary', behavior: 'fall', size: [3, 4], speed: 0.3, opacity: 0.4 },
        { count: 10, depth: 0.9, color: 'accent', behavior: 'fall', size: [3, 5], speed: 0.5, opacity: 0.22 }
      ]
    },
    nether: {
      layers: [
        { count: 16, depth: 0.25, color: 'primary', behavior: 'rise', size: [2, 3], speed: 0.22, opacity: 0.35 },
        { count: 20, depth: 0.55, color: 'accent', behavior: 'rise', size: [2, 4], speed: 0.4, opacity: 0.5 },
        { count: 10, depth: 0.95, color: 'accent', behavior: 'rise', size: [3, 5], speed: 0.65, opacity: 0.3 }
      ]
    },
    end: {
      layers: [
        { count: 26, depth: 0.15, color: 'accent', behavior: 'twinkle', size: [2, 2], speed: 0.6, opacity: 0.5 },
        { count: 18, depth: 0.4, color: 'primary', behavior: 'twinkle', size: [2, 3], speed: 0.9, opacity: 0.45 },
        { count: 10, depth: 0.75, color: 'accent', behavior: 'twinkle', size: [3, 4], speed: 1.3, opacity: 0.35 }
      ]
    },
    diamond: {
      layers: [
        { count: 14, depth: 0.25, color: 'primary', behavior: 'float', size: [2, 3], speed: 0.25, opacity: 0.32 },
        { count: 16, depth: 0.55, color: 'accent', behavior: 'float', size: [3, 4], speed: 0.4, opacity: 0.45 },
        { count: 8, depth: 0.9, color: 'accent', behavior: 'twinkle', size: [3, 5], speed: 1.1, opacity: 0.3 }
      ]
    },
    gold: {
      layers: [
        { count: 14, depth: 0.25, color: 'primary', behavior: 'float', size: [2, 3], speed: 0.2, opacity: 0.32 },
        { count: 16, depth: 0.55, color: 'accent', behavior: 'rise', size: [3, 4], speed: 0.32, opacity: 0.45 },
        { count: 8, depth: 0.9, color: 'accent', behavior: 'float', size: [3, 5], speed: 0.5, opacity: 0.3 }
      ]
    },
    'deep-dark': {
      layers: [
        { count: 7, depth: 0.2, color: 'primary', behavior: 'breathe', size: [5, 8], speed: 0.12, opacity: 0.22 },
        { count: 9, depth: 0.5, color: 'accent', behavior: 'breathe', size: [6, 10], speed: 0.18, opacity: 0.3 },
        { count: 5, depth: 0.85, color: 'accent', behavior: 'breathe', size: [8, 12], speed: 0.24, opacity: 0.2 }
      ]
    },
    redstone: {
      layers: [
        { count: 18, depth: 0.3, color: 'primary', behavior: 'spark', size: [2, 2], speed: 0.7, opacity: 0.4 },
        { count: 22, depth: 0.6, color: 'accent', behavior: 'spark', size: [2, 3], speed: 1.0, opacity: 0.5 },
        { count: 10, depth: 0.95, color: 'primary', behavior: 'spark', size: [3, 4], speed: 1.4, opacity: 0.3 }
      ]
    },
    ocean: {
      layers: [
        { count: 14, depth: 0.25, color: 'primary', behavior: 'rise', size: [2, 4], speed: 0.16, opacity: 0.3 },
        { count: 18, depth: 0.55, color: 'accent', behavior: 'rise', size: [3, 5], speed: 0.26, opacity: 0.42 },
        { count: 8, depth: 0.9, color: 'accent', behavior: 'float', size: [4, 6], speed: 0.4, opacity: 0.28 }
      ]
    }
  };

  type Particle = {
    x: number;
    y: number;
    size: number;
    seed: number;
    speed: number;
    layer: number;
  };

  let particles: Particle[] = [];
  let resolvedColors: string[] = []; // hex por camada (lido dos tokens do tema)
  let layerMeta: Layer[] = [];

  let raf = 0;
  let pointerQueued = false;
  let targetMX = 0; // -1..1
  let targetMY = 0;
  let mx = 0; // suavizado
  let my = 0;

  let width = 0;
  let height = 0;
  let dpr = 1;

  let reduceMotion = false;
  let mql: MediaQueryList | null = null;

  // active = motion ligado E sem prefers-reduced-motion. So entao ha listeners/rAF.
  const active = $derived(motionEnabled && !reduceMotion);

  function readColor(name: 'primary' | 'accent' | 'grass'): string {
    if (typeof window === 'undefined') return '#ffffff';
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(`--color-${name}`)
      .trim();
    return v || '#ffffff';
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }
  }

  function build(t: Theme) {
    const style = STYLES[t] ?? STYLES.grass;
    layerMeta = style.layers;
    resolvedColors = style.layers.map((l) => readColor(l.color));
    particles = [];
    style.layers.forEach((layer, li) => {
      for (let i = 0; i < layer.count; i++) {
        const [a, b] = layer.size;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.round(a + Math.random() * (b - a)),
          seed: Math.random() * Math.PI * 2,
          speed: layer.speed * (0.7 + Math.random() * 0.6),
          layer: li
        });
      }
    });
  }

  function hexToRgb(hex: string): [number, number, number] {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return [255, 255, 255];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function draw(time: number) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const t = time / 1000;

    // suaviza o seguimento do mouse (evita tranco)
    mx += (targetMX - mx) * 0.06;
    my += (targetMY - my) * 0.06;

    for (const p of particles) {
      const layer = layerMeta[p.layer];
      const [r, g, b] = hexToRgb(resolvedColors[p.layer] ?? '#ffffff');

      const driftX = Math.sin(t * p.speed + p.seed) * 12 * layer.depth;
      const driftY = Math.cos(t * p.speed * 0.8 + p.seed) * 8 * layer.depth;

      const parX = mx * 28 * layer.depth;
      const parY = my * 20 * layer.depth;

      let bx = p.x;
      let by = p.y;
      let alpha = layer.opacity;

      switch (layer.behavior) {
        case 'fall':
          by = (p.y + t * layer.speed * 22) % (height + 16) - 8;
          break;
        case 'rise':
          by = (p.y - t * layer.speed * 22) % (height + 16);
          if (by < -8) by += height + 16;
          break;
        case 'spark':
          by = (p.y + t * layer.speed * 60) % (height + 16) - 8;
          alpha = layer.opacity * (0.4 + 0.6 * Math.abs(Math.sin(t * 3 + p.seed)));
          break;
        case 'twinkle':
          alpha = layer.opacity * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * p.speed + p.seed)));
          break;
        case 'breathe': {
          const k = 0.5 + 0.5 * Math.sin(t * p.speed + p.seed);
          alpha = layer.opacity * (0.35 + 0.65 * k);
          break;
        }
        case 'float':
        default:
          break;
      }

      const x = Math.round(bx + driftX + parX);
      const y = Math.round(by + driftY + parY);
      let size = p.size;
      if (layer.behavior === 'breathe') {
        const k = 0.5 + 0.5 * Math.sin(t * p.speed + p.seed);
        size = Math.max(2, Math.round(p.size * (0.7 + 0.5 * k)));
      }

      ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
      ctx.fillRect(x, y, size, size);
    }
  }

  function loop(time: number) {
    draw(time);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    stop();
    if (active && !document.hidden) {
      raf = requestAnimationFrame(loop);
    } else {
      // frame estatico discreto (sem rAF): particulas paradas
      draw(0);
    }
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function onPointer(e: PointerEvent) {
    if (!active) return;
    targetMX = (e.clientX / window.innerWidth) * 2 - 1;
    targetMY = (e.clientY / window.innerHeight) * 2 - 1;
    if (pointerQueued) return;
    pointerQueued = true;
    requestAnimationFrame(() => {
      pointerQueued = false;
    });
  }

  function onVisibility() {
    if (document.hidden) stop();
    else start();
  }

  function onReduceChange(e: MediaQueryListEvent) {
    reduceMotion = e.matches;
    refresh();
  }

  function refresh() {
    if (typeof window === 'undefined') return;
    resize();
    build(theme);
    if (!active) {
      // reduced-motion / desligado: zera deslocamento do mouse e desenha 1 frame
      targetMX = targetMY = mx = my = 0;
    }
    start();
  }

  onMount(() => {
    mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceMotion = mql.matches;
    mql.addEventListener('change', onReduceChange);
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    refresh();
  });

  // Reage a troca de tema E do toggle (recolore + religa/desliga o loop).
  $effect(() => {
    // toca theme/active pra o effect re-rodar quando mudarem
    void theme;
    void active;
    refresh();
  });

  onDestroy(() => {
    stop();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      mql?.removeEventListener('change', onReduceChange);
    }
  });
</script>

<canvas bind:this={canvas} class="parallax-bg" aria-hidden="true"></canvas>

<style>
  .parallax-bg {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    image-rendering: pixelated;
  }
</style>
