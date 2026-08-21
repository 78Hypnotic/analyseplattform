-- Härtet Community-Nachrichten-Updates: Autoren dürfen nur ihren eigenen Text in der
-- eigenen Community ändern und keine Moderationsfelder oder Zuordnungen fälschen.

drop policy if exists "community_messages_update_author_or_moderator" on public.community_messages;

create policy "community_messages_update_author_or_moderator"
on public.community_messages
for update
to authenticated
using (
  (select public.can_access_community(community_id))
  and (
    author_id = (select auth.uid())
    or (select public.can_moderate_community(community_id))
  )
)
with check (
  (select public.can_access_community(community_id))
  and (
    author_id = (select auth.uid())
    or (select public.can_moderate_community(community_id))
  )
);

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

revoke all on function public.protect_community_message_update() from public, anon, authenticated;

drop trigger if exists community_messages_protect_update on public.community_messages;

create trigger community_messages_protect_update
before update on public.community_messages
for each row execute procedure public.protect_community_message_update();
