"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Lock, UserRound } from "lucide-react";
import { Button } from "@/components/button";
import { ReportView } from "@/components/report-view";
import { CHALLENGE_GROUPS, GOALS, LEVELS, TARGET_DISTANCES } from "@/lib/analysis/constants";
import { runAnalysis } from "@/lib/analysis/calculations";
import { analysisInputSchema } from "@/lib/analysis/schema";
import type { AnalysisInput } from "@/lib/analysis/types";
import { getAnalysisValidationMessages } from "@/lib/analysis/validation";
import { createAnalysis } from "../actions";

type AnalysisDraft = Omit<
  AnalysisInput,
  "age" | "gender" | "height" | "weight" | "bodyFatPercentage" | "fitnessLevel" | "poolLength" | "s200" | "s400" | "goal" | "level"
  | "targetDistance" | "swimSessionsPerWeek"
> & {
  age: number | "";
  gender: AnalysisInput["gender"] | "";
  height: number | "";
  weight: number | "";
  bodyFatPercentage: number | "";
  fitnessLevel: number | "";
  poolLength: AnalysisInput["poolLength"] | "";
  s200: number | "";
  s400: number | "";
  goal: AnalysisInput["goal"] | "";
  level: AnalysisInput["level"] | "";
  targetDistance: AnalysisInput["targetDistance"] | "";
  swimSessionsPerWeek: number | "";
};

const EMPTY_ANALYSIS_INPUT: AnalysisDraft = {
  name: "",
  age: "",
  gender: "",
  height: "",
  weight: "",
  bodyFatPercentage: "",
  fitnessLevel: "",
  poolLength: "",
  t200: "",
  s200: "",
  t400: "",
  s400: "",
  t50: "",
  goal: "",
  level: "",
  targetDistance: "",
  raceDate: "",
  swimSessionsPerWeek: "",
  challenges: [],
};

export type InitialAnalysisInput = Partial<
  Pick<AnalysisDraft, "name" | "age" | "gender" | "height" | "weight" | "bodyFatPercentage" | "fitnessLevel">
>;

const PENDING_ANALYSIS_STORAGE_KEY = "pending-analysis-input";
const PENDING_ANALYSIS_NEXT_PATH = "/analyse/new?resume=1";

