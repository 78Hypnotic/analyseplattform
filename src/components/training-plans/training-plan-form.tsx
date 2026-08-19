"use client";

import { useActionState, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/button";
import { saveTrainingPlan } from "@/app/trainingsplaene/verwalten/actions";
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
  const [content, setContent] = useState<TrainingPlanContentV2>(() => {
    if (!plan?.content) return createEmptyStructuredPlan();
    return isStructuredTrainingPlanContent(plan.content)
      ? plan.content
      : upgradeLegacyTrainingPlanContent(plan.content as TrainingPlanContent);
  });
  const contentJson = useMemo(() => JSON.stringify(content), [content]);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <input type="hidden" name="id" value={plan?.id ?? ""} />
      <input type="hidden" name="discipline" value="swim" />
      <input type="hidden" name="is_active" value={plan?.is_active ? "true" : "false"} />
      <input type="hidden" name="weeks" value={content.weeks.length} />
      <input type="hidden" name="content" value={contentJson} />

      <div className="sticky top-0 z-30 flex items-center justify-between gap-4 border-y border-[var(--line)] bg-[var(--overlay-bg)] px-3 py-2 shadow-[0_10px_28px_var(--shadow-color)] backdrop-blur">
        <div>
          <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--accent)]">Planentwurf · V2</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{content.weeks.length} Wochen · strukturiertes Schwimmworkout</p>
        </div>
        <Button type="submit" variant="primary" disabled={isPending}>
          <Save size={16} />
          {isPending ? "Speichert..." : "Speichern"}
        </Button>
      </div>

      <section className="surface grid gap-4 p-5 md:grid-cols-2">
        <Field label="Titel" name="title" defaultValue={plan?.title ?? ""} placeholder="z. B. Wasserlage & Balance" />
        <Field label="Slug" name="slug" defaultValue={plan?.slug ?? ""} placeholder="wasserlage-balance" />
        <Field label="Fokus" name="focus" defaultValue={plan?.focus ?? ""} placeholder="Technik-Fundament" />
        <Field label="Phase" name="phase" defaultValue={plan?.phase ?? ""} placeholder="Basephase" />
        <label className="grid gap-2 text-sm">
          Niveau
          <select name="level" defaultValue={plan?.level ?? "Alle"}>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-2 text-sm">
          Wochen
          <div className="flex h-11 items-center rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-3 font-medium">
            {content.weeks.length}
          </div>
        </div>
        <label className="grid gap-2 text-sm md:col-span-2">
          Zusammenfassung
          <textarea name="summary" defaultValue={plan?.summary ?? ""} rows={3} placeholder="Kurze interne Beschreibung des Plans." />
        </label>
        <label className="grid gap-2 text-sm md:col-span-2">
          Gesperrte Vorschau
          <textarea name="preview" defaultValue={plan?.preview ?? ""} rows={4} placeholder="Dieser Text erscheint im Report, bevor der Plan freigeschaltet ist." />
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
                defaultChecked={plan?.target_distances.includes(distance) ?? true}
                className="mr-2 size-4"
              />
              {distance}
            </label>
          ))}
        </div>
      </section>

      <StructuredPlanBuilder content={content} onChange={setContent} />

      {state.message ? (
        <div className="surface border-[var(--warn)] p-4 text-sm text-[var(--warn)]">{state.message}</div>
      ) : null}

    </form>
  );
}
function Field({
  label,
  onChange,
  ...props
}: {
  label: string;
  onChange?: (value: string) => void;
} & Omit<React.ComponentProps<"input">, "onChange">) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      <input {...props} onChange={onChange ? (event) => onChange(event.target.value) : undefined} />
    </label>
  );
}
