-- ============================================================================
-- StyloCuba — Migración 0008 (Fase 7)
-- Panel super-admin para eduarmillan00@gmail.com.
-- Idempotente: se puede correr de nuevo sin errores.
-- Tolerante a estado parcial: solo aplica policies a tablas que existan.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Email en profiles (anon-client no puede leer auth.users; lo
--    duplicamos a profiles vía trigger para listar dueños por email)
-- ----------------------------------------------------------------------------
alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- ----------------------------------------------------------------------------
-- 1. Soft-suspend en salons
-- ----------------------------------------------------------------------------
alter table public.salons add column if not exists suspended_at timestamptz;
create index if not exists salons_suspended_at_idx
  on public.salons(suspended_at)
  where suspended_at is not null;

-- ----------------------------------------------------------------------------
-- 2. Helper: ¿el usuario actual es super-admin?
-- ----------------------------------------------------------------------------
create or replace function public.is_app_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = 'eduarmillan00@gmail.com',
    false
  );
$$;

grant execute on function public.is_app_admin() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Vitrina pública: ocultar salones suspendidos
-- ----------------------------------------------------------------------------
drop policy if exists "salons_public_select_published" on public.salons;
create policy "salons_public_select_published"
  on public.salons for select
  using (is_published = true and suspended_at is null);

-- ----------------------------------------------------------------------------
-- 4. Policies de super-admin (condicionales por tabla)
-- ----------------------------------------------------------------------------
-- Helper para crear / reemplazar policies sin importar el estado previo.
do $$
declare
  policies record;
begin
  -- salons (siempre existe)
  drop policy if exists "salons_admin_all" on public.salons;
  create policy "salons_admin_all" on public.salons for all
    using (public.is_app_admin()) with check (public.is_app_admin());

  -- profiles (siempre existe)
  drop policy if exists "profiles_admin_select" on public.profiles;
  create policy "profiles_admin_select" on public.profiles for select
    using (public.is_app_admin());

  -- salon_areas (Fase 1.5)
  if to_regclass('public.salon_areas') is not null then
    drop policy if exists "areas_admin_select" on public.salon_areas;
    execute 'create policy "areas_admin_select" on public.salon_areas for select using (public.is_app_admin())';
  end if;

  -- services (Fase 1.5)
  if to_regclass('public.services') is not null then
    drop policy if exists "services_admin_select" on public.services;
    execute 'create policy "services_admin_select" on public.services for select using (public.is_app_admin())';
  end if;

  -- gallery_items (Fase 1.5)
  if to_regclass('public.gallery_items') is not null then
    drop policy if exists "gallery_admin_select" on public.gallery_items;
    execute 'create policy "gallery_admin_select" on public.gallery_items for select using (public.is_app_admin())';
  end if;

  -- appointments (Fase 2)
  if to_regclass('public.appointments') is not null then
    drop policy if exists "appointments_admin_select" on public.appointments;
    execute 'create policy "appointments_admin_select" on public.appointments for select using (public.is_app_admin())';
  end if;

  -- clients (Fase 3)
  if to_regclass('public.clients') is not null then
    drop policy if exists "clients_admin_select" on public.clients;
    execute 'create policy "clients_admin_select" on public.clients for select using (public.is_app_admin())';
  end if;

  -- client_progress_photos (Fase 3)
  if to_regclass('public.client_progress_photos') is not null then
    drop policy if exists "client_photos_admin_select" on public.client_progress_photos;
    execute 'create policy "client_photos_admin_select" on public.client_progress_photos for select using (public.is_app_admin())';
  end if;

  -- inventory_items (Fase 4)
  if to_regclass('public.inventory_items') is not null then
    drop policy if exists "inventory_items_admin_select" on public.inventory_items;
    execute 'create policy "inventory_items_admin_select" on public.inventory_items for select using (public.is_app_admin())';
  end if;

  -- inventory_movements (Fase 4)
  if to_regclass('public.inventory_movements') is not null then
    drop policy if exists "inventory_movements_admin_select" on public.inventory_movements;
    execute 'create policy "inventory_movements_admin_select" on public.inventory_movements for select using (public.is_app_admin())';
  end if;

  -- reviews (Fase 5) — read + delete para moderación
  if to_regclass('public.reviews') is not null then
    drop policy if exists "reviews_admin_select" on public.reviews;
    execute 'create policy "reviews_admin_select" on public.reviews for select using (public.is_app_admin())';

    drop policy if exists "reviews_admin_delete" on public.reviews;
    execute 'create policy "reviews_admin_delete" on public.reviews for delete using (public.is_app_admin())';
  end if;
end $$;
