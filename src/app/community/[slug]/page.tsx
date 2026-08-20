import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/button";
import { LockedCommunity } from "@/components/community/locked-community";
import { MessageList } from "@/components/community/message-list";
import { getCommunityBySlug } from "@/lib/community/communities";
import { MAX_COMMUNITY_MESSAGE_LENGTH } from "@/lib/community/schema";
import { createCommunityMessage } from "../actions";

export const dynamic = "force-dynamic";

export default async function CommunityChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ before?: string }>;
}) {
  const [{ slug }, { before }] = await Promise.all([params, searchParams]);
  const result = await getCommunityBySlug(slug, { before });

  if (result.kind === "signed-out") {
    return (
      <main className="mx-auto w-full max-w-4xl px-5 py-10 pb-24">
        <LockedCommunity
          headline="Dieser Chat ist für angemeldete Mitglieder."
          text="Melde dich an, um den Verlauf zu lesen und mitzuschreiben."
          action={<ButtonLink href="/login" variant="primary">Anmelden</ButtonLink>}
        />
      </main>
    );
  }

  if (result.kind === "not-found") notFound();

  const { community, canModerate, messages, olderCursor } = result.channel;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 pb-24">
      <Link href="/community" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]">
        <ArrowLeft size={15} /> Alle Communities
      </Link>

      <header className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{community.eyebrow}</p>
          <h1 className="display-serif mt-2 text-4xl text-[var(--foreground)] sm:text-5xl">{community.title}</h1>
          {community.description ? <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">{community.description}</p> : null}
        </div>
        {canModerate ? (
          <span className="inline-flex items-center gap-2 self-start rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--muted)] sm:self-auto">
            <ShieldCheck size={16} className="text-[var(--accent)]" /> Moderation aktiv
          </span>
        ) : null}
      </header>

      {olderCursor ? (
        <div className="mt-6 text-center">
          <ButtonLink href={`/community/${community.slug}?before=${encodeURIComponent(olderCursor)}`}>
            Ältere Nachrichten
          </ButtonLink>
        </div>
      ) : null}

      <MessageList messages={messages} communitySlug={community.slug} canModerate={canModerate} />

      <form action={createCommunityMessage} className="surface mt-6 grid gap-3 p-4 sm:p-5">
        <input type="hidden" name="communityId" value={community.id} />
        <input type="hidden" name="communitySlug" value={community.slug} />
        <textarea name="content" rows={3} minLength={1} maxLength={MAX_COMMUNITY_MESSAGE_LENGTH} placeholder="Nachricht schreiben …" required />
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
    </main>
  );
}
