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
  const [content, setContent] = useState<TrainingPlanContentV2>(() => {
    if (!plan?.content) return createEmptyStructuredPlan();
    return isStructuredTrainingPlanContent(plan.content)
      ? plan.content
      : upgradeLegacyTrainingPlanContent(plan.content as TrainingPlanContent);
  });
  const contentJson = useMemo(() => JSON.stringify(content), [content]);

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
    setTargetDistances((current) => checked
      ? Array.from(new Set([...current, distance]))
      : current.filter((item) => item !== distance));
  }

  return (
    <form ref={formRef} action={formAction} className="mt-8 space-y-6" noValidate>
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
          <Button type="submit" variant="primary" disabled={isPending}>
            <Save size={16} />
            {isPending ? "Speichert..." : "Speichern"}
          </Button>
        </div>
      </div>

      <section className="surface grid gap-4 p-5 md:grid-cols-2">
        <Field label="Titel" name="title" value={details.title} error={state.fieldErrors?.title} onChange={(value) => updateDetail("title", value)} placeholder="z. B. Wasserlage & Balance" />
        <Field label="Slug" name="slug" value={details.slug} error={state.fieldErrors?.slug} onChange={(value) => updateDetail("slug", value)} placeholder="wasserlage-balance" />
        <Field label="Fokus" name="focus" value={details.focus} error={state.fieldErrors?.focus} onChange={(value) => updateDetail("focus", value)} placeholder="Technik-Fundament" />
        <Field label="Phase" name="phase" value={details.phase} error={state.fieldErrors?.phase} onChange={(value) => updateDetail("phase", value)} placeholder="Basephase" />
        <label className="grid gap-2 text-sm">
          Niveau
          <select
            name="level"
            value={details.level}
            aria-invalid={Boolean(state.fieldErrors?.level)}
            className={state.fieldErrors?.level ? "border-[var(--warn)]" : undefined}
            onChange={(event) => updateDetail("level", event.target.value)}
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.level} />
        </label>
        <div className="grid gap-2 text-sm">
          Wochen
          <div className="flex h-11 items-center rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-3 font-medium">
            {content.weeks.length}
          </div>
        </div>
        <label className="grid gap-2 text-sm md:col-span-2">
          Zusammenfassung
          <textarea
            name="summary"
            value={details.summary}
            aria-invalid={Boolean(state.fieldErrors?.summary)}
            className={state.fieldErrors?.summary ? "border-[var(--warn)]" : undefined}
            onChange={(event) => updateDetail("summary", event.target.value)}
            rows={3}
            placeholder="Kurze interne Beschreibung des Plans."
          />
          <FieldError message={state.fieldErrors?.summary} />
        </label>
        <label className="grid gap-2 text-sm md:col-span-2">
          Gesperrte Vorschau
          <textarea
            name="preview"
            value={details.preview}
            aria-invalid={Boolean(state.fieldErrors?.preview)}
            className={state.fieldErrors?.preview ? "border-[var(--warn)]" : undefined}
            onChange={(event) => updateDetail("preview", event.target.value)}
            rows={4}
            placeholder="Dieser Text erscheint im Report, bevor der Plan freigeschaltet ist."
          />
          <FieldError message={state.fieldErrors?.preview} />
        </label>
        <label className="grid gap-2 text-sm md:col-span-2">
          Technik-Zielattribut
          <select
            name="target_technique_axis"
            value={details.targetTechniqueAxis}
            aria-invalid={Boolean(state.fieldErrors?.target_technique_axis)}
            className={state.fieldErrors?.target_technique_axis ? "border-[var(--warn)]" : undefined}
            onChange={(event) => updateDetail("targetTechniqueAxis", event.target.value)}
          >
            <option value="">Kein Technikfokus</option>
            {TECHNIQUE_PROFILE_GROUPS.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
          <p className="text-xs text-[var(--subtle)]">
            Wird mit der nächsten Veröffentlichung unveränderlich in die Planversion übernommen und markiert dort
            den Fokus im Athleten-Radar. Bereits veröffentlichte oder aktive Pläne ändern sich nicht. Dies ist keine
            Ergebnisprognose.
          </p>
          <FieldError message={state.fieldErrors?.target_technique_axis} />
        </label>
      </section>

      <section className="surface p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold">Zielstrecken</h2>
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
        <FieldError message={state.fieldErrors?.target_distances} />
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
  className,
  ...props
}: {
  label: string;
  onChange?: (value: string) => void;
  error?: string;
} & Omit<React.ComponentProps<"input">, "onChange">) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      <input
        {...props}
        aria-invalid={Boolean(error)}
        className={cn(className, error && "border-[var(--warn)]")}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
      <FieldError message={error} />
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="text-xs text-[var(--warn)]">{message}</span> : null;
}
