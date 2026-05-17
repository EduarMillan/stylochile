# StyloCuba

Plataforma para salones de belleza en Cuba. Vitrina pública, agenda con
aprobación, historial fotográfico de clientes, gestión de almacén y reseñas.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** (config CSS-first vía `@theme`)
- **shadcn/ui** sobre Base UI (esquemas neutros sobreescritos por Obsidian & Gold)
- **Supabase** — Auth + Postgres + Storage
- **Zod + React Hook Form** — formularios
- **Lucide** — íconos

## Setup

1. **Variables de entorno**

   ```bash
   cp .env.local.example .env.local
   ```

   Crea un proyecto en [supabase.com](https://supabase.com), pega `URL` y
   `anon key` en `.env.local`.

2. **Schema de la base de datos**

   En el SQL Editor de Supabase, pega el contenido de `supabase/schema.sql` y
   ejecuta. Crea las tablas `profiles` y `salons` con políticas RLS.

3. **Dependencias y dev server**

   ```bash
   npm install
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Diseño

Sistema visual: **Obsidian & Gold** (dark luxury, esquinas a 0px, Noto Serif +
Manrope). Documentado en
`../stitch_luxe_salon_management/obsidian_gold/DESIGN.md`. Los tokens están en
`src/app/globals.css`.

## Roadmap

- **Fase 0** — Scaffold: Next.js, Tailwind tokens, shadcn, Supabase clients,
  schema base, layout y landing placeholder.
- **Fase 1** — Auth dueños, crear/editar salón con mapa, vitrina pública.
- **Fase 2** — Reservas con calendario y aprobación + WhatsApp deep-link.
- **Fase 3** — Clientes y historial fotográfico.
- **Fase 4** — Almacén.
- **Fase 5** — Reseñas con verificación ligera.
- **Fase 6** — Explorer público + landing marketing.

## Comandos

```bash
npm run dev      # desarrollo (Turbopack)
npm run build    # producción
npm run start    # servir build
npm run lint     # ESLint
```
