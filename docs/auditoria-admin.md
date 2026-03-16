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

- 🟡 **Moderado**: Las métricas de "servicio popular" se calculan
