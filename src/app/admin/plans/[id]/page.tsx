import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { requireAdmin } from "@/lib/auth/roles";
import { getTrainingPlanById } from "@/lib/training-plans/data";
import { TrainingPlanForm } from "../training-plan-form";

export const dynamic = "force-dynamic";

export default async function EditTrainingPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const plan = await getTrainingPlanById(id);

  if (!plan) notFound();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          Admin / Plan bearbeiten
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{plan.title}</h1>
        <TrainingPlanForm plan={plan} />
      </main>
    </>
  );
}
