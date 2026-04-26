do $$
begin
  create type public.app_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_roles_set_updated_at on public.user_roles;

create trigger user_roles_set_updated_at
before update on public.user_roles
for each row execute procedure public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'::public.app_role
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "user_roles_select_own_or_admin" on public.user_roles;

create policy "user_roles_select_own_or_admin"
on public.user_roles
for select
to authenticated
using (((select auth.uid()) = user_id) or (select public.is_admin()));

insert into public.user_roles (user_id, role)
select id, 'user'::public.app_role
from auth.users
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

  insert into public.user_roles (user_id, role)
  values (new.id, 'user'::public.app_role)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 120),
  focus text not null check (char_length(focus) between 2 and 120),
  phase text not null check (char_length(phase) between 2 and 120),
  level text not null check (char_length(level) between 2 and 80),
  target_distances text[] not null default '{}',
  weeks integer not null check (weeks between 1 and 16),
  summary text not null check (char_length(summary) between 10 and 1200),
  preview text not null check (char_length(preview) between 10 and 1200),
  content jsonb not null default '{"weeks":[]}'::jsonb,
  is_active boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_plans_active_slug_idx
on public.training_plans (is_active, slug);

create index if not exists training_plans_created_at_idx
on public.training_plans (created_at desc);

alter table public.training_plans enable row level security;

drop trigger if exists training_plans_set_updated_at on public.training_plans;

create trigger training_plans_set_updated_at
before update on public.training_plans
for each row execute procedure public.set_updated_at();

drop policy if exists "training_plans_select_active_or_admin" on public.training_plans;
drop policy if exists "training_plans_insert_admin" on public.training_plans;
drop policy if exists "training_plans_update_admin" on public.training_plans;
drop policy if exists "training_plans_delete_admin" on public.training_plans;

create policy "training_plans_select_active_or_admin"
on public.training_plans
for select
to authenticated
using (is_active or (select public.is_admin()));

create policy "training_plans_insert_admin"
on public.training_plans
for insert
to authenticated
with check ((select public.is_admin()));

create policy "training_plans_update_admin"
on public.training_plans
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "training_plans_delete_admin"
on public.training_plans
for delete
to authenticated
using ((select public.is_admin()));

