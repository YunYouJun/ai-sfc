<script setup lang="ts">
import { useDocumentVisibility } from '@vueuse/core'

const userStore = useUserStore()
const wallet = useWalletStore()
const visibility = useDocumentVisibility()

onMounted(() => {
  userStore.syncSilently()
})

// 从云乐坊钱包等外部页返回（充值后）时刷新余额
watch(visibility, (state) => {
  if (state === 'visible' && userStore.isAuthenticated)
    wallet.refresh()
})
</script>

<template>
  <main class="app-shell">
    <header class="app-header">
      <NuxtLink class="brand-lockup" to="/" aria-label="AI 春联">
        <span class="brand-mark font-zmx" aria-hidden="true">春</span>
        <span class="brand-copy">
          <strong>AI 春联</strong>
          <span>YunLeFun</span>
        </span>
      </NuxtLink>

      <div class="header-actions">
        <a
          class="header-icon-button"
          href="https://github.com/YunYouJun/ai-sfc"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub 源码"
          title="GitHub 源码"
        >
          <span class="i-ri-github-fill" />
        </a>
        <NuxtLink class="header-icon-button" to="/settings" aria-label="模型设置">
          <span class="i-ri-settings-3-line" />
        </NuxtLink>
        <AccountMenu />
        <DarkToggle />
      </div>
    </header>

    <slot />
  </main>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--sfc-ink);
  /* 宣纸暖底：纯暖纸色，柔和角光交给 ::before，避免刚性网格的「坐标纸/科幻」观感 */
  background: var(--sfc-paper);
}

.app-shell::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(115deg, rgba(179, 38, 30, 0.1), transparent 34%),
    linear-gradient(245deg, rgba(217, 166, 66, 0.12), transparent 36%);
  mask-image: linear-gradient(to bottom, black 0, transparent 72%);
}

.app-header {
  position: relative;
  z-index: 10;
  width: min(100% - 2rem, 72rem);
  min-height: 4.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 0 auto;
  padding: 1rem 0;
}

.brand-lockup {
  min-width: 0;
  flex: 1 1 auto;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: inherit;
}

.brand-mark {
  width: 2.65rem;
  height: 2.65rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 220, 137, 0.48);
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(255, 242, 199, 0.18), transparent 42%), var(--sfc-seal);
  box-shadow:
    inset 0 0 0 3px rgba(255, 242, 199, 0.16),
    0 14px 36px rgba(109, 24, 18, 0.18);
  color: var(--sfc-gold-soft);
  font-size: 1.72rem;
  line-height: 1;
}

.brand-copy {
  min-width: 0;
  display: grid;
  gap: 0.05rem;
}

.brand-copy strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.05rem;
  line-height: 1.1;
}

.brand-copy span {
  color: var(--sfc-ink-muted);
  font-size: 0.75rem;
  font-weight: 700;
}

.header-actions {
  min-width: 0;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
}

.header-icon-button {
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sfc-border-strong);
  border-radius: 999px;
  background: var(--sfc-control);
  color: var(--sfc-ink);
  box-shadow: var(--sfc-control-shadow);
  backdrop-filter: blur(14px);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.header-icon-button span {
  width: 1.2rem;
  height: 1.2rem;
}

.header-icon-button:hover {
  transform: translateY(-1px);
  border-color: rgba(184, 44, 29, 0.34);
  box-shadow: 0 16px 36px rgba(97, 29, 18, 0.14);
}

.dark .app-shell {
  color: var(--sfc-ink);
  background: var(--sfc-paper);
}

.dark .app-shell::before {
  background:
    linear-gradient(120deg, rgba(198, 50, 43, 0.16), transparent 36%),
    linear-gradient(245deg, rgba(214, 166, 66, 0.08), transparent 40%);
}

.dark .header-icon-button {
  border-color: var(--sfc-border-strong);
  background: var(--sfc-control);
  color: var(--sfc-gold-soft);
  box-shadow: var(--sfc-control-shadow);
}

@media (max-width: 640px) {
  .app-header {
    width: min(100% - 1rem, 72rem);
    min-height: 4rem;
    gap: 0.55rem;
    padding: 0.75rem 0;
  }

  .brand-lockup {
    gap: 0.5rem;
  }

  .brand-copy span {
    display: none;
  }

  .brand-mark {
    width: 2.35rem;
    height: 2.35rem;
    font-size: 1.5rem;
  }

  .header-actions {
    gap: 0.4rem;
  }

  .header-icon-button {
    width: 2.35rem;
    height: 2.35rem;
  }
}

@media (max-width: 360px) {
  .brand-copy {
    display: none;
  }
}
</style>
