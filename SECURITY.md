# Security Policy

This is a personal project maintained by Marie — a GRC and Application Security professional and OWASP community member.
Even for a personal recipe webapp, secure-by-default practices are a baseline expectation, not an afterthought.

---

## Reporting a Vulnerability or Security Concern

If you spot a security issue, open a [GitHub Issue](https://github.com/TheCyberLeader/recipes/issues) with the label `security`.

No sensitive data is processed by this app, but all reports are taken seriously.

---

## Threat Model

This is a static site served via GitHub Pages with no backend, no authentication, and no user data collection.

**In scope:**
- Client-side XSS via recipe content rendering
- Vulnerable or malicious npm dependencies (build-time)
- Sensitive data accidentally committed (credentials, tokens)
- Insecure content injection patterns in JavaScript

**Out of scope:**
- Server-side attacks (no server exists)
- Authentication/authorization bypass (no auth exists)
- DDoS (handled by GitHub infrastructure)

---

## Secure Coding Practices

### 1. Output Encoding — XSS Prevention (OWASP A03)
- All recipe content rendered via `innerHTML` **must** pass through `escapeHtml()` before injection
- Never introduce raw `innerHTML`, `document.write()`, or `eval()` calls without encoding
- Prefer `textContent` over `innerHTML` wherever rich HTML rendering is not needed
- Avoid inline `style` attributes in dynamically injected HTML — use CSS classes instead
- Reference: [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

### 2. Content Security Policy (OWASP A05)
A `<meta>` CSP tag is maintained in `docs/index.html` since GitHub Pages does not support custom HTTP headers:

```
default-src 'none';
script-src 'self';
style-src 'self';
img-src 'self' data:;
connect-src 'self';
font-src 'self';
```

- Do not weaken the CSP (e.g. adding `'unsafe-inline'` or `'unsafe-eval'`) without strong justification
- Review the CSP whenever adding new external resources, fonts, or scripts
- Reference: [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

### 3. Input Validation (OWASP A03 / A04)
- Validate at system boundaries — recipe Markdown files are the external input surface
- The build script (`scripts/build-recipes.js`) and webapp JS should reject or sanitize malformed recipe data
- Never trust that a `.md` file is well-formed; validate structure before rendering
- Reference: [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

### 4. Dependency Security (OWASP A06)
- Pin all npm dependencies to specific versions in `package.json`
- Run `npm audit` before adding or updating any package
- Do not add dependencies that are unmaintained or have known high/critical CVEs
- Prefer zero-dependency solutions for simple utilities
- Reference: [OWASP Vulnerable and Outdated Components](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/)

### 5. Secrets Management (OWASP A02 / A07)
- **No API keys, tokens, passwords, or credentials** may ever be committed to this repo
- `.gitignore` must cover `.env` files, credential files, and local config
- If a secret is accidentally committed: rotate it immediately, then scrub git history
- Reference: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

### 6. Secure by Default
- New JavaScript features must not introduce new `innerHTML` sinks without encoding
- Avoid `setTimeout` / `setInterval` with string arguments (treated as `eval`)
- External URLs, if ever added, must use `rel="noopener noreferrer"`
- Reference: [OWASP DOM-based XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html)

---

## Security Checklist (Pre-Push)

- [ ] No credentials, tokens, or `.env` files staged
- [ ] Any new `innerHTML` usage passes through `escapeHtml()`
- [ ] No inline `style` attributes in dynamically injected HTML
- [ ] `npm audit` run if `package.json` changed
- [ ] CSP `<meta>` tag still present in `docs/index.html` and not weakened
- [ ] No new `eval()`, `document.write()`, or dynamic script injection introduced

---

## OWASP Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP WSTG (Web Security Testing Guide)](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP SAMM (Software Assurance Maturity Model)](https://owaspsamm.org/)
