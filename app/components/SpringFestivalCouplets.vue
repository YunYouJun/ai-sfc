<script lang="ts" setup>
import type { SprintFestivalCouplets } from '~~/packages/ai/src'
import type { CoupletToneAnalysis } from '~~/packages/ai/src/tones'
import { useClipboard } from '@vueuse/core'
import { downloadDataUrlAsImage } from '@yunlefun/utils'
import { copyBlobToClipboard } from 'copy-image-clipboard'
import { toBlob, toPng } from 'html-to-image'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import pkg from '~~/package.json'
import { suggestedCoupletsFilename } from '~/config'

const props = defineProps<{
  coupletsData: SprintFestivalCouplets
}>()

const app = useAppStore()
const sfcContainer = useTemplateRef<HTMLElement>('sfcContainer')

const upperCoupletChars = computed(() => [...props.coupletsData['上联']])
const lowerCoupletChars = computed(() => [...props.coupletsData['下联']])

/** 平仄分析（按需动态加载 pinyin-pro，避免进主 bundle；标注在截图区之外，不污染下载图片） */
const showTones = ref(false)
const toneAnalysis = shallowRef<CoupletToneAnalysis | null>(null)
let analyzeCoupletFn: ((上联: string, 下联: string) => CoupletToneAnalysis) | null = null

async function runToneAnalysis() {
  if (!showTones.value) {
    toneAnalysis.value = null
    return
  }
  if (!analyzeCoupletFn)
    analyzeCoupletFn = (await import('~~/packages/ai/src/tones')).analyzeCouplet
  toneAnalysis.value = analyzeCoupletFn(props.coupletsData['上联'], props.coupletsData['下联'])
}

watch([showTones, () => props.coupletsData], runToneAnalysis)

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
      class="font-zmx spring-festival-container"
      :data-couplet-style="app.options.style"
    >
      <div ref="sfcContainer" class="spring-festival-content">
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
              <span
                v-if="app.visible"
                class="couplet-text"
                :aria-label="coupletsData['上联']"
              >
                <span
                  v-for="(char, index) in upperCoupletChars"
                  :key="`upper-${index}-${char}`"
                  class="couplet-char"
                  aria-hidden="true"
                >{{ char }}</span>
              </span>
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
              <span
                v-if="app.visible"
                class="couplet-text"
                :aria-label="coupletsData['下联']"
              >
                <span
                  v-for="(char, index) in lowerCoupletChars"
                  :key="`lower-${index}-${char}`"
                  class="couplet-char"
                  aria-hidden="true"
                >{{ char }}</span>
              </span>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <div class="font-zmx switch-grid">
      <div class="switch-row">
        <label class="switch-label" for="inverse-fu">倒转福字</label>
        <SwitchRoot
          id="inverse-fu"
          v-model="app.options.inverseFu"
          class="switch-root"
        >
          <SwitchThumb class="switch-thumb" />
        </SwitchRoot>
      </div>

      <div class="switch-row">
        <label class="switch-label" for="inverse-couplets">翻转春联</label>
        <SwitchRoot
          id="inverse-couplets"
          v-model="app.options.inverseCouplets"
          class="switch-root"
        >
          <SwitchThumb class="switch-thumb" />
        </SwitchRoot>
      </div>

      <div class="switch-row">
        <label class="switch-label" for="show-tones">显示平仄</label>
        <SwitchRoot
          id="show-tones"
          v-model="showTones"
          class="switch-root"
        >
          <SwitchThumb class="switch-thumb" />
        </SwitchRoot>
      </div>
    </div>

    <div v-if="showTones && toneAnalysis" class="tone-panel">
      <div
        v-for="row in [{ label: '上联', chars: toneAnalysis.上联 }, { label: '下联', chars: toneAnalysis.下联 }]"
        :key="row.label"
        class="tone-row"
      >
        <span class="tone-row-label">{{ row.label }}</span>
        <span
          v-for="(c, i) in row.chars"
          :key="`${row.label}-${i}`"
          class="tone-cell"
          :class="{ conflict: toneAnalysis.出律位置.includes(i) }"
        >
          <span class="tone-cell-char">{{ c.char }}</span>
          <span class="tone-cell-mark" :data-tone="c.tone || ''">{{ c.tone || '·' }}</span>
        </span>
      </div>
      <div class="tone-conclusion" :class="{ ok: toneAnalysis.合律 }">
        <span :class="toneAnalysis.合律 ? 'i-ri-checkbox-circle-line' : 'i-ri-error-warning-line'" />
        <span>{{ toneAnalysis.结论 }}</span>
      </div>
    </div>

    <div class="font-zmx action-grid">
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
  --ac-couplet-font-size: 2.45rem;
  --ac-couplet-line-height: 1.18;

  /* 春联皮肤变量（默认＝经典手写款），由下方 [data-couplet-style] 覆盖 */
  --sfc-couplet-bg: #c1121f;
  --sfc-fu-bg: #c1121f;
  --sfc-couplet-ink: #1a1a1a;
  --sfc-plaque-ink: #1a1a1a;
  --sfc-fu-ink: #1a1a1a;
  --sfc-couplet-border: transparent;
  --sfc-couplet-radius: 0;
  --sfc-couplet-inset: none;
  --sfc-couplet-pattern: none;

  width: min(100%, 35rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
}

