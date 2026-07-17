import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AnalysisAttribution } from "@/components/analysis-attribution";
import { ButtonLink } from "@/components/button";
import { formatPace } from "@/lib/running/calculations";
import { getUserRunAnalyses } from "@/lib/run-analyses";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DeleteRunAnalysisForm } from "./delete-analysis-form";

export const dynamic = "force-dynamic";

export default async function RunAnalysesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const analyses = await getUserRunAnalyses(20);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              Laufdiagnostik
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Gespeicherte Laufanalysen</h1>
          </div>
          <ButtonLink href="/lauf/new" variant="primary">
            <Plus size={16} />
            Neue Laufanalyse
          </ButtonLink>
        </div>

        {analyses.length === 0 ? (
          <section className="surface p-8">
            <h2 className="text-xl font-semibold">Noch keine Laufanalyse gespeichert</h2>
            <p className="muted mt-2">Starte mit dem 3- und 12-Minuten-Test und speichere den ersten Report.</p>
          </section>
        ) : (
          <div className="grid gap-3">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="surface grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_110px_90px_90px_auto]"
              >
                <div className="min-w-0">
                  <h2 className="truncate font-medium">{analysis.title}</h2>
                  <p className="muted mt-1 text-sm">
                    {new Date(analysis.created_at).toLocaleDateString("de-DE")} | {analysis.input.goal}
                  </p>
                  <AnalysisAttribution audit={analysis} className="mt-1" />
                </div>
                <SmallMetric label="CS" value={`${formatPace(analysis.result.csPaceSecPerKm)} /km`} />
                <SmallMetric label="API" value={analysis.result.api.score.toFixed(1)} />
                <SmallMetric label="ACI" value={analysis.result.aci.score.toFixed(1)} />
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <Link
                    href={`/lauf/${analysis.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-sm font-medium transition hover:border-[var(--accent)]"
                  >
                    Öffnen
                  </Link>
                  <DeleteRunAnalysisForm id={analysis.id} title={analysis.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
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
