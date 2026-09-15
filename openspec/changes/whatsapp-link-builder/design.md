# Design: WhatsApp Link Builder

## Technical Approach

Single dependency-free pure module `src/lib/whatsapp.ts`. Strip `\D`,
validate length 8–15 (E.164 digit range without `+`), build
`https://wa.me/` URL, append `?text=` only for non-blank messages using
`encodeURIComponent`. Throws on invalid input — fail-fast contract, no
`null` returns, no logging.

## Architecture Decisions

| Option | Tradeoff | Decision |
| ------ | -------- | -------- |
| Throw on invalid vs return `''` | Throw forces callers to handle; `''` hides bugs | **Chosen** — throw `Error`, matches fail-fast; existing `getSocialUrl` returns `''` but is untested legacy, out of scope |
| 8–15 digit rule | E.164 max 15; min 8 covers AR mobile w/o country code | **Chosen** — no per-country tables, keeps function pure and minimal |
| `encodeURIComponent` for message | Standard, no deps | **Chosen** |

## Data Flow

```
caller ──→ buildWhatsAppLink(phone, message?) ──→ wa.me URL string (or throw)
```

No I/O, no state, no side effects.

## File Changes

| File | Action | Description |
| ---- | ------ | ----------- |
| `src/lib/whatsapp.ts` | Create | Pure builder + validation |
| `src/lib/whatsapp.test.ts` | Create | Strict-TDD unit tests |

## Interfaces / Contracts

```ts
export function buildWhatsAppLink(phone: string, message?: string): string;
// throws Error('Invalid WhatsApp phone number') on invalid phone
```

GGA: typed exports, no `any`, no `console.log`, no secrets.

## Testing Strategy

| Layer | What | Approach |
| ----- | ---- | -------- |
| Unit RED | 5 scenarios fail before impl | `pnpm vitest run src/lib/whatsapp.test.ts` → fail (module missing) |
| Unit GREEN | All pass after impl | Same command → pass |
| Suite | No regressions | Full `pnpm test` green |
| Types | Strict clean | `pnpm typecheck` green |
