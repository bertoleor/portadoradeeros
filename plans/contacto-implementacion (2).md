# Plan: Página de Contacto - Implementación

## 1. Análisis del Estado Actual

### 1.1 Archivos Involucrados

| Archivo                 | Problema Identificado                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `layout.tsx` (línea 68) | `<main className="flex-grow flex flex-col pt-20 sm:pt-24">` - El padding-top es para el navbar fixed |
| `Navbar.tsx` (línea 24) | `h-24` = 96px de altura, fixed position                                                              |
| `contacto/page.tsx`     | Usa grid pero el contenido no está centrado correctamente                                            |

### 1.2 Estructura Actual del Layout

```
┌─────────────────────────────────────┐
│  Navbar (fixed, h-24 = 96px)       │
├─────────────────────────────────────┤
│  main (pt-20 sm:pt-24)             │
│  ┌─────────────────────────────┐    │
│  │  contenido                  │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  Footer                             │
└─────────────────────────────────────┘
```

### 1.3 Problema Específico

El usuario reporta:

- Contenido aparece "arriba a la izquierda"
- No está centrado
- El navbar tapa el contenido
- Se ve "apretado"

### 1.4 Causa Raíz

El `pt-20 sm:pt-24` en el main debería ser suficiente (80px-96px), pero:

1. El navbar en mobile puede tener menú desplegable que aumenta la altura
2. El contenido dentro del page no tiene `min-height` adecuado
3. El grid de dos columnas necesita centrarse horizontalmente

---

## 2. Solución Propuesta

### 2.1 Cambios en layout.tsx

**Mantener el padding-top actual**, pero aseguramos que el main tenga altura mínima:

```tsx
// CURRENT (línea 68):
<main className="flex-grow flex flex-col pt-20 sm:pt-24">

// PROPUESTO:
<main className="flex-grow flex flex-col pt-20 sm:pt-24 min-h-[calc(100vh-6rem)]">
```

### 2.2 Estructura de la Página de Contacto

La página debe tener:

1. **Centrado horizontal**: `mx-auto` en el contenedor
2. **Centrado vertical**: El main ya tiene `flex flex-col` pero podemos agregar `justify-center`
3. **Ancho máximo**: `max-w-4xl` o `max-w-5xl`
4. **Espaciado interno**: Padding adecuado

### 2.3 Código Propuesto para contacto/page.tsx

```tsx
"use client";

import { useState, FormEvent } from "react";
import { Button, Input, TextArea } from "@/components/ui";
import {
  Send,
  CheckCircle2,
  Mail,
  Instagram,
  MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";

// ... (保持现有的 contactInfo y estados)

// IF IS SUBMITTED - pantalla de éxito:
if (isSubmitted) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] px-4">
      <div className="max-w-md w-full text-center">
        {/* ... contenido del éxito ... */}
      </div>
    </div>
  );
}

// MAIN RENDER:
return (
  <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] px-4 py-12">
    {/* Contenedor centrado con ancho máximo */}
    <div className="w-full max-w-4xl">
      {/* Header centrado */}
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-[0.5em] text-gray-400 block mb-4">
          Contacto
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-light">
          Hablemos
        </h1>
      </div>

      {/* Grid de dos columnas - CENTRADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Columna Izquierda: Info Card */}
        <div className="bg-gray-50 rounded-3xl p-8">
          <h2 className="text-xl font-light mb-4">Portadora de Eros</h2>
          <p className="text-gray-500 mb-6">Descripción...</p>

          {/* Email link */}
          <a href="mailto:..." className="flex items-center gap-3 mb-4">
            <Mail className="w-4 h-4" />
            <span>email</span>
          </a>

          {/* Socials */}
          <div className="flex gap-3">
            <a href="...">
              <Instagram />
            </a>
            <a href="...">
              <MessageCircle />
            </a>
          </div>
        </div>

        {/* Columna Derecha: Formulario */}
        <div>
          <form className="space-y-4">
            <Input label="Nombre" placeholder="Tu nombre" required />
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              required
            />
            <Input label="Teléfono" type="tel" placeholder="+54 9..." />
            <TextArea label="Mensaje" rows={4} placeholder="..." required />
            <Button type="submit" fullWidth>
              Enviar
            </Button>
          </form>
        </div>
      </div>
    </div>
  </div>
);
```

---

## 3. Checklist de Implementación

| Paso | Acción                                             | Archivo             |
| ---- | -------------------------------------------------- | ------------------- |
| 1    | Modificar el main del layout para tener min-height | `layout.tsx`        |
| 2    | Reescribir completamente la página de contacto     | `contacto/page.tsx` |
| 3    | Usar flexbox para centrar contenido                | `contacto/page.tsx` |
| 4    | Usar grid con `md:grid-cols-2`                     | `contacto/page.tsx` |
| 5    | Testing en mobile y desktop                        | -                   |

---

## 4. Especificaciones de Diseño

### 4.1 Colores (iOS Black & White)

- Fondo: `#FFFFFF` (white)
- Texto: `#1D1D1F` (black)
- Gris texto: `#86868B`
- Fondo card info: `#F5F5F7` (gray-50)
- Botón primary: `#000000`

### 4.2 Tipografía

- Títulos: font-light, tracking-wide
- Body: font-light
- Labels: text-sm, normal weight

### 4.3 Espaciado (Air)

- Padding página: `px-4 py-12`
- Padding cards: `p-8`
- Gap grid: `gap-8`
- Margin sections: `mb-12`

### 4.4 Bordes

- Cards: `rounded-3xl`
- Inputs: `rounded-2xl`
- Buttons: `rounded-full`

---

## 5. Validación Visual Esperada

### Mobile (375px)

```
┌─────────────────────┐
│     (navbar)       │
├─────────────────────┤
│      CONTACTO       │  ← centered
│                    │
│  ┌─────────────┐   │
│  │  INFO CARD  │   │  ← full width
│  └─────────────┘   │
│                    │
│  ┌─────────────┐   │
│  │    FORM     │   │  ← full width
│  └─────────────┘   │
│                    │
└─────────────────────┘
```

### Desktop (1440px)

```
┌─────────────────────────────────────────┐
│              (navbar)                    │
├─────────────────────────────────────────┤
│                 CONTACTO                │  ← centered
│                                          │
│   ┌─────────────┐  ┌─────────────────┐  │
│   │  INFO CARD  │  │      FORM       │  │  ← centered grid
│   │   (gray)    │  │    (white)      │  │
│   └─────────────┘  └─────────────────┘  │
│                                            │
└─────────────────────────────────────────┘
```

---

## 6. Notas Importantes

1. **No usar Container component** - usar div con `mx-auto` y `max-w-` directamente
2. **min-height del page** - usar `min-h-[calc(100vh-12rem)]` para centrar verticalmente
3. **Navbar fixed** - mantener pt-20 sm:pt-24 en el main
4. **Inputs** - los componentes UI ya tienen sus propios estilos
5. **Prueba en ambos tamaños** - mobile primero, luego desktop
