# 0005 — Shared tool state travels in the URL fragment, not the query

**Status**: Proposed
**Date**: 2026-11-06

## Context

Every tool page has a Share button that copies a link restoring the tool's
current input. The state (deflate + Base64URL, not encrypted) was put in the
query string: `/en/tools/password-strength/?s=…`. A query string is part of
the HTTP request, so whoever opened a shared link sent the tool's input — a
password (password-strength), an rclone-obscured password (reversible), a JWT
(a bearer credential), a certificate, any pasted text — to the host, where it
can land in CDN/edge logs, proxies and server-side analytics. That contradicts
the repository's rule that no user data leaves the browser. Found on
2026-11-06 while fact-checking the user manual.

## Decision

Put the encoded state in the fragment: `…/base64/#s=…`. Browsers never send
the fragment in a request. Links made before keep working: `?s=` is still
read, and on load the page rewrites its own URL (`history.replaceState`) to
move the state into the fragment.

The legacy hash redirect in `BaseLayout.astro` (`/en/#json-formatter` →
`/en/tools/json-formatter/`) used to fire on any fragment of any page; it now
fires only on the home pages and only for a known tool slug, so it no longer
swallows `#s=` or in-page anchors.

## Alternatives considered

- **Keep `?s=`, leave secret fields out of the shared state** — protects the
  obvious secrets only; every other input still reaches the server. Rejected.
- **Encrypt the state with a key in the fragment** — same privacy result as
  moving it to the fragment, with more code. Rejected as unnecessary.
- **Remove sharing** — loses a feature people use. Rejected.

## Consequences

- Opening a shared link sends only the page path; `e2e/share.spec.ts` fails if
  any request made while opening one carries `s=`.
- An old `?s=` link still sends its state once, when opened — unavoidable for
  links already in circulation; the page drops it from the URL immediately.
- The shared link is still a copy of the input: anyone holding it can read it.
  That is inherent to sharing and is the user's choice.
