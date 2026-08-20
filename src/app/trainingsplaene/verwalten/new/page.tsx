import { TrainingPlanForm } from "@/components/training-plans/training-plan-form";
import { requireCoachAccess } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function NewTrainingPlanPage() {
  const currentUser = await requireCoachAccess();

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          {currentUser.isAdmin ? "Admin" : "Coach"} / Neuer Plan
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Trainingsplan anlegen</h1>
        <TrainingPlanForm />
      </main>
    </>
  );
}
