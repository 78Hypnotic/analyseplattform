import { MessageSquare, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/button";
import { getTrainingPlanCommunityHome, type CommunityThreadSummary } from "@/lib/training-plans/community";
import { createCommunityThread } from "./actions";

export const dynamic = "force-dynamic";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ libraryId?: string }>;
}) {
  const { libraryId } = await searchParams;
  const home = await getTrainingPlanCommunityHome(libraryId);

  return (
    <>
      <AppHeader hideTrainingPlansLink />
      <main className="mx-auto w-full max-w-6xl px-5 py-10 pb-24">
        {home.kind === "signed-out" ? <LockedCommunity action={<ButtonLink href="/login" variant="primary">Anmelden</ButtonLink>} /> : null}
        {home.kind === "locked" ? <LockedCommunity /> : null}
        {home.kind === "community" ? (
          <CommunitySurface
            eyebrow={home.role === "coach" ? "Coach-Community" : `Gruppencoaching · ${home.library.coachName}`}
            libraryId={home.library.id}
            title={home.library.name}
            description={home.library.description}
            threads={home.threads}
            canModerate={home.canModerate}
          />
        ) : null}
        {home.kind === "admin" ? (
          <>
            <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Admin · Community</p>
                <h1 className="display-serif mt-3 text-5xl text-[var(--foreground)] sm:text-6xl">Gruppencoaching-Communities.</h1>
              </div>
            </header>
            {home.selectedLibrary ? (
              <CommunitySurface
                eyebrow={`Admin · ${home.selectedLibrary.coachName}`}
                libraryId={home.selectedLibrary.id}
                title={home.selectedLibrary.name}
                description={home.selectedLibrary.description}
                threads={home.threads}
                canModerate
              />
            ) : (
              <EmptyCommunity text="Noch keine Coach-Bibliothek vorhanden." />
            )}
          </>
        ) : null}
      </main>
    </>
  );
}

function CommunitySurface({
  eyebrow,
  libraryId,
  title,
  description,
  threads,
  canModerate,
}: {
  eyebrow: string;
  libraryId: string;
  title: string;
  description: string;
  threads: CommunityThreadSummary[];
  canModerate: boolean;
}) {
  return (
    <>
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p>
          <h1 className="display-serif mt-3 text-5xl text-[var(--foreground)] sm:text-6xl">{title}</h1>
          {description ? <p className="mt-4 max-w-2xl text-[var(--muted)]">{description}</p> : null}
        </div>
        {canModerate ? (
          <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--muted)]">
            <ShieldCheck size={16} className="text-[var(--accent)]" /> Moderation aktiv
          </span>
        ) : null}
      </header>

      <section className="surface mt-8 p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--panel-2)] text-[var(--accent)]"><Plus size={18} /></span>
          <div>
            <h2 className="text-xl font-semibold">Neues Thema starten</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Fragen, Erfahrungen und Hinweise aus deinem aktuellen Trainingsblock.</p>
          </div>
        </div>
        <form action={createCommunityThread} className="mt-5 grid gap-3">
          <input type="hidden" name="libraryId" value={libraryId} />
          <input name="title" minLength={3} maxLength={120} placeholder="Titel" required />
          <textarea name="content" minLength={2} maxLength={3000} rows={5} placeholder="Worum geht es?" required />
          <label className="grid gap-2 text-sm text-[var(--muted)]">
            Bilder anhängen
            <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
            <span className="text-xs text-[var(--subtle)]">Bis zu 4 Bilder, JPG, PNG oder WebP, jeweils maximal 5 MB.</span>
          </label>
          <div className="flex justify-end">
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]" type="submit">
              Thema veröffentlichen
            </button>
          </div>
        </form>
      </section>

      {threads.length === 0 ? <EmptyCommunity text="Noch keine Themen in dieser Community." /> : <ThreadList threads={threads} />}
    </>
  );
}

function ThreadList({ threads }: { threads: CommunityThreadSummary[] }) {
  return (
    <section className="mt-8 grid gap-4">
      {threads.map((thread) => (
        <Link key={thread.id} href={`/trainingsplaene/community/${thread.id}`} className="surface p-5 transition hover:border-[var(--accent)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">
                {thread.author.name} · {formatRole(thread.author.role)} · {formatDate(thread.createdAt)}
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{thread.title}</h2>
              <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                {thread.status === "removed" ? "Dieser Beitrag wurde entfernt." : thread.content}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)]">
              <MessageSquare size={15} className="text-[var(--accent)]" /> {thread.replyCount}
            </span>
          </div>
        </Link>
      ))}
    </section>
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

function formatRole(role: string) {
  if (role === "admin") return "Admin";
  if (role === "coach") return "Coach";
  return "Athlet";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}