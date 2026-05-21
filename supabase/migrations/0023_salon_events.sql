-- ============================================================================
-- StyloChile — Migración 0023
-- Cursos, eventos y talleres que organiza el salón. Entidad unificada con
-- discriminador `type` para que el dueño gestione todo desde un mismo CRUD
-- y la vitrina pública los muestre en una sección común.
--
-- Modelo de inscripción: WhatsApp deep-link (consistente con reservas).
-- Si más adelante se quiere un sistema de cupos formal, se agrega tabla
-- aparte `salon_event_registrations` sin tocar este esquema.
-- ============================================================================

do $$ begin
  create type public.salon_event_type as enum ('course', 'event', 'workshop');
exception when duplicate_object then null; end $$;

create table public.salon_events (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  type public.salon_event_type not null default 'event',
  title text not null,
  description text,
  cover_image_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  price numeric(10, 2),
  currency text not null default 'CLP',
  capacity_label text,
  whatsapp_message text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint salon_events_time_check check (ends_at is null or ends_at >= starts_at)
);

create index salon_events_salon_id_idx on public.salon_events(salon_id);
create index salon_events_starts_at_idx on public.salon_events(starts_at);
create index salon_events_published_starts_idx
  on public.salon_events(salon_id, is_published, starts_at);

create trigger salon_events_touch_updated_at
  before update on public.salon_events
  for each row execute function public.touch_updated_at();

alter table public.salon_events enable row level security;

-- Público: eventos publicados, de salones publicados y no suspendidos
create policy "salon_events_public_select" on public.salon_events for select
  using (
    is_published = true
    and exists (
      select 1 from public.salons s
      where s.id = salon_events.salon_id
        and s.is_published = true
        and s.suspended_at is null
    )
  );

-- Dueño: control total sobre los eventos de su salón
create policy "salon_events_owner_all" on public.salon_events for all
  using (
    exists (
      select 1 from public.salons s
      where s.id = salon_events.salon_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salons s
      where s.id = salon_events.salon_id and s.owner_id = auth.uid()
    )
  );

-- Super-admin: lectura para el panel global
create policy "salon_events_admin_select" on public.salon_events for select
  using (public.is_app_admin());
