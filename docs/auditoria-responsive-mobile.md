# Auditoría Responsive Mobile

## Resumen ejecutivo

El sitio **Portadora de Eros** presenta una base sólida en términos de diseño responsive. La mayoría de los componentes principales utilizan correctamente los breakpoints de Tailwind (`sm:`, `md:`) para adaptar el layout a dispositivos móviles. El proyecto implementa un navbar fijo con compensación de padding adecuada (`pt-16`), botones táctiles con áreas mínimas de 44px-48px, y una estructura de grillas que colapsa correctamente de desktop a mobile.

Sin embargo, se identificaron **problemas moderados** que afectan la experiencia en dispositivos móviles de pantalla pequeña, principalmente relacionados con alturas fijas en carruseles que pueden generar scroll innecesario, y algunos elementos cuya legibilidad o interacción podría mejorarse en viewports menores a 375px.

---

## Severidad de problemas encontrados

| Severidad | Cantidad |
|-----------|----------|
| 🔴 Crítico (rompe el layout) | 0 |
| 🟡 Moderado (se ve mal pero funciona) | 8 |
| 🟢 Menor (pulido) | 4 |

---

## Breakpoints utilizados en el proyecto

El proyecto utiliza una estrategia **mobile-first** inconsistente:

- **Predominante:** `md:` (768px) como breakpoint principal
- **Secundario:** `sm:` (640px) para ajustes finos
- **Terciario:** `lg:` (1024px), `xl:` (1280px) para desktop
- **Problema:** Algunos componentes usan `md:` mientras otros Saltan directamente a desktop-first en algunos casos específicos

---

## Problemas por componente

### ServiceCarousel.tsx

**Archivo:** `src/components/client/ServiceCarousel.tsx`

#### 🟡 Moderado

- **Problema:** Altura fija de card en mobile (420px) que puede ser excesiva en pantallas pequeñas
  **Línea aprox:** 56
  **Código actual:** `h-[420px] md:h-[380px]`
  **Impacto:** En dispositivos con altura de viewport menor a 700px, la card ocupa casi toda la pantalla, dificultando la navegación vertical

- **Problema:** Skeleton loader usa el mismo tamaño fijo
  **Línea aprox:** 139
  **Código actual:** `h-[420px]`
  **Impacto:** Mismo problema de altura en carga

- **Problema:** Ancho de card en mobile (78%) puede dejar demasiado espacio vacío en pantallas muy anchas (>400px)
  **Línea aprox:** 384
  **Código actual:** `w-[78%] md:w-[60%]`
  **Impacto:** No es crítico pero podría optimizarse con un rango más granular

#### 🟢 Menor

- **Problema:** Dots de paginación en mobile podrían tener mayor área táctil
  **Línea aprox:** 407
  **Código actual:** `w-8` para activo, `w-1.5` para inactivo
  **Impacto:** El dot inactivo es pequeño (6px), aunque el área de click es mayor por el botón

---

### ServicesMobileCarousel.tsx

**Archivo:** `src/components/client/ServicesMobileCarousel.tsx`

#### 🟢 Menor

- **Problema:** Tarjetas con alto fijo de 320px en mobile
  **Línea aprox:** 18
  **Código actual:** `min-h-[320px]`
  **Impacto:** Puede generar scroll excesivo si el contenido es corto

---

### ServiceContactForm.tsx

**Archivo:** `src/components/client/ServiceContactForm.tsx`

#### 🟡 Moderado

- **Problema:** Contenedor principal con altura mínima fija (520px) que puede causar overflow en viewports muy pequeños
  **Línea aprox:** 362
  **Código actual:** `min-h-[520px]`
  **Impacto:** En iPhone SE / dispositivos pequeños (320px height), el formulario puede verse cortado o requerir scroll horizontal

- **Problema:** Altura de botones de navegación entre pasos inconsistentemente grande
  **Línea aprox:** 79, 117, 134, 152
  **Código actual:** `py-7`, `py-6`
  **Impacto:** Ocupa demasiado espacio vertical en mobile, reduciendo área visible del formulario

#### 🟢 Menor

- **Problema:** Inputs en paso de cliente con altura de 56px (h-14) pero el grid es de 2 columnas
  **Línea aprox:** 98
  **Código actual:** `h-14 rounded-2xl`
  **Impacto:** En mobile (grid de 1 columna), podría ajustarse la altura

---

### Navbar.tsx

**Archivo:** `src/components/client/Navbar.tsx`

#### Sin problemas detectados

- El navbar implementa correctamente:
  - Altura fija de 64px (`h-16`)
  - Compensación de padding en Shell (`pt-16`)
  - Botón de menú móvil con área táctil de 44px mínima
  - Menú desplegable con z-index adecuado
  - Transiciones fluidas

---

### Footer.tsx

**Archivo:** `src/components/client/Footer.tsx`

#### 🟡 Moderado

- **Problema:** Uso de `<br className="md:hidden" />` para romper líneas no es confiable
  **Línea aprox:** 132
  **Código actual:** `<br className="md:hidden" />`
  **Impacto:** En algunos navegadores/dispositivos, el break puede no funcionar como esperado. Recomendable usar clases de utilidad de Tailwind

#### 🟢 Menor

- **Problema:** Copyright en mobile tiene texto muy pequeño
  **Línea aprox:** 131
  **Código actual:** `text-[10px]`
  **Impacto:** Puede ser difícil de leer en algunas pantallas

---

### Hero.tsx

**Archivo:** `src/components/client/Hero.tsx`

#### Sin problemas detectados

