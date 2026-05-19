-- ============================================================================
-- StyloChile — Migración 0022
-- Fix crítico: dentro de las policies de storage.objects, la columna `name`
-- (sin calificar) resolvía a salons.name (el nombre del salón) en lugar de
-- storage.objects.name (la ruta del archivo). Resultado: storage.foldername()
-- recibía el nombre del salón y devolvía basura → la policy jamás permitía
-- el upload.
--
-- Calificamos explícitamente storage.objects.name para forzar la referencia
-- correcta.
-- ============================================================================

drop policy if exists "salon_media_owner_insert" on storage.objects;
drop policy if exists "salon_media_owner_update" on storage.objects;
drop policy if exists "salon_media_owner_delete" on storage.objects;

create policy "salon_media_owner_insert" on storage.objects for insert
  with check (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

create policy "salon_media_owner_update" on storage.objects for update
  using (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

create policy "salon_media_owner_delete" on storage.objects for delete
  using (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );
