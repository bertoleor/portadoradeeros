# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| main    | ✅        |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, email **bertoleor@github.com** (or open a private security advisory on GitHub).

We will acknowledge receipt within 48 hours and provide a timeline for fix within 5 business days.

## Security Measures Implemented

- **Authentication**: Supabase Auth with RLS (Row Level Security)
- **Authorization**: Server-side RBAC (role hierarchy: super_admin > admin > editor > viewer)
- **Payments**: MercadoPago zero-PAN delegation (no card data stored)
- **Rate Limiting**: In-memory sliding-window per IP+form (`src/lib/spam-protection.ts`); public
  contact & booking forms capped at 5/60s
- **Bot Protection**: Honeypot hidden field (`company_website`) on all public forms, rejected
  silently
- **CSP**: Strict Content Security Policy with nonce per request
- **Cookies**: HttpOnly + Secure + SameSite=Strict (admin) / Lax (public)
- **Headers**: HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff
- **Secrets**: Zod-validated env at boot (fail-closed), no hardcoded secrets
- **Webhooks**: HMAC verification + idempotency + DLQ
- **Audit Logs**: INSERT-only RLS, 1yr retention, security_logs table
- **Dependency Scanning**: Dependabot weekly + GitHub Actions scanning
- **Pre-commit**: lint-staged + ESLint + TypeScript typecheck

## Security Contacts

- Primary: @bertoleor
