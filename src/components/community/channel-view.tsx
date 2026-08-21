import { Link2, Megaphone, MessagesSquare, Users } from "lucide-react";
import { createCommunityMessage } from "@/app/community/actions";
import { ButtonLink } from "@/components/button";
import { IntroList } from "@/components/community/intro-list";
import { LinkList } from "@/components/community/link-list";
import { MessageList } from "@/components/community/message-list";
import type { CommunityChannelType, CommunityChannelView } from "@/lib/community/communities";
import { MAX_COMMUNITY_MESSAGE_LENGTH } from "@/lib/community/schema";

export function ChannelView({ view }: { view: CommunityChannelView }) {
  const { community, channel, canModerate, canPost, canAddLink, messages, links, olderCursor } = view;

  return (
    <section>
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[var(--foreground)]">
            <ChannelIcon type={channel.type} />
            {channel.name}
          </h2>
          {channel.description ? <p className="mt-2 text-sm text-[var(--muted)]">{channel.description}</p> : null}
        </div>
        <span className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">
          {channelTypeLabel(channel.type)}
        </span>
      </header>

      {channel.type === "links" ? (
        <LinkList
          links={links}
          communitySlug={community.slug}
          channelSlug={channel.slug}
          channelId={channel.id}
          canModerate={canModerate}
          canAddLink={canAddLink}
        />
      ) : (
        <>
          {olderCursor ? (
            <div className="mt-6 text-center">
              <ButtonLink
                href={`/community/${community.slug}/${channel.slug}?before=${encodeURIComponent(olderCursor)}`}
              >
                Ältere Beiträge
              </ButtonLink>
            </div>
          ) : null}

          {channel.type === "intro" ? (
            <IntroList
              messages={messages}
              communitySlug={community.slug}
              channelSlug={channel.slug}
              canModerate={canModerate}
            />
          ) : (
            <MessageList
              messages={messages}
              communitySlug={community.slug}
              channelSlug={channel.slug}
              canModerate={canModerate}
              emptyText={
                channel.type === "announcement"
                  ? "Noch keine Ankündigungen."
                  : "Noch keine Nachrichten. Schreib die erste."
              }
            />
          )}

          {canPost ? (
            <form action={createCommunityMessage} className="surface mt-6 grid gap-3 p-4 sm:p-5">
              <input type="hidden" name="communityId" value={community.id} />
              <input type="hidden" name="channelId" value={channel.id} />
              <input type="hidden" name="communitySlug" value={community.slug} />
              <input type="hidden" name="channelSlug" value={channel.slug} />
              <textarea
                name="content"
                rows={3}
                minLength={1}
                maxLength={MAX_COMMUNITY_MESSAGE_LENGTH}
                placeholder={composerPlaceholder(channel.type)}
                required
              />
              <label className="grid gap-2 text-sm text-[var(--muted)]">
                Bilder anhängen
                <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
                <span className="text-xs text-[var(--subtle)]">Bis zu 4 Bilder, JPG, PNG oder WebP, jeweils maximal 5 MB.</span>
              </label>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
                >
                  Senden
                </button>
              </div>
            </form>
          ) : (
            <p className="surface mt-6 p-4 text-sm text-[var(--muted)]">{lockedHint(channel.type)}</p>
          )}
        </>
      )}
    </section>
  );
}

function ChannelIcon({ type }: { type: CommunityChannelType }) {
  const props = { size: 18, className: "shrink-0 text-[var(--accent)]" } as const;
  if (type === "announcement") return <Megaphone {...props} />;
  if (type === "intro") return <Users {...props} />;
  if (type === "links") return <Link2 {...props} />;
  return <MessagesSquare {...props} />;
}

function channelTypeLabel(type: CommunityChannelType) {
  if (type === "announcement") return "Ankündigungen";
  if (type === "intro") return "Vorstellungsrunde";
  if (type === "links") return "Linksammlung";
  return "Chat";
}

function composerPlaceholder(type: CommunityChannelType) {
  if (type === "announcement") return "Ankündigung schreiben …";
  if (type === "intro") return "Stell dich kurz vor: Disziplin, Ziele, Trainingsalltag …";
  return "Nachricht schreiben …";
}

function lockedHint(type: CommunityChannelType) {
  if (type === "announcement") return "In diesem Kanal schreiben nur Coaches und Admins.";
  if (type === "intro") return "Du hast dich hier bereits vorgestellt. Deinen Beitrag kannst du oben bearbeiten.";
  return "Du kannst in diesem Kanal derzeit nicht schreiben.";
}
