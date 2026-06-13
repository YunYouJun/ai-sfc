<script lang="ts" setup>
import type { SprintFestivalCouplets } from '~~/packages/ai/src'
import { useClipboard } from '@vueuse/core'
import { downloadDataUrlAsImage } from '@yunlefun/utils'
import { copyBlobToClipboard } from 'copy-image-clipboard'
import { toBlob, toPng } from 'html-to-image'
import { SwitchRoot, SwitchThumb } from 'radix-vue'
import pkg from '~~/package.json'
import { suggestedCoupletsFilename } from '~/config'

defineProps<{
  coupletsData: SprintFestivalCouplets
}>()

const app = useAppStore()
const sfcContainer = useTemplateRef<HTMLElement>('sfcContainer')

/**
 * Download image
 */
async function download() {
  if (!sfcContainer.value)
    return

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

/**
 * 复制春联文字
 */
async function copyText() {
  const { 上联 } = app.coupletsData

  const minWidth = app.coupletsData['横批'].length + 3 * 2
  const fuLines = [
    '口',
    '口　口',
    // eslint-disable-next-line no-irregular-whitespace, vue/no-irregular-whitespace
    `口　${app.coupletsData['总结']}　口`,
    '口　口',
    '口',
  ]

  function getFuChar(row: number) {
    const fuLine = fuLines[row] || '　'
    // eslint-disable-next-line no-irregular-whitespace, vue/no-irregular-whitespace
    // "　" 全角空格 U+3000
    const halfWidth = Math.max(0, Math.floor((minWidth - fuLine.length) / 2))
    return '　'.repeat(halfWidth) + fuLine + '　'.repeat(halfWidth)
  }

  const lines = []
  const halfWidth = Math.max(0, Math.floor((minWidth - app.coupletsData['横批'].length) / 2 + 1))
  const halfSpace = '　'.repeat(halfWidth)
  lines.push(`${halfSpace}${app.coupletsData['横批']}${halfSpace}`)
  lines.push('')

  const fuStartLine = Math.floor(上联.length <= 5 ? 0 : (上联.length - 5) / 2)
  const cLen = Math.max(app.coupletsData['上联'].length, app.coupletsData['下联'].length)

  for (let i = 0; i < cLen; i++) {
    const left = app.coupletsData['上联'][i] || '　'
    const right = app.coupletsData['下联'][i] || '　'
    lines.push(`${left} ${getFuChar(i - fuStartLine)} ${right}`)
  }

  lines.push('')
  lines.push(`春联生成自：${pkg.homepage}`)

  const txt = lines.join('\n')
  await copy(txt)

  if (copied.value) {
    // eslint-disable-next-line no-alert
    alert(txt)
  }
}
</script>

<template>
  <div class="couplet-workspace">
    <div
      id="spring-festival-container"
      ref="sfcContainer"
      class="font-zmx spring-festival-container"
    >
      <div
        class="spring-festival-plaque"
        :class="{
          rtl: !app.options.inverseCouplets,
        }"
      >
        <Transition name="fade" mode="out-in">
          <span v-if="app.visible">{{ coupletsData['横批'] }}</span>
        </Transition>
      </div>

      <div
        class="spring-festival-row"
        :class="{
          'is-reversed': !app.options.inverseCouplets,
        }"
      >
        <div class="spring-festival-couplet">
          <Transition name="fade" mode="out-in">
            <span v-if="app.visible">{{ coupletsData['上联'] }}</span>
          </Transition>
        </div>

        <div
          class="spring-festival-fu-container"
          :class="{
            'rotate-180': app.options.inverseFu,
          }"
        >
          <div class="spring-festival-fu" />
          <span class="fu-char">
            <Transition name="fade" mode="out-in">
              <span v-if="app.visible && coupletsData['总结']">{{ coupletsData['总结'].slice(0, 1) }}</span>
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

    <div class="switch-grid">
      <label class="switch-row" for="inverse-fu">
        <span>倒转福字</span>
        <SwitchRoot
          id="inverse-fu"
          v-model:checked="app.options.inverseFu"
          class="switch-root"
        >
          <SwitchThumb class="switch-thumb" />
        </SwitchRoot>
      </label>

      <label class="switch-row" for="inverse-couplets">
        <span>翻转春联</span>
        <SwitchRoot
          id="inverse-couplets"
          v-model:checked="app.options.inverseCouplets"
          class="switch-root"
        >
          <SwitchThumb class="switch-thumb" />
        </SwitchRoot>
      </label>
    </div>

    <div class="action-grid">
      <SfcButton icon="i-ri-download-line" @click="download">
        下载图片
      </SfcButton>
      <SfcButton icon="i-ri-clipboard-line" @click="copyImg">
        拷贝图片
      </SfcButton>
      <SfcButton icon="i-ri-link" @click="shareLink">
        分享链接
      </SfcButton>
      <SfcButton icon="i-ri-file-copy-line" @click="copyText">
        复制春联
      </SfcButton>
    </div>
  </div>
