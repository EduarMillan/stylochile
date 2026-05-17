-- ============================================
-- StyloChile — Migración 0012
-- Fix: Políticas de Storage - versión alternativa
-- ============================================

drop policy if exists "salon_media_owner_insert" on storage.objects;
drop policy if exists "salon_media_owner_update" on storage.objects;
drop policy if exists "salon_media_owner_delete" on storage.objects;

create policy "salon_media_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where owner_id = auth.uid()
      and id::text =split_part(storage.foldername(name)::text, ',', 1)
    )
  );

create policy "salon_media_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where owner_id = auth.uid()
      and id::text = split_part(storage.foldername(name)::text, ',', 1)
    )
  );

create policy "salon_media_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'salon-media'
    and exists (
      select 1 from public.salons
      where owner_id = auth.uid()
      and id::text = split_part(storage.foldername(name)::text, ',', 1)
    )
  );