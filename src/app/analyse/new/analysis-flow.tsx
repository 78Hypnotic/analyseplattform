"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Loader2, Lock, UserRound } from "lucide-react";
import { BodyFatVisualSelector } from "@/components/body-fat-visual-selector";
import { Button } from "@/components/button";
import { ReportView } from "@/components/report-view";
import { getBodyFatSexFromGender } from "@/lib/body-fat";
import { CHALLENGE_GROUPS, GOALS, TARGET_DISTANCES } from "@/lib/analysis/constants";
import { runAnalysis } from "@/lib/analysis/calculations";
import { analysisInputSchema } from "@/lib/analysis/schema";
import type { AnalysisInput } from "@/lib/analysis/types";
import {
  getAnalysisValidationMessages,
  getAnalysisValidationResult,
  type AnalysisFieldKey,
  type AnalysisValidationResult,
} from "@/lib/analysis/validation";
import { createAnalysis } from "../actions";

type AnalysisDraft = Omit<
  AnalysisInput,
  "age" | "gender" | "height" | "weight" | "bodyFatPercentage" | "fitnessLevel" | "poolLength" | "canSwim400m" | "testType" | "equipment" | "s50" | "s200" | "s400" | "goal" | "level"
  | "targetDistance" | "swimSessionsPerWeek"
> & {
  age: number | "";
  gender: AnalysisInput["gender"] | "";
  height: number | "";
  weight: number | "";
  bodyFatPercentage: number | "";
  fitnessLevel: number | "";
  poolLength: AnalysisInput["poolLength"] | "";
  canSwim400m: boolean;
  testType: AnalysisInput["testType"] | "";
  equipment: AnalysisInput["equipment"] | "";
  s50: number | "";
  s200: number | "";
  s400: number | "";
  goal: AnalysisInput["goal"] | "";
  level: AnalysisInput["level"] | "";
  targetDistance: AnalysisInput["targetDistance"] | "";
  swimSessionsPerWeek: number | "";
};

type BodyFatInputMode = "manual" | "visual";

const EMPTY_ANALYSIS_INPUT: AnalysisDraft = {
  name: "",
  age: "",
  gender: "",
  height: "",
  weight: "",
  bodyFatPercentage: "",
  fitnessLevel: "",
  poolLength: "",
  canSwim400m: true,
  testType: "wall_push",
  equipment: "ohne",
  t50: "",
  s50: "",
  t200: "",
  s200: "",
  t400: "",
  s400: "",
  goal: "",
  level: "Fortgeschritten",
  targetDistance: "",
  raceDate: "",
  swimSessionsPerWeek: "",
  challenges: [],
};

const TARGET_DISTANCES_BY_GOAL = {
  "Kraulen lernen": ["Becken"],
  Beckenschwimmen: ["Sprint", "Becken"],
  Freiwasserschwimmen: ["Freiwasser"],
  Triathlon: ["Sprint", "OD", "MD", "LD"],
} satisfies Record<AnalysisInput["goal"], NonNullable<AnalysisInput["targetDistance"]>[]>;

const FITNESS_LEVEL_OPTIONS = [
  {
    value: 1,
    label: "Anfänger",
  },
  {
    value: 2,
    label: "Fortgeschritten",
  },
  {
    value: 3,
    label: "Mittelstufe",
  },
  {
    value: 4,
    label: "Ambitioniert",
  },
  {
    value: 5,
    label: "Master",
  },
] as const;

export type InitialAnalysisInput = Partial<
  Pick<AnalysisDraft, "name" | "age" | "gender" | "height" | "weight" | "bodyFatPercentage" | "fitnessLevel">
>;

