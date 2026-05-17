-- ============================================================================
-- StyloChile — Migración 0009 (Fase 1.6)
-- Staff del salón: estilistas, manicuristas, estomatólogos, etc.
-- ============================================================================

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  area_id uuid references public.salon_areas(id) on delete set null,
  name text not null,
  role text,
  bio text,
  photo_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index staff_salon_id_idx on public.staff(salon_id);
create index staff_area_id_idx on public.staff(area_id);

alter table public.staff enable row level security;

-- Público lee staff de salones publicados y no suspendidos
create policy "staff_public_select"
  on public.staff for select
  using (
    exists (
      select 1 from public.salons s
      where s.id = staff.salon_id
        and s.is_published = true
        and s.suspended_at is null
    )
  );

-- Dueño hace todo en su staff
create policy "staff_owner_all"
  on public.staff for all
  using (
    exists (
      select 1 from public.salons s
      where s.id = staff.salon_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salons s
      where s.id = staff.salon_id and s.owner_id = auth.uid()
    )
  );

-- Super-admin lee global
create policy "staff_admin_select"
  on public.staff for select
  using (public.is_app_admin());
