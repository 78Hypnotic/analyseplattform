-- Zieht eine Kanal-Ebene zwischen Community und Nachricht ein: News, Chat,
-- Vorstellungsrunde und Linksammlung. Bestandsnachrichten landen im Default-Kanal.

create table if not exists public.community_channels (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  slug text check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and slug not in ('threads', 'einstellungen')),
  name text not null check (char_length(name) between 2 and 60),
  description text not null default '' check (char_length(description) <= 300),
  type text not null default 'chat' check (type in ('chat', 'announcement', 'intro', 'links')),
  sort_order integer not null default 0 check (sort_order between 0 and 999),
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, slug),
  unique (id, community_id)
);

create unique index if not exists community_channels_default_idx
on public.community_channels (community_id)
where is_default;

create index if not exists community_channels_order_idx
on public.community_channels (community_id, sort_order, name);

create table if not exists public.community_links (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.community_channels(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  url text not null check (url ~* '^https?://' and char_length(url) between 8 and 2000),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 300),
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

create index if not exists community_links_channel_idx
on public.community_links (channel_id, created_at desc);

drop trigger if exists community_channels_set_updated_at on public.community_channels;
create trigger community_channels_set_updated_at
before update on public.community_channels
for each row execute procedure public.set_updated_at();

drop trigger if exists community_links_set_updated_at on public.community_links;
create trigger community_links_set_updated_at
before update on public.community_links
for each row execute procedure public.set_updated_at();

create or replace function public.resolve_community_channel_slug(
  target_community_id uuid,
  base_slug text,
  self_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  suffix integer := 2;
begin
  base := coalesce(nullif(public.slugify(base_slug), ''), 'kanal');
  candidate := base;

  -- 'threads' und 'einstellungen' sind eigene Routen unterhalb der Community.
  while candidate in ('threads', 'einstellungen') or exists (
    select 1
    from public.community_channels
    where community_id = target_community_id
      and slug = candidate
      and (self_id is null or id is distinct from self_id)
  ) loop
    candidate := base || '-' || suffix::text;
    suffix := suffix + 1;
  end loop;

  return candidate;
end;
$$;

create or replace function public.set_community_channel_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := public.resolve_community_channel_slug(new.community_id, new.name, new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists community_channels_set_slug on public.community_channels;
create trigger community_channels_set_slug
before insert on public.community_channels
for each row execute procedure public.set_community_channel_slug();

create or replace function public.ensure_default_community_channels(target_community_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.community_channels (community_id, slug, name, description, type, sort_order, is_default)
  select target_community_id, seed.slug, seed.name, seed.description, seed.type, seed.sort_order, seed.is_default
  from (values
    ('news', 'News', 'Ankündigungen und Neuigkeiten vom Team.', 'announcement', 0, false),
    ('allgemein', 'Allgemein', 'Offener Austausch für alle Mitglieder.', 'chat', 1, true),
    ('vorstellungsrunde', 'Vorstellungsrunde', 'Stell dich kurz vor: Disziplin, Ziele, Trainingsalltag.', 'intro', 2, false),
    ('links', 'Links', 'Gesammelte Artikel, Videos und Tools.', 'links', 3, false)
  ) as seed(slug, name, description, type, sort_order, is_default)
  on conflict (community_id, slug) do nothing;
$$;

select public.ensure_default_community_channels(id) from public.communities;

create or replace function public.sync_coach_community()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_community_id uuid;
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
    is_active = excluded.is_active
  returning id into target_community_id;

  perform public.ensure_default_community_channels(target_community_id);

  return new;
end;
$$;

alter table public.community_messages
add column if not exists channel_id uuid;

update public.community_messages as message
set channel_id = channel.id
from public.community_channels as channel
where channel.community_id = message.community_id
  and channel.is_default
  and message.channel_id is null;

delete from public.community_messages where channel_id is null;

alter table public.community_messages
alter column channel_id set not null;

alter table public.community_messages
drop constraint if exists community_messages_channel_fkey;

-- Verbundschlüssel: eine Nachricht kann nie in einen fremden Kanal zeigen.
alter table public.community_messages
add constraint community_messages_channel_fkey
foreign key (channel_id, community_id)
references public.community_channels (id, community_id)
on delete cascade;

create index if not exists community_messages_channel_stream_idx
on public.community_messages (channel_id, created_at desc);

alter table public.community_channels enable row level security;
alter table public.community_links enable row level security;

create or replace function public.can_access_channel(target_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_channels as channel
    where channel.id = target_channel_id
      and channel.is_active
      and (select public.can_access_community(channel.community_id))
  );
$$;

create or replace function public.can_moderate_channel(target_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_channels as channel
    where channel.id = target_channel_id
      and (select public.can_moderate_community(channel.community_id))
  );
$$;

create or replace function public.can_post_in_channel(target_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_channels as channel
    where channel.id = target_channel_id
      and channel.is_active
      and (select public.can_access_community(channel.community_id))
      and case channel.type
        when 'announcement' then (select public.can_moderate_community(channel.community_id))
        when 'links' then false
        when 'intro' then not exists (
          select 1
          from public.community_messages as message
          where message.channel_id = channel.id
            and message.author_id = (select auth.uid())
            and message.status = 'published'
        )
        else true
      end
  );
$$;

create or replace function public.can_contribute_link(target_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_channels as channel
    where channel.id = target_channel_id
      and channel.is_active
      and channel.type = 'links'
      and (select public.can_access_community(channel.community_id))
  );
$$;

create or replace function public.protect_community_channel_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.community_id is distinct from old.community_id then
    raise exception 'Die Community eines Kanals kann nicht geändert werden.' using errcode = '42501';
  end if;

  if new.type is distinct from old.type then
    raise exception 'Der Kanaltyp kann nach dem Anlegen nicht geändert werden.' using errcode = '42501';
  end if;

  if new.is_default is distinct from old.is_default then
    raise exception 'Der Standardkanal kann nicht gewechselt werden.' using errcode = '42501';
  end if;

  if old.is_default and not new.is_active then
    raise exception 'Der Standardkanal kann nicht deaktiviert werden.' using errcode = '42501';
  end if;

  new.created_at := old.created_at;
  new.created_by := old.created_by;

  return new;
end;
$$;

drop trigger if exists community_channels_protect_update on public.community_channels;
create trigger community_channels_protect_update
before update on public.community_channels
for each row execute procedure public.protect_community_channel_update();

create or replace function public.protect_community_link_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  is_moderator boolean := public.can_moderate_channel(old.channel_id);
begin
  if new.channel_id is distinct from old.channel_id then
    raise exception 'Der Kanal eines Links kann nicht geändert werden.' using errcode = '42501';
  end if;

  if new.created_by is distinct from old.created_by then
    raise exception 'Die Autorenschaft eines Links kann nicht geändert werden.' using errcode = '42501';
  end if;

  new.created_at := old.created_at;

  if not is_moderator and old.status = 'removed' and new.status <> 'removed' then
    raise exception 'Entfernte Links können nicht wiederhergestellt werden.' using errcode = '42501';
  end if;

  if new.status = 'removed' then
    new.removed_by := (select auth.uid());
    new.removed_at := coalesce(old.removed_at, now());
  else
    new.removed_by := null;
    new.removed_at := null;
    new.removed_reason := null;
  end if;

  return new;
end;
$$;

drop trigger if exists community_links_protect_update on public.community_links;
create trigger community_links_protect_update
before update on public.community_links
for each row execute procedure public.protect_community_link_update();

create or replace function public.protect_community_message_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  is_moderator boolean := public.can_moderate_community(old.community_id);
begin
  if new.community_id is distinct from old.community_id then
    raise exception 'Die Community einer Nachricht kann nicht geändert werden.' using errcode = '42501';
  end if;

  if new.channel_id is distinct from old.channel_id then
    raise exception 'Der Kanal einer Nachricht kann nicht geändert werden.' using errcode = '42501';
  end if;

  if new.author_id is distinct from old.author_id then
    raise exception 'Die Autorenschaft einer Nachricht kann nicht geändert werden.' using errcode = '42501';
  end if;

  if new.created_at is distinct from old.created_at then
    new.created_at := old.created_at;
  end if;

  if not is_moderator then
    if old.status = 'removed' and new.status <> 'removed' then
      raise exception 'Moderierte Nachrichten können nicht wiederhergestellt werden.' using errcode = '42501';
    end if;
  end if;

  if new.status = 'removed' then
    new.removed_by := (select auth.uid());
    new.removed_at := coalesce(old.removed_at, now());
  else
    new.removed_by := null;
    new.removed_at := null;
    new.removed_reason := null;
  end if;

  return new;
end;
$$;

create or replace view public.community_channel_activity
with (security_invoker = true)
as
select
  channel.id as channel_id,
  channel.community_id,
  coalesce(message_stats.entry_count, 0) + coalesce(link_stats.entry_count, 0) as entry_count,
  greatest(message_stats.last_activity_at, link_stats.last_activity_at) as last_activity_at
from public.community_channels as channel
left join lateral (
  select count(*) as entry_count, max(created_at) as last_activity_at
  from public.community_messages as message
  where message.channel_id = channel.id
    and message.status = 'published'
) as message_stats on true
left join lateral (
  select count(*) as entry_count, max(created_at) as last_activity_at
  from public.community_links as link
  where link.channel_id = channel.id
    and link.status = 'published'
) as link_stats on true;

revoke all on function public.resolve_community_channel_slug(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.set_community_channel_slug() from public, anon, authenticated;
revoke all on function public.ensure_default_community_channels(uuid) from public, anon, authenticated;
revoke all on function public.protect_community_channel_update() from public, anon, authenticated;
revoke all on function public.protect_community_link_update() from public, anon, authenticated;
revoke all on function public.can_access_channel(uuid) from public, anon;
revoke all on function public.can_moderate_channel(uuid) from public, anon;
revoke all on function public.can_post_in_channel(uuid) from public, anon;
revoke all on function public.can_contribute_link(uuid) from public, anon;
grant execute on function public.can_access_channel(uuid) to authenticated;
grant execute on function public.can_moderate_channel(uuid) to authenticated;
grant execute on function public.can_post_in_channel(uuid) to authenticated;
grant execute on function public.can_contribute_link(uuid) to authenticated;

drop policy if exists "community_channels_select_entitled" on public.community_channels;
drop policy if exists "community_channels_insert_moderator" on public.community_channels;
drop policy if exists "community_channels_update_moderator" on public.community_channels;

create policy "community_channels_select_entitled"
on public.community_channels
for select
to authenticated
using ((select public.can_access_community(community_id)));

create policy "community_channels_insert_moderator"
on public.community_channels
for insert
to authenticated
with check (
  (select public.can_moderate_community(community_id))
  and created_by = (select auth.uid())
  and not is_default
);

create policy "community_channels_update_moderator"
on public.community_channels
for update
to authenticated
using ((select public.can_moderate_community(community_id)))
with check ((select public.can_moderate_community(community_id)));

drop policy if exists "community_links_select_entitled" on public.community_links;
drop policy if exists "community_links_insert_entitled" on public.community_links;
drop policy if exists "community_links_update_author_or_moderator" on public.community_links;

create policy "community_links_select_entitled"
on public.community_links
for select
to authenticated
using ((select public.can_access_channel(channel_id)));

create policy "community_links_insert_entitled"
on public.community_links
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and status = 'published'
  and removed_at is null
  and removed_by is null
  and removed_reason is null
  and (select public.can_contribute_link(channel_id))
);

create policy "community_links_update_author_or_moderator"
on public.community_links
for update
to authenticated
using (
  (select public.can_access_channel(channel_id))
  and (
    created_by = (select auth.uid())
    or (select public.can_moderate_channel(channel_id))
  )
)
with check (
  (select public.can_access_channel(channel_id))
  and (
    created_by = (select auth.uid())
    or (select public.can_moderate_channel(channel_id))
  )
);

drop policy if exists "community_messages_insert_entitled" on public.community_messages;

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
  and (select public.can_post_in_channel(channel_id))
);

grant select, insert, update on public.community_channels to authenticated;
grant select, insert, update on public.community_links to authenticated;
grant select on public.community_channel_activity to authenticated;
