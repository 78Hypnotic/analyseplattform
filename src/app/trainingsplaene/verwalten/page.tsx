import Link from "next/link";
import { Plus, Send, Trash2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/button";
import { requireCoachAccess } from "@/lib/auth/roles";
import { getManageableTrainingPlans } from "@/lib/training-plans/data";
import { deleteTrainingPlan, publishTrainingPlan } from "./actions";

export const dynamic = "force-dynamic";

export default async function ManageTrainingPlansPage() {
  const currentUser = await requireCoachAccess();
  const plans = await getManageableTrainingPlans(50);

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-5 py-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              {currentUser.isAdmin ? "Admin" : "Coach"} / Trainingspläne
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Planvorlagen</h1>
          </div>
          <ButtonLink href="/trainingsplaene/verwalten/new" variant="primary">
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
                <Link href={`/trainingsplaene/verwalten/${plan.id}`} className="group">
                  <p className="font-semibold group-hover:text-[var(--accent)]">{plan.title}</p>
                  <p className="muted mt-1 text-sm">{plan.slug} · {plan.focus}</p>
                </Link>
                <SmallMetric label="Wochen" value={String(plan.weeks)} />
                <SmallMetric label="Status" value={plan.is_active ? "Aktiv" : "Entwurf"} />
                <div className="flex gap-2 md:justify-end">
                  <form action={publishTrainingPlan}>
                    <input type="hidden" name="id" value={plan.id} />
                    <Button type="submit" variant="ghost" className="px-2" title={plan.is_active ? "Neue Version veröffentlichen" : "Veröffentlichen"}>
                      <Send size={18} />
                    </Button>
                  </form>
                  {!plan.is_active ? (
                    <form action={deleteTrainingPlan}>
                      <input type="hidden" name="id" value={plan.id} />
                      <Button type="submit" variant="ghost" className="px-2 text-[var(--warn)]" title="Löschen">
                        <Trash2 size={18} />
                      </Button>
                    </form>
                  ) : null}
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
