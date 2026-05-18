-- ============================================================================
-- StyloChile — Schema inicial
-- Pegar en el SQL Editor de Supabase y ejecutar.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles : extiende auth.users con datos del dueño del salón
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-crear profile al registrar un usuario
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- salons : un dueño puede tener uno o más salones
-- ----------------------------------------------------------------------------
create table public.salons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  address text,
  lat double precision,
  lng double precision,
  phone text,
  whatsapp text,
  hours jsonb,                     -- { mon: [{open:"09:00",close:"18:00"}], ... }
  cover_image text,
  logo_url text,
  is_published boolean not null default false,
  suspended_at timestamptz,        -- null = activo; timestamp = suspendido por admin o auto
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index salons_owner_id_idx on public.salons(owner_id);
create index salons_slug_idx on public.salons(slug);

alter table public.salons enable row level security;

create policy "salons_public_select_published"
  on public.salons for select
  using (is_published = true);

create policy "salons_owner_select_all"
  on public.salons for select
  using (auth.uid() = owner_id);

create policy "salons_owner_insert"
  on public.salons for insert
  with check (auth.uid() = owner_id);

create policy "salons_owner_update"
  on public.salons for update
  using (auth.uid() = owner_id);

create policy "salons_owner_delete"
  on public.salons for delete
  using (auth.uid() = owner_id);

-- ----------------------------------------------------------------------------
-- updated_at helper (reusable)
-- ----------------------------------------------------------------------------
create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger salons_touch_updated_at
  before update on public.salons
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Fase 1.5 : áreas, servicios, galería y storage
-- (También disponible como migración en supabase/migrations/0002_*.sql)
-- ============================================================================

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
create policy "areas_public_select" on public.salon_areas for select
  using (exists (select 1 from public.salons s where s.id = salon_areas.salon_id and s.is_published = true));
create policy "areas_owner_all" on public.salon_areas for all
  using (exists (select 1 from public.salons s where s.id = salon_areas.salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = salon_areas.salon_id and s.owner_id = auth.uid()));

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
create policy "services_public_select" on public.services for select
  using (exists (select 1 from public.salons s where s.id = services.salon_id and s.is_published = true));
create policy "services_owner_all" on public.services for all
  using (exists (select 1 from public.salons s where s.id = services.salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = services.salon_id and s.owner_id = auth.uid()));

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
create policy "gallery_public_select" on public.gallery_items for select
  using (exists (select 1 from public.salons s where s.id = gallery_items.salon_id and s.is_published = true));
create policy "gallery_owner_all" on public.gallery_items for all
  using (exists (select 1 from public.salons s where s.id = gallery_items.salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = gallery_items.salon_id and s.owner_id = auth.uid()));

insert into storage.buckets (id, name, public)
  values ('salon-media', 'salon-media', true)
  on conflict (id) do nothing;

create policy "salon_media_public_read" on storage.objects for select
  using (bucket_id = 'salon-media');
create policy "salon_media_owner_insert" on storage.objects for insert
  with check (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(name))[1]
    )
  );
create policy "salon_media_owner_update" on storage.objects for update
  using (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(name))[1]
    )
  );
create policy "salon_media_owner_delete" on storage.objects for delete
  using (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(name))[1]
    )
  );

