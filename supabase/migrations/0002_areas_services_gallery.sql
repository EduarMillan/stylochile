-- ============================================================================
-- StyloChile — Migración 0002 (Fase 1.5)
-- Añade: salon_areas, services, gallery_items y bucket de Storage para fotos.
-- Pegar en el SQL Editor de Supabase si ya corriste el schema inicial (0001).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- salon_areas : "áreas" del salón (Peluquería, Manicure, Estomatología, …)
-- ----------------------------------------------------------------------------
create table public.salon_areas (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index salon_areas_salon_id_idx on public.salon_areas(salon_id);

alter table public.salon_areas enable row level security;

create policy "areas_public_select"
  on public.salon_areas for select
  using (
    exists (
      select 1 from public.salons s
      where s.id = salon_areas.salon_id and s.is_published = true
    )
  );

create policy "areas_owner_all"
  on public.salon_areas for all
  using (
    exists (
      select 1 from public.salons s
      where s.id = salon_areas.salon_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salons s
      where s.id = salon_areas.salon_id and s.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- services : servicios ofrecidos por el salón, agrupados por área
-- ----------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  area_id uuid references public.salon_areas(id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2),
  currency text not null default 'CLP',
  duration_minutes int,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index services_salon_id_idx on public.services(salon_id);
create index services_area_id_idx on public.services(area_id);

alter table public.services enable row level security;

create policy "services_public_select"
  on public.services for select
  using (
    exists (
      select 1 from public.salons s
      where s.id = services.salon_id and s.is_published = true
    )
  );

create policy "services_owner_all"
  on public.services for all
  using (
    exists (
      select 1 from public.salons s
      where s.id = services.salon_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salons s
      where s.id = services.salon_id and s.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- gallery_items : "antes y después" de los trabajos del salón
-- ----------------------------------------------------------------------------
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  area_id uuid references public.salon_areas(id) on delete set null,
  title text,
  description text,
  before_url text not null,
  after_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index gallery_salon_id_idx on public.gallery_items(salon_id);

alter table public.gallery_items enable row level security;

create policy "gallery_public_select"
  on public.gallery_items for select
  using (
    exists (
      select 1 from public.salons s
      where s.id = gallery_items.salon_id and s.is_published = true
    )
  );

create policy "gallery_owner_all"
  on public.gallery_items for all
  using (
    exists (
      select 1 from public.salons s
      where s.id = gallery_items.salon_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salons s
      where s.id = gallery_items.salon_id and s.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- Storage : bucket "salon-media" (lectura pública, escritura solo del dueño)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('salon-media', 'salon-media', true)
  on conflict (id) do nothing;

create policy "salon_media_public_read"
  on storage.objects for select
  using (bucket_id = 'salon-media');

create policy "salon_media_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(name))[0]
    )
  );

create policy "salon_media_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(name))[0]
    )
  );

create policy "salon_media_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(name))[0]
    )
  );
