"use client";

import { useDeferredValue, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Copy,
  GripVertical,
  Maximize2,
  Plus,
  Trash2,
  Waves,
  X,
} from "lucide-react";
import { Button } from "@/components/button";
import { WorkoutTimelineDialog } from "@/components/training-plans/workout-timeline-dialog";
import { cn } from "@/lib/utils";
import { duplicateSession, duplicateWeek, moveItem, moveSession } from "@/lib/training-plans/commands";
import {
  createEmptyStructuredSession,
  createEmptyStructuredStep,
  createEmptyWorkoutContent,
  createPlanNodeId,
} from "@/lib/training-plans/content";
import { getPlanMetrics, getSessionMeters, getWeekMeters } from "@/lib/training-plans/metrics";
import type {
  StructuredSwimBlock,
  StructuredSwimStep,
  StructuredTrainingPlanSession,
  StructuredTrainingPlanWeek,
  SwimEquipment,
  TrainingPlanDiscipline,
  TrainingPlanContentV2,
} from "@/lib/training-plans/types";

const BLOCK_KINDS = [
  ["warmup", "Einschwimmen"],
  ["drill", "Technik"],
  ["main", "Hauptserie"],
  ["recovery", "Erholung"],
  ["cooldown", "Ausschwimmen"],
] as const;
const STROKES = [
  ["freestyle", "Kraul"],
  ["backstroke", "Rücken"],
  ["breaststroke", "Brust"],
  ["butterfly", "Delfin"],
  ["medley", "Lagen"],
  ["choice", "Wahl"],
] as const;
const EQUIPMENT = [
  ["pullbuoy", "Pullbuoy"],
  ["paddles", "Paddles"],
  ["fins", "Flossen"],
  ["snorkel", "Schnorchel"],
  ["kickboard", "Brett"],
] as const;
const WEEKDAYS = [
  [1, "Mo", "Montag"], [2, "Di", "Dienstag"], [3, "Mi", "Mittwoch"],
  [4, "Do", "Donnerstag"], [5, "Fr", "Freitag"], [6, "Sa", "Samstag"], [7, "So", "Sonntag"],
] as const;
type PreferredWeekday = NonNullable<StructuredTrainingPlanSession["preferredWeekday"]>;
type TimelineDialogState = {
  sessionId: string;
  title: string;
  content: NonNullable<StructuredTrainingPlanSession["timelineWorkout"]>;
};

