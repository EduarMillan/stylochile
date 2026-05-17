-- ============================================================================
-- StyloCuba — Migración 0018
-- Hace explícito el check de suspended_at en la policy de INSERT de
-- appointments. Antes dependía solo del filtro RLS del SELECT de salons
-- (que excluye suspendidos para anon), lo que generaba ambigüedad: un
-- mismo INSERT podía pasar para el owner (que ve su salón suspendido) y
-- fallar para anon (que no lo ve).
--
-- Ahora la condición de "puedes reservar aquí" es la misma para todos.
-- ============================================================================

drop policy if exists "appointments_public_insert" on public.appointments;
create policy "appointments_public_insert" on public.appointments for insert
  with check (
    status = 'pending'
    and source in ('form', 'whatsapp')
    and exists (
      select 1 from public.salons s
      where s.id = salon_id
        and s.is_published = true
        and s.suspended_at is null
    )
  );
