import { ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/button";
import { getTrainingPlanCommunityHome } from "@/lib/training-plans/community";
import type { PlanLibrary } from "@/lib/training-plans/library";

export const dynamic = "force-dynamic";

export default async function CommunityOverviewPage() {
  const home = await getTrainingPlanCommunityHome();

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-5 py-10 pb-24">
        {home.kind === "signed-out" ? <LockedCommunity action={<ButtonLink href="/login" variant="primary">Anmelden</ButtonLink>} /> : null}
        {home.kind === "locked" ? <LockedCommunity /> : null}
        {home.kind === "community" ? <CommunityOverview libraries={[home.library]} /> : null}
        {home.kind === "admin" ? (
          home.libraries.length > 0 ? <CommunityOverview libraries={home.libraries} /> : <EmptyCommunity text="Noch keine Community vorhanden." />
        ) : null}
      </main>
    </>
  );
}

function CommunityOverview({ libraries }: { libraries: PlanLibrary[] }) {
  return (
    <>
      <header>
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Community</p>
        <h1 className="display-serif mt-3 text-5xl text-[var(--foreground)] sm:text-6xl">Deine Communities.</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          Austausch, Fragen und Updates aus deinen aktiven Gruppencoachings.
        </p>
      </header>
      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {libraries.map((library) => (
          <Link key={library.id} href={`/community/${library.slug}`} className="surface p-5 transition hover:border-[var(--accent)]">
            <MessageSquare size={20} className="text-[var(--accent)]" />
            <p className="mono mt-5 text-[10px] uppercase tracking-[0.16em] text-[var(--subtle)]">
              {library.coachName}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Community</h2>
            {library.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{library.description}</p> : null}
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
              Öffnen <ArrowRight size={15} />
            </span>
          </Link>
        ))}
      </section>
    </>
  );
}

function LockedCommunity({ action }: { action?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl py-14 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-[var(--panel)] text-[var(--accent)]">
        <MessageSquare size={22} />
      </span>
      <p className="mono mt-6 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Community</p>
      <h1 className="display-serif mt-4 text-5xl leading-tight text-[var(--foreground)] sm:text-6xl">Die Community gehört zum aktiven Gruppencoaching.</h1>
      <p className="mx-auto mt-5 max-w-xl leading-7 text-[var(--muted)]">
        Nach Ablauf des Abos ist die Gruppe vollständig gesperrt. Mit aktiver Mitgliedschaft kannst du Themen lesen, erstellen und beantworten.
      </p>
      {action ? <div className="mt-7">{action}</div> : null}
    </section>
  );
}

function EmptyCommunity({ text }: { text: string }) {
  return (
    <section className="surface mt-8 p-8">
      <MessageSquare size={22} className="text-[var(--accent)]" />
      <h2 className="mt-4 text-xl font-semibold">Community</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{text}</p>
    </section>
  );
}
