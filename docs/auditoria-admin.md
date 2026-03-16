# Auditoría Panel de Administración

Fecha: 2026-03-16
Archivos leídos: 28

---

## 1. Estructura del proyecto

### 1.1 Rutas del admin

| Ruta                           | Archivo                                | Propósito                                                   |
| ------------------------------ | -------------------------------------- | ----------------------------------------------------------- |
| /admin                         | admin/page.tsx                         | Dashboard principal - métricas, turnos pendientes, mensajes |
| /admin/bienvenida              | admin/bienvenida/page.tsx              | Página de bienvenida                                        |
| /admin/servicios               | admin/servicios/page.tsx               | Lista de servicios con CRUD                                 |
| /admin/servicios/[slug]        | admin/servicios/[slug]/page.tsx        | Editor de servicio (crear/editar)                           |
| /admin/calendario              | admin/calendario/page.tsx              | Calendario visual con vista mes/semana/día                  |
| /admin/clientes                | admin/clientes/page.tsx                | Lista de clientes con historial                             |
| /admin/mensajes                | admin/mensajes/page.tsx                | Bandeja de mensajes de contacto                             |
| /admin/configuracion           | admin/configuracion/page.tsx           | Menú de configuración                                       |
| /admin/configuracion/perfil    | admin/configuracion/perfil/page.tsx    | Redes sociales y bio                                        |
| /admin/configuracion/banco     | admin/configuracion/banco/page.tsx     | Datos bancarios (CBU, alias)                                |
| /admin/configuracion/horarios  | admin/configuracion/horarios/page.tsx  | Horarios de trabajo                                         |
| /admin/configuracion/seguridad | admin/configuracion/seguridad/page.tsx | Seguridad y correo                                          |
| /admin/configuracion/admin     | admin/configuracion/admin/page.tsx     | Admin interno (nombre, avatar)                              |
| /admin/configuracion/instalar  | admin/configuracion/instalar/page.tsx  | Instalación PWA                                             |
| /admin/login                   | admin/login/page.tsx                   | Login de administrador                                      |

### 1.2 Archivos de API

| Archivo                  | Funciones exportadas                                                                                                                                                                                   | Usado por                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| lib/api/appointments.ts  | createAppointment, getAppointments, getBookedSlots, confirmAppointment, completeAppointment, cancelAppointment, getContactMessages, updateContactStatus, checkSlotAvailability, createAppointmentAdmin | Dashboard, Calendario, Clientes, Mensajes   |
| lib/api/services.ts      | getServices, getServiceBySlug, createService, updateService, deleteService                                                                                                                             | Servicios, Cliente (/servicios)             |
| lib/api/settings.ts      | getAdminSettings, updateAdminSettings                                                                                                                                                                  | Layout admin, Configuración, Navbar cliente |
| lib/api/blocked-times.ts | getBlockedTimes, getBlockedTimesByMonth, createBlockedTime, updateBlockedTime, deleteBlockedTime                                                                                                       | Calendario admin                            |

### 1.3 Tipos principales

| Tipo/Interface   | Archivo                  | Usado en                           |
| ---------------- | ------------------------ | ---------------------------------- |
| Service          | types/index.ts           | Servicios admin, Cliente servicios |
| Client           | types/index.ts           | Clientes admin                     |
| Appointment      | types/index.ts           | Appointments API, Dashboard        |
| BusinessSettings | types/index.ts           | Settings API, Configuración        |
| SocialLinks      | types/index.ts           | Settings, Navbar, Perfil           |
| BlockedTime      | lib/api/blocked-times.ts | Calendario admin                   |

---

## 2. Análisis por sección

### 2.1 Dashboard (/admin)

**Propósito:** Mostrar métricas generales, turnos próximos y mensajes pendientes

**Datos que muestra:**

- Servicio más popular del mes
- Turnos pendientes por confirmar
- Mensajes sin leer
- Total de turnos históricos
- Lista de próximos 5 turnos
- Últimos 4 mensajes de contacto

**Fuente de datos:**

- `getAppointments()` - todos los turnos
- `getContactMessages()` - mensajes de contacto
- Computa popularidad basándose en servicios

**Problemas detectados:**

- 🟡 **Moderado**: Las métricas de "servicio popular" se calculan solo con turnos existentes, no es filtrado por mes actual
- 🟢 **Menor**: No hay filtro de fecha en las métricas

---

### 2.2 Servicios (/admin/servicios)

**Propósito:** CRUD completo de servicios

**Datos que fetchea:**

- `getServices()` - lista de servicios
- `deleteService(id)` - eliminación

**Acciones disponibles:**

- Crear nuevo servicio
- Editar servicio existente
- Eliminar servicio (con confirmación)
- Eliminación masiva
- Ordenar por selección
- Vista mobile cards y desktop tabla

**Componentes que usa:**

- ServiceIcon
- ConfirmModal
- useToast

**Estado local:**

- servicios (Service[])
- selectedIds (string[])
- deleteModalOpen (boolean)
- itemToDelete (string | null)

