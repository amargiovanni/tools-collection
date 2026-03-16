import { defineConfig } from 'vitest/config'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solidPlugin()],
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      include: ['src/tools/**/*.ts'],
      reporter: ['text', 'lcov'],
    },
  },
})
