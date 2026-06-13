<script setup lang="ts">
const app = useAppStore()
</script>

<template>
  <div class="home-page">
    <section class="tool-grid">
      <section class="prompt-panel">
        <div class="title-block">
          <span class="font-zmx title-seal">福</span>
          <div>
            <p class="kicker">
              新春书写
            </p>
            <h1 class="font-zmx">
              AI 春联
            </h1>
            <p class="subtitle">
              愿望落笔，年味成联
            </p>
          </div>
        </div>

        <AiPrompt />
      </section>

      <section class="preview-panel" aria-label="春联预览">
        <Suspense>
          <ClientOnly>
            <SpringFestivalCouplets :couplets-data="app.coupletsData" />
          </ClientOnly>
          <template #fallback>
            <div class="preview-loading">
              <span class="i-svg-spinners:pulse" />
              <span>Loading...</span>
            </div>
          </template>
        </Suspense>
      </section>
    </section>

    <BaseFooter />
  </div>
</template>

<style scoped>
.home-page {
  position: relative;
  z-index: 1;
  width: min(100% - 2rem, 72rem);
  margin: 0 auto;
  padding: 1rem 0 2rem;
}

.tool-grid {
  display: grid;
  grid-template-columns: minmax(18rem, 0.9fr) minmax(24rem, 1.15fr);
  gap: 1.25rem;
  align-items: stretch;
}

.prompt-panel,
.preview-panel {
  border: 1px solid rgba(126, 36, 23, 0.14);
  border-radius: 8px;
  background: rgba(255, 253, 247, 0.78);
  box-shadow: 0 22px 70px rgba(97, 29, 18, 0.12);
  backdrop-filter: blur(16px);
}

.prompt-panel {
  min-height: 35rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.25rem;
}

.preview-panel {
  min-height: 35rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1.25rem;
  overflow: hidden;
}

.title-block {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-seal {
  width: 4.2rem;
  height: 4.2rem;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 220, 137, 0.76);
  border-radius: 8px;
  background: #b3261e;
  color: #ffe9ad;
  box-shadow: inset 0 0 0 4px rgba(255, 255, 255, 0.1);
  font-size: 2.75rem;
}

.kicker {
  margin: 0 0 0.2rem;
  color: #0f6b56;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0;
}

h1 {
  margin: 0;
  color: #af241c;
  font-size: 3.6rem;
  line-height: 0.95;
  letter-spacing: 0;
}

.subtitle {
  margin: 0.35rem 0 0;
  color: rgba(53, 20, 15, 0.64);
  font-weight: 700;
}

.preview-loading {
  min-height: 18rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: rgba(53, 20, 15, 0.62);
}

.dark .prompt-panel,
.dark .preview-panel {
  border-color: rgba(255, 219, 142, 0.14);
  background: rgba(43, 23, 22, 0.78);
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.26);
}

.dark .kicker {
  color: #69d3ad;
}

.dark h1 {
  color: #ffcf72;
}

.dark .subtitle,
.dark .preview-loading {
  color: rgba(255, 243, 216, 0.66);
}

@media (max-width: 900px) {
  .tool-grid {
    grid-template-columns: 1fr;
  }

  .prompt-panel,
  .preview-panel {
    min-height: auto;
  }
}

@media (max-width: 640px) {
  .home-page {
    width: min(100% - 1rem, 72rem);
    padding-top: 0.5rem;
  }

  .prompt-panel,
  .preview-panel {
    padding: 1rem;
  }

  .title-seal {
    width: 3.35rem;
    height: 3.35rem;
    font-size: 2.15rem;
  }

  h1 {
    font-size: 2.85rem;
  }
}
</style>
