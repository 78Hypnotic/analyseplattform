import Link from "next/link";
import { Activity, ArrowRight, UsersRound } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { formatPace } from "@/lib/analysis/calculations";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { getAssignedCoachAthletes } from "@/lib/coach-athletes";
import { CreateCoachAthleteForm } from "./create-athlete-form";

export const dynamic = "force-dynamic";

/**
 * Shows the current coach an overview of assigned athletes and management actions.
 */
export default async function CoachPage() {
  const [athletes, currentUser] = await Promise.all([
    getAssignedCoachAthletes(50),
    getCurrentUserRole(),
  ]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mono flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              <UsersRound size={14} />
              Coach
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Meine Athleten</h1>
            <p className="muted mt-3 max-w-2xl">
              Profile pflegen, Diagnostiken erfassen und gespeicherte Reports verwalten.
            </p>
          </div>
        </div>

        {currentUser.isCoach ? (
          <section className="mb-8 space-y-3">
            <div>
              <h2 className="text-xl font-semibold">Athletenkonto anlegen</h2>
              <p className="muted mt-1 text-sm">
                Der Athlet erhält eine E-Mail und legt sein Passwort selbst fest.
              </p>
            </div>
            <CreateCoachAthleteForm />
          </section>
        ) : null}

        {athletes.length === 0 ? (
          <section className="surface p-8">
            <h2 className="text-xl font-semibold">Noch keine Athleten zugeordnet</h2>
            <p className="muted mt-2">Ein Admin kann dir Athleten im Admin-Bereich zuweisen.</p>
          </section>
        ) : (
          <section className="grid gap-3">
            {athletes.map((athlete) => (
              <Link
                key={athlete.id}
                href={`/coach/athletes/${athlete.id}`}
                className="surface grid gap-4 p-4 transition hover:border-[var(--accent)] md:grid-cols-[minmax(0,1fr)_110px_120px_140px_auto]"
              >
                <div className="min-w-0">
                  <h2 className="truncate font-medium">{athlete.fullName}</h2>
                  <p className="mono mt-1 truncate text-xs text-[var(--subtle)]">{athlete.email}</p>
                  <p className="muted mt-2 text-sm">
                    {[athlete.city, athlete.age ? `${athlete.age} Jahre` : null].filter(Boolean).join(" | ") || "Profil unvollständig"}
                  </p>
                </div>
                <SmallMetric label="Technik" value={formatTechniqueStatus(athlete.latestSwimTechniqueStatus)} />
                <SmallMetric label="CSS" value={formatNullablePace(athlete.latestSwimCssPaceSec)} />
                <SmallMetric label="Letzte Analyse" value={formatDate(athlete.latestSwimAnalyzedAt)} />
                <span className="flex items-center gap-2 text-sm font-medium text-[var(--accent)] md:justify-end">
                  Öffnen
                  <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </section>
        )}
      </main>
    </>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mono flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">
        {label === "CSS" ? <Activity size={12} /> : null}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function formatTechniqueStatus(value: "rot" | "gelb" | "gruen" | null) {
  if (value === "rot") return "Rot";
  if (value === "gelb") return "Gelb";
  if (value === "gruen") return "Grün";
  return "-";
}

function formatNullablePace(value: number | null) {
  return value === null ? "-" : formatPace(value);
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("de-DE") : "-";
}
