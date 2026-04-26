import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowRight, BarChart3, ShieldCheck, Waves } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/button";

export default function Home() {
  return (
    <>
      <AppHeader />
      <main>
        <section className="relative overflow-hidden border-b border-[var(--line)]">
          <Image
            src="/swimmer-top.jpg"
            alt="Schwimmer im Training"
            fill
            priority
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c0d] via-[#0b0c0d]/80 to-[#0b0c0d]/40" />
          <div className="relative mx-auto flex min-h-[620px] max-w-6xl items-center px-5 py-20">
            <div className="max-w-3xl">
              <p className="mono mb-5 text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                Schwimmen | Analyse | Trainingsplan
              </p>
              <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
                Trainingsanalyse
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
                Aus 200 m, 400 m, Zugzahlen und Kontext entsteht ein klarer
                Coaching-Report mit Staerken, Hauptproblem und naechstem Plan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/analyse/new" variant="primary">
                  Analyse starten <ArrowRight size={16} />
                </ButtonLink>
                <ButtonLink href="/dashboard">Dashboard</ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-5 py-12 md:grid-cols-3">
          <Feature
            icon={<Waves size={20} />}
            title="Mechanik"
            text="Pace, DPS und Stroke Rate pro Distanz."
          />
          <Feature
            icon={<BarChart3 size={20} />}
            title="Relationen"
            text="CSS, VLa-Proxy, VO2-Proxy und Sprint-Reserve."
          />
          <Feature
            icon={<ShieldCheck size={20} />}
            title="Privat"
            text="Analysen werden nutzerbezogen mit Supabase RLS gespeichert."
          />
        </section>
      </main>
    </>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="surface p-5">
      <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-[var(--panel-2)] text-[var(--accent)]">
        {icon}
      </div>
      <h2 className="font-semibold">{title}</h2>
      <p className="muted mt-2 text-sm leading-6">{text}</p>
    </div>
  );
}
