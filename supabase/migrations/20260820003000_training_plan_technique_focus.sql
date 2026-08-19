alter table public.training_plans
add column if not exists target_technique_axis text
  check (
    target_technique_axis is null
    or target_technique_axis in (
      'Wasserlage',
      'Zugphase',
      'Druckphase',
      'Rückführung',
      'Rotation',
      'Atmung',
      'Beinarbeit',
      'Wassergefühl'
    )
  );

alter table public.training_plan_versions
add column if not exists target_technique_axis text
  check (
    target_technique_axis is null
    or target_technique_axis in (
      'Wasserlage',
      'Zugphase',
      'Druckphase',
      'Rückführung',
      'Rotation',
      'Atmung',
      'Beinarbeit',
      'Wassergefühl'
    )
  );

create or replace function public.set_training_plan_version_schema()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  template_content jsonb;
begin
  select content_schema_version, content, target_technique_axis
  into new.content_schema_version, template_content, new.target_technique_axis
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