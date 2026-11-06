# 0007 — Renew the busybox accept and drop wget from the container image

**Status**: Accepted
**Date**: 2026-11-06
**Deciders**: Andrea Margiovanni (maintainer); Claude listed as drafter, not decider

## Context

CVE-2025-60876 (Medium) is a CRLF/header-injection flaw in busybox's `wget`
client when it is handed an attacker-controlled URL. It affects the busybox,
busybox-binsh and ssl_client packages of the `nginx:alpine` base image of the
published container. ADR 0002 accepted it with a re-review by 2026-09-07; that
date passed without a re-review. On 2026-11-06 the newest `nginx:alpine`
(Alpine 3.24.4) still ships busybox 1.37.0-r31 and `apk` offers no upgrade.

Nothing in the image runs `wget`: there is no healthcheck, the nginx entrypoint
scripts and `docker/default-language.sh` do not use it, and nginx only serves
static files. The flaw is not reachable in the shipped configuration. The
Cloudflare Pages deployment does not use the image at all.

## Decision

1. Remove the `wget` applet link and the `ssl_client` helper from the image,
   with a build-time assertion that fails the build if either is present.
2. Keep accepting the CVE until Alpine ships a fixed busybox, re-reviewed at
   the next release or by **2026-12-07**, whichever comes first. The image is
   rebuilt from `nginx:alpine` on every push to main, so the fix flows in by
   itself.

## Alternatives considered

- **Wait without hardening** — leaves an unneeded network client in the image.
  Rejected: removing it costs one line.
- **Switch to a distroless or scratch-based nginx image** — removes busybox
  altogether but breaks the shell entrypoint that writes `default-language.js`
  and changes the image's operational model. Rejected for now.
- **Build busybox from source with the upstream patch** — maintenance burden
  out of proportion to a Medium, unreachable finding. Rejected.

## Consequences

- Scanners keep reporting CVE-2025-60876, because they match the busybox
  package version; the vulnerable code can no longer be executed in the image.
- Anyone extending the image who needs `wget` must reinstall it deliberately.
- Re-review is due 2026-12-07 at the latest.
