-- ============================================
-- StyloCuba — Migración 0011
-- Fix: Políticas de Storage con ownership correcto
-- ============================================

-- Políticas con проверка correcta del dueño
drop policy if exists "salon_media_owner_insert" on storage.objects;
drop policy if exists "salon_media_owner_update" on storage.objects;
drop policy if exists "salon_media_owner_delete" on storage.objects;

create policy "salon_media_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'salon-media'
    and (
      select owner_id::text from public.salons
      where id::text = (storage.foldername(name))[0]
    ) = auth.uid()::text
  );

create policy "salon_media_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'salon-media'
    and (
      select owner_id::text from public.salons
      where id::text = (storage.foldername(name))[0]
    ) = auth.uid()::text
  );

create policy "salon_media_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'salon-media'
    and (
      select owner_id::text from public.salons
      where id::text = (storage.foldername(name))[0]
    ) = auth.uid()::text
  );