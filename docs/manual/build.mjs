/**
 * Builds the user manual PDF from the tool registry and the English messages.
 *
 *   node docs/manual/build.mjs screens   screenshot every tool from the built
 *                                        site (run `npx astro build` first)
 *   node docs/manual/build.mjs pdf       assemble manual.html, print the PDF to
 *                                        public/manual/, write the page map
 *
 * Uses the Playwright Chromium already installed for the e2e suite: no extra
 * packages. The PDF must stay opaque (see print.css): the build refuses one
 * with transparency, and its pages are checked as macOS Preview renders them
 * with tools/render-preview.swift.
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'
import { loadCatalogue } from './catalogue.mjs'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(HERE, '../..')
const PORT = 4329
const BASE = `http://localhost:${PORT}`
const SCREENS = join(HERE, 'screens')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function startPreview() {
  const proc = spawn('npx', ['astro', 'preview', '--port', String(PORT)], {
    cwd: ROOT,
    // Astro 7.2+ detaches preview when it detects a coding agent; stay attached.
    env: { ...process.env, ASTRO_PREVIEW_BACKGROUND: '1' },
    stdio: 'ignore',
  })
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${BASE}/en/`)).ok) return proc
    } catch {}
    await sleep(500)
  }
  proc.kill()
  throw new Error('astro preview did not start (did you run `npx astro build`?)')
}

/** Puts a tool in a state worth showing: example input, then one action. */
async function prepare(page, spec = {}) {
  // astro-island is display: contents; its first child is the tool's box.
  const island = page.locator('.tool-content > astro-island').first().locator(':scope > *').first()
  // Fields in DOM order; `fill` gives a value per field (null skips one).
  const fields = island.locator(
    'textarea:visible, input:not([type]):visible, input[type=text]:visible, input[type=password]:visible, input[type=number]:visible, input[type=date]:visible',
  )
  for (const [i, value] of (spec.fill ?? []).entries()) {
    if (value != null) await fields.nth(i).fill(value)
  }
  for (const label of spec.click ?? []) {
    await island.getByRole('button', { name: label, exact: true }).first().click()
    await sleep(250)
  }
  return island
}

async function screens(only) {
  const { tools, content } = await loadCatalogue()
  await mkdir(SCREENS, { recursive: true })
  const server = await startPreview()
  const browser = await chromium.launch()
  try {
    const ctx = await browser.newContext({
      viewport: { width: 980, height: 900 },
      deviceScaleFactor: 1.5,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    })
    await ctx.addInitScript(() => {
      try { localStorage.setItem('theme', 'light') } catch {}
    })
    const page = await ctx.newPage()
    for (const tool of tools) {
      if (only && tool.id !== only) continue
      await page.goto(`${BASE}/en/tools/${tool.id}/`, { waitUntil: 'networkidle' })
      await sleep(300)
      const island = await prepare(page, content.tools[tool.id]?.screen)
      await page.evaluate(() => document.activeElement?.blur())
      await sleep(300)
      await island.screenshot({ path: join(SCREENS, `${tool.id}.jpg`), type: 'jpeg', quality: 78 })
      console.log(`screens/${tool.id}.jpg`)
    }
  } finally {
    await browser.close()
    server.kill()
  }
}

const task = import.meta.main ? process.argv[2] : null
if (task === 'screens') await screens(process.argv[3])
else if (task === 'pdf') await (await import('./pdf.mjs')).pdf()
else if (import.meta.main) {
  console.error('usage: node docs/manual/build.mjs screens [tool-id] | pdf')
  process.exitCode = 1
}
