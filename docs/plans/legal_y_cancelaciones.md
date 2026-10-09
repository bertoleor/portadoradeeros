# Plan: Implementación de Marco Legal y Gestión de Cancelaciones

## Objetivo

Establecer un marco legal sólido (Términos, Condiciones y Cancelación), proteger la propiedad
intelectual del sitio y estandarizar el flujo de cancelaciones tanto para el admin como para el
cliente.

---

## 1. Nuevas Páginas Legales [PRESENTATION]

### 1.1 `src/app/terminos/page.tsx`

- **Contenido**: Propiedad intelectual (nombre, marca, contenidos), limitación de responsabilidad
  (naturaleza de servicios esotéricos), mayoría de edad, y confidencialidad.
- **Protección IP**: Cláusulas específicas prohibiendo la reproducción total o parcial del diseño y
  nombre "Portadora de Eros".

### 1.2 `src/app/politica-cancelacion/page.tsx`

- **Contenido**: Tiempo de aviso mínimo (ej. 24hs), política de reembolsos (si aplica), casos de
  "no-show" y reprogramaciones.

### 1.3 `src/app/privacidad/page.tsx`

- **Contenido**: Tratamiento de datos personales (email, teléfono) según normativas vigentes.

---

## 2. Cambios en el Flujo de Reserva [APPLICATION]

### 2.1 `ServiceContactForm.tsx` (Componente de Reserva)

- **Checkbox Obligatorio**: Antes de "Confirmar Turno", el usuario debe marcar una casilla:
  > "He leído y acepto los [Términos y Condiciones](/terminos) y la
  > [Política de Cancelación](/politica-cancelacion)."
- **Validación**: Impedir la confirmación si no está marcado.

---

## 3. Gestión de Cancelaciones [INFRASTRUCTURE]

### 3.1 Cancelación por el Admin

- Ya implementada en el Calendario Admin. El admin puede cancelar y el sistema envía el email
  `turno-cancelado.html`.

### 3.2 Cancelación por el Cliente (Autogestión vs Manual)

- **Propuesta**: Mantener el pedido vía WhatsApp para asegurar la comunicación directa, pero agregar
  un link "Solicitar Cancelación" en el email de confirmación que redirija a WhatsApp con un mensaje
  pre-armado:
  > "Hola Portadora de Eros, deseo solicitar la cancelación de mi turno para el [FECHA] a las
  > [HORA]."

---

## 4. Mejoras de UI y Footer [PRESENTATION]

### 4.1 `Footer.tsx`

- Agregar enlaces a:
  - Términos y Condiciones
  - Política de Cancelación
  - Privacidad
- Actualizar el Copyright para que sea más explícito:
  `© 2024 Portadora de Eros. Todos los derechos reservados. Queda prohibida la reproducción total o parcial de este sitio.`

---

## 5. Orden de Implementación

1.  **Fase 1**: Crear las 3 páginas legales con estilo premium minimalista.
2.  **Fase 2**: Actualizar el `Footer` con los links correspondientes.
3.  **Fase 3**: Integrar el checkbox de aceptación en el formulario de reserva pública.
4.  **Fase 4**: Actualizar plantillas de email con links a las políticas.

---

## Preguntas para JACQUE:

1. ¿Cuál es el tiempo mínimo de cancelación (24hs, 48hs)?
2. ¿Hay reembolso total, parcial o solo reprogramación?
3. ¿Tenés algún texto legal ya redactado o querés que genere una propuesta base?
