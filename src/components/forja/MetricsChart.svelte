<script lang="ts">
  interface Point {
    ts: number;
    value: number | null;
  }

  let {
    points,
    label,
    color = '#5ba34d',
    yMax,
    unit = '',
    height = 80
  }: {
    points: Point[];
    label: string;
    color?: string;
    yMax?: number;
    unit?: string;
    height?: number;
  } = $props();

  const W = 600;
  const PAD_X = 4;
  const PAD_Y = 8;

  const validPoints = $derived(points.filter((p): p is { ts: number; value: number } => p.value !== null));

  const maxY = $derived(
    yMax ?? Math.max(1, ...validPoints.map((p) => p.value)) * 1.1
  );

  const minTs = $derived(validPoints[0]?.ts ?? Date.now());
  const maxTs = $derived(validPoints[validPoints.length - 1]?.ts ?? Date.now());
  const tsRange = $derived(Math.max(1, maxTs - minTs));

  function x(ts: number): number {
    return PAD_X + ((ts - minTs) / tsRange) * (W - PAD_X * 2);
  }
  function y(v: number): number {
    return height - PAD_Y - (v / maxY) * (height - PAD_Y * 2);
  }

  const pathD = $derived(
    validPoints.length === 0
      ? ''
      : validPoints
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.ts).toFixed(1)} ${y(p.value).toFixed(1)}`)
          .join(' ')
  );

  const areaD = $derived(
    validPoints.length === 0
      ? ''
      : `${pathD} L ${x(maxTs).toFixed(1)} ${height - PAD_Y} L ${x(minTs).toFixed(1)} ${height - PAD_Y} Z`
  );

  const latest = $derived(
    validPoints.length > 0 ? validPoints[validPoints.length - 1].value : null
  );
</script>

<div class="mc-card" style="padding: 12px;">
  <div class="flex items-baseline justify-between mb-2">
    <p class="text-xs text-white/60" style="text-shadow: 2px 2px 0 #3f3f3f;">{label}</p>
    <p class="text-sm" style="color: {color}; text-shadow: 2px 2px 0 #3f3f3f;">
      {latest !== null ? `${latest}${unit}` : '—'}
    </p>
  </div>

  {#if validPoints.length === 0}
    <div class="text-center py-6 text-xs text-white/40" style="text-shadow: 2px 2px 0 #3f3f3f;">
      sem dados
    </div>
  {:else}
    <svg
      viewBox="0 0 {W} {height}"
      width="100%"
      {height}
      preserveAspectRatio="none"
      style="image-rendering: auto;"
    >
      <line x1={PAD_X} y1={height - PAD_Y} x2={W - PAD_X} y2={height - PAD_Y} stroke="#000" stroke-width="1" />
      <path d={areaD} fill={color} fill-opacity="0.15" />
      <path d={pathD} fill="none" stroke={color} stroke-width="2" stroke-linejoin="miter" />
    </svg>
  {/if}
</div>
