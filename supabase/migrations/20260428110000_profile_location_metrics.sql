alter table public.profiles
add column if not exists city text,
add column if not exists vo2max numeric(5,1),
add column if not exists vlamax numeric(4,2),
add column if not exists ftp_rad integer,
add column if not exists muscle_mass_kg numeric(5,1);

do $$
begin
  alter table public.profiles
    add constraint profiles_city_check check (
      city is null or char_length(city) between 1 and 120
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_vo2max_check check (
      vo2max is null or vo2max between 10 and 100
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_vlamax_check check (
      vlamax is null or vlamax between 0 and 2
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_ftp_rad_check check (
      ftp_rad is null or ftp_rad between 50 and 700
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_muscle_mass_kg_check check (
      muscle_mass_kg is null or muscle_mass_kg between 10 and 120
    );
exception
  when duplicate_object then null;
end $$;
