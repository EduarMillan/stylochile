-- ============================================================================
-- StyloCuba — Migración 0014
-- Enriquece la tabla staff con especialidades, experiencia, instagram y
-- certificaciones. Todo opcional para no romper datos existentes.
-- ============================================================================

alter table public.staff
  add column if not exists specialties text[] not null default '{}';

alter table public.staff
  add column if not exists years_experience integer
  check (years_experience is null or (years_experience >= 0 and years_experience <= 80));

alter table public.staff
  add column if not exists instagram_handle text
  check (instagram_handle is null or instagram_handle ~ '^[A-Za-z0-9._]{1,30}$');

alter table public.staff
  add column if not exists certifications text;
