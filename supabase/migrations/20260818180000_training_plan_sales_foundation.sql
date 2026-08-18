create table if not exists public.training_plan_versions (
  id uuid primary key default gen_random_uuid(),
  training_plan_id uuid not null references public.training_plans(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  discipline text not null check (discipline in ('swim', 'run', 'bike')),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 120),
  focus text not null check (char_length(focus) between 2 and 120),
  phase text not null check (char_length(phase) between 2 and 120),
  level text not null check (char_length(level) between 2 and 80),
  target_distances text[] not null default '{}',
  weeks integer not null check (weeks between 1 and 16),
  summary text not null check (char_length(summary) between 10 and 1200),
  preview text not null check (char_length(preview) between 10 and 1200),
  content jsonb not null,
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz not null default now(),
  unique (training_plan_id, version_number),
  unique (id, discipline)
);

create index if not exists training_plan_versions_plan_published_idx
on public.training_plan_versions (training_plan_id, published_at desc);

create table if not exists public.plan_offers (
  id uuid primary key default gen_random_uuid(),
  training_plan_version_id uuid not null references public.training_plan_versions(id) on delete restrict,
  price_minor bigint not null check (price_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  provider text not null default 'stripe' check (provider in ('stripe', 'apple', 'google')),
  external_product_id text,
  external_price_id text,
  is_active boolean not null default false,
  available_from timestamptz,
  available_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (available_until is null or available_from is null or available_until > available_from),
  unique (id, provider)
);

create unique index if not exists plan_offers_provider_external_price_idx
on public.plan_offers (provider, external_price_id)
where external_price_id is not null;

create unique index if not exists plan_offers_active_version_provider_idx
on public.plan_offers (training_plan_version_id, provider)
where is_active;

create index if not exists plan_offers_active_version_idx
on public.plan_offers (is_active, training_plan_version_id);

create table if not exists public.plan_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  plan_offer_id uuid not null,
  provider text not null check (provider in ('stripe', 'apple', 'google')),
  external_checkout_id text,
  external_transaction_id text,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (plan_offer_id) references public.plan_offers(id) on delete restrict,
  foreign key (plan_offer_id, provider) references public.plan_offers(id, provider) on delete restrict,
  check (
    (status in ('paid', 'refunded') and paid_at is not null)
    or (status not in ('paid', 'refunded') and paid_at is null)
  ),
  check (
    (status = 'refunded' and refunded_at is not null)
    or (status <> 'refunded' and refunded_at is null)
  )
);

create unique index if not exists plan_orders_provider_checkout_idx
on public.plan_orders (provider, external_checkout_id)
where external_checkout_id is not null;

create unique index if not exists plan_orders_provider_transaction_idx
on public.plan_orders (provider, external_transaction_id)
where external_transaction_id is not null;

create index if not exists plan_orders_user_created_idx
on public.plan_orders (user_id, created_at desc);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe', 'apple', 'google')),
  external_event_id text not null,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text,
  unique (provider, external_event_id)
);

create or replace function public.valid_iso_weekdays(value smallint[])
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    coalesce(cardinality(value), 0) <= 7
    and not exists (
      select 1
      from unnest(coalesce(value, '{}'::smallint[])) as weekday
      where weekday < 1 or weekday > 7
    )
    and coalesce(cardinality(value), 0) = (
      select count(distinct weekday)
      from unnest(coalesce(value, '{}'::smallint[])) as weekday
    );
$$;

create table if not exists public.user_training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  training_plan_version_id uuid not null,
  discipline text not null check (discipline in ('swim', 'run', 'bike')),
  plan_order_id uuid references public.plan_orders(id) on delete set null,
  source text not null check (source in ('purchase', 'subscription', 'admin', 'coach')),
  start_date date,
  selected_weekdays smallint[] not null default '{}',
  status text not null default 'setup_required' check (status in ('setup_required', 'active', 'paused', 'completed', 'revoked')),
  granted_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (training_plan_version_id) references public.training_plan_versions(id) on delete restrict,
  foreign key (training_plan_version_id, discipline) references public.training_plan_versions(id, discipline) on delete restrict,
  check (public.valid_iso_weekdays(selected_weekdays)),
  check (
    status in ('setup_required', 'revoked')
    or (start_date is not null and cardinality(selected_weekdays) > 0)
  ),
  check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  ),
  check (
    (status = 'revoked' and revoked_at is not null)
    or (status <> 'revoked' and revoked_at is null)
  )
);

create unique index if not exists user_training_plans_order_idx
on public.user_training_plans (plan_order_id)
where plan_order_id is not null;

create unique index if not exists user_training_plans_one_active_per_discipline_idx
on public.user_training_plans (user_id, discipline)
where status in ('setup_required', 'active', 'paused');

create index if not exists user_training_plans_user_created_idx
on public.user_training_plans (user_id, created_at desc);

create index if not exists user_training_plans_version_idx
on public.user_training_plans (training_plan_version_id);

create table if not exists public.user_plan_sessions (
  id uuid primary key default gen_random_uuid(),
  user_training_plan_id uuid not null references public.user_training_plans(id) on delete cascade,
  week_index integer not null check (week_index >= 0),
  session_index integer not null check (session_index >= 0),
  sequence integer not null check (sequence >= 0),
  scheduled_for date not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'skipped')),
  completed_at timestamptz,
  external_activity_provider text,
  external_activity_id text,
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_training_plan_id, week_index, session_index),
  unique (user_training_plan_id, sequence),
  check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  ),
  check (
    (external_activity_provider is null and external_activity_id is null)
    or (external_activity_provider is not null and external_activity_id is not null)
  )
);

