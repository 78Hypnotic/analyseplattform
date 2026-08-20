import { ArrowLeft, MessageSquare, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { getCommunityThread, type CommunityAttachment, type CommunityReply, type CommunityThreadDetail } from "@/lib/training-plans/community";
import { createCommunityReply, removeCommunityReply, removeCommunityThread } from "../actions";

export const dynamic = "force-dynamic";

export default async function CommunityThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const thread = await getCommunityThread(threadId);
  if (!thread) notFound();

  return (
    <>
      <AppHeader hideTrainingPlansLink />
      <main className="mx-auto w-full max-w-4xl px-5 py-10 pb-24">
        <Link href="/trainingsplaene/community" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline">
          <ArrowLeft size={15} /> Zur Community
        </Link>
        <ThreadPost thread={thread} />
        <section className="mt-8 grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Antworten</h2>
            <span className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
              <MessageSquare size={15} className="text-[var(--accent)]" /> {thread.replyCount}
            </span>
          </div>
          {thread.replies.length === 0 ? (
            <div className="surface p-5 text-sm text-[var(--muted)]">Noch keine Antworten.</div>
          ) : thread.replies.map((reply) => (
            <ReplyPost key={reply.id} reply={reply} threadId={thread.id} canModerate={thread.canModerate} />
          ))}
        </section>
        {thread.status === "published" ? <ReplyForm threadId={thread.id} /> : null}
      </main>
    </>
  );
}

function ThreadPost({ thread }: { thread: CommunityThreadDetail }) {
  return (
    <article className="surface mt-8 p-5 sm:p-7">
      <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
        {thread.author.name} · {formatRole(thread.author.role)} · {formatDate(thread.createdAt)}
      </p>
      <h1 className="display-serif mt-3 text-5xl leading-tight text-[var(--foreground)] sm:text-6xl">{thread.title}</h1>
      {thread.status === "removed" ? (
        <RemovedNotice reason={thread.removedReason} />
      ) : (
        <>
          <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-[var(--muted)]">{thread.content}</p>
          <AttachmentGrid attachments={thread.attachments} />
        </>
      )}
      {thread.canModerate && thread.status === "published" ? <ModerateThreadForm threadId={thread.id} /> : null}
    </article>
  );
}

function ReplyPost({ reply, threadId, canModerate }: { reply: CommunityReply; threadId: string; canModerate: boolean }) {
  return (
    <article className="surface p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">
          {reply.author.name} · {formatRole(reply.author.role)} · {formatDate(reply.createdAt)}
        </p>
        {canModerate && reply.status === "published" ? <ModerateReplyForm threadId={threadId} replyId={reply.id} /> : null}
      </div>
      {reply.status === "removed" ? (
        <RemovedNotice reason={reply.removedReason} />
      ) : (
        <>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{reply.content}</p>
          <AttachmentGrid attachments={reply.attachments} compact />
        </>
      )}
    </article>
  );
}

function ReplyForm({ threadId }: { threadId: string }) {
  return (
    <section className="surface mt-8 p-5 sm:p-7">
      <h2 className="text-xl font-semibold">Antwort schreiben</h2>
      <form action={createCommunityReply} className="mt-4 grid gap-3">
        <input type="hidden" name="threadId" value={threadId} />
        <textarea name="content" minLength={2} maxLength={2000} rows={5} placeholder="Deine Antwort" required />
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          Bilder anhängen
          <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
          <span className="text-xs text-[var(--subtle)]">Bis zu 4 Bilder, JPG, PNG oder WebP, jeweils maximal 5 MB.</span>
        </label>
        <div className="flex justify-end">
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]" type="submit">
            Antwort veröffentlichen
          </button>
        </div>
      </form>
    </section>
  );
}

function AttachmentGrid({ attachments, compact = false }: { attachments: CommunityAttachment[]; compact?: boolean }) {
  if (attachments.length === 0) return null;

  return (
    <div className={compact ? "mt-4 grid gap-3 sm:grid-cols-2" : "mt-6 grid gap-3 sm:grid-cols-2"}>
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          className="group block overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel-2)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
          <span className="block truncate px-3 py-2 text-xs text-[var(--muted)]">{attachment.fileName}</span>
        </a>
      ))}
    </div>
  );
}

function ModerateThreadForm({ threadId }: { threadId: string }) {
  return (
    <form action={removeCommunityThread} className="mt-6 flex flex-col gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-4">
      <input type="hidden" name="threadId" value={threadId} />
      <label className="text-sm font-medium" htmlFor="thread-removal-reason">Moderationsgrund</label>
      <input id="thread-removal-reason" name="reason" maxLength={300} placeholder="Optional" />
      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]" type="submit">
        <ShieldCheck size={15} /> Beitrag entfernen
      </button>
    </form>
  );
}

function ModerateReplyForm({ threadId, replyId }: { threadId: string; replyId: string }) {
  return (
    <form action={removeCommunityReply} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="replyId" value={replyId} />
      <input name="reason" maxLength={300} placeholder="Grund" className="h-9 py-2 text-sm" />
      <button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--line)] px-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]" type="submit">
        Entfernen
      </button>
    </form>
  );
}

function RemovedNotice({ reason }: { reason: string | null }) {
  return (
    <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-4 text-sm text-[var(--muted)]">
      Dieser Beitrag wurde entfernt.{reason ? ` Grund: ${reason}` : ""}
    </div>
  );
}

function formatRole(role: string) {
  if (role === "admin") return "Admin";
  if (role === "coach") return "Coach";
  return "Athlet";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}