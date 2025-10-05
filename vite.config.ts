import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  base: '',
  build: { outDir: 'dist' },
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    setupFiles: ['./tests/setup.ts']
  }
})
