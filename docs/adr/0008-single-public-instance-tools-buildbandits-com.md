# 0008 — Single public instance at tools.buildbandits.com

**Status**: Proposed
**Date**: 2026-11-06

## Context

The repository moved to the BuildBandits organisation
(`BuildBandits/tools-collection`). The site was served from two personal
domains, each by its own Cloudflare Pages project: the one named in the
dossier, `SECURITY.md` and `security.txt`, and a second one run by the other
maintainer. Neither belongs to the organisation that now owns the code.

Astro's `site` was never set, so every page's canonical and `hreflang` links
pointed at the placeholder `https://tools.example.com`.

## Decision

`https://tools.buildbandits.com` is the only public instance. It is built by a
Cloudflare Pages project connected to `BuildBandits/tools-collection`, with
Cloudflare Web Analytics enabled as before.

Both former domains answer with a permanent redirect (301, path and query kept)
to the same path on `tools.buildbandits.com`, so existing bookmarks and share
links keep working; the tool input in a share link travels in the `#` fragment
(ADR 0005), which browsers carry across the redirect without sending it to
either host.

`astro.config.ts` sets `site` to the new origin. Every reference in the
dossier, `SECURITY.md`, `security.txt` and the GitHub Pages landing names it.

## Alternatives considered

- **Keep both personal instances** — two deployments to keep in sync and two
  security scopes for one product; rejected.
- **Serve the new domain from one of the existing Pages projects** — keeps the
  build tied to a personal Cloudflare account; rejected.

## Consequences

- Canonical links are correct. Self-hosted copies (Docker image) also declare
  `tools.buildbandits.com` as canonical, which is intended: there is one
  official instance.
- The security scope in `SECURITY.md` and the `Canonical:` field of
  `security.txt` change to the new domain; `security.txt` served from the old
  domains redirects to it.
- The PDF manual's QR-code screenshot no longer encodes a deployment URL
  (`example.com`); the PDF picks it up at its next rebuild.