export function AnalysisFlow({
  initialInput,
  isAuthenticated,
  resumePendingAnalysis = false,
}: {
  initialInput?: InitialAnalysisInput;
  isAuthenticated: boolean;
  resumePendingAnalysis?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<AnalysisDraft>(() => ({
    ...EMPTY_ANALYSIS_INPUT,
    ...initialInput,
  }));
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const resumeStarted = useRef(false);
  const parsedInput = useMemo(() => {
    const parsed = analysisInputSchema.safeParse(input);
    return parsed.success ? parsed.data : null;
  }, [input]);
  const result = useMemo(() => (parsedInput ? runAnalysis(parsedInput) : null), [parsedInput]);
  const validationMessages = useMemo(() => getAnalysisValidationMessages(input), [input]);

  function update(patch: Partial<AnalysisDraft>) {
    setInput((current) => ({ ...current, ...patch }));
  }

  useEffect(() => {
    if (!resumePendingAnalysis || resumeStarted.current) return;
    resumeStarted.current = true;

    const pendingInput = readPendingAnalysisInput();
    if (!pendingInput) return;

    startTransition(async () => {
      const state = await createAnalysis(pendingInput);
      if (state.ok) {
        clearPendingAnalysisInput();
        router.replace(`/analyse/${state.id}`);
        return;
      }

      if (state.reason === "unauthenticated") {
        router.replace(`/login?next=${encodeURIComponent(PENDING_ANALYSIS_NEXT_PATH)}`);
        return;
      }

      setMessage(state.message);
    });
  }, [resumePendingAnalysis, router, startTransition]);

  function save() {
    setMessage(null);

    if (!parsedInput) {
      setMessage(validationMessages[0] ?? "Bitte fülle alle Pflichtfelder mit plausiblen Werten aus.");
      return;
    }

    startTransition(async () => {
      const state = await createAnalysis(parsedInput);
      if (state.ok) {
        clearPendingAnalysisInput();
        router.push(`/analyse/${state.id}`);
        return;
      }
      if (state.reason === "unauthenticated") {
        storePendingAnalysisInput(parsedInput);
        router.push(`/login?next=${encodeURIComponent(PENDING_ANALYSIS_NEXT_PATH)}`);
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
            {["Kontext", "Testdaten"][step]}
          </h1>
        </div>
      </div>

      <AnalysisProgress
        currentStep={step}
        isAuthenticated={isAuthenticated}
        isSaving={isPending}
        onSelectStep={setStep}
      />

      {step === 0 ? (
        <ContextStep input={input} update={update} next={() => setStep(1)} />
      ) : null}
      {step === 1 ? (
        <DataStep
          input={input}
          update={update}
          back={() => setStep(0)}
          save={save}
          isPending={isPending}
        />
      ) : null}
      {step === 2 ? (
        <section className="space-y-6">
          {result && parsedInput ? (
            <ReportView input={parsedInput} result={result} />
          ) : (
            <div className="surface p-6">
              <h2 className="text-xl font-semibold">Daten nicht plausibel</h2>
              <p className="muted mt-2">Bitte prüfe diese Eingaben:</p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--warn)]">
                {(validationMessages.length > 0
                  ? validationMessages
                  : ["Zeiten und Zugzahlen passen nicht zusammen."]
                ).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
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

function AnalysisProgress({
  currentStep,
  isAuthenticated,
  isSaving,
  onSelectStep,
}: {
  currentStep: number;
  isAuthenticated: boolean;
  isSaving: boolean;
  onSelectStep: (step: number) => void;
}) {
  const steps = [
    { label: "Kontext", action: () => onSelectStep(0) },
    { label: "Daten", action: () => onSelectStep(1) },
    { label: "Report" },
  ];
  const activeStep = isSaving && isAuthenticated ? 2 : currentStep;

  return (
    <nav className="surface px-4 py-4 sm:px-5" aria-label="Analysefortschritt">
      <ol className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        {steps.map((item, index) => (
          <StepItem
            key={item.label}
            label={item.label}
            index={index}
            isActive={activeStep === index}
            isComplete={activeStep > index}
            onClick={item.action}
          />
        )).flatMap((item, index) => {
          if (index === 0) return [item, <StepConnector key="connector-context-data" isActive={activeStep > 0} />];
          if (index === 1) {
            return [
              item,
              <AccountGate
                key="connector-data-report"
                isAuthenticated={isAuthenticated}
                isActive={isSaving || activeStep > 1}
              />,
            ];
          }
          return [item];
        })}
      </ol>
    </nav>
  );
}

function StepItem({
  label,
  index,
  isActive,
  isComplete,
  onClick,
}: {
  label: string;
  index: number;
  isActive: boolean;
  isComplete: boolean;
  onClick?: () => void;
}) {
  const stateLabel = isComplete ? "abgeschlossen" : isActive ? "aktiv" : "offen";
  const className = isActive
    ? "border-[var(--accent)] bg-[var(--accent-ring)] text-[var(--foreground)]"
    : isComplete
      ? "border-[var(--accent)] bg-[var(--panel-2)] text-[var(--foreground)]"
      : "border-[var(--line)] bg-[var(--soft-bg)] text-[var(--muted)]";
  const content = (
    <>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-current text-xs">
        {isComplete ? <Check size={14} /> : index + 1}
      </span>
      <span className="min-w-0">
        <span className="mono block text-[0.65rem] uppercase tracking-[0.14em] text-[var(--subtle)]">
          {stateLabel}
        </span>
        <span className="block truncate text-sm font-medium">{label}</span>
      </span>
    </>
  );

  if (!onClick) {
    return (
      <li
        className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 ${className}`}
        aria-current={isActive ? "step" : undefined}
      >
        {content}
      </li>
    );
  }

  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={onClick}
        aria-current={isActive ? "step" : undefined}
        className={`flex w-full min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left ${className}`}
      >
        {content}
      </button>
    </li>
  );
}

function StepConnector({ isActive }: { isActive: boolean }) {
  return (
    <li
      className={
        isActive
          ? "h-px min-w-5 bg-[var(--accent)] sm:min-w-8"
          : "h-px min-w-5 bg-[var(--line)] sm:min-w-8"
      }
      aria-hidden="true"
    />
  );
}

function AccountGate({
  isAuthenticated,
  isActive,
}: {
  isAuthenticated: boolean;
  isActive: boolean;
}) {
  const label = isAuthenticated ? "Profil verbunden" : "Login erforderlich";

  return (
    <li
      className={
        isActive || isAuthenticated
          ? "flex min-w-14 items-center justify-center gap-1 rounded-full border border-[var(--accent)] bg-[var(--panel-2)] px-2 py-2 text-[var(--accent)]"
          : "flex min-w-14 items-center justify-center gap-1 rounded-full border border-[var(--line)] bg-[var(--soft-bg)] px-2 py-2 text-[var(--muted)]"
      }
      aria-label={label}
      title={label}
    >
      {isAuthenticated ? <Check size={14} aria-hidden="true" /> : <Lock size={14} aria-hidden="true" />}
      <UserRound size={14} aria-hidden="true" />
    </li>
  );
}

function ContextStep({
  input,
  update,
  next,
}: {
  input: AnalysisDraft;
  update: (patch: Partial<AnalysisDraft>) => void;
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
                  : "rounded-lg border border-[var(--line)] bg-[var(--soft-bg)] p-4 text-left"
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
                  : "rounded-lg border border-[var(--line)] bg-[var(--soft-bg)] p-4 text-left"
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
          Zielwettkampf
        </p>
        <div className="grid gap-3 md:grid-cols-6">
          {TARGET_DISTANCES.map((distance) => (
            <button
              key={distance.id}
              onClick={() => update({ targetDistance: distance.id })}
              className={
                input.targetDistance === distance.id
                  ? "rounded-lg border border-[var(--accent)] bg-[var(--panel-2)] p-4 text-left"
                  : "rounded-lg border border-[var(--line)] bg-[var(--soft-bg)] p-4 text-left"
              }
            >
              <span className="block font-medium">{distance.label}</span>
              <span className="muted mt-2 block text-sm">{distance.description}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            label="Wettkampfdatum (optional)"
            type="date"
            value={input.raceDate ?? ""}
            onChange={(value) => update({ raceDate: value })}
          />
          <Field
            label="Schwimmeinheiten pro Woche"
            type="number"
            value={input.swimSessionsPerWeek}
            placeholder="z. B. 3"
            onChange={(value) => update({ swimSessionsPerWeek: optionalNumber(value) })}
          />
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
  save,
  isPending,
}: {
  input: AnalysisDraft;
  update: (patch: Partial<AnalysisDraft>) => void;
  back: () => void;
  save: () => void;
  isPending: boolean;
}) {
  return (
    <section className="space-y-6">
      <div className="surface p-5">
        <p className="mono mb-4 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          Athlet
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Name" value={input.name} placeholder="z. B. Lena Bergmann" onChange={(value) => update({ name: value })} />
          <Field label="Alter" type="number" value={input.age} placeholder="z. B. 34" onChange={(value) => update({ age: optionalNumber(value) })} />
          <label className="grid gap-2 text-sm">
            Geschlecht
            <select value={input.gender} onChange={(event) => update({ gender: event.target.value as AnalysisDraft["gender"] })}>
              <option value="" disabled>Auswählen</option>
              <option value="weiblich">weiblich</option>
              <option value="maennlich">männlich</option>
              <option value="divers">divers</option>
            </select>
          </label>
          <Field label="Größe (cm)" type="number" value={input.height} placeholder="z. B. 172" onChange={(value) => update({ height: optionalNumber(value) })} />
          <Field label="Gewicht (kg)" type="number" value={input.weight} placeholder="z. B. 63" onChange={(value) => update({ weight: optionalNumber(value) })} />
          <Field label="KFA (%)" type="number" value={input.bodyFatPercentage} placeholder="z. B. 21.5" onChange={(value) => update({ bodyFatPercentage: optionalNumber(value) })} />
          <FitnessLevelSlider value={input.fitnessLevel} onChange={(value) => update({ fitnessLevel: value })} />
          <label className="grid gap-2 text-sm">
            Becken
            <select value={input.poolLength} onChange={(event) => update({ poolLength: optionalNumber(event.target.value) as AnalysisDraft["poolLength"] })}>
              <option value="" disabled>Auswählen</option>
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
          onStrokes={(value) => update({ s200: optionalNumber(value) })}
        />
        <TestCard
          title="400 m Test"
          time={input.t400}
          strokes={input.s400}
          onTime={(value) => update({ t400: value })}
          onStrokes={(value) => update({ s400: optionalNumber(value) })}
        />
      </div>

      <div className="surface p-5">
        <p className="mono mb-4 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          Optional
        </p>
        <Field label="50 m Sprintzeit" value={input.t50 ?? ""} placeholder="z. B. 38.2" onChange={(value) => update({ t50: value })} />
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={back}>
          Zurück
        </Button>
        <Button variant="primary" onClick={save} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
          Report anzeigen
        </Button>
      </div>
    </section>
  );
}

function FitnessLevelSlider({
  value,
  onChange,
}: {
  value: number | "";
  onChange: (value: number | "") => void;
}) {
  return (
    <div className="grid gap-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span>Fitnesslevel</span>
        <span className="mono text-xs text-[var(--muted)]">
          {value === "" ? "nicht erfasst" : `${value}/5`}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value === "" ? 3 : value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <button
        type="button"
        className="justify-self-start text-sm text-[var(--muted)] underline underline-offset-4 hover:text-[var(--foreground)]"
        onClick={() => onChange("")}
      >
        Fitnesslevel zurücksetzen
      </button>
    </div>
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
  strokes: number | "";
  onTime: (value: string) => void;
  onStrokes: (value: string) => void;
}) {
  return (
    <div className="surface p-5">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Zeit" value={time} placeholder={title.startsWith("200") ? "z. B. 3:38" : "z. B. 7:48"} onChange={onTime} />
        <Field label="Züge pro Bahn" type="number" value={strokes} placeholder={title.startsWith("200") ? "z. B. 21" : "z. B. 22.5"} onChange={onStrokes} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function optionalNumber(value: string) {
  return value === "" ? "" : Number(value);
}

function storePendingAnalysisInput(input: AnalysisInput) {
  window.sessionStorage.setItem(PENDING_ANALYSIS_STORAGE_KEY, JSON.stringify(input));
}

function clearPendingAnalysisInput() {
  window.sessionStorage.removeItem(PENDING_ANALYSIS_STORAGE_KEY);
}

function readPendingAnalysisInput() {
  const rawInput = window.sessionStorage.getItem(PENDING_ANALYSIS_STORAGE_KEY);
  if (!rawInput) return null;

  try {
    const parsedInput = analysisInputSchema.safeParse(JSON.parse(rawInput));
    return parsedInput.success ? parsedInput.data : null;
  } catch {
    return null;
  }
}
