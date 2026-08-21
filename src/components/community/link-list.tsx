import { ExternalLink, ShieldOff } from "lucide-react";
import { createCommunityLink, removeCommunityLink } from "@/app/community/actions";
import type { CommunityLink } from "@/lib/community/communities";
import { MAX_COMMUNITY_LINK_URL_LENGTH } from "@/lib/community/schema";

export function LinkList({
  links,
  communitySlug,
  channelSlug,
  channelId,
  canModerate,
  canAddLink,
}: {
  links: CommunityLink[];
  communitySlug: string;
  channelSlug: string;
  channelId: string;
  canModerate: boolean;
  canAddLink: boolean;
}) {
  return (
    <>
      {links.length === 0 ? (
        <p className="surface mt-6 p-8 text-center text-sm text-[var(--muted)]">
          Noch keine Links gesammelt.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {links.map((link) => (
            <li key={link.id} id={`l-${link.id}`} className="surface p-4 sm:p-5">
              {link.status === "removed" ? (
                <p className="flex items-center gap-2 text-sm italic text-[var(--subtle)]">
                  <ShieldOff size={15} />
                  Link wurde entfernt{link.removedReason && canModerate ? `: ${link.removedReason}` : "."}
                </p>
              ) : (
                <>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-start gap-2 text-base font-semibold text-[var(--foreground)] transition hover:text-[var(--accent)]"
                  >
                    {link.title}
                    <ExternalLink size={14} className="mt-1 shrink-0 text-[var(--accent)]" />
                  </a>
                  <p className="mono mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">
                    {link.host} · {link.author.name} · {formatDate(link.createdAt)}
                  </p>
                  {link.description ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{link.description}</p>
                  ) : null}
                  {canModerate || link.isOwn ? (
                    <form action={removeCommunityLink} className="mt-3 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="linkId" value={link.id} />
                      <input type="hidden" name="communitySlug" value={communitySlug} />
                      <input type="hidden" name="channelSlug" value={channelSlug} />
                      {canModerate ? (
                        <input name="reason" maxLength={300} placeholder="Grund (optional)" className="flex-1" />
                      ) : null}
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-lg border border-[var(--line)] px-3 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                      >
                        Link entfernen
                      </button>
                    </form>
                  ) : null}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {canAddLink ? (
        <LinkForm channelId={channelId} communitySlug={communitySlug} channelSlug={channelSlug} />
      ) : (
        <p className="surface mt-6 p-4 text-sm text-[var(--muted)]">
          In diesem Kanal können nur Mitglieder der Community Links einstellen.
        </p>
      )}
    </>
  );
}

function LinkForm({
  channelId,
  communitySlug,
  channelSlug,
}: {
  channelId: string;
  communitySlug: string;
  channelSlug: string;
}) {
  return (
    <form action={createCommunityLink} className="surface mt-6 grid gap-3 p-4 sm:p-5">
      <input type="hidden" name="channelId" value={channelId} />
      <input type="hidden" name="communitySlug" value={communitySlug} />
      <input type="hidden" name="channelSlug" value={channelSlug} />
      <label className="grid gap-2 text-sm text-[var(--muted)]">
        Titel
        <input name="title" minLength={3} maxLength={120} placeholder="Worum geht es?" required />
      </label>
      <label className="grid gap-2 text-sm text-[var(--muted)]">
        URL
        <input
          name="url"
          type="url"
          inputMode="url"
          maxLength={MAX_COMMUNITY_LINK_URL_LENGTH}
          placeholder="https://…"
          required
        />
      </label>
      <label className="grid gap-2 text-sm text-[var(--muted)]">
        Beschreibung (optional)
        <textarea name="description" rows={2} maxLength={300} placeholder="Kurz einordnen …" />
      </label>
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
        >
          Link einstellen
        </button>
      </div>
    </form>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
