"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/button";
import { ReportView } from "@/components/report-view";
import { CHALLENGE_GROUPS, DEFAULT_ANALYSIS_INPUT, GOALS, LEVELS } from "@/lib/analysis/constants";
import { runAnalysis } from "@/lib/analysis/calculations";
import type { AnalysisInput } from "@/lib/analysis/types";
import { createAnalysis } from "../actions";

export function AnalysisFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<AnalysisInput>(DEFAULT_ANALYSIS_INPUT);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const result = useMemo(() => runAnalysis(input), [input]);

  function update(patch: Partial<AnalysisInput>) {
    setInput((current) => ({ ...current, ...patch }));
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const state = await createAnalysis(input);
      if (state.ok) {
        router.push(`/analyse/${state.id}`);
        return;
      }
      if (state.message.includes("melde dich")) {
        setMessage("Analyse ist berechnet. Zum Speichern bitte per Magic Link einloggen.");
        return;
      }
      setMessage(state.message);
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            Neue Analyse
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {["Kontext", "Testdaten", "Report"][step]}
          </h1>
        </div>
        <div className="flex gap-2">
          {["Kontext", "Daten", "Report"].map((label, index) => (
            <button
              key={label}
              onClick={() => setStep(index)}
              className={
                index === step
                  ? "rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-black"
                  : "rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)]"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {step === 0 ? (
        <ContextStep input={input} update={update} next={() => setStep(1)} />
      ) : null}
      {step === 1 ? (
        <DataStep input={input} update={update} back={() => setStep(0)} next={() => setStep(2)} />
      ) : null}
      {step === 2 ? (
        <section className="space-y-6">
          {result ? (
            <ReportView input={input} result={result} />
          ) : (
            <div className="surface p-6">
              <h2 className="text-xl font-semibold">Daten nicht plausibel</h2>
              <p className="muted mt-2">Bitte prüfe Zeiten und Zugzahlen.</p>
            </div>
          )}
          {message ? (
            <div className="surface border-[var(--warn)] p-4 text-sm text-[var(--warn)]">
              {message}{" "}
              <Link className="underline underline-offset-4" href="/login">
                Zum Login
              </Link>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Zurück
            </Button>
            <Button variant="primary" onClick={save} disabled={!result || isPending}>
              {isPending ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              Speichern
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ContextStep({
  input,
  update,
  next,
}: {
  input: AnalysisInput;
  update: (patch: Partial<AnalysisInput>) => void;
  next: () => void;
}) {
  function toggleChallenge(item: string) {
    const active = input.challenges.includes(item);
    update({
      challenges: active
        ? input.challenges.filter((challenge) => challenge !== item)
        : [...input.challenges, item],
    });
  }

  return (
    <section className="space-y-6">
      <div className="surface p-5">
        <p className="mono mb-4 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          Ziel
        </p>
        <div className="grid gap-3 md:grid-cols-4">
          {GOALS.map((goal) => (
            <button
              key={goal.id}
              onClick={() => update({ goal: goal.id })}
              className={
                input.goal === goal.id
                  ? "rounded-lg border border-[var(--accent)] bg-[var(--panel-2)] p-4 text-left"
                  : "rounded-lg border border-[var(--line)] bg-black/10 p-4 text-left"
              }
            >
              <span className="block font-medium">{goal.label}</span>
              <span className="muted mt-2 block text-sm">{goal.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="surface p-5">
        <p className="mono mb-4 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          Niveau
        </p>
        <div className="grid gap-3 md:grid-cols-4">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => update({ level: level.id })}
              className={
                input.level === level.id
                  ? "rounded-lg border border-[var(--accent)] bg-[var(--panel-2)] p-4 text-left"
                  : "rounded-lg border border-[var(--line)] bg-black/10 p-4 text-left"
              }
            >
              <span className="block font-medium">{level.label}</span>
              <span className="muted mt-2 block text-sm">{level.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="surface p-5">
        <p className="mono mb-4 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          Technische Herausforderungen
        </p>
        <div className="space-y-5">
          {CHALLENGE_GROUPS.map((group) => (
            <div key={group.group}>
              <h3 className="mb-2 text-sm font-medium">{group.group}</h3>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const active = input.challenges.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => toggleChallenge(item)}
                      className={
                        active
                          ? "rounded-lg border border-[var(--accent)] bg-[var(--panel-2)] px-3 py-2 text-sm"
                          : "rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)]"
                      }
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={next}>
          Weiter <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}

function DataStep({
  input,
  update,
  back,
  next,
}: {
  input: AnalysisInput;
  update: (patch: Partial<AnalysisInput>) => void;
  back: () => void;
  next: () => void;
}) {
  return (
    <section className="space-y-6">
      <div className="surface p-5">
        <p className="mono mb-4 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          Athlet
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Name" value={input.name} onChange={(value) => update({ name: value })} />
          <Field label="Alter" type="number" value={input.age} onChange={(value) => update({ age: Number(value) })} />
          <label className="grid gap-2 text-sm">
            Geschlecht
            <select value={input.gender} onChange={(event) => update({ gender: event.target.value as AnalysisInput["gender"] })}>
              <option value="weiblich">weiblich</option>
              <option value="maennlich">männlich</option>
              <option value="divers">divers</option>
            </select>
          </label>
          <Field label="Größe (cm)" type="number" value={input.height} onChange={(value) => update({ height: Number(value) })} />
          <Field label="Gewicht (kg)" type="number" value={input.weight} onChange={(value) => update({ weight: Number(value) })} />
          <label className="grid gap-2 text-sm">
            Becken
            <select value={input.poolLength} onChange={(event) => update({ poolLength: Number(event.target.value) as 25 | 50 })}>
              <option value={25}>25 m</option>
              <option value={50}>50 m</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TestCard
          title="200 m Test"
          time={input.t200}
          strokes={input.s200}
          onTime={(value) => update({ t200: value })}
          onStrokes={(value) => update({ s200: Number(value) })}
        />
        <TestCard
          title="400 m Test"
          time={input.t400}
          strokes={input.s400}
          onTime={(value) => update({ t400: value })}
          onStrokes={(value) => update({ s400: Number(value) })}
        />
      </div>

      <div className="surface p-5">
        <p className="mono mb-4 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          Optional
        </p>
        <Field label="50 m Sprintzeit" value={input.t50 ?? ""} onChange={(value) => update({ t50: value })} />
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={back}>
          Zurück
        </Button>
        <Button variant="primary" onClick={next}>
          Report anzeigen <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}

function TestCard({
  title,
  time,
  strokes,
  onTime,
  onStrokes,
}: {
  title: string;
  time: string;
  strokes: number;
  onTime: (value: string) => void;
  onStrokes: (value: string) => void;
}) {
  return (
    <div className="surface p-5">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Zeit" value={time} onChange={onTime} />
        <Field label="Züge pro Bahn" type="number" value={strokes} onChange={onStrokes} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
