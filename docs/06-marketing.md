# EROS — Marketing
> Parte de: [[projects/eros/README|README]] · Relacionados: [[04-branding]] · [[eros-reporte-producto-marketing-estilo-2026-09-12]]

> Fuente: metadata/OG/sitemap (layout, sitemap, robots), Hero/Footer/sobre-mí, `admin_settings`
> (redes/bio), cron recordatorios. Verificado 2026-09-15.

## Propuesta de valor

"Sesiones de tarot y lectura de cartas para guiarte en tu camino espiritual" — 4 servicios (tarot,
buzios, limpieza energética, velomancia), atención personal de Jacque, reserva online + pago por
transferencia.

## Embudo actual

1. **Descubrimiento:** SEO orgánico (sitemap: `/`, `/servicios`, 4 servicios, `/sobre-mi`,
   `/contacto`) + Instagram/TikTok → link a la web.
2. **Consideración:** home (Hero → carrusel → sobre-mí → CTA), detalle por servicio, página sobre-mí
   (confianza).
3. **Conversión:** formulario multi-paso con datos bancarios en el paso final.
4. **Retención:** emails de confirmación + cron diario de recordatorios (`/api/cron/reminders`) +
   push admin para respuesta rápida.

## Canales y activos

- **Web propia** (canal central, `es-AR`, OG `portadoradeeros.com`).
- **Instagram / TikTok / WhatsApp** — links editables en admin, sin deploy.
- **Email transaccional** — confirmación al cliente + aviso al admin (EmailJS/Resend).
- **PWA admin** — atajos a calendario/clientes, respuesta rápida = ventaja de conversión.

## Mensajes por servicio (seed)

- **Tarot:** "Explorá tu pasado, presente y futuro a través de las cartas".
- **Buzios:** "Conexión con los orishas para recibir mensajes divinos".
- **Limpieza:** "Liberá tu espacio de energías negativas".
- **Velomancia:** "Lee la luz de las velas para recibir mensajes del más allá".

## Gaps / próximos pasos (no código, solo registro)

- [ ] Unificar dominio canónico (`portadoradeeros.com` vs fallback `portadoreros.com` en
      sitemap/robots).
- [ ] OG images por servicio (hoy Twitter/OG sin imagen propia).
- [ ] Página/blog de contenido para SEO (el sitemap no incluye legales ni blog).
- [ ] Testimonios/reseñas en home (hay `ContactCTA`, falta prueba social).
- [ ] UTM + medición de conversión del formulario (hoy sin analytics visible en `layout`).
