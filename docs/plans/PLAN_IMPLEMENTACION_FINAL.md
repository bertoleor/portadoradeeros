# PLAN DE IMPLEMENTACIÓN FINAL - PORTADORA DE EROS
> Parte de: [[projects/eros/README|README]] · Relacionados: [[EROS-plan-2026-09-14]] · [[INDICE-PLANS]] · [[plan]]

**Objetivo:** Dejar el proyecto listo para que el cliente solo tenga que cargar sus servicios.  
**Exclusiones:** Google Calendar, Facebook/Twitter/YouTube, Live Chat  
**Fecha de creación:** 15 de Marzo 2026

---

## RESUMEN DEL PLAN

Este plan detalla las tareas necesarias para completar el proyecto. El objetivo es que, al finalizar, el sitio esté 100% funcional y el cliente solo necesite:

- Ingresar sus servicios
- Configurar sus datos bancarios
- Ajustar horarios de trabajo
- Completar su biografía

---

## TAREA 1: AGREGAR BOTONES COMPLETAR/CANCELAR TURNOS

### Ubicación
[`portadora-eros/src/app/admin/calendario/page.tsx`](portadora-eros/src/app/admin/calendario/page.tsx)

### Descripción
El modal de detalles del turno en el calendario del admin solo tiene botón para confirmar. Necesita botones para:

1. **Completar turno** - Marcar como "completed" (después de la sesión)
2. **Cancelar turno** - Marcar como "cancelled" con opción de motivo

### Pasos de implementación

1. **Agregar función para completar turno** en [`lib/api/appointments.ts`](portadora-eros/src/lib/api/appointments.ts):
   ```typescript
   export async function completeAppointment(appointmentId: string) {
     // Update status to 'completed'
     // Send completion email to client
   }
   ```

2. **Agregar función para cancelar turno** en [`lib/api/appointments.ts`](portadora-eros/src/lib/api/appointments.ts):
   ```typescript
   export async function cancelAppointment(appointmentId: string, reason?: string) {
     // Update status to 'cancelled'
     // Send cancellation email to client
   }
   ```

3. **Agregar botones en el modal** de [`admin/calendario/page.tsx`](portadora-eros/src/app/admin/calendario/page.tsx):
   - Cuando el estado sea "confirmed": mostrar botón "Completar"
   - Siempre mostrar botón "Cancelar" (excepto si ya está cancelled/completed)
   - Al cancelar, mostrar prompt para confirmar y opcionalmente ingresar motivo

### Estado: PENDIENTE

---

## TAREA 2: CONECTAR IMÁGENES DE SERVICIOS

### Ubicación
[`portadora-eros/src/app/admin/servicios/[slug]/page.tsx`](portadora-eros/src/app/admin/servicios/[slug]/page.tsx)

### Descripción
El componente [`ImageUploader.tsx`](portadora-eros/src/components/ui/ImageUploader.tsx) existe pero no está conectado al formulario de edición de servicios.

### Pasos de implementación

1. **Verificar que el campo `images` existe** en la tabla `services` de Supabase:
   ```sql
   ALTER TABLE public.services ADD COLUMN IF NOT EXISTS images TEXT[];
   ```

2. **Conectar ImageUploader** en [`admin/servicios/[slug]/page.tsx`](portadora-eros/src/app/admin/servicios/[slug]/page.tsx):
   - Importar ImageUploader
   - Agregar campo para subir imágenes
   - Guardar URLs en el campo `images`
   - Mostrar galería de imágenes en el formulario

3. **Mostrar imágenes** en el frontend:
   - [`ServiceCard.tsx`](portadora-eros/src/components/client/ServiceCard.tsx)
   - [`ServiceImageCarousel.tsx`](portadora-eros/src/components/client/ServiceImageCarousel.tsx)

### Estado: PENDIENTE

---

## TAREA 3: CORREGIR BUG DE SERVICE ID

### Ubicación
[`portadora-eros/src/components/client/ServiceContactForm.tsx`](portadora-eros/src/components/client/ServiceContactForm.tsx)

### Descripción
El formulario pasa el `slug` del servicio en vez del `id` (UUID) al crear un turno. Esto hace que el turno no se vincule correctamente al servicio.

### Pasos de implementación

