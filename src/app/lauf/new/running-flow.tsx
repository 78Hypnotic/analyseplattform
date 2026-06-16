"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Lock, UserRound } from "lucide-react";
import { BodyFatVisualSelector } from "@/components/body-fat-visual-selector";
import { Button } from "@/components/button";
import { RunningReportView } from "@/components/running-report-view";
import { getBodyFatSexFromGender } from "@/lib/body-fat";
import { runRunningAnalysis } from "@/lib/running/calculations";
import { RUN_GOALS } from "@/lib/running/constants";
import { runInputSchema } from "@/lib/running/schema";
import type { RunInput } from "@/lib/running/types";
import {
  getRunValidationMessages,
  getRunValidationResult,
  type RunFieldKey,
  type RunValidationResult,
} from "@/lib/running/validation";
import { createRunAnalysis } from "../actions";

type RunDraft = {
  name: string;
  age: number | "";
  gender: RunInput["gender"] | "";
  height: number | "";
  weight: number | "";
  bodyFatPercentage: number | "";
  fitnessLevel: number | "";
  distance3min: number | "";
  distance12min: number | "";
  goal: RunInput["goal"] | "";
  raceDate: string;
  runSessionsPerWeek: number | "";
};

type BodyFatInputMode = "manual" | "visual";

const EMPTY_RUN_INPUT: RunDraft = {
  name: "",
  age: "",
  gender: "",
  height: "",
  weight: "",
  bodyFatPercentage: "",
  fitnessLevel: "",
  distance3min: "",
  distance12min: "",
  goal: "",
  raceDate: "",
  runSessionsPerWeek: "",
};

const FITNESS_LEVEL_OPTIONS = [
  { value: 1, label: "Anfänger" },
  { value: 2, label: "Fortgeschritten" },
  { value: 3, label: "Mittelstufe" },
  { value: 4, label: "Ambitioniert" },
  { value: 5, label: "Master" },
] as const;

export type InitialRunInput = Partial<
  Pick<RunDraft, "name" | "age" | "gender" | "height" | "weight" | "bodyFatPercentage" | "fitnessLevel">
>;

const PENDING_RUN_STORAGE_KEY = "pending-run-analysis-input";
const PENDING_RUN_NEXT_PATH = "/lauf/new?resume=1";
const DATA_STEP_FIELDS = [
  "name",
  "age",
  "gender",
  "height",
  "weight",
  "bodyFatPercentage",
  "fitnessLevel",
  "distance3min",
  "distance12min",
] satisfies RunFieldKey[];
const DATA_STEP_FIELD_SET = new Set<RunFieldKey>(DATA_STEP_FIELDS);
const FIELD_LABELS = {
  name: "Name",
  age: "Alter",
  gender: "Geschlecht",
  height: "Größe",
  weight: "Gewicht",
  bodyFatPercentage: "KFA",
  fitnessLevel: "Fitnesslevel",
  distance3min: "3-Minuten-Distanz",
  distance12min: "12-Minuten-Distanz",
  goal: "Ziel",
  raceDate: "Wettkampfdatum",
  runSessionsPerWeek: "Laufeinheiten pro Woche",
} satisfies Record<RunFieldKey, string>;

