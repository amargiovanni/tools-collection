# 0002 — Accept unfixable build-time and base-image CVEs, time-boxed

**Status:** Proposed
**Date:** 2026-08-07

## Context

The v1.7.0 release evidence (grype scans in `compliance/sbom/`) leaves nine
findings with no upstream fix available at scan time:

- **3 Go-toolchain findings** (GO-2026-4970, GO-2026-5856, GO-2026-5970)
  embedded in the `tsc` binary of TypeScript 7's native compiler — a
  dev-dependency executed only on developer machines and CI, never shipped.
- **6 CVEs in the `nginx:alpine` base image** (4× libtiff, 1× busybox,
  1× nghttp2) of the published container. The shipped configuration serves
  static files only: no image processing, no HTTP/2, no request-driven paths
  into the affected libraries.

The product is a fully static, client-side site; none of these findings has a
reachable code path in what users receive.

## Decision

We accept all nine findings, time-boxed with re-review by **2026-09-07**,
relying on the existing automated healing channels: dependabot bumps for
`typescript`, and base-image refresh on every `main` push for the container.
Individual records: `compliance/vulns/GO-*.md` and `compliance/vulns/CVE-*.md`.

## Alternatives considered

- **Pin TypeScript back to 6.x** — reintroduces the JS compiler, loses the
  7.x toolchain the release just adopted, and the findings are dev-only:
  cost out of proportion to exposure.
- **Switch base image (distroless/nginx-slim)** — viable long-term hardening,
  but a distribution change deserving its own decision, not a rushed response
  to unreachable CVEs; would also not fix busybox-class findings in any
  musl-based image.
- **Vendor patched libraries into the image** — creates a bespoke supply
  chain we would then own; worst option for a maintainer-run project.

## Consequences

- `compliance/vulns/` records point here; the dossier register cites this ADR.
- The 2026-09-07 re-review is a hard date: if upstream fixes exist by then,
  the accepts convert to fixes; if not, this ADR is re-confirmed or superseded.
- Base-image hardening (distroless evaluation) is noted as candidate future work.
