-- ============================================================================
-- StyloCuba — Migración 0017
-- Sistema de subscriptions: trial configurable + plan mensual con pago
-- manual. Sin recibos formales (v1 simplificado) — el super-admin marca
-- como pagado y se extiende el período un mes.
-- ============================================================================

-- 1) Settings globales — fila única, editable solo por super-admin.
create table if not exists public.platform_settings (
  id boolean primary key default true check (id = true),
  trial_days integer not null default 90
    check (trial_days >= 1 and trial_days <= 365),
  grace_period_days integer not null default 5
    check (grace_period_days >= 0 and grace_period_days <= 30),
  monthly_price numeric(12, 2) not null default 1000
    check (monthly_price >= 0),
  currency text not null default 'CUP',
  admin_whatsapp text,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id) values (true)
  on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

drop policy if exists "platform_settings_public_read"
  on public.platform_settings;
create policy "platform_settings_public_read"
  on public.platform_settings for select
  using (true);

drop policy if exists "platform_settings_admin_update"
  on public.platform_settings;
create policy "platform_settings_admin_update"
  on public.platform_settings for update
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- 2) Subscription por salón. Una fila por salón (UNIQUE), se auto-crea
-- vía trigger cuando se inserta un salón.
do $$
begin
  create type public.subscription_status as enum (
    'trialing',
    'active',
    'expired'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.salon_subscriptions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null unique
    references public.salons(id) on delete cascade,
  status public.subscription_status not null default 'trialing',
  trial_starts_at timestamptz not null default now(),
  trial_ends_at timestamptz not null,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  last_payment_at timestamptz,
  last_payment_amount numeric(12, 2),
  last_payment_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists salon_subscriptions_salon_id_idx
  on public.salon_subscriptions(salon_id);
create index if not exists salon_subscriptions_status_idx
  on public.salon_subscriptions(status);

alter table public.salon_subscriptions enable row level security;

-- Dueño lee su propia subscription
drop policy if exists "salon_subscriptions_owner_select"
  on public.salon_subscriptions;
create policy "salon_subscriptions_owner_select"
  on public.salon_subscriptions for select
  using (
    exists (
      select 1 from public.salons s
      where s.id = salon_subscriptions.salon_id
        and s.owner_id = auth.uid()
    )
  );

-- Super-admin: todo
drop policy if exists "salon_subscriptions_admin_all"
  on public.salon_subscriptions;
create policy "salon_subscriptions_admin_all"
  on public.salon_subscriptions for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- Trigger updated_at
create trigger salon_subscriptions_touch_updated_at
  before update on public.salon_subscriptions
  for each row execute function public.touch_updated_at();

create trigger platform_settings_touch_updated_at
  before update on public.platform_settings
  for each row execute function public.touch_updated_at();

-- 3) Trigger: auto-crear subscription cuando se crea un salón.
create or replace function public.create_salon_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trial_days integer;
begin
  select trial_days into v_trial_days
    from public.platform_settings where id = true;
  if v_trial_days is null then v_trial_days := 90; end if;

  insert into public.salon_subscriptions (salon_id, trial_ends_at)
  values (new.id, now() + (v_trial_days || ' days')::interval)
  on conflict (salon_id) do nothing;

  return new;
end;
$$;

drop trigger if exists salons_create_subscription on public.salons;
create trigger salons_create_subscription
  after insert on public.salons
  for each row execute function public.create_salon_subscription();

-- 4) Backfill: salones existentes sin subscription.
-- Asumimos trial empezó al crear el salón. Si ya venció, queda como
-- "expired" para que el super-admin decida marcar como pagado o suspender.
insert into public.salon_subscriptions (
  salon_id,
  status,
  trial_starts_at,
  trial_ends_at
)
select
  s.id,
  case
    when s.created_at + (
      (select trial_days from public.platform_settings where id = true)
      || ' days'
    )::interval > now()
    then 'trialing'::public.subscription_status
    else 'expired'::public.subscription_status
  end,
  s.created_at,
  s.created_at + (
    (select trial_days from public.platform_settings where id = true)
    || ' days'
  )::interval
from public.salons s
where not exists (
  select 1 from public.salon_subscriptions sub
  where sub.salon_id = s.id
);