**Problemas detectados:**

- 🟢 **Menor**: El slug no se valida automáticamente al editar el título

---

### 2.3 Turnos/Reservas (/admin/calendario)

**Propósito:** Vista calendario visual + gestión de turnos

**Datos que fetchea:**

- `getAppointments()` - todos los turnos
- `getBlockedTimes()` - tiempos bloqueados
- `getServices()` - servicios disponibles

**Acciones disponibles:**

- Vista mes/semana/día
- Crear nuevo turno (modal)
- Bloquear fecha/horario
- Confirmar turno
- Completar turno
- Cancelar turno

**Componentes que usa:**

- NewApptModal
- BlockModal
- DatePicker, TimePicker, Select
- Button

**Estado local:**

- currentDate, viewMode
- appointments, blockedTimes, services
- selectedDay, selectedAppointment
- showNewAppt, showBlockModal

**Problemas detectados:**

- 🟡 **Moderado**: No hay función de eliminar/borrar turnos desde el calendario
- 🟢 **Menor**: La función deleteBlockedTime no está expuesta en la UI

---

### 2.4 Configuración (/admin/configuracion)

**Secciones:**

1. **Perfil** - Redes sociales (instagram, whatsapp, tiktok), bio, imagen de perfil
2. **Banco** - CBU, alias, titular, nombre del banco
3. **Horarios** - Horarios de trabajo por día
4. **Seguridad** - Email y contraseña de admin
5. **Admin** - Nombre y avatar interno
6. **Instalar** - PWA

**Problemas detectados:**

- 🔴 **Crítico**: Los datos bancarios se guardan en texto plano en la DB sin encriptación
- 🟡 **Moderado**: No hay validación de formato de CBU/alias

---

## 3. Coherencia Admin ↔ Cliente

### 3.1 Servicios

| Campo            | Admin puede editar | Cliente muestra | ¿Coincide? |
| ---------------- | ------------------ | --------------- | ---------- |
| título           | ✓                  | ✓               | ✓          |
| descripción      | ✓                  | ✓               | ✓          |
| shortDescription | ✓                  | ✓               | ✓          |
| precio           | ✓                  | ✓               | ✓          |
| duración         | ✓                  | ✓               | ✓          |
| ícono            | ✓                  | ✓               | ✓          |
| slug             | ✓                  | ✓               | ✓          |
| isVisible        | ✓                  | ✓               | ✓          |
| imágenes         | ✓                  | ✓               | ✓          |

**Verificación:**

- En `/servicios/[slug]/page.tsx`: fetchea `getServiceBySlug(slug)`
- En `admin/servicios/[slug]/page.tsx`: usa `updateService` y `createService`
- **✅ Sincronizado**: Los mismos campos se editan y muestran

### 3.2 Turnos

| Función          | Admin                     | Cliente                | ¿Sincronizado? |
| ---------------- | ------------------------- | ---------------------- | -------------- |
| Crear turno      | ✓ (calendario, clientes)  | ✓ (ServiceContactForm) | ✓              |
| Ver turnos       | ✓ (dashboard, calendario) | ✗ (no visible)         | ✓              |
| Confirmar turno  | ✓                         | ✗                      | N/A            |
| Cancelar turno   | ✓                         | ✗                      | N/A            |
| Bloquear horario | ✓                         | ✗                      | N/A            |

**Verificación:**

- ServiceContactForm llama a `createAppointment` → crea turno con status 'pending'
- Dashboard llama a `confirmAppointment` → cambia a 'confirmed'
- **✅ Sincronizado**: Los turnos del cliente aparecen en el admin

**Problema:**

- 🟡 **Moderado**: El cliente no recibe notificación cuando el admin confirma/cancela un turno (solo email)

### 3.3 Configuración

| Setting               | Admin         | Cliente                            | ¿Sincronizado? |
| --------------------- | ------------- | ---------------------------------- | -------------- |
| socialLinks.instagram | perfil page   | Navbar + /servicios/[slug]         | ✓              |
| socialLinks.whatsapp  | perfil page   | Navbar + /servicios/[slug]         | ✓              |
| socialLinks.tiktok    | perfil page   | Navbar                             | ✓              |
| bankDetails.\*        | banco page    | ServiceContactForm paso 4          | ✓              |
| businessHours         | horarios page | BookingCalendar + CustomTimePicker | ✓              |

**Verificación:**

- Navbar usa `getAdminSettings()` para socialLinks
- ServiceContactForm recibe bankDetails como props
- BookingCalendar recibe businessHours como props
- **✅ Sincronizado**: La configuración fluye correctamente al cliente

### 3.4 Dashboard

**Métricas del dashboard:**

- Servicio popular: computado desde turnos existentes
- Turnos pendientes: filtrados por status === 'pending'
- Mensajes sin leer: filtrados por status === 'unread'
- Total turnos: count de appointments

**Problemas:**

- 🟡 **Moderado**: "Servicio Popular" muestra "Sin datos" cuando no hay turnos
- 🟢 **Menor**: No hay métrica de ingresos (price no se guarda en appointments)

