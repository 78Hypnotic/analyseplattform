-- Bike diagnostics: allow discipline 'bike' + latest-bike profile summary.

alter table public.analyses
drop constraint if exists analyses_discipline_check;

do $$
begin
  alter table public.analyses
    add constraint analyses_discipline_check check (discipline in ('swim', 'run', 'bike'));
exception
  when duplicate_object then null;
end $$;

alter table public.profiles
add column if not exists latest_bike_analysis_id uuid,
add column if not exists latest_bike_analyzed_at timestamptz,
add column if not exists latest_bike_ftp_watt integer,
add column if not exists latest_bike_vo2max_rel numeric(4,1),
add column if not exists latest_bike_vlamax_proxy numeric(3,2);

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_bike_ftp_watt_check check (
      latest_bike_ftp_watt is null
      or latest_bike_ftp_watt between 50 and 700
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_bike_vo2max_rel_check check (
      latest_bike_vo2max_rel is null
      or latest_bike_vo2max_rel between 20 and 100
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_latest_bike_vlamax_proxy_check check (
      latest_bike_vlamax_proxy is null
      or latest_bike_vlamax_proxy between 0.1 and 1.5
    );
exception
  when duplicate_object then null;
end $$;
