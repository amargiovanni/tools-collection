import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['src/tools/**/*.ts'],
      reporter: ['text', 'lcov'],
    },
  },
})
