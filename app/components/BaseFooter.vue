<template>
  <footer class="base-footer">
    <SimpleCopyright />
    <div class="powered-by">
      Powered by <a href="https://chat.deepseek.com/" target="_blank" rel="noopener noreferrer">DeepSeek</a>
    </div>
  </footer>
</template>

<style scoped>
.base-footer {
  margin: 1.5rem 0 0;
  padding: 0.75rem 0;
  color: rgba(53, 20, 15, 0.56);
  text-align: center;
}

.powered-by {
  margin-top: 0.25rem;
  font-size: 0.88rem;
}

.powered-by a {
  color: #0f6b56;
  font-weight: 800;
}

.dark .base-footer {
  color: rgba(255, 243, 216, 0.54);
}

.dark .powered-by a {
  color: #69d3ad;
}
</style>
