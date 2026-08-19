alter table public.training_plans
add column if not exists discipline text not null default 'swim'
  check (discipline in ('swim', 'run', 'bike'));

create index if not exists training_plans_owner_created_idx
on public.training_plans (created_by, created_at desc);

create table if not exists public.coach_plan_libraries (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Trainingsbibliothek' check (char_length(name) between 3 and 120),
  description text not null default '' check (char_length(description) <= 1200),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id)
);

create table if not exists public.coach_library_versions (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.coach_plan_libraries(id) on delete cascade,
  training_plan_version_id uuid not null references public.training_plan_versions(id) on delete restrict,
  sort_order integer not null default 0 check (sort_order >= 0),
  added_by uuid references auth.users(id) on delete set null,
  added_at timestamptz not null default now(),
  unique (library_id, training_plan_version_id),
  unique (training_plan_version_id)
);

create index if not exists coach_library_versions_library_sort_idx
on public.coach_library_versions (library_id, sort_order, added_at);

create table if not exists public.group_coaching_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  library_id uuid not null references public.coach_plan_libraries(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled', 'expired')),
  source text not null default 'admin' check (source in ('admin', 'subscription')),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_until > valid_from),
  unique (user_id, library_id)
);

create index if not exists group_coaching_memberships_user_status_idx
on public.group_coaching_memberships (user_id, status, valid_until);

drop trigger if exists coach_plan_libraries_set_updated_at on public.coach_plan_libraries;
create trigger coach_plan_libraries_set_updated_at
before update on public.coach_plan_libraries
for each row execute procedure public.set_updated_at();

drop trigger if exists group_coaching_memberships_set_updated_at on public.group_coaching_memberships;
create trigger group_coaching_memberships_set_updated_at
before update on public.group_coaching_memberships
for each row execute procedure public.set_updated_at();

alter table public.coach_plan_libraries enable row level security;
alter table public.coach_library_versions enable row level security;
alter table public.group_coaching_memberships enable row level security;

create or replace function public.has_active_group_coaching_membership(target_library_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_coaching_memberships
    where user_id = (select auth.uid())
      and library_id = target_library_id
      and status = 'active'
      and valid_from <= now()
      and (valid_until is null or valid_until > now())
  );
$$;

