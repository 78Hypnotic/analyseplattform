alter table public.profiles
add column if not exists latest_swim_analysis_id uuid,
add column if not exists latest_swim_analyzed_at timestamptz,
add column if not exists latest_swim_technique_status text,
add column if not exists latest_swim_css_pace_sec numeric(5,1),
add column if not exists latest_swim_vo2_proxy text,
add column if not exists latest_swim_vla_profile text;

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_swim_technique_status_check check (
      latest_swim_technique_status is null
      or latest_swim_technique_status in ('rot', 'gelb', 'gruen')
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_swim_css_pace_sec_check check (
      latest_swim_css_pace_sec is null
      or latest_swim_css_pace_sec between 20 and 300
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_swim_vo2_proxy_check check (
      latest_swim_vo2_proxy is null
      or latest_swim_vo2_proxy in ('hoch', 'mittel', 'niedrig', 'nicht_ermittelbar')
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_swim_vla_profile_check check (
      latest_swim_vla_profile is null
      or latest_swim_vla_profile in ('Diesel', 'Allrounder', 'Sprinter')
    );
exception
  when duplicate_object then null;
end $$;
