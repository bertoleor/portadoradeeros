# EROS — Branding

> Fuente: `src/app/layout.tsx` (metadata), `src/components/client/{Hero,Footer,Navbar}.tsx`,
> `src/app/sobre-mi/page.tsx`, `public/manifest.json`, `supabase_seed.sql`. Verificado 2026-09-15.

## Marca

- **Nombre:** Portadora de Eros (hero en minúsculas: "portadora / de eros"; footer: "portadora de
  eros").
- **Tagline footer:** "Sabiduría ancestral para el camino del alma."
- **Voz:** guía espiritual & canalizadora, "puente entre lo terrenal y lo místico". Tono íntimo,
  honesto, sin promesas de milagros ("No prometo milagros — prometo un espacio seguro para explorar
  tu verdad").
- **Operadora:** Jacque / Jacqueline — marca personal, un solo operador.

## Valores (página sobre-mí)

1. **Sabiduría Ancestral** — honrar las tradiciones transmitidas.
2. **Claridad & Verdad** — decir lo que las herramientas revelan, sin adornos.
3. **Conexión Genuina** — cada sesión como espacio sagrado de confianza.

## Canales (verificados en código)

- Instagram: `instagram.com/portadoradeeros`
- WhatsApp: `wa.me/5491138854297` (el seed trae placeholder `5491100000000` — el real vive en
  `admin_settings`)
- TikTok: `tiktok.com/@portadoradeeros`
- Email: `portadoradeeros@gmail.com`
- Redes editables desde `/admin/configuracion/perfil` (tabla `admin_settings`, sin deploy).

## SEO / posicionamiento

- Título: "Portadora de Eros | Servicios Esotéricos". Keywords: tarot, esotérico, buzios, limpieza
  energética, velomancia, adivinación, espiritualidad. Locale `es_AR`, dominio canónico
  `https://portadoradeeros.com` (nota: `layout` usa `portadoradeeros.com`, `sitemap/robots` usan
  fallback `portadoreros.com` — unificar).
- OG/Twitter: guía espiritual, tarot, buzios, velomancia.

## Activos

- `icono.png` en raíz + `public/icons/icon-192x192.png` y `icon-512x512.png` (PWA admin).
- Foto de perfil administrable (`profile_image_url` en `admin_settings`), imágenes de servicio vía
  Storage `public-images`.
- Sin logo vectorial ni manual de marca previo — ver `05-identidad-visual.md` como referencia
  canónica.
