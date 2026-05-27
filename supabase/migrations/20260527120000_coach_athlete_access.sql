alter type public.app_role add value if not exists 'coach';

create table if not exists public.coach_athletes (
  coach_id uuid not null references auth.users(id) on delete cascade,
  athlete_id uuid not null references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (coach_id, athlete_id),
  constraint coach_athletes_distinct_users_check check (coach_id <> athlete_id)
);

create index if not exists coach_athletes_coach_idx
on public.coach_athletes (coach_id);

create index if not exists coach_athletes_athlete_idx
on public.coach_athletes (athlete_id);

alter table public.coach_athletes enable row level security;

grant select on public.profiles to authenticated;
grant select on public.analyses to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select, insert, delete on public.coach_athletes to authenticated;

alter table public.user_roles drop constraint if exists user_roles_pkey;

do $$
begin
  alter table public.user_roles
    add constraint user_roles_pkey primary key (user_id, role);
exception
  when duplicate_object then null;
end $$;

create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role::text = 'coach'
  );
$$;

grant execute on function public.is_coach() to authenticated;

drop policy if exists "user_roles_insert_admin" on public.user_roles;
drop policy if exists "user_roles_update_admin" on public.user_roles;
drop policy if exists "user_roles_delete_admin" on public.user_roles;

create policy "user_roles_insert_admin"
on public.user_roles
for insert
to authenticated
with check ((select public.is_admin()));

create policy "user_roles_update_admin"
on public.user_roles
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "user_roles_delete_admin"
on public.user_roles
for delete
to authenticated
using ((select public.is_admin()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

  insert into public.user_roles (user_id, role)
  values (new.id, 'user'::public.app_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop policy if exists "coach_athletes_select_admin_or_own_coach" on public.coach_athletes;
drop policy if exists "coach_athletes_insert_admin" on public.coach_athletes;
drop policy if exists "coach_athletes_delete_admin" on public.coach_athletes;

create policy "coach_athletes_select_admin_or_own_coach"
on public.coach_athletes
for select
to authenticated
using (((select auth.uid()) = coach_id) or (select public.is_admin()));

create policy "coach_athletes_insert_admin"
on public.coach_athletes
for insert
to authenticated
with check ((select public.is_admin()));

create policy "coach_athletes_delete_admin"
on public.coach_athletes
for delete
to authenticated
using ((select public.is_admin()));

drop policy if exists "profiles_select_own" on public.profiles;

create policy "profiles_select_own_admin_or_assigned_coach"
on public.profiles
for select
to authenticated
using (
  ((select auth.uid()) = id)
  or (select public.is_admin())
  or (
    (select public.is_coach())
    and exists (
      select 1
      from public.coach_athletes
      where coach_id = (select auth.uid())
        and athlete_id = profiles.id
    )
  )
);

drop policy if exists "analyses_select_own" on public.analyses;

create policy "analyses_select_own_or_assigned_coach"
on public.analyses
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
        and athlete_id = analyses.user_id
    )
  )
);
