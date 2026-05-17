-- ============================================
-- StyloCuba — Migración 0010
-- Debug: Políticas mínimas para identificar el problema
-- ============================================

-- Eliminar políticas Debug
drop policy if exists "salon_media_public_read" on storage.objects;
drop policy if exists "salon_media_owner_insert" on storage.objects;
drop policy if exists "salon_media_owner_update" on storage.objects;
drop policy if exists "salon_media_owner_delete" on storage.objects;

-- Políticas最简单的 (temporal - permitir todo en el bucket)
create policy "salon_media_public_read"
  on storage.objects for select
  using (bucket_id = 'salon-media');

create policy "salon_media_owner_insert"
  on storage.objects for insert
  with check (bucket_id = 'salon-media');

create policy "salon_media_owner_update"
  on storage.objects for update
  using (bucket_id = 'salon-media');

create policy "salon_media_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'salon-media');