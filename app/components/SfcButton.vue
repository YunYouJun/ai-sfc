<script lang="ts" setup>
defineProps<{
  icon: string
}>()
</script>

<template>
  <button flex items-center justify-center class="w-full btn" text="black">
    <div :class="icon" mr-1 />
    <slot />
  </button>
</template>
