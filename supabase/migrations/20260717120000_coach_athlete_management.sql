-- Coach athlete management: controlled profile updates, analysis mutations and audit attribution.

alter table public.analyses
add column if not exists created_by uuid references auth.users(id) on delete set null,
add column if not exists created_by_name text,
add column if not exists updated_by uuid references auth.users(id) on delete set null,
add column if not exists updated_by_name text;

update public.analyses as analyses
set
  created_by = analyses.user_id,
  created_by_name = coalesce(profiles.full_name, profiles.email, 'Athlet'),
  updated_by = analyses.user_id,
  updated_by_name = coalesce(profiles.full_name, profiles.email, 'Athlet')
from public.profiles as profiles
where profiles.id = analyses.user_id
  and analyses.created_by is null;

create index if not exists analyses_created_by_idx
on public.analyses (created_by, created_at desc);

create index if not exists coach_athletes_created_by_idx
on public.coach_athletes (created_by);

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.analyses to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_coach() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_coach() to authenticated;

drop policy if exists "profiles_update_assigned_coach_or_admin" on public.profiles;

create policy "profiles_update_assigned_coach_or_admin"
on public.profiles
for update
to authenticated
using (
  (select public.is_admin())
  or (
    (select public.is_coach())
    and exists (
      select 1
      from public.coach_athletes
      where coach_id = (select auth.uid())
        and athlete_id = profiles.id
    )
  )
)
with check (
  (select public.is_admin())
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

drop policy if exists "analyses_insert_assigned_coach_or_admin" on public.analyses;
drop policy if exists "analyses_update_assigned_coach_or_admin" on public.analyses;
drop policy if exists "analyses_delete_assigned_coach_or_admin" on public.analyses;

create policy "analyses_insert_assigned_coach_or_admin"
on public.analyses
for insert
to authenticated
with check (
  (select public.is_admin())
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

create policy "analyses_update_assigned_coach_or_admin"
on public.analyses
for update
to authenticated
using (
  (select public.is_admin())
  or (
    (select public.is_coach())
    and exists (
      select 1
      from public.coach_athletes
      where coach_id = (select auth.uid())
        and athlete_id = analyses.user_id
    )
  )
)
with check (
  (select public.is_admin())
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

create policy "analyses_delete_assigned_coach_or_admin"
on public.analyses
for delete
to authenticated
using (
  (select public.is_admin())
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

create or replace function public.protect_coach_profile_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (select auth.uid()) is not null
    and (select auth.uid()) <> old.id
    and not (select public.is_admin())
  then
    if new.id is distinct from old.id
      or new.email is distinct from old.email
      or new.avatar_path is distinct from old.avatar_path
      or new.avatar_url is distinct from old.avatar_url
      or new.profile_visibility is distinct from old.profile_visibility
      or new.created_at is distinct from old.created_at
    then
      raise exception 'Coach darf Kontodaten und Privatsphäre nicht ändern.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_coach_profile_update on public.profiles;

create trigger protect_coach_profile_update
before update on public.profiles
for each row execute procedure public.protect_coach_profile_update();

revoke all on function public.protect_coach_profile_update() from public, anon, authenticated;

create or replace function public.set_analysis_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_name text;
begin
  if actor_id is null then
    return new;
  end if;

  select coalesce(full_name, email, 'Nutzer')
  into actor_name
  from public.profiles
  where id = actor_id;

  if tg_op = 'INSERT' then
    new.created_by := actor_id;
    new.created_by_name := coalesce(actor_name, 'Nutzer');
  else
    if new.id is distinct from old.id
      or new.user_id is distinct from old.user_id
      or new.discipline is distinct from old.discipline
      or new.created_at is distinct from old.created_at
      or new.created_by is distinct from old.created_by
      or new.created_by_name is distinct from old.created_by_name
    then
      raise exception 'Analyse-Eigentümerschaft und Herkunft dürfen nicht geändert werden.'
        using errcode = '42501';
    end if;
  end if;

  new.updated_by := actor_id;
  new.updated_by_name := coalesce(actor_name, 'Nutzer');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_analysis_audit_fields on public.analyses;

create trigger set_analysis_audit_fields
before insert or update on public.analyses
for each row execute procedure public.set_analysis_audit_fields();

revoke all on function public.set_analysis_audit_fields() from public, anon, authenticated;
