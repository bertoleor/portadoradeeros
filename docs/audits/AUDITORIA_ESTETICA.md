# AUDITORÍA ESTÉTICA COMPLETA Y MINUCIOSA - Portadora de Eros

> Parte de: [[projects/eros/README|README]] · Relacionados: [[INDICE-AUDITS]] ·
> [[05-identidad-visual]] · [[PLAN_CORRECCIONES]]

## RESUMEN EJECUTIVO

El proyecto presenta múltiples problemas de consistencia visual, espaciado y diseño que causan la
sensación de "sitio apretado", "sin aire" y "componentes de baja calidad".

### PROBLEMAS PRINCIPALES IDENTIFICADOS:

1. **Ancho de contenedor INCONSISTENTE** - Diferentes max-width en cada página
2. **Padding horizontal HARDCODEADO** - px-6, px-8, px-12 sin consistencia
3. **Navbar INESTABLE** - Cambia de tamaño al hacer scroll
4. **Botones INCONSISTENTES** - Diferentes estilos en cada sección
5. **Cards DEFICIENTES** - Bordes casi invisibles, border-radius incorrecto
6. **Footer APRETADO** - Poco espacio superior
7. **COLORES INCONSISTENTES** - Diferentes opacidades de bordes
8. **Formulario de contacto PEQUEÑO** - No centrado, sin "aire"
9. **Sobre mí DESCENTRADO** - Foto no es redonda, layout incorrecto
10. **Falta sistema de componentes reutilizables**

---

## 1. ANÁLISIS DE COLORES Y CONSISTENCIA

### Paleta Actual (globals.css):

```
--primary: #D11019 (rojo vibrante)
--primary-light: #F01A24
--primary-dark: #9A0710
--surface: #0a0505 (casi negro)
--cream: #ffffff (blanco)
```

### Inconsistencias Encontradas:

| Elemento          | Color Usado           | Problema                  |
| ----------------- | --------------------- | ------------------------- |
| Bordes cards      | border-white/10       | Muy sutil, casi invisible |
| Bordes formulario | border-white/10       | Inconsistente con otros   |
| Bordes footer     | border-white/5        | Diferente opacidad        |
| Bordes navbar     | border-white/5        | Otra opacidad más         |
| Botón primario    | bg-primary            | ✅ Consistente            |
| Botón secundario  | bg-white/5            | ✅ Consistente            |
| Fondo glass       | bg-white/5 a white/10 | ❌ Inconsistente          |

### SOLUCIÓN REQUERIDA:

- Crear una escala de opacidad UNIFICADA para bordes
- Definir clases reutilizables: `.border-subtle`, `.border-medium`, `.border-visible`
- Usar siempre la misma escala: white/5, white/10, white/20

---

## 2. ANÁLISIS DE CONTENEDORES Y ANCHOS

### Estado Actual:

| Archivo/Componente             | max-width Actual   | max-width Debe Ser |
| ------------------------------ | ------------------ | ------------------ |
| globals.css .section-container | 1200px             | ✅ 1200px          |
| ServiceCarousel                | max-w-6xl (1152px) | ❌ 1200px          |
| Footer                         | max-w-6xl (1152px) | ❌ 1200px          |
| Servicios page                 | max-w-6xl (1152px) | ❌ 1200px          |
| Sobre-mi page                  | max-w-6xl (1152px) | ❌ 1200px          |
| Contacto page                  | max-w-6xl (1152px) | ❌ 1200px          |
| Hero                           | max-w-4xl (896px)  | ❌ 1200px          |

### Inconsistencia de Padding Horizontal:

| Componente      | Padding Actual | Problema    |
| --------------- | -------------- | ----------- |
| Navbar          | px-8 md:px-16  | ❌ No es 5% |
| Hero            | px-6           | ❌ No es 5% |
| ServiceCarousel | px-8           | ❌ No es 5% |
| Servicios       | px-8           | ❌ No es 5% |
| Sobre-mi        | px-8 lg:px-12  | ❌ No es 5% |
| Contacto        | px-8 lg:px-12  | ❌ No es 5% |
| Footer          | px-8           | ❌ No es 5% |

### SOLUCIÓN REQUERIDA:

- Crear clase `.container-premium` = `max-w-[1200px] mx-auto px-[5%]`
- Aplicar a TODOS los contenedores principales

---

## 3. ANÁLISIS DE PADDING VERTICAL

