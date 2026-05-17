-- ============================================
-- StyloCuba — Migración 0008
-- Fix: Corregir políticas de Storage (índice [1]→[0])
-- Error: 400 al subir imágenes - bucket_id no validaba correctamente
-- ============================================

-- Eliminar políticas viejo
drop policy if exists "salon_media_owner_insert" on storage.objects;
drop policy if exists "salon_media_owner_update" on storage.objects;
drop policy if exists "salon_media_owner_delete" on storage.objects;

-- Crear políticas corregidas
-- El índice [0] es correcto porque storage.foldername()
-- devuelve: ['salon-id', 'folder', 'archivo.jpg']

create policy "salon_media_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(name))[0]
    )
  );

create policy "salon_media_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(name))[0]
    )
  );

create policy "salon_media_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where salons.owner_id = auth.uid()
        and salons.id::text = (storage.foldername(name))[0]
    )
  );