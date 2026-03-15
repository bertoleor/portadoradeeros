# Plan: Página de Contacto - Implementación v2

## Nuevos Requisitos del Usuario (Actualizado)

### Problemas Identificados:
1. Card de info es gris, debe ser NEGRA
2. Elementos están pegados entre sí y a los bordes
3. Inputs son rectángulos redondeados, deben ser solo una línea sutil (subrayado)
4. Iconos en círculos - deben ser solo el SVG en blanco
5. Componentes muy_chicos - deben ocupar más espacio
6. Título está pegado a los componentes

---

## 1. Diseño Actual vs Necesario

### Info Card (actual):
- Fondo: `#F5F5F7` (gris)
- Iconos en círculos blancos
- Elementos pegados

### Info Card (necesario):
- Fondo: `#000000` (negro puro)
- Iconos: solo SVG en blanco, SIN círculo
- Espaciado generoso entre elementos
- Elementos pegados al borde inferior

### Input (actual):
- Rectángulo con border redondeado
- `border rounded-2xl`

### Input (necesario):
- Solo subrayado sutil
- `border-b border-gray-300 focus:border-black`
- Sin background, sin border completo

---

## 2. Especificaciones Actualizadas

### Colores:
- Card info: `bg-black text-white`
- Iconos: `text-white` (sin fondo)
- Input underline: `border-b border-gray-300 hover:border-gray-400 focus:border-black`

### Espaciado (Air):
- Card padding: `p-10 sm:p-12` (más grande)
- Gap entre elementos card: `gap-6`
- Margin bottom del título: `mb-10` (antes era 4)
- Margin bottom del grid: `gap-12` (antes era 8)

### Input Style:
```tsx
// Nuevo estilo de input - solo subrayado
<input 
  className="
    w-full
    bg-transparent
    border-b border-gray-300
    py-3
    text-base
    focus:outline-none focus:border-black
    transition-colors
  "
/>
```

### Iconos Info Card:
```tsx
// Sin contenedor, solo el icono
<a href="..." className="text-white/70 hover:text-white transition-colors">
  <Instagram className="w-6 h-6" />
</a>
```

---

## 3. Código Actualizado

### Info Card:
```tsx
<div className="bg-black rounded-3xl p-10 sm:p-12 text-white">
  <h2 className="text-2xl font-light mb-6">Nombre</h2>
  <p className="text-white/70 mb-8 leading-relaxed">Descripción</p>
  
  {/* Email sin círculo */}
  <a href="mailto:..." className="flex items-center gap-4 text-white/70 hover:text-white mb-6">
    <Mail className="w-5 h-5" />
    <span>email</span>
  </a>
  
  {/* Iconos en hilera, sin círculo */}
  <div className="flex gap-6 pt-4">
    <a href="..."><Instagram className="w-6 h-6 text-white/70 hover:text-white" /></a>
    <a href="..."><MessageCircle className="w-6 h-6 text-white/70 hover:text-white" /></a>
  </div>
</div>
```

### Input Subrayado:
El componente Input debe cambiar a:
```tsx
<input
  className={`
    w-full
    bg-transparent
    border-b ${error ? 'border-red-500' : 'border-gray-300'} 
    py-3 px-1
    text-base
    focus:outline-none focus:border-black
    transition-colors
    placeholder:text-gray-400
  `}
  {...props}
/>
```

---

## 4. Checklist de Cambios

| Paso | Componente | Cambio |
|------|------------|--------|
| 1 | Info Card | bg-black, text-white |
| 2 | Info Card | padding p-10, gap-6 |
| 3 | Info Card | Iconos sin círculo, solo SVG |
| 4 | Info Card | Título margin-bottom mb-10 |
| 5 | Input | Cambiar a estilo subrayado |
| 6 | Grid | gap-12 en lugar de gap-8 |