insert into public.training_plans (
  slug,
  title,
  focus,
  phase,
  level,
  target_distances,
  weeks,
  summary,
  preview,
  content,
  is_active
)
values
  (
    'wasserlage-balance',
    'Wasserlage & Balance',
    'Technik-Fundament',
    'Technik-Fundament',
    'Einsteiger bis Fortgeschritten',
    array['Sprint','OD','MD','LD','Becken','Freiwasser'],
    6,
    'Ein Technikblock für ruhigere Wasserlage, weniger Widerstand und stabilere Hüftposition.',
    'Du arbeitest zuerst an Kopfposition, Körperspannung und Balance. Der volle Plan enthält progressive Technikdrills, kurze saubere Wiederholungen und einen ReTest am Ende.',
    '{"weeks":[{"title":"Woche 1-2","goal":"Wasserlage stabilisieren","sessions":[{"title":"Balance & Kopfposition","focus":"Körperlinie","blocks":[{"title":"Technik","sets":"6 x 50 m","intensity":"locker","notes":"Superman-Glide und ruhige Atmung"}],"drills":[{"name":"Superman-Glide","cue":"Blick nach unten, Hüfte hoch"}]}]},{"title":"Woche 3-4","goal":"DPS halten","sessions":[{"title":"Zuglänge sichern","focus":"Effizienz","blocks":[{"title":"Hauptserie","sets":"8 x 75 m","intensity":"moderat","notes":"maximal +1 Zug gegenüber sauberem Referenzlauf"}],"drills":[{"name":"Catch-up","cue":"Lang bleiben, nicht eilen"}]}]},{"title":"Woche 5-6","goal":"ReTest vorbereiten","sessions":[{"title":"Kontrolle","focus":"Technik unter Last","blocks":[{"title":"ReTest-Serie","sets":"4 x 100 m","intensity":"kontrolliert","notes":"gleiche Zugzahl, ruhiger Rhythmus"}],"drills":[{"name":"6-1-6","cue":"Rotation ohne Kopfheben"}]}]}]}'::jsonb,
    true
  ),
  (
    'vo2max-builder',
    'VO2max-Builder',
    'Aerobe Leistung',
    'Basephase',
    'Fortgeschritten bis Leistungsschwimmer',
    array['Sprint','OD','Becken'],
    8,
    'Ein Aufbauplan für höhere aerobe Leistung und bessere 200-m-Leistung ohne hektische Technik.',
    'Der Plan kombiniert kurze intensive Wiederholungen mit klaren Pausenvorgaben. Die Vorschau zeigt nur die Struktur, die Details werden später freigeschaltet.',
    '{"weeks":[{"title":"Woche 1-2","goal":"VO2-Reiz vorbereiten","sessions":[{"title":"Kurze Reize","focus":"saubere Intensität","blocks":[{"title":"Hauptserie","sets":"12 x 50 m","intensity":"zügig","notes":"lange Pause, Technik bleibt stabil"}],"drills":[{"name":"Fingertip Drag","cue":"lockere Rückführung"}]}]},{"title":"Woche 3-6","goal":"VO2 entwickeln","sessions":[{"title":"200-m-Pace","focus":"Belastbarkeit","blocks":[{"title":"Hauptserie","sets":"8 x 75 m","intensity":"hart kontrolliert","notes":"kein Technikabbruch"}],"drills":[{"name":"Sculling","cue":"früher Druck"}]}]},{"title":"Woche 7-8","goal":"ReTest","sessions":[{"title":"Taper & Kontrolle","focus":"Frische","blocks":[{"title":"Kontrolle","sets":"6 x 50 m","intensity":"Race Pace","notes":"vollständige Erholung"}],"drills":[{"name":"Single Arm","cue":"Druckphase spüren"}]}]}]}'::jsonb,
    true
  ),
  (
    'vlamax-senker',
    'VLamax Senker',
    'Laktat-Kontrolle',
    'Buildphase',
    'Ambitioniert bis Leistungsschwimmer',
    array['OD','MD','LD','Freiwasser'],
    6,
    'Ein Block für gleichmäßigere Pace, weniger Einbruch und bessere Kontrolle im zweiten Streckenteil.',
    'Der Fokus liegt auf kontrollierten Schwellenserien, ruhigem Rhythmus und ökonomischer Zuglänge unter Ermüdung.',
    '{"weeks":[{"title":"Woche 1-2","goal":"Pace stabilisieren","sessions":[{"title":"CSS-Einstieg","focus":"gleichmäßig schwimmen","blocks":[{"title":"Hauptserie","sets":"5 x 200 m","intensity":"CSS + 4 s","notes":"DPS beobachten"}],"drills":[{"name":"Zugzahl-Leiter","cue":"Zuglänge halten"}]}]},{"title":"Woche 3-4","goal":"Schwelle verlängern","sessions":[{"title":"Schwellenblock","focus":"Kontrolle","blocks":[{"title":"Hauptserie","sets":"3 x 400 m","intensity":"CSS + 2-4 s","notes":"konstante Splits"}],"drills":[{"name":"Paddle leicht","cue":"Druck ohne Kraftkampf"}]}]},{"title":"Woche 5-6","goal":"ReTest","sessions":[{"title":"Race Control","focus":"negative Split","blocks":[{"title":"Kontrolle","sets":"2 x 600 m","intensity":"moderat","notes":"zweite Hälfte stabil"}],"drills":[{"name":"Atmungsrhythmus","cue":"ruhig ausatmen"}]}]}]}'::jsonb,
    true
  ),
  (
    'tempohaerte',
    'Tempohärte',
    'Pace unter Belastung',
    'Peakphase',
    'Fortgeschritten bis Leistungsschwimmer',
    array['Sprint','OD','MD','Becken','Freiwasser'],
    6,
    'Ein Block für stabilere Frequenz, belastbare Zuglänge und bessere Pace-Kontrolle.',
    'Die Vorschau zeigt den Schwerpunkt: kurze Technikanker, längere Hauptserien und ein ReTest nach dem letzten Entlastungsblock.',
    '{"weeks":[{"title":"Woche 1-2","goal":"Technikanker setzen","sessions":[{"title":"Pace fühlen","focus":"Rhythmus","blocks":[{"title":"Hauptserie","sets":"10 x 100 m","intensity":"CSS + 5 s","notes":"gleichmäßige Splits"}],"drills":[{"name":"Tempo Trainer optional","cue":"ruhiger Takt"}]}]},{"title":"Woche 3-4","goal":"Belastbarkeit erhöhen","sessions":[{"title":"Lange Serie","focus":"DPS stabil","blocks":[{"title":"Hauptserie","sets":"6 x 200 m","intensity":"CSS + 3 s","notes":"Zugzahl nicht jagen"}],"drills":[{"name":"Catch-up Variation","cue":"Länge vor Frequenz"}]}]},{"title":"Woche 5-6","goal":"ReTest","sessions":[{"title":"Peak & Frische","focus":"Race Pace","blocks":[{"title":"Kontrolle","sets":"8 x 50 m","intensity":"zügig","notes":"viel Pause"}],"drills":[{"name":"Easy Speed","cue":"schnell, aber locker"}]}]}]}'::jsonb,
    true
  )
on conflict (slug) do nothing;
