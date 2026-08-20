"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Save } from "lucide-react";
import { Button } from "@/components/button";
import { saveTrainingPlan } from "@/app/trainingsplaene/verwalten/actions";
import { cn } from "@/lib/utils";
import { TECHNIQUE_PROFILE_GROUPS } from "@/lib/analysis/constants";
import {
  createEmptyStructuredPlan,
  isStructuredTrainingPlanContent,
  upgradeLegacyTrainingPlanContent,
} from "@/lib/training-plans/content";
import {
  formatTrainingPlanValidationError,
  trainingPlanSchema,
  type TrainingPlanFieldName,
} from "@/lib/training-plans/schema";
import type { TrainingPlan, TrainingPlanContent, TrainingPlanContentV2 } from "@/lib/training-plans/types";
import { StructuredPlanBuilder } from "./structured-plan-builder";

const TARGET_DISTANCES = ["Sprint", "OD", "MD", "LD", "Becken", "Freiwasser"] as const;
const LEVELS = ["Alle", "Einsteiger", "Fortgeschritten", "Ambitioniert", "Leistungsschwimmer"];

type TrainingPlanFormProps = {
  plan?: TrainingPlan | null;
};

/**
 * Full admin builder for weeks, sessions, blocks and drills.
 * The visible nested state is submitted as JSON and revalidated by the server action.
 */
