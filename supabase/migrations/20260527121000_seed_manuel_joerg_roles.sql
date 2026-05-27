with resolved_users as (
  select 'manuel' as key, id
  from public.profiles
  where lower(coalesce(email, '')) = 'manuel.hohlwegler@gmx.de'
     or lower(coalesce(full_name, '')) like 'manuel%'
  order by
    case when lower(coalesce(email, '')) = 'manuel.hohlwegler@gmx.de' then 0 else 1 end,
    created_at asc
  limit 1
),
resolved_joerg as (
  select 'joerg' as key, id
  from public.profiles
  where lower(coalesce(full_name, '')) like 'j%rg%'
     or lower(coalesce(email, '')) like 'j%rg%'
     or lower(coalesce(email, '')) like 'joerg%'
  order by
    case when lower(coalesce(full_name, '')) like 'j%rg%' then 0 else 1 end,
    created_at asc
  limit 1
),
selected_users as (
  select * from resolved_users
  union all
  select * from resolved_joerg
)
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from selected_users
on conflict (user_id, role) do nothing;

with joerg as (
  select id
  from public.profiles
  where lower(coalesce(full_name, '')) like 'j%rg%'
     or lower(coalesce(email, '')) like 'j%rg%'
     or lower(coalesce(email, '')) like 'joerg%'
  order by
    case when lower(coalesce(full_name, '')) like 'j%rg%' then 0 else 1 end,
    created_at asc
  limit 1
)
insert into public.user_roles (user_id, role)
select id, 'coach'::public.app_role
from joerg
on conflict (user_id, role) do nothing;

with manuel as (
  select id
  from public.profiles
  where lower(coalesce(email, '')) = 'manuel.hohlwegler@gmx.de'
     or lower(coalesce(full_name, '')) like 'manuel%'
  order by
    case when lower(coalesce(email, '')) = 'manuel.hohlwegler@gmx.de' then 0 else 1 end,
    created_at asc
  limit 1
),
joerg as (
  select id
  from public.profiles
  where lower(coalesce(full_name, '')) like 'j%rg%'
     or lower(coalesce(email, '')) like 'j%rg%'
     or lower(coalesce(email, '')) like 'joerg%'
  order by
    case when lower(coalesce(full_name, '')) like 'j%rg%' then 0 else 1 end,
    created_at asc
  limit 1
)
insert into public.coach_athletes (coach_id, athlete_id, created_by)
select joerg.id, manuel.id, manuel.id
from joerg
cross join manuel
where joerg.id <> manuel.id
on conflict (coach_id, athlete_id) do nothing;
