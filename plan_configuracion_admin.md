# Plan: Nueva Configuración de Admin - Estilo Notion/App Nativa

## Resumen

Rediseñar la página de configuración del admin para tener botones de navegación estilo app nativa, similar a la interfaz de Notion, manteniendo la estética actual del proyecto.

---

## Estado Actual

- La configuración tiene tabs horizontales en el layout
- Hay 4 subpáginas: perfil, banco, horarios, seguridad
- El estilo actual es funcional pero menos intuitivo para navegación

## Estética Objetivo (Notion + Nuestra Marca)

- Fondo: `bg-white` o `bg-gray-50/30`
- Tarjetas: `bg-white border border-black/5 rounded-2xl shadow-sm`
- Texto: `text-black` principal, `text-black/50` secundario
- Hover: `hover:bg-gray-50 hover:border-black/10 transition-all`
- Íconos: Lucide React (ya usados en el proyecto)
- Espaciado: `p-4` a `p-6` interno, `gap-4` entre elementos

---

## Estructura de Navegación Propuesta

### Página Principal: `/admin/configuracion`

Grid de botones/cards estilo Notion que levam às subpáginas:

```
┌─────────────────────────────────────────────────────────────┐
│  CONFIGURACIÓN                                              │
│  Administrá tu perfil y cuenta                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │ 👤                       │  │ 🏦                      │  │
│  │ Perfil Público           │  │ Datos Bancarios         │  │
│  │ Nombre, bio, redes       │  │ CBU, alias, banco       │  │
│  │                         │  │                         │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │ ⏰                       │  │ 🔒                      │  │
│  │ Horarios de Trabajo     │  │ Seguridad                │  │
│  │ Días y horarios         │  │ Contraseña              │  │
│  │                         │  │                         │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│  ┌─────────────────────────┐                                │
│  │ ⚙️                       │                                │
│  │ Editar Admin            │                                │
│  │ Usuario y contraseña    │                                │
│  │                         │                                │
│  └─────────────────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Subpáginas (Sin cambios en funcionalidad)

### 1. `/admin/configuracion/perfil` (existente)

- Información pública del perfil
- Redes sociales (Instagram, WhatsApp, TikTok)
- Bio/Descripción
- Email de contacto

### 2. `/admin/configuracion/banco` (existente)

- Datos bancarios para transferencias
- CBU, Alias, Nombre del banco, Titular

### 3. `/admin/configuracion/horarios` (existente)

- Horarios de atención por día
- Días de descanso

### 4. `/admin/configuracion/seguridad` (existente)

- Cambio de contraseña

### 5. `/admin/configuracion/admin` (NUEVO)

- Editar usuario admin
- Cambiar email de acceso
- Cambiar contraseña de acceso

---

## Componentes a Crear/Modificar

### 1. Modificar: `src/app/admin/configuracion/page.tsx`

- Cambiar de redirect a página principal con grid de botones

### 2. Modificar: `src/app/admin/configuracion/layout.tsx`

- Eliminar tabs horizontales
- Agregar breadcrumb "Configuración"
- Mejorar estilado general

### 3. Crear: `src/app/admin/configuracion/admin/page.tsx`

- Nueva página para editar perfil de admin
- Formulario para usuario y contraseña

### 4. Crear componente reutilizable: `src/components/admin/SettingsCard.tsx`

- Card estilo Notion para los botones de navegación
- Props: title, description, icon, href, variant?

---

## Especificación del Componente SettingsCard

```tsx
interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  badge?: string; // ej: "Activo" / "Inactivo"
}

export function SettingsCard({
  title,
  description,
  icon: Icon,
  href,
  badge,
}: SettingsCardProps);
```

**Estilo:**

- `group flex flex-col p-5 rounded-2xl border border-black/5 bg-white hover:border-black/10 hover:shadow-md hover:shadow-black/5 transition-all cursor-pointer`
- Texto título: `text-base font-medium text-gray-900 group-hover:text-black`
- Texto descripción: `text-sm text-gray-500 mt-1`
- Ícono: `w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-gray-100 transition-colors`
- Flecha derecha: `opacity-0 group-hover:opacity-100 transition-opacity`

---

## Flujo de Usuario

1. Usuario entra a `/admin/configuracion`
2. Ve grid de opciones con íconos y descripciones
3. Click en cualquier card lo lleva a la subpágina correspondiente
4. Subpáginas mantienen su funcionalidad actual
5. Breadcrumb permite volver a configuración principal

---

## Tareas de Implementación

### Fase 1: Componente SettingsCard

- [ ] Crear `src/components/admin/SettingsCard.tsx`
- [ ] Definir estilos Notion/app nativa
- [ ] Agregar animaciones hover

### Fase 2: Página Principal

- [ ] Modificar `page.tsx` para mostrar grid de cards
- [ ] Integrar SettingsCard para cada sección
- [ ] Agregar nueva sección de Admin

### Fase 3: Página de Admin

- [ ] Crear `src/app/admin/configuracion/admin/page.tsx`
- [ ] Formulario para editar credenciales
- [ ] Integrar con API existente

### Fase 4: Layout

- [ ] Simplificar layout.tsx (remover tabs)
- [ ] Agregar breadcrumb "Configuración"
- [ ] Mejorar header

---

## Consideraciones Adicionales

1. **Responsive**: Grid pasa a 1 columna en móvil, 2 en tablet, 2-3 en desktop
2. **Accesibilidad**: Todos los botones deben ser focusables y tener aria-labels
3. **Consistencia**: Usar los mismos colores y espaciados que el resto del admin
4. **Rendimiento**: Las animaciones deben ser sutiles (150-200ms)
5. **SEO**: No aplica (es admin, no es público)

---

## Archivos a Modificar

| Archivo                                          | Acción    |
| ------------------------------------------------ | --------- |
| `src/components/admin/SettingsCard.tsx`          | CREAR     |
| `src/app/admin/configuracion/page.tsx`           | MODIFICAR |
| `src/app/admin/configuracion/layout.tsx`         | MODIFICAR |
| `src/app/admin/configuracion/admin/page.tsx`     | CREAR     |
| `src/app/admin/configuracion/perfil/page.tsx`    | VERIFICAR |
| `src/app/admin/configuracion/banco/page.tsx`     | VERIFICAR |
| `src/app/admin/configuracion/horarios/page.tsx`  | VERIFICAR |
| `src/app/admin/configuracion/seguridad/page.tsx` | VERIFICAR |
