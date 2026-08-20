create table if not exists public.community_attachments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.community_threads(id) on delete cascade,
  reply_id uuid references public.community_replies(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  storage_path text not null unique check (storage_path ~ '^[0-9a-f-]+/[0-9a-f-]+\.(jpg|jpeg|png|webp)$'),
  file_name text not null check (char_length(file_name) between 1 and 180),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now(),
  check (
    (thread_id is not null and reply_id is null)
    or (thread_id is null and reply_id is not null)
  )
);

create index if not exists community_attachments_thread_idx
on public.community_attachments (thread_id, created_at);

create index if not exists community_attachments_reply_idx
on public.community_attachments (reply_id, created_at);

alter table public.community_attachments enable row level security;

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
    left join public.community_threads as thread_attachment
      on thread_attachment.id = attachment.thread_id
    left join public.community_replies as reply_attachment
      on reply_attachment.id = attachment.reply_id
    left join public.community_threads as reply_thread
      on reply_thread.id = reply_attachment.thread_id
    where attachment.storage_path = target_storage_path
      and (
        (thread_attachment.id is not null and (select public.can_access_community_library(thread_attachment.library_id)))
        or (reply_thread.id is not null and (select public.can_access_community_library(reply_thread.library_id)))
      )
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
    left join public.community_threads as thread_attachment
      on thread_attachment.id = attachment.thread_id
    left join public.community_replies as reply_attachment
      on reply_attachment.id = attachment.reply_id
    left join public.community_threads as reply_thread
      on reply_thread.id = reply_attachment.thread_id
    where attachment.storage_path = target_storage_path
      and (
        (thread_attachment.id is not null and (select public.can_moderate_community_library(thread_attachment.library_id)))
        or (reply_thread.id is not null and (select public.can_moderate_community_library(reply_thread.library_id)))
      )
  );
$$;

revoke all on function public.can_access_community_attachment(text) from public, anon;
revoke all on function public.can_moderate_community_attachment(text) from public, anon;
grant execute on function public.can_access_community_attachment(text) to authenticated;
grant execute on function public.can_moderate_community_attachment(text) to authenticated;

drop policy if exists "community_attachments_select_entitled" on public.community_attachments;
drop policy if exists "community_attachments_insert_entitled" on public.community_attachments;
drop policy if exists "community_attachments_delete_moderator" on public.community_attachments;

create policy "community_attachments_select_entitled"
on public.community_attachments
for select
to authenticated
using ((select public.can_access_community_attachment(storage_path)));

create policy "community_attachments_insert_entitled"
on public.community_attachments
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and storage_path like (select auth.uid())::text || '/%'
  and (
    exists (
      select 1
      from public.community_threads
      where community_threads.id = community_attachments.thread_id
        and community_threads.status = 'published'
        and (select public.can_access_community_library(community_threads.library_id))
    )
    or exists (
      select 1
      from public.community_replies
      join public.community_threads
        on community_threads.id = community_replies.thread_id
      where community_replies.id = community_attachments.reply_id
        and community_replies.status = 'published'
        and community_threads.status = 'published'
        and (select public.can_access_community_library(community_threads.library_id))
    )
  )
);

create policy "community_attachments_delete_moderator"
on public.community_attachments
for delete
to authenticated
using (
  uploaded_by = (select auth.uid())
  or (select public.can_moderate_community_attachment(storage_path))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-attachments',
  'community-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "community_attachments_storage_select_entitled" on storage.objects;
drop policy if exists "community_attachments_storage_insert_own" on storage.objects;
drop policy if exists "community_attachments_storage_delete_owner_or_moderator" on storage.objects;

create policy "community_attachments_storage_select_entitled"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'community-attachments'
  and (select public.can_access_community_attachment(name))
);

create policy "community_attachments_storage_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "community_attachments_storage_delete_owner_or_moderator"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'community-attachments'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select public.can_moderate_community_attachment(name))
  )
);

grant select, insert, delete on public.community_attachments to authenticated;