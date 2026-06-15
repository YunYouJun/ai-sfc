<script lang="ts" setup>
import { useMagicKeys } from '@vueuse/core'
import { config } from '~/config'
import { apiGenerate, generateCoupletsDirect } from '~/utils'

const app = useAppStore()
const aiSettings = useAiSettingsStore()
const userStore = useUserStore()
const wallet = useWalletStore()

/** 未登录且未配置自定义 token：既不能走服务端云币，也不能浏览器直连 */
const needsSetup = computed(() => !userStore.isAuthenticated && !aiSettings.hasToken)
/** 登录且余额已知时展示剩余可生成次数 */
const showRemaining = computed(() => userStore.isAuthenticated && wallet.remaining !== null)

const promptPresets = [
  '家人平安，事业顺遂',
  '升职加薪，万事胜意',
  '山河远阔，烟火人间',
]

const promptLength = computed(() => app.prompt.length)
const canGenerate = computed(() => !app.loading && app.prompt.trim().length > 0)

function usePreset(preset: string) {
  app.prompt = preset
}

/**
 * generate sfc 春联
 * not use ofetch see https://github.com/unjs/ofetch/issues/294
 */
async function generate() {
  if (app.loading || app.prompt.trim().length === 0)
    return

  // 未登录且未配置 token：引导去设置页填 token（或右上角登录用云币）
  if (needsSetup.value) {
    await navigateTo('/settings')
    return
  }

  // 登录但云币已用尽：引导去充值
  if (userStore.isAuthenticated && wallet.remaining === 0) {
    window.open(userStore.getYunleUrl('/wallet?from=ai-sfc'), '_blank', 'noopener')
    return
  }

  app.loading = true
  try {
    if (userStore.isAuthenticated) {
      // 登录 → 服务端用云币生成（token 仅作鉴权，模型 key 在服务端）
      const data = await apiGenerate({
        prompt: app.prompt,
        token: await userStore.getAccessToken(),
        bizId: crypto.randomUUID(),
      })
      if (typeof data.balance === 'number')
        wallet.setBalance(data.balance)
      await app.setCoupletsData(data)
    }
    else {
      // 未登录但有 token → 浏览器直连，token 不经过服务端
      const data = await generateCoupletsDirect(app.prompt, aiSettings.resolvedProvider)
      await app.setCoupletsData(data)
    }
  }
  finally {
    app.loading = false
  }
}

// Ctrl + Enter / Cmd + Enter to generate
const { Ctrl_enter, Cmd_enter } = useMagicKeys()
watch(() => [Cmd_enter?.value, Ctrl_enter?.value], ([cmdEnter, ctrlEnter]) => {
  if (cmdEnter || ctrlEnter)
    generate()
})
</script>

<template>
  <div class="prompt-composer">
    <div class="preset-row" aria-label="提示预设">
      <button
        v-for="preset in promptPresets"
        :key="preset"
        type="button"
        class="preset-chip"
        @click="usePreset(preset)"
      >
        {{ preset }}
      </button>
    </div>

    <label class="sr-only" for="sfc-prompt">提示词</label>
    <textarea
      id="sfc-prompt"
      v-model="app.prompt"
      placeholder="想要什么样的春联？"
      class="prompt-input"
      :maxlength="config.inputMaxLength"
      rows="3"
    />

    <div v-if="needsSetup" class="setup-notice">
      <span class="i-ri-information-line" />
      <span>
        未登录：请先<NuxtLink to="/settings">填写模型 Token</NuxtLink> 直连生成，或点击右上角登录使用云币。
      </span>
    </div>

    <div class="composer-footer">
      <div class="composer-meta">
        <span class="counter">{{ promptLength }}/{{ config.inputMaxLength }}</span>
        <span v-if="showRemaining" class="balance-hint">
          <span class="i-ri-copper-coin-line" />
          <span>剩余 {{ wallet.remaining }} 次</span>
        </span>
      </div>
      <button
        type="button"
        class="generate-button font-zmx"
        :disabled="!canGenerate"
        @click="generate"
      >
        <span :class="app.loading ? 'i-svg-spinners:pulse' : 'i-ri-sparkling-2-line'" />
        <span>{{ app.loading ? '生成中...' : '生成春联' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.prompt-composer {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1rem;
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.preset-chip {
  min-height: 2rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid rgba(15, 107, 86, 0.18);
  border-radius: 999px;
  background: rgba(15, 107, 86, 0.08);
  color: #0f5f4d;
  font-size: 0.85rem;
  font-weight: 800;
  transition:
    transform 0.16s ease,
    background 0.16s ease,
    border-color 0.16s ease;
}

.preset-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(15, 107, 86, 0.34);
  background: rgba(15, 107, 86, 0.12);
}

.prompt-input {
  width: 100%;
  resize: vertical;
  flex: 1;
  padding: 1rem;
  border: 1px solid rgba(126, 36, 23, 0.16);
  border-radius: 8px;
  outline: none;
  background: linear-gradient(180deg, rgba(255, 244, 220, 0.82), rgba(255, 255, 255, 0.72));
  color: #35140f;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.74);
  line-height: 1.75;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.prompt-input:focus {
  border-color: rgba(179, 38, 30, 0.46);
  box-shadow: 0 0 0 3px rgba(179, 38, 30, 0.12);
}

.prompt-input::placeholder {
  color: rgba(53, 20, 15, 0.42);
}

.setup-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid rgba(179, 38, 30, 0.2);
  border-radius: 8px;
  background: rgba(179, 38, 30, 0.06);
  color: #a9231b;
  font-size: 0.85rem;
  line-height: 1.5;
}

.setup-notice span:first-child {
  flex: 0 0 auto;
  margin-top: 0.1rem;
}

.setup-notice a {
  font-weight: 800;
  text-decoration: underline;
}

.dark .setup-notice {
  border-color: rgba(255, 155, 142, 0.22);
  background: rgba(255, 155, 142, 0.08);
  color: #ff9b8e;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.composer-meta {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.counter {
  color: rgba(53, 20, 15, 0.54);
  font-size: 0.85rem;
  font-weight: 800;
}

.balance-hint {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #0f6b56;
  font-size: 0.82rem;
  font-weight: 800;
}

.dark .balance-hint {
  color: #69d3ad;
}

.generate-button {
  min-height: 3rem;
  min-width: 12rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.55rem 1.2rem;
  border: 1px solid rgba(255, 220, 137, 0.54);
  border-radius: 8px;
  background: #b3261e;
  color: #fff2c7;
  box-shadow: 0 16px 36px rgba(179, 38, 30, 0.24);
  font-size: 1.75rem;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    opacity 0.16s ease;
}

.generate-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 20px 42px rgba(179, 38, 30, 0.3);
}

.generate-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.generate-button span:first-child {
  width: 1.2rem;
  height: 1.2rem;
}

.dark .preset-chip {
  border-color: rgba(105, 211, 173, 0.18);
  background: rgba(105, 211, 173, 0.1);
  color: #9be7ca;
}

.dark .prompt-input {
  border-color: rgba(255, 219, 142, 0.15);
  background: rgba(25, 17, 18, 0.72);
  color: #fff3d8;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.dark .prompt-input:focus {
  border-color: rgba(255, 207, 114, 0.46);
  box-shadow: 0 0 0 3px rgba(255, 207, 114, 0.12);
}

.dark .prompt-input::placeholder,
.dark .counter {
  color: rgba(255, 243, 216, 0.46);
}

@media (max-width: 640px) {
  .composer-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .generate-button {
    width: 100%;
  }
}
</style>
