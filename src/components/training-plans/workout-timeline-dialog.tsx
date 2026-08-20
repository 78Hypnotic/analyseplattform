"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import { Button } from "@/components/button";
import { WorkoutTimelineBuilder } from "@/components/training-plans/workout-timeline-builder";
import type { AthleteBenchmarkSnapshot, WorkoutContent } from "@/lib/training-plans/types";

type WorkoutTimelineDialogProps = {
  open: boolean;
  content: WorkoutContent;
  onOpenChange: (open: boolean) => void;
  onSave: (content: WorkoutContent) => void;
  benchmarks?: AthleteBenchmarkSnapshot;
  title?: string;
};

export function WorkoutTimelineDialog({
  open,
  content,
  onOpenChange,
  onSave,
  benchmarks,
  title = "Workout bearbeiten",
}: WorkoutTimelineDialogProps) {
  if (!open) return null;

  return createPortal(
    <WorkoutTimelineDialogContent
      content={content}
      onOpenChange={onOpenChange}
      onSave={onSave}
      benchmarks={benchmarks}
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
  title,
}: Omit<WorkoutTimelineDialogProps, "open">) {
  const [draft, setDraft] = useState(() => structuredClone(content));
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
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-0 backdrop-blur-[2px] sm:p-4 lg:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-dvh w-full flex-col overflow-hidden bg-[var(--background)] shadow-2xl sm:h-[min(92dvh,64rem)] sm:max-w-[96rem] sm:rounded-lg sm:border sm:border-[var(--line)]"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--panel)] px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">
              {draft.discipline === "bike" ? "Rad" : draft.discipline === "run" ? "Laufen" : "Schwimmen"}
            </p>
            <h2 id={titleId} className="truncate text-lg font-semibold text-[var(--foreground)]">{title}</h2>
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
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
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