create unique index if not exists user_plan_sessions_external_activity_idx
on public.user_plan_sessions (external_activity_provider, external_activity_id)
where external_activity_id is not null;

create index if not exists user_plan_sessions_next_idx
on public.user_plan_sessions (user_training_plan_id, status, scheduled_for, sequence);

create or replace function public.protect_training_plan_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Published training plan versions cannot be deleted.';
  end if;

  if (to_jsonb(new) - 'published_by') is distinct from (to_jsonb(old) - 'published_by') then
    raise exception 'Published training plan versions cannot be changed.';
  end if;

  return new;
end;
$$;

drop trigger if exists training_plan_versions_immutable on public.training_plan_versions;

create trigger training_plan_versions_immutable
before update or delete on public.training_plan_versions
for each row execute procedure public.protect_training_plan_version();

drop trigger if exists plan_offers_set_updated_at on public.plan_offers;
create trigger plan_offers_set_updated_at
before update on public.plan_offers
for each row execute procedure public.set_updated_at();

drop trigger if exists plan_orders_set_updated_at on public.plan_orders;
create trigger plan_orders_set_updated_at
before update on public.plan_orders
for each row execute procedure public.set_updated_at();

drop trigger if exists user_training_plans_set_updated_at on public.user_training_plans;
create trigger user_training_plans_set_updated_at
before update on public.user_training_plans
for each row execute procedure public.set_updated_at();

drop trigger if exists user_plan_sessions_set_updated_at on public.user_plan_sessions;
create trigger user_plan_sessions_set_updated_at
before update on public.user_plan_sessions
for each row execute procedure public.set_updated_at();

alter table public.training_plan_versions enable row level security;
alter table public.plan_offers enable row level security;
alter table public.plan_orders enable row level security;
alter table public.payment_events enable row level security;
alter table public.user_training_plans enable row level security;
alter table public.user_plan_sessions enable row level security;

create policy "training_plan_versions_select_entitled_coach_or_admin"
on public.training_plan_versions
for select
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.user_training_plans
    where training_plan_version_id = training_plan_versions.id
      and user_id = (select auth.uid())
      and status <> 'revoked'
  )
  or (
    (select public.is_coach())
    and exists (
      select 1
      from public.user_training_plans
      join public.coach_athletes
        on coach_athletes.athlete_id = user_training_plans.user_id
      where user_training_plans.training_plan_version_id = training_plan_versions.id
        and coach_athletes.coach_id = (select auth.uid())
        and user_training_plans.status <> 'revoked'
    )
  )
);

create policy "training_plan_versions_insert_admin"
on public.training_plan_versions
for insert
to authenticated
with check ((select public.is_admin()));

create policy "plan_offers_select_active_or_admin"
on public.plan_offers
for select
to authenticated
using (
  (select public.is_admin())
  or (
    is_active
    and (available_from is null or available_from <= now())
    and (available_until is null or available_until > now())
  )
);

create policy "plan_offers_insert_admin"
on public.plan_offers
for insert
to authenticated
with check ((select public.is_admin()));

create policy "plan_offers_update_admin"
on public.plan_offers
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "plan_offers_delete_admin"
on public.plan_offers
for delete
to authenticated
using ((select public.is_admin()));

create policy "plan_orders_select_own_or_admin"
on public.plan_orders
for select
to authenticated
using (((select auth.uid()) = user_id) or (select public.is_admin()));

create policy "payment_events_select_admin"
on public.payment_events
for select
to authenticated
using ((select public.is_admin()));

create policy "user_training_plans_select_own_coach_or_admin"
on public.user_training_plans
for select
to authenticated
using (
  ((select auth.uid()) = user_id)
  or (select public.is_admin())
  or (
    (select public.is_coach())
    and exists (
      select 1
      from public.coach_athletes
      where coach_id = (select auth.uid())
        and athlete_id = user_training_plans.user_id
    )
  )
);

create policy "user_training_plans_insert_admin"
on public.user_training_plans
for insert
to authenticated
with check ((select public.is_admin()));

create policy "user_training_plans_update_admin"
on public.user_training_plans
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "user_training_plans_delete_admin"
on public.user_training_plans
for delete
to authenticated
using ((select public.is_admin()));

create policy "user_plan_sessions_select_own_coach_or_admin"
on public.user_plan_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.user_training_plans
    where user_training_plans.id = user_plan_sessions.user_training_plan_id
      and (
        user_training_plans.user_id = (select auth.uid())
        or (select public.is_admin())
        or (
          (select public.is_coach())
          and exists (
            select 1
            from public.coach_athletes
            where coach_id = (select auth.uid())
              and athlete_id = user_training_plans.user_id
          )
        )
      )
  )
);

create policy "user_plan_sessions_insert_admin"
on public.user_plan_sessions
for insert
to authenticated
with check ((select public.is_admin()));

create policy "user_plan_sessions_update_admin"
on public.user_plan_sessions
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "user_plan_sessions_delete_admin"
on public.user_plan_sessions
for delete
to authenticated
using ((select public.is_admin()));

grant select, insert on public.training_plan_versions to authenticated;
grant select, insert, update, delete on public.plan_offers to authenticated;
grant select on public.plan_orders to authenticated;
grant select on public.payment_events to authenticated;
grant select, insert, update, delete on public.user_training_plans to authenticated;
grant select, insert, update, delete on public.user_plan_sessions to authenticated;