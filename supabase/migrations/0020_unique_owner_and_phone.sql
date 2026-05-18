-- ============================================================================
-- StyloChile — Migración 0020
-- Refuerza unicidad de un dueño / un salón / un teléfono:
--   1) Trigger handle_new_user pasa a poblar full_name y phone leyendo
--      raw_user_meta_data (signup ya los manda en options.data).
--   2) UNIQUE en salons.owner_id → un usuario solo puede tener un salón.
--   3) UNIQUE en profiles.phone → un número de teléfono solo se registra
--      una vez en la plataforma. NULL queda permitido (perfiles viejos).
--   4) RPC public.phone_taken para que el signup pre-chequee y devuelva
--      un mensaje claro en lugar del "Database error saving new user"
--      genérico que sale cuando el trigger falla.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
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

alter table public.salons
  drop constraint if exists salons_owner_unique;
alter table public.salons
  add constraint salons_owner_unique unique (owner_id);

alter table public.profiles
  drop constraint if exists profiles_phone_unique;
alter table public.profiles
  add constraint profiles_phone_unique unique (phone);

create or replace function public.phone_taken(p_phone text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where phone = p_phone
  );
$$;
grant execute on function public.phone_taken(text) to anon, authenticated;