export function StructuredPlanBuilder({
  content,
  onChange,
}: {
  content: TrainingPlanContentV2;
  onChange: (content: TrainingPlanContentV2) => void;
}) {
  const deferredContent = useDeferredValue(content);
  const metrics = getPlanMetrics(deferredContent);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [timelineDialog, setTimelineDialog] = useState<TimelineDialogState | null>(null);
  const selected = findSession(content, selectedSessionId);

  function addPreset(preset: "technique" | "aerobic" | "css") {
    const targetWeek = selected?.week ?? content.weeks[0];
    if (!targetWeek) return;
    const session = createWorkoutPreset(preset);
    updateWeek(targetWeek.id, { sessions: [...targetWeek.sessions, session] });
    setSelectedSessionId(session.id);
  }

  function addWeek() {
    const nextNumber = content.weeks.length + 1;
    const session = createEmptyStructuredSession();
    onChange({
      ...content,
      weeks: [
        ...content.weeks,
        {
          id: createPlanNodeId("week"),
          title: `Woche ${nextNumber}`,
          goal: "Neuer Wochenfokus",
          sessions: [session],
        },
      ],
    });
    setSelectedSessionId(session.id);
  }

  function updateWeek(weekId: string, patch: Partial<StructuredTrainingPlanWeek>) {
    onChange({
      ...content,
      weeks: content.weeks.map((week) => (week.id === weekId ? { ...week, ...patch } : week)),
    });
  }

  function removeWeek(weekId: string) {
    if (content.weeks.length <= 1) return;
    const nextWeeks = content.weeks.filter((week) => week.id !== weekId);
    onChange({ ...content, weeks: nextWeeks });
    if (selected?.week.id === weekId) setSelectedSessionId(nextWeeks[0]?.sessions[0]?.id ?? null);
  }

  function addSession(weekId: string) {
    const timelineWorkout = createEmptyWorkoutContent("swim");
    const session = { ...createEmptyStructuredSession(), timelineWorkout };
    updateWeek(weekId, {
      sessions: [
        ...(content.weeks.find((week) => week.id === weekId)?.sessions ?? []),
        session,
      ],
    });
    setSelectedSessionId(session.id);
    setTimelineDialog({ sessionId: session.id, title: session.title, content: timelineWorkout });
  }

  function openTimelineDialog(session: StructuredTrainingPlanSession) {
    setTimelineDialog({
      sessionId: session.id,
      title: session.title,
      content: session.timelineWorkout ?? createEmptyWorkoutContent("swim"),
    });
  }

  function saveTimelineWorkout(timelineWorkout: NonNullable<StructuredTrainingPlanSession["timelineWorkout"]>) {
    if (!timelineDialog) return;
    onChange({
      ...content,
      weeks: content.weeks.map((week) => ({
        ...week,
        sessions: week.sessions.map((session) => session.id === timelineDialog.sessionId
          ? {
              ...session,
              title: getDisciplineSessionTitle(session.title, timelineWorkout.discipline),
              timelineWorkout,
            }
          : session),
      })),
    });
  }

  function selectDuplicate(weekId: string, sessionId: string) {
    const next = duplicateSession(content, weekId, sessionId);
    onChange(next);
    const sessions = next.weeks.find((week) => week.id === weekId)?.sessions ?? [];
    const sourceIndex = sessions.findIndex((session) => session.id === sessionId);
    setSelectedSessionId(sessions[sourceIndex + 1]?.id ?? sessionId);
  }

  function updateSelectedSession(patch: Partial<StructuredTrainingPlanSession>) {
    if (!selected) return;
    updateWeek(selected.week.id, {
      sessions: selected.week.sessions.map((session) =>
        session.id === selected.session.id ? { ...session, ...patch } : session,
      ),
    });
  }

  function moveSelectedToWeek(direction: -1 | 1) {
    if (!selected) return;
    const targetWeek = content.weeks[selected.weekIndex + direction];
    if (!targetWeek) return;
    onChange(moveSession(content, selected.session.id, targetWeek.id, targetWeek.sessions.length));
  }

  function assignSessionToDay(
    sessionId: string,
    targetWeekId: string,
    preferredWeekday?: PreferredWeekday,
  ) {
    const moved = moveSession(content, sessionId, targetWeekId, Number.MAX_SAFE_INTEGER);
    onChange({
      ...moved,
      weeks: moved.weeks.map((week) => week.id === targetWeekId
        ? {
            ...week,
            sessions: week.sessions.map((session) => session.id === sessionId
              ? { ...session, preferredWeekday }
              : session),
          }
        : week),
    });
  }

  return (
    <section className="mt-6 space-y-4">
      <WorkoutTimelineDialog
        open={timelineDialog !== null}
        content={timelineDialog?.content ?? createEmptyWorkoutContent("swim")}
        onOpenChange={(open) => {
          if (!open) setTimelineDialog(null);
        }}
        onSave={saveTimelineWorkout}
        title={timelineDialog?.title}
      />
      <PlanSummary metrics={metrics} />
      <div className="flex flex-col justify-between gap-3 border-y border-[var(--line)] py-3 sm:flex-row sm:items-center">
        <div>
          <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">Workout-Vorlagen</p>
          <p className="mt-1 text-sm text-[var(--muted)]">In die ausgewählte Woche einsetzen</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={() => addPreset("technique")}>Technik</Button>
          <Button type="button" variant="ghost" onClick={() => addPreset("aerobic")}>Aerob</Button>
          <Button type="button" variant="ghost" onClick={() => addPreset("css")}>CSS</Button>
        </div>
      </div>
      <div className={cn(
        "gap-4",
        selected ? "grid xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start" : "block",
      )}>
        <div className="min-w-0 space-y-4">
          {content.weeks.map((week, weekIndex) => (
            <WeekRow
              key={week.id}
              week={week}
              weekIndex={weekIndex}
              selectedSessionId={selectedSessionId}
              onSelect={setSelectedSessionId}
              onUpdate={(patch) => updateWeek(week.id, patch)}
              onAddSession={() => addSession(week.id)}
              onDuplicateSession={(sessionId) => selectDuplicate(week.id, sessionId)}
              onRemoveSession={(sessionId) => {
                if (week.sessions.length <= 1) return;
                const remaining = week.sessions.filter((session) => session.id !== sessionId);
                updateWeek(week.id, { sessions: remaining });
                if (selectedSessionId === sessionId) {
                  setSelectedSessionId(remaining[0]?.id ?? null);
                }
              }}
              onDropSession={(sessionId, preferredWeekday) => assignSessionToDay(sessionId, week.id, preferredWeekday)}
              onDuplicateWeek={() => onChange(duplicateWeek(content, week.id))}
              onMoveWeek={(direction) => onChange({
                ...content,
                weeks: moveItem(content.weeks, weekIndex, weekIndex + direction),
              })}
              onRemoveWeek={() => removeWeek(week.id)}
              canRemove={content.weeks.length > 1}
            />
          ))}
          <Button type="button" onClick={addWeek} className="w-full border-dashed">
            <Plus size={16} /> Woche hinzufügen
          </Button>
        </div>

        {selected ? (
          <aside className="xl:sticky xl:top-4">
            <WorkoutInspector
              session={selected.session}
              canMovePreviousWeek={selected.weekIndex > 0}
              canMoveNextWeek={selected.weekIndex < content.weeks.length - 1}
              onChange={updateSelectedSession}
              onMovePreviousWeek={() => moveSelectedToWeek(-1)}
              onMoveNextWeek={() => moveSelectedToWeek(1)}
              onOpenTimeline={() => openTimelineDialog(selected.session)}
              onClose={() => setSelectedSessionId(null)}
            />
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function PlanSummary({ metrics }: { metrics: ReturnType<typeof getPlanMetrics> }) {
  const values = [
    ["Wochen", String(metrics.weeks)],
    ["Workouts", String(metrics.sessions)],
    ["Gesamt", formatMeters(metrics.meters)],
    ["Zu prüfen", String(metrics.reviewSteps)],
  ];
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {values.map(([label, value]) => (
        <div key={label} className="border-t border-[var(--line)] py-3">
          <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">{label}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
}

function getDisciplineSessionTitle(title: string, discipline: TrainingPlanDiscipline) {
  const defaultTitles = ["Neue Schwimmeinheit", "Neue Radeinheit", "Neue Laufeinheit"];
  if (!defaultTitles.includes(title)) return title;
  if (discipline === "bike") return "Neue Radeinheit";
  if (discipline === "run") return "Neue Laufeinheit";
  return "Neue Schwimmeinheit";
}

function WeekRow({
  week,
  weekIndex,
  selectedSessionId,
  onSelect,
  onUpdate,
  onAddSession,
  onDuplicateSession,
  onRemoveSession,
  onDropSession,
  onDuplicateWeek,
  onMoveWeek,
  onRemoveWeek,
  canRemove,
}: {
  week: StructuredTrainingPlanWeek;
  weekIndex: number;
  selectedSessionId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (patch: Partial<StructuredTrainingPlanWeek>) => void;
  onAddSession: () => void;
  onDuplicateSession: (id: string) => void;
  onRemoveSession: (id: string) => void;
  onDropSession: (id: string, preferredWeekday?: PreferredWeekday) => void;
  onDuplicateWeek: () => void;
  onMoveWeek: (direction: -1 | 1) => void;
  onRemoveWeek: () => void;
  canRemove: boolean;
}) {
  const renderWorkout = (session: StructuredTrainingPlanSession) => {
    return (
      <WorkoutCard
        key={session.id}
        session={session}
        selected={session.id === selectedSessionId}
        onSelect={() => onSelect(session.id)}
        onDuplicate={() => onDuplicateSession(session.id)}
        onRemove={() => onRemoveSession(session.id)}
        canRemove={week.sessions.length > 1}
      />
    );
  };
  const flexibleSessions = week.sessions.filter((session) => !session.preferredWeekday);

  return (
    <section className="border-t border-[var(--line)] pt-4">
      <div className="grid gap-3 md:grid-cols-[5rem_minmax(0,1fr)_auto] md:items-center">
        <p className="mono text-[10px] uppercase tracking-[0.15em] text-[var(--accent)]">Woche {weekIndex + 1}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input aria-label={`Titel Woche ${weekIndex + 1}`} value={week.title} onChange={(event) => onUpdate({ title: event.target.value })} />
          <input aria-label={`Ziel Woche ${weekIndex + 1}`} value={week.goal} onChange={(event) => onUpdate({ goal: event.target.value })} />
        </div>
        <div className="flex gap-1 md:justify-end">
          <IconButton title="Woche nach oben" onClick={() => onMoveWeek(-1)}><ArrowUp size={15} /></IconButton>
          <IconButton title="Woche nach unten" onClick={() => onMoveWeek(1)}><ArrowDown size={15} /></IconButton>
          <IconButton title="Woche duplizieren" onClick={onDuplicateWeek}><Copy size={15} /></IconButton>
          <IconButton title="Woche löschen" onClick={onRemoveWeek} disabled={!canRemove}><Trash2 size={15} /></IconButton>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-[var(--subtle)]">
        <span>{week.sessions.length} Workouts</span><span>{formatMeters(getWeekMeters(week))}</span>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        {WEEKDAYS.map(([value, shortLabel]) => (
          <DayColumn
            key={value}
            label={shortLabel}
            onDrop={(sessionId) => onDropSession(sessionId, value)}
          >
            {week.sessions.filter((session) => session.preferredWeekday === value).map(renderWorkout)}
          </DayColumn>
        ))}
      </div>
      <div
        className="mt-3 rounded-lg border border-dashed border-[var(--line)] p-3"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const sessionId = event.dataTransfer.getData("application/x-workout-id");
          if (sessionId) onDropSession(sessionId, undefined);
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">Flexibel</p>
          <button type="button" onClick={onAddSession} className="inline-flex items-center gap-1 text-xs text-[var(--accent)]">
            <Plus size={13} /> Workout
          </button>
        </div>
        {flexibleSessions.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {flexibleSessions.map(renderWorkout)}
          </div>
        ) : (
          <p className="py-3 text-center text-xs text-[var(--subtle)]">Workouts ohne Tagesempfehlung hier ablegen</p>
        )}
      </div>
    </section>
  );
}

function WorkoutCard({ session, selected, onSelect, onDuplicate, onRemove, canRemove }: {
  session: StructuredTrainingPlanSession;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const reviewCount = session.blocks.flatMap((block) => block.steps).filter((step) => step.needsReview).length;
  return (
    <article
      draggable
      onDragStart={(event) => event.dataTransfer.setData("application/x-workout-id", session.id)}
      className={cn(
        "rounded-lg border bg-[var(--panel)] p-4 transition",
        selected ? "border-[var(--accent)]" : "border-[var(--line)] hover:border-[var(--accent)]",
      )}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[var(--accent)]"><Waves size={16} /><GripVertical size={14} /></span>
          <span className="mono text-[9px] uppercase tracking-[0.12em] text-[var(--subtle)]">{session.blocks.length} Blöcke</span>
        </div>
        <h3 className="mt-4 line-clamp-2 font-semibold">{session.title}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">{session.focus}</p>
        <div className="mt-5 flex items-end justify-between gap-2">
          <p className="display-serif text-3xl">{formatMeters(getSessionMeters(session))}</p>
          {reviewCount > 0 ? <span className="text-xs text-[var(--warn)]">{reviewCount} prüfen</span> : null}
        </div>
      </button>
      <div className="mt-3 flex justify-end gap-1 border-t border-[var(--line)] pt-2">
        <IconButton title="Workout duplizieren" onClick={onDuplicate}><Copy size={14} /></IconButton>
        <IconButton title="Workout löschen" onClick={onRemove} disabled={!canRemove}><Trash2 size={14} /></IconButton>
      </div>
    </article>
  );
}

function WorkoutInspector({ session, onChange, onMovePreviousWeek, onMoveNextWeek, onOpenTimeline, canMovePreviousWeek, canMoveNextWeek, onClose }: {
  session: StructuredTrainingPlanSession;
  onChange: (patch: Partial<StructuredTrainingPlanSession>) => void;
  onMovePreviousWeek: () => void;
  onMoveNextWeek: () => void;
  onOpenTimeline: () => void;
  canMovePreviousWeek: boolean;
  canMoveNextWeek: boolean;
  onClose: () => void;
}) {
  function updateBlock(blockId: string, patch: Partial<StructuredSwimBlock>) {
    onChange({ blocks: session.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)) });
  }
  function removeBlock(blockId: string) {
    if (session.blocks.length <= 1) return;
    onChange({ blocks: session.blocks.filter((block) => block.id !== blockId) });
  }
  function addBlock() {
    onChange({ blocks: [...session.blocks, createBlockPreset("main")] });
  }
  function updateStep(block: StructuredSwimBlock, stepId: string, patch: Partial<StructuredSwimStep>) {
    updateBlock(block.id, { steps: block.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)) });
  }

  return (
    <div className="surface max-h-[calc(100vh-2rem)] overflow-y-auto p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">Workout bearbeiten</p>
        <IconButton title="Inspector schließen" onClick={onClose}><X size={16} /></IconButton>
      </div>
      <div className="mt-4 grid gap-3">
        <InspectorField label="Titel" value={session.title} onChange={(value) => onChange({ title: value })} />
        <InspectorField label="Fokus" value={session.focus} onChange={(value) => onChange({ focus: value })} />
        <label className="grid gap-1 text-xs text-[var(--muted)]">Empfohlener Trainingstag
          <select
            value={session.preferredWeekday ?? ""}
            onChange={(event) => onChange({
              preferredWeekday: event.target.value ? Number(event.target.value) as PreferredWeekday : undefined,
            })}
          >
            <option value="">Flexibel</option>
            {WEEKDAYS.map(([value, , fullLabel]) => <option key={value} value={value}>{fullLabel}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-[var(--muted)]">Geschätzte Dauer (min)
          <input type="number" min={1} max={600} value={session.estimatedDurationMinutes ?? ""} onChange={(event) => onChange({ estimatedDurationMinutes: event.target.value ? Number(event.target.value) : undefined })} />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="ghost" className="flex-1 px-2" disabled={!canMovePreviousWeek} onClick={onMovePreviousWeek}><ArrowLeft size={14} /> Woche</Button>
        <Button type="button" variant="ghost" className="flex-1 px-2" disabled={!canMoveNextWeek} onClick={onMoveNextWeek}>Woche <ArrowRight size={14} /></Button>
      </div>

      <div className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-3">
        <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">Timeline</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {session.timelineWorkout
            ? `${session.timelineWorkout.blocks.length} Blöcke im Workout Builder`
            : "Noch keine Timeline für dieses Workout angelegt"}
        </p>
        <div className="mt-3">
          <Button type="button" onClick={onOpenTimeline}>
            <Maximize2 size={16} />
            {session.timelineWorkout ? "Timeline bearbeiten" : "Workout Builder öffnen"}
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {session.blocks.map((block, blockIndex) => (
          <section key={block.id} className="border-t border-[var(--line)] pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Block {blockIndex + 1}</p>
              <IconButton title="Block löschen" disabled={session.blocks.length <= 1} onClick={() => removeBlock(block.id)}><Trash2 size={14} /></IconButton>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <InspectorField label="Titel" value={block.title} onChange={(value) => updateBlock(block.id, { title: value })} />
              <label className="grid gap-1 text-xs text-[var(--muted)]">Typ
                <select value={block.kind} onChange={(event) => updateBlock(block.id, { kind: event.target.value as StructuredSwimBlock["kind"] })}>
                  {BLOCK_KINDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-[var(--muted)]">Block wiederholen
                <input type="number" min={1} max={20} value={block.repeatCount} onChange={(event) => updateBlock(block.id, { repeatCount: Number(event.target.value) })} />
              </label>
            </div>
            <div className="mt-3 space-y-3">
              {block.steps.map((step, stepIndex) => (
                <StepEditor
                  key={step.id}
                  step={step}
                  index={stepIndex}
                  blockKind={block.kind}
                  onChange={(patch) => updateStep(block, step.id, patch)}
                  onRemove={() => updateBlock(block.id, { steps: block.steps.length > 1 ? block.steps.filter((item) => item.id !== step.id) : block.steps })}
                />
              ))}
              <Button type="button" variant="ghost" className="w-full" onClick={() => updateBlock(block.id, { steps: [...block.steps, createEmptyStructuredStep()] })}><Plus size={14} /> Schritt</Button>
            </div>
          </section>
        ))}
        <Button type="button" onClick={addBlock} className="w-full"><Plus size={15} /> Block</Button>
      </div>
    </div>
  );
}

function DayColumn({ label, onDrop, children }: { label: string; onDrop: (sessionId: string) => void; children: React.ReactNode }) {
  return (
    <section
      className="min-h-40 rounded-lg border border-[var(--line)] bg-[var(--soft-bg)] p-2"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const sessionId = event.dataTransfer.getData("application/x-workout-id");
        if (sessionId) onDrop(sessionId);
      }}
    >
      <p className="mono mb-2 text-center text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">{label}</p>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function StepEditor({ step, index, blockKind, onChange, onRemove }: { step: StructuredSwimStep; index: number; blockKind: StructuredSwimBlock["kind"]; onChange: (patch: Partial<StructuredSwimStep>) => void; onRemove: () => void }) {
  return (
    <div className={cn("rounded-lg border p-3", step.needsReview ? "border-[var(--warn)]" : "border-[var(--line)]")}>
      <div className="flex items-center justify-between">
        <p className="mono text-[9px] uppercase tracking-[0.12em] text-[var(--subtle)]">Schritt {index + 1}</p>
        <IconButton title="Schritt löschen" onClick={onRemove}><Trash2 size={13} /></IconButton>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <NumberControl label="Wdh." value={step.repetitions} min={1} max={100} onChange={(value) => onChange({ repetitions: value, needsReview: false })} />
        <NumberControl label="Meter" value={step.distanceMeters} min={5} max={5000} onChange={(value) => onChange({ distanceMeters: value, needsReview: false })} />
        <NumberControl label="Pause s" value={step.restSeconds} min={0} max={1800} onChange={(value) => onChange({ restSeconds: value })} />
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <label className="grid gap-1 text-xs text-[var(--muted)]">Schwimmart
          <select value={step.stroke} onChange={(event) => onChange({ stroke: event.target.value as StructuredSwimStep["stroke"] })}>
            {STROKES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-[var(--muted)]">Intensitätsmodell
          <select value={step.intensity.type} onChange={(event) => onChange({ intensity: createIntensity(event.target.value) })}>
            <option value="zone">Zone</option>
            <option value="css">CSS-Abstand</option>
            <option value="rpe">RPE</option>
            <option value="free">Freies Ziel</option>
          </select>
        </label>
      </div>
      <IntensityEditor step={step} onChange={onChange} />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {EQUIPMENT.map(([value, label]) => {
          const selected = step.equipment.includes(value);
          return <button key={value} type="button" aria-pressed={selected} onClick={() => onChange({ equipment: selected ? step.equipment.filter((item) => item !== value) : [...step.equipment, value as SwimEquipment] })} className={cn("rounded-full border px-2 py-1 text-[10px]", selected ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--line)] text-[var(--subtle)]")}>{label}</button>;
        })}
      </div>
      {blockKind === "drill" ? (
        <div className="mt-3 grid gap-2">
          <InspectorField label="Drill" value={step.drillName ?? ""} onChange={(value) => onChange({ drillName: value })} />
          <InspectorField label="Cue" value={step.cue ?? ""} onChange={(value) => onChange({ cue: value })} />
        </div>
      ) : null}
      <label className="mt-3 grid gap-1 text-xs text-[var(--muted)]">Coach-Notiz
        <textarea rows={2} value={step.notes ?? ""} onChange={(event) => onChange({ notes: event.target.value })} />
      </label>
      {step.needsReview ? <p className="mt-2 text-xs text-[var(--warn)]">Import prüfen: {step.legacyText}</p> : null}
    </div>
  );
}

function IntensityEditor({ step, onChange }: { step: StructuredSwimStep; onChange: (patch: Partial<StructuredSwimStep>) => void }) {
  const intensity = step.intensity;
  if (intensity.type === "zone") {
    return (
      <div className="mt-2 grid grid-cols-5 gap-1">
        {(["Z1", "Z2", "Z3", "Z4", "Z5"] as const).map((zone) => (
          <button key={zone} type="button" onClick={() => onChange({ intensity: { type: "zone", zone } })} className={cn("h-9 rounded-lg border text-xs", intensity.zone === zone ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--line)] text-[var(--muted)]")}>{zone}</button>
        ))}
      </div>
    );
  }
  if (intensity.type === "css") {
    return <div className="mt-2"><NumberControl label="Sekunden je 100 m relativ zu CSS" value={intensity.offsetSecondsPer100m} min={-20} max={60} onChange={(value) => onChange({ intensity: { type: "css", offsetSecondsPer100m: value } })} /></div>;
  }
  if (intensity.type === "rpe") {
    return (
      <div className="mt-2 grid grid-cols-2 gap-2">
        <NumberControl label="RPE von" value={intensity.min} min={1} max={10} onChange={(value) => onChange({ intensity: { ...intensity, min: value } })} />
        <NumberControl label="RPE bis" value={intensity.max} min={1} max={10} onChange={(value) => onChange({ intensity: { ...intensity, max: value } })} />
      </div>
    );
  }
  return <div className="mt-2"><InspectorField label="Coach-Ziel" value={intensity.label} onChange={(value) => onChange({ intensity: { type: "free", label: value } })} /></div>;
}

function createIntensity(type: string): StructuredSwimStep["intensity"] {
  if (type === "css") return { type: "css", offsetSecondsPer100m: 0 };
  if (type === "rpe") return { type: "rpe", min: 4, max: 6 };
  if (type === "free") return { type: "free", label: "Coach-Vorgabe" };
  return { type: "zone", zone: "Z2" };
}

function createBlockPreset(kind: StructuredSwimBlock["kind"]): StructuredSwimBlock {
  const label = BLOCK_KINDS.find(([value]) => value === kind)?.[1] ?? "Block";
  return { id: createPlanNodeId("block"), title: label, kind, repeatCount: 1, steps: [createEmptyStructuredStep()] };
}

function createWorkoutPreset(preset: "technique" | "aerobic" | "css"): StructuredTrainingPlanSession {
  const base = createEmptyStructuredSession();
  if (preset === "technique") {
    return {
      ...base,
      title: "Technik & Wasserlage",
      focus: "Körperlinie und früher Catch",
      blocks: [
        presetBlock("Einschwimmen", "warmup", 4, 100, "Z1"),
        {
          ...presetBlock("Technik", "drill", 8, 50, "Z1"),
          steps: [{
            ...createEmptyStructuredStep(),
            repetitions: 8,
            distanceMeters: 50,
            restSeconds: 20,
            intensity: { type: "zone", zone: "Z1" },
            drillName: "Sculling",
            cue: "Druck früh aufbauen",
          }],
        },
        presetBlock("Ausschwimmen", "cooldown", 4, 50, "Z1"),
      ],
    };
  }
  if (preset === "css") {
    return {
      ...base,
      title: "CSS-Entwicklung",
      focus: "Schwellenpace stabilisieren",
      blocks: [
        presetBlock("Einschwimmen", "warmup", 4, 100, "Z1"),
        {
          ...presetBlock("CSS-Serie", "main", 8, 100, "Z3"),
          steps: [{
            ...createEmptyStructuredStep(),
            repetitions: 8,
            distanceMeters: 100,
            restSeconds: 20,
            intensity: { type: "css", offsetSecondsPer100m: 3 },
          }],
        },
        presetBlock("Ausschwimmen", "cooldown", 4, 50, "Z1"),
      ],
    };
  }
  return {
    ...base,
    title: "Aerobe Grundlage",
    focus: "Ruhige Ausdauer und Effizienz",
    blocks: [
      presetBlock("Einschwimmen", "warmup", 4, 100, "Z1"),
      presetBlock("Aerobe Hauptserie", "main", 6, 200, "Z2"),
      presetBlock("Ausschwimmen", "cooldown", 4, 50, "Z1"),
    ],
  };
}

function presetBlock(
  title: string,
  kind: StructuredSwimBlock["kind"],
  repetitions: number,
  distanceMeters: number,
  zone: "Z1" | "Z2" | "Z3" | "Z4" | "Z5",
): StructuredSwimBlock {
  return {
    id: createPlanNodeId("block"),
    title,
    kind,
    repeatCount: 1,
    steps: [{
      ...createEmptyStructuredStep(),
      repetitions,
      distanceMeters,
      intensity: { type: "zone", zone },
    }],
  };
}

function findSession(content: TrainingPlanContentV2, id: string | null) {
  if (!id) return null;
  for (let weekIndex = 0; weekIndex < content.weeks.length; weekIndex += 1) {
    const week = content.weeks[weekIndex];
    const session = week.sessions.find((item) => item.id === id);
    if (session) return { week, weekIndex, session };
  }
  return null;
}

function InspectorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs text-[var(--muted)]">{label}<input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function NumberControl({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <label className="grid gap-1 text-[10px] text-[var(--subtle)]">{label}<input type="number" value={value} min={min} max={max} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function IconButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <button type="button" title={title} aria-label={title} disabled={disabled} onClick={onClick} className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--raised-bg)] hover:text-[var(--foreground)] disabled:opacity-30">{children}</button>;
}

function formatMeters(value: number) {
  return value >= 1000 ? `${(value / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} km` : `${value} m`;
}
