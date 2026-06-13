<script setup lang="ts">
const userStore = useUserStore()

onMounted(() => {
  userStore.syncSilently()
})
</script>

<template>
  <main class="app-shell">
    <header class="app-header">
      <NuxtLink class="brand-lockup" to="/" aria-label="AI 春联">
        <span class="font-zmx brand-mark">春</span>
        <span class="brand-copy">
          <strong>AI 春联</strong>
          <span>YunLeFun</span>
        </span>
      </NuxtLink>

      <div class="header-actions">
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
  color: #35140f;
  background:
    linear-gradient(90deg, rgba(179, 38, 30, 0.045) 1px, transparent 1px),
    linear-gradient(180deg, rgba(217, 166, 66, 0.08) 1px, transparent 1px), #fff8ec;
  background-size:
    28px 28px,
    28px 28px,
    auto;
}

.app-shell::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(115deg, rgba(179, 38, 30, 0.1), transparent 34%),
    linear-gradient(245deg, rgba(16, 93, 74, 0.1), transparent 36%);
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
  border: 1px solid rgba(255, 216, 127, 0.72);
  border-radius: 8px;
  background: #b3261e;
  color: #ffe6a8;
  box-shadow:
    inset 0 0 0 3px rgba(255, 255, 255, 0.1),
    0 14px 36px rgba(109, 24, 18, 0.18);
  font-size: 1.65rem;
}

.brand-copy {
  min-width: 0;
  display: grid;
  gap: 0.05rem;
}

.brand-copy strong {
  font-size: 1.05rem;
  line-height: 1.1;
}

.brand-copy span {
  color: rgba(53, 20, 15, 0.58);
  font-size: 0.75rem;
  font-weight: 700;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
}

.dark .app-shell {
  color: #fff3d8;
  background:
    linear-gradient(90deg, rgba(255, 219, 142, 0.045) 1px, transparent 1px),
    linear-gradient(180deg, rgba(255, 219, 142, 0.045) 1px, transparent 1px), #170f12;
  background-size:
    28px 28px,
    28px 28px,
    auto;
}

.dark .app-shell::before {
  background:
    linear-gradient(115deg, rgba(179, 38, 30, 0.2), transparent 34%),
    linear-gradient(245deg, rgba(38, 132, 102, 0.16), transparent 36%);
}

.dark .brand-copy span {
  color: rgba(255, 243, 216, 0.62);
}

@media (max-width: 640px) {
  .app-header {
    width: min(100% - 1rem, 72rem);
    min-height: 4rem;
    padding: 0.75rem 0;
  }

  .brand-copy span {
    display: none;
  }

  .brand-mark {
    width: 2.35rem;
    height: 2.35rem;
  }
}
</style>
