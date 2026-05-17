-- ============================================
-- StyloChile — Migración 0009
-- Fix completo: Políticas de Storage para "salon-media"
-- ============================================

-- 1. Crear o asegurar bucket existe
insert into storage.buckets (id, name, public)
values ('salon-media', 'salon-media', true)
on conflict (id) do nothing;

-- 2. Eliminar todas las políticas existentes
drop policy if exists "salon_media_public_read" on storage.objects;
drop policy if exists "salon_media_owner_insert" on storage.objects;
drop policy if exists "salon_media_owner_update" on storage.objects;
drop policy if exists "salon_media_owner_delete" on storage.objects;

-- 3. Política de lectura pública
create policy "salon_media_public_read"
  on storage.objects for select
  using (bucket_id = 'salon-media');

-- 4. Política de inserción (dueño del salón)
create policy "salon_media_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'salon-media'
    and auth.uid() in (
      select s.owner_id from public.salons s
      where s.id::text = (storage.foldername(name))[0]
    )
  );

-- 5. Política de actualización
create policy "salon_media_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'salon-media'
    and auth.uid() in (
      select s.owner_id from public.salons s
      where s.id::text = (storage.foldername(name))[0]
    )
  );

-- 6. Política de eliminación
create policy "salon_media_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'salon-media'
    and auth.uid() in (
      select s.owner_id from public.salons s
      where s.id::text = (storage.foldername(name))[0]
    )
  );