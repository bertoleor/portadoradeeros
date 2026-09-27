# Portadora de Eros - Implementation Plan
> Parte de: [[projects/eros/README|README]] · Relacionados: [[EROS-plan-2026-09-14]] · [[INDICE-PLANS]] · [[PLAN_IMPLEMENTACION_FINAL]]

## Project Overview

**Project Name:** Portadora de Eros  
**Type:** Esoteric Services Website with Admin Panel  
**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS  
**Repository:** https://github.com/bertoleor/portadora-eros.git

---

## Design System

### Colors
- **Primary:** Burgundy (`#800020`) - Background, borders, accents
- **Secondary:** Dark Gold (`#B8860B`) - Used for highlights, buttons
- **Background:** Burgundy (`#800020`) - Main background color
- **Text:** Light (`#FAF9F6`) - Text on burgundy background
- **Error:** Red (`#DC2626`)
- **Success:** Green (`#16A34A`)

### Typography
- Single sans-serif font (user will provide later)
- Hero: 4rem+ on desktop, 2.5rem on mobile
- Headings: 2rem-3rem
- Body: 1rem-1.125rem

### Components
- Rounded cards (border-radius: 16px)
- Rounded buttons (border-radius: 12px)
- SVG icons only (no emojis)
- Blur image placeholders
- Custom skeleton loaders per page

---

## Page Structure

### Client Pages (`/`)
```
/                    → Home (Hero + Services Carousel)
/servicios           → Services overview
/servicios/tarot     → Tarot service detail
/servicios/buzios    → Buzios service detail
/servicios/limpieza-energetica → Energy cleaning detail
/servicios/velomancia        → Velomancy detail
/sobre-mi            → About Me page
/contacto            → Contact page
```

### Admin Pages (`/admin`)
```
/admin               → Dashboard (redirect to /admin/servicios)
/admin/servicios     → Edit services
/admin/clientes      → Client list (weekly/monthly)
/admin/calendario    → Calendar management
/admin/configuracion → Settings (social links, hours, bank details)
/admin/login         → Admin login
```

---

## Functionality Specification

### 1. Hero Section
- Large "Portadora de Eros" title
- Subtitle tagline
- Call-to-action button
- Background with subtle animation (user will provide later)

### 2. Services Carousel
- **Desktop:** Horizontal scroll, one elongated card visible at a time
- **Mobile:** Vertical scroll, full-width cards
- Services: Tarot, Buzios, Limpieza Energética, Velomancia
- Each card has: SVG icon, title, brief description, "Ver más" button

### 3. Service Detail Pages
- Large header with service name
- Description
- Image
- "Agendar" button → Opens scheduling popup

### 4. Scheduling Popup Form

**Step 1:**
- Left (70%): Name, Surname, Phone, Email inputs
- Right (30%): Calendar (date picker) + Hour selector

**Step 2:**
- Transfer instructions
- Bank details display
- "Confirmar" button
- Success message

### 5. About Me Page
- Photo on left (round frame, blur effect)
- Bio text on right
- Social links

### 6. Contact Page
- Contact form
- Social media links
- Location (if applicable)

### 7. Admin Authentication
- Hardcoded credentials: `jacque` / `portadora`
- Session stored in localStorage/cookies
- Protected routes - block access without login
- Native app feel with client-side navigation

### 8. Admin - Simple Dashboard
- Welcome message
- Quick stats (appointments today, week clients)
- Quick access to main sections
- No automatic redirect

### 9. Admin - Clients
- Table view of clients
- Filter by week/month
- Client details

### 10. Admin - Calendar
- Google Calendar-like interface
- View appointments
- Add external clients
- Drag-and-drop rescheduling

### 11. Admin - Settings
- Social media links (single config file)
- Business hours
- Bank details for transfers
- Appointment duration

---

## SEO & Sitemap
- Next.js Metadata API for SEO
- Dynamic sitemap.xml generation
- robots.txt configuration
- OpenGraph tags
- JSON-LD structured data

---

## Social Media Configuration
- Single `socials.ts` file with all social links and usernames
- Used across client pages and admin settings

---

## Technical Architecture

### Directory Structure
```
/src
  /app                    # Next.js App Router
    /(client)             # Client pages
      /page.tsx           # Home
      /servicios/
        /page.tsx         # Services list
        /tarot/page.tsx   # Tarot detail
        /buzios/page.tsx
        /limpieza-energetica/page.tsx
        /velomancia/page.tsx
      /sobre-mi/page.tsx
      /contacto/page.tsx
    /(admin)             # Admin pages
      /admin/
        /login/page.tsx
        /layout.tsx
        /servicios/page.tsx
        /clientes/page.tsx
        /calendario/page.tsx
        /configuracion/page.tsx
    /api/                # API routes (proxy)
    /layout.tsx
    /error.tsx
    /not-found.tsx
  /components
    /ui                  # Base UI components
    /client              # Client-specific components
    /admin               # Admin-specific components
    /shared              # Sharedhooks                 components
  / # Custom hooks
  /lib                  , configs
  # Utilities /types                 # TypeScript types
  /styles                # Global styles
```

### Libraries to Install
- `next@16` (latest canary if needed)
- `react@19`
- `react-dom@19`
- `typescript@5.x`
- `tailwindcss@4.x`
- `@tailwindcss/vite`
- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `date-fns` (date handling)
- `@hello-pangea/dnd` (drag and drop for calendar)
- `lucide-react` (SVG icons)
- `framer-motion` (animations)
- `@supabase/supabase-js` (future)
- `resend` (future)

---

## API Integrations (Prepared)

### Supabase
- Environment variables ready
- Client initialization
- Auth middleware

### Resend
- Email service configuration
- Transactional emails

### Google Calendar
- API credentials
- OAuth flow preparation

---

## Error Handling
- Error boundaries per section
- Centralized error display
- Toast notifications
- Console logs only in development (`NODE_ENV === 'development'`)

---

## Performance Optimizations
- Custom skeleton loaders per page
- Blur image placeholders (blurDataURL)
- Lazy loading for images
- Route-based code splitting

---

## Implementation Priority

1. **Phase 1:** Project setup + Basic UI + Hero + Carousel
2. **Phase 2:** Service pages + Scheduling form
3. **Phase 3:** About Me + Contact
4. **Phase 4:** Admin authentication + Layout
5. **Phase 5:** Admin pages (Services, Clients, Calendar, Settings)
6. **Phase 6:** Integrations preparation (Supabase, Resend, Google Calendar)
7. **Phase 7:** Testing + Polish

---

## Notes
- No emojis - SVG icons only
- No AI aesthetics - solid colors, clean design
- Burgundy border + dark gold details
- Responsive-first approach
- TypeScript strict mode
- Component reusability emphasized
