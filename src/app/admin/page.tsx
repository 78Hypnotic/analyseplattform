import Link from "next/link";
import { ArrowUpRight, BookOpen, ClipboardList, ShieldCheck, UsersRound } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/button";
import { requireAdmin } from "@/lib/auth/roles";
import { getTrainingPlans } from "@/lib/training-plans/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const [{ count: userCount, error: userCountError }, plans] = await Promise.all([
    supabase.from("user_roles").select("user_id", { count: "exact", head: true }),
    getTrainingPlans(20),
  ]);

  if (userCountError) throw new Error(userCountError.message);

  const activePlans = plans.filter((plan) => plan.is_active).length;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <p className="mono inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          <ShieldCheck size={14} />
          Admin
        </p>
        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="display-serif text-5xl leading-tight text-[var(--foreground)]">Steuerzentrale.</h1>
            <p className="muted mt-4 max-w-2xl leading-7">
              Rollen sind serverseitig geschützt. Trainingspläne werden hier gepflegt und
              später im Report als gesperrte Vorschau ausgespielt.
            </p>
          </div>
          <ButtonLink href="/admin/plans" variant="primary">
            <ClipboardList size={16} />
            Pläne verwalten
          </ButtonLink>
          <ButtonLink href="/admin/coaches">
            <UsersRound size={16} />
            Coaches verwalten
          </ButtonLink>
          <ButtonLink href="/admin/methodik">
            <BookOpen size={16} />
            Methodik &amp; Formeln
          </ButtonLink>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <AdminMetric label="User gesamt" value={String(userCount ?? 0)} href="/admin/users" />
          <AdminMetric label="Pläne gesamt" value={String(plans.length)} />
          <AdminMetric label="Aktiv" value={String(activePlans)} />
        </section>
      </main>
    </>
  );
}

function AdminMetric({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <p className="mono flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[var(--subtle)]">
        {label}
        {href ? <ArrowUpRight size={14} className="text-[var(--accent)]" /> : null}
      </p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="surface block p-5 transition hover:border-[var(--accent)]"
      >
        {content}
      </Link>
    );
  }

  return <div className="surface p-5">{content}</div>;
}