const PENDING_ANALYSIS_STORAGE_KEY = "pending-analysis-input";
const PENDING_ANALYSIS_NEXT_PATH = "/analyse/new?resume=1";
const DATA_STEP_FIELDS = [
  "name",
  "age",
  "gender",
  "height",
  "weight",
  "bodyFatPercentage",
  "fitnessLevel",
  "poolLength",
  "canSwim400m",
  "testType",
  "equipment",
  "t50",
  "s50",
  "t200",
  "s200",
  "t400",
  "s400",
] satisfies AnalysisFieldKey[];
const DATA_STEP_FIELD_SET = new Set<AnalysisFieldKey>(DATA_STEP_FIELDS);
const FIELD_LABELS = {
  name: "Name",
  age: "Alter",
  gender: "Geschlecht",
  height: "Größe",
  weight: "Gewicht",
  bodyFatPercentage: "KFA",
  fitnessLevel: "Fitnesslevel",
  poolLength: "Becken",
  canSwim400m: "400 m am Stück",
  testType: "Testart",
  equipment: "Hilfsmittel",
  t50: "50 m Zeit",
  s50: "50 m Züge pro Bahn",
  t200: "200 m Zeit",
  s200: "200 m Züge pro Bahn",
  t400: "400 m Zeit",
  s400: "400 m Züge pro Bahn",
  goal: "Ziel",
  level: "Niveau",
  targetDistance: "Zielwettkampf",
  raceDate: "Wettkampfdatum",
  swimSessionsPerWeek: "Schwimmeinheiten pro Woche",
  challenges: "Technische Herausforderungen",
} satisfies Record<AnalysisFieldKey, string>;

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
  const [bodyFatInputMode, setBodyFatInputMode] = useState<BodyFatInputMode>(initialInput?.bodyFatPercentage ? "manual" : "visual");
  const [message, setMessage] = useState<string | null>(null);
  const [validationScope, setValidationScope] = useState<"data" | "all" | null>(null);
  const [isPending, startTransition] = useTransition();
  const resumeStarted = useRef(false);
  const parsedInput = useMemo(() => {
    const parsed = analysisInputSchema.safeParse(input);
    return parsed.success ? parsed.data : null;
  }, [input]);
  const result = useMemo(() => (parsedInput ? runAnalysis(parsedInput) : null), [parsedInput]);
  const validationMessages = useMemo(() => getAnalysisValidationMessages(input), [input]);
  const validationResult = useMemo(() => getAnalysisValidationResult(input), [input]);
  const visibleValidation = useMemo(
    () => getVisibleValidationResult(validationResult, validationScope),
    [validationResult, validationScope],
  );

  function update(patch: Partial<AnalysisDraft>) {
    setInput((current) => ({ ...current, ...patch }));
    setMessage(null);
  }

  function goToContext() {
    const dataValidation = filterValidationResult(getAnalysisValidationResult(input), DATA_STEP_FIELDS);
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
    setValidationScope("all");

    const currentValidation = getAnalysisValidationResult(input);
    if (currentValidation.messages.length > 0) {
      const firstInvalidField = getFirstInvalidField(currentValidation.fieldErrors);
      if (firstInvalidField && DATA_STEP_FIELD_SET.has(firstInvalidField)) {
        setStep(0);
      }
      focusFirstInvalidField(currentValidation.fieldErrors);
      return;
    }

    const parsed = analysisInputSchema.safeParse(input);
    if (!parsed.success) return;

    startTransition(async () => {
      const state = await createAnalysis(parsed.data);
      if (state.ok) {
        clearPendingAnalysisInput();
        router.push(`/analyse/${state.id}`);
        return;
      }
      if (state.reason === "unauthenticated") {
        storePendingAnalysisInput(parsed.data);
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
            {["Testdaten", "Kontext"][step]}
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
    { label: "Daten", action: () => onSelectStep(0) },
    { label: "Kontext", action: () => onSelectStep(1) },
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
  validation,
  message,
  back,
  save,
  isPending,
}: {
  input: AnalysisDraft;
  update: (patch: Partial<AnalysisDraft>) => void;
  validation: AnalysisValidationResult;
  message: string | null;
  back: () => void;
  save: () => void;
  isPending: boolean;
}) {
  function toggleChallenge(groupItems: readonly string[], item: string) {
    const active = input.challenges.includes(item);
    update({
      challenges: active
        ? input.challenges.filter((challenge) => challenge !== item)
        : [...input.challenges.filter((challenge) => !groupItems.includes(challenge)), item],
    });
  }

  function updateGoal(goal: AnalysisInput["goal"]) {
    const targetDistances = getTargetDistancesForGoal(goal);
    const fallbackTargetDistance = targetDistances[0]?.id ?? "";
    const nextTargetDistance = targetDistances.some((distance) => distance.id === input.targetDistance)
      ? input.targetDistance
      : fallbackTargetDistance;

    update({ goal, targetDistance: nextTargetDistance });
  }

  const targetDistances = getTargetDistancesForGoal(input.goal);

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
              ? "grid gap-3 rounded-lg border border-[var(--warn)] bg-[color-mix(in_oklab,var(--warn)_8%,transparent)] p-2 md:grid-cols-4"
              : "grid gap-3 md:grid-cols-4"
          }
        >
          {GOALS.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => updateGoal(goal.id)}
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
      </div>

      <div className="surface p-5">
        <p className="mono mb-4 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          Zielwettkampf
        </p>
        <div
          data-analysis-field="targetDistance"
          className={
            validation.fieldErrors.targetDistance
              ? "grid gap-3 rounded-lg border border-[var(--warn)] bg-[color-mix(in_oklab,var(--warn)_8%,transparent)] p-2 md:grid-cols-6"
              : "grid gap-3 md:grid-cols-6"
          }
        >
          {targetDistances.map((distance) => (
            <button
              key={distance.id}
              type="button"
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
        <FieldErrorMessage message={validation.fieldErrors.targetDistance} />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            label="Wettkampfdatum (optional)"
            value={input.raceDate ?? ""}
            placeholder="JJJJ-MM-TT"
            fieldKey="raceDate"
            error={validation.fieldErrors.raceDate}
            onChange={(value) => update({ raceDate: value })}
          />
          <Field
            label="Schwimmeinheiten pro Woche"
            type="number"
            value={input.swimSessionsPerWeek}
            placeholder="z. B. 3"
            fieldKey="swimSessionsPerWeek"
            error={validation.fieldErrors.swimSessionsPerWeek}
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
                      type="button"
                      data-analysis-field="challenges"
                      aria-pressed={active}
                      onClick={() => toggleChallenge(group.items, item)}
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
        <FieldErrorMessage message={validation.fieldErrors.challenges} />
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

function DataStep({
  input,
  update,
  validation,
  bodyFatInputMode,
  setBodyFatInputMode,
  next,
  isPending,
}: {
  input: AnalysisDraft;
  update: (patch: Partial<AnalysisDraft>) => void;
  validation: AnalysisValidationResult;
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
          Test-Setup
        </p>
        <div className="grid gap-5">
          <div className="grid gap-2 text-sm">
            <span>400 m am Stück möglich?</span>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-1">
              <SegmentButton
                label="Ja"
                active={input.canSwim400m}
                onClick={() => update({ canSwim400m: true })}
              />
              <SegmentButton
                label="Nein"
                active={!input.canSwim400m}
                onClick={() => update({ canSwim400m: false, t400: "", s400: "" })}
              />
            </div>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--soft-bg)] p-3 text-sm">
            <p className="font-medium">Testart: Abstoß von der Wand</p>
            <p className="muted mt-1">
              Schwimmen immer mit Abstoß vom Beckenrand. Maximal ein Delfinbeinschlag unter Wasser nach Abstoß und Wende, damit die Zeiten vergleichbar bleiben.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--warn)] bg-[color-mix(in_oklab,var(--warn)_10%,var(--panel))] p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--warn)]" />
              <p className="text-sm font-medium">
                Ohne Hilfsmittel testen: kein Pullbuoy, kein Neo, keine Paddles.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="surface p-5">
        <p className="mono mb-4 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          Athlet
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Name" fieldKey="name" error={validation.fieldErrors.name} value={input.name} placeholder="z. B. Lena Bergmann" onChange={(value) => update({ name: value })} />
          <Field label="Alter" fieldKey="age" error={validation.fieldErrors.age} type="number" value={input.age} placeholder="z. B. 34" onChange={(value) => update({ age: optionalNumber(value) })} />
          <GenderSegment value={input.gender} error={validation.fieldErrors.gender} onChange={(value) => update({ gender: value })} />
          <Field label="Größe (cm)" fieldKey="height" error={validation.fieldErrors.height} type="number" value={input.height} placeholder="z. B. 172" onChange={(value) => update({ height: optionalNumber(value) })} />
          <Field label="Gewicht (kg)" fieldKey="weight" error={validation.fieldErrors.weight} type="number" value={input.weight} placeholder="z. B. 63" onChange={(value) => update({ weight: optionalNumber(value) })} />
          <FitnessLevelSlider value={input.fitnessLevel} error={validation.fieldErrors.fitnessLevel} onChange={(value) => update({ fitnessLevel: value })} />
          <PoolLengthSegment value={input.poolLength} error={validation.fieldErrors.poolLength} onChange={(value) => update({ poolLength: value })} />
        </div>
        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--soft-bg)] p-5">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">Körperfettanteil</p>
              <h2 className="display-serif mt-2 text-3xl text-[var(--foreground)]">KFA erfassen</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                Wenn kein Messwert vorliegt, wähle die visuelle Schätzung.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-1 text-sm">
              <SegmentButton
                label="Eingeben"
                active={bodyFatInputMode === "manual"}
                onClick={() => setBodyFatInputMode("manual")}
              />
              <SegmentButton
                label="Visuell"
                active={bodyFatInputMode === "visual"}
                onClick={() => setBodyFatInputMode("visual")}
              />
            </div>
          </div>

          {bodyFatInputMode === "manual" ? (
            <div className="max-w-sm">
              <Field label="KFA (%)" fieldKey="bodyFatPercentage" error={validation.fieldErrors.bodyFatPercentage} type="number" value={input.bodyFatPercentage} placeholder="z. B. 21.5" onChange={(value) => update({ bodyFatPercentage: optionalNumber(value) })} />
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="surface min-w-0 overflow-hidden p-5">
          <h2 className="mb-4 text-xl font-semibold">50 m Test</h2>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Field label="Zeit" fieldKey="t50" error={validation.fieldErrors.t50} value={input.t50} placeholder="z. B. 38.2" onChange={(value) => update({ t50: value })} />
            <Field label="Züge pro Bahn optional" fieldKey="s50" error={validation.fieldErrors.s50} type="number" value={input.s50} placeholder="z. B. 22" onChange={(value) => update({ s50: optionalNumber(value) })} />
          </div>
        </div>
        <TestCard
          title="200 m Test"
          time={input.t200}
          strokes={input.s200}
          timeFieldKey="t200"
          strokesFieldKey="s200"
          timeError={validation.fieldErrors.t200}
          strokesError={validation.fieldErrors.s200}
          onTime={(value) => update({ t200: value })}
          onStrokes={(value) => update({ s200: optionalNumber(value) })}
        />
        {input.canSwim400m ? (
          <TestCard
            title="400 m Test"
            time={input.t400 ?? ""}
            strokes={input.s400 ?? ""}
            timeFieldKey="t400"
            strokesFieldKey="s400"
            timeError={validation.fieldErrors.t400}
            strokesError={validation.fieldErrors.s400}
            onTime={(value) => update({ t400: value })}
            onStrokes={(value) => update({ s400: optionalNumber(value) })}
          />
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={next} disabled={isPending}>
          Weiter <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}

function getTargetDistancesForGoal(goal: AnalysisDraft["goal"]) {
  if (!goal) return TARGET_DISTANCES;
  const allowedDistances = new Set(TARGET_DISTANCES_BY_GOAL[goal]);
  return TARGET_DISTANCES.filter((distance) => allowedDistances.has(distance.id));
}

function SegmentButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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
  value: AnalysisDraft["gender"];
  error?: string;
  onChange: (value: Exclude<AnalysisDraft["gender"], "">) => void;
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
          <SegmentButton
            key={option.value}
            label={option.label}
            active={value === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
      <FieldErrorMessage message={error} />
    </div>
  );
}

function PoolLengthSegment({
  value,
  error,
  onChange,
}: {
  value: AnalysisDraft["poolLength"];
  error?: string;
  onChange: (value: Exclude<AnalysisDraft["poolLength"], "">) => void;
}) {
  const options = [25, 50] as const;

  return (
    <div className="grid gap-2 text-sm" data-analysis-field="poolLength">
      <span>Becken</span>
      <div
        className={
          error
            ? "grid grid-cols-2 gap-1 rounded-lg border border-[var(--warn)] bg-[color-mix(in_oklab,var(--warn)_8%,var(--panel-2))] p-1"
            : "grid grid-cols-2 gap-1 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-1"
        }
      >
        {options.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              className={
                active
                  ? "rounded-md bg-[var(--brand-bg)] px-3 py-2.5 text-sm text-[var(--brand-fg)]"
                  : "rounded-md px-3 py-2.5 text-sm text-[var(--muted)] transition hover:bg-[var(--soft-bg)] hover:text-[var(--foreground)]"
              }
              onClick={() => onChange(option)}
            >
              {option} m
            </button>
          );
        })}
      </div>
      <FieldErrorMessage message={error} />
    </div>
  );
}

