"use client";

import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Activity, Bike, BookOpen, Maximize2, Redo2, Save, Search, Star, Trash2, Undo2, Waves, X } from "lucide-react";
import { Button } from "@/components/button";
import { WorkoutTimelineBuilder } from "@/components/training-plans/workout-timeline-builder";
import {
  deleteWorkoutLibraryItem,
  listWorkoutLibraryItems,
  markWorkoutLibraryItemUsed,
  saveWorkoutLibraryItem,
  setWorkoutLibraryFavorite,
  updateWorkoutLibraryItem,
} from "@/app/trainingsplaene/verwalten/workout-library-actions";
import type {
  AthleteBenchmarkSnapshot,
  StructuredTrainingPlanSession,
  TrainingPlanDiscipline,
  WorkoutContent,
  WorkoutLibraryItem,
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
  const { present: draft, setPresent: setDraft, undo, redo, canUndo, canRedo } = useWorkoutHistory(content);
  const [detailsDraft, setDetailsDraft] = useState<WorkoutSessionDetails | null>(
    () => sessionDetails ? structuredClone(sessionDetails) : null,
  );
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<WorkoutLibraryItem[]>([]);
  const [libraryStatus, setLibraryStatus] = useState<"loading" | "ready" | "error">("loading");
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null);
  const [savingLibraryItem, setSavingLibraryItem] = useState(false);
  const [activeLibraryItemId, setActiveLibraryItemId] = useState<string | null>(null);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<"all" | TrainingPlanDiscipline>("all");
  const [modeFilter, setModeFilter] = useState<"all" | "time" | "distance" | "mixed">("all");
  const [intensityFilter, setIntensityFilter] = useState<"all" | "threshold_power_percentage" | "max_heart_rate_percentage" | "vo2max_power_percentage">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [deletingLibraryItemId, setDeletingLibraryItemId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const deferredLibraryQuery = useDeferredValue(libraryQuery);
  const filteredLibraryItems = useMemo(() => filterLibraryItems(libraryItems, {
    query: deferredLibraryQuery,
    discipline: disciplineFilter,
    mode: modeFilter,
    intensity: intensityFilter,
    favoritesOnly,
  }), [deferredLibraryQuery, disciplineFilter, favoritesOnly, intensityFilter, libraryItems, modeFilter]);

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

  useEffect(() => {
    function handleHistoryShortcut(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    }

    document.addEventListener("keydown", handleHistoryShortcut);
    return () => document.removeEventListener("keydown", handleHistoryShortcut);
  }, [redo, undo]);

  useEffect(() => {
    let cancelled = false;
    listWorkoutLibraryItems()
      .then((result) => {
        if (cancelled) return;
        setLibraryItems(result.items);
        setLibraryStatus(result.status === "success" ? "ready" : "error");
        if (result.status === "error") setLibraryMessage(result.message);
      })
      .catch(() => {
        if (cancelled) return;
        setLibraryStatus("error");
        setLibraryMessage("Workout-Bibliothek konnte nicht geladen werden.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  async function saveToLibrary(forceNew = false) {
    const libraryTitle = detailsDraft?.title ?? getDisciplineTitle(title, draft.discipline);
    if (libraryTitle.trim().length < 3) {
      setLibraryMessage("Bitte einen Workout-Titel mit mindestens 3 Zeichen eingeben.");
      return;
    }
    setSavingLibraryItem(true);
    setLibraryMessage(null);
    const result = activeLibraryItemId && !forceNew
      ? await updateWorkoutLibraryItem({ id: activeLibraryItemId, title: libraryTitle, content: draft })
      : await saveWorkoutLibraryItem({ title: libraryTitle, content: draft });
    setSavingLibraryItem(false);
    setLibraryMessage(result.message);
    if (result.status === "success" && result.item) {
      setLibraryItems((current) => [result.item!, ...current.filter((item) => item.id !== result.item?.id)]);
      setActiveLibraryItemId(result.item.id);
      setLibraryOpen(true);
    }
  }

  async function loadFromLibrary(item: WorkoutLibraryItem) {
    setDraft(structuredClone(item.content));
    setActiveLibraryItemId(item.id);
    setDetailsDraft((current) => current
      ? { ...current, title: isDefaultWorkoutTitle(current.title) ? item.title : current.title }
      : current);
    setLibraryMessage(`„${item.title}“ geladen. Mit „Workout übernehmen“ in den Plan schreiben.`);
    const result = await markWorkoutLibraryItemUsed(item.id);
    if (result.status === "success" && result.item) {
      setLibraryItems((current) => [result.item!, ...current.filter((entry) => entry.id !== item.id)]);
    }
  }

  async function toggleFavorite(item: WorkoutLibraryItem) {
    const result = await setWorkoutLibraryFavorite({ id: item.id, isFavorite: !item.is_favorite });
    setLibraryMessage(result.message);
    if (result.status === "success" && result.item) {
      setLibraryItems((current) => [result.item!, ...current.filter((entry) => entry.id !== item.id)]);
    }
  }

  async function deleteFromLibrary(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingLibraryItemId(id);
    const result = await deleteWorkoutLibraryItem(id);
    setDeletingLibraryItemId(null);
    setConfirmDeleteId(null);
    setLibraryMessage(result.message);
    if (result.status === "success") {
      setLibraryItems((current) => current.filter((item) => item.id !== id));
      if (activeLibraryItemId === id) setActiveLibraryItemId(null);
    }
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
            <div role="group" aria-label="Änderungsverlauf" className="flex rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-1">
              <button
                type="button"
                aria-label="Rückgängig"
                title="Rückgängig (Strg+Z)"
                disabled={!canUndo}
                onClick={undo}
                className="inline-flex size-8 items-center justify-center rounded-md text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30"
              >
                <Undo2 size={15} />
              </button>
              <button
                type="button"
                aria-label="Wiederholen"
                title="Wiederholen (Strg+Umschalt+Z)"
                disabled={!canRedo}
                onClick={redo}
                className="inline-flex size-8 items-center justify-center rounded-md text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30"
              >
                <Redo2 size={15} />
              </button>
            </div>
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
          <section className="mb-4 rounded-lg border border-[var(--line)] bg-[var(--panel)]">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <button
                type="button"
                aria-expanded={libraryOpen}
                onClick={() => setLibraryOpen((current) => !current)}
                className="inline-flex h-9 items-center gap-2 text-sm font-medium text-[var(--foreground)]"
              >
                <BookOpen size={16} /> Bibliothek
                <span className="text-xs font-normal text-[var(--subtle)]">{libraryItems.length}</span>
              </button>
              <div className="flex flex-wrap gap-1">
                {activeLibraryItemId ? (
                  <Button type="button" variant="ghost" disabled={savingLibraryItem} onClick={() => saveToLibrary(true)}>
                    Als neu speichern
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" disabled={savingLibraryItem} onClick={() => saveToLibrary(false)}>
                  <Save size={15} /> {savingLibraryItem ? "Speichert..." : activeLibraryItemId ? "Bibliothek aktualisieren" : "In Bibliothek speichern"}
                </Button>
              </div>
            </div>
            {libraryMessage ? (
              <p role="status" className="border-t border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]">{libraryMessage}</p>
            ) : null}
            {libraryOpen ? (
              <div className="border-t border-[var(--line)]">
                <div className="grid gap-2 border-b border-[var(--line)] p-3 lg:grid-cols-[minmax(12rem,1fr)_repeat(3,auto)_auto]">
                  <label className="relative">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--subtle)]" />
                    <input
                      aria-label="Workout-Bibliothek durchsuchen"
                      value={libraryQuery}
                      onChange={(event) => setLibraryQuery(event.target.value)}
                      placeholder="Workout suchen"
                      className="h-9 w-full py-1.5 pl-9 pr-3 text-sm"
                    />
                  </label>
                  <LibraryFilter label="Sportart" value={disciplineFilter} onChange={(value) => setDisciplineFilter(value as typeof disciplineFilter)} options={[
                    ["all", "Alle Sportarten"], ["swim", "Schwimmen"], ["bike", "Rad"], ["run", "Laufen"],
                  ]} />
                  <LibraryFilter label="Vorgabe" value={modeFilter} onChange={(value) => setModeFilter(value as typeof modeFilter)} options={[
                    ["all", "Dauer & Distanz"], ["time", "Dauer"], ["distance", "Distanz"], ["mixed", "Gemischt"],
                  ]} />
                  <LibraryFilter label="Intensität" value={intensityFilter} onChange={(value) => setIntensityFilter(value as typeof intensityFilter)} options={[
                    ["all", "Alle Intensitäten"], ["threshold_power_percentage", "FTP/FSL"], ["max_heart_rate_percentage", "HFmax"], ["vo2max_power_percentage", "VO2max"],
                  ]} />
                  <button
                    type="button"
                    aria-pressed={favoritesOnly}
                    onClick={() => setFavoritesOnly((current) => !current)}
                    className={favoritesOnly
                      ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--accent)] px-3 text-xs text-[var(--accent)]"
                      : "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] px-3 text-xs text-[var(--muted)]"}
                  >
                    <Star size={14} fill={favoritesOnly ? "currentColor" : "none"} /> Favoriten
                  </button>
                </div>
                {libraryStatus === "loading" ? <p className="px-3 py-4 text-sm text-[var(--muted)]">Bibliothek wird geladen...</p> : null}
                {libraryStatus === "error" ? <p className="px-3 py-4 text-sm text-[var(--warn)]">Bibliothek ist derzeit nicht verfügbar.</p> : null}
                {libraryStatus === "ready" && libraryItems.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-[var(--muted)]">Noch keine Workouts gespeichert.</p>
                ) : null}
                {libraryStatus === "ready" && libraryItems.length > 0 && filteredLibraryItems.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-[var(--muted)]">Keine Workouts passen zu den Filtern.</p>
                ) : null}
                {filteredLibraryItems.map((item) => (
                  <div key={item.id} className="grid gap-3 border-b border-[var(--line)] px-3 py-3 last:border-b-0 sm:grid-cols-[auto_minmax(0,1fr)_8rem_auto_auto] sm:items-center">
                    <button
                      type="button"
                      aria-label={item.is_favorite ? `${item.title} aus Favoriten entfernen` : `${item.title} als Favorit markieren`}
                      onClick={() => toggleFavorite(item)}
                      className={item.is_favorite ? "text-[var(--accent)]" : "text-[var(--subtle)] hover:text-[var(--foreground)]"}
                    >
                      <Star size={16} fill={item.is_favorite ? "currentColor" : "none"} />
                    </button>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">{item.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--subtle)]">
                        {disciplineLabel(item.discipline)} · {workoutModeLabel(item.content)} · {item.last_used_at ? `Zuletzt ${formatLibraryUpdatedAt(item.last_used_at)}` : formatLibraryUpdatedAt(item.updated_at)}
                      </p>
                    </div>
                    <WorkoutMiniPreview content={item.content} />
                    <Button type="button" variant="ghost" onClick={() => loadFromLibrary(item)}>Laden</Button>
                    <button
                      type="button"
                      disabled={deletingLibraryItemId === item.id}
                      onClick={() => deleteFromLibrary(item.id)}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs text-[var(--warn)] hover:bg-[var(--raised-bg)] disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      {confirmDeleteId === item.id ? "Löschen bestätigen" : "Löschen"}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
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

function isDefaultWorkoutTitle(title: string) {
  return ["Neue Schwimmeinheit", "Neue Radeinheit", "Neue Laufeinheit", "Workout bearbeiten"].includes(title);
}

function disciplineLabel(discipline: TrainingPlanDiscipline) {
  if (discipline === "bike") return "Rad";
  if (discipline === "run") return "Laufen";
  return "Schwimmen";
}

function workoutModeLabel(content: WorkoutContent) {
  const modes = new Set(content.blocks.flatMap((block) => block.steps.map((step) => step.duration.type)));
  if (modes.size > 1) return "Gemischt";
  return modes.has("distance") ? "Distanz" : "Dauer";
}

type LibraryFilters = {
  query: string;
  discipline: "all" | TrainingPlanDiscipline;
  mode: "all" | "time" | "distance" | "mixed";
  intensity: "all" | "threshold_power_percentage" | "max_heart_rate_percentage" | "vo2max_power_percentage";
  favoritesOnly: boolean;
};

function filterLibraryItems(items: WorkoutLibraryItem[], filters: LibraryFilters) {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase("de-DE");
  return items
    .filter((item) => !normalizedQuery || item.title.toLocaleLowerCase("de-DE").includes(normalizedQuery))
    .filter((item) => filters.discipline === "all" || item.discipline === filters.discipline)
    .filter((item) => filters.mode === "all" || workoutMode(item.content) === filters.mode)
    .filter((item) => filters.intensity === "all" || workoutIntensities(item.content).has(filters.intensity))
    .filter((item) => !filters.favoritesOnly || item.is_favorite)
    .sort((left, right) => {
      if (left.is_favorite !== right.is_favorite) return left.is_favorite ? -1 : 1;
      return (right.last_used_at ?? right.updated_at).localeCompare(left.last_used_at ?? left.updated_at);
    });
}

function workoutMode(content: WorkoutContent): "time" | "distance" | "mixed" {
  const modes = new Set(content.blocks.flatMap((block) => block.steps.map((step) => step.duration.type)));
  if (modes.size > 1) return "mixed";
  return modes.has("distance") ? "distance" : "time";
}

function workoutIntensities(content: WorkoutContent) {
  return new Set(content.blocks.flatMap((block) => block.steps.flatMap((step) => step.targets.map((target) => target.type))));
}

function LibraryFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<readonly [string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 min-w-32 px-2 !py-0 text-xs"
    >
      {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
    </select>
  );
}

function WorkoutMiniPreview({ content }: { content: WorkoutContent }) {
  const segments = content.blocks.flatMap((block) => Array.from({ length: block.repeatCount }, () => block.steps).flat());
  return (
    <div aria-label="Workout-Vorschau" className="flex h-9 items-end gap-px overflow-hidden rounded border border-[var(--line)] bg-[var(--soft-bg)] p-1">
      {segments.slice(0, 18).map((step, index) => {
        const target = step.targets[0];
        const intensity = target?.maxPercent ?? target?.minPercent ?? 50;
        const extent = step.duration.type === "time" ? step.duration.seconds / 60 : step.duration.meters / 100;
        return (
          <span
            key={`${step.id}-${index}`}
            className="min-w-1 flex-1 rounded-[2px] bg-[var(--accent)]/65"
            style={{ height: `${Math.max(15, Math.min(100, intensity / 1.5))}%`, flexGrow: Math.max(1, extent) }}
          />
        );
      })}
    </div>
  );
}

function formatLibraryUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Datum unbekannt"
    : new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date);
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

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
    || (target instanceof HTMLElement && target.isContentEditable);
}

function useWorkoutHistory(initialContent: WorkoutContent) {
  const [history, setHistory] = useState(() => ({
    past: [] as WorkoutContent[],
    present: structuredClone(initialContent),
    future: [] as WorkoutContent[],
  }));

  const setPresent = useCallback((update: React.SetStateAction<WorkoutContent>) => {
    setHistory((current) => {
      const next = typeof update === "function" ? update(current.present) : update;
      if (Object.is(next, current.present)) return current;
      return {
        past: [...current.past, current.present].slice(-50),
        present: next,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      const previous = current.past.at(-1);
      if (!previous) return current;
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future].slice(0, 50),
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      const next = current.future[0];
      if (!next) return current;
      return {
        past: [...current.past, current.present].slice(-50),
        present: next,
        future: current.future.slice(1),
      };
    });
  }, []);

  return {
    present: history.present,
    setPresent,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}

function DialogField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-xs text-[var(--muted)]">
      <span className="mono text-[9px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</span>
      {children}
    </label>
  );
}