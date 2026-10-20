-- Rollback de emergencia: migration_revoke_admin_users_grants.sql (ORN-226).
--
-- Restaura los grants de tabla amplios previos (estado pre-migración) en
-- public.admin_users para anon y authenticated. WARNING: esto re-introduce
-- el hallazgo P3 de ORN-135 — RLS vuelve a ser la única barrera contra
-- escritura anónima de la allowlist de admins. Solo para rollback de
-- emergencia donde este hardening mismo deba deshacerse; aparear con fix
-- posterior.
--
-- Idempotente por naturaleza: GRANT sobre privilegios ya presentes es no-op.

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON public.admin_users TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON public.admin_users TO authenticated;
