-- ============================================================================
-- StyloCuba — Migración 0013
-- Agrega logo_url al salón para mostrarlo en la vitrina pública.
-- ============================================================================

alter table public.salons add column if not exists logo_url text;
