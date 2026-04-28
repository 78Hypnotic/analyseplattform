alter table public.profiles
add column if not exists disciplines text[] not null default '{}',
add column if not exists profile_visibility text not null default 'private';

do $$
begin
  alter table public.profiles
    add constraint profiles_disciplines_check check (
      array_length(disciplines, 1) is null
      or (
        array_length(disciplines, 1) <= 8
        and disciplines <@ array[
          'Schwimmen',
          'Laufen',
          'Radfahren',
          'Triathlon',
          'Open Water',
          'Crosstraining',
          'Krafttraining',
          'Yoga / Mobility'
        ]::text[]
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles
    add constraint profiles_profile_visibility_check check (
      profile_visibility in ('private', 'public')
    );
exception
  when duplicate_object then null;
end $$;
