alter table public.workout_library_items
add column if not exists is_favorite boolean not null default false,
add column if not exists last_used_at timestamptz;

create index if not exists workout_library_items_owner_favorite_recent_idx
on public.workout_library_items (owner_id, is_favorite desc, last_used_at desc nulls last, updated_at desc);