/**
 * The actual couplet content (横批 + 上下联 + 福). This is the element captured
 * for download/copy, so it deliberately has no background or padding — the image
 * comes out transparent and sized exactly to the couplets, while the paper frame
 * above stays for on-screen display only.
 */
.spring-festival-content {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  align-items: center;
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
  border: 1px solid var(--sfc-couplet-border);
  border-radius: var(--sfc-couplet-radius);
  background-color: var(--sfc-couplet-bg);
  background-image: var(--sfc-couplet-pattern);
  box-shadow: var(--sfc-couplet-inset);
  color: var(--sfc-plaque-ink);
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
  justify-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sfc-fu-ink);
  font-size: calc(var(--ac-fu-font-size) - 0.6rem);
  transition: transform 0.32s ease;
}

.spring-festival-fu {
  position: absolute;
  inset: 0;
  transform: rotate(45deg) scale(1);
  border: 1px solid var(--sfc-couplet-border);
  background-color: var(--sfc-fu-bg);
  box-shadow: var(--sfc-couplet-inset);
}

.fu-char {
  position: relative;
  z-index: 1;
  line-height: 1;
}

.spring-festival-couplet {
  min-width: var(--ac-couplet-width);
  min-height: 20.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 0.45rem;
  border: 1px solid var(--sfc-couplet-border);
  border-radius: var(--sfc-couplet-radius);
  background-color: var(--sfc-couplet-bg);
  background-image: var(--sfc-couplet-pattern);
  box-shadow: var(--sfc-couplet-inset);
  color: var(--sfc-couplet-ink);
  font-size: var(--ac-couplet-font-size);
  line-height: var(--ac-couplet-line-height);
  letter-spacing: 0;
  text-align: center;
  white-space: normal;
}

.couplet-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: var(--ac-couplet-line-height);
}

.couplet-char {
  display: block;
  line-height: var(--ac-couplet-line-height);
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
  min-height: 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.65rem 0.5rem 0.85rem;
  border: 1px solid var(--sfc-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--sfc-control) 70%, transparent);
  color: var(--sfc-ink);
  font-size: 1.15rem;
  font-weight: 400;
  letter-spacing: 0;
}

.switch-label {
  min-width: 0;
  line-height: 1;
  cursor: pointer;
}

.switch-root {
  position: relative;
  width: 3rem;
  height: 1.55rem;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 0.2rem;
  border: 0;
  border-radius: 999px;
  appearance: none;
  background: rgba(126, 36, 23, 0.22);
  box-shadow:
    inset 0 0 0 1px rgba(126, 36, 23, 0.18),
    0 1px 3px rgba(53, 20, 15, 0.12);
  cursor: pointer;
  transition:
    background 0.16s ease,
    box-shadow 0.16s ease;
}