create or replace function public.can_access_training_plan_version(target_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (select public.is_admin())
    or exists (
      select 1
      from public.training_plan_versions
      where id = target_version_id
        and published_by = (select auth.uid())
    )
    or exists (
      select 1
      from public.user_training_plans
      where training_plan_version_id = target_version_id
        and user_id = (select auth.uid())
        and status <> 'revoked'
    )
    or exists (
      select 1
      from public.coach_library_versions
      join public.group_coaching_memberships
        on group_coaching_memberships.library_id = coach_library_versions.library_id
      where coach_library_versions.training_plan_version_id = target_version_id
        and group_coaching_memberships.user_id = (select auth.uid())
        and group_coaching_memberships.status = 'active'
        and group_coaching_memberships.valid_from <= now()
        and (
          group_coaching_memberships.valid_until is null
          or group_coaching_memberships.valid_until > now()
        )
    );
$$;

create or replace function public.get_active_training_plan_preview(target_slug text)
returns table (
  id uuid,
  slug text,
  title text,
  focus text,
  phase text,
  weeks integer,
  summary text,
  preview text,
  target_distances text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    plan.id,
    plan.slug,
    plan.title,
    plan.focus,
    plan.phase,
    plan.weeks,
    plan.summary,
    plan.preview,
    plan.target_distances
  from public.training_plans as plan
  where plan.slug = target_slug
    and plan.is_active = true
    and plan.discipline = 'swim'
  limit 1;
$$;

revoke all on function public.has_active_group_coaching_membership(uuid) from public, anon;
revoke all on function public.can_access_training_plan_version(uuid) from public, anon;
revoke all on function public.get_active_training_plan_preview(text) from public, anon;
grant execute on function public.has_active_group_coaching_membership(uuid) to authenticated;
grant execute on function public.can_access_training_plan_version(uuid) to authenticated;
grant execute on function public.get_active_training_plan_preview(text) to authenticated;

drop policy if exists "training_plans_select_active_or_admin" on public.training_plans;
drop policy if exists "training_plans_insert_admin" on public.training_plans;
drop policy if exists "training_plans_update_admin" on public.training_plans;
drop policy if exists "training_plans_delete_admin" on public.training_plans;

create policy "training_plans_select_active_owner_or_admin"
on public.training_plans
for select
to authenticated
using (
  (select public.is_admin())
  or (
    (select public.is_coach())
    and created_by = (select auth.uid())
  )
);

create policy "training_plans_insert_owner_or_admin"
on public.training_plans
for insert
to authenticated
with check (
  (select public.is_admin())
  or (
    (select public.is_coach())
    and created_by = (select auth.uid())
    and discipline = 'swim'
  )
);

create policy "training_plans_update_owner_or_admin"
on public.training_plans
for update
to authenticated
using (
  (select public.is_admin())
  or (
    (select public.is_coach())
    and created_by = (select auth.uid())
  )
)
with check (
  (select public.is_admin())
  or (
    (select public.is_coach())
    and created_by = (select auth.uid())
    and discipline = 'swim'
  )
);

create policy "training_plans_delete_owner_or_admin"
on public.training_plans
for delete
to authenticated
using (
  (select public.is_admin())
  or (
    (select public.is_coach())
    and created_by = (select auth.uid())
  )
);

drop policy if exists "training_plan_versions_select_entitled_coach_or_admin" on public.training_plan_versions;
drop policy if exists "training_plan_versions_insert_admin" on public.training_plan_versions;

create policy "training_plan_versions_select_entitled"
on public.training_plan_versions
for select
to authenticated
using ((select public.can_access_training_plan_version(id)));

create policy "training_plan_versions_insert_owner_or_admin"
on public.training_plan_versions
for insert
to authenticated
with check ((select public.is_admin()));

create policy "coach_plan_libraries_select_entitled"
on public.coach_plan_libraries
for select
to authenticated
using (
  (select public.is_admin())
  or coach_id = (select auth.uid())
  or (select public.has_active_group_coaching_membership(id))
);

create policy "coach_plan_libraries_insert_owner_or_admin"
on public.coach_plan_libraries
for insert
to authenticated
with check (
  (select public.is_admin())
  or (
    (select public.is_coach())
    and coach_id = (select auth.uid())
  )
);

create policy "coach_plan_libraries_update_owner_or_admin"
on public.coach_plan_libraries
for update
to authenticated
using ((select public.is_admin()) or coach_id = (select auth.uid()))
with check ((select public.is_admin()) or coach_id = (select auth.uid()));

create policy "coach_plan_libraries_delete_admin"
on public.coach_plan_libraries
for delete
to authenticated
using ((select public.is_admin()));

create policy "coach_library_versions_select_entitled"
on public.coach_library_versions
for select
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.coach_plan_libraries
    where coach_plan_libraries.id = coach_library_versions.library_id
      and (
        coach_plan_libraries.coach_id = (select auth.uid())
        or (select public.has_active_group_coaching_membership(coach_plan_libraries.id))
      )
  )
);

create policy "coach_library_versions_insert_owner_or_admin"
on public.coach_library_versions
for insert
to authenticated
with check (
  (select public.is_admin())
  or (
    (select public.is_coach())
    and added_by = (select auth.uid())
    and exists (
      select 1
      from public.coach_plan_libraries
      where coach_plan_libraries.id = coach_library_versions.library_id
        and coach_plan_libraries.coach_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.training_plan_versions
      where training_plan_versions.id = coach_library_versions.training_plan_version_id
        and training_plan_versions.published_by = (select auth.uid())
    )
  )
);

