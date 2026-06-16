-- Running diagnostics: discipline discriminator on analyses + latest-run profile summary.

alter table public.analyses
add column if not exists discipline text not null default 'swim';

do $$
begin
  alter table public.analyses
    add constraint analyses_discipline_check check (discipline in ('swim', 'run'));
exception
  when duplicate_object then null;
end $$;

create index if not exists analyses_user_discipline_created_idx
on public.analyses (user_id, discipline, created_at desc);

alter table public.profiles
add column if not exists latest_run_analysis_id uuid,
add column if not exists latest_run_analyzed_at timestamptz,
add column if not exists latest_run_cs_pace_sec numeric(5,1),
add column if not exists latest_run_api numeric(3,1),
add column if not exists latest_run_aci numeric(3,1);

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_run_cs_pace_sec_check check (
      latest_run_cs_pace_sec is null
      or latest_run_cs_pace_sec between 120 and 900
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_run_api_check check (
      latest_run_api is null
      or latest_run_api between 1 and 10
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_run_aci_check check (
      latest_run_aci is null
      or latest_run_aci between 1 and 10
    );
exception
  when duplicate_object then null;
end $$;
