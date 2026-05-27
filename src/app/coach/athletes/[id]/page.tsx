import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, FileText } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { formatPace, isTechniqueOnlyResult } from "@/lib/analysis/calculations";
import { getCoachAthleteDetail } from "@/lib/coach-athletes";

export const dynamic = "force-dynamic";

/**
 * Renders one assigned athlete with profile metrics and latest analysis reports.
 */
export default async function CoachAthleteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) notFound();

  const athlete = await getCoachAthleteDetail(parsedId.data);
  if (!athlete) notFound();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl space-y-8 px-5 py-10">
        <Link href="/coach" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft size={16} />
          Zuruck zur Athletenliste
        </Link>

        <section className="surface p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Athlet</p>
              <h1 className="display-serif mt-3 text-5xl text-[var(--foreground)]">{athlete.fullName}</h1>
              <p className="mono mt-2 text-xs text-[var(--subtle)]">{athlete.email}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:min-w-[24rem]">
              <SummaryMetric label="Technik-Gate" value={formatTechniqueStatus(athlete.latestSwimTechniqueStatus)} />
              <SummaryMetric label="CSS" value={formatNullablePace(athlete.latestSwimCssPaceSec)} />
              <SummaryMetric label="VO2-Proxy" value={formatProxy(athlete.latestSwimVo2Proxy)} />
              <SummaryMetric label="VLa-Profil" value={athlete.latestSwimVlaProfile ?? "-"} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <ProfileMetric label="Ort" value={athlete.city ?? "-"} />
          <ProfileMetric label="Alter" value={athlete.age ? `${athlete.age} Jahre` : "-"} />
          <ProfileMetric label="Geschlecht" value={formatGender(athlete.gender)} />
          <ProfileMetric label="Fitness" value={athlete.fitnessLevel ? `${athlete.fitnessLevel}/5` : "-"} />
          <ProfileMetric label="Groesse" value={athlete.heightCm ? `${athlete.heightCm} cm` : "-"} />
          <ProfileMetric label="Gewicht" value={athlete.weightKg ? `${athlete.weightKg} kg` : "-"} />
          <ProfileMetric label="Korperfett" value={athlete.bodyFatPercentage ? `${athlete.bodyFatPercentage}%` : "-"} />
          <ProfileMetric label="Disziplinen" value={athlete.disciplines.length > 0 ? athlete.disciplines.join(", ") : "-"} />
        </section>

        <section className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={18} className="text-[var(--accent)]" />
            <h2 className="text-xl font-semibold">Analyse-Reports</h2>
          </div>

          {athlete.analyses.length === 0 ? (
            <p className="muted text-sm">Noch keine Analysen gespeichert.</p>
          ) : (
            <div className="grid gap-3">
              {athlete.analyses.map((analysis) => {
                const techniqueOnly = isTechniqueOnlyResult(analysis.result);
                return (
                  <Link
                    key={analysis.id}
                    href={`/analyse/${analysis.id}`}
                    className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4 transition hover:border-[var(--accent)] md:grid-cols-[minmax(0,1fr)_110px_120px_140px]"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate font-medium">{analysis.title}</h3>
                      <p className="muted mt-1 text-sm">
                        {new Date(analysis.created_at).toLocaleDateString("de-DE")} | {analysis.input.goal}
                      </p>
                    </div>
                    <SmallMetric label="CSS" value={techniqueOnly ? "Technik" : formatPace(analysis.result.cssPace)} />
                    <SmallMetric label="DPS 400" value={analysis.result.test400 ? analysis.result.test400.dps.toFixed(2) : "-"} />
                    <SmallMetric label="Plan" value={`${analysis.result.plan.name} | ${analysis.result.plan.weeks} Wo.`} />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <p className="mt-2 break-words text-sm font-medium">{value}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function formatTechniqueStatus(value: "rot" | "gelb" | "gruen" | null) {
  if (value === "rot") return "Rot";
  if (value === "gelb") return "Gelb";
  if (value === "gruen") return "Grun";
  return "-";
}

function formatNullablePace(value: number | null) {
  return value === null ? "-" : formatPace(value);
}

function formatProxy(value: "hoch" | "mittel" | "niedrig" | "nicht_ermittelbar" | null) {
  if (value === "nicht_ermittelbar") return "Nicht ermittelbar";
  return value ?? "-";
}

function formatGender(value: "weiblich" | "maennlich" | "divers" | null) {
  if (value === "maennlich") return "Mannlich";
  if (value === "weiblich") return "Weiblich";
  if (value === "divers") return "Divers";
  return "-";
}
