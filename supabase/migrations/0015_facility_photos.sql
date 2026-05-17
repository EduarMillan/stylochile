-- ============================================================================
-- StyloCuba — Migración 0015
-- Fotos de instalaciones / equipamiento del salón. Tabla independiente para
-- no mezclar con gallery_items (que es antes/después).
-- ============================================================================

create table if not exists public.salon_facility_photos (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists salon_facility_photos_salon_id_idx
  on public.salon_facility_photos(salon_id);

alter table public.salon_facility_photos enable row level security;

drop policy if exists "facility_photos_public_select"
  on public.salon_facility_photos;
create policy "facility_photos_public_select"
  on public.salon_facility_photos for select
  using (
    exists (
      select 1 from public.salons s
      where s.id = salon_facility_photos.salon_id
        and s.is_published = true
        and s.suspended_at is null
    )
  );

drop policy if exists "facility_photos_owner_all"
  on public.salon_facility_photos;
create policy "facility_photos_owner_all"
  on public.salon_facility_photos for all
  using (
    exists (
      select 1 from public.salons s
      where s.id = salon_facility_photos.salon_id
        and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salons s
      where s.id = salon_facility_photos.salon_id
        and s.owner_id = auth.uid()
    )
  );

drop policy if exists "facility_photos_admin_select"
  on public.salon_facility_photos;
create policy "facility_photos_admin_select"
  on public.salon_facility_photos for select
  using (public.is_app_admin());
