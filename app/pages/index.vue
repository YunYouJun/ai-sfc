<script setup lang="ts">
const app = useAppStore()
</script>

<template>
  <div class="home-page">
    <section class="tool-grid">
      <section class="prompt-panel" aria-label="春联生成">
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
}
</style>
