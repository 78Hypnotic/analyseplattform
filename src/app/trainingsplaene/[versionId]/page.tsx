import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { getAccessibleTrainingPlanVersionById } from "@/lib/training-plans/library";

export const dynamic = "force-dynamic";

export default async function TrainingPlanDetailPage({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  const { versionId } = await params;
  const version = await getAccessibleTrainingPlanVersionById(versionId);
  if (!version) notFound();

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
          <span>Veröffentlicht am {new Date(version.published_at).toLocaleDateString("de-DE")}</span>
        </div>

        <section className="mt-10 space-y-5">
          {version.content.weeks.map((week, weekIndex) => (
            <article key={`${week.title}-${weekIndex}`} className="surface p-6">
              <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--subtle)]">Woche {weekIndex + 1}</p>
              <h2 className="mt-2 text-2xl font-semibold">{week.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{week.goal}</p>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {week.sessions.map((session, sessionIndex) => (
                  <section key={`${session.title}-${sessionIndex}`} className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-5">
                    <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">Einheit {sessionIndex + 1}</p>
                    <h3 className="mt-2 text-lg font-semibold">{session.title}</h3>
                    <p className="mt-1 text-sm text-[var(--accent)]">{session.focus}</p>
                    <div className="mt-4 space-y-3">
                      {session.blocks.map((block, blockIndex) => (
                        <div key={`${block.title}-${blockIndex}`} className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0">
                          <p className="font-medium">{block.title}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">{block.sets} · {block.intensity}</p>
                          {block.notes ? <p className="mt-1 text-xs text-[var(--subtle)]">{block.notes}</p> : null}
                        </div>
                      ))}
                    </div>
                    {session.drills.length > 0 ? (
                      <div className="mt-4 border-t border-[var(--line)] pt-3">
                        <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">Drills</p>
                        <div className="mt-2 space-y-2">
                          {session.drills.map((drill, drillIndex) => (
                            <p key={`${drill.name}-${drillIndex}`} className="text-sm">
                              <span className="font-medium">{drill.name}:</span>{" "}
                              <span className="text-[var(--muted)]">{drill.cue}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </section>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}