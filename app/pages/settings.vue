<script setup lang="ts">
import { COUPLET_STYLES } from '~/constants/couplet-style'

const aiSettings = useAiSettingsStore()
const app = useAppStore()
const showToken = shallowRef(false)
const tokenInputType = computed(() => showToken.value ? 'text' : 'password')

function resetSettings() {
  aiSettings.reset()
  showToken.value = false
}
</script>

<template>
  <div class="settings-page">
    <section class="settings-panel">
      <header class="settings-header">
        <div>
          <p class="settings-kicker">
            模型设置
          </p>
          <h1 class="font-zmx">
            自定义 AI 接口
          </h1>
        </div>
        <NuxtLink class="settings-back" to="/" aria-label="返回首页">
          <span class="i-ri-arrow-left-line" />
          <span>返回</span>
        </NuxtLink>
      </header>

      <div class="settings-form">
        <label class="settings-field" for="ai-base-url">
          <span>API 地址</span>
          <input
            id="ai-base-url"
            v-model.trim="aiSettings.settings.baseURL"
            type="url"
            autocomplete="off"
            spellcheck="false"
            placeholder="https://api.deepseek.com/v1"
          >
        </label>

        <label class="settings-field" for="ai-model">
          <span>模型名称</span>
          <input
            id="ai-model"
            v-model.trim="aiSettings.settings.model"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="deepseek-chat"
          >
        </label>

        <label class="settings-field" for="ai-token">
          <span>API Token</span>
          <div class="token-row">
            <input
              id="ai-token"
              v-model.trim="aiSettings.settings.apiKey"
              :type="tokenInputType"
              autocomplete="off"
              spellcheck="false"
              placeholder="sk-..."
            >
            <button
              type="button"
              class="icon-button"
              :aria-label="showToken ? '隐藏 Token' : '显示 Token'"
              @click="showToken = !showToken"
            >
              <span :class="showToken ? 'i-ri-eye-off-line' : 'i-ri-eye-line'" />
            </button>
          </div>
        </label>
      </div>

      <footer class="settings-footer">
        <p>
          Token 仅保存在本机浏览器，生成时直接发送给你填写的模型接口，不经过本站服务端。登录后则改用云币与本站服务端生成，无需填写。
        </p>
        <button type="button" class="reset-button" @click="resetSettings">
          重置默认
        </button>
      </footer>
    </section>

    <section class="settings-panel">
      <header class="settings-header">
        <div>
          <p class="settings-kicker">
            外观设置
          </p>
          <h1 class="font-zmx">
            春联样式
          </h1>
        </div>
      </header>

      <div class="style-grid">
        <button
          v-for="s in COUPLET_STYLES"
          :key="s.value"
          type="button"
          class="style-card"
          :class="{ 'is-active': app.options.style === s.value }"
          :aria-pressed="app.options.style === s.value"
          @click="app.options.style = s.value"
        >
          <span class="style-preview" :data-couplet-style="s.value" aria-hidden="true">
            <span class="sp-plaque" />
            <span class="sp-row">
              <span class="sp-couplet" />
              <span class="sp-fu" />
              <span class="sp-couplet" />
            </span>
          </span>
          <span class="style-meta">
            <span class="style-name font-zmx">{{ s.name }}</span>
            <span class="style-desc">{{ s.desc }}</span>
          </span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-page {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 1.25rem;
  width: min(100% - 2rem, 46rem);
  margin: 0 auto;
  padding: 1rem 0 2rem;
}

.settings-panel {
  display: grid;
  gap: 1.25rem;
  padding: 1.25rem;
  border: 1px solid rgba(126, 36, 23, 0.14);
  border-radius: 8px;
  background: rgba(255, 253, 247, 0.82);
  box-shadow: 0 22px 70px rgba(97, 29, 18, 0.12);
  backdrop-filter: blur(16px);
}

.settings-header,
.settings-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.settings-kicker {
  margin: 0 0 0.2rem;
  color: #0f6b56;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0;
}

h1 {
  margin: 0;
  color: #af241c;
  font-size: 2.65rem;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0;
}

.settings-back,
.reset-button {
  min-height: 2.5rem;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid rgba(126, 36, 23, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  color: #35140f;
  font-weight: 800;
}

.settings-form {
  display: grid;
  gap: 1rem;
}

.settings-field {
  display: grid;
  gap: 0.45rem;
  color: #35140f;
  font-weight: 800;
}

.settings-field input {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid rgba(126, 36, 23, 0.16);
  border-radius: 8px;
  outline: none;
  background: linear-gradient(180deg, rgba(255, 244, 220, 0.86), rgba(255, 255, 255, 0.76));
  color: #35140f;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.92rem;
  line-height: 1.4;
}

.settings-field input:focus {
  border-color: rgba(179, 38, 30, 0.46);
  box-shadow: 0 0 0 3px rgba(179, 38, 30, 0.12);
}

.token-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
}

