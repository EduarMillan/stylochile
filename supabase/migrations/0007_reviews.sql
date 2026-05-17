-- ============================================================================
-- StyloChile — Migración 0007 (Fase 5)
-- Reseñas + RPC para verificar que un teléfono pertenece a una cita aprobada.
-- ============================================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  client_name text not null,
  client_phone text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index reviews_salon_id_idx on public.reviews(salon_id);
create index reviews_created_at_idx on public.reviews(created_at desc);

alter table public.reviews enable row level security;

-- Lectura pública: reseñas de salones publicados.
create policy "reviews_public_select"
  on public.reviews for select
  using (
    exists (
      select 1 from public.salons s
      where s.id = reviews.salon_id and s.is_published = true
    )
  );

-- Inserción pública: solo si el salón está publicado. La validación adicional
-- (que el teléfono coincide con una cita) la hace el server action vía RPC.
create policy "reviews_public_insert"
  on public.reviews for insert
  with check (
    exists (
      select 1 from public.salons s
      where s.id = salon_id and s.is_published = true
    )
  );

-- Dueño puede borrar reseñas inapropiadas
create policy "reviews_owner_delete"
  on public.reviews for delete
  using (
    exists (
      select 1 from public.salons s
      where s.id = reviews.salon_id and s.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- can_review_salon : verifica que el teléfono dado pertenece a alguna cita
-- aprobada o completada en el salón. Llamada desde el server action antes
-- de insertar la reseña. Bypassa RLS de appointments (security definer).
-- ----------------------------------------------------------------------------
create or replace function public.can_review_salon(
  p_salon_id uuid,
  p_phone text
)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.appointments a
    where a.salon_id = p_salon_id
      and regexp_replace(a.client_phone, '\D', '', 'g')
        = regexp_replace(p_phone, '\D', '', 'g')
      and a.status in ('approved', 'completed')
  );
$$;

grant execute on function public.can_review_salon(uuid, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- find_appointment_for_review : devuelve la cita más reciente aprobada/completada
-- del cliente para asociarla a la reseña (opcional pero útil).
-- ----------------------------------------------------------------------------
create or replace function public.find_appointment_for_review(
  p_salon_id uuid,
  p_phone text
)
returns uuid
language sql security definer stable
set search_path = public
as $$
  select a.id from public.appointments a
  where a.salon_id = p_salon_id
    and regexp_replace(a.client_phone, '\D', '', 'g')
      = regexp_replace(p_phone, '\D', '', 'g')
    and a.status in ('approved', 'completed')
  order by a.starts_at desc
  limit 1;
$$;

grant execute on function public.find_appointment_for_review(uuid, text) to anon, authenticated;