export function TrainingPlanForm({ plan }: TrainingPlanFormProps) {
  const [state, formAction, isPending] = useActionState(saveTrainingPlan, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [details, setDetails] = useState(() => ({
    title: plan?.title ?? "",
    slug: plan?.slug ?? "",
    focus: plan?.focus ?? "",
    phase: plan?.phase ?? "",
    level: plan?.level ?? "Alle",
    summary: plan?.summary ?? "",
    preview: plan?.preview ?? "",
    targetTechniqueAxis: plan?.target_technique_axis ?? "",
  }));
  const [targetDistances, setTargetDistances] = useState<Array<(typeof TARGET_DISTANCES)[number]>>(
    () => plan?.target_distances ?? [...TARGET_DISTANCES],
  );
  const [advancedOpen, setAdvancedOpen] = useState(() => Boolean(plan?.target_technique_axis));
  const [touchedFields, setTouchedFields] = useState<Set<TrainingPlanFieldName>>(() => new Set());
  const [content, setContent] = useState<TrainingPlanContentV2>(() => {
    if (!plan?.content) return createEmptyStructuredPlan();
    return isStructuredTrainingPlanContent(plan.content)
      ? plan.content
      : upgradeLegacyTrainingPlanContent(plan.content as TrainingPlanContent);
  });
  const contentJson = useMemo(() => JSON.stringify(content), [content]);
  const clientValidation = useMemo(() => trainingPlanSchema.safeParse({
    id: plan?.id,
    discipline: "swim",
    slug: details.slug,
    title: details.title,
    focus: details.focus,
    phase: details.phase,
    level: details.level,
    target_distances: targetDistances,
    weeks: content.weeks.length,
    summary: details.summary,
    preview: details.preview,
    target_technique_axis: details.targetTechniqueAxis || null,
    content,
    is_active: plan?.is_active ?? false,
  }), [content, details, plan?.id, plan?.is_active, targetDistances]);
  const clientFieldErrors = useMemo(
    () => clientValidation.success ? {} : formatTrainingPlanValidationError(clientValidation.error).fieldErrors,
    [clientValidation],
  );
  const isFormValid = clientValidation.success;

  useEffect(() => {
    if (state.status !== "error" || !state.fieldErrors) return;
    const firstField = Object.keys(state.fieldErrors)[0];
    const target = firstField === "content"
      ? document.getElementById("training-plan-content")
      : formRef.current?.querySelector<HTMLElement>(`[name="${firstField}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      target.focus({ preventScroll: true });
    }
  }, [state]);

  useEffect(() => {
    if (state.status !== "success" || state.savedTargetTechniqueAxis === undefined) return;
    setDetails((current) => ({
      ...current,
      targetTechniqueAxis: state.savedTargetTechniqueAxis ?? "",
    }));
  }, [state.savedTargetTechniqueAxis, state.status]);

  function updateDetail(name: keyof typeof details, value: string) {
    setDetails((current) => ({ ...current, [name]: value }));
  }

  function toggleTargetDistance(distance: (typeof TARGET_DISTANCES)[number], checked: boolean) {
    markTouched("target_distances");
    setTargetDistances((current) => checked
      ? Array.from(new Set([...current, distance]))
      : current.filter((item) => item !== distance));
  }

  function markTouched(field: TrainingPlanFieldName) {
    setTouchedFields((current) => new Set(current).add(field));
  }

  function fieldError(field: TrainingPlanFieldName) {
    return state.fieldErrors?.[field] ?? (touchedFields.has(field) ? clientFieldErrors[field] : undefined);
  }

  return (
    <form ref={formRef} action={formAction} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="id" value={plan?.id ?? ""} />
      <input type="hidden" name="discipline" value="swim" />
      <input type="hidden" name="is_active" value={plan?.is_active ? "true" : "false"} />
      <input type="hidden" name="weeks" value={content.weeks.length} />
      <input type="hidden" name="content" value={contentJson} />

      <div className="sticky top-0 z-30 flex flex-col gap-3 border-y border-[var(--line)] bg-[var(--overlay-bg)] px-3 py-2 shadow-[0_10px_28px_var(--shadow-color)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--accent)]">Planentwurf · V2</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{content.weeks.length} Wochen · strukturiertes Schwimmworkout</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {state.message ? (
            <div
              role={state.status === "error" ? "alert" : "status"}
              aria-live="polite"
              className={state.status === "error"
                ? "flex items-center gap-2 rounded-lg border border-[var(--warn)] px-3 py-2 text-sm text-[var(--warn)]"
                : "flex items-center gap-2 rounded-lg border border-[var(--accent)] px-3 py-2 text-sm text-[var(--accent)]"}
            >
              {state.status === "error" ? <AlertTriangle size={15} /> : <Check size={15} />}
              <span>{state.message}</span>
            </div>
          ) : null}
          {!isFormValid && !isPending ? (
            <span className="text-xs text-[var(--subtle)]">Pflichtfelder vervollständigen</span>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            disabled={isPending || !isFormValid}
            title={!isFormValid ? "Bitte zuerst alle Pflichtfelder vervollständigen" : undefined}
          >
            <Save size={16} />
            {isPending ? "Speichert..." : "Speichern"}
          </Button>
        </div>
      </div>

      <section className="surface grid gap-x-4 gap-y-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        <Field required label="Titel" name="title" value={details.title} error={fieldError("title")} onBlur={() => markTouched("title")} onChange={(value) => updateDetail("title", value)} placeholder="z. B. Wasserlage & Balance" />
        <Field required label="Slug" name="slug" value={details.slug} error={fieldError("slug")} onBlur={() => markTouched("slug")} onChange={(value) => updateDetail("slug", value)} placeholder="wasserlage-balance" />
        <Field required label="Fokus" name="focus" value={details.focus} error={fieldError("focus")} onBlur={() => markTouched("focus")} onChange={(value) => updateDetail("focus", value)} placeholder="Technik-Fundament" />
        <Field required label="Phase" name="phase" value={details.phase} error={fieldError("phase")} onBlur={() => markTouched("phase")} onChange={(value) => updateDetail("phase", value)} placeholder="Basephase" />
        <label className="grid gap-1 text-sm">
          <RequiredLabel label="Niveau" />
          <select
            required
            name="level"
            value={details.level}
            aria-invalid={Boolean(fieldError("level"))}
            className={cn("h-10 px-3 !py-0 leading-normal", fieldError("level") && "border-[var(--warn)]")}
            onChange={(event) => updateDetail("level", event.target.value)}
            onBlur={() => markTouched("level")}
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <FieldError message={fieldError("level")} />
        </label>
        <div className="grid gap-1 text-sm">
          Wochen
          <div className="flex h-9 items-center rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-3 font-medium">
            {content.weeks.length}
          </div>
        </div>
        <div className="grid gap-3 md:col-span-2 md:grid-cols-2 xl:col-span-3">
          <label className="grid gap-1 text-sm">
            <RequiredLabel label="Zusammenfassung" />
            <textarea
              required
              name="summary"
              value={details.summary}
              aria-invalid={Boolean(fieldError("summary"))}
              className={cn("min-h-20 px-3 py-2", fieldError("summary") && "border-[var(--warn)]")}
              onChange={(event) => updateDetail("summary", event.target.value)}
              onBlur={() => markTouched("summary")}
              rows={2}
              placeholder="Kurze interne Beschreibung des Plans."
            />
            <FieldError message={fieldError("summary")} />
          </label>
          <label className="grid gap-1 text-sm">
            <RequiredLabel label="Gesperrte Vorschau" />
            <textarea
              required
              name="preview"
              value={details.preview}
              aria-invalid={Boolean(fieldError("preview"))}
              className={cn("min-h-20 px-3 py-2", fieldError("preview") && "border-[var(--warn)]")}
              onChange={(event) => updateDetail("preview", event.target.value)}
              onBlur={() => markTouched("preview")}
              rows={2}
              placeholder="Dieser Text erscheint im Report, bevor der Plan freigeschaltet ist."
            />
            <FieldError message={fieldError("preview")} />
          </label>
        </div>
        <details
          className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] md:col-span-2 xl:col-span-3"
          open={advancedOpen}
          onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
        >
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-[var(--muted)]">Weitere Einstellungen</summary>
          <label className="grid gap-1 border-t border-[var(--line)] p-3 text-sm">
            Technik-Zielattribut
            <select
              name="target_technique_axis"
              value={details.targetTechniqueAxis}
              aria-invalid={Boolean(fieldError("target_technique_axis"))}
              className={cn("h-10 px-3 !py-0 leading-normal", fieldError("target_technique_axis") && "border-[var(--warn)]")}
              onChange={(event) => updateDetail("targetTechniqueAxis", event.target.value)}
            >
              <option value="">Kein Technikfokus</option>
              {TECHNIQUE_PROFILE_GROUPS.map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
            <p className="text-[11px] leading-4 text-[var(--subtle)]">
              Wird mit der nächsten Veröffentlichung unveränderlich in die Planversion übernommen und markiert dort den Fokus im Athleten-Radar.
            </p>
            <FieldError message={fieldError("target_technique_axis")} />
          </label>
        </details>
      </section>

      <section className="surface p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold"><RequiredLabel label="Zielstrecken" /></h2>
            <p className="muted mt-1 text-sm">Mindestens eine Zielstrecke auswählen.</p>
          </div>
          <p className="text-sm text-[var(--subtle)]">Veröffentlichen erfolgt nach dem Speichern als eigene Version.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {TARGET_DISTANCES.map((distance) => (
            <label key={distance} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
              <input
                type="checkbox"
                name="target_distances"
                value={distance}
                checked={targetDistances.includes(distance)}
                onChange={(event) => toggleTargetDistance(distance, event.target.checked)}
                className="mr-2 size-4"
              />
              {distance}
            </label>
          ))}
        </div>
        <FieldError message={fieldError("target_distances")} />
      </section>

      <div id="training-plan-content">
        <StructuredPlanBuilder content={content} onChange={setContent} />
        <FieldError message={state.fieldErrors?.content} />
      </div>

    </form>
  );
}
function Field({
  label,
  onChange,
  error,
  required,
  className,
  ...props
}: {
  label: string;
  onChange?: (value: string) => void;
  error?: string;
} & Omit<React.ComponentProps<"input">, "onChange">) {
  return (
    <label className="grid gap-1 text-sm">
      <RequiredLabel label={label} required={required} />
      <input
        {...props}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn("h-9 px-3 py-1.5", className, error && "border-[var(--warn)]")}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
      <FieldError message={error} />
    </label>
  );
}

function RequiredLabel({ label, required = true }: { label: string; required?: boolean }) {
  return <span>{label}{required ? <span className="ml-1 text-[var(--warn)]" aria-hidden="true">*</span> : null}</span>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="text-xs text-[var(--warn)]">{message}</span> : null;
}
