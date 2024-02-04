<script lang="ts" setup>
import consola from 'consola'

const app = useAppStore()

/**
 * generate sfc 春联
 */
async function generate() {
  app.loading = true
  const data = await $fetch('/api/generate', {
    query: {
      prompt: app.prompt,
    },
  })
  consola.info(data)
  app.setCoupletsData(data)
  app.loading = false
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <textarea
      v-model="app.prompt"
      placeholder="想要什么样的春联？"
      class="w-full rounded-lg p-4 shadow dark:bg-dark-800 outline-none!"
      border="~ gray focus:(yellow-500)"
      maxlength="200"
    />

    <button
      class="font-zmx w-full btn" text="black 2xl"
      :class="{ 'btn-disabled': app.loading }"
      flex items-center justify-center
      :disabled="app.loading"
      @click="generate"
    >
      {{ app.loading ? '生成中...' : '生成春联' }}
      <div v-if="app.loading" class="i-svg-spinners:pulse ml-2" />
    </button>
  </div>
</template>
