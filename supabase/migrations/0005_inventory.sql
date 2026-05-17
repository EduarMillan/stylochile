-- ============================================================================
-- StyloChile — Migración 0005 (Fase 4)
-- Almacén / inventario : items + movimientos + RPC atómico.
-- ============================================================================

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  sku text,
  unit text not null default 'u',         -- 'u' (unidades), 'ml', 'g', 'L', etc.
  quantity numeric(12, 2) not null default 0,
  min_quantity numeric(12, 2) not null default 0,
  unit_cost numeric(12, 2),
  currency text not null default 'CLP',
  supplier text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inventory_items_salon_id_idx on public.inventory_items(salon_id);

create trigger inventory_items_touch_updated_at
  before update on public.inventory_items
  for each row execute function public.touch_updated_at();

alter table public.inventory_items enable row level security;

create policy "inventory_items_owner_all"
  on public.inventory_items for all
  using (
    exists (select 1 from public.salons s where s.id = inventory_items.salon_id and s.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.salons s where s.id = inventory_items.salon_id and s.owner_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- inventory_movements : log append-only de entradas, salidas y ajustes
-- ----------------------------------------------------------------------------
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  type text not null check (type in ('in', 'out', 'adjustment')),
  quantity numeric(12, 2) not null check (quantity >= 0),
  reason text,
  created_at timestamptz not null default now()
);

create index inventory_movements_item_id_idx on public.inventory_movements(item_id);
create index inventory_movements_salon_id_idx on public.inventory_movements(salon_id);

alter table public.inventory_movements enable row level security;

create policy "inventory_movements_owner_all"
  on public.inventory_movements for all
  using (
    exists (select 1 from public.salons s where s.id = inventory_movements.salon_id and s.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.salons s where s.id = inventory_movements.salon_id and s.owner_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- record_inventory_movement : aplica movimiento + actualiza saldo en una sola
-- transacción. Evita carreras cuando dos personas tocan el mismo item.
-- ----------------------------------------------------------------------------
create or replace function public.record_inventory_movement(
  p_item_id uuid,
  p_type text,
  p_quantity numeric,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_salon_id uuid;
  v_owner uuid;
begin
  select i.salon_id, s.owner_id
    into v_salon_id, v_owner
    from public.inventory_items i
    join public.salons s on s.id = i.salon_id
    where i.id = p_item_id;

  if v_salon_id is null then
    raise exception 'Item not found';
  end if;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'Not authorized';
  end if;
  if p_type not in ('in', 'out', 'adjustment') then
    raise exception 'Invalid movement type: %', p_type;
  end if;
  if p_quantity < 0 then
    raise exception 'Quantity must be non-negative';
  end if;

  insert into public.inventory_movements (item_id, salon_id, type, quantity, reason)
    values (p_item_id, v_salon_id, p_type, p_quantity, p_reason)
    returning id into v_id;

  update public.inventory_items
  set quantity = case
    when p_type = 'in' then quantity + p_quantity
    when p_type = 'out' then greatest(0, quantity - p_quantity)
    when p_type = 'adjustment' then p_quantity
  end
  where id = p_item_id;

  return v_id;
end;
$$;

grant execute on function public.record_inventory_movement(uuid, text, numeric, text) to authenticated;
