import { AppHeader } from "@/components/app-header";
import { requireAdmin } from "@/lib/auth/roles";
import { TrainingPlanForm } from "../training-plan-form";

export const dynamic = "force-dynamic";

export default async function NewTrainingPlanPage() {
  await requireAdmin();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          Admin / Neuer Plan
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Trainingsplan anlegen</h1>
        <TrainingPlanForm />
      </main>
    </>
  );
}
