create table if not exists public.workout_library_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  discipline text not null check (discipline in ('swim', 'run', 'bike')),
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_library_items_owner_discipline_idx
on public.workout_library_items (owner_id, discipline, updated_at desc);

drop trigger if exists workout_library_items_set_updated_at on public.workout_library_items;
create trigger workout_library_items_set_updated_at
before update on public.workout_library_items
for each row execute procedure public.set_updated_at();

alter table public.workout_library_items enable row level security;

drop policy if exists "workout_library_items_select_own" on public.workout_library_items;
drop policy if exists "workout_library_items_insert_own" on public.workout_library_items;
drop policy if exists "workout_library_items_update_own" on public.workout_library_items;
drop policy if exists "workout_library_items_delete_own" on public.workout_library_items;

create policy "workout_library_items_select_own"
on public.workout_library_items
for select
to authenticated
using (
  owner_id = (select auth.uid())
  and ((select public.is_coach()) or (select public.is_admin()))
);

create policy "workout_library_items_insert_own"
on public.workout_library_items
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and ((select public.is_coach()) or (select public.is_admin()))
);

create policy "workout_library_items_update_own"
on public.workout_library_items
for update
to authenticated
using (
  owner_id = (select auth.uid())
  and ((select public.is_coach()) or (select public.is_admin()))
)
with check (
  owner_id = (select auth.uid())
  and ((select public.is_coach()) or (select public.is_admin()))
);

create policy "workout_library_items_delete_own"
on public.workout_library_items
for delete
to authenticated
using (
  owner_id = (select auth.uid())
  and ((select public.is_coach()) or (select public.is_admin()))
);

revoke all on table public.workout_library_items from anon;
grant select, insert, update, delete on table public.workout_library_items to authenticated;