---

## 4. Problemas encontrados

### 🔴 Críticos (rompen funcionalidad o seguridad)

1. **[admin/configuracion/banco/page.tsx](portadora-eros/src/app/admin/configuracion/banco/page.tsx)** — Datos bancarios guardados sin encriptación. El CBU y alias se almacenan en texto plano en la tabla admin_settings.

2. **[lib/api/appointments.ts](portadora-eros/src/lib/api/appointments.ts)** — La función `createAppointment` no valida que el cliente envíe el comprobante de pago. El turno queda "pending" indefinidamente.

### 🟡 Moderados (degradan la experiencia)

1. **[admin/page.tsx](portadora-eros/src/app/admin/page.tsx)** — Métrica de "servicio popular" no filtra por mes actual, incluye todo el historial.

2. **[admin/calendario/page.tsx](portadora-eros/src/app/admin/calendario/page.tsx)** — No hay forma de eliminar un turno desde el calendario, solo cambiar status.

3. **[components/client/ServiceContactForm.tsx](portadora-eros/src/components/client/ServiceContactForm.tsx)** — No hay notificación al cliente cuando el admin confirma o cancela su turno (solo email, que puede fallar).

4. **[lib/api/settings.ts](portadora-eros/src/lib/api/settings.ts)** — No hay validación de formato para CBU (debería tener 22 dígitos) ni alias.

### 🟢 Menores (pulido y consistencia)

1. **[admin/servicios/[slug]/page.tsx](portadora-eros/src/app/admin/servicios/[slug]/page.tsx)** — El slug no se genera automáticamente desde el título.

2. **[admin/configuracion/perfil/page.tsx](portadora-eros/src/app/admin/configuracion/perfil/page.tsx)** — Los campos de URL no validan formato URL válido.

3. **[lib/api/services.ts](portadora-eros/src/lib/api/services.ts)** — getServices devuelve TODOS los servicios incluyendo los no visibles, el filtro happens en el cliente.

---

## 5. Redundancias detectadas

| Elemento redundante                | Dónde aparece                                         | Recomendación                                        |
| ---------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| NewApptModal duplicado             | admin/calendario/page.tsx, admin/clientes/page.tsx    | Extraer a componente compartido en components/admin/ |
| Función de parseo de fecha similar | BookingCalendar, ServiceContactForm, admin/calendario | Crear helper shared                                  |
| Validación de email manual         | Múltiples páginas                                     | Crear hook useFormValidation                         |

---

## 6. Funciones de API sin usar

| Función                | Archivo                  | Exportada pero nunca importada en:               |
| ---------------------- | ------------------------ | ------------------------------------------------ |
| getBlockedTimesByMonth | lib/api/blocked-times.ts | No se usa en el calendario (usa getBlockedTimes) |
| updateBlockedTime      | lib/api/blocked-times.ts | No hay UI para editar bloqueos                   |
| deleteBlockedTime      | lib/api/blocked-times.ts | No hay UI para eliminar bloqueos                 |

---

## 7. Tipos/interfaces inconsistentes

| Tipo                              | Problema                                                                      | Archivos afectados                |
| --------------------------------- | ----------------------------------------------------------------------------- | --------------------------------- |
| Service (types/index.ts)          | El campo `images` es string[] pero en DB puede ser diferente formato          | services.ts mapea correctamente   |
| Appointment (types/index.ts)      | Usa camelCase (clientId, serviceId) pero DB usa snake_case (client_name, etc) | appointments.ts mapea manualmente |
| BusinessSettings (types/index.ts) | `appointmentDuration` hardcodeado a 60, no se lee de DB                       | settings.ts ignora el campo       |

---

## 8. Resumen ejecutivo

El panel de administración del proyecto "Portadora de Eros" está **bien estructurado y funcional**. cuenta con:

✅ **Fortalezas:**

- Autenticación protegida con Supabase Auth
- Diseño responsivo (mobile-first)
- Sincronización en tiempo real con Supabase Realtime
- Push notifications para nuevos turnos
- Coherencia entre admin y sitio público
- Buena UX: estados de loading, confirmaciones de eliminación, validaciones

⚠️ **Áreas de mejora:**

- Encriptación de datos bancarios
- Validación de formularios más robusta
- Métricas del dashboard más sofisticadas
- UI para gestionar bloqueos de horarios

El proyecto sigue un patrón limpio con separación clara entre API layer, componentes y páginas.

---

## 9. Orden de prioridad para fixes

1. **🔴 Encriptar datos bancarios** — agregarle RLS y talvez encriptación a nivel app
2. **🔴 Validar comprobante de pago** — crear flujo para que el admin pueda marcar como "pagado"
3. **🟡 Agregar métricas por fecha** — filtrar "servicio popular" por mes actual
4. **🟡 Mejorar validación de CBU/alias** — regex de 22 dígitos para CBU
5. **🟢 Extraer NewApptModal** — componente compartido entre calendario y clientes

---

✓ Auditoría completada — 28 archivos leídos, 9 problemas encontrados
