import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/button";
import { getUserBikeAnalyses } from "@/lib/bike-analyses";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DeleteBikeAnalysisForm } from "./delete-analysis-form";

export const dynamic = "force-dynamic";

export default async function BikeAnalysesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const analyses = await getUserBikeAnalyses(20);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              Rad-Diagnostik
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Gespeicherte Rad-Analysen</h1>
          </div>
          <ButtonLink href="/rad/new" variant="primary">
            <Plus size={16} />
            Neue Rad-Analyse
          </ButtonLink>
        </div>

        {analyses.length === 0 ? (
          <section className="surface p-8">
            <h2 className="text-xl font-semibold">Noch keine Rad-Analyse gespeichert</h2>
            <p className="muted mt-2">Starte mit deinen drei Wattwerten (1 s / 20 s / 1 min) und speichere den ersten Report.</p>
          </section>
        ) : (
          <div className="grid gap-3">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="surface grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_110px_110px_90px_auto]"
              >
                <div className="min-w-0">
                  <h2 className="truncate font-medium">{analysis.title}</h2>
                  <p className="muted mt-1 text-sm">
                    {new Date(analysis.created_at).toLocaleDateString("de-DE")} | {analysis.result.metabolicProfile.label}
                  </p>
                </div>
                <SmallMetric label="FTP" value={`${Math.round(analysis.result.ftpWatt)} W`} />
                <SmallMetric label="VO₂max" value={`${analysis.result.vo2rel.toFixed(1)}`} />
                <SmallMetric label="VLamax" value={analysis.result.vlamaxProxy.toFixed(2)} />
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <Link
                    href={`/rad/${analysis.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-sm font-medium transition hover:border-[var(--accent)]"
                  >
                    Öffnen
                  </Link>
                  <DeleteBikeAnalysisForm id={analysis.id} title={analysis.title} />
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
