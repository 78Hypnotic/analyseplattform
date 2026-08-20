alter table public.coach_plan_libraries
add column if not exists slug text;

create or replace function public.slugify(value text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(both '-' from regexp_replace(
    replace(replace(replace(replace(lower(coalesce(value, 'community')), 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
$$;

create or replace function public.build_coach_library_slug(target_coach_id uuid, target_name text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  profile_name text;
  base_slug text;
  candidate text;
  suffix integer := 2;
begin
  select coalesce(nullif(full_name, ''), split_part(email, '@', 1), 'community')
  into profile_name
  from public.profiles
  where id = target_coach_id;

  base_slug := public.slugify(coalesce(profile_name, target_name, 'community'));
  if base_slug = '' then
    base_slug := 'community';
  end if;

  candidate := base_slug;
  while exists (
    select 1
    from public.coach_plan_libraries
    where slug = candidate
      and coach_id <> target_coach_id
  ) loop
    candidate := base_slug || '-' || suffix::text;
    suffix := suffix + 1;
  end loop;

  return candidate;
end;
$$;

update public.coach_plan_libraries
set slug = public.build_coach_library_slug(coach_id, name)
where slug is null or slug = '';

alter table public.coach_plan_libraries
alter column slug set not null;

do $$
begin
  alter table public.coach_plan_libraries
    add constraint coach_plan_libraries_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
exception
  when duplicate_object then null;
end $$;

create unique index if not exists coach_plan_libraries_slug_idx
on public.coach_plan_libraries (slug);

drop trigger if exists coach_plan_libraries_set_slug on public.coach_plan_libraries;

create or replace function public.set_coach_library_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.build_coach_library_slug(new.coach_id, new.name);
  else
    new.slug := public.slugify(new.slug);
  end if;

  return new;
end;
$$;

create trigger coach_plan_libraries_set_slug
before insert or update of slug, coach_id, name on public.coach_plan_libraries
for each row execute procedure public.set_coach_library_slug();

revoke all on function public.slugify(text) from public, anon;
revoke all on function public.build_coach_library_slug(uuid, text) from public, anon;
revoke all on function public.set_coach_library_slug() from public, anon, authenticated;
grant execute on function public.slugify(text) to authenticated;
grant execute on function public.build_coach_library_slug(uuid, text) to authenticated;