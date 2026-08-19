alter table public.training_plans
add column if not exists content_schema_version integer not null default 1
  check (content_schema_version in (1, 2));

alter table public.training_plan_versions
add column if not exists content_schema_version integer not null default 1
  check (content_schema_version in (1, 2));

create or replace function public.set_training_plan_version_schema()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  template_content jsonb;
begin
  select content_schema_version, content
  into new.content_schema_version, template_content
  from public.training_plans
  where id = new.training_plan_id;

  if new.content_schema_version is null then
    raise exception 'Vorlage für Planversion nicht gefunden.' using errcode = '23503';
  end if;

  if new.content_schema_version <> 2 or coalesce((template_content->>'schemaVersion')::integer, 0) <> 2 then
    raise exception 'Nur vollständig strukturierte V2-Pläne können veröffentlicht werden.' using errcode = '23514';
  end if;

  if jsonb_path_exists(
    template_content,
    '$.weeks[*].sessions[*].blocks[*].steps[*] ? (@.needsReview == true)'
  ) then
    raise exception 'Importierte Schritte müssen vor der Veröffentlichung geprüft werden.' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists training_plan_versions_set_schema on public.training_plan_versions;
create trigger training_plan_versions_set_schema
before insert on public.training_plan_versions
for each row execute procedure public.set_training_plan_version_schema();

revoke all on function public.set_training_plan_version_schema() from public, anon, authenticated;