-- ============================================================================
-- StyloChile — Migración 0021
-- Adapta los campos de dirección a la nomenclatura chilena.
--
--   provincia  → region
--   municipio  → comuna
--   reparto    → sector
--   entre_calle_a / entre_calle_b → DROP (no se usan en Chile)
--
-- Idempotente: funciona tanto si la BD aún tiene las columnas cubanas
-- (porque ya pasó por la migración 0006) como si nunca las tuvo. En el
-- primer caso renombra; en el segundo solo se asegura de que las nuevas
-- columnas existan.
-- ============================================================================

do $$
begin
  -- provincia → region
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'salons' and column_name = 'provincia'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'salons' and column_name = 'region'
  ) then
    alter table public.salons rename column provincia to region;
  end if;

  -- municipio → comuna
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'salons' and column_name = 'municipio'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'salons' and column_name = 'comuna'
  ) then
    alter table public.salons rename column municipio to comuna;
  end if;

  -- reparto → sector
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'salons' and column_name = 'reparto'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'salons' and column_name = 'sector'
  ) then
    alter table public.salons rename column reparto to sector;
  end if;
end $$;

-- Asegura que las columnas de dirección chilena existan (caso BD que nunca
-- pasó por la 0006 y aún tiene address/lat/lng).
alter table public.salons drop column if exists address;
alter table public.salons drop column if exists lat;
alter table public.salons drop column if exists lng;

alter table public.salons add column if not exists calle text;
alter table public.salons add column if not exists numero text;
alter table public.salons add column if not exists sector text;
alter table public.salons add column if not exists comuna text;
alter table public.salons add column if not exists region text;

-- Columnas exclusivamente cubanas: descartar.
alter table public.salons drop column if exists entre_calle_a;
alter table public.salons drop column if exists entre_calle_b;
