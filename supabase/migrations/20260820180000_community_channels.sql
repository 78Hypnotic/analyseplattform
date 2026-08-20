create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('platform', 'coach')),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 3 and 120),
  description text not null default '' check (char_length(description) <= 1200),
  coach_id uuid references auth.users(id) on delete cascade,
  library_id uuid unique references public.coach_plan_libraries(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (kind = 'platform' and coach_id is null and library_id is null)
    or (kind = 'coach' and coach_id is not null and library_id is not null)
  )
);

create unique index if not exists communities_single_platform_idx
on public.communities (kind)
where kind = 'platform';

create unique index if not exists communities_coach_idx
on public.communities (coach_id)
where coach_id is not null;

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  content text not null check (char_length(content) between 1 and 4000),
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

create index if not exists community_messages_stream_idx
on public.community_messages (community_id, created_at desc);

drop trigger if exists communities_set_updated_at on public.communities;
create trigger communities_set_updated_at
before update on public.communities
for each row execute procedure public.set_updated_at();

drop trigger if exists community_messages_set_updated_at on public.community_messages;
create trigger community_messages_set_updated_at
before update on public.community_messages
for each row execute procedure public.set_updated_at();

alter table public.communities enable row level security;
alter table public.community_messages enable row level security;

create or replace function public.resolve_community_slug(base_slug text, self_library_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  candidate text;
  suffix integer := 2;
begin
  candidate := coalesce(nullif(public.slugify(base_slug), ''), 'community');

  while exists (
    select 1
    from public.communities
    where slug = candidate
      and (self_library_id is null or library_id is distinct from self_library_id)
  ) loop
    candidate := coalesce(nullif(public.slugify(base_slug), ''), 'community') || '-' || suffix::text;
    suffix := suffix + 1;
  end loop;

  return candidate;
end;
$$;

insert into public.communities (kind, slug, name, description)
values (
  'platform',
  'plattform',
  'Plattform-Community',
  'Offener Austausch für alle Athletinnen und Athleten der Analyseplattform.'
)
on conflict do nothing;

insert into public.communities (kind, slug, name, description, coach_id, library_id, is_active)
select
  'coach',
  public.resolve_community_slug(library.slug, library.id),
  'Gruppencoaching',
  library.description,
  library.coach_id,
  library.id,
  library.is_active
from public.coach_plan_libraries as library
on conflict (library_id) do nothing;

create or replace function public.sync_coach_community()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.communities (kind, slug, name, description, coach_id, library_id, is_active)
  values (
    'coach',
    public.resolve_community_slug(new.slug, new.id),
    'Gruppencoaching',
    new.description,
    new.coach_id,
    new.id,
    new.is_active
  )
  on conflict (library_id) do update
  set
    slug = excluded.slug,
    description = excluded.description,
    coach_id = excluded.coach_id,
    is_active = excluded.is_active;

  return new;
end;
$$;

drop trigger if exists coach_plan_libraries_sync_community on public.coach_plan_libraries;
create trigger coach_plan_libraries_sync_community
after insert or update of slug, coach_id, description, is_active on public.coach_plan_libraries
for each row execute procedure public.sync_coach_community();

-- Thread- und Reply-IDs werden als Message-IDs übernommen, damit Attachments und Alt-Links zuordenbar bleiben.
insert into public.community_messages (
  id, community_id, author_id, content, status, removed_at, removed_by, removed_reason, created_at, updated_at
)
select
  thread.id,
  community.id,
  thread.author_id,
  thread.title || E'\n\n' || thread.content,
  thread.status,
  thread.removed_at,
  thread.removed_by,
  thread.removed_reason,
  thread.created_at,
  thread.updated_at
from public.community_threads as thread
join public.communities as community on community.library_id = thread.library_id
on conflict (id) do nothing;

insert into public.community_messages (
  id, community_id, author_id, content, status, removed_at, removed_by, removed_reason, created_at, updated_at
)
select
  reply.id,
  community.id,
  reply.author_id,
  reply.content,
  reply.status,
  reply.removed_at,
  reply.removed_by,
  reply.removed_reason,
  reply.created_at,
  reply.updated_at
from public.community_replies as reply
join public.community_threads as thread on thread.id = reply.thread_id
join public.communities as community on community.library_id = thread.library_id
on conflict (id) do nothing;

alter table public.community_attachments
add column if not exists message_id uuid references public.community_messages(id) on delete cascade;

update public.community_attachments
set message_id = coalesce(thread_id, reply_id)
where message_id is null
  and coalesce(thread_id, reply_id) in (select id from public.community_messages);

delete from public.community_attachments
where message_id is null;

alter table public.community_attachments
drop column if exists thread_id,
drop column if exists reply_id;

alter table public.community_attachments
alter column message_id set not null;

drop index if exists public.community_attachments_thread_idx;
drop index if exists public.community_attachments_reply_idx;

create index if not exists community_attachments_message_idx
on public.community_attachments (message_id, created_at);

create or replace function public.can_access_community(target_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.communities as community
    where community.id = target_community_id
      and community.is_active
      and (select auth.uid()) is not null
      and (
        community.kind = 'platform'
        or (select public.is_admin())
        or community.coach_id = (select auth.uid())
        or (select public.has_active_group_coaching_membership(community.library_id))
        or exists (
          select 1
          from public.coach_athletes
          where coach_athletes.coach_id = community.coach_id
            and coach_athletes.athlete_id = (select auth.uid())
        )
      )
  );
$$;

create or replace function public.can_moderate_community(target_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.communities as community
    where community.id = target_community_id
      and (
        (select public.is_admin())
        or (community.kind = 'coach' and community.coach_id = (select auth.uid()))
      )
  );
$$;

revoke all on function public.resolve_community_slug(text, uuid) from public, anon, authenticated;
revoke all on function public.sync_coach_community() from public, anon, authenticated;
revoke all on function public.can_access_community(uuid) from public, anon;
revoke all on function public.can_moderate_community(uuid) from public, anon;
grant execute on function public.can_access_community(uuid) to authenticated;
grant execute on function public.can_moderate_community(uuid) to authenticated;

drop policy if exists "communities_select_entitled" on public.communities;
drop policy if exists "communities_write_admin" on public.communities;

create policy "communities_select_entitled"
on public.communities
for select
to authenticated
using ((select public.can_access_community(id)));

create policy "communities_write_admin"
on public.communities
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "community_messages_select_entitled" on public.community_messages;
drop policy if exists "community_messages_insert_entitled" on public.community_messages;
drop policy if exists "community_messages_update_author_or_moderator" on public.community_messages;

create policy "community_messages_select_entitled"
on public.community_messages
for select
to authenticated
using ((select public.can_access_community(community_id)));

create policy "community_messages_insert_entitled"
on public.community_messages
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and status = 'published'
  and removed_at is null
  and removed_by is null
  and removed_reason is null
  and (select public.can_access_community(community_id))
);