.switch-root[data-state='checked'] {
  background: var(--sfc-cinnabar);
  box-shadow:
    inset 0 0 0 1px rgba(255, 225, 143, 0.28),
    0 2px 6px rgba(179, 38, 30, 0.22);
}

.switch-root:hover {
  box-shadow:
    inset 0 0 0 1px rgba(126, 36, 23, 0.24),
    0 2px 8px rgba(53, 20, 15, 0.16);
}

.switch-root:focus-visible {
  outline: 2px solid #e5a93d;
  outline-offset: 2px;
}

.switch-thumb {
  display: block;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 999px;
  background: #fff7df;
  box-shadow:
    0 1px 2px rgba(53, 20, 15, 0.18),
    0 3px 8px rgba(53, 20, 15, 0.18);
  transform: translateX(0);
  transition: transform 0.16s ease;
  will-change: transform;
}

.switch-thumb[data-state='checked'] {
  transform: translateX(1.45rem);
}

.action-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

/* 平仄分析面板（在截图区之外，不进下载图片） */
.tone-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--sfc-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--sfc-control) 60%, transparent);
}

.tone-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.25rem;
}

.tone-row-label {
  margin-right: 0.3rem;
  color: var(--sfc-ink-muted);
  font-size: 0.85rem;
  line-height: 2;
}

.tone-cell {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 1.4rem;
  padding: 0.05rem 0.1rem;
  border-radius: 6px;
}

.tone-cell.conflict {
  background: rgba(179, 38, 30, 0.12);
}

.tone-cell-char {
  color: var(--sfc-ink);
  font-size: 1.05rem;
  line-height: 1.3;
}

.tone-cell-mark {
  color: var(--sfc-ink-muted);
  font-size: 0.7rem;
  line-height: 1;
}

.tone-cell-mark[data-tone='仄'] {
  color: var(--sfc-cinnabar);
}

.tone-conclusion {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--sfc-cinnabar);
  font-size: 0.85rem;
  font-weight: 700;
}

.tone-conclusion.ok {
  color: var(--sfc-jade);
}

/* 洒金宣纸：红底极淡同色暗纹、黑墨字、无边框直角 */
.spring-festival-container[data-couplet-style='silk'] {
  --sfc-couplet-bg: #b5121b;
  --sfc-fu-bg: #b5121b;
  --sfc-couplet-pattern:
    repeating-linear-gradient(45deg, rgba(255, 228, 170, 0.07) 0 1px, transparent 1px 7px),
    repeating-linear-gradient(-45deg, rgba(60, 0, 0, 0.06) 0 1px, transparent 1px 7px);
}

/* 描金喜庆：正红渐变、金色描边内线、金横批/金福、墨色对联 */
.spring-festival-container[data-couplet-style='festive'] {
  --sfc-couplet-bg: #a8121a;
  --sfc-fu-bg: #c5151c;
  --sfc-couplet-pattern: linear-gradient(180deg, #c8161d, #a8121a);
  --sfc-couplet-ink: #2a1108;
  --sfc-plaque-ink: #f2d98a;
  --sfc-fu-ink: #f2d98a;
  --sfc-couplet-border: #c99a3a;
  --sfc-couplet-inset: inset 0 0 0 2px rgba(240, 217, 138, 0.32);
}

.dark .switch-root {
  background: rgba(255, 219, 142, 0.22);
  box-shadow:
    inset 0 0 0 1px rgba(255, 219, 142, 0.14),
    0 1px 4px rgba(0, 0, 0, 0.22);
}

.dark .switch-root[data-state='checked'] {
  background: #d93c32;
  box-shadow:
    inset 0 0 0 1px rgba(255, 219, 142, 0.24),
    0 2px 8px rgba(217, 60, 50, 0.2);
}

@media (max-width: 640px) {
  .spring-festival-container {
    --ac-fu-font-size: 4rem;
    --ac-couplet-width: 3.7rem;
    --ac-couplet-font-size: 2rem;
    --ac-couplet-line-height: 1.16;
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
    min-height: 17.5rem;
    padding: 1.35rem 0.4rem;
  }

  .switch-grid,
  .action-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
