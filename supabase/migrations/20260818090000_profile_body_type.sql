alter table public.profiles
add column if not exists body_type text;

do $$
begin
  alter table public.profiles
    add constraint profiles_body_type_check check (
      body_type is null or body_type in ('ektomorph', 'mesomorph', 'endomorph')
    );
exception
  when duplicate_object then null;
end $$;
