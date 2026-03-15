# AUDITORÍA COMPLETA DEL PROYECTO "PORTADORA DE EROS"

**Fecha de auditoría:** 10 de Marzo 2026  
**Versión del análisis:** Actualización post-correcciones  
**Estado del proyecto:** En producción con mejoras pendientes

---

## RESUMEN EJECUTIVO

El proyecto "Portadora de Eros" es un sitio web de servicios espirituales construido con Next.js 14, Supabase (Base de datos, Auth, Storage) y Resend para emails. Tras las correcciones anteriores, el proyecto cuenta con:

- ✅ Autenticación real con Supabase Auth
- ✅ Panel de administración de servicios conectado a Supabase
- ✅ Sistema de turnos con calendario
- ✅ Políticas RLS configuradas
- ✅ Formularios de contacto y agendado

**Sin embargo, se han identificado múltiples problemas críticos, inconsistencias estéticas, deuda técnica y funciones faltantes que se detallan a continuación.**

---

## 1. PROBLEMAS CRÍTICOS (Bugs que generan errores)

### 1.1 Tabla `contact_messages` no existe en la base de datos

**Severidad:** CRÍTICA  
**Ubicación:** [`lib/api/appointments.ts:223-247`](../portadora-eros/src/lib/api/appointments.ts#L223)

El código hace referencia a funciones que interactúan con una tabla `contact_messages`:
```typescript
export async function getContactMessages() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contact_messages')  // ❌ ESTA TABLA NO EXISTE
```

**Impacto:** El formulario de contacto en [`app/contacto/page.tsx`](../portadora-eros/src/app/contacto/page.tsx) usa `/api/contact` que depende de estas funciones.

**Solución:** Ejecutar la migración para crear la tabla:
```sql
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Política pública para inserción
CREATE POLICY "Cualquiera puede enviar mensajes" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Política para que admin lea
CREATE POLICY "Admin puede leer mensajes" ON public.contact_messages FOR SELECT USING (auth.role() = 'authenticated');

-- Política para que admin actualice estado
CREATE POLICY "Admin puede actualizar mensajes" ON public.contact_messages FOR UPDATE USING (auth.role() = 'authenticated');
```

---

### 1.2 Service ID incorrecto en el formulario de agendado

**Severidad:** CRÍTICA  
**Ubicación:** [`components/client/ServiceContactForm.tsx:80`](../portadora-eros/src/components/client/ServiceContactForm.tsx#L80)

```typescript
const result = await createAppointment({
  serviceId: serviceSlug,  // ❌ Pasa el SLUG (string), no el ID (UUID)
  serviceName: serviceName,
  ...
});
```

**Impacto:** El turno se crea pero no se vincula correctamente al servicio en la base de datos porque `serviceId` espera un UUID y recibe un slug.

**Solución:** El componente debe recibir también el `serviceId` (UUID) del servicio, o resolver el ID desde el slug antes de enviar.

---

### 1.3 Ruta de creación de nuevos servicios no funciona correctamente

**Severidad:** ALTA  
**Ubicación:** [`app/admin/servicios/[slug]/page.tsx`](../portadora-eros/src/app/admin/servicios/[slug]/page.tsx)

El admin linkea a `/admin/servicios/nuevo` pero:
1. La ruta `[slug]` interpreta "nuevo" como un slug
2. No hay lógica para distinguir entre "crear" vs "editar"
3. El código intenta editar un servicio que no existe

**Solución:** Agregar lógica en `[slug]/page.tsx` para manejar el caso especial cuando `params.slug === 'nuevo'`.

---

## 2. DEUDA TÉCNICA

### 2.1 Datos hardcodeados en `config.ts` duplican funcionalidad de Supabase

**Severidad:** MEDIA  
**Ubicación:** [`lib/config.ts`](../portadora-eros/src/lib/config.ts#L6-L51)

```typescript
export const SERVICES: Service[] = [
  { id: '1', title: 'Sesion de Tarot', ... },
  { id: '2', title: 'Sesion de Buzios', ... },
  // Estos datos están duplicados en la base de datos
];
```

**Impacto:** 
- El Hero usa `SERVICES` de config.ts directamente en lugar de fetched desde Supabase
- Potencial inconsistencia entre datos de config y base de datos
-[`components/client/Hero.tsx:131`](../portadora-eros/src/components/client/Hero.tsx#L131)

**Solución:** 
- Opcional 1: Eliminar datos de config.ts y fetchear desde Supabase en el Hero
- Opcional 2: Mantener como fallback si Supabase no tiene servicios

---

### 2.2 Email "From" address no verificada en Resend

**Severidad:** MEDIA  
**Ubicación:** [`lib/api/appointments.ts:64,84,195`](../portadora-eros/src/lib/api/appointments.ts#L64)

```typescript
from: 'Portadora de Eros <onboarding@resend.dev>'
```

**Impacto:** 
- Todos los emails se envían desde `onboarding@resend.dev` (cuenta de pruebas)
- Los clientes pueden pensar que es spam
- Límites de Resend en cuenta gratuita

**Solución:** Configurar un dominio verificado en Resend cuando se tenga uno.

---

### 2.3 Credencial de API de Resend en variable de entorno

**Severidad:** MEDIA (si no está configurado)

Verificar que `RESEND_API_KEY` esté configurado en las variables de entorno de producción (`.env.local` o configuración de Vercel).

---

## 3. INCONSISTENCIAS ESTÉTICAS

### 3.1 Tema visual MIXTO (Intencional pero notorio)

**Severidad:** BAJA (Puede ser intencional)  
**Observación:**

El proyecto usa un tema **claro con acentos oscuros**:
- `globals.css` define fondo blanco (`--background: #ffffff`)
- [`Navbar.tsx`](../portadora-eros/src/components/client/Navbar.tsx): fondo blanco/scrolled
- [`Hero.tsx`](../portadora-eros/src/components/client/Hero.tsx): secciones "Services Preview" usan **tarjetas negras** (`bg-black`)
- [`ServiceCard.tsx`](../portadora-eros/src/components/client/ServiceCard.tsx): tarjetas de servicios son **negras** (`bg-black`)
- [`contacto/page.tsx`](../portadora-eros/src/app/contacto/page.tsx): cards informativas son **negras** (`bg-black`)
- [`ServiceContactForm.tsx`](../portadora-eros/src/components/client/ServiceContactForm.tsx): formulario es **gris oscuro** (`bg-gray-950`)

**Evaluación:** Este diseño "oscuro sobre claro" es una decisión estética válida y coherente con el branding místico. NO es un bug.

---

### 3.2 Links de redes sociales hardcodeados en Navbar

**Severidad:** MEDIA  
**Ubicación:** [`components/client/Navbar.tsx:118-119`](../portadora-eros/src/components/client/Navbar.tsx#L118)

```typescript
<Link href="#" className="text-sm font-medium">Instagram</Link>
<Link href="#" className="text-sm font-medium">WhatsApp</Link>
```

**Impacto:** Links rotos (href="#") en el menú móvil.

**Solución:** 
- Fetchear desde `admin_settings` 
- O usar valores por defecto de config

---

### 3.3 Footer con información estática

**Severidad:** MEDIA  
**Ubicación:** [`components/client/Footer.tsx`](../portadora-eros/src/components/client/Footer.tsx)

El Footer probablemente tiene hardcodeado:
- Email de contacto
- Links de redes sociales
- Información de copyright

**Solución:** Debería fetcher desde `admin_settings`.

---

### 3.4 Diseño inconsistente en botones del admin

**Severidad:** BAJA  
**Observación:** 
- Botones principales en admin usan `bg-black`
- Algunos botones de acción usan `bg-red-50` para peligro
- El diseño es coherente con el sitio público

---

## 4. FUNCIONES FALTANTES

### 4.1 Gestión de mensajes de contacto en admin

**Severidad:** ALTA  
**Estado:** NO IMPLEMENTADO

El admin NO tiene una página para:
- Ver mensajes recibidos desde `/contacto`
- Marcar mensajes como leídos
- Archivar mensajes
- Responder a clientes

**Solución:** Crear [`app/admin/mensajes/page.tsx`](../portadora-eros/src/app/admin/mensajes/page.tsx) con:
- Lista de mensajes
- Filtros (todos, no leídos, archivados)
- Modal para ver detalles
- Botón para marcar como leído/archivar

---

### 4.2 Subida de imágenes para servicios

**Severidad:** MEDIA  
**Estado:** PARCIALMENTE IMPLEMENTADO

- [`ImageUploader.tsx`](../portadora-eros/src/components/ui/ImageUploader.tsx) existe
- [`lib/api/storage.ts`](../portadora-eros/src/lib/api/storage.ts) tiene funciones
- PERO en el formulario de edición de servicios [`admin/servicios/[slug]/page.tsx`](../portadora-eros/src/app/admin/servicios/[slug]/page.tsx) **NO hay campo de imagen**

**Solución:** Integrar ImageUploader en el formulario de servicios.

---

### 4.3 Validación de horarios de negocio en agendado

**Severidad:** MEDIA  
**Estado:** PARCIALMENTE IMPLEMENTADO

[`CustomTimePicker.tsx`](../portadora-eros/src/components/client/CustomTimePicker.tsx) recibe `businessHours` como prop PERO:
- Puede no validar correctamente contra días cerrados (sunday.closed = true)
- No muestra claramente los horarios disponibles por día

**Solución:** Mejorar validación y UX del selector de horario.

---

### 4.4 Sistema de completado de turnos

**Severidad:** BAJA  
**Estado:** PARCIALMENTE IMPLEMENTADO

En [`admin/calendario/page.tsx`](../portadora-eros/src/app/admin/calendario/page.tsx):
- ✅ Botón para **confirmar** turnos (cuando se verifica pago)
- ❌ No hay botón para **completar** (después de la sesión)
- ❌ No hay botón para **cancelar** turno

**Solución:** Agregar estas opciones en el modal de detalles.

---

### 4.5 Página de "Sobre Mí" dinámica

**Severidad:** MEDIA  
**Estado:** PARCIALMENTE IMPLEMENTADO

La página [`app/sobre-mi/page.tsx`](../portadora-eros/src/app/sobre-mi/page.tsx) probablemente tiene contenido hardcoded cuando debería:
- Fetchear `bioContent` desde `admin_settings`
- Fetchear `profileImageUrl` desde `admin_settings`

---

## 5. PROBLEMAS DE SEGURIDAD

### 5.1 Política RLS demasiado permisiva para appointments

**Severidad:** BAJA (si el site no está indexado)  
**Ubicación:** [`supabase_schema.sql:95-96`](../portadora-eros/supabase_schema.sql#L95)

```sql
CREATE POLICY "Público puede solicitar turnos" ON public.appointments FOR
INSERT WITH CHECK (true);
```

**Impacto:** Cualquier persona puede insertar turnos sin restricciones.

**Nota:** Esto ES necesario para que el sitio público funcione, pero debería:
- Validar que no haya spam (honeypot field)
- Limitar frecuencia de solicitudes por IP

---

## 6. LISTA DE CHEQUEO DE IMPLEMENTACIÓN

### Completado ✅
- [x] Autenticación real con Supabase Auth
- [x] Panel de servicios conectado a Supabase
- [x] Calendario con visualización de turnos
- [x] Políticas RLS
- [x] Subida de imágenes (API)

### Pendiente Alta Prioridad
- [ ] Crear tabla `contact_messages` en Supabase
- [ ] Corregir `serviceId` en ServiceContactForm
- [ ] Arreglar ruta de creación de nuevos servicios
- [ ] Agregar página de gestión de mensajes en admin

### Pendiente Media Prioridad
- [ ] Conectar Navbar y Footer a settings
- [ ] Hacer "Sobre Mí" dinámico
- [ ] Agregar ImageUploader al formulario de servicios
- [ ] Mejorar validación de horarios en CustomTimePicker

### Pendiente Baja Prioridad
- [ ] Agregar botones completar/cancelar turnos
- [ ] Configurar dominio verificado en Resend
- [ ] Eliminar datos hardcodeados de config.ts (si no se usan)

---

## 7. RECOMENDACIONES INMEDIATAS

### Para poner en producción:
1. **Ejecutar script SQL** para crear tabla `contact_messages`
2. **Probar formulario de contacto** y verificar que guarde en DB
3. **Corregir serviceId** en ServiceContactForm para que vincule turnos con servicios
4. **Testear flow completo:**
   - Crear servicio desde admin
   - Agendar turno desde sitio público
   - Ver turno en calendario admin
   - Confirmar turno
   - Enviar mensaje desde /contacto
   - Ver mensaje en admin (cuando esté implementado)

### Para mejorar después del launch:
1. Crear página de gestión de mensajes
2. Dynamic navbar/footer desde settings
3. Mejorar sistema de validación de horarios
4. Agregar completación y cancelación de turnos

---

*Documento generado como parte de la auditoría técnica del proyecto Portadora de Eros.*
