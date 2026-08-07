# Security Policy

Tools Collection is a free, open-source set of browser-based utilities. All
processing happens client-side: the product has no backend, no accounts and no
server-side data. Security issues are still possible — in the shipped
JavaScript, the build pipeline, the published Docker image or the supply
chain — and reports are very welcome.

## Reporting a vulnerability

Report privately via **[GitHub private vulnerability reporting](https://github.com/amargiovanni/tools-collection/security/advisories/new)**.

Please include, as far as you can:

- The tool/page and version (or commit) affected
- What an attacker can achieve, and what access or user interaction they need
- Steps to reproduce, or a proof of concept
- Whether the issue is, to your knowledge, already public or being exploited

Please do **not** open a public issue for a security report.

## What we commit to

This is a maintainer-run open-source project; the targets below are honest
rather than ambitious.

| Stage | Target |
|---|---|
| Acknowledgement of your report | 5 business days |
| Initial assessment shared with you | 15 business days |
| Fix or mitigation for a confirmed high-severity issue | 90 days, or sooner where exploitation is observed |
| Public disclosure | Coordinated with you, normally after a fix is available |

You will be credited in the advisory unless you ask not to be.

## Scope

**In scope:** this repository, the deployed site (tools.margiovanni.it), and
the published Docker image (`ghcr.io/amargiovanni/tools-collection`).

**Out of scope:** findings from automated scanners with no demonstrated
impact; denial of service by volume; issues exclusively in third-party
platforms we do not operate (Cloudflare, GitHub); vulnerabilities in
dependencies with no reachable path in this product (see
`compliance/vulns/` for how we triage those).

## Safe harbour

We will not pursue or support legal action against researchers who act in
good faith under this policy: who avoid privacy violations, data destruction
and service interruption, and who give us reasonable time to respond before
disclosing publicly.

---

*Last reviewed: 2026-08-07 · Approved by the repository maintainer · Owner: repository maintainer*