</template>

<style scoped>
.couplet-workspace {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.spring-festival-container {
  --ac-fu-font-size: 5rem;
  --ac-couplet-width: 4.6rem;
  --ac-paper: #f8d88f;

  width: min(100%, 35rem);
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  align-items: center;
  margin: 0 auto;
  padding: 1.1rem;
  border: 1px solid rgba(126, 36, 23, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(126, 36, 23, 0.07) 1px, transparent 1px),
    linear-gradient(180deg, rgba(126, 36, 23, 0.07) 1px, transparent 1px), var(--ac-paper);
  background-size:
    18px 18px,
    18px 18px,
    auto;
  box-shadow: inset 0 0 0 4px rgba(255, 255, 255, 0.16);
}

.rtl {
  direction: rtl;
  unicode-bidi: bidi-override;
}

.spring-festival-plaque {
  width: min(15rem, 100%);
  min-height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.75rem;
  border: 1px solid rgba(255, 225, 143, 0.5);
  border-radius: 6px;
  background: #c61919;
  color: #111;
  font-size: 2.5rem;
  line-height: 1.1;
  letter-spacing: 0;
  text-align: center;
}

.spring-festival-row {
  display: grid;
  grid-template-columns: var(--ac-couplet-width) minmax(6rem, 8rem) var(--ac-couplet-width);
  gap: 2.1rem;
  align-items: center;
  justify-content: center;
}

.spring-festival-row.is-reversed {
  direction: rtl;
}

.spring-festival-row.is-reversed > * {
  direction: ltr;
}

.spring-festival-fu-container {
  position: relative;
  width: var(--ac-fu-font-size);
  height: var(--ac-fu-font-size);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111;
  font-size: calc(var(--ac-fu-font-size) - 0.6rem);
  transition: transform 0.32s ease;
}

.spring-festival-fu {
  position: absolute;
  inset: 0;
  transform: rotate(45deg) scale(0.82);
  border: 1px solid rgba(255, 225, 143, 0.5);
  background: #c61919;
}

.fu-char {
  position: relative;
  z-index: 1;
  line-height: 1;
}

.spring-festival-couplet {
  min-width: var(--ac-couplet-width);
  min-height: 19rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.2rem 0.45rem;
  border: 1px solid rgba(255, 225, 143, 0.5);
  border-radius: 6px;
  background: #c61919;
  color: #111;
  font-size: 2.45rem;
  line-height: 1.42;
  letter-spacing: 0;
  text-align: center;
  text-orientation: upright;
  white-space: normal;
  writing-mode: vertical-lr;
}

.switch-grid,
.action-grid {
  display: grid;
  gap: 0.65rem;
}

.switch-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.switch-row {
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid rgba(126, 36, 23, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  color: #35140f;
  font-weight: 800;
}

.switch-root {
  position: relative;
  width: 2.75rem;
  height: 1.45rem;
  flex: 0 0 auto;
  border-radius: 999px;
  background: rgba(179, 38, 30, 0.86);
  box-shadow: inset 0 0 0 1px rgba(126, 36, 23, 0.14);
}

.switch-root[data-state='checked'] {
  background: #0f6b56;
}

.switch-thumb {
  display: block;
  width: 1.1rem;
  height: 1.1rem;
  margin: 0.175rem;
  border-radius: 999px;
  background: #fff7df;
  box-shadow: 0 2px 8px rgba(53, 20, 15, 0.26);
  transition: transform 0.16s ease;
  will-change: transform;
}

.switch-thumb[data-state='checked'] {
  transform: translateX(1.3rem);
}

.action-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.dark .spring-festival-container {
  --ac-paper: #2a1a18;
  border-color: rgba(255, 219, 142, 0.16);
  background:
    linear-gradient(90deg, rgba(255, 219, 142, 0.05) 1px, transparent 1px),
    linear-gradient(180deg, rgba(255, 219, 142, 0.05) 1px, transparent 1px), var(--ac-paper);
}

.dark .switch-row {
  border-color: rgba(255, 219, 142, 0.13);
  background: rgba(25, 17, 18, 0.52);
  color: #fff3d8;
}

@media (max-width: 640px) {
  .spring-festival-container {
    --ac-fu-font-size: 4rem;
    --ac-couplet-width: 3.7rem;

    padding: 0.85rem;
  }

  .spring-festival-plaque {
    min-height: 3.3rem;
    font-size: 2rem;
  }

  .spring-festival-row {
    gap: 0.85rem;
    grid-template-columns: var(--ac-couplet-width) minmax(4.6rem, 6rem) var(--ac-couplet-width);
  }

  .spring-festival-couplet {
    min-height: 16rem;
    font-size: 2rem;
    line-height: 1.36;
  }

  .switch-grid,
  .action-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
