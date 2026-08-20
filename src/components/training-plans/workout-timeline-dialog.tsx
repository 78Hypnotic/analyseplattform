"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Activity, Bike, Maximize2, Waves, X } from "lucide-react";
import { Button } from "@/components/button";
import { WorkoutTimelineBuilder } from "@/components/training-plans/workout-timeline-builder";
import type {
  AthleteBenchmarkSnapshot,
  StructuredTrainingPlanSession,
  TrainingPlanDiscipline,
  WorkoutContent,
} from "@/lib/training-plans/types";

export type WorkoutSessionDetails = Pick<
  StructuredTrainingPlanSession,
  "title" | "focus" | "preferredWeekday" | "estimatedDurationMinutes"
>;

const WEEKDAYS = [
  [1, "Montag"], [2, "Dienstag"], [3, "Mittwoch"], [4, "Donnerstag"],
  [5, "Freitag"], [6, "Samstag"], [7, "Sonntag"],
] as const;

type WorkoutTimelineDialogProps = {
  open: boolean;
  content: WorkoutContent;
  onOpenChange: (open: boolean) => void;
  onSave: (content: WorkoutContent, sessionDetails?: WorkoutSessionDetails) => void;
  benchmarks?: AthleteBenchmarkSnapshot;
  sessionDetails?: WorkoutSessionDetails;
  title?: string;
};

export function WorkoutTimelineDialog({
  open,
  content,
  onOpenChange,
  onSave,
  benchmarks,
  sessionDetails,
  title = "Workout bearbeiten",
}: WorkoutTimelineDialogProps) {
  if (!open) return null;

  return createPortal(
    <WorkoutTimelineDialogContent
      content={content}
      onOpenChange={onOpenChange}
      onSave={onSave}
      benchmarks={benchmarks}
      sessionDetails={sessionDetails}
      title={title}
    />,
    document.body,
  );
}

function WorkoutTimelineDialogContent({
  content,
  onOpenChange,
  onSave,
  benchmarks,
  sessionDetails,
  title,
}: Omit<WorkoutTimelineDialogProps, "open">) {
  const [draft, setDraft] = useState(() => structuredClone(content));
  const [detailsDraft, setDetailsDraft] = useState<WorkoutSessionDetails | null>(
    () => sessionDetails ? structuredClone(sessionDetails) : null,
  );
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [onOpenChange]);

  function save() {
    onSave(draft, detailsDraft ?? undefined);
    onOpenChange(false);
  }

  function selectDiscipline(discipline: TrainingPlanDiscipline) {
    setDraft((current) => ({ ...current, discipline }));
    setDetailsDraft((current) => current
      ? { ...current, title: getDisciplineTitle(current.title, discipline) }
      : current);
  }

  return (
    <div
      className="workout-dialog-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-0 backdrop-blur-[2px] sm:p-4 lg:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="workout-dialog-panel flex h-dvh w-full flex-col overflow-hidden bg-[var(--background)] shadow-2xl sm:h-[min(92dvh,64rem)] sm:max-w-[96rem] sm:rounded-lg sm:border sm:border-[var(--line)]"
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--panel)] px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">Workout</p>
            <h2 id={titleId} className="truncate text-lg font-semibold text-[var(--foreground)]">
              {detailsDraft?.title ?? getDisciplineTitle(title, draft.discipline)}
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div
              role="group"
              aria-label="Sportart"
              className="flex rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-1"
            >
              <DisciplineButton
                label="Schwimmen"
                active={draft.discipline === "swim"}
                onClick={() => selectDiscipline("swim")}
                icon={<Waves size={15} />}
              />
              <DisciplineButton
                label="Rad"
                active={draft.discipline === "bike"}
                onClick={() => selectDiscipline("bike")}
                icon={<Bike size={15} />}
              />
              <DisciplineButton
                label="Laufen"
                active={draft.discipline === "run"}
                onClick={() => selectDiscipline("run")}
                icon={<Activity size={15} />}
              />
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Workout Builder schließen"
              onClick={() => onOpenChange(false)}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
          {detailsDraft ? (
            <section className="mb-4 grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 sm:grid-cols-2 xl:grid-cols-[1.2fr_1.2fr_0.8fr_0.6fr]">
              <DialogField label="Titel">
                <input
                  value={detailsDraft.title}
                  onChange={(event) => setDetailsDraft((current) => current ? { ...current, title: event.target.value } : current)}
                  className="h-10 w-full px-3 py-2"
                />
              </DialogField>
              <DialogField label="Fokus">
                <input
                  value={detailsDraft.focus}
                  onChange={(event) => setDetailsDraft((current) => current ? { ...current, focus: event.target.value } : current)}
                  className="h-10 w-full px-3 py-2"
                />
              </DialogField>
              <DialogField label="Trainingstag">
                <select
                  value={detailsDraft.preferredWeekday ?? ""}
                  onChange={(event) => setDetailsDraft((current) => current
                    ? {
                        ...current,
                        preferredWeekday: event.target.value
                          ? Number(event.target.value) as WorkoutSessionDetails["preferredWeekday"]
                          : undefined,
                      }
                    : current)}
                  className="h-10 w-full px-3 py-2"
                >
                  <option value="">Flexibel</option>
                  {WEEKDAYS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </DialogField>
              <DialogField label="Gesamtdauer min">
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={detailsDraft.estimatedDurationMinutes ?? ""}
                  onChange={(event) => setDetailsDraft((current) => current
                    ? {
                        ...current,
                        estimatedDurationMinutes: event.target.value
                          ? Math.max(1, Math.min(600, event.target.valueAsNumber))
                          : undefined,
                      }
                    : current)}
                  className="h-10 w-full px-3 py-2"
                />
              </DialogField>
            </section>
          ) : null}
          <WorkoutTimelineBuilder content={draft} onChange={setDraft} benchmarks={benchmarks} />
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--line)] bg-[var(--panel)] px-4 py-3 sm:px-6">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button type="button" variant="primary" onClick={save}>Workout übernehmen</Button>
        </footer>
      </div>
    </div>
  );
}

function DisciplineButton({
  label,
  active,
  icon,
  onClick,
}: {
  label: string;
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={active
        ? "inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--accent)] px-2.5 text-xs font-medium text-[var(--accent-foreground)]"
        : "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]"}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function getDisciplineTitle(title: string | undefined, discipline: TrainingPlanDiscipline) {
  const defaultTitles = ["Neue Schwimmeinheit", "Neue Radeinheit", "Neue Laufeinheit"];
  if (title && !defaultTitles.includes(title)) return title;
  if (discipline === "bike") return "Neue Radeinheit";
  if (discipline === "run") return "Neue Laufeinheit";
  return "Neue Schwimmeinheit";
}

type WorkoutTimelineLauncherProps = Omit<WorkoutTimelineDialogProps, "open" | "onOpenChange" | "onSave"> & {
  onChange: (content: WorkoutContent) => void;
  buttonLabel?: string;
};

export function WorkoutTimelineLauncher({
  content,
  onChange,
  benchmarks,
  title,
  buttonLabel = "Workout Builder öffnen",
}: WorkoutTimelineLauncherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Maximize2 size={16} /> {buttonLabel}
      </Button>
      <WorkoutTimelineDialog
        open={open}
        content={content}
        onOpenChange={setOpen}
        onSave={onChange}
        benchmarks={benchmarks}
        title={title}
      />
    </>
  );
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  ));
}

function DialogField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-xs text-[var(--muted)]">
      <span className="mono text-[9px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</span>
      {children}
    </label>
  );
}