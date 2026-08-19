import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { TechniqueSpiderChart } from "@/components/technique-spider-chart";
import { ActivatePlanForm } from "@/components/training-plans/activate-plan-form";
import { TrainingPlanContentView } from "@/components/training-plans/training-plan-content-view";
import { buildTechniqueProfile } from "@/lib/analysis/calculations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isStructuredTrainingPlanContent } from "@/lib/training-plans/content";
import {
  getAccessibleTrainingPlanVersionById,
  getTrainingPlanSelectionState,
} from "@/lib/training-plans/library";

export const dynamic = "force-dynamic";

export default async function TrainingPlanDetailPage({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  const { versionId } = await params;
  const [version, selectionState, techniqueAxes] = await Promise.all([
    getAccessibleTrainingPlanVersionById(versionId),
    getTrainingPlanSelectionState(versionId),
    getCurrentTechniqueProfile(),
  ]);
  if (!version) notFound();
  const requiredTrainingDays = Math.max(
    0,
    ...version.content.weeks.map((week) => week.sessions.length),
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10 pb-24">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          Schwimmplan · Version {version.version_number}
        </p>
        <h1 className="display-serif mt-3 max-w-4xl text-5xl text-[var(--foreground)] sm:text-7xl">{version.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">{version.summary}</p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
          <span>{version.weeks} Wochen</span>
          <span>{version.level}</span>
          <span>{version.target_distances.join(" · ")}</span>
          {version.target_technique_axis ? <span>Technikfokus: {version.target_technique_axis}</span> : null}
          <span>Veröffentlicht am {new Date(version.published_at).toLocaleDateString("de-DE")}</span>
        </div>

        {selectionState.kind === "available" && isStructuredTrainingPlanContent(version.content) ? (
          <ActivatePlanForm
            versionId={version.id}
            requiredTrainingDays={requiredTrainingDays}
            minimumStartDate={new Date().toISOString().slice(0, 10)}
          />
        ) : null}
        {selectionState.kind === "active-plan-exists" ? (
          <div className="surface mt-8 p-5 text-sm text-[var(--muted)]">
            Du hast bereits einen aktiven Schwimmplan. Schließe oder pausiere ihn, bevor du einen neuen auswählst.
          </div>
        ) : null}
        {selectionState.kind === "available" && !isStructuredTrainingPlanContent(version.content) ? (
          <div className="surface mt-8 p-5 text-sm text-[var(--warn)]">
            Diese ältere Planversion kann noch nicht persönlich terminiert werden.
          </div>
        ) : null}
        {selectionState.kind === "unavailable" ? (
          <div className="surface mt-8 p-5">
            <p className="font-medium text-[var(--foreground)]">Dieser Plan kann mit diesem Konto nicht aktiviert werden.</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {selectionState.reason === "membership-required"
                ? "Für die Auswahl aus dieser Coach-Bibliothek benötigt dein Athletenkonto eine aktive Gruppencoaching-Mitgliedschaft für genau diese Bibliothek. Coach- oder Adminrechte erlauben die Ansicht, ersetzen aber keine Membership."
                : selectionState.reason === "not-in-library"
                  ? "Diese Planversion ist keiner Coach-Bibliothek zugeordnet und kann deshalb noch nicht ausgewählt werden."
                  : "Bitte melde dich als Athlet mit aktiver Gruppencoaching-Mitgliedschaft an."}
            </p>
          </div>
        ) : null}

        {version.target_technique_axis ? (
          <section className="surface mt-10 grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div>
              <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">Technikfokus</p>
              <h2 className="display-serif mt-2 text-3xl text-[var(--foreground)]">
                Dieser Plan arbeitet an {version.target_technique_axis}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
                Der gestrichelte Sektor markiert den Trainingsschwerpunkt im aktuellen Technikprofil. Er ist keine
                Vorhersage eines Zielwerts. Eine tatsächliche Veränderung wird erst bei einem ReTest sichtbar.
              </p>
              {!techniqueAxes ? (
                <Link href="/analyse" className="mt-5 inline-flex text-sm font-medium text-[var(--accent)] hover:underline">
                  Schwimmdiagnostik durchführen
                </Link>
              ) : null}
            </div>
            {techniqueAxes ? (
              <TechniqueSpiderChart axes={techniqueAxes} focusGroup={version.target_technique_axis} />
            ) : null}
          </section>
        ) : null}

        <TrainingPlanContentView content={version.content} />
      </main>
    </>
  );
}

async function getCurrentTechniqueProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("analyses")
    .select("input")
    .eq("user_id", user.id)
    .eq("discipline", "swim")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const input = data?.input;
  if (!input || typeof input !== "object") return null;
  const challenges = (input as { challenges?: unknown }).challenges;
  if (!Array.isArray(challenges)) return null;

  return buildTechniqueProfile(
    challenges.filter((challenge): challenge is string => typeof challenge === "string"),
  );
}