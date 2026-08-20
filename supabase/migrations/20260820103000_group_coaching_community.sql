create table if not exists public.community_threads (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.coach_plan_libraries(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 3 and 120),
  content text not null check (char_length(content) between 2 and 3000),
  status text not null default 'published' check (status in ('published', 'removed')),
  removed_at timestamptz,
  removed_by uuid references auth.users(id) on delete set null,
  removed_reason text check (removed_reason is null or char_length(removed_reason) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'removed' and removed_at is not null)
    or (status = 'published' and removed_at is null and removed_by is null and removed_reason is null)
  )
);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  content text not null check (char_length(content) between 2 and 2000),
  status text not null default 'published' check (status in ('published', 'removed')),
  removed_at timestamptz,
  removed_by uuid references auth.users(id) on delete set null,
  removed_reason text check (removed_reason is null or char_length(removed_reason) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'removed' and removed_at is not null)
    or (status = 'published' and removed_at is null and removed_by is null and removed_reason is null)
  )
);

create index if not exists community_threads_library_activity_idx
on public.community_threads (library_id, status, created_at desc);

create index if not exists community_replies_thread_activity_idx
on public.community_replies (thread_id, status, created_at asc);

drop trigger if exists community_threads_set_updated_at on public.community_threads;
create trigger community_threads_set_updated_at
before update on public.community_threads
for each row execute procedure public.set_updated_at();

drop trigger if exists community_replies_set_updated_at on public.community_replies;
create trigger community_replies_set_updated_at
before update on public.community_replies
for each row execute procedure public.set_updated_at();

alter table public.community_threads enable row level security;
alter table public.community_replies enable row level security;

create or replace function public.can_access_community_library(target_library_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (select public.is_admin())
    or (select public.has_active_group_coaching_membership(target_library_id))
    or exists (
      select 1
      from public.coach_plan_libraries
      where id = target_library_id
        and coach_id = (select auth.uid())
    );
$$;

create or replace function public.can_moderate_community_library(target_library_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (select public.is_admin())
    or exists (
      select 1
      from public.coach_plan_libraries
      where id = target_library_id
        and coach_id = (select auth.uid())
    );
$$;

revoke all on function public.can_access_community_library(uuid) from public, anon;
revoke all on function public.can_moderate_community_library(uuid) from public, anon;
grant execute on function public.can_access_community_library(uuid) to authenticated;
grant execute on function public.can_moderate_community_library(uuid) to authenticated;

drop policy if exists "community_threads_select_entitled" on public.community_threads;
drop policy if exists "community_threads_insert_entitled" on public.community_threads;
drop policy if exists "community_threads_update_moderator" on public.community_threads;
drop policy if exists "community_threads_delete_admin" on public.community_threads;
drop policy if exists "community_replies_select_entitled" on public.community_replies;
drop policy if exists "community_replies_insert_entitled" on public.community_replies;
drop policy if exists "community_replies_update_moderator" on public.community_replies;
drop policy if exists "community_replies_delete_admin" on public.community_replies;

create policy "community_threads_select_entitled"
on public.community_threads
for select
to authenticated
using ((select public.can_access_community_library(library_id)));

create policy "community_threads_insert_entitled"
on public.community_threads
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and status = 'published'
  and removed_at is null
  and removed_by is null
  and removed_reason is null
  and (select public.can_access_community_library(library_id))
);

create policy "community_threads_update_moderator"
on public.community_threads
for update
to authenticated
using ((select public.can_moderate_community_library(library_id)))
with check ((select public.can_moderate_community_library(library_id)));

create policy "community_threads_delete_admin"
on public.community_threads
for delete
to authenticated
using ((select public.is_admin()));

create policy "community_replies_select_entitled"
on public.community_replies
for select
to authenticated
using (
  exists (
    select 1
    from public.community_threads
    where community_threads.id = community_replies.thread_id
      and (select public.can_access_community_library(community_threads.library_id))
  )
);

create policy "community_replies_insert_entitled"
on public.community_replies
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and status = 'published'
  and removed_at is null
  and removed_by is null
  and removed_reason is null
  and exists (
    select 1
    from public.community_threads
    where community_threads.id = community_replies.thread_id
      and community_threads.status = 'published'
      and (select public.can_access_community_library(community_threads.library_id))
  )
);

create policy "community_replies_update_moderator"
on public.community_replies
for update
to authenticated
using (
  exists (
    select 1
    from public.community_threads
    where community_threads.id = community_replies.thread_id
      and (select public.can_moderate_community_library(community_threads.library_id))
  )
)
with check (
  exists (
    select 1
    from public.community_threads
    where community_threads.id = community_replies.thread_id
      and (select public.can_moderate_community_library(community_threads.library_id))
  )
);

create policy "community_replies_delete_admin"
on public.community_replies
for delete
to authenticated
using ((select public.is_admin()));

grant select, insert, update, delete on public.community_threads to authenticated;
grant select, insert, update, delete on public.community_replies to authenticated;