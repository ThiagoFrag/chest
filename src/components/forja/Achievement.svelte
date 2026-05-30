<script lang="ts">
  import MCTexture from '$components/mc-icons/MCTexture.svelte';
  import { t } from '$lib/i18n';
  let {
    title = t('integrations.achievement.defaultTitle'),
    desc = '',
    icon = '/textures/item/diamond.png',
    duration = 4000,
    onclose
  }: { title?: string; desc?: string; icon?: string; duration?: number; onclose?: () => void } = $props();

  $effect(() => {
    const t = setTimeout(() => onclose?.(), duration);
    return () => clearTimeout(t);
  });
</script>

<div class="mc-achievement">
  <MCTexture src={icon} size={32} alt="" />
  <div>
    <div class="title">{title}</div>
    {#if desc}<div class="desc">{desc}</div>{/if}
  </div>
</div>
