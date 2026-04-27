"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/button";
import { emptyTrainingPlanContent } from "@/lib/training-plans/defaults";
import type {
  TrainingPlan,
  TrainingPlanBlock,
  TrainingPlanContent,
  TrainingPlanDrill,
  TrainingPlanSession,
  TrainingPlanWeek,
} from "@/lib/training-plans/types";
import { saveTrainingPlan } from "./actions";

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
  const [content, setContent] = useState<TrainingPlanContent>(plan?.content ?? emptyTrainingPlanContent());
  const contentJson = useMemo(() => JSON.stringify(content), [content]);

  function updateWeek(index: number, patch: Partial<TrainingPlanWeek>) {
    setContent((current) => ({
      weeks: current.weeks.map((week, weekIndex) =>
        weekIndex === index ? { ...week, ...patch } : week,
      ),
    }));
  }

  function addWeek() {
    setContent((current) => ({
      weeks: [
        ...current.weeks,
        {
          title: `Woche ${current.weeks.length + 1}`,
          goal: "Neuer Wochenfokus",
          sessions: [emptySession()],
        },
      ],
    }));
  }

  function removeWeek(index: number) {
    setContent((current) => ({
      weeks: current.weeks.length > 1 ? current.weeks.filter((_, weekIndex) => weekIndex !== index) : current.weeks,
    }));
  }

  function updateSession(weekIndex: number, sessionIndex: number, patch: Partial<TrainingPlanSession>) {
    setContent((current) => ({
      weeks: current.weeks.map((week, currentWeekIndex) => {
        if (currentWeekIndex !== weekIndex) return week;
        return {
          ...week,
          sessions: week.sessions.map((session, currentSessionIndex) =>
            currentSessionIndex === sessionIndex ? { ...session, ...patch } : session,
          ),
        };
      }),
    }));
  }

  function addSession(weekIndex: number) {
    setContent((current) => ({
      weeks: current.weeks.map((week, currentWeekIndex) =>
        currentWeekIndex === weekIndex
          ? { ...week, sessions: [...week.sessions, emptySession()] }
          : week,
      ),
    }));
  }

  function removeSession(weekIndex: number, sessionIndex: number) {
    setContent((current) => ({
      weeks: current.weeks.map((week, currentWeekIndex) => {
        if (currentWeekIndex !== weekIndex || week.sessions.length <= 1) return week;
        return { ...week, sessions: week.sessions.filter((_, index) => index !== sessionIndex) };
      }),
    }));
  }

  function updateBlock(
    weekIndex: number,
    sessionIndex: number,
    blockIndex: number,
    patch: Partial<TrainingPlanBlock>,
  ) {
    updateSessionByMapper(weekIndex, sessionIndex, (session) => ({
      ...session,
      blocks: session.blocks.map((block, index) =>
        index === blockIndex ? { ...block, ...patch } : block,
      ),
    }));
  }

  function addBlock(weekIndex: number, sessionIndex: number) {
    updateSessionByMapper(weekIndex, sessionIndex, (session) => ({
      ...session,
      blocks: [...session.blocks, emptyBlock()],
    }));
  }

  function removeBlock(weekIndex: number, sessionIndex: number, blockIndex: number) {
    updateSessionByMapper(weekIndex, sessionIndex, (session) => ({
      ...session,
      blocks: session.blocks.length > 1
        ? session.blocks.filter((_, index) => index !== blockIndex)
        : session.blocks,
    }));
  }

  function updateDrill(
    weekIndex: number,
    sessionIndex: number,
    drillIndex: number,
    patch: Partial<TrainingPlanDrill>,
  ) {
    updateSessionByMapper(weekIndex, sessionIndex, (session) => ({
      ...session,
      drills: session.drills.map((drill, index) =>
        index === drillIndex ? { ...drill, ...patch } : drill,
      ),
    }));
  }

  function addDrill(weekIndex: number, sessionIndex: number) {
    updateSessionByMapper(weekIndex, sessionIndex, (session) => ({
      ...session,
      drills: [...session.drills, emptyDrill()],
    }));
  }

  function removeDrill(weekIndex: number, sessionIndex: number, drillIndex: number) {
    updateSessionByMapper(weekIndex, sessionIndex, (session) => ({
      ...session,
      drills: session.drills.filter((_, index) => index !== drillIndex),
    }));
  }

  function updateSessionByMapper(
    weekIndex: number,
    sessionIndex: number,
    mapper: (session: TrainingPlanSession) => TrainingPlanSession,
  ) {
    setContent((current) => ({
      weeks: current.weeks.map((week, currentWeekIndex) => {
        if (currentWeekIndex !== weekIndex) return week;
        return {
          ...week,
          sessions: week.sessions.map((session, currentSessionIndex) =>
            currentSessionIndex === sessionIndex ? mapper(session) : session,
          ),
        };
      }),
    }));
  }

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <input type="hidden" name="id" value={plan?.id ?? ""} />
      <input type="hidden" name="content" value={contentJson} />

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
        <Field label="Wochen" name="weeks" type="number" defaultValue={plan?.weeks ?? 6} min={1} max={16} />
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
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={plan?.is_active ?? false} className="size-4" />
            Aktiv veröffentlichen
          </label>
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

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Builder</p>
            <h2 className="mt-2 text-2xl font-semibold">Wochen, Einheiten, Blöcke</h2>
          </div>
          <Button type="button" onClick={addWeek}>
            <Plus size={16} />
            Woche
          </Button>
        </div>

        {content.weeks.map((week, weekIndex) => (
          <div key={`${week.title}-${weekIndex}`} className="surface space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_2fr_auto]">
              <Field label="Woche" value={week.title} onChange={(value) => updateWeek(weekIndex, { title: value })} />
              <Field label="Ziel" value={week.goal} onChange={(value) => updateWeek(weekIndex, { goal: value })} />
              <Button type="button" variant="ghost" className="self-end px-2" onClick={() => removeWeek(weekIndex)} title="Woche entfernen">
                <Trash2 size={16} />
              </Button>
            </div>

            {week.sessions.map((session, sessionIndex) => (
              <div key={`${session.title}-${sessionIndex}`} className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
                <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                  <Field label="Einheit" value={session.title} onChange={(value) => updateSession(weekIndex, sessionIndex, { title: value })} />
                  <Field label="Fokus" value={session.focus} onChange={(value) => updateSession(weekIndex, sessionIndex, { focus: value })} />
                  <Button type="button" variant="ghost" className="self-end px-2" onClick={() => removeSession(weekIndex, sessionIndex)} title="Einheit entfernen">
                    <Trash2 size={16} />
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Blöcke / Sets</h3>
                    <Button type="button" variant="ghost" onClick={() => addBlock(weekIndex, sessionIndex)}>
                      <Plus size={14} />
                      Block
                    </Button>
                  </div>
                  {session.blocks.map((block, blockIndex) => (
                    <div key={`${block.title}-${blockIndex}`} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1.4fr_auto]">
                      <Field label="Block" value={block.title} onChange={(value) => updateBlock(weekIndex, sessionIndex, blockIndex, { title: value })} />
                      <Field label="Sets" value={block.sets} onChange={(value) => updateBlock(weekIndex, sessionIndex, blockIndex, { sets: value })} />
                      <Field label="Intensität" value={block.intensity} onChange={(value) => updateBlock(weekIndex, sessionIndex, blockIndex, { intensity: value })} />
                      <Field label="Notiz" value={block.notes ?? ""} onChange={(value) => updateBlock(weekIndex, sessionIndex, blockIndex, { notes: value })} />
                      <Button type="button" variant="ghost" className="self-end px-2" onClick={() => removeBlock(weekIndex, sessionIndex, blockIndex)} title="Block entfernen">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Drills</h3>
                    <Button type="button" variant="ghost" onClick={() => addDrill(weekIndex, sessionIndex)}>
                      <Plus size={14} />
                      Drill
                    </Button>
                  </div>
                  {session.drills.map((drill, drillIndex) => (
                    <div key={`${drill.name}-${drillIndex}`} className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                      <Field label="Drill" value={drill.name} onChange={(value) => updateDrill(weekIndex, sessionIndex, drillIndex, { name: value })} />
                      <Field label="Cue" value={drill.cue} onChange={(value) => updateDrill(weekIndex, sessionIndex, drillIndex, { cue: value })} />
                      <Button type="button" variant="ghost" className="self-end px-2" onClick={() => removeDrill(weekIndex, sessionIndex, drillIndex)} title="Drill entfernen">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Button type="button" variant="ghost" onClick={() => addSession(weekIndex)}>
              <Plus size={16} />
              Einheit hinzufügen
            </Button>
          </div>
        ))}
      </section>

      {state.message ? (
        <div className="surface border-[var(--warn)] p-4 text-sm text-[var(--warn)]">{state.message}</div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={isPending}>
          <Save size={16} />
          {isPending ? "Speichert..." : "Plan speichern"}
        </Button>
      </div>
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

function emptySession(): TrainingPlanSession {
  return {
    title: "Einheit",
    focus: "Fokus",
    blocks: [emptyBlock()],
    drills: [emptyDrill()],
  };
}

function emptyBlock(): TrainingPlanBlock {
  return {
    title: "Hauptserie",
    sets: "6 x 100 m",
    intensity: "kontrolliert",
    notes: "",
  };
}

function emptyDrill(): TrainingPlanDrill {
  return {
    name: "Technikdrill",
    cue: "Ein klarer Cue.",
  };
}
