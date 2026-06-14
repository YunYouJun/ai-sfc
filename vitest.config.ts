import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '~~': fileURLToPath(new URL('.', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    exclude: [
      '**/.nuxt/**',
      '**/.output/**',
      '**/node_modules/**',
    ],
    include: ['tests/**/*.test.ts'],
  },
})
