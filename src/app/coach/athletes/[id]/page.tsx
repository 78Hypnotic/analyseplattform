import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, FileText, Pencil } from "lucide-react";
import { DeleteAnalysisForm } from "@/app/analyse/delete-analysis-form";
import { DeleteRunAnalysisForm } from "@/app/lauf/delete-analysis-form";
import { ProfileForm } from "@/app/profile/profile-form";
import { DeleteBikeAnalysisForm } from "@/app/rad/delete-analysis-form";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/button";
import { formatPace } from "@/lib/analysis/calculations";
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
          Zurück zur Athletenliste
        </Link>

        <section className="surface p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Athlet</p>
              <h1 className="display-serif mt-3 text-5xl text-[var(--foreground)]">{athlete.fullName}</h1>
              <p className="mono mt-2 text-xs text-[var(--subtle)]">{athlete.email}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <ButtonLink href={`/analyse/new?athlete=${athlete.id}`} variant="primary">Schwimmtest</ButtonLink>
                <ButtonLink href={`/lauf/new?athlete=${athlete.id}`}>Lauftest</ButtonLink>
                <ButtonLink href={`/rad/new?athlete=${athlete.id}`}>Radtest</ButtonLink>
              </div>
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
          <ProfileMetric label="Größe" value={athlete.heightCm ? `${athlete.heightCm} cm` : "-"} />
          <ProfileMetric label="Gewicht" value={athlete.weightKg ? `${athlete.weightKg} kg` : "-"} />
          <ProfileMetric label="Körperfett" value={athlete.bodyFatPercentage ? `${athlete.bodyFatPercentage}%` : "-"} />
          <ProfileMetric label="Disziplinen" value={athlete.disciplines.length > 0 ? athlete.disciplines.join(", ") : "-"} />
        </section>

        <section className="space-y-4">
          <div>
            <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Profil</p>
            <h2 className="mt-2 text-2xl font-semibold">Athletendaten bearbeiten</h2>
          </div>
          <ProfileForm
            athleteId={athlete.id}
            coachMode
            email={athlete.email}
            fullName={athlete.fullName}
            city={athlete.city}
            age={athlete.age}
            gender={athlete.gender}
            heightCm={athlete.heightCm}
            weightKg={athlete.weightKg}
            bodyFatPercentage={athlete.bodyFatPercentage}
            fitnessLevel={athlete.fitnessLevel}
            vo2max={athlete.vo2max}
            vlamax={athlete.vlamax}
            ftpRad={athlete.ftpRad}
            muscleMassKg={athlete.muscleMassKg}
            disciplines={athlete.disciplines}
          />
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
              {athlete.analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-medium">{analysis.title}</h3>
                        <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">
                          {formatDiscipline(analysis.discipline)}
                        </span>
                      </div>
                      <p className="muted mt-1 text-sm">
                        {new Date(analysis.createdAt).toLocaleDateString("de-DE")}
                        {analysis.createdBy && analysis.createdBy !== athlete.id
                          ? ` · Erfasst von Coach ${analysis.createdByName ?? "Unbekannt"}`
                          : ""}
                      </p>
                      {analysis.updatedBy && analysis.updatedAt !== analysis.createdAt ? (
                        <p className="mt-1 text-xs text-[var(--subtle)]">
                          Zuletzt bearbeitet von {analysis.updatedByName ?? "Unbekannt"}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <Link
                        href={getAnalysisPath(analysis.discipline, analysis.id)}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-sm font-medium hover:border-[var(--accent)]"
                      >
                        Öffnen
                      </Link>
                      <Link
                        href={getEditPath(analysis.discipline, athlete.id, analysis.id)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] px-3 text-sm font-medium hover:border-[var(--accent)]"
                      >
                        <Pencil size={15} />
                        Bearbeiten
                      </Link>
                      <AnalysisDeleteForm
                        discipline={analysis.discipline}
                        id={analysis.id}
                        title={analysis.title}
                      />
                    </div>
                  </div>
              ))}
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

function formatTechniqueStatus(value: "rot" | "gelb" | "gruen" | null) {
  if (value === "rot") return "Rot";
  if (value === "gelb") return "Gelb";
  if (value === "gruen") return "Grün";
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
  if (value === "maennlich") return "Männlich";
  if (value === "weiblich") return "Weiblich";
  if (value === "divers") return "Divers";
  return "-";
}

function formatDiscipline(discipline: "swim" | "run" | "bike") {
  if (discipline === "run") return "Laufen";
  if (discipline === "bike") return "Rad";
  return "Schwimmen";
}

function getAnalysisPath(discipline: "swim" | "run" | "bike", id: string) {
  if (discipline === "run") return `/lauf/${id}`;
  if (discipline === "bike") return `/rad/${id}`;
  return `/analyse/${id}`;
}

function getEditPath(discipline: "swim" | "run" | "bike", athleteId: string, id: string) {
  if (discipline === "run") return `/lauf/new?athlete=${athleteId}&edit=${id}`;
  if (discipline === "bike") return `/rad/new?athlete=${athleteId}&edit=${id}`;
  return `/analyse/new?athlete=${athleteId}&edit=${id}`;
}

function AnalysisDeleteForm({
  discipline,
  id,
  title,
}: {
  discipline: "swim" | "run" | "bike";
  id: string;
  title: string;
}) {
  if (discipline === "run") return <DeleteRunAnalysisForm id={id} title={title} />;
  if (discipline === "bike") return <DeleteBikeAnalysisForm id={id} title={title} />;
  return <DeleteAnalysisForm id={id} title={title} />;
}
