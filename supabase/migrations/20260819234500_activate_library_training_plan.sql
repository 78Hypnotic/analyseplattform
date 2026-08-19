create or replace function public.activate_library_training_plan(
  target_version_id uuid,
  plan_start_date date,
  selected_weekdays smallint[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  version_row public.training_plan_versions%rowtype;
  normalized_weekdays smallint[];
  required_days integer;
  personal_plan_id uuid;
  week_record record;
  session_record record;
  scheduled_date date;
  sequence_number integer := 0;
begin
  if (select auth.uid()) is null then
    raise exception 'Anmeldung erforderlich.' using errcode = '42501';
  end if;

  if plan_start_date < current_date then
    raise exception 'Das Startdatum darf nicht in der Vergangenheit liegen.' using errcode = '22007';
  end if;

  if not public.valid_iso_weekdays(selected_weekdays) then
    raise exception 'Ungültige Trainingstage.' using errcode = '22023';
  end if;

  select *
  into version_row
  from public.training_plan_versions
  where id = target_version_id;

  if version_row.id is null or version_row.discipline <> 'swim' then
    raise exception 'Schwimmplan nicht gefunden.' using errcode = 'P0002';
  end if;

  if coalesce(version_row.content_schema_version, 1) <> 2 then
    raise exception 'Dieser Plan kann noch nicht persönlich terminiert werden.' using errcode = '23514';
  end if;

  if not exists (
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
  ) then
    raise exception 'Keine aktive Gruppencoaching-Freischaltung für diesen Plan.' using errcode = '42501';
  end if;

  select coalesce(max(jsonb_array_length(week_item->'sessions')), 0)
  into required_days
  from jsonb_array_elements(version_row.content->'weeks') as week_item;

  if required_days < 1 then
    raise exception 'Der Trainingsplan enthält keine Einheiten.' using errcode = '23514';
  end if;

  select array_agg(day order by day)
  into normalized_weekdays
  from (
    select distinct unnest(selected_weekdays) as day
  ) as unique_days;

  if cardinality(normalized_weekdays) <> required_days then
    raise exception 'Wähle genau % Trainingstage aus.', required_days using errcode = '22023';
  end if;

  insert into public.user_training_plans (
    user_id,
    training_plan_version_id,
    discipline,
    source,
    start_date,
    selected_weekdays,
    status
  )
  values (
    (select auth.uid()),
    target_version_id,
    version_row.discipline,
    'subscription',
    plan_start_date,
    normalized_weekdays,
    'active'
  )
  returning id into personal_plan_id;

  for week_record in
    select week_item, week_ordinality - 1 as week_index
    from jsonb_array_elements(version_row.content->'weeks')
      with ordinality as weeks(week_item, week_ordinality)
  loop
    for session_record in
      select session_ordinality - 1 as session_index
      from jsonb_array_elements(week_record.week_item->'sessions')
        with ordinality as sessions(session_item, session_ordinality)
    loop
      select generated_days.day::date
      into scheduled_date
      from generate_series(
        plan_start_date + (week_record.week_index::integer * 7),
        plan_start_date + (week_record.week_index::integer * 7) + 6,
        interval '1 day'
      ) as generated_days(day)
      where extract(isodow from generated_days.day)::smallint = any(normalized_weekdays)
      order by generated_days.day
      offset session_record.session_index
      limit 1;

      if scheduled_date is null then
        raise exception 'Trainingstage konnten nicht vollständig terminiert werden.' using errcode = '22023';
      end if;

      insert into public.user_plan_sessions (
        user_training_plan_id,
        week_index,
        session_index,
        sequence,
        scheduled_for,
        status
      )
      values (
        personal_plan_id,
        week_record.week_index,
        session_record.session_index,
        sequence_number,
        scheduled_date,
        'scheduled'
      );

      sequence_number := sequence_number + 1;
    end loop;
  end loop;

  return personal_plan_id;
end;
$$;

revoke all on function public.activate_library_training_plan(uuid, date, smallint[]) from public, anon;
grant execute on function public.activate_library_training_plan(uuid, date, smallint[]) to authenticated;