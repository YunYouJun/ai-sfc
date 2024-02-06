<script lang="ts" setup>
import { toBlob, toPng } from 'html-to-image'
import { downloadDataUrlAsImage } from '@yunlefun/utils'
import { SwitchRoot, SwitchThumb } from 'radix-vue'
import { copyBlobToClipboard } from 'copy-image-clipboard'
import { useClipboard } from '@vueuse/core'
import { suggestedCoupletsFilename } from '~/config'
import type { SprintFestivalCouplets } from '~/packages/ai/src'

defineProps<{
  coupletsData: SprintFestivalCouplets
}>()

const app = useAppStore()

const sfcContainer = ref<HTMLElement | null>(null)

/**
 * Download image
 */
async function download() {
  if (!sfcContainer.value)
    return
  // const url = await screenShotToBase64(container)

  const url = await toPng(sfcContainer.value, {
    includeQueryParams: true,
  })

  if (url)
    downloadDataUrlAsImage(url, suggestedCoupletsFilename)
}

/**
 * Copy image to clipboard
 */
async function copyImg() {
  if (!sfcContainer.value)
    return
  // const url = await screenShotToBase64(container)

  const blob = await toBlob(sfcContainer.value, {
    includeQueryParams: true,
  })

  if (blob)
    copyBlobToClipboard(blob)
}

const { copy, copied } = useClipboard()
async function shareLink() {
  const txt = `${window.location.origin}/?couplets=${encodeURIComponent(JSON.stringify(app.coupletsData))}&prompt=${encodeURIComponent(app.prompt)}`
  await copy(txt)

  if (copied.value) {
    // eslint-disable-next-line no-alert
    alert('已复制链接')
  }
}
</script>

<template>
  <div
    id="spring-festival-container" ref="sfcContainer" flex="col"
    class="font-zmx spring-festival-container"
  >
    <div
      class="font-zmx m-auto bg-#ff0000 p-2" w="50" text="4xl black"
      :class="{
        rtl: !app.options.inverseCouplets,
      }"
    >
      <Transition name="fade" mode="out-in">
        <span v-if="app.visible">{{ coupletsData['横批'] }}</span>
      </Transition>
    </div>
    <div
      flex
      class="mt-4 items-center justify-between"
      :class="{
        'flex-row-reverse': !app.options.inverseCouplets,
      }"
    >
      <div class="spring-festival-couplet">
        <Transition name="fade" mode="out-in">
          <span v-if="app.visible">{{ coupletsData['上联'] }}</span>
        </Transition>
      </div>

      <div
        relative class="spring-festival-fu-container transition duration-400"
        :class="{
          'rotate-180': app.options.inverseFu,
        }"
      >
        <div class="spring-festival-fu" />
        <!-- not inset-0 for compatibility -->
        <span class="fu-char absolute bottom-0 left-0 right-0 top-0">
          <Transition name="fade" mode="out-in">
            <span v-if="app.visible">{{ coupletsData['总结'].slice(0, 1) }}</span>
          </Transition>
        </span>
      </div>

      <div class="spring-festival-couplet">
        <Transition name="fade" mode="out-in">
          <span v-if="app.visible">{{ coupletsData['下联'] }}</span>
        </Transition>
      </div>
    </div>
  </div>

  <div class="font-zmx flex items-center justify-center gap-2" text="2xl" m="4">
    <label class="select-none pr-[15px] leading-none" for="airplane-mode">
      倒转福字
    </label>
    <SwitchRoot
      id="airplane-mode"
      v-model:checked="app.options.inverseFu"
      class="relative h-[25px] w-[42px] flex cursor-default rounded-full bg-red-500 shadow-sm data-[state=checked]:bg-yellow-500 focus-within:outline-yellow focus-within:outline"
    >
      <SwitchThumb
        class="my-auto block h-[21px] w-[21px] translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[19px]"
      />
    </SwitchRoot>
  </div>

  <div class="font-zmx flex items-center justify-center gap-2" text="2xl" m="4">
    <label class="select-none pr-[15px] leading-none" for="airplane-mode">
      翻转春联
    </label>
    <SwitchRoot
      id="airplane-mode"
      v-model:checked="app.options.inverseCouplets"
      class="relative h-[25px] w-[42px] flex cursor-default rounded-full bg-red-500 shadow-sm data-[state=checked]:bg-yellow-500 focus-within:outline-yellow focus-within:outline"
    >
      <SwitchThumb
        class="my-auto block h-[21px] w-[21px] translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[19px]"
      />
    </SwitchRoot>
  </div>

  <div class="font-zmx mt-4 flex" text="black" gap="2">
    <SfcButton icon="i-ri-download-line" @click="download">
      下载图片
    </SfcButton>
    <SfcButton icon="i-ri-clipboard-line" @click="copyImg">
      拷贝图片
    </SfcButton>
  </div>

  <div class="font-zmx mt-2 flex" text="black" gap="2">
    <SfcButton icon="i-ri-link" @click="shareLink">
      分享春联链接
    </SfcButton>
  </div>
</template>

<style lang="scss">
:root {
  --ac-fu-font-size: 5rem;
}

.rtl {
  direction: rtl;
  unicode-bidi: bidi-override;
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

    .fu-char {
      margin-top: -1rem;
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
  white-space: nowrap;
}
</style>