/**
 * Renders the optional fitness self-assessment as a compact custom slider in the athlete grid.
 */
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

function TestCard({
  title,
  time,
  strokes,
  timeFieldKey,
  strokesFieldKey,
  timeError,
  strokesError,
  onTime,
  onStrokes,
}: {
  title: string;
  time: string;
  strokes: number | "";
  timeFieldKey: AnalysisFieldKey;
  strokesFieldKey: AnalysisFieldKey;
  timeError?: string;
  strokesError?: string;
  onTime: (value: string) => void;
  onStrokes: (value: string) => void;
}) {
  return (
    <div className="surface min-w-0 overflow-hidden p-5">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Field label="Zeit" fieldKey={timeFieldKey} error={timeError} value={time} placeholder={title.startsWith("200") ? "z. B. 3:38" : "z. B. 7:48"} onChange={onTime} />
        <Field label="Züge pro Bahn" fieldKey={strokesFieldKey} error={strokesError} type="number" value={strokes} placeholder={title.startsWith("200") ? "z. B. 21" : "z. B. 22.5"} onChange={onStrokes} />
      </div>
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
  fieldKey: AnalysisFieldKey;
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
  validation: AnalysisValidationResult;
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
  validation: AnalysisValidationResult,
  scope: "data" | "all" | null,
): AnalysisValidationResult {
  if (!scope) return { messages: [], fieldErrors: {} };
  if (scope === "all") return validation;
  return filterValidationResult(validation, DATA_STEP_FIELDS);
}

function filterValidationResult(
  validation: AnalysisValidationResult,
  fields: readonly AnalysisFieldKey[],
): AnalysisValidationResult {
  const fieldErrors: Partial<Record<AnalysisFieldKey, string>> = {};
  const messages: string[] = [];

  for (const field of fields) {
    const error = validation.fieldErrors[field];
    if (!error) continue;
    fieldErrors[field] = error;
    messages.push(`${FIELD_LABELS[field]}: ${error}`);
  }

  return { messages, fieldErrors };
}

function focusFirstInvalidField(fieldErrors: Partial<Record<AnalysisFieldKey, string>>) {
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

function getFirstInvalidField(fieldErrors: Partial<Record<AnalysisFieldKey, string>>) {
  const orderedFields = [
    ...DATA_STEP_FIELDS,
    ...Object.keys(FIELD_LABELS).filter((field): field is AnalysisFieldKey => !DATA_STEP_FIELD_SET.has(field as AnalysisFieldKey)),
  ];
  return orderedFields.find((field) => fieldErrors[field]) ?? null;
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
