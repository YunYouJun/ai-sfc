<script lang="ts" setup>
import pkg from '~/package.json'
</script>

<template>
  <div text="center sm" my-3>
    <CurrentVersion />
    <div flex="~" items-center justify-center gap="2">
      <a
        :href="pkg.repository.url" target="_blank"
        class="inline-flex items-center justify-center"
      >
        <div i-ri-github-line mr-1 />
        <span>Code</span>
      </a>
      by
      <a
        href="https://space.bilibili.com/1579790" target="_blank"
        class="inline-flex items-center justify-center"
      >
        <div i-ri-bilibili-line mr-1 class="text-pink-400" />
        <span>云游君</span>
      </a>
    </div>
  </div>
</template>
