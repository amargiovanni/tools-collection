# CLAUDE.md — tools-collection

Client-side only: every tool runs entirely in the visitor's browser. No user
data ever leaves the page — no backend, no telemetry of tool inputs, nothing
uploaded. Any change that would send user data anywhere is a defect.

## Compliance policy (this repo)
- CRA scope: out of scope (free OSS outside commercial activity) — dossier
  maintained voluntarily under `compliance/`, Annex I tracked as advisory
- Evidence dossier: regenerate on every tagged release (cra-evidence W2)
- EAA scope: voluntary, target WCAG 2.2 AA
  - a11y audit routes: all `/en/` routes (home + every tool page)
- Compliance-relevant decisions always produce an ADR (docs/adr/)
- Exceptions: none
