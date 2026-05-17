-- ============================================================================
-- StyloChile — Migración 0010 (Fix de storage)
-- Asegura que el bucket `salon-media` existe y que las policies de RLS
-- usan el índice correcto `[1]` (PostgreSQL arrays son 1-indexed).
-- Corre esto si los uploads de imágenes (galería, staff, fotos de cliente)
-- te están dando error 400 / 403.
-- ============================================================================

-- 1. Crear bucket si no existe
insert into storage.buckets (id, name, public)
  values ('salon-media', 'salon-media', true)
  on conflict (id) do update set public = excluded.public;

-- 2. Drop policies viejas si existen (idempotente)
drop policy if exists "salon_media_public_read" on storage.objects;
drop policy if exists "salon_media_owner_insert" on storage.objects;
drop policy if exists "salon_media_owner_update" on storage.objects;
drop policy if exists "salon_media_owner_delete" on storage.objects;

-- 3. Recrear con índice correcto [1]
--    storage.foldername(name) devuelve un text[] array.
--    PostgreSQL arrays son 1-indexed → [1] es el primer folder.
--    Para 'a3b8.../gallery/uuid.jpg' → ['a3b8...', 'gallery'] → [1] = salon_id.
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
        and salons.id::text = (storage.foldername(name))[1]
    )
  );

create policy "salon_media_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(name))[1]
    )
  );

create policy "salon_media_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(name))[1]
    )
  );
