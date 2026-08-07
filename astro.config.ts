import { defineConfig } from 'astro/config'
import solidJs from '@astrojs/solid-js'
import tailwindcss from '@tailwindcss/vite'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import type { AstroIntegration } from 'astro'

// Three gaps in Astro's built-in CSP generation, all patched post-build:
//
// 1. `is:inline` scripts (theme anti-flash, page-data blobs, Solid hydration
//    bootstrap) are emitted verbatim and NOT hashed, so a hash-based policy
//    kills island hydration. Compute their sha256 ourselves.
// 2. The ClientRouter executes the *destination* page's inline scripts and
//    styles under the *current* page's policy, so per-page hash lists break
//    every SPA-style navigation (learned in production — tasks/lessons.md).
//    Every page therefore carries the UNION of all hashes across the site.
// 3. style="" attributes need the dedicated style-src-attr directive (the
//    hashed style-src makes 'unsafe-inline' ineffective), but Astro's config
//    validation rejects any directive starting with "style-src".
function cspPostProcess(): AstroIntegration {
  return {
    name: 'csp-post-process',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const root = new URL(dir).pathname
        const walk = async (d: string): Promise<string[]> =>
          (
            await Promise.all(
              (await readdir(d, { withFileTypes: true })).map((e) =>
                e.isDirectory() ? walk(join(d, e.name)) : join(d, e.name),
              ),
            )
          ).flat()
        const files = (await walk(root)).filter((f) => f.endsWith('.html'))
        const pages = await Promise.all(
          files.map(async (f) => ({ f, html: await readFile(f, 'utf8') })),
        )

        // Pass 1 — site-wide union of script/style hashes: the ones Astro
        // already emitted in each meta, plus our own hashes of every inline
        // <script>/<style> body (covers is:inline content Astro skips).
        const scriptHashes = new Set<string>()
        const styleHashes = new Set<string>()
        const hashOf = (body: string) =>
          `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`
        for (const { html } of pages) {
          const meta = html.match(
            /http-equiv="content-security-policy" content="([^"]*)"/,
          )
          if (meta) {
            for (const [directive, set] of [
              ['script-src', scriptHashes],
              ['style-src', styleHashes],
            ] as const) {
              const part = meta[1].match(new RegExp(`${directive} ([^;]*)`))
              for (const h of part?.[1].match(/'sha256-[^']*'/g) ?? []) set.add(h)
            }
          }
          for (const m of html.matchAll(
            /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g,
          )) {
            if (m[1].length > 0) scriptHashes.add(hashOf(m[1]))
          }
          for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
            if (m[1].length > 0) styleHashes.add(hashOf(m[1]))
          }
        }

        // Pass 2 — identical policy on every page.
        const scriptSrc = `script-src 'self' https://static.cloudflareinsights.com ${[...scriptHashes].join(' ')}`
        const styleSrc = `style-src 'self' https://fonts.googleapis.com ${[...styleHashes].join(' ')}`
        await Promise.all(
          pages.map(async ({ f, html }) => {
            const metaMatch = html.match(
              /http-equiv="content-security-policy" content="([^"]*)"/,
            )
            if (!metaMatch) return
            let policy = metaMatch[1]
              .replace(/script-src [^;]*/, scriptSrc)
              .replace(/style-src [^;]*/, styleSrc)
            policy += ";style-src-attr 'unsafe-inline'"
            await writeFile(
              f,
              html.replace(
                metaMatch[0],
                `http-equiv="content-security-policy" content="${policy}"`,
              ),
            )
          }),
        )
      },
    },
  }
}

export default defineConfig({
  output: 'static',
  integrations: [solidJs(), cspPostProcess()],
  build: {
    // Keep all stylesheets external so style-src needs no hashes and
    // 'unsafe-inline' below stays effective for style="" attributes
    // (used pervasively for --hue/--tint custom-property hooks, including
    // ones set at runtime by Solid islands).
    inlineStylesheets: 'never',
  },
  security: {
    // Emits a per-page <meta http-equiv="content-security-policy"> with
    // auto-generated hashes for every inline script/style Astro renders.
    // Travels with the HTML, so it covers Cloudflare Pages and the Docker
    // image alike. Header-only directives (frame-ancestors) live in
    // public/_headers and docker/security-headers.conf instead.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: blob:",
        "connect-src 'self' https://cloudflareinsights.com",
        "font-src 'self' https://fonts.gstatic.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: {
        // Cloudflare Web Analytics beacon injected at the edge on Pages
        resources: ["'self'", 'https://static.cloudflareinsights.com'],
      },
      styleDirective: {
        // Scripts stay strictly hashed; styles accept inline attributes.
        // 'unsafe-inline' is only honored because no style hashes are
        // emitted (all stylesheets are external via inlineStylesheets:
        // 'never' above).
        resources: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
