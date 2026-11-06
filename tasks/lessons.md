# Lessons

## 2026-08-07 — Per-page CSP hashes break under a client-side router

**What went wrong:** shipped a per-page hashed CSP (Astro `security.csp` +
post-build hash patching). Production tools became unusable: Astro's
ClientRouter (view transitions) executes the *destination* page's inline
scripts under the *current* page's policy, whose hash list doesn't include
them. Direct-load e2e tests all passed; the breakage only occurs on SPA-style
navigation between pages.

**Why it happened:** the e2e suite exercised direct page loads only, and the
deploy went out without a post-deploy check on the live site.

**Rules (checkable):**
1. Before shipping any per-page security policy (CSP hashes/nonces, integrity
   attributes), run an e2e that **navigates between at least two pages via the
   client router** and interacts with an island on the destination page.
2. Any change to CSP or response headers ships only with a page→page
   navigation test in `e2e/security.spec.ts` — a direct-load test alone does
   not count as coverage for it.
3. After every production deploy that touches security headers or the HTML
   head, verify one home→tool navigation on the live site before declaring
   done.
4. CSP hash lists must be identical on every page (union across the site),
   never per-page, as long as a client router is in use.

## 2026-08-07 — npm on macOS silently drops platform-specific optional deps

**What went wrong:** `npm update js-yaml svgo` on macOS rewrote the lockfile
without the `@emnapi/*` wasm32/linux entries; `npm ci` then failed on Linux
(CI and Cloudflare Pages), blocking every deploy while a broken deploy was
live. Local `npm ci` passes because darwin never needs those entries.

**Rules (checkable):**
1. After any locally-run command that rewrites `package-lock.json`
   (`npm install`, `npm update`, `npm version`), run
   `git diff package-lock.json | grep '^-.*"node_modules/'` — deleted entries
   that are platform-specific (`wasm32`, `linux`, `win32`, `@emnapi`,
   `@napi-rs`) must be grafted back from the previous lockfile before commit.
2. Dependabot-authored lockfiles are regenerated on Linux and are trustworthy;
   prefer `@dependabot recreate` over resolving its lockfile conflicts locally.

## 2026-08-07 — "Bypassed rule violations" means main CI is red

**What went wrong:** three consecutive pushes to main carried the warning
`remote: Bypassed rule violations ... Required status check "Test & Build"`,
which means the required check was NOT green. Pushing continued regardless,
stacking commits on a broken main while production served a broken deploy.

**Rule (checkable):** when a `git push` prints "Bypassed rule violations",
stop; check the latest main workflow run; do not push again until the cause
of the red check is identified.
