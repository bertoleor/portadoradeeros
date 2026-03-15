# AUDITORÍA DEL PANEL DE ADMINISTRACIÓN

**Fecha:** 11 de Marzo 2026  
**Ámbito:** Panel de Administración ("/admin/\*")

---

## 1. FUNCIONALIDADES FALTANTES

### 1.1 Botones sin función en el Dashboard

| Ubicación                                                                 | Problema                                                 | Severidad |
| ------------------------------------------------------------------------- | -------------------------------------------------------- | --------- |
| [`admin/page.tsx:148`](../portadora-eros/src/app/admin/page.tsx#L148)     | Botón "Ver todo" en sección de turnos no tiene `onClick` | MEDIA     |
| [`admin/page.tsx:186-188`](../portadora-eros/src/app/admin/page.tsx#L186) | Botón "MoreHorizontal" en cada turno no hace nada        | MEDIA     |
| [`admin/page.tsx:251-253`](../portadora-eros/src/app/admin/page.tsx#L251) | Botón "Contactar a soporte" no tiene función             | BAJA      |

### 1.2 Modal de detalles de turno incompleto

El dashboard muestra los turnos pero:

- No hay forma de ver los detalles completos (notes, phone)
- No hay opción de cancelar turno
- No hay opción de completar turno (después de la sesión)
- El botón de "Más opciones" no tiene dropdown/modal

### 1.3 Sección de mensajes de contacto incompleta

- Al hacer click en un mensaje, solo se marca como "leído"
- No hay forma de ver el mensaje completo en un modal
- No hay forma de responder al cliente
- No hay opción de archivar mensajes
- No hay link a una página completa de gestión de mensajes

### 1.4 No hay página de gestión de mensajes

No existe `/admin/mensajes` ni `/admin/contacto` para gestionar todos los mensajes.

---

## 2. DEUDA TÉCNICA

### 2.1 Seguridad: Validación de contraseña débil

[`configuracion/seguridad/page.tsx`](../portadora-eros/src/app/admin/configuracion/seguridad/page.tsx):

```typescript
// No hay validación de:
// - Longitud mínima
// - Mayúsculas/minúsculas
// - Números o caracteres especiales
// - Verificación de contraseña actual correcta (solo verifica que no esté vacía)
```

**Recomendación:** Agregar validación:

```typescript
if (seguridad.newPassword.length < 8) {
  error("La contraseña debe tener al menos 8 caracteres");
  return;
}
```

### 2.2 Estado deHorario: Inconsistencia de formato

[`configuracion/horarios/page.tsx`](../portadora-eros/src/app/admin/configuracion/horarios/page.tsx):

- El UI usa `active: boolean`
- La DB usa `closed: boolean` (invertido)
- Si el campo no existe en DB, asume valores por defecto

**Impacto:** Puede causar errores si se cambia el esquema.

### 2.3 Perfil: Valores hardcodeados como fallback

[`configuracion/perfil/page.tsx:21-22`](../portadora-eros/src/app/admin/configuracion/perfil/page.tsx#L21):

```typescript
const [config, setConfig] = useState({
  // ...
  instagram: "https://instagram.com/portadoradeeros", // ❌ Hardcodeado
  whatsapp: "https://wa.me/5491100000000", // ❌ Hardcodeado
  email: "contacto@portadoradeeros.com", // ❌ Hardcodeado
  // ...
});
```

Esto causa que si la DB tiene valores vacíos, muestre estos defaults en el input en lugar de campos vacíos.

---

## 3. PROBLEMAS DE SEGURIDAD

### 3.1 RLS: Tabla de servicios permite DELETE público

En [`supabase_schema.sql`](../portadora-eros/supabase_schema.sql):

```sql
CREATE POLICY "Admins pueden gestionar todos los servicios"
ON public.services FOR ALL USING (auth.role() = 'authenticated');
```

**Problema:** `FOR ALL` incluye DELETE. Si un usuario autenticado (no admin) se registra, podría borrar servicios.

**Recomendación:** Separar políticas:

```sql
-- Solo SELECT e INSERT para admin
CREATE POLICY "Admin can manage services" ON public.services
FOR ALL USING (auth.role() = 'authenticated');

-- O más específico:
CREATE POLICY "Public can view visible services" ON public.services
FOR SELECT USING (is_visible = true);
CREATE POLICY "Admin can insert services" ON public.services
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin can update services" ON public.services
FOR UPDATE USING (auth.role() = 'authenticated');
```

### 3.2 Sin protección contra fuerza bruta en login

[`login/actions.ts`](../portadora-eros/src/app/admin/login/actions.ts):

- No hay rate limiting
- No hay CAPTCHA
- Mensaje de error genérico pero no protege contra enumeración de usuarios

### 3.3 Política RLS demasiado permisiva para appointments

```sql
CREATE POLICY "Público puede solicitar turnos" ON public.appointments FOR
INSERT WITH CHECK (true);
```

Esto permite que CUALQUIERA cree turnos sin restricciones. Considerar agregar:

- Honeypot field
- Rate limiting por IP
- Validación de email

---

## 4. INCONSISTENCIAS DE UX

### 4.1 Dashboard muestra "Ver todo" sin función

El botón existe visualmente pero no navega a `/admin/calendario`.

### 4.2 Mensajes sin contador de "no leídos" claro

En el sidebar, los mensajes nuevos tienen estilo visual pero no hay un contador prominente.

### 4.3 Stats del dashboard son confusos

```typescript
{ label: 'Energía Semanal', value: getServicePopularity()[0]?.[0] || 'Iniciando...', ... }
```

- "Energía Semanal" no es un label claro
- El valor es el nombre del servicio más popular, no "energía"

---

## 5. LISTA DE CORRECCIONES RECOMENDADAS

### Alta Prioridad

- [ ] Implementar link "Ver todo" → `/admin/calendario`
- [ ] Agregar modal de detalles de turno en dashboard
- [ ] Agregar botón de completar/cancelar turno
- [ ] Agregar modal de ver mensaje completo
- [ ] Crear página de gestión de mensajes

### Media Prioridad

- [ ] Validar contraseña en seguridad (mínimo 8 caracteres)
- [ ] Separar políticas RLS de servicios
- [ ] Corregir valores hardcodeados en perfil
- [ ] Implementar rate limiting en login

### Baja Prioridad

- [ ] Renombrar "Energía Semanal" a "Servicio Más Popular"
- [ ] Agregar link a soporte
- [ ] Mejorar tooltip de horarios

---

## 6. CÓDIGO ROTO ENCONTRADO

### 6.1 Botón "Ver todo" appointments

```tsx
// admin/page.tsx:148
<Button variant="outline" className="text-xs h-8 rounded-full border-black/5">
  Ver todo
</Button>
// Falta: onClick={() => router.push('/admin/calendario')}
```

### 6.2 Botón "Más" en cada turno

```tsx
// admin/page.tsx:186-188
<Button variant="outline" className="w-10 h-10 p-0 rounded-xl border-black/5">
  <MoreHorizontal size={16} className="text-black/40" />
</Button>
// Falta: onClick={() => setSelectedAppointment(app)}
```

### 6.3 Botón soporte

```tsx
// admin/page.tsx:251-253
<Button className="w-full bg-white text-black hover:bg-white/90 text-xs py-3 rounded-xl h-auto">
  Contactar a soporte
</Button>
// Falta: onClick o href
```

---

_Documento generado durante la auditoría técnica del proyecto Portadora de Eros_
