import { defineConfig } from 'astro/config'
import solidJs from '@astrojs/solid-js'
import tailwindcss from '@tailwindcss/vite'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import type { AstroIntegration } from 'astro'

// Two gaps in Astro's built-in CSP generation, both patched post-build:
//
// 1. `is:inline` scripts (theme anti-flash, page-data blobs, Solid hydration
//    bootstrap) are emitted verbatim and NOT hashed, so a hash-based policy
//    kills island hydration. Compute the missing sha256 per page and append
//    it to that page's script-src.
// 2. style="" attributes need the dedicated style-src-attr directive (the
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
        await Promise.all(
          files.map(async (f) => {
            const html = await readFile(f, 'utf8')
            const metaMatch = html.match(
              /http-equiv="content-security-policy" content="([^"]*)"/,
            )
            if (!metaMatch) return
            let policy = metaMatch[1]

            const inlineHashes = [
              ...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g),
            ]
              .map((m) => m[1])
              .filter((body) => body.length > 0)
              .map(
                (body) =>
                  `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`,
              )
            const missing = [...new Set(inlineHashes)].filter(
              (h) => !policy.includes(h),
            )
            if (missing.length > 0) {
              policy = policy.replace(
                /(script-src [^;]*)/,
                `$1 ${missing.join(' ')}`,
              )
            }
            policy += ";style-src-attr 'unsafe-inline'"

            const patched = html.replace(
              metaMatch[0],
              `http-equiv="content-security-policy" content="${policy}"`,
            )
            if (patched !== html) await writeFile(f, patched)
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
