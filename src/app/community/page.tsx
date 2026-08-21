import { ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/button";
import { LockedCommunity } from "@/components/community/locked-community";
import { listAccessibleCommunities, type CommunitySummary } from "@/lib/community/communities";

export const dynamic = "force-dynamic";

export default async function CommunityOverviewPage() {
  const result = await listAccessibleCommunities();

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 pb-24">
      {result.kind === "signed-out" ? (
        <LockedCommunity
          headline="Communities sind für angemeldete Mitglieder."
          text="Melde dich an, um in der Plattform-Community und in deinen Gruppencoachings mitzuschreiben."
          action={<ButtonLink href="/login" variant="primary">Anmelden</ButtonLink>}
        />
      ) : (
        <>
          <header>
            <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Community</p>
            <h1 className="display-serif mt-3 text-5xl text-[var(--foreground)] sm:text-6xl">Deine Kanäle.</h1>
            <p className="mt-4 max-w-2xl text-[var(--muted)]">
              News, Vorstellungsrunde, Chat und Linksammlung – je Community in eigenen Kanälen.
            </p>
          </header>
          <ul className="mt-8 grid gap-3">
            {result.communities.map((community) => (
              <li key={community.id}>
                <CommunityLink community={community} />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function CommunityLink({ community }: { community: CommunitySummary }) {
  return (
    <Link
      href={community.defaultChannelSlug ? `/community/${community.slug}/${community.defaultChannelSlug}` : `/community/${community.slug}`}
      className="surface flex items-center gap-4 p-4 transition hover:border-[var(--accent)]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--panel-2)] text-[var(--accent)]">
        <MessageSquare size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="mono block text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">{community.eyebrow}</span>
        <span className="mt-1 block truncate text-lg font-semibold text-[var(--foreground)]">{community.title}</span>
        <span className="mt-1 block text-sm text-[var(--muted)]">
          {community.channelCount} Kanäle ·{" "}
          {community.messageCount === 0
            ? "noch keine Beiträge"
            : `${community.messageCount} Beiträge · zuletzt ${formatRelativeDate(community.lastActivityAt)}`}
        </span>
      </span>
      <ArrowRight size={16} className="shrink-0 text-[var(--accent)]" />
    </Link>
  );
}

function formatRelativeDate(value: string | null) {
  if (!value) return "–";
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
