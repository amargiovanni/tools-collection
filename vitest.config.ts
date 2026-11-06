import { defineConfig } from 'vitest/config'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solidPlugin()],
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    // Node 25+ ships a global localStorage that is undefined unless
    // --localstorage-file is given; it shadows jsdom's, which Vitest only
    // installs on globals Node does not already define. Turning Node's Web
    // Storage off lets jsdom provide it on every Node version.
    execArgv: ['--no-experimental-webstorage'],
    coverage: {
      include: ['src/tools/**/*.ts'],
      reporter: ['text', 'lcov'],
    },
  },
})
