<script lang="ts" setup>
defineProps<{
  icon: string
}>()
</script>

<template>
  <button type="button" class="sfc-button">
    <span :class="icon" />
    <span class="sfc-button-label">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.sfc-button {
  min-height: 2.65rem;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--sfc-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--sfc-control) 82%, transparent);
  color: var(--sfc-ink);
  font-family: inherit;
  font-size: 1.08rem;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease;
}

.sfc-button:hover {
  transform: translateY(-1px);
  border-color: rgba(179, 38, 30, 0.3);
  background: color-mix(in srgb, var(--sfc-control) 96%, transparent);
}

.sfc-button > span:first-child {
  width: 1.05rem;
  height: 1.05rem;
  flex: 0 0 auto;
  color: var(--sfc-cinnabar);
}

.sfc-button-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .sfc-button {
  border-color: var(--sfc-border);
  background: color-mix(in srgb, var(--sfc-control) 72%, transparent);
  color: var(--sfc-ink);
}

.dark .sfc-button:hover {
  border-color: rgba(255, 219, 142, 0.32);
  background: rgba(52, 30, 27, 0.8);
}

.dark .sfc-button > span:first-child {
  color: var(--sfc-gold);
}
</style>
