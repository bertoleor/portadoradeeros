# EROS — Code Review Rules (GGA)
Stack: Next 16.1 / React 19 / TS strict / Tailwind v4 / Supabase / zod 4.
Canon: `E:/Hermes/AGENTS.md` (Gentleman gates rigen en este repo).

## General
REJECT if:
- Hardcoded secrets or credentials
- `any` type or missing types on exported functions
- Empty catch blocks
- `console.log` in production code (use logger)

## Frontend
REJECT if:
- `style=` inline or hardcoded hex in className (use Tailwind + `cn()`)
- `!important` in CSS

## Pagos y reservas
REJECT if:
- Card or personal data logged
- Webhook without signature verification
- Booking path without idempotency key
- sitemap/robots domain differs from canonical layout domain

## Response Format
FIRST LINE must be exactly:
STATUS: PASSED
or
STATUS: FAILED

If FAILED, list: `file:line - rule violated - issue`
