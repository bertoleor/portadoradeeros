# Migrations — canonical schema & lineage

Dir is the source of truth for the **public** schema of the live Supabase project
`xvwmngtdzuzfnqelcjzf` (portadora-eros).

## Canonical single source (current)

| File                                                                             | Role                                                                                                                                                                    |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`0001_canonical_schema.sql`](./0001_canonical_schema.sql)                       | **Authoritative snapshot** of the live PUBLIC schema (8 tables + indexes + constraints). Reproducible & idempotent. NOT re-run against live — it already matches.       |
| [`migration_security_rls_allowlist.sql`](./migration_security_rls_allowlist.sql) | **Authoritative RLS/policies** + `admin_users` allowlist + `is_admin()` (Slice 1). The canonical RLS source of truth.                                                   |
| [`add_rls_phase10.sql`](./add_rls_phase10.sql)                                   | **Canonical (applied live)** — RLS read-policy on `admin_users` (admin-only SELECT via `is_admin()`, ORN-77). Closes the zero-policies gap on the auth allowlist table. |

`src/types/database.ts` is generated from this live schema (Supabase Management API
`types/typescript` endpoint) and is the typed mirror.

## Legacy / superseded (DO NOT re-run against live)

These historical files were consolidated. They either use the superseded
`auth.role() = 'authenticated'` authorization model, are redundant with the canonical schema, or
were partial ALTERs that the canonical schema already inlines.

| File (root)             | Status     | Superseded by                                                                                                                  |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `supabase_schema.sql`   | LEGACY     | `0001_canonical_schema.sql` + `migration_security_rls_allowlist.sql` (old `auth.role()` policies, no clients/contact_messages) |
| `migration_phase10.sql` | SUPERSEDED | `0001_canonical_schema.sql` (`admin_settings.business_hours` is inline)                                                        |
| `supabase_seed.sql`     | LEGACY     | — seed data; retained for reference only                                                                                       |

| File (`migrations/`)             | Status     | Superseded by                                                                                                       |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `migration_completa_2024.sql`    | LEGACY     | `0001_canonical_schema.sql` + `migration_security_rls_allowlist.sql` (old `auth.role()` policies, storage policies) |
| `migration_clients.sql`          | SUPERSEDED | `0001_canonical_schema.sql` (`clients` + `client_id` FK + indexes inline)                                           |
| `migration_contact_messages.sql` | SUPERSEDED | `0001_canonical_schema.sql` (table inline) + `migration_security_rls_allowlist.sql` (policies)                      |
| `blocked_times.sql`              | SUPERSEDED | `0001_canonical_schema.sql` + `migration_security_rls_allowlist.sql`                                                |
| `fix_admin_settings_schema.sql`  | SUPERSEDED | `0001_canonical_schema.sql` (all `admin_settings` columns inline)                                                   |
| `migration_service_images.sql`   | SUPERSEDED | `0001_canonical_schema.sql` (`services.images` inline)                                                              |
| `push_subscriptions.sql`         | SUPERSEDED | `0001_canonical_schema.sql` (table inline; RLS policies `auth.uid()=admin_id` unchanged)                            |

## Ordering

1. `0001_canonical_schema.sql` — tables, indexes, constraints (idempotent).
2. `migration_security_rls_allowlist.sql` — allowlist + `is_admin()` + RLS policies.
3. `add_rls_phase10.sql` — `admin_users` read policy (idempotent, applied live).

The live DB was built by the legacy files historically; these three files now document and reproduce
that final, consolidated state.

## Not covered by the canonical set (known gap, 2026-09-30)

The `public-images` Storage bucket and its `storage.objects` policies live ONLY in legacy files
(`supabase_schema.sql` L120-135, `migration_completa_2024.sql` L191-216). They are NOT reproducible
from the canonical set: if you rebuild the project from scratch, create the bucket (public read)
manually in the Supabase dashboard. Do NOT re-run the legacy files just for this.
