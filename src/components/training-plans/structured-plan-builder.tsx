"use client";

import { useDeferredValue, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Plus,
  Trash2,
  Waves,
} from "lucide-react";
import { Button } from "@/components/button";
import {
  WorkoutTimelineDialog,
  type WorkoutSessionDetails,
} from "@/components/training-plans/workout-timeline-dialog";
import { duplicateSession, duplicateWeek, moveItem, moveSession } from "@/lib/training-plans/commands";
import {
  createEmptyStructuredSession,
  createEmptyWorkoutContent,
  createPlanNodeId,
} from "@/lib/training-plans/content";
import { getPlanMetrics, getSessionMeters, getWeekMeters } from "@/lib/training-plans/metrics";
import type {
  StructuredTrainingPlanSession,
  StructuredTrainingPlanWeek,
  TrainingPlanDiscipline,
  TrainingPlanContentV2,
} from "@/lib/training-plans/types";

const WEEKDAYS = [
  [1, "Mo", "Montag"], [2, "Di", "Dienstag"], [3, "Mi", "Mittwoch"],
  [4, "Do", "Donnerstag"], [5, "Fr", "Freitag"], [6, "Sa", "Samstag"], [7, "So", "Sonntag"],
] as const;
type PreferredWeekday = NonNullable<StructuredTrainingPlanSession["preferredWeekday"]>;
type TimelineDialogState = {
  sessionId: string;
  title: string;
  content: NonNullable<StructuredTrainingPlanSession["timelineWorkout"]>;
  sessionDetails: WorkoutSessionDetails;
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
  const [timelineDialog, setTimelineDialog] = useState<TimelineDialogState | null>(null);

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
    setTimelineDialog({
      sessionId: session.id,
      title: session.title,
      content: timelineWorkout,
      sessionDetails: getSessionDetails(session),
    });
  }

  function openTimelineDialog(session: StructuredTrainingPlanSession) {
    setTimelineDialog({
      sessionId: session.id,
      title: session.title,
      content: session.timelineWorkout ?? createEmptyWorkoutContent("swim"),
      sessionDetails: getSessionDetails(session),
    });
  }

  function saveTimelineWorkout(
    timelineWorkout: NonNullable<StructuredTrainingPlanSession["timelineWorkout"]>,
    sessionDetails?: WorkoutSessionDetails,
  ) {
    if (!timelineDialog) return;
    onChange({
      ...content,
      weeks: content.weeks.map((week) => ({
        ...week,
        sessions: week.sessions.map((session) => session.id === timelineDialog.sessionId
          ? {
              ...session,
              ...sessionDetails,
              title: sessionDetails?.title
                ?? getDisciplineSessionTitle(session.title, timelineWorkout.discipline),
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
    const duplicate = sessions[sourceIndex + 1];
    if (duplicate) openTimelineDialog(duplicate);
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
        sessionDetails={timelineDialog?.sessionDetails}
        title={timelineDialog?.title}
      />
      <PlanSummary metrics={metrics} />
      <div>
        <div className="min-w-0 space-y-4">
          {content.weeks.map((week, weekIndex) => (
            <WeekRow
              key={week.id}
              week={week}
              weekIndex={weekIndex}
              onOpenSession={openTimelineDialog}
              onUpdate={(patch) => updateWeek(week.id, patch)}
              onAddSession={() => addSession(week.id)}
              onDuplicateSession={(sessionId) => selectDuplicate(week.id, sessionId)}
              onRemoveSession={(sessionId) => {
                if (week.sessions.length <= 1) return;
                const remaining = week.sessions.filter((session) => session.id !== sessionId);
                updateWeek(week.id, { sessions: remaining });
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

function getSessionDetails(session: StructuredTrainingPlanSession): WorkoutSessionDetails {
  return {
    title: session.title,
    focus: session.focus,
    preferredWeekday: session.preferredWeekday,
    estimatedDurationMinutes: session.estimatedDurationMinutes,
  };
}

function WeekRow({
  week,
  weekIndex,
  onOpenSession,
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
  onOpenSession: (session: StructuredTrainingPlanSession) => void;
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
        onOpen={() => onOpenSession(session)}
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

function WorkoutCard({ session, onOpen, onDuplicate, onRemove, canRemove }: {
  session: StructuredTrainingPlanSession;
  onOpen: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const reviewCount = session.blocks.flatMap((block) => block.steps).filter((step) => step.needsReview).length;
  return (
    <article
      draggable
      onDragStart={(event) => event.dataTransfer.setData("application/x-workout-id", session.id)}
      className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 transition hover:border-[var(--accent)]"
    >
      <button type="button" onClick={onOpen} className="block w-full text-left">
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

function IconButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <button type="button" title={title} aria-label={title} disabled={disabled} onClick={onClick} className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--raised-bg)] hover:text-[var(--foreground)] disabled:opacity-30">{children}</button>;
}

function formatMeters(value: number) {
  return value >= 1000 ? `${(value / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} km` : `${value} m`;
}
