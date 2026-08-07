# Accessibility statement — Tools Collection

**Status of this document:** Approved by the maintainer (Andrea Margiovanni,
2026-08-07). Prepared by Claude (eaa-evidence).

Tools Collection (tools.margiovanni.it) is committed, **voluntarily**, to
making its website accessible in accordance with WCAG 2.2 level AA (EN 301
549). The EAA scope assessment for this project is recorded in `scope.md`.

## Conformance status

**Partially compliant.** All 54 English routes pass automated accessibility
checks with zero violations (axe-core 4.12.1, run 2026-08-07 against the
v1.7.0+a11y build). Automated checking reaches roughly a third of the
applicable success criteria; the manual criteria listed in `manual.md` —
keyboard-only operation, screen-reader announcement, contrast in interactive
states, reflow and zoom — have **not yet been verified by a human** and are
recorded as unchecked. Until they are, "partially compliant" is the honest
status.

## Non-accessible content

No known barriers at the time of writing; the unchecked manual criteria may
surface some. This section must be updated when they do.

## Feedback mechanism

To report an accessibility barrier:
**https://github.com/amargiovanni/tools-collection/issues** (public issue,
label `accessibility`). Reports are read by the repository maintainer.
No account-holding user data is involved — the site has no accounts.

## Enforcement

This is a voluntary conformance statement by an individual open-source
maintainer; the enforcement procedures of Directive (EU) 2016/2102 and the
EAA's market-surveillance mechanisms are not asserted to apply. Persistent
issues can be escalated by opening an issue on the repository.

## Preparation

- Date: 2026-08-07
- Method: self-assessment (automated scan + published evidence trail under
  `compliance/`); manual verification pending
- Tooling: axe-core 4.12.1 via @axe-core/cli, Chrome headless
