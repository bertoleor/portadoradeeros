# EROS — Identidad visual

> Parte de: [[projects/eros/README|README]] · Relacionados: [[04-branding]] ·
> [[eros-reporte-producto-marketing-estilo-2026-09-12]]

> Fuente: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/client/Hero.tsx`,
> `src/fonts/*`. Verificado 2026-09-15.

## Dirección de arte

Minimalismo cálido iOS: fondo casi blanco `#f8f9fb`, tinta negra suave `#1d1d1f`, grises suaves,
vidrio (glassmorphism) sobre `BackgroundMesh`. Nada de dorado/violeta "esotérico" clásico — la
mística va en la palabra, no en el color.

## Paleta (tokens en `globals.css`)

| Token             | Valor                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| `--black` / texto | `#1d1d1f` (en uso: `rgba(15,15,20,*)`)                                                                              |
| Fondo app         | `#f8f9fb`                                                                                                           |
| Grises            | `#333` / `#4a4a4a` / `#666` / `#86868b`                                                                             |
| Superficies       | `--background` `#fff`, `--secondary` `#f2f2f7`, `--muted` `#f5f5f7`                                                 |
| Bordes/inputs     | `#e5e5ea`                                                                                                           |
| Destructivo       | `#ff3b30`                                                                                                           |
| Selección         | fondo negro, texto blanco                                                                                           |
| Glass             | `rgba(255,255,255,0.15–0.45)` + `blur(20–24px)`, bordes blancos translúcidos, sombras `0 8px 32px rgba(0,0,0,0.08)` |
| Radio             | `--radius: 1rem`                                                                                                    |

## Tipografías (locales, `next/font/local`)

- **Sans:** Geist variable (`Geist-Latin.woff2`, `--font-sans`, cuerpo + UI).
- **Serif:** Playfair Display + itálica (`--font-serif`, acentos editoriales).
- Hero: `text-3xl sm:text-6xl md:text-7xl`, `font-light`, `tracking-tight`; eyebrow
  `uppercase tracking-[0.2–0.3em] text-xs`.

## Componentes de marca

- `.btn-primary` — negro sólido, pill, con brillo `::before`; hover eleva, active hunde.
- `.btn-outline` — borde fino sobre vidrio; hover rellena.
- Navbar fija + `pt-16` de compensación; footer `glass-subtle` con 3 columnas (marca / sitio+legal /
  sociales en pills `rounded-full`).
- Iconografía: `lucide-react` + `ServiceIcons` propios (tarot, buzios, energy, candle, sociales).

## Reglas

1. Tinta siempre `15,15,20` con opacidades (0.85 títulos, 0.6 cuerpo, 0.4–0.5 eyebrows), nunca negro
   puro.
2. Mística = serif itálica + tracking amplio, no colores temáticos.
3. Glass solo sobre `BackgroundMesh`; en superficies planas, blanco sólido.
4. Botones siempre pill, ancho completo en mobile (`w-full sm:w-auto`).