1. **Modificar el componente** para recibir el `serviceId` (UUID):
   ```typescript
   interface ServiceContactFormProps {
     serviceName: string;
     serviceId: string;  // ← AGREGAR ESTE
     serviceSlug?: string;
     // ... resto de props
   }
   ```

2. **Obtener el ID desde la página del servicio** ([`servicios/[slug]/page.tsx`](portadora-eros/src/app/servicios/[slug]/page.tsx)):
   - Cuando llama a ServiceContactForm, pasar también el `service.id`

3. **Verificar que la API** ([`lib/api/appointments.ts`](portadora-eros/src/lib/api/appointments.ts)) recibe correctamente el UUID

### Estado: PENDIENTE

---

## TAREA 4: VERIFICAR TABLA contact_messages

### Ubicación
Supabase Database + [`portadora-eros/migrations/migration_contact_messages.sql`](portadora-eros/migrations/migration_contact_messages.sql)

### Descripción
El formulario de contacto depende de esta tabla. Necesitamos verificar que existe y tiene las políticas RLS correctas.

### Pasos de implementación

1. **Ejecutar la migración** en Supabase SQL Editor:
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
   CREATE POLICY "Cualquiera puede enviar mensajes" ON public.contact_messages 
     FOR INSERT WITH CHECK (true);

   -- Política para que admin lea
   CREATE POLICY "Admin puede leer mensajes" ON public.contact_messages 
     FOR SELECT USING (auth.role() = 'authenticated');

   -- Política para que admin actualice estado
   CREATE POLICY "Admin puede actualizar mensajes" ON public.contact_messages 
     FOR UPDATE USING (auth.role() = 'authenticated');
   ```

2. **Verificar que el formulario de contacto funciona** - Enviar mensaje de prueba desde `/contacto`

3. **Ver que aparece en el admin** - Revisar [`admin/mensajes/page.tsx`](portadora-eros/src/app/admin/mensajes/page.tsx)

### Estado: PENDIENTE

---

## TAREA 5: CORREGIR RUTA /admin/servicios/nuevo

### Ubicación
[`portadora-eros/src/app/admin/servicios/[slug]/page.tsx`](portadora-eros/src/app/admin/servicios/[slug]/page.tsx)

### Descripción
La ruta `[slug]` interpreta "nuevo" como un slug y busca un servicio que no existe.

### Pasos de implementación

1. **Agregar lógica** en el componente para manejar el caso especial:
   ```typescript
   const isNewService = params.slug === 'nuevo';
   
   useEffect(() => {
     if (isNewService) {
       // Inicializar formulario vacío para crear nuevo servicio
       setFormData({ title: '', description: '', ... });
     } else {
       // Cargar servicio existente para editar
       loadService(params.slug);
     }
   }, [params.slug]);
   ```

2. **Ajustar el título** de la página:
   - Si `isNewService`: "Nuevo Servicio"
   - Si no: "Editar Servicio"

3. **Ajustar el guardado**:
   - Si `isNewService`: POST para crear
   - Si no: PUT para actualizar

### Estado: PENDIENTE

---

## TAREA 6: HACER "SOBRE MÍ" DINÁMICO

### Ubicación
[`portadora-eros/src/app/sobre-mi/page.tsx`](portadora-eros/src/app/sobre-mi/page.tsx)

### Descripción
La página tiene contenido hardcoded. Debería fetcher desde `admin_settings`.

### Pasos de implementación

1. **Modificar la página** para fetcher settings:
   ```typescript
   import { getAdminSettings } from '@/lib/api/settings';
   
   export default async function SobreMiPage() {
     const settings = await getAdminSettings();
     // ...
   }
   ```

2. **Mostrar datos dinámicos**:
   - `bioContent` → Contenido de la biografía
   - `profileImageUrl` → Foto de perfil
   - `adminName` → Nombre

3. **Mantener fallback** si no hay datos configurados:
   - Mostrar contenido actual como placeholder
   - Mensaje indicando que configure en el admin

### Estado: PENDIENTE

---

## TAREA 7: CORREGIR ESTABILIDAD DEL NAVBAR

### Ubicación
[`portadora-eros/src/components/client/Navbar.tsx`](portadora-eros/src/components/client/Navbar.tsx)

### Descripción
El Navbar cambia de tamaño al hacer scroll (de py-10 a py-6), causando un "salto" visual.

### Pasos de implementación

1. **Cambiar la lógica de altura**:
   ```typescript
   // ANTES (problemático):
   className={isScrolled ? 'py-6' : 'py-10'}
   
   // DESPUÉS (fijo):
   className="py-0"  // Altura fija del contenedor
   ```

2. **Usar transición solo en background**:
   ```typescript
   className={`
     h-20  // Altura FIJA
     transition-all duration-300
     ${isScrolled 
       ? 'bg-white border-b shadow-sm' 
       : 'bg-transparent'
     }
   `}
   ```

3. **Ajustar contenido interno**:
   - El contenido del Navbar debe mantener padding interno constante
   - Opcional: reducir blur cuando está scrolled

### Estado: PENDIENTE

---

## TAREA 8: UNIFICAR ANCHOS DE CONTENEDORES

### Ubicación
Múltiples archivos

### Descripción
Los contenedores tienen anchos inconsistentes (896px, 1152px, 1200px). Deben unificarse a 1200px.

### Archivos a modificar

| Archivo | Ancho actual | Cambiar a |
|---------|-------------|-----------|
| Hero.tsx | max-w-4xl | max-w-[1200px] |
| ServiceCarousel.tsx | max-w-6xl | max-w-[1200px] |
| Footer.tsx | max-w-6xl | max-w-[1200px] |
| servicios/page.tsx | max-w-6xl | max-w-[1200px] |
| sobre-mi/page.tsx | max-w-6xl | max-w-[1200px] |
| contacto/page.tsx | max-w-6xl | max-w-[1200px] |

### Alternativa más limpia

Crear un componente Container reutilizable:
```typescript
// components/ui/Container.tsx
export function Container({ children, className }) {
  return (
    <div className={`max-w-[1200px] mx-auto px-[5%] ${className}`}>
      {children}
    </div>
  );
}
```

Y usarlo en todas las páginas.

### Estado: PENDIENTE

---

## TAREA 9: UNIFICAR PADDING HORIZONTAL

### Descripción
El padding horizontal es inconsistente entre componentes (px-6, px-8, px-10).

### Solución
Usar siempre `px-[5%]` o `px-6 md:px-10` como estándar.

### Archivos a revisar
- Navbar.tsx
- Hero.tsx
- ServiceCarousel.tsx
- Footer.tsx
- Todas las páginas

### Estado: PENDIENTE

---

## ORDEN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1: Críticos (Funcionalidad básica)
1. ✅ ~~Verificar tabla contact_messages~~ (ya existe migración)
2. Corregir bug de service ID
3. Agregar botones completar/cancelar turnos
4. Corregir ruta /admin/servicios/nuevo

### Fase 2: Datos Dinámicos
5. Hacer "Sobre Mí" dinámico
6. Conectar imágenes de servicios

### Fase 3: Estética y Consistencia
7. Corregir estabilidad del Navbar
8. Unificar anchos de contenedores
9. Unificar padding horizontal

---

## VERIFICACIÓN FINAL

Una vez completadas todas las tareas:

- [ ] Cliente puede crear servicios desde admin
- [ ] Cliente puede editar servicios
- [ ] Cliente puede subir imágenes a servicios
- [ ] Reservas funcionan correctamente
- [ ] Turnos se vinculan al servicio correcto
- [ ] Admin puede completar turnos
- [ ] Admin puede cancelar turnos
- [ ] Formulario de contacto funciona
- [ ] "Sobre Mí" se muestra desde configuración
- [ ] Diseño consistente en todo el sitio

---

## NOTAS ADICIONALES

### Variables de entorno requeridas
Asegurar que estén configuradas en Vercel:
```
EMAILJS_SERVICE_ID
EMAILJS_PUBLIC_KEY
EMAILJS_PRIVATE_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Datos que el cliente debe cargar
1. **Servicios**: Título, descripción, precio, duración, icono, imágenes
2. **Perfil**: Biografía, foto de perfil
3. **Datos bancarios**: CBU, alias, titular, banco
4. **Horarios**: Días y horarios de atención
5. **Redes sociales**: Instagram, WhatsApp, TikTok

---

*Este plan deja el proyecto listo para uso del cliente final.*