-- ============================================================================
-- Fase 2 : sistema de reservas
-- (También disponible como migración en supabase/migrations/0003_*.sql)
-- ============================================================================

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  area_id uuid references public.salon_areas(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  client_name text not null,
  client_phone text not null,
  client_notes text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','completed','cancelled')),
  source text not null default 'form'
    check (source in ('form','whatsapp')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_check check (ends_at > starts_at)
);
create index appointments_salon_id_idx on public.appointments(salon_id);
create index appointments_starts_at_idx on public.appointments(starts_at);
create index appointments_status_idx on public.appointments(status);
create index appointments_area_id_idx on public.appointments(area_id);

create trigger appointments_touch_updated_at
  before update on public.appointments
  for each row execute function public.touch_updated_at();

alter table public.appointments enable row level security;

-- Helper function: chequea si un salón acepta reservas en este momento.
-- SECURITY DEFINER para que el chequeo NO pase por RLS de salons (más
-- determinista — funciona igual para anon, owner o admin).
create or replace function public.is_salon_bookable(p_salon_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.salons
    where id = p_salon_id
      and is_published = true
      and suspended_at is null
  );
$$;
grant execute on function public.is_salon_bookable(uuid) to anon, authenticated;

create policy "appointments_public_insert" on public.appointments for insert
  with check (
    status = 'pending'
    and source in ('form', 'whatsapp')
    and public.is_salon_bookable(salon_id)
  );
create policy "appointments_owner_select" on public.appointments for select
  using (exists (select 1 from public.salons s where s.id = appointments.salon_id and s.owner_id = auth.uid()));
create policy "appointments_owner_update" on public.appointments for update
  using (exists (select 1 from public.salons s where s.id = appointments.salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = appointments.salon_id and s.owner_id = auth.uid()));
create policy "appointments_owner_delete" on public.appointments for delete
  using (exists (select 1 from public.salons s where s.id = appointments.salon_id and s.owner_id = auth.uid()));

create or replace function public.get_busy_slots(p_salon_id uuid, p_day date)
returns table (area_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql security definer stable
set search_path = public
as $$
  select a.area_id, a.starts_at, a.ends_at
  from public.appointments a
  join public.salons s on s.id = a.salon_id
  where a.salon_id = p_salon_id
    and s.is_published = true
    and a.status in ('pending', 'approved')
    and a.starts_at::date = p_day;
$$;

grant execute on function public.get_busy_slots(uuid, date) to anon, authenticated;

-- ============================================================================
-- Fase 3 : clientes + historial fotográfico
-- (También disponible como migración en supabase/migrations/0004_*.sql)
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
create policy "clients_owner_all" on public.clients for all
  using (exists (select 1 from public.salons s where s.id = clients.salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = clients.salon_id and s.owner_id = auth.uid()));

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
create policy "client_photos_owner_all" on public.client_progress_photos for all
  using (exists (select 1 from public.salons s where s.id = client_progress_photos.salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = client_progress_photos.salon_id and s.owner_id = auth.uid()));

-- ============================================================================
-- Fase 4 : almacén / inventario
-- (También disponible como migración en supabase/migrations/0005_*.sql)
-- ============================================================================

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  sku text,
  unit text not null default 'u',
  quantity numeric(12, 2) not null default 0,
  min_quantity numeric(12, 2) not null default 0,
  unit_cost numeric(12, 2),
  currency text not null default 'CLP',
  supplier text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inventory_items_salon_id_idx on public.inventory_items(salon_id);

create trigger inventory_items_touch_updated_at
  before update on public.inventory_items
  for each row execute function public.touch_updated_at();

alter table public.inventory_items enable row level security;
create policy "inventory_items_owner_all" on public.inventory_items for all
  using (exists (select 1 from public.salons s where s.id = inventory_items.salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = inventory_items.salon_id and s.owner_id = auth.uid()));

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  type text not null check (type in ('in', 'out', 'adjustment')),
  quantity numeric(12, 2) not null check (quantity >= 0),
  reason text,
  created_at timestamptz not null default now()
);
create index inventory_movements_item_id_idx on public.inventory_movements(item_id);
create index inventory_movements_salon_id_idx on public.inventory_movements(salon_id);

alter table public.inventory_movements enable row level security;
create policy "inventory_movements_owner_all" on public.inventory_movements for all
  using (exists (select 1 from public.salons s where s.id = inventory_movements.salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = inventory_movements.salon_id and s.owner_id = auth.uid()));

create or replace function public.record_inventory_movement(
  p_item_id uuid, p_type text, p_quantity numeric, p_reason text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid; v_salon_id uuid; v_owner uuid;
begin
  select i.salon_id, s.owner_id into v_salon_id, v_owner
    from public.inventory_items i join public.salons s on s.id = i.salon_id
    where i.id = p_item_id;
  if v_salon_id is null then raise exception 'Item not found'; end if;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'Not authorized'; end if;
  if p_type not in ('in', 'out', 'adjustment') then raise exception 'Invalid movement type: %', p_type; end if;
  if p_quantity < 0 then raise exception 'Quantity must be non-negative'; end if;

  insert into public.inventory_movements (item_id, salon_id, type, quantity, reason)
    values (p_item_id, v_salon_id, p_type, p_quantity, p_reason)
    returning id into v_id;

  update public.inventory_items
  set quantity = case
    when p_type = 'in' then quantity + p_quantity
    when p_type = 'out' then greatest(0, quantity - p_quantity)
    when p_type = 'adjustment' then p_quantity
  end where id = p_item_id;

  return v_id;
end;
$$;

grant execute on function public.record_inventory_movement(uuid, text, numeric, text) to authenticated;

-- ============================================================================
-- Fase 5 : reseñas con verificación por teléfono
-- (También en supabase/migrations/0007_reviews.sql)
-- ============================================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  client_name text not null,
  client_phone text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index reviews_salon_id_idx on public.reviews(salon_id);
create index reviews_created_at_idx on public.reviews(created_at desc);

alter table public.reviews enable row level security;
create policy "reviews_public_select" on public.reviews for select
  using (exists (select 1 from public.salons s where s.id = reviews.salon_id and s.is_published = true));
create policy "reviews_public_insert" on public.reviews for insert
  with check (exists (select 1 from public.salons s where s.id = salon_id and s.is_published = true));
create policy "reviews_owner_delete" on public.reviews for delete
  using (exists (select 1 from public.salons s where s.id = reviews.salon_id and s.owner_id = auth.uid()));

create or replace function public.can_review_salon(p_salon_id uuid, p_phone text)
returns boolean language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.appointments a
    where a.salon_id = p_salon_id
      and regexp_replace(a.client_phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
      and a.status in ('approved', 'completed')
  );
$$;
grant execute on function public.can_review_salon(uuid, text) to anon, authenticated;

create or replace function public.find_appointment_for_review(p_salon_id uuid, p_phone text)
returns uuid language sql security definer stable set search_path = public
as $$
  select a.id from public.appointments a
  where a.salon_id = p_salon_id
    and regexp_replace(a.client_phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
    and a.status in ('approved', 'completed')
  order by a.starts_at desc limit 1;
$$;
grant execute on function public.find_appointment_for_review(uuid, text) to anon, authenticated;

-- ============================================================================
-- Fase 7 : panel super-admin (eduarmillan00@gmail.com)
-- (También en supabase/migrations/0008_app_admin.sql)
-- ============================================================================

alter table public.profiles add column if not exists email text;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;
update public.profiles p set email = u.email
  from auth.users u where p.id = u.id and p.email is null;

-- Un dueño solo puede tener un salón, un teléfono solo se registra una vez
alter table public.salons
  drop constraint if exists salons_owner_unique;
alter table public.salons
  add constraint salons_owner_unique unique (owner_id);
alter table public.profiles
  drop constraint if exists profiles_phone_unique;
alter table public.profiles
  add constraint profiles_phone_unique unique (phone);

-- RPC anon-safe para pre-chequear teléfono en signup
create or replace function public.phone_taken(p_phone text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where phone = p_phone);
$$;
grant execute on function public.phone_taken(text) to anon, authenticated;

alter table public.salons add column if not exists suspended_at timestamptz;
create index if not exists salons_suspended_at_idx
  on public.salons(suspended_at) where suspended_at is not null;

create or replace function public.is_app_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce(lower(auth.jwt() ->> 'email') = 'eduarmillan00@gmail.com', false);
$$;
grant execute on function public.is_app_admin() to anon, authenticated;

drop policy if exists "salons_public_select_published" on public.salons;
create policy "salons_public_select_published" on public.salons for select
  using (is_published = true and suspended_at is null);

create policy "salons_admin_all" on public.salons for all
  using (public.is_app_admin()) with check (public.is_app_admin());
create policy "profiles_admin_select" on public.profiles for select using (public.is_app_admin());
create policy "areas_admin_select" on public.salon_areas for select using (public.is_app_admin());
create policy "services_admin_select" on public.services for select using (public.is_app_admin());
create policy "gallery_admin_select" on public.gallery_items for select using (public.is_app_admin());
create policy "appointments_admin_select" on public.appointments for select using (public.is_app_admin());
create policy "clients_admin_select" on public.clients for select using (public.is_app_admin());
create policy "client_photos_admin_select" on public.client_progress_photos for select using (public.is_app_admin());
create policy "inventory_items_admin_select" on public.inventory_items for select using (public.is_app_admin());
create policy "inventory_movements_admin_select" on public.inventory_movements for select using (public.is_app_admin());
create policy "reviews_admin_select" on public.reviews for select using (public.is_app_admin());
create policy "reviews_admin_delete" on public.reviews for delete using (public.is_app_admin());

-- Super-admin sobre storage: necesario para limpiar archivos al eliminar
-- un salón desde /admin/salones (las policies de dueño no aplican porque
-- el super-admin no es owner).
-- (También en supabase/migrations/0016_admin_storage_policies.sql)
create policy "salon_media_admin_select" on storage.objects for select
  using (bucket_id = 'salon-media' and public.is_app_admin());
create policy "salon_media_admin_delete" on storage.objects for delete
  using (bucket_id = 'salon-media' and public.is_app_admin());

-- ============================================================================
-- Fase 1.6 : staff del salón
-- (También en supabase/migrations/0009_staff.sql)
-- ============================================================================

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  area_id uuid references public.salon_areas(id) on delete set null,
  name text not null,
  role text,
  bio text,
  photo_url text,
  specialties text[] not null default '{}',
  years_experience integer check (years_experience is null or (years_experience >= 0 and years_experience <= 80)),
  instagram_handle text check (instagram_handle is null or instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  certifications text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index staff_salon_id_idx on public.staff(salon_id);
create index staff_area_id_idx on public.staff(area_id);

alter table public.staff enable row level security;
create policy "staff_public_select" on public.staff for select
  using (exists (select 1 from public.salons s where s.id = staff.salon_id and s.is_published = true and s.suspended_at is null));
create policy "staff_owner_all" on public.staff for all
  using (exists (select 1 from public.salons s where s.id = staff.salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = staff.salon_id and s.owner_id = auth.uid()));
create policy "staff_admin_select" on public.staff for select using (public.is_app_admin());

-- ============================================================================
-- Fotos de instalaciones / equipamiento
-- (También en supabase/migrations/0015_facility_photos.sql)
-- ============================================================================

create table public.salon_facility_photos (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index salon_facility_photos_salon_id_idx
  on public.salon_facility_photos(salon_id);

alter table public.salon_facility_photos enable row level security;
create policy "facility_photos_public_select" on public.salon_facility_photos for select
  using (exists (select 1 from public.salons s where s.id = salon_facility_photos.salon_id and s.is_published = true and s.suspended_at is null));
create policy "facility_photos_owner_all" on public.salon_facility_photos for all
  using (exists (select 1 from public.salons s where s.id = salon_facility_photos.salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = salon_facility_photos.salon_id and s.owner_id = auth.uid()));
create policy "facility_photos_admin_select" on public.salon_facility_photos for select using (public.is_app_admin());

-- ============================================================================
-- Subscriptions: trial + plan mensual con pago manual
-- (También en supabase/migrations/0017_subscriptions.sql)
-- ============================================================================

create table public.platform_settings (
  id boolean primary key default true check (id = true),
  trial_days integer not null default 90 check (trial_days >= 1 and trial_days <= 365),
  grace_period_days integer not null default 5 check (grace_period_days >= 0 and grace_period_days <= 30),
  monthly_price numeric(12, 2) not null default 9990 check (monthly_price >= 0),
  currency text not null default 'CLP',
  admin_whatsapp text,
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (id) values (true) on conflict (id) do nothing;
alter table public.platform_settings enable row level security;
create policy "platform_settings_public_read" on public.platform_settings for select using (true);
create policy "platform_settings_admin_update" on public.platform_settings for update
  using (public.is_app_admin()) with check (public.is_app_admin());

do $$ begin
  create type public.subscription_status as enum ('trialing', 'active', 'expired');
exception when duplicate_object then null; end $$;

create table public.salon_subscriptions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null unique references public.salons(id) on delete cascade,
  status public.subscription_status not null default 'trialing',
  trial_starts_at timestamptz not null default now(),
  trial_ends_at timestamptz not null,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  last_payment_at timestamptz,
  last_payment_amount numeric(12, 2),
  last_payment_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index salon_subscriptions_salon_id_idx on public.salon_subscriptions(salon_id);
create index salon_subscriptions_status_idx on public.salon_subscriptions(status);
alter table public.salon_subscriptions enable row level security;
create policy "salon_subscriptions_owner_select" on public.salon_subscriptions for select
  using (exists (select 1 from public.salons s where s.id = salon_subscriptions.salon_id and s.owner_id = auth.uid()));
create policy "salon_subscriptions_admin_all" on public.salon_subscriptions for all
  using (public.is_app_admin()) with check (public.is_app_admin());

create trigger salon_subscriptions_touch_updated_at
  before update on public.salon_subscriptions
  for each row execute function public.touch_updated_at();
create trigger platform_settings_touch_updated_at
  before update on public.platform_settings
  for each row execute function public.touch_updated_at();

create or replace function public.create_salon_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_trial_days integer;
begin
  select trial_days into v_trial_days from public.platform_settings where id = true;
  if v_trial_days is null then v_trial_days := 90; end if;
  insert into public.salon_subscriptions (salon_id, trial_ends_at)
    values (new.id, now() + (v_trial_days || ' days')::interval)
    on conflict (salon_id) do nothing;
  return new;
end; $$;

create trigger salons_create_subscription
  after insert on public.salons
  for each row execute function public.create_salon_subscription();