| Página/Sección  | Padding Top   | Padding Bottom | Debe Ser  |
| --------------- | ------------- | -------------- | --------- |
| Navbar normal   | py-10 (~60px) | -              | 80px fijo |
| Navbar scrolled | py-6 (~40px)  | -              | ❌ CAMBIA |
| Hero            | min-h-screen  | -              | ✅ OK     |
| ServiceCarousel | py-32 (128px) | -              | ✅ OK     |
| Servicios page  | pt-32 (128px) | pb-20 (80px)   | ❌ pb-100 |
| Sobre-mi page   | pt-32 (128px) | pb-20 (80px)   | ❌ pb-100 |
| Contacto page   | pt-32 (128px) | pb-20 (80px)   | ❌ pb-100 |
| Footer          | -             | pb-12 (48px)   | ✅ OK     |

### SOLUCIÓN REQUERIDA:

- Navbar: altura FIJA de 80px
- Páginas: padding-bottom mínimo de 100px

---

## 4. ANÁLISIS DE NAVBAR

### Estado Actual (Navbar.tsx):

```tsx
// Líneas 54-59
className={`mx-auto w-full transition-all duration-700 ease-in-out px-8 md:px-16 ${
  isScrolled
    ? 'py-6 glass border-b border-white/5'  // ← PROBLEMA: cambia a py-6
    : 'py-10 bg-transparent'
}`}
```

### Problemas Identificados:

| Aspecto            | Actual                    | Problema              |
| ------------------ | ------------------------- | --------------------- |
| Altura normal      | py-10 (~60px + contenido) | ✅ ~80px OK           |
| Altura scrolled    | py-6 (~40px + contenido)  | ❌ Se reduce 20px     |
| Transición         | Solo padding              | ❌ Debe mantener 80px |
| Padding horizontal | px-8 md:px-16             | ❌ No es 5%           |
| Glass effect       | bg-white/5 + blur(16px)   | ⚠️ Podría mejorarse   |
| Ocultar con scroll | isVisible state           | ✅ Implementado       |

### Problema Visual:

Cuando se hace scroll, la navbar "salta" porque cambia de py-10 a py-6, empujando el contenido hacia
arriba.

### SOLUCIÓN REQUERIDA:

- Height FIJO de 80px (no cambiar con scroll)
- Padding: 0 5% (o py-0 con altura fija)
- Glass effect con backdrop-filter: blur(10px), background: rgba(10,5,5,0.8)
- Transición suave de opacity/background, NO de tamaño

---

## 5. ANÁLISIS DE HERO

### Estado Actual (Hero.tsx):

| Aspecto    | Código Actual           | Problema                     |
| ---------- | ----------------------- | ---------------------------- |
| Contenedor | max-w-4xl (896px)       | ❌ Debe ser 1200px           |
| Padding    | px-6                    | ❌ No es 5%                  |
| Título     | text-6xl a text-[120px] | ❌ Sin margin-bottom         |
| Botón 1    | px-8 py-4 glass         | ❌ Falta border-radius: 50px |
| Botón 1    | glass border-elegant    | ❌ Falta padding: 12px 24px  |
| Botón 2    | px-8 py-4 bg-primary    | ❌ Falta border-radius: 50px |

### Problema Específico - Botones (líneas 56-70):

```tsx
// Botón 1 - PROBLEMA:
className =
  'flex items-center justify-center gap-4 px-8 py-4 glass border-elegant text-sm font-medium';
// ❌ Falta: border-radius: 50px
// ❌ Padding correcto debe ser: 12px 24px, no 8px 32px

// Botón 2 - PROBLEMA:
className =
  'flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white text-sm font-medium';
// ❌ Falta: border-radius: 50px
```

### SOLUCIÓN REQUERIDA:

- Contenedor: max-w-[1200px]
- Padding: 5%
- Título: margin-bottom: 40px
- Botones UNIFICADOS:
  - border-radius: 50px
  - padding: 12px 24px
  - font-weight: 300 (ligero)
  - Una sola clase reutilizable `.btn-premium`

---

## 6. ANÁLISIS DE SERVICE CARDS

### Estado Actual (ServiceCard.tsx):

| Aspecto       | Código Actual   | Problema         |
| ------------- | --------------- | ---------------- |
| Padding       | p-8 (32px)      | ⚠️ Cerca de 30px |
| Border-radius | rounded-[20px]  | ❌ Debe ser 24px |
| Borde         | border-white/10 | ❌ Muy sutil     |
| Bottom action | -mx-8 px-8      | ❌ Rompe padding |

### Problema Visual:

El "bottom action" de la card usa margin negativo para extender al borde, pero esto rompe la
consistencia del padding interno.

