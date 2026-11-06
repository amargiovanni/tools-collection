import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:4321',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    // Astro 7.2+ detaches `astro preview` into a background daemon when it
    // detects a coding agent, so the command exits and Playwright aborts.
    // This variable is the marker Astro sets on its own daemon child: with it,
    // preview stays in the foreground under Playwright's control.
    env: { ASTRO_PREVIEW_BACKGROUND: '1' },
  },
})
