-- ============================================================================
-- StyloChile — Migración 0003 (Fase 2)
-- Sistema de reservas: tabla appointments + función pública para slots tomados.
-- ============================================================================

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  area_id uuid references public.salon_areas(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  client_name text not null,
  client_phone text not null,
  client_notes text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','completed','cancelled')),
  source text not null default 'form'
    check (source in ('form','whatsapp')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_check check (ends_at > starts_at)
);

create index appointments_salon_id_idx on public.appointments(salon_id);
create index appointments_starts_at_idx on public.appointments(starts_at);
create index appointments_status_idx on public.appointments(status);
create index appointments_area_id_idx on public.appointments(area_id);

create trigger appointments_touch_updated_at
  before update on public.appointments
  for each row execute function public.touch_updated_at();

alter table public.appointments enable row level security;

-- Público crea solo en estado pending y solo en salones publicados
create policy "appointments_public_insert"
  on public.appointments for insert
  with check (
    status = 'pending'
    and source in ('form', 'whatsapp')
    and exists (
      select 1 from public.salons s
      where s.id = salon_id and s.is_published = true
    )
  );

-- Dueño lee/actualiza/borra sus citas
create policy "appointments_owner_select"
  on public.appointments for select
  using (
    exists (
      select 1 from public.salons s
      where s.id = appointments.salon_id and s.owner_id = auth.uid()
    )
  );

create policy "appointments_owner_update"
  on public.appointments for update
  using (
    exists (
      select 1 from public.salons s
      where s.id = appointments.salon_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salons s
      where s.id = appointments.salon_id and s.owner_id = auth.uid()
    )
  );

create policy "appointments_owner_delete"
  on public.appointments for delete
  using (
    exists (
      select 1 from public.salons s
      where s.id = appointments.salon_id and s.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- get_busy_slots : función pública (security definer) que expone solo los
-- rangos de tiempo ocupados de un salón en un día, sin datos del cliente.
-- Usada por la página pública de reservas para calcular slots libres.
-- ----------------------------------------------------------------------------
create or replace function public.get_busy_slots(
  p_salon_id uuid,
  p_day date
)
returns table (
  area_id uuid,
  starts_at timestamptz,
  ends_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select a.area_id, a.starts_at, a.ends_at
  from public.appointments a
  join public.salons s on s.id = a.salon_id
  where a.salon_id = p_salon_id
    and s.is_published = true
    and a.status in ('pending', 'approved')
    and a.starts_at::date = p_day;
$$;

grant execute on function public.get_busy_slots(uuid, date) to anon, authenticated;
