<script lang="ts" setup>
const app = useAppStore()
</script>

<template>
  <div class="flex flex-col gap-4">
    <textarea
      v-model="app.prompt"
      placeholder="想要什么样的春联？"
      class="w-full rounded-lg p-4 shadow dark:bg-dark-800 outline-none!"
      border="~ gray focus:(blue-500)"
      maxlength="200"
    />

    <button class="font-zmx w-full btn" text="black 2xl">
      生成！
    </button>
  </div>
</template>
