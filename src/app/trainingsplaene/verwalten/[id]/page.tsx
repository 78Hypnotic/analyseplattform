import { notFound } from "next/navigation";
import { TrainingPlanForm } from "@/components/training-plans/training-plan-form";
import { requireCoachAccess } from "@/lib/auth/roles";
import { getManageableTrainingPlanById } from "@/lib/training-plans/data";

export const dynamic = "force-dynamic";

export default async function EditTrainingPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await requireCoachAccess();
  const { id } = await params;
  const plan = await getManageableTrainingPlanById(id);

  if (!plan) notFound();

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          {currentUser.isAdmin ? "Admin" : "Coach"} / Plan bearbeiten
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{plan.title}</h1>
        <TrainingPlanForm plan={plan} />
      </main>
    </>
  );
}