.icon-button {
  width: 2.75rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(126, 36, 23, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.68);
  color: #a9231b;
}

.settings-footer {
  padding-top: 0.25rem;
  border-top: 1px solid rgba(126, 36, 23, 0.12);
}

.settings-footer p {
  margin: 0;
  color: rgba(53, 20, 15, 0.58);
  font-size: 0.86rem;
  line-height: 1.5;
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.style-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  padding: 0.9rem 0.6rem;
  border: 1px solid rgba(126, 36, 23, 0.16);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.style-card:hover {
  border-color: rgba(179, 38, 30, 0.4);
}

.style-card.is-active {
  border-color: rgba(179, 38, 30, 0.6);
  box-shadow: 0 0 0 3px rgba(179, 38, 30, 0.12);
}

.style-preview {
  --p-bg: #c1121f;
  --p-fu: #c1121f;
  --p-border: transparent;
  --p-radius: 0;
  --p-inset: none;
  --p-pattern: none;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 10px 6px 4px;
}

.sp-plaque {
  width: 42px;
  height: 16px;
  border: 1px solid var(--p-border);
  border-radius: var(--p-radius);
  background-color: var(--p-bg);
  background-image: var(--p-pattern);
  box-shadow: var(--p-inset);
}

.sp-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sp-couplet {
  width: 13px;
  height: 52px;
  border: 1px solid var(--p-border);
  border-radius: var(--p-radius);
  background-color: var(--p-bg);
  background-image: var(--p-pattern);
  box-shadow: var(--p-inset);
}

.sp-fu {
  width: 18px;
  height: 18px;
  transform: rotate(45deg);
  border: 1px solid var(--p-border);
  background-color: var(--p-fu);
  box-shadow: var(--p-inset);
}

.style-preview[data-couplet-style='silk'] {
  --p-bg: #b5121b;
  --p-fu: #b5121b;
  --p-pattern:
    repeating-linear-gradient(45deg, rgba(255, 228, 170, 0.1) 0 1px, transparent 1px 6px),
    repeating-linear-gradient(-45deg, rgba(60, 0, 0, 0.08) 0 1px, transparent 1px 6px);
}

.style-preview[data-couplet-style='festive'] {
  --p-bg: #a8121a;
  --p-fu: #c5151c;
  --p-border: #c99a3a;
  --p-pattern: linear-gradient(180deg, #c8161d, #a8121a);
  --p-inset: inset 0 0 0 2px rgba(240, 217, 138, 0.4);
}

.style-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.style-name {
  color: #35140f;
  font-size: 1.05rem;
  line-height: 1.2;
}

.style-desc {
  color: rgba(53, 20, 15, 0.6);
  font-size: 0.74rem;
  text-align: center;
}

.dark .settings-panel {
  border-color: rgba(255, 219, 142, 0.14);
  background: rgba(43, 23, 22, 0.78);
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.26);
}

.dark .settings-kicker {
  color: #69d3ad;
}

.dark h1 {
  color: #ffcf72;
}

.dark .settings-back,
.dark .reset-button,
.dark .icon-button {
  border-color: rgba(255, 219, 142, 0.14);
  background: rgba(25, 17, 18, 0.62);
  color: #fff3d8;
}

.dark .settings-field {
  color: #fff3d8;
}

.dark .settings-field input {
  border-color: rgba(255, 219, 142, 0.15);
  background: rgba(25, 17, 18, 0.72);
  color: #fff3d8;
}

.dark .settings-field input:focus {
  border-color: rgba(255, 207, 114, 0.46);
  box-shadow: 0 0 0 3px rgba(255, 207, 114, 0.12);
}

.dark .settings-footer {
  border-top-color: rgba(255, 219, 142, 0.13);
}

.dark .settings-footer p {
  color: rgba(255, 243, 216, 0.58);
}

.dark .style-card {
  border-color: rgba(255, 219, 142, 0.14);
  background: rgba(25, 17, 18, 0.55);
}

.dark .style-card:hover {
  border-color: rgba(255, 207, 114, 0.4);
}

.dark .style-card.is-active {
  border-color: rgba(255, 207, 114, 0.5);
  box-shadow: 0 0 0 3px rgba(255, 207, 114, 0.12);
}

.dark .style-name {
  color: #fff3d8;
}

.dark .style-desc {
  color: rgba(255, 243, 216, 0.6);
}

@media (max-width: 640px) {
  .settings-page {
    width: min(100% - 1rem, 46rem);
    padding-top: 0.5rem;
  }

  .settings-panel {
    padding: 1rem;
  }

  .settings-header,
  .settings-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .settings-back,
  .reset-button {
    width: 100%;
  }
}
</style>
