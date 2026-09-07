# Migrations — canonical schema & lineage

Dir is the source of truth for the **public** schema of the live Supabase
project `xvwmngtdzuzfnqelcjzf` (portadora-eros).

## Canonical single source (current)

| File | Role |
|------|------|
| [`0001_canonical_schema.sql`](./0001_canonical_schema.sql) | **Authoritative snapshot** of the live PUBLIC schema (8 tables + indexes + constraints). Reproducible & idempotent. NOT re-run against live — it already matches. |
| [`migration_security_rls_allowlist.sql`](./migration_security_rls_allowlist.sql) | **Authoritative RLS/policies** + `admin_users` allowlist + `is_admin()` (Slice 1). The canonical RLS source of truth. |

`src/types/database.ts` is generated from this live schema (Supabase
Management API `types/typescript` endpoint) and is the typed mirror.

## Legacy / superseded (DO NOT re-run against live)

These historical files were consolidated. They either use the
superseded `auth.role() = 'authenticated'` authorization model, are
redundant with the canonical schema, or were partial ALTERs that the
canonical schema already inlines.

| File (root) | Status | Superseded by |
|-------------|--------|---------------|
| `supabase_schema.sql` | LEGACY | `0001_canonical_schema.sql` + `migration_security_rls_allowlist.sql` (old `auth.role()` policies, no clients/contact_messages) |
| `migration_phase10.sql` | SUPERSEDED | `0001_canonical_schema.sql` (`admin_settings.business_hours` is inline) |
| `supabase_seed.sql` | LEGACY | — seed data; retained for reference only |

| File (`migrations/`) | Status | Superseded by |
|----------------------|--------|---------------|
| `migration_completa_2024.sql` | LEGACY | `0001_canonical_schema.sql` + `migration_security_rls_allowlist.sql` (old `auth.role()` policies, storage policies) |
| `migration_clients.sql` | SUPERSEDED | `0001_canonical_schema.sql` (`clients` + `client_id` FK + indexes inline) |
| `migration_contact_messages.sql` | SUPERSEDED | `0001_canonical_schema.sql` (table inline) + `migration_security_rls_allowlist.sql` (policies) |
| `blocked_times.sql` | SUPERSEDED | `0001_canonical_schema.sql` + `migration_security_rls_allowlist.sql` |
| `fix_admin_settings_schema.sql` | SUPERSEDED | `0001_canonical_schema.sql` (all `admin_settings` columns inline) |
| `migration_service_images.sql` | SUPERSEDED | `0001_canonical_schema.sql` (`services.images` inline) |
| `push_subscriptions.sql` | SUPERSEDED | `0001_canonical_schema.sql` (table inline; RLS policies `auth.uid()=admin_id` unchanged) |

## Ordering

1. `0001_canonical_schema.sql` — tables, indexes, constraints (idempotent).
2. `migration_security_rls_allowlist.sql` — allowlist + `is_admin()` + RLS policies.

The live DB was built by the legacy files historically; these two files now
document and reproduce that final, consolidated state.