create policy "coach_library_versions_update_owner_or_admin"
on public.coach_library_versions
for update
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.coach_plan_libraries
    where coach_plan_libraries.id = coach_library_versions.library_id
      and coach_plan_libraries.coach_id = (select auth.uid())
  )
)
with check (
  (select public.is_admin())
  or exists (
    select 1
    from public.coach_plan_libraries
    where coach_plan_libraries.id = coach_library_versions.library_id
      and coach_plan_libraries.coach_id = (select auth.uid())
  )
);

create policy "coach_library_versions_delete_owner_or_admin"
on public.coach_library_versions
for delete
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.coach_plan_libraries
    where coach_plan_libraries.id = coach_library_versions.library_id
      and coach_plan_libraries.coach_id = (select auth.uid())
  )
);

create policy "group_coaching_memberships_select_own_coach_or_admin"
on public.group_coaching_memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_admin())
  or exists (
    select 1
    from public.coach_plan_libraries
    where coach_plan_libraries.id = group_coaching_memberships.library_id
      and coach_plan_libraries.coach_id = (select auth.uid())
  )
);

create policy "group_coaching_memberships_insert_admin"
on public.group_coaching_memberships
for insert
to authenticated
with check ((select public.is_admin()));

create policy "group_coaching_memberships_update_admin"
on public.group_coaching_memberships
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "group_coaching_memberships_delete_admin"
on public.group_coaching_memberships
for delete
to authenticated
using ((select public.is_admin()));

create or replace function public.publish_training_plan(target_plan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_row public.training_plans%rowtype;
  next_version integer;
  version_id uuid;
  target_library_id uuid;
begin
  select *
  into plan_row
  from public.training_plans
  where id = target_plan_id
  for update;

  if plan_row.id is null then
    raise exception 'Trainingsplan nicht gefunden.' using errcode = 'P0002';
  end if;

  if not (select public.is_admin()) and not (
    (select public.is_coach())
    and plan_row.created_by = (select auth.uid())
    and plan_row.discipline = 'swim'
  ) then
    raise exception 'Keine Berechtigung zur Veröffentlichung.' using errcode = '42501';
  end if;

  select coalesce(max(version_number), 0) + 1
  into next_version
  from public.training_plan_versions
  where training_plan_id = target_plan_id;

  insert into public.training_plan_versions (
    training_plan_id,
    version_number,
    discipline,
    slug,
    title,
    focus,
    phase,
    level,
    target_distances,
    weeks,
    summary,
    preview,
    content,
    published_by
  )
  values (
    plan_row.id,
    next_version,
    plan_row.discipline,
    plan_row.slug,
    plan_row.title,
    plan_row.focus,
    plan_row.phase,
    plan_row.level,
    plan_row.target_distances,
    plan_row.weeks,
    plan_row.summary,
    plan_row.preview,
    plan_row.content,
    (select auth.uid())
  )
  returning id into version_id;

  if (select public.is_coach()) then
    insert into public.coach_plan_libraries (coach_id)
    values ((select auth.uid()))
    on conflict (coach_id) do update
      set updated_at = now()
    returning id into target_library_id;

    insert into public.coach_library_versions (
      library_id,
      training_plan_version_id,
      sort_order,
      added_by
    )
    values (
      target_library_id,
      version_id,
      coalesce((
        select max(sort_order) + 1
        from public.coach_library_versions
        where coach_library_versions.library_id = target_library_id
      ), 0),
      (select auth.uid())
    );
  end if;

  update public.training_plans
  set is_active = true
  where id = target_plan_id;

  return version_id;
end;
$$;

revoke all on function public.publish_training_plan(uuid) from public, anon;
grant execute on function public.publish_training_plan(uuid) to authenticated;

grant select, insert, update, delete on public.coach_plan_libraries to authenticated;
grant select, insert, update, delete on public.coach_library_versions to authenticated;
grant select, insert, update, delete on public.group_coaching_memberships to authenticated;