- Implementación correcta de:
  - Tipografía responsive: `text-3xl sm:text-6xl md:text-7xl`
  - Botones con `min-h-[48px]` (sobrepasa el mínimo de 44px)
  - Layout flexible con `flex-col sm:flex-row`
  - Padding adaptativo

---

### page.tsx (Servicios)

**Archivo:** `src/app/servicios/page.tsx`

#### 🟡 Moderado

- **Problema:** Grid masonry con `columns-2` en mobile puede mostrar contenido muy angosto
  **Línea aprox:** 114
  **Código actual:** `columns-2 gap-4`
  **Impacto:** En dispositivos menores a 360px de ancho, las columns pueden ser muy estrechas (≈150px)

- **Problema:** Tarjetas con `min-h-[340px]` y `min-h-[280px]` en mobile
  **Línea aprox:** 128
  **Código actual:** `min-h-[340px]`, `min-h-[280px]`
  **Impacto:** Alturas fijas combinadas con masonry pueden generar whitespace irregular

---

### contacto/page.tsx

**Archivo:** `src/app/contacto/page.tsx`

#### Sin problemas detectados

- Formularios con:
  - Inputs de 56px de altura (`min-h-[3.5rem]`)
  - Labels claros
  - Grid responsive `grid-cols-1 lg:grid-cols-2`
  - Targets táctiles adecuados (links sociales con padding `p-4`)

---

### servicios/[slug]/page.tsx

**Archivo:** `src/app/servicios/[slug]/page.tsx`

#### Sin problemas detectados

- Layout responsive bien implementado:
  - Grid `grid-cols-1 xl:grid-cols-12`
  - Tipografía escalable `text-2xl sm:text-3xl md:text-4xl lg:text-5xl`
  - Imágenes con sizes apropiados

---

### sobre-mi/page.tsx

**Archivo:** `src/app/sobre-mi/page.tsx`

#### Sin problemas detectados

- Página bien estructurada con:
  - Imagen de perfil responsive con aspect-ratio
  - Grid de valores colapsable
  - CTAs con buen tamaño táctil

---

### Shell.tsx

**Archivo:** `src/components/client/Shell.tsx`

#### Sin problemas detectados

- Implementación correcta del layout base:
  - `pt-16` para compensar navbar fijo
  - `min-h-[calc(100vh-8rem)]` cálculo correcto

---

### UI Components (Input, TextArea, Button)

**Archivos:** 
- `src/components/ui/Input.tsx`
- `src/components/ui/TextArea.tsx` 
- `src/components/ui/Button.tsx`

#### Sin problemas detectados

- Input: `min-h-[3.5rem]` (56px) ✓
- TextArea: `min-h-[140px]` ✓
- Button: Variantes con tamaños adecuados

---

## Problemas globales (globals.css / layout.tsx)

### layout.tsx

#### 🟡 Moderado

- **Problema:** Viewport permite zoom hasta 5x (`maximumScale: 5`)
  **Línea aprox:** 21
  **Código actual:** `maximumScale: 5`
  **Impacto:** Puede causar problemas de UX en mobile donde usuarios hacen zoom accidentalmente. Recomendación: usar `maximumScale: 1` o `1.05` para prevenir zoom no intencional pero permitir accesibilidad

### globals.css

#### Sin problemas detectados

- Body tiene `max-width: 100vw; overflow-x: hidden;` - Previene overflow horizontal
- Font weights y line-heights apropiados
- No hay tamaños de fuente fixados en px

---

## Orden de prioridad para el fix

### Prioridad 1 - Impacto visual moderado

1. **ServiceCarousel.tsx - Altura de cards**
   - Cambio: `h-[380px] md:h-[380px]` o usar `min-h` con max-height
   - Razón: Afecta la navegación principal del sitio

2. **servicios/page.tsx - Grid masonry**
   - Cambio: Usar `columns-1 md:columns-2` o `grid-cols-1 sm:grid-cols-2`
   - Razón: Mejora legibilidad en pantallas pequeñas

3. **layout.tsx - maximumScale**
   - Cambio: `maximumScale: 1.05`
   - Razón: Previene zoom accidental manteniendo accesibilidad

### Prioridad 2 - Pulido

4. **Footer.tsx - Br tag**
   - Cambio: Usar `flex-wrap` y css condicional en lugar de br
   - Razón: Mejor compatibilidad cross-browser

5. **ServiceContactForm.tsx - Altura mínima**
   - Cambio: Reducir a `min-h-[480px]` o usar altura responsive
   - Razón: Evita overflow en viewports pequeños

6. **ServiceCarousel.tsx - Skeleton height**
   - Cambio: Igual que las cards

### Prioridad 3 - Mejoras opcionales

7. Aumentar área de dots de paginación
8. Reducir altura de botones del formulario multi-paso
9. Ajustar tamaño de texto de copyright en Footer

---

## Conclusiones

El sitio tiene una **implementación responsive correcta en general**. Los problemas identificados son principalmente de **optimización para edge cases** (dispositivos muy pequeños o muy grandes) más que errores estructurales. No se encontraron problemas críticos que rompan la funcionalidad en mobile.

La arquitectura mobile-first está mayormente bien implementada, con uso consistente de breakpoints `sm:` y `md:`. Los principales puntos de mejora se concentran en:

1. Evitar alturas fixed excesivas en carruseles
2. Ajustar el grid masonry para viewports pequeños
3. Optimizar el formulario de contacto multi-paso para pantallas reducidas

---

## Stats

✓ Auditoría completada — 16 componentes/páginas revisados, 12 problemas encontrados (8 moderados, 4 menores)
