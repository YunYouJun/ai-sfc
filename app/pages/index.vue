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
  border: 1px solid var(--sfc-border);
  border-radius: 8px;
  background: var(--sfc-panel);
  box-shadow: var(--sfc-shadow);
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
  color: var(--sfc-ink-muted);
}

.dark .prompt-panel,
.dark .preview-panel {
  border-color: var(--sfc-border);
  background: var(--sfc-panel);
  box-shadow: var(--sfc-shadow);
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
    padding-top: 0.25rem;
  }

  .prompt-panel,
  .preview-panel {
    padding: 1rem;
  }
}

@media (max-width: 420px) {
  .home-page {
    width: min(100% - 0.75rem, 72rem);
  }

  .tool-grid {
    gap: 0.85rem;
  }

  .prompt-panel,
  .preview-panel {
    padding: 0.85rem;
  }
}
</style>
