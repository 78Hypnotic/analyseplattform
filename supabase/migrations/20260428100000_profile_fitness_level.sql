alter table public.profiles
add column if not exists fitness_level integer;

do $$
begin
  alter table public.profiles
    add constraint profiles_fitness_level_check check (fitness_level is null or fitness_level between 1 and 10);
exception
  when duplicate_object then null;
end $$;
