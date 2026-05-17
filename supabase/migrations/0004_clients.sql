-- ============================================================================
-- StyloChile — Migración 0004 (Fase 3)
-- Clientes del salón + historial fotográfico de cada cliente.
-- ============================================================================

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_salon_id_idx on public.clients(salon_id);
create index clients_salon_phone_idx on public.clients(salon_id, phone);

create trigger clients_touch_updated_at
  before update on public.clients
  for each row execute function public.touch_updated_at();

alter table public.clients enable row level security;

create policy "clients_owner_all"
  on public.clients for all
  using (
    exists (
      select 1 from public.salons s
      where s.id = clients.salon_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salons s
      where s.id = clients.salon_id and s.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- client_progress_photos : historial fotográfico privado
-- ----------------------------------------------------------------------------
create table public.client_progress_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  photo_url text not null,
  caption text,
  taken_at date not null default current_date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index client_progress_photos_client_id_idx on public.client_progress_photos(client_id);
create index client_progress_photos_salon_id_idx on public.client_progress_photos(salon_id);

alter table public.client_progress_photos enable row level security;

-- Solo el dueño del salón puede ver/escribir las fotos de sus clientes.
-- (No hay policy de SELECT pública — historial es privado.)
create policy "client_photos_owner_all"
  on public.client_progress_photos for all
  using (
    exists (
      select 1 from public.salons s
      where s.id = client_progress_photos.salon_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salons s
      where s.id = client_progress_photos.salon_id and s.owner_id = auth.uid()
    )
  );
