-- ============================================================================
-- StyloCuba — Migración 0006
-- Reemplaza address/lat/lng por dirección estructurada cubana.
-- ============================================================================

alter table public.salons drop column if exists address;
alter table public.salons drop column if exists lat;
alter table public.salons drop column if exists lng;

alter table public.salons add column if not exists calle text;
alter table public.salons add column if not exists numero text;
alter table public.salons add column if not exists entre_calle_a text;
alter table public.salons add column if not exists entre_calle_b text;
alter table public.salons add column if not exists reparto text;
alter table public.salons add column if not exists municipio text;
alter table public.salons add column if not exists provincia text;
