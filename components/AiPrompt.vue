<script lang="ts" setup>
import { useMagicKeys } from '@vueuse/core'
import { config } from '~/config'
import { apiGenerate } from '~/utils'

const app = useAppStore()

/**
 * generate sfc 春联
 * not use ofetch see https://github.com/unjs/ofetch/issues/294
 */
async function generate() {
  if (app.loading)
    return

  app.loading = true
  const data = await apiGenerate({
    prompt: app.prompt,
  })
  app.setCoupletsData(data)

  app.loading = false
}

// Ctrl + Enter / Cmd + Enter to generate
const { Ctrl_enter, Cmd_enter } = useMagicKeys()
watch(() => [Cmd_enter.value, Ctrl_enter.value], (v) => {
  if (v)
    generate()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <textarea
      v-model="app.prompt"
      placeholder="想要什么样的春联？"
      class="w-full rounded-lg p-4 shadow dark:bg-dark-800 outline-none!"
      border="~ gray focus:(yellow-500)"
      :maxlength="config.inputMaxLength"
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
