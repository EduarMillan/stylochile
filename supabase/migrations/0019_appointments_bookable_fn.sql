-- ============================================================================
-- StyloCuba — Migración 0019
-- Reemplaza el inner SELECT del WITH CHECK de appointments_public_insert
-- por una función SECURITY DEFINER. Esto hace que el chequeo NO dependa
-- de RLS de salons (que puede tener ediciones manuales o variantes), y
-- siempre verifique directamente el estado de la fila.
--
-- Mismo comportamiento de negocio: solo se puede reservar en salones
-- publicados y no suspendidos.
-- ============================================================================

create or replace function public.is_salon_bookable(p_salon_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.salons
    where id = p_salon_id
      and is_published = true
      and suspended_at is null
  );
$$;
grant execute on function public.is_salon_bookable(uuid) to anon, authenticated;

drop policy if exists "appointments_public_insert" on public.appointments;
create policy "appointments_public_insert" on public.appointments for insert
  with check (
    status = 'pending'
    and source in ('form', 'whatsapp')
    and public.is_salon_bookable(salon_id)
  );
