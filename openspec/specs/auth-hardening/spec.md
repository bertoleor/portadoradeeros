# auth-hardening Specification

## Purpose

Cerrar el registro público y restringir el acceso administrativo a una allowlist explícita,
preservando al usuario legítimo existente como admin. Todo acceso admin fuera de la allowlist queda
bloqueado.

## Requirements

### Requirement: Signup cerrado

El sistema MUST mantener el registro público deshabilitado (`disable_signup=true`), de modo que NO
nuevos usuarios puedan auto-registrarse.

(Previously: signup abierto a cualquier visitante — hallazgo S3)

#### Scenario: Visitante intenta registrarse

- GIVEN signup público está deshabilitado en Supabase
- WHEN un anónimo intenta crear una cuenta
- THEN el registro es rechazado y NO se crea la cuenta

### Requirement: Allowlist admin explícita

El acceso administrativo MUST estar restringido a una lista explícita de UIDs autorizados. El UID
del usuario legítimo existente SHALL estar incluido en la allowlist; cualquier otra identidad,
autenticada o no, MUST NOT obtener privilegios admin.

(Previously: privilegios admin asignados por error via `auth.role()` — hallazgos S2/S3)

#### Scenario: Admin legítimo conserva acceso

- GIVEN el UID del usuario existente está en la allowlist
- WHEN ese usuario inicia sesión
- THEN conserva acceso completo a las rutas y acciones administrativas

#### Scenario: Usuario autenticado sin allowlist

- GIVEN un usuario autenticado cuyo UID NO está en la allowlist
- WHEN accede a una ruta o acción admin
- THEN es redirigido/denegado y NO obtiene privilegios admin

#### Scenario: Anónimo intenta acción admin

- GIVEN una sesión anónima (sin autenticación)
- WHEN invoca una acción de servidor o ruta administrativa
- THEN la acción es rechazada con guard de sesión (defensa en profundidad)
