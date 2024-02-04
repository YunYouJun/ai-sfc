<script lang="ts" setup>
import { toPng } from 'html-to-image'
import { downloadDataUrlAsImage } from '@yunlefun/utils'
import { suggestedCoupletsFilename } from '~/config'

async function download() {
  const container = document.getElementById('spring-festival-container')
  if (!container)
    return
  // const url = await screenShotToBase64(container)

  const url = await toPng(container, {
    includeQueryParams: true,
  })

  if (url)
    downloadDataUrlAsImage(url, suggestedCoupletsFilename)
}
</script>

<template>
  <div id="spring-festival-container" flex="col" class="font-zmx spring-festival-container">
    <div class="font-zmx m-auto bg-#ff0000 p-2" w="50" text="4xl black">
      早上好
    </div>
    <div flex class="mt-4 items-center justify-between">
      <div class="spring-festival-couplet">
        春眠不觉晓
      </div>

      <div relative class="spring-festival-fu-container">
        <div class="spring-festival-fu" />
        <!-- not inset-0 for compatibility -->
        <span class="fu-char absolute bottom-0 left-0 right-0 top-0">
          福
        </span>
      </div>

      <div class="spring-festival-couplet">
        处处闻啼鸟
      </div>
    </div>
  </div>

  <div class="font-zmx mt-4 flex" text="black" gap="2">
    <button class="w-full btn" text="black" @click="download">
      下载图片
    </button>
    <button class="w-full btn" text="black" @click="download">
      拷贝图片
    </button>
  </div>
</template>

<style lang="scss">
:root {
  --ac-fu-font-size: 5rem;
}

.spring-festival-fu {
  // square
  width: var(--ac-fu-font-size);
  height: var(--ac-fu-font-size);

  transform: rotate(45deg);

  color: black;
  background-color: red;

  &-container {
    font-size: calc(var(--ac-fu-font-size) - 0.5rem);
    color: black;

    transform: rotate(180deg);

    .fu-char {
      margin-top: -0.8rem;
    }
  }
}

.spring-festival-couplet {
  font-size: 2.5rem;

  color: black;
  background-color: red;

  writing-mode: vertical-lr;

  padding: 1.5rem 0.4rem 1.4rem 0.4rem;
  // 文字 gap
  letter-spacing: 1rem;
}
</style>
