alter table public.profiles
add column if not exists age integer,
add column if not exists gender text,
add column if not exists height_cm integer,
add column if not exists weight_kg integer,
add column if not exists body_fat_percentage numeric(4,1);

do $$
begin
  alter table public.profiles
    add constraint profiles_age_check check (age is null or age between 8 and 100);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_gender_check check (gender is null or gender in ('weiblich', 'maennlich', 'divers'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_height_cm_check check (height_cm is null or height_cm between 100 and 230);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_weight_kg_check check (weight_kg is null or weight_kg between 25 and 180);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_body_fat_percentage_check check (
      body_fat_percentage is null or body_fat_percentage between 3 and 60
    );
exception
  when duplicate_object then null;
end $$;
