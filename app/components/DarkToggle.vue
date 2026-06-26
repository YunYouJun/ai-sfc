<script setup lang="ts">
const color = useColorMode()

useHead({
  meta: [{
    id: 'theme-color',
    name: 'theme-color',
    content: () => color.value === 'dark' ? '#160e0f' : '#fff8ec',
  }],
})

const toggleLabel = computed(() => color.value === 'dark' ? '切换浅色模式' : '切换深色模式')

function toggleDark() {
  color.preference = color.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <button class="theme-toggle" type="button" :aria-label="toggleLabel" :title="toggleLabel" @click="toggleDark">
    <span class="i-carbon-sun dark:i-carbon-moon" />
  </button>
</template>

<style scoped>
.theme-toggle {
  width: var(--sfc-ctrl-size);
  height: var(--sfc-ctrl-size);
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sfc-border-strong);
  border-radius: 999px;
  background: var(--sfc-control);
  color: var(--sfc-ink);
  box-shadow: var(--sfc-control-shadow);
  backdrop-filter: blur(14px);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.theme-toggle:hover {
  transform: translateY(-1px);
  border-color: rgba(184, 44, 29, 0.34);
  box-shadow: 0 16px 36px rgba(97, 29, 18, 0.14);
}

.theme-toggle span {
  width: 1.15rem;
  height: 1.15rem;
}

.dark .theme-toggle {
  border-color: var(--sfc-border-strong);
  background: var(--sfc-control);
  color: var(--sfc-gold-soft);
  box-shadow: var(--sfc-control-shadow);
}
</style>
