import Link from "next/link";
import { Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button, ButtonLink } from "@/components/button";
import { requireAdmin } from "@/lib/auth/roles";
import { getTrainingPlans } from "@/lib/training-plans/data";
import { deleteTrainingPlan, toggleTrainingPlan } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  await requireAdmin();
  const plans = await getTrainingPlans(50);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              Admin / Trainingspläne
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Plan-Katalog</h1>
          </div>
          <ButtonLink href="/admin/plans/new" variant="primary">
            <Plus size={16} />
            Neuer Plan
          </ButtonLink>
        </div>

        <section className="mt-8 grid gap-3">
          {plans.length === 0 ? (
            <div className="surface p-8">
              <h2 className="text-xl font-semibold">Noch keine Pläne angelegt</h2>
              <p className="muted mt-2">Erstelle den ersten Trainingsplan für die Report-Vorschau.</p>
            </div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="surface grid gap-4 p-4 md:grid-cols-[1fr_130px_130px_auto] md:items-center">
                <Link href={`/admin/plans/${plan.id}`} className="group">
                  <p className="font-semibold group-hover:text-[var(--accent)]">{plan.title}</p>
                  <p className="muted mt-1 text-sm">{plan.slug} · {plan.focus}</p>
                </Link>
                <SmallMetric label="Wochen" value={String(plan.weeks)} />
                <SmallMetric label="Status" value={plan.is_active ? "Aktiv" : "Entwurf"} />
                <div className="flex gap-2 md:justify-end">
                  <form action={toggleTrainingPlan}>
                    <input type="hidden" name="id" value={plan.id} />
                    <input type="hidden" name="is_active" value={plan.is_active ? "false" : "true"} />
                    <Button type="submit" variant="ghost" className="px-2" title={plan.is_active ? "Deaktivieren" : "Aktivieren"}>
                      {plan.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </Button>
                  </form>
                  <form action={deleteTrainingPlan}>
                    <input type="hidden" name="id" value={plan.id} />
                    <Button type="submit" variant="ghost" className="px-2 text-[var(--warn)]" title="Löschen">
                      <Trash2 size={18} />
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