### SOLUCIÓN REQUERIDA:

- Padding: p-[30px] (exacto)
- Border-radius: rounded-[24px]
- Borde: border-white/10 + box-shadow sutil O background diferente
- Eliminar hack -mx-8, hacer padding consistente
- Crear componente reutilizable `<ServiceCard />` con estilos unificados

---

## 7. ANÁLISIS DE SERVICE CAROUSEL

### Estado Actual (ServiceCarousel.tsx):

| Aspecto            | Código Actual      | Problema               |
| ------------------ | ------------------ | ---------------------- |
| Section padding    | py-32 (128px)      | ✅ OK                  |
| Contenedor         | max-w-6xl (1152px) | ❌ 1200px              |
| Padding horizontal | px-8               | ❌ 5%                  |
| Grid gap           | No hay grid        | ❌ Solo 1 card visible |
| Indicadores        | w-8/w-1.5          | ⚠️ Pequeños            |

### SOLUCIÓN REQUERIDA:

- max-w-[1200px]
- padding-inline: 5%
- Mostrar múltiples cards con gap: 24px
- O mejorar el carrusel para que se vea más espacioso

---

## 8. ANÁLISIS DE PÁGINA SERVICIOS

### Estado Actual (servicios/page.tsx):

| Aspecto            | Código              | Problema          |
| ------------------ | ------------------- | ----------------- |
| Padding top        | pt-32               | ✅ OK             |
| Padding bottom     | pb-20               | ❌ Debe ser 100px |
| Padding horizontal | px-8                | ❌ 5%             |
| Contenedor         | max-w-6xl           | ❌ 1200px         |
| Grid gap           | gap-10 lg:gap-14    | ❌ Inconsistente  |
| Título             | text-5xl a text-7xl | ✅ OK             |

### SOLUCIÓN REQUERIDA:

- pb-[100px] (mínimo)
- px-[5%]
- max-w-[1200px]
- gap-[24px] consistente

---

## 9. ANÁLISIS DE PÁGINA SOBRE MÍ

### Estado Actual (sobre-mi/page.tsx):

| Aspecto            | Código         | Problema                 |
| ------------------ | -------------- | ------------------------ |
| Foto               | aspect-[4/5]   | ❌ NO es redonda         |
| Foto border-radius | rounded-[32px] | ❌ Debe ser rounded-full |
| Layout             | 50/50 grid     | ⚠️ Pero DESCENTRADO      |
| Padding bottom     | pb-20          | ❌ Debe ser 100px        |
| Padding horizontal | px-8 lg:px-12  | ❌ 5%                    |
| Contenedor         | max-w-6xl      | ❌ 1200px                |

### Problema Específico - Foto (líneas 40-47):

```tsx
// ACTUAL - Foto rectangular:
<div className="relative z-10 rounded-[32px] overflow-hidden border border-white/5 aspect-[4/5]">
// ❌ NO es redonda

// DEBE SER:
<div className="relative z-10 rounded-full overflow-hidden border border-white/10 aspect-square">
```

### Problema de Layout:

- Foto a la izquierda ✅
- Texto a la derecha ✅
- PERO: Todo está a la izquierda del contenedor, no centrado
- El container tiene max-w-6xl y está centrado, pero el contenido dentro no usa todo el espacio

### SOLUCIÓN REQUERIDA:

- Foto: border-radius: rounded-full, aspect-square
- Layout: Foto a izquierda, texto a derecha, pero más espacio entre ellos
- Centrar todo el bloque dentro del contenedor
- Padding bottom: 100px
- Padding horizontal: 5%

---

## 10. ANÁLISIS DE PÁGINA CONTACTO

### Estado Actual (contacto/page.tsx):

| Aspecto            | Código          | Problema          |
| ------------------ | --------------- | ----------------- |
| Padding top        | pt-32           | ✅ OK             |
| Padding bottom     | pb-20           | ❌ Debe ser 100px |
| Padding horizontal | px-8 lg:px-12   | ❌ 5%             |
| Contenedor         | max-w-6xl       | ❌ 1200px         |
| Formulario         | p-10 (40px)     | ⚠️ Podría ser más |
| Formulario tamaño  | lg:col-span-7   | ❌ PEQUEÑO        |
| Campos             | grid 2 columnas | ✅ OK             |

### Problemas Específicos:

1. **Formulario pequeño** - lg:col-span-7 de 12 = ~58% del ancho
2. **No centrado** - El form está a la derecha, la info a la izquierda
3. **Sin "aire"** - El formulario toca los bordes del card

