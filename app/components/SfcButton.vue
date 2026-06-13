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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.5rem 0.65rem;
  border: 1px solid rgba(126, 36, 23, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.68);
  color: #35140f;
  font-weight: 900;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease;
}

.sfc-button:hover {
  transform: translateY(-1px);
  border-color: rgba(179, 38, 30, 0.3);
  background: rgba(255, 255, 255, 0.88);
}

.sfc-button > span:first-child {
  width: 1.05rem;
  height: 1.05rem;
  flex: 0 0 auto;
  color: #b3261e;
}

.sfc-button-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .sfc-button {
  border-color: rgba(255, 219, 142, 0.14);
  background: rgba(25, 17, 18, 0.62);
  color: #fff3d8;
}

.dark .sfc-button:hover {
  border-color: rgba(255, 219, 142, 0.32);
  background: rgba(52, 30, 27, 0.8);
}

.dark .sfc-button > span:first-child {
  color: #ffcf72;
}
</style>
