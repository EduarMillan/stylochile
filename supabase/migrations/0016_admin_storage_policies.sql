-- ============================================================================
-- StyloCuba — Migración 0016
-- Permite al super-admin (is_app_admin()) leer y borrar archivos del bucket
-- salon-media. Necesario para limpiar Storage cuando se elimina un salón
-- completo desde /admin/salones — las policies de dueño no aplican porque
-- el super-admin no es owner del salón.
-- ============================================================================

drop policy if exists "salon_media_admin_select" on storage.objects;
create policy "salon_media_admin_select"
  on storage.objects for select
  using (bucket_id = 'salon-media' and public.is_app_admin());

drop policy if exists "salon_media_admin_delete" on storage.objects;
create policy "salon_media_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'salon-media' and public.is_app_admin());
