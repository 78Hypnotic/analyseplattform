import { ShieldOff } from "lucide-react";
import { removeCommunityMessage, updateCommunityMessage } from "@/app/community/actions";
import type { CommunityMessage } from "@/lib/community/communities";
import { MAX_COMMUNITY_MESSAGE_LENGTH } from "@/lib/community/schema";
import { cn } from "@/lib/utils";
import { AttachmentGrid, formatRole, formatTimestamp } from "./message-list";

export function IntroList({
  messages,
  communitySlug,
  channelSlug,
  canModerate,
}: {
  messages: CommunityMessage[];
  communitySlug: string;
  channelSlug: string;
  canModerate: boolean;
}) {
  if (messages.length === 0) {
    return (
      <p className="surface mt-6 p-8 text-center text-sm text-[var(--muted)]">
        Noch stellt sich niemand vor. Mach den Anfang.
      </p>
    );
  }

  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2">
      {messages.map((message) => (
        <li
          key={message.id}
          id={`m-${message.id}`}
          className={cn("surface flex flex-col p-4 sm:p-5", message.isOwn && "border-[var(--accent)]")}
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-base font-semibold text-[var(--foreground)]">{message.author.name}</p>
            <span className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">
              {formatRole(message.author.role)}
            </span>
          </div>
          <time className="mono mt-1 text-[10px] text-[var(--subtle)]" dateTime={message.createdAt}>
            {formatTimestamp(message.createdAt)}
          </time>

          {message.status === "removed" ? (
            <p className="mt-3 flex items-center gap-2 text-sm italic text-[var(--subtle)]">
              <ShieldOff size={15} />
              Beitrag wurde entfernt{message.removedReason && canModerate ? `: ${message.removedReason}` : "."}
            </p>
          ) : (
            <>
              <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">{message.content}</p>
              <AttachmentGrid attachments={message.attachments} />
              {message.isOwn ? (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-[var(--subtle)] hover:text-[var(--foreground)]">
                    Beitrag bearbeiten
                  </summary>
                  <form action={updateCommunityMessage} className="mt-3 grid gap-2">
                    <input type="hidden" name="messageId" value={message.id} />
                    <input type="hidden" name="communitySlug" value={communitySlug} />
                    <input type="hidden" name="channelSlug" value={channelSlug} />
                    <textarea
                      name="content"
                      rows={4}
                      defaultValue={message.content}
                      minLength={1}
                      maxLength={MAX_COMMUNITY_MESSAGE_LENGTH}
                      required
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-lg border border-[var(--line)] px-3 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                      >
                        Speichern
                      </button>
                    </div>
                  </form>
                </details>
              ) : null}
              {canModerate ? (
                <form action={removeCommunityMessage} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="messageId" value={message.id} />
                  <input type="hidden" name="communitySlug" value={communitySlug} />
                  <input type="hidden" name="channelSlug" value={channelSlug} />
                  <input name="reason" maxLength={300} placeholder="Grund (optional)" className="flex-1" />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-lg border border-[var(--line)] px-3 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                  >
                    Entfernen
                  </button>
                </form>
              ) : null}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