### SOLUCIÓN REQUERIDA:

- Padding bottom: 100px
- Padding horizontal: 5%
- max-w-[1200px]
- Formulario más GRANDE (lg:col-span-6 o 7 de 12)
- Formulario CENTRADO O más espaciado
- Padding interno del form: p-12 o más
- Botones unificados con otros botones del sitio

---

## 11. ANÁLISIS DE FOOTER

### Estado Actual (Footer.tsx):

| Aspecto            | Código        | Problema           |
| ------------------ | ------------- | ------------------ |
| Padding top        | pt-20 (80px)  | ❌ Debe ser ~120px |
| Padding bottom     | pb-12 (48px)  | ✅ OK              |
| Padding horizontal | px-8          | ❌ 5%              |
| Contenedor         | max-w-6xl     | ❌ 1200px          |
| Columnas           | 3 columnas    | ✅ OK              |
| Grid gap           | gap-12 (48px) | ✅ OK              |

### SOLUCIÓN REQUERIDA:

- pt-[120px] o más (mucho espacio superior)
- px-[5%]
- max-w-[1200px]
- Tipografía más pequeña pero legible

---

## 12. FALTA DE COMPONENTES REUTILIZABLES

### Componentes que deberían existir:

| Componente      | Estado           | Propuesta                                                |
| --------------- | ---------------- | -------------------------------------------------------- |
| Button variants | ❌分散           | Crear `<Button variant="primary\|secondary\|outline" />` |
| Card            | ❌ Inconsistente | Unificar `<PremiumCard />`                               |
| Section         | ❌ No existe     | Crear `<Section padding="100px">`                        |
| Container       | ❌ No existe     | Crear `<Container>`                                      |
| Input           | ❌ Inconsistente | Unificar `<Input />`                                     |
| IconButton      | ❌ No existe     | Crear `<IconButton />`                                   |

### SOLUCIÓN REQUERIDA:

- Crear sistema de componentes en `/components/ui/`
- Documentar estilos en globals.css
- Usar clases utilitarias consistentes

---

## 13. INCONSISTENCIA DE TIPOGRAFÍA

| Elemento    | Peso Actual         | Peso Debe Ser     |
| ----------- | ------------------- | ----------------- |
| Títulos h1  | font-light (300)    | 500               |
| Títulos h2  | font-light (300)    | 500               |
| Títulos h3  | font-semibold (600) | 500               |
| Body text   | font-light (300)    | ✅ 300 OK         |
| Line-height | 1.6                 | ✅ OK             |
| Botones     | font-medium (500)   | ⚠️ Podría ser 300 |

### SOLUCIÓN REQUERIDA:

- Títulos: font-weight: 500
- Body: font-weight: 300
- Botones: font-weight: 300 o 400

---

## 14. RESUMEN DE ERRORES CRÍTICOS

### 🔴 CRÍTICO - Afecta la experiencia:

1. ❌ Navbar cambia de tamaño al hacer scroll
2. ❌ Contenedores con anchos diferentes (896px, 1152px, 1200px)
3. ❌ Padding hardcodeado en vez de 5%
4. ❌ Footer con poco espacio superior

### 🟡 IMPORTANTE - Afecta la calidad:

5. ❌ Botones sin border-radius: 50px
6. ❌ Cards con border-radius: 20px (debe ser 24px)
7. ❌ Página Sobre mí foto no es redonda
8. ❌ Formulario de contacto pequeño y descentrado

### 🟢 MEJORA - Consistencia:

9. ❌ Colores de bordes inconsistentes
10. ❌ Falta sistema de componentes reutilizables
11. ❌ Tipografía inconsistente (pesos)

---

## 15. RECOMENDACIONES DE DISEÑO

### Sistema de Colores Unificado:

```
Bordes:
- border-subtle: border-white/5
- border-default: border-white/10
- border-visible: border-white/20

Fondos:
- bg-card: bg-white/3 o bg-[#110808]
- bg-glass: bg-white/5 con backdrop-blur

Botones:
- Primary: bg-primary, text-white
- Secondary: bg-white/10, text-white
- Outline: border-white/20, text-white
```

### Espaciado Unificado:

```
- container-padding: px-[5%]
- section-padding: py-[100px]
- card-padding: p-[30px]
- button-padding: px-6 py-3 (12px 24px equiv)
- gap-default: gap-6 (24px)
```

### Border Radius Unificado:

```
- button: rounded-full (50px)
- card: rounded-[24px]
- input: rounded-[16px]
- small: rounded-[12px]
```
