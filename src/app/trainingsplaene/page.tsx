import { ArrowRight, BookOpen, LockKeyhole, MessageSquare, Plus, UsersRound } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/button";
import {
  getTrainingPlanLibraryHome,
  type PlanLibrary,
} from "@/lib/training-plans/library";
import type { TrainingPlanVersionSummary } from "@/lib/training-plans/types";

export const dynamic = "force-dynamic";

export default async function TrainingPlansPage({
  searchParams,
}: {
  searchParams?: Promise<{ library?: string | string[] }>;
}) {
  const params = await searchParams;
  const selectedLibraryId = Array.isArray(params?.library) ? params.library[0] : params?.library;
  const home = await getTrainingPlanLibraryHome(selectedLibraryId);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10 pb-24">
        {home.kind === "signed-out" ? <SignedOutLibrary /> : null}
        {home.kind === "locked" ? <LockedLibrary /> : null}
        {home.kind === "coach" ? (
          <LibraryView
            eyebrow="Meine Trainingsbibliothek"
            library={home.library}
            versions={home.versions}
            manage
          />
        ) : null}
        {home.kind === "member" ? (
          <LibraryView
            eyebrow={`Gruppencoaching · ${home.library.coachName}`}
            library={home.library}
            versions={home.versions}
            selectable
          />
        ) : null}
        {home.kind === "admin" ? (
          <AdminLibraries
            libraries={home.libraries}
            selectedLibrary={home.selectedLibrary}
            versions={home.versions}
          />
        ) : null}
      </main>
    </>
  );
}

function SignedOutLibrary() {
  return (
    <LockedSurface
      title="Trainingspläne für deinen nächsten Block."
      text="Melde dich an, um deine Freischaltungen und das Gruppencoaching zu prüfen."
      action={<ButtonLink href="/login" variant="primary">Anmelden</ButtonLink>}
    />
  );
}

function LockedLibrary() {
  return (
    <LockedSurface
      title="Die Bibliothek gehört zum Gruppencoaching."
      text="Mit einer aktiven Mitgliedschaft wählst du aus der von deinem Coach kuratierten Schwimmbibliothek deinen nächsten Plan aus."
    />
  );
}

function LockedSurface({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl py-14 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-[var(--panel)] text-[var(--accent)]">
        <LockKeyhole size={22} />
      </span>
      <p className="mono mt-6 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Trainingspläne</p>
      <h1 className="display-serif mt-4 text-5xl leading-tight text-[var(--foreground)] sm:text-6xl">{title}</h1>
      <p className="mx-auto mt-5 max-w-xl leading-7 text-[var(--muted)]">{text}</p>
      {action ? <div className="mt-7">{action}</div> : null}
    </section>
  );
}

function LibraryView({
  eyebrow,
  library,
  versions,
  manage = false,
  selectable = false,
}: {
  eyebrow: string;
  library: PlanLibrary | null;
  versions: TrainingPlanVersionSummary[];
  manage?: boolean;
  selectable?: boolean;
}) {
  return (
    <>
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p>
          <h1 className="display-serif mt-3 text-5xl text-[var(--foreground)] sm:text-6xl">
            {library?.name ?? "Deine Bibliothek entsteht mit dem ersten veröffentlichten Plan."}
          </h1>
          {library?.description ? <p className="mt-4 max-w-2xl text-[var(--muted)]">{library.description}</p> : null}
        </div>
        {manage ? (
          <ButtonLink href="/trainingsplaene/verwalten" variant="primary">
            <Plus size={16} />
            Pläne verwalten
          </ButtonLink>
        ) : library ? (
          <ButtonLink href="/community" variant="primary">
            <MessageSquare size={16} />
            Community öffnen
          </ButtonLink>
        ) : null}
      </header>
      {manage && library ? (
        <section className="surface mt-8 flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold">Community zur Bibliothek</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Aktive Gruppencoaching-Mitglieder können hier Themen starten und beantworten.</p>
          </div>
          <ButtonLink href="/community" variant="secondary">
            <MessageSquare size={16} /> Community öffnen
          </ButtonLink>
        </section>
      ) : null}
      <PlanGrid versions={versions} selectable={selectable} />
    </>
  );
}

function PlanGrid({
  versions,
  selectable = false,
}: {
  versions: TrainingPlanVersionSummary[];
  selectable?: boolean;
}) {
  if (versions.length === 0) {
    return (
      <section className="surface mt-8 p-8">
        <BookOpen size={22} className="text-[var(--accent)]" />
        <h2 className="mt-4 text-xl font-semibold">Noch keine veröffentlichten Pläne</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Veröffentlichte Schwimmpläne erscheinen hier automatisch.</p>
      </section>
    );
  }

  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {versions.map((version) => (
        <Link key={version.id} href={`/trainingsplaene/${version.id}`} className="surface p-5 transition hover:border-[var(--accent)]">
          <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">
            {version.weeks} Wochen · Version {version.version_number}
          </p>
          <h2 className="mt-3 text-xl font-semibold">{version.title}</h2>
          <p className="mt-2 text-sm text-[var(--accent)]">{version.focus}</p>
          {version.target_technique_axis ? (
            <p className="mono mt-3 text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">
              Technikfokus · {version.target_technique_axis}
            </p>
          ) : null}
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{version.summary}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
            {selectable ? "Ansehen & auswählen" : "Plan öffnen"} <ArrowRight size={15} />
          </span>
        </Link>
      ))}
    </section>
  );
}

function AdminLibraries({
  libraries,
  selectedLibrary,
  versions,
}: {
  libraries: PlanLibrary[];
  selectedLibrary: PlanLibrary | null;
  versions: TrainingPlanVersionSummary[];
}) {
  return (
    <>
      <header>
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Admin · Trainingspläne</p>
        <h1 className="display-serif mt-3 text-5xl text-[var(--foreground)] sm:text-6xl">Coach-Bibliotheken.</h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/trainingsplaene/verwalten" variant="primary">
            <BookOpen size={16} /> Pläne verwalten
          </ButtonLink>
          <ButtonLink href="/community" variant="secondary">
            <MessageSquare size={16} /> Communities öffnen
          </ButtonLink>
        </div>
      </header>
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {libraries.length === 0 ? (
          <div className="surface p-8 md:col-span-2">
            <p className="text-[var(--muted)]">Noch keine Coach-Bibliothek vorhanden.</p>
          </div>
        ) : libraries.map((library) => (
          <Link
            key={library.id}
            href={`/trainingsplaene?library=${library.id}`}
            className={selectedLibrary?.id === library.id
              ? "surface border-[var(--accent)] p-5"
              : "surface p-5 transition hover:border-[var(--accent)]"}
          >
            <UsersRound size={19} className="text-[var(--accent)]" />
            <h2 className="mt-3 text-xl font-semibold">{library.name}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Coach: {library.coachName}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
              Bibliothek ansehen <ArrowRight size={15} />
            </span>
          </Link>
        ))}
      </section>
      {selectedLibrary ? (
        <section className="mt-12 border-t border-[var(--line)] pt-8">
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            Bibliothek von {selectedLibrary.coachName}
          </p>
          <h2 className="display-serif mt-3 text-4xl text-[var(--foreground)]">{selectedLibrary.name}</h2>
          <ButtonLink href={`/community?libraryId=${selectedLibrary.id}`} variant="secondary" className="mt-5">
            <MessageSquare size={16} /> Community dieser Bibliothek öffnen
          </ButtonLink>
          <PlanGrid versions={versions} />
        </section>
      ) : null}
    </>
  );
}