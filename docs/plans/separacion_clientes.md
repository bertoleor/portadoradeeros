# Plan: Separación de Clientes y Turnos

## Objetivo

Separar la lógica de clientes de turnos, permitir unificación por teléfono O correo, y crear
histórico de clientes.

---

## 1. Base de Datos

### 1.1 Nueva tabla `clients`

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  surname TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Uniqueness: either email OR phone must be unique
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX idx_clients_phone ON clients(phone) WHERE phone IS NOT NULL;
```

### 1.2 Modificar tabla `appointments`

- Agregar `client_id` (UUID, FK a clients)
- Mantener `client_name`, `client_email`, `client_phone` para backwards compatibility
- El `client_name` se llenará desde `clients` si existe

---

## 2. Lógica de Unificación

### 2.1 Al crear turno desde admin:

1. **Buscar cliente existente**:
   - Buscar por teléfono (sin códigos de país: 54, 11, etc.)
   - Si no found, buscar por email
2. **Si existe**: Usar ese `client_id`
3. **Si no existe**: Crear nuevo cliente y usar su `id`

### 2.2 Al crear turno desde cliente (público):

- Same logic - buscar o crear cliente

### 2.3 Normalización de teléfono:

- Guardar solo dígitos: "+54 11 1234-5678" → "541112345678"
- Buscar ignorando: 0, +, 54, 11

---

## 3. Página de Clientes

### 3.1 Estructura propuesta:

```
/admin/clientes/
├── page.tsx (lista de clientes)
└── [id]/page.tsx (detalle del cliente)
```

### 3.2 Lista de clientes (`/admin/clientes/`):

- Buscador por nombre, email, teléfono
- Tarjetas con:
  - Nombre completo
  - Email / Teléfono
  - Total de turnos
  - Último turno
  - Estado: Activo / Inactivo (sin turnos en 6 meses)
- Click → Ir a detalle

### 3.3 Detalle del cliente (`/admin/clientes/[id]/`):

- **Header**: Nombre, email, teléfono, botones editar
- **Tabs**:
  - **Próximos turnos**: Pendientes + Confirmados futuros
  - **Historial**: Turnos completados
  - **Cancelados**: Turnos cancelados
- **Acciones**:
  - Editar datos
  - Crear nuevo turno
  - Ver historial completo

---

## 4. Estados de Turnos (sin cambios)

| Estado    | Descripción                | ¿Aparece en? |
| --------- | -------------------------- | ------------ |
| pending   | Turno nuevo, sin confirmar | Próximos     |
| confirmed | Turno confirmado           | Próximos     |
| completed | Turno ya realizado         | Historial    |
| cancelled | Turno cancelado            | Cancelados   |

---

## 5. API Functions a crear/modificar

### 5.1 En `appointments.ts`:

```typescript
// Nuevas funciones:
- getClientByPhone(phone: string): Client | null
- getClientByEmail(email: string): Client | null
- findOrCreateClient(data: ClientData): Client
- getClientById(id: string): ClientWithAppointments
- updateClient(id: string, data: Partial<ClientData>): Client

// Modificar:
- createAppointmentAdmin() - agregar findOrCreateClient
- createAppointment() (público) - agregar findOrCreateClient
```

### 5.2 Nueva interfaz:

```typescript
interface Client {
  id: string;
  name: string;
  surname: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientWithAppointments extends Client {
  upcoming: Appointment[]; // pending + confirmed futuros
  history: Appointment[]; // completed
  cancelled: Appointment[]; // cancelled
  stats: {
    total: number;
    completed: number;
    cancelled: number;
    lastAppointment: string | null;
  };
}
```

---

## 6. Migration SQL

```sql
-- 1. Crear tabla clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  surname TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agregar client_id a appointments
ALTER TABLE appointments
ADD COLUMN client_id UUID REFERENCES clients(id);

-- 3. Migrar datos existentes (una vez)
-- Esto填充已有的 client_id basado en email/phone

-- 4. Índices
CREATE INDEX idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX idx_clients_phone ON clients(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
```

---

## 7. Orden de Implementación

1. **Fase 1**: Migration y crear tabla clients
2. **Fase 2**: Funciones API (findOrCreateClient, getClientById, etc.)
3. **Fase 3**: Modificar createAppointment para usar clientes
4. **Fase 4**: Nueva página de detalle de cliente (/admin/clientes/[id])
5. **Fase 5**: Actualizar lista de clientes para usar la nueva tabla

---

## 8. Consideraciones

- **Backwards compatibility**: Mantener campos old en appointments
- **Performance**: Índices en phone y email para búsquedas rápidas
- **UX**: Al buscar cliente, mostrar sugerencias si hay similares
- **Datos existentes**: Migrar clientes únicos primero

---

## Preguntas para confirmar:

1. ¿Cuántos clientes aprox. tenés en la base actual?
2. ¿Querés que migremos los clientes existentes a la nueva tabla automáticamente?
3. ¿La página de clientes actual está bien renombrar a "Todos los clientes" y crear una nueva
   "/admin/clientes/[id]" para detalles?
