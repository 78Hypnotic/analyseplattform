import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/button";
import { ChannelNav } from "@/components/community/channel-nav";
import { LockedCommunity } from "@/components/community/locked-community";
import { getCommunityNavigation } from "@/lib/community/communities";

export const dynamic = "force-dynamic";

export default async function CommunityLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getCommunityNavigation(slug);

  if (result.kind === "signed-out") {
    return (
      <main className="mx-auto w-full max-w-4xl px-5 py-10 pb-24">
        <LockedCommunity
          headline="Dieser Bereich ist für angemeldete Mitglieder."
          text="Melde dich an, um die Kanäle zu lesen und mitzuschreiben."
          action={<ButtonLink href="/login" variant="primary">Anmelden</ButtonLink>}
        />
      </main>
    );
  }

  if (result.kind === "not-found") notFound();

  const { community, channels, canModerate } = result.navigation;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 pb-24">
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

      <div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <ChannelNav communitySlug={community.slug} channels={channels} canModerate={canModerate} />
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