create policy "community_messages_update_author_or_moderator"
on public.community_messages
for update
to authenticated
using (
  author_id = (select auth.uid())
  or (select public.can_moderate_community(community_id))
)
with check (
  author_id = (select auth.uid())
  or (select public.can_moderate_community(community_id))
);

create or replace function public.can_access_community_attachment(target_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_attachments as attachment
    join public.community_messages as message on message.id = attachment.message_id
    where attachment.storage_path = target_storage_path
      and (select public.can_access_community(message.community_id))
  );
$$;

create or replace function public.can_moderate_community_attachment(target_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_attachments as attachment
    join public.community_messages as message on message.id = attachment.message_id
    where attachment.storage_path = target_storage_path
      and (select public.can_moderate_community(message.community_id))
  );
$$;

drop policy if exists "community_attachments_insert_entitled" on public.community_attachments;

create policy "community_attachments_insert_entitled"
on public.community_attachments
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and storage_path like (select auth.uid())::text || '/%'
  and exists (
    select 1
    from public.community_messages
    where community_messages.id = community_attachments.message_id
      and community_messages.status = 'published'
      and (select public.can_access_community(community_messages.community_id))
  )
);

-- Alt-Tabellen bleiben vorerst lesbar, werden aber nicht mehr beschrieben.
drop policy if exists "community_threads_insert_entitled" on public.community_threads;
drop policy if exists "community_threads_update_moderator" on public.community_threads;
drop policy if exists "community_threads_delete_admin" on public.community_threads;
drop policy if exists "community_replies_insert_entitled" on public.community_replies;
drop policy if exists "community_replies_update_moderator" on public.community_replies;
drop policy if exists "community_replies_delete_admin" on public.community_replies;

revoke insert, update, delete on public.community_threads from authenticated;
revoke insert, update, delete on public.community_replies from authenticated;

grant select, insert, update, delete on public.communities to authenticated;
grant select, insert, update on public.community_messages to authenticated;
