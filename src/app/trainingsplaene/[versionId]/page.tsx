import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { TrainingPlanContentView } from "@/components/training-plans/training-plan-content-view";
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

        <TrainingPlanContentView content={version.content} />
      </main>
    </>
  );
}