export function RunningFlow({
  initialInput,
  isAuthenticated,
  resumePendingAnalysis = false,
}: {
  initialInput?: InitialRunInput;
  isAuthenticated: boolean;
  resumePendingAnalysis?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<RunDraft>(() => ({ ...EMPTY_RUN_INPUT, ...initialInput }));
  const [bodyFatInputMode, setBodyFatInputMode] = useState<BodyFatInputMode>(
    initialInput?.bodyFatPercentage ? "manual" : "visual",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [validationScope, setValidationScope] = useState<"data" | "all" | null>(null);
  const [isPending, startTransition] = useTransition();
  const resumeStarted = useRef(false);

  const parsedInput = useMemo(() => {
    const parsed = runInputSchema.safeParse(input);
    return parsed.success ? parsed.data : null;
  }, [input]);
  const result = useMemo(() => (parsedInput ? runRunningAnalysis(parsedInput) : null), [parsedInput]);
  const validationMessages = useMemo(() => getRunValidationMessages(input), [input]);
  const validationResult = useMemo(() => getRunValidationResult(input), [input]);
  const visibleValidation = useMemo(
    () => getVisibleValidationResult(validationResult, validationScope),
    [validationResult, validationScope],
  );

  function update(patch: Partial<RunDraft>) {
    setInput((current) => ({ ...current, ...patch }));
    setMessage(null);
  }

  function goToContext() {
    const dataValidation = filterValidationResult(getRunValidationResult(input), DATA_STEP_FIELDS);
    setValidationScope("data");

    if (dataValidation.messages.length > 0) {
      focusFirstInvalidField(dataValidation.fieldErrors);
      return;
    }

    setValidationScope(null);
    setStep(1);
  }

  useEffect(() => {
    if (!resumePendingAnalysis || resumeStarted.current) return;
    resumeStarted.current = true;

    const pendingInput = readPendingRunInput();
    if (!pendingInput) return;

    startTransition(async () => {
      const state = await createRunAnalysis(pendingInput);
      if (state.ok) {
        clearPendingRunInput();
        router.replace(`/lauf/${state.id}`);
        return;
      }
      if (state.reason === "unauthenticated") {
        router.replace(`/login?next=${encodeURIComponent(PENDING_RUN_NEXT_PATH)}`);
        return;
      }
      setMessage(state.message);
    });
  }, [resumePendingAnalysis, router, startTransition]);

  function save() {
    setMessage(null);
    setValidationScope("all");

    const currentValidation = getRunValidationResult(input);
    if (currentValidation.messages.length > 0) {
      const firstInvalidField = getFirstInvalidField(currentValidation.fieldErrors);
      if (firstInvalidField && DATA_STEP_FIELD_SET.has(firstInvalidField)) {
        setStep(0);
      }
      focusFirstInvalidField(currentValidation.fieldErrors);
      return;
    }

    const parsed = runInputSchema.safeParse(input);
    if (!parsed.success) return;

    startTransition(async () => {
      const state = await createRunAnalysis(parsed.data);
      if (state.ok) {
        clearPendingRunInput();
        router.push(`/lauf/${state.id}`);
        return;
      }
      if (state.reason === "unauthenticated") {
        storePendingRunInput(parsed.data);
        router.push(`/login?next=${encodeURIComponent(PENDING_RUN_NEXT_PATH)}`);
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
            Neue Laufanalyse
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{["Testdaten", "Kontext"][step]}</h1>
        </div>
      </div>

      <FlowProgress
        currentStep={step}
        isAuthenticated={isAuthenticated}
        isSaving={isPending}
        onSelectStep={setStep}
      />

      {step === 0 ? (
        <DataStep
          input={input}
          update={update}
          validation={visibleValidation}
          bodyFatInputMode={bodyFatInputMode}
          setBodyFatInputMode={setBodyFatInputMode}
          next={goToContext}
          isPending={isPending}
        />
      ) : null}
      {step === 1 ? (
        <ContextStep
          input={input}
          update={update}
          validation={visibleValidation}
          message={message}
          back={() => setStep(0)}
          save={save}
          isPending={isPending}
        />
      ) : null}
      {step === 2 ? (
        <section className="space-y-6">
          {result && parsedInput ? (
            <RunningReportView input={parsedInput} result={result} />
          ) : (
            <div className="surface p-6">
              <h2 className="text-xl font-semibold">Daten nicht plausibel</h2>
              <p className="muted mt-2">Bitte prüfe diese Eingaben:</p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--warn)]">
                {(validationMessages.length > 0
                  ? validationMessages
                  : ["Die Testdistanzen passen nicht zusammen."]
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

function FlowProgress({
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
    { label: "Daten", action: () => onSelectStep(0) },
    { label: "Kontext", action: () => onSelectStep(1) },
    { label: "Report" },
  ];
  const activeStep = isSaving && isAuthenticated ? 2 : currentStep;

  return (
    <nav className="surface px-4 py-4 sm:px-5" aria-label="Analysefortschritt">
      <ol className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        {steps
          .map((item, index) => (
            <StepItem
              key={item.label}
              label={item.label}
              index={index}
              isActive={activeStep === index}
              isComplete={activeStep > index}
              onClick={item.action}
            />
          ))
          .flatMap((item, index) => {
            if (index === 0) return [item, <StepConnector key="connector-data-context" isActive={activeStep > 0} />];
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

function AccountGate({ isAuthenticated, isActive }: { isAuthenticated: boolean; isActive: boolean }) {
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

function DataStep({
  input,
  update,
  validation,
  bodyFatInputMode,
  setBodyFatInputMode,
  next,
  isPending,
}: {
  input: RunDraft;
  update: (patch: Partial<RunDraft>) => void;
  validation: RunValidationResult;
  bodyFatInputMode: BodyFatInputMode;
  setBodyFatInputMode: (mode: BodyFatInputMode) => void;
  next: () => void;
  isPending: boolean;
}) {
  const bodyFatSex = getBodyFatSexFromGender(input.gender);

  return (
    <section className="space-y-6">
      <ValidationSummary validation={validation} />

      <div className="surface p-5">
        <p className="mono mb-4 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          Testprotokoll
        </p>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--soft-bg)] p-3 text-sm">
          <p className="font-medium">Zwei All-Out-Tests</p>
          <p className="muted mt-1">
            Jeweils maximale Belastung über die volle Zeit auf flacher, vergleichbarer Strecke. Erfasst wird die
            zurückgelegte Distanz in Metern.
          </p>
        </div>
      </div>

      <div className="surface p-5">
        <p className="mono mb-4 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          Athlet
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Name" fieldKey="name" error={validation.fieldErrors.name} value={input.name} placeholder="z. B. Jonas Keller" onChange={(value) => update({ name: value })} />
          <Field label="Alter" fieldKey="age" error={validation.fieldErrors.age} type="number" value={input.age} placeholder="z. B. 34" onChange={(value) => update({ age: optionalNumber(value) })} />
          <GenderSegment value={input.gender} error={validation.fieldErrors.gender} onChange={(value) => update({ gender: value })} />
          <Field label="Größe (cm)" fieldKey="height" error={validation.fieldErrors.height} type="number" value={input.height} placeholder="z. B. 181" onChange={(value) => update({ height: optionalNumber(value) })} />
          <Field label="Gewicht (kg)" fieldKey="weight" error={validation.fieldErrors.weight} type="number" value={input.weight} placeholder="z. B. 74" onChange={(value) => update({ weight: optionalNumber(value) })} />
          <FitnessLevelSlider value={input.fitnessLevel} error={validation.fieldErrors.fitnessLevel} onChange={(value) => update({ fitnessLevel: value })} />
        </div>
        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--soft-bg)] p-5">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">Körperfettanteil</p>
              <h2 className="display-serif mt-2 text-3xl text-[var(--foreground)]">KFA erfassen</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                Optional. Wenn kein Messwert vorliegt, wähle die visuelle Schätzung.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-1 text-sm">
              <SegmentButton label="Eingeben" active={bodyFatInputMode === "manual"} onClick={() => setBodyFatInputMode("manual")} />
              <SegmentButton label="Visuell" active={bodyFatInputMode === "visual"} onClick={() => setBodyFatInputMode("visual")} />
            </div>
          </div>

          {bodyFatInputMode === "manual" ? (
            <div className="max-w-sm">
              <Field label="KFA (%)" fieldKey="bodyFatPercentage" error={validation.fieldErrors.bodyFatPercentage} type="number" value={input.bodyFatPercentage} placeholder="z. B. 14" onChange={(value) => update({ bodyFatPercentage: optionalNumber(value) })} />
            </div>
          ) : (
            <BodyFatVisualSelector
              sex={bodyFatSex}
              value={input.bodyFatPercentage}
              onSexChange={(nextSex) => update({ gender: nextSex === "male" ? "maennlich" : "weiblich" })}
              onValueChange={(value) => update({ bodyFatPercentage: value })}
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <TestCard
          title="3-Minuten-Test"
          subtitle="Maximale Distanz in 3 Minuten All-Out."
          value={input.distance3min}
          fieldKey="distance3min"
          error={validation.fieldErrors.distance3min}
          placeholder="z. B. 850"
          onChange={(value) => update({ distance3min: optionalNumber(value) })}
        />
        <TestCard
          title="12-Minuten-Test"
          subtitle="Maximale Distanz in 12 Minuten (Cooper-Test)."
          value={input.distance12min}
          fieldKey="distance12min"
          error={validation.fieldErrors.distance12min}
          placeholder="z. B. 3000"
          onChange={(value) => update({ distance12min: optionalNumber(value) })}
        />
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={next} disabled={isPending}>
          Weiter <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}

function ContextStep({
  input,
  update,
  validation,
  message,
  back,
  save,
  isPending,
}: {
  input: RunDraft;
  update: (patch: Partial<RunDraft>) => void;
  validation: RunValidationResult;
  message: string | null;
  back: () => void;
  save: () => void;
  isPending: boolean;
}) {
  return (
    <section className="space-y-6">
      <ValidationSummary validation={validation} fallbackMessage={message} />

      <div className="surface p-5">
        <p className="mono mb-4 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          Ziel
        </p>
        <div
          data-analysis-field="goal"
          className={
            validation.fieldErrors.goal
              ? "grid gap-3 rounded-lg border border-[var(--warn)] bg-[color-mix(in_oklab,var(--warn)_8%,transparent)] p-2 md:grid-cols-3"
              : "grid gap-3 md:grid-cols-3"
          }
        >
          {RUN_GOALS.map((goal) => (
            <button
              key={goal.id}
              type="button"
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
        <FieldErrorMessage message={validation.fieldErrors.goal} />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            label="Wettkampfdatum (optional)"
            value={input.raceDate}
            placeholder="JJJJ-MM-TT"
            fieldKey="raceDate"
            error={validation.fieldErrors.raceDate}
            onChange={(value) => update({ raceDate: value })}
          />
          <Field
            label="Laufeinheiten pro Woche"
            type="number"
            value={input.runSessionsPerWeek}
            placeholder="z. B. 3"
            fieldKey="runSessionsPerWeek"
            error={validation.fieldErrors.runSessionsPerWeek}
            onChange={(value) => update({ runSessionsPerWeek: optionalNumber(value) })}
          />
        </div>
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

function TestCard({
  title,
  subtitle,
  value,
  fieldKey,
  error,
  placeholder,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: number | "";
  fieldKey: RunFieldKey;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="surface min-w-0 overflow-hidden p-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="muted mt-1 text-sm">{subtitle}</p>
      <div className="mt-4 max-w-xs">
        <Field label="Distanz (m)" fieldKey={fieldKey} error={error} type="number" value={value} placeholder={placeholder} onChange={onChange} />
      </div>
    </div>
  );
}

function SegmentButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={
        active
          ? "rounded-md bg-[var(--brand-bg)] px-3 py-2.5 text-sm text-[var(--brand-fg)]"
          : "rounded-md px-3 py-2.5 text-sm text-[var(--muted)] transition hover:bg-[var(--soft-bg)] hover:text-[var(--foreground)]"
      }
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function GenderSegment({
  value,
  error,
  onChange,
}: {
  value: RunDraft["gender"];
  error?: string;
  onChange: (value: Exclude<RunDraft["gender"], "">) => void;
}) {
  const options = [
    { value: "weiblich", label: "Weiblich" },
    { value: "maennlich", label: "Männlich" },
    { value: "divers", label: "Divers" },
  ] as const;

  return (
    <div className="grid gap-2 text-sm" data-analysis-field="gender">
      <span>Geschlecht</span>
      <div
        className={
          error
            ? "grid grid-cols-3 gap-1 rounded-lg border border-[var(--warn)] bg-[color-mix(in_oklab,var(--warn)_8%,var(--panel-2))] p-1"
            : "grid grid-cols-3 gap-1 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-1"
        }
      >
        {options.map((option) => (
          <SegmentButton key={option.value} label={option.label} active={value === option.value} onClick={() => onChange(option.value)} />
        ))}
      </div>
      <FieldErrorMessage message={error} />
    </div>
  );
}

function FitnessLevelSlider({
  value,
  error,
  onChange,
}: {
  value: number | "";
  error?: string;
  onChange: (value: number | "") => void;
}) {
  const sliderValue = value === "" ? 3 : value;
  const progress = ((sliderValue - 1) / 4) * 100;
  const meta = FITNESS_LEVEL_OPTIONS.find((item) => item.value === sliderValue) ?? FITNESS_LEVEL_OPTIONS[2];

  return (
    <div className="grid gap-2 text-sm md:col-span-2" data-analysis-field="fitnessLevel">
      <div className="flex items-center justify-between gap-3">
        <span>Fitnesslevel</span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="mono text-xs text-[var(--muted)]">
            {value === "" ? "nicht erfasst" : `${meta.label} · ${value}/5`}
          </span>
          {value !== "" ? (
            <button
              type="button"
              className="text-xs text-[var(--subtle)] underline underline-offset-4 hover:text-[var(--foreground)]"
              onClick={() => onChange("")}
            >
              Zurücksetzen
            </button>
          ) : null}
        </div>
      </div>
      <div
        className={
          error
            ? "rounded-lg border border-[var(--warn)] bg-[color-mix(in_oklab,var(--warn)_8%,var(--panel-2))] px-3 py-2.5"
            : "rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5"
        }
      >
        <div className="relative h-6">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-[color-mix(in_oklab,var(--accent)_70%,var(--line))]" />
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--brand-bg)] bg-[var(--panel-2)] shadow-md shadow-[var(--shadow-color)]"
            style={{ left: `${progress}%` }}
          />
          <input
            aria-label="Fitnesslevel"
            aria-invalid={Boolean(error)}
            type="range"
            min={1}
            max={5}
            step={1}
            value={sliderValue}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={(event) => onChange(Number(event.target.value))}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] uppercase tracking-[0.12em] text-[var(--subtle)]">
          <span>Anfänger</span>
          <span>{value === "" ? "optional" : meta.label}</span>
          <span>Master</span>
        </div>
      </div>
      <FieldErrorMessage message={error} />
    </div>
  );
}

function Field({
  label,
  fieldKey,
  error,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  fieldKey: RunFieldKey;
  error?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm" data-analysis-field={fieldKey}>
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={
          error
            ? "w-full min-w-0 border-[var(--warn)] bg-[color-mix(in_oklab,var(--warn)_8%,var(--panel-2))]"
            : "w-full min-w-0"
        }
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldErrorMessage message={error} />
    </label>
  );
}

function ValidationSummary({
  validation,
  fallbackMessage,
}: {
  validation: RunValidationResult;
  fallbackMessage?: string | null;
}) {
  if (validation.messages.length === 0 && !fallbackMessage) return null;

  return (
    <div
      className="surface border-[var(--warn)] bg-[color-mix(in_oklab,var(--warn)_8%,var(--panel))] p-4 text-sm text-[var(--warn)]"
      aria-live="polite"
    >
      {validation.messages.length > 0 ? (
        <>
          <p className="font-medium">Bitte prüfe diese Eingaben:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {validation.messages.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ) : (
        fallbackMessage
      )}
    </div>
  );
}

function FieldErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs text-[var(--warn)]">{message}</span>;
}

function getVisibleValidationResult(
  validation: RunValidationResult,
  scope: "data" | "all" | null,
): RunValidationResult {
  if (!scope) return { messages: [], fieldErrors: {} };
  if (scope === "all") return validation;
  return filterValidationResult(validation, DATA_STEP_FIELDS);
}

function filterValidationResult(
  validation: RunValidationResult,
  fields: readonly RunFieldKey[],
): RunValidationResult {
  const fieldErrors: Partial<Record<RunFieldKey, string>> = {};
  const messages: string[] = [];

  for (const field of fields) {
    const error = validation.fieldErrors[field];
    if (!error) continue;
    fieldErrors[field] = error;
    messages.push(`${FIELD_LABELS[field]}: ${error}`);
  }

  return { messages, fieldErrors };
}

function focusFirstInvalidField(fieldErrors: Partial<Record<RunFieldKey, string>>) {
  const firstField = getFirstInvalidField(fieldErrors);
  if (!firstField) return;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const field = document.querySelector<HTMLElement>(`[data-analysis-field="${firstField}"]`);
      const focusTarget = field?.matches("input,button,select,textarea")
        ? field
        : field?.querySelector<HTMLElement>("input,button,select,textarea,[tabindex]");
      focusTarget?.focus();
      field?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  });
}

function getFirstInvalidField(fieldErrors: Partial<Record<RunFieldKey, string>>) {
  const orderedFields = [
    ...DATA_STEP_FIELDS,
    ...(Object.keys(FIELD_LABELS) as RunFieldKey[]).filter((field) => !DATA_STEP_FIELD_SET.has(field)),
  ];
  return orderedFields.find((field) => fieldErrors[field]) ?? null;
}

function optionalNumber(value: string) {
  return value === "" ? "" : Number(value);
}

function storePendingRunInput(input: RunInput) {
  window.sessionStorage.setItem(PENDING_RUN_STORAGE_KEY, JSON.stringify(input));
}

function clearPendingRunInput() {
  window.sessionStorage.removeItem(PENDING_RUN_STORAGE_KEY);
}

function readPendingRunInput() {
  const rawInput = window.sessionStorage.getItem(PENDING_RUN_STORAGE_KEY);
  if (!rawInput) return null;

  try {
    const parsedInput = runInputSchema.safeParse(JSON.parse(rawInput));
    return parsedInput.success ? parsedInput.data : null;
  } catch {
    return null;
  }
}
