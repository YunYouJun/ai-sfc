<script setup lang="ts">
const color = useColorMode()

useHead({
  meta: [{
    id: 'theme-color',
    name: 'theme-color',
    content: () => color.value === 'dark' ? '#170f12' : '#fff8ec',
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
  width: 2.5rem;
  height: 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(126, 36, 23, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: #3b1711;
  box-shadow: 0 12px 32px rgba(97, 29, 18, 0.1);
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
  border-color: rgba(255, 219, 142, 0.16);
  background: rgba(48, 24, 22, 0.76);
  color: #fff4d6;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.26);
}
</style>
