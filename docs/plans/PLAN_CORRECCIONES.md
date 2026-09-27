# PLAN DE CORRECCIONES ESTÉTICAS - VERSIÓN COMPLETA
> Parte de: [[projects/eros/README|README]] · Relacionados: [[EROS-plan-2026-09-14]] · [[INDICE-PLANS]] · [[AUDITORIA_ESTETICA]]

## DOCUMENTOS DE REFERENCIA:

1. **[`AUDITORIA_ESTETICA.md`](portadora-eros/AUDITORIA_ESTETICA.md)** - Análisis de problemas actuales
2. **[`MEJORAS_ADICIONALES.md`](portadora-eros/MEJORAS_ADICIONALES.md)** - Mejoras premium propuestas
3. **[`PLAN_CORRECCIONES.md`](portadora-eros/PLAN_CORRECCIONES.md)** - Este documento

---

## REGLAS ESTRUCTURALES A APLICAR

| Regla | Especificación |
|-------|---------------|
| Contenedor principal | max-width: 1200px, margin: 0 auto |
| Padding vertical secciones | mínimo 100px |
| Padding horizontal | 5% |
| Navbar altura | height: 80px FIJO (no cambia con scroll) |
| Navbar blur | backdrop-filter: blur(10px), fondo sutil |
| Navbar scroll | Efecto de hide/show con blur, NO cambiar tamaño |
| Hero título | margin-bottom: 40px |
| Botones | border-radius: 50px, padding: 12px 24px, tipografía fina (300) |
| Cards padding | padding interno: 30px |
| Cards border-radius | 24px |
| Tipografía títulos | peso 500 |
| Tipografía cuerpo | peso 300, line-height: 1.6 |
| Footer | sobrio, 3 columnas, ~120px espacio superior |
| Formulario contacto | GRANDE, centrado, con aire |
| Sobre mí | Foto REDONDA a izquierda, texto a derecha, todo centrado |

---

## FASE 1: Sistema de Estilos Globales y Variables

### 1.1 Actualizar `globals.css`:

**Clases a AGREGAR:**

```css
/* Contenedor estándar premium */
.container-premium {
  max-width: 1200px;
  margin: 0 auto;
  padding-inline: 5%;
}

/* Sección con aire */
.section-premium {
  padding-top: 100px;
  padding-bottom: 100px;
}

/* Botón primario unificado */
.btn-premium {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50px;
  padding: 12px 24px;
  font-weight: 300;
  font-size: 14px;
  letter-spacing: 0.02em;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  gap: 8px;
}

.btn-premium-primary {
  background-color: var(--primary);
  color: white;
}

.btn-premium-primary:hover {
  background-color: var(--primary-light);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px rgba(209, 16, 25, 0.4);
}

/* Botón secundario/outline */
.btn-premium-outline {
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-premium-outline:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Card premium */
.card-premium {
  border-radius: 24px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.3s ease;
}

.card-premium:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.03);
}

/* Input premium */
.input-premium {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px 20px;
  color: white;
  font-size: 15px;
  font-weight: 300;
  transition: all 0.3s ease;
  width: 100%;
}

.input-premium::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.input-premium:focus {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(209, 16, 25, 0.1);
}

/* Tipografía */
h1, h2, h3, h4 {
  font-weight: 500;
  letter-spacing: -0.02em;
}

body, p {
  font-weight: 300;
  line-height: 1.6;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease forwards;
}

/* Focus visible */
*:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Divider mejorado */
.divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1) 20%,
    rgba(255, 255, 255, 0.1) 80%,
    transparent
  );
}
```

### 1.2 Actualizar `tailwind.config.ts`:
- Agregar colores consistentes para bordes
- Agregar animaciones

---

## FASE 2: Layout Principal

### 2.1 Actualizar `layout.tsx`:
- Agregar clase container-premium al main
- Aumentar espacio antes del footer
- Agregar metadata OpenGraph

---

## FASE 3: Navbar (CRÍTICO)

### 3.1 Reescribir `Navbar.tsx`:

```tsx
// CAMBIOS CLAVE:

// 1. Height FIJO de 80px
<nav className="fixed top-0 left-0 right-0 z-[100] h-[80px]">

// 2. Contenedor interno
<div className="
  h-full 
  px-[5%] 
  flex items-center justify-between 
  backdrop-blur-[10px] 
  bg-[#0a0505]/80 
  border-b border-white/10
  transition-all duration-300
">

// 3. Remover el cambio de padding (isScrolled)
// Mantener siempre el mismo tamaño
// Solo cambiar opacidad/background si se desea
```

---

## FASE 4: Hero Section

### 4.1 Actualizar `Hero.tsx`:

```tsx
// CAMBIOS:

// 1. Contenedor
<div className="max-w-[1200px] mx-auto px-[5%]">

// 2. Título
<h1 className="mb-10 ...">  // 40px margin-bottom

// 3. Botones - USAR CLASES NUEVAS
<button className="btn-premium btn-premium-outline flex items-center justify-center gap-3">
  Explorar Servicios
</button>

<Link href="/contacto" className="btn-premium btn-premium-primary flex items-center justify-center gap-3">
  Agendar Consulta
</Link>
```

---

## FASE 5: Service Cards

### 5.1 Actualizar `ServiceCard.tsx`:

```tsx
// CAMBIOS:

// Usar clase .card-premium
<div className="card-premium">

// Padding consistente
p-[30px]

// Border-radius
rounded-[24px]
```

### 5.2 Actualizar `ServiceCarousel.tsx`:

