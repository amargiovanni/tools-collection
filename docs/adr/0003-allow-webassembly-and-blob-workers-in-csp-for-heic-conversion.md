# 0003 — Allow WebAssembly and blob: workers in the CSP for HEIC conversion

**Status**: Proposed
**Date**: 2026-10-23

## Context

The HEIC to JPG tool converts iPhone photos in the browser, in line with the
client-side-only policy. Browsers other than Safari cannot decode HEIC
natively, so decoding needs libheif compiled to WebAssembly, shipped through
`heic-to` (CSP build, `heic-to/csp`). That build compiles the WebAssembly
module inside a Web Worker created from a `blob:` URL.

The site-wide policy (Annex I.2k exploitation mitigation, `astro.config.ts`)
allows neither: `script-src` has no `'wasm-unsafe-eval'`, so
`WebAssembly.compile`/`instantiate` is refused, and with no `worker-src` the
worker falls back to `script-src`, which does not allow `blob:`. Because the
ClientRouter runs the destination page's scripts under the current page's
policy, every page carries the same policy: a relaxation cannot be limited to
the tool's page.

## Decision

Add `'wasm-unsafe-eval'` to `script-src` and a `worker-src 'self' blob:`
directive to the policy emitted on every page.

`'wasm-unsafe-eval'` only permits compiling WebAssembly: `eval()`,
`new Function()` and string timers stay blocked, and script sources remain
`'self'` plus hashes. A `blob:` URL can only be created by script already
running on the page, so `worker-src blob:` adds no new way to load third-party
code.

## Alternatives considered

- **Keep the policy, use `heic2any`** — older libheif, unmaintained since 2023,
  and still needs WebAssembly: does not avoid the change.
- **Decode server-side** — violates the client-side-only policy; rejected.
- **Per-page policy for the tool only** — breaks ClientRouter navigation into
  the tool page (the lesson behind the union-of-hashes design); rejected.
- **Self-hosted worker file instead of `blob:`** — would need a fork or a
  custom build of `heic-to`; possible later if `blob:` becomes a concern.

## Consequences

- Annex I.2k stays conformant with a documented relaxation; the dossier entry
  should cite this ADR at the next evidence regeneration.
- `e2e/tools/heic-to-jpg.spec.ts` asserts the conversion runs with no CSP
  violations, guarding the directives against regressions.
- `heic-to`, libheif and libde265 are LGPL-3.0, loaded as a separate lazy
  chunk; the licensing fit with the MIT project is part of accepting this ADR.
  The shipped site carries the LGPL/GPL texts and a notice with source links
  under `/licenses/heic-to/`, linked from the tool page; a unit test fails if
  the notice falls out of sync with the installed `heic-to` version.
- If the HEIC tool is removed, both directives should be removed with it.
