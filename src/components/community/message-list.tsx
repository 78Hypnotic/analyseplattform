import { ShieldOff } from "lucide-react";
import { removeCommunityMessage } from "@/app/community/actions";
import type { CommunityAttachment, CommunityMessage, CommunityRole } from "@/lib/community/communities";
import { cn } from "@/lib/utils";

export function MessageList({
  messages,
  communitySlug,
  channelSlug,
  canModerate,
  emptyText = "Noch keine Nachrichten. Schreib die erste.",
}: {
  messages: CommunityMessage[];
  communitySlug: string;
  channelSlug: string;
  canModerate: boolean;
  emptyText?: string;
}) {
  if (messages.length === 0) {
    return (
      <p className="surface mt-6 p-8 text-center text-sm text-[var(--muted)]">
        {emptyText}
      </p>
    );
  }

  return (
    <ol className="mt-6 grid gap-4">
      {messages.map((message) => (
        <li
          key={message.id}
          id={`m-${message.id}`}
          className={cn("surface p-4 sm:p-5", message.isOwn && "border-[var(--accent)]")}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">
              {message.author.name} · {formatRole(message.author.role)}
            </p>
            <time className="mono text-[10px] text-[var(--subtle)]" dateTime={message.createdAt}>
              {formatTimestamp(message.createdAt)}
            </time>
          </div>

          {message.status === "removed" ? (
            <p className="mt-3 flex items-center gap-2 text-sm italic text-[var(--subtle)]">
              <ShieldOff size={15} />
              Nachricht wurde entfernt{message.removedReason && canModerate ? `: ${message.removedReason}` : "."}
            </p>
          ) : (
            <>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">{message.content}</p>
              <AttachmentGrid attachments={message.attachments} />
              {canModerate || message.isOwn ? (
                <ModerateMessageForm
                  messageId={message.id}
                  communitySlug={communitySlug}
                  channelSlug={channelSlug}
                  canModerate={canModerate}
                />
              ) : null}
            </>
          )}
        </li>
      ))}
    </ol>
  );
}

function AttachmentGrid({ attachments }: { attachments: CommunityAttachment[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {attachments.map((attachment) => (
        <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-[var(--line)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attachment.url} alt={attachment.fileName} className="h-48 w-full object-cover" />
        </a>
      ))}
    </div>
  );
}

function ModerateMessageForm({
  messageId,
  communitySlug,
  channelSlug,
  canModerate,
}: {
  messageId: string;
  communitySlug: string;
  channelSlug: string;
  canModerate: boolean;
}) {
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-xs text-[var(--subtle)] hover:text-[var(--foreground)]">Entfernen</summary>
      <form action={removeCommunityMessage} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="messageId" value={messageId} />
        <input type="hidden" name="communitySlug" value={communitySlug} />
        <input type="hidden" name="channelSlug" value={channelSlug} />
        {canModerate ? <input name="reason" maxLength={300} placeholder="Grund (optional)" className="flex-1" /> : null}
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-lg border border-[var(--line)] px-3 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
        >
          Nachricht entfernen
        </button>
      </form>
    </details>
  );
}

function formatRole(role: CommunityRole) {
  if (role === "admin") return "Admin";
  if (role === "coach") return "Coach";
  return "Athlet";
}

export { AttachmentGrid, formatRole, formatTimestamp };

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
