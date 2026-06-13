import { defineConfig } from 'vitest/config'

export default defineConfig({
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