```tsx
// CAMBIOS:

// Contenedor
max-w-[1200px]
px-[5%]

// Grid de 3 cards en vez de carrusel
// O mejorar el carrusel con más espacio
```

---

## FASE 6: Página Servicios

### 6.1 Actualizar `servicios/page.tsx`:

```tsx
// Contenedor
max-w-[1200px]

// Padding
px-[5%]
pb-[100px]

// Grid
gap-[24px]
```

---

## FASE 7: Página Sobre Mí (DISEÑO ESPECÍFICO)

### 7.1 Actualizar `sobre-mi/page.tsx`:

```tsx
// 1. Foto REDONDA
<div className="rounded-full w-[350px] h-[350px] overflow-hidden border border-white/10">
  <Image src="/sobre-mi.jpg" alt="Portadora de Eros" fill className="object-cover" />
</div>

// 2. Layout centrado dentro del grid
// 3. Padding pb-[100px]
// 4. px-[5%]
```

---

## FASE 8: Página Contacto (DISEÑO ESPECÍFICO)

### 8.1 Actualizar `contacto/page.tsx`:

```tsx
// 1. Contenedor
max-w-[1200px]

// 2. Padding
px-[5%]
pb-[100px]

// 3. Formulario más GRANDE
// Opción: centered con max-width
<div className="max-w-2xl mx-auto">

// 4. Card interna
.card-premium
p-12 o p-14

// 5. Inputs
.input-premium
```

---

## FASE 9: Página Detalle Servicio

### 9.1 Actualizar `servicios/[slug]/page.tsx`:

```tsx
// 1. Contenedor
max-w-[1200px]

// 2. Padding
px-[5%]
pb-[100px]

// 3. Card lateral
.card-premium
p-[30px]
rounded-[24px]
```

---

## FASE 10: Footer

### 10.1 Actualizar `Footer.tsx`:

```tsx
// 1. Padding superior
pt-[120px]

// 2. Contenedor
max-w-[1200px]
px-[5%]

// 3. Tipografía pequeña pero legible
text-xs

// 4. 3-4 columnas bien separadas
gap-12
```

---

## FASE 11: Popup de Agendamiento

### 11.1 Actualizar `SchedulingPopup.tsx`:

```tsx
// 1. Contenedor más grande
max-w-[900px]

// 2. Backdrop mejorado
bg-black/90 backdrop-blur-lg

// 3. Modal
rounded-[24px]
p-10

// 4. Inputs
.input-premium
```

---

## FASE 12: Iconos

### 12.1 Actualizar `ServiceIcons.tsx`:

```tsx
// Stroke width consistente
const iconProps = { 
  size, 
  className, 
  strokeWidth: 1.5  // SIEMPRE 1.5
};
```

---

## FASE 13: Animaciones y Micro-interacciones

### 13.1 Agregar en `globals.css`:

```css
/* Scroll animations - agregar a los componentes */
.scroll-animate {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease;
}

.scroll-animate.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### 13.2 Mejorar hover states:
- Buttons: scale + shadow
- Cards: translateY + border color
- Links: underline animado

---

## FASE 14: Página 404

### 14.1 Crear `app/not-found.tsx`:

```tsx
// Página 404 personalizada con diseño consistente
```

---

## ARCHIVOS A MODIFICAR (14 archivos)

1. `globals.css` - **NUEVAS CLASES** (container, btn-premium, card-premium, input-premium)
2. `tailwind.config.ts` - Configuración
3. `layout.tsx` - Contenedor + metadata
4. `Navbar.tsx` - Height 80px fijo + blur
5. `Hero.tsx` - Botones nuevos + layout
6. `ServiceCard.tsx` - Card premium
7. `ServiceCarousel.tsx` - Contenedor consistente
8. `servicios/page.tsx` - Padding consistente
9. `sobre-mi/page.tsx` - **Foto redonda**
10. `contacto/page.tsx` - **Formulario grande centrado**
11. `servicios/[slug]/page.tsx` - Consistencia
12. `Footer.tsx` - Espacio superior
13. `SchedulingPopup.tsx` - Popup mejorado
14. `ServiceIcons.tsx` - Icons consistentes
15. (nuevo) `app/not-found.tsx` - Página 404

---

## PRIORIDADES

| # | Prioridad | Componente | Cambio |
|---|-----------|-----------|--------|
| 1 | 🔴 CRÍTICO | Navbar | Height 80px fijo |
| 2 | 🔴 CRÍTICO | Layout/Globals | Clases premium |
| 3 | 🔴 CRÍTICO | Footer | pt-[120px] |
| 4 | 🔴 CRÍTICO | Botones | .btn-premium |
| 5 | 🟡 IMPORTANTE | Hero | Margin + botones |
| 6 | 🟡 IMPORTANTE | Cards | border-radius 24px |
| 7 | 🟡 IMPORTANTE | Sobre Mí | Foto redonda |
| 8 | 🟡 IMPORTANTE | Contacto | Formulario centrado |
| 9 | 🟢 MEJORA | Animaciones | Scroll + hover |
| 10 | 🟢 MEJORA | Popup | Estilos premium |
| 11 | 🟢 MEJORA | 404 | Página personalizada |

---

## RESUMEN DE CLASES A CREAR

| Clase | Propósito |
|-------|-----------|
| .container-premium | max-w-1200px + px-5% |
| .section-premium | py-100px |
| .btn-premium | border-radius 50px + padding 12px 24px |
| .btn-premium-primary | bg-primary |
| .btn-premium-outline | border white/20 |
| .card-premium | border-radius 24px + padding 30px |
| .input-premium | input consistente |
| .divider | separador mejorado |
| .scroll-animate | animaciones al scroll |
