import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/button";
import { formatPace } from "@/lib/analysis/calculations";
import { getUserAnalyses } from "@/lib/analyses";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AnalysesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const analyses = await getUserAnalyses(20);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              Analyse
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Gespeicherte Analysen</h1>
          </div>
          <ButtonLink href="/analyse/new" variant="primary">
            <Plus size={16} />
            Neue Analyse
          </ButtonLink>
        </div>

        {analyses.length === 0 ? (
          <section className="surface p-8">
            <h2 className="text-xl font-semibold">Noch keine Analyse gespeichert</h2>
            <p className="muted mt-2">Starte mit dem Schwimmtest und speichere den ersten Report.</p>
          </section>
        ) : (
          <div className="grid gap-3">
            {analyses.map((analysis) => (
              <Link
                href={`/analyse/${analysis.id}`}
                key={analysis.id}
                className="surface grid gap-4 p-4 transition hover:border-[var(--accent)] md:grid-cols-[1fr_140px_140px_140px]"
              >
                <div>
                  <h2 className="font-medium">{analysis.title}</h2>
                  <p className="muted mt-1 text-sm">
                    {new Date(analysis.created_at).toLocaleDateString("de-DE")} | {analysis.input.goal}
                  </p>
                </div>
                <SmallMetric label="CSS" value={formatPace(analysis.result.cssPace)} />
                <SmallMetric label="DPS 400" value={analysis.result.test400.dps.toFixed(2)} />
                <SmallMetric label="Plan" value={analysis.result.plan.name} />
              </Link>
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
