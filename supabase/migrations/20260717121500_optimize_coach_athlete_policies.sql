-- Consolidate write policies and cover the analysis audit foreign key.

create index if not exists analyses_updated_by_idx
on public.analyses (updated_by);

drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_assigned_coach_or_admin" on public.profiles;
drop policy if exists "profiles_update_own_assigned_coach_or_admin" on public.profiles;

create policy "profiles_update_own_assigned_coach_or_admin"
on public.profiles
for update
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
)
with check (
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

drop policy if exists "analyses_insert_own" on public.analyses;
drop policy if exists "analyses_insert_assigned_coach_or_admin" on public.analyses;
drop policy if exists "analyses_insert_own_assigned_coach_or_admin" on public.analyses;

create policy "analyses_insert_own_assigned_coach_or_admin"
on public.analyses
for insert
to authenticated
with check (
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

drop policy if exists "analyses_update_own" on public.analyses;
drop policy if exists "analyses_update_assigned_coach_or_admin" on public.analyses;
drop policy if exists "analyses_update_own_assigned_coach_or_admin" on public.analyses;

create policy "analyses_update_own_assigned_coach_or_admin"
on public.analyses
for update
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
)
with check (
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

drop policy if exists "analyses_delete_own" on public.analyses;
drop policy if exists "analyses_delete_assigned_coach_or_admin" on public.analyses;
drop policy if exists "analyses_delete_own_assigned_coach_or_admin" on public.analyses;

create policy "analyses_delete_own_assigned_coach_or_admin"
on public.analyses
for delete
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
