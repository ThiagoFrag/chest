# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Chest, please report it privately. Do **not** open a public GitHub issue.

### How to report

Send an email to the maintainer with:

- A clear description of the issue
- Steps to reproduce (PoC if possible)
- Affected version(s) / commit hash
- Impact assessment (what an attacker could do)
- Any suggested fix or mitigation

You can find the maintainer's contact in the repository profile or `package.json` `author` field.

### What to expect

- Acknowledgement within **72 hours**
- Initial assessment within **7 days**
- Coordinated disclosure: we will work with you on a timeline before public disclosure
- Credit in the release notes (unless you prefer to remain anonymous)

## Supported Versions

Chest is in active early development. Only the latest `main` branch and the most recent tagged release receive security updates.

| Version    | Supported |
| ---------- | --------- |
| `main`     | Yes       |
| Latest tag | Yes       |
| Older tags | No        |

## Scope

In scope:

- Authentication and session handling
- RCON key management and Docker socket access
- Egg template parsing and sandbox boundaries
- Panel API endpoints (authz, input validation)
- Container lifecycle and file management

Out of scope:

- Vulnerabilities in upstream dependencies (report those upstream; we will update once patched)
- Issues requiring physical access to the host
- Social engineering against maintainers or users
- Self-XSS or attacks requiring an already-compromised admin account

## Safe Harbor

We support good-faith security research. If you follow this policy, we will not pursue legal action against you for your research. Please:

- Only test against your own instance
- Do not access or modify other users' data
- Do not perform DoS, spam, or destructive testing
- Give us reasonable time to respond before disclosing
