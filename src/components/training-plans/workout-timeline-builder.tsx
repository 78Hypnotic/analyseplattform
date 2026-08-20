"use client";

import { useMemo, useState } from "react";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import {
  addWorkoutBlock,
  addWorkoutStep,
  duplicateWorkoutBlock,
  moveWorkoutBlock,
  removeWorkoutBlock,
  removeWorkoutStep,
  updateWorkoutBlock,
  updateWorkoutStep,
} from "@/lib/training-plans/commands";
import { createWorkoutBlock, createWorkoutStep, getWorkoutAxisMode } from "@/lib/training-plans/content";
import { resolveWorkoutTargets } from "@/lib/training-plans/workout-targets";
import type {
  AthleteBenchmarkSnapshot,
  WorkoutBlock,
  WorkoutContent,
  WorkoutDuration,
  WorkoutStep,
  WorkoutTarget,
} from "@/lib/training-plans/types";

const BLOCK_KINDS = [
  ["warmup", "Warm-up"],
  ["steady", "Grundlage"],
  ["interval", "Intervall"],
  ["recovery", "Erholung"],
  ["cooldown", "Cooldown"],
] as const;

const TARGET_TYPES = [
  ["threshold_power_percentage", "% FTP/FSL"],
  ["max_heart_rate_percentage", "% HFmax"],
  ["vo2max_power_percentage", "% VO2max-Leistung"],
] as const;

type WorkoutTimelineBuilderProps = {
  content: WorkoutContent;
  onChange: (content: WorkoutContent) => void;
  benchmarks?: AthleteBenchmarkSnapshot;
};

export function WorkoutTimelineBuilder({ content, onChange, benchmarks }: WorkoutTimelineBuilderProps) {
  const [selectedBlockId, setSelectedBlockId] = useState(content.blocks[0]?.id ?? null);
  const selectedBlock = content.blocks.find((block) => block.id === selectedBlockId) ?? content.blocks[0] ?? null;
  const resolved = useMemo(
    () => benchmarks ? resolveWorkoutTargets(content, benchmarks) : null,
    [benchmarks, content],
  );

  function insertBlock(kind: WorkoutBlock["kind"], index = content.blocks.length) {
    const block = createWorkoutBlock(kind, getWorkoutAxisMode(content));
    onChange(addWorkoutBlock(content, block, index));
    setSelectedBlockId(block.id);
  }

  function handleDrop(event: React.DragEvent, targetIndex: number) {
    event.preventDefault();
    const blockId = event.dataTransfer.getData("application/x-workout-block-id");
    const blockKind = event.dataTransfer.getData("application/x-workout-block-kind") as WorkoutBlock["kind"];
    if (blockId) {
      onChange(moveWorkoutBlock(content, blockId, targetIndex));
      setSelectedBlockId(blockId);
      return;
    }
    if (BLOCK_KINDS.some(([kind]) => kind === blockKind)) {
      insertBlock(blockKind, targetIndex);
    }
  }

  function updateBlock(blockId: string, update: (block: WorkoutBlock) => WorkoutBlock) {
    onChange(updateWorkoutBlock(content, blockId, update));
  }

  function removeBlock(blockId: string) {
    const next = removeWorkoutBlock(content, blockId);
    onChange(next);
    if (selectedBlockId === blockId) setSelectedBlockId(next.blocks[0]?.id ?? null);
  }

  return (
    <section className="space-y-4 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">Workout Builder</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">Timeline</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {BLOCK_KINDS.map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              draggable
              onDragStart={(event) => event.dataTransfer.setData("application/x-workout-block-kind", kind)}
              onClick={() => insertBlock(kind)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 text-xs font-medium text-[var(--foreground)] hover:border-[var(--accent)]"
            >
              <Plus size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-3">
          <IntensityTimeline
            content={content}
            selectedBlockId={selectedBlock?.id ?? null}
            onSelectBlock={setSelectedBlockId}
            onDropBlock={handleDrop}
            onDuplicateBlock={(blockId) => onChange(duplicateWorkoutBlock(content, blockId))}
            onRemoveBlock={removeBlock}
          />
          {resolved?.warnings.length ? (
            <div className="rounded-lg border border-[var(--warn)] bg-[var(--warn)]/10 p-3 text-sm text-[var(--foreground)]">
              {resolved.warnings.length} Zielwerte konnten noch nicht aus dem Athletenprofil berechnet werden.
            </div>
          ) : null}
        </div>

        {selectedBlock ? (
          <BlockInspector
            block={selectedBlock}
            content={content}
            resolved={resolved}
            onChange={onChange}
            onUpdateBlock={(update) => updateBlock(selectedBlock.id, update)}
          />
        ) : null}
      </div>
    </section>
  );
}

function IntensityTimeline({
  content,
  selectedBlockId,
  onSelectBlock,
  onDropBlock,
  onDuplicateBlock,
  onRemoveBlock,
}: {
  content: WorkoutContent;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onDropBlock: (event: React.DragEvent, targetIndex: number) => void;
  onDuplicateBlock: (blockId: string) => void;
  onRemoveBlock: (blockId: string) => void;
}) {
  const axisMode = getWorkoutAxisMode(content);
  const totalExtent = content.blocks.reduce((total, block) => total + getBlockExtent(block, axisMode), 0);

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--soft-bg)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]">
        <span>Breite = {axisMode === "distance" ? "Distanz" : "Dauer"} · Höhe = Intensität</span>
        <span>{formatAxisExtent(totalExtent, axisMode)}</span>
      </div>
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)]">
        <div className="relative h-72 border-r border-[var(--line)] text-[9px] text-[var(--subtle)]">
          {[200, 150, 100, 50, 0].map((value) => (
            <span
              key={value}
              className="absolute right-2 -translate-y-1/2"
              style={{ top: `${100 - value / 2}%` }}
            >
              {value}%
            </span>
          ))}
        </div>
        <div className="overflow-x-auto">
          <div
            className="flex h-72 items-stretch bg-[linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] bg-[length:100%_25%] p-2"
            style={{ minWidth: `${Math.max(720, content.blocks.length * 180)}px` }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onDropBlock(event, content.blocks.length)}
          >
            {content.blocks.map((block, blockIndex) => {
              const segments = getTimelineSegments(block, axisMode);
              const blockExtent = segments.reduce((total, segment) => total + segment.extent, 0);
              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("application/x-workout-block-id", block.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.stopPropagation();
                    onDropBlock(event, blockIndex);
                  }}
                  onClick={() => onSelectBlock(block.id)}
                  className={cn(
                    "group relative flex h-full min-w-32 items-end border-x border-transparent px-px pb-6 pt-9 transition",
                    selectedBlockId === block.id && "border-[var(--accent)]",
                  )}
                  style={{ flexGrow: Math.max(1, blockExtent), flexBasis: `${Math.max(128, segments.length * 34)}px` }}
                >
                  <div className="absolute inset-x-1 top-1 flex items-center justify-between gap-1">
                    <span className="flex min-w-0 items-center gap-1 text-[10px] font-medium text-[var(--foreground)]">
                      <GripVertical size={12} className="shrink-0 text-[var(--subtle)]" />
                      <span className="truncate">{block.title}</span>
                    </span>
                    <span className="flex shrink-0 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        aria-label={`${block.title} duplizieren`}
                        onClick={(event) => { event.stopPropagation(); onDuplicateBlock(block.id); }}
                        className="rounded p-1 text-[var(--muted)] hover:bg-[var(--raised-bg)]"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label={`${block.title} löschen`}
                        onClick={(event) => { event.stopPropagation(); onRemoveBlock(block.id); }}
                        className="rounded p-1 text-[var(--muted)] hover:bg-[var(--raised-bg)]"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  </div>
                  {segments.map((segment, segmentIndex) => (
                    <button
                      key={segment.key}
                      type="button"
                      aria-label={`${block.title}: ${segment.label}, ${segment.display}, ${segment.maxPercent}%`}
                      title={`${segment.label} · ${segment.display} · ${segment.minPercent}-${segment.maxPercent}%`}
                      onClick={(event) => { event.stopPropagation(); onSelectBlock(block.id); }}
                      className={cn(
                        "workout-timeline-segment relative min-w-5 rounded-[4px] border",
                        segment.tone === "heart-rate" && "border-[var(--warn)] bg-[var(--warn)]/50",
                        segment.tone === "vo2max" && "border-[var(--accent-2)] bg-[var(--accent-2)]/50",
                        segment.tone === "threshold" && "border-[var(--accent)] bg-[var(--accent)]/55",
                        segment.tone === "recovery" && "border-[var(--subtle)] bg-[var(--subtle)]/45",
                      )}
                      style={{
                        flexGrow: segment.extent,
                        flexBasis: 0,
                        height: `${Math.max(6, Math.min(100, segment.maxPercent / 2))}%`,
                        animationDelay: `${Math.min(360, blockIndex * 55 + segmentIndex * 28)}ms`,
                      }}
                    />
                  ))}
                  <span className="absolute inset-x-1 bottom-1 truncate text-center text-[9px] text-[var(--subtle)]">
                    {block.repeatCount > 1 ? `${block.repeatCount}x · ` : ""}{formatAxisExtent(blockExtent, axisMode)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

type TimelineSegment = {
  key: string;
  label: string;
  extent: number;
  display: string;
  minPercent: number;
  maxPercent: number;
  tone: "threshold" | "heart-rate" | "vo2max" | "recovery";
};

function getTimelineSegments(block: WorkoutBlock, axisMode: "time" | "distance"): TimelineSegment[] {
  return Array.from({ length: block.repeatCount }, (_, repeatIndex) =>
    block.steps.flatMap((step) => {
      const target = step.targets[0];
      const tone = target?.type === "max_heart_rate_percentage"
        ? "heart-rate"
        : target?.type === "vo2max_power_percentage"
          ? "vo2max"
          : "threshold";
      const workSegment: TimelineSegment = {
        key: `${repeatIndex}-${step.id}-work`,
        label: block.repeatCount > 1 ? `${step.title} ${repeatIndex + 1}` : step.title,
        extent: Math.max(1, getDurationExtent(step.duration, axisMode)),
        display: formatAxisExtent(getDurationExtent(step.duration, axisMode), axisMode),
        minPercent: target?.minPercent ?? 50,
        maxPercent: target?.maxPercent ?? target?.minPercent ?? 50,
        tone,
      };
      const recoverySeconds = step.recoverySeconds ?? 0;
      return recoverySeconds > 0
        ? [
            workSegment,
            {
              key: `${repeatIndex}-${step.id}-recovery`,
              label: "Erholung",
              extent: axisMode === "time" ? recoverySeconds : 0,
              display: formatDuration(recoverySeconds),
              minPercent: 35,
              maxPercent: 45,
              tone: "recovery" as const,
            },
          ]
        : [workSegment];
    }),
  ).flat();
}

function BlockInspector({
  block,
  content,
  resolved,
  onChange,
  onUpdateBlock,
}: {
  block: WorkoutBlock;
  content: WorkoutContent;
  resolved: ReturnType<typeof resolveWorkoutTargets> | null;
  onChange: (content: WorkoutContent) => void;
  onUpdateBlock: (update: (block: WorkoutBlock) => WorkoutBlock) => void;
}) {
  return (
    <aside className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4 xl:sticky xl:top-4">
      <div className="space-y-3">
        <Field label="Blocktitel">
          <input
            value={block.title}
            onChange={(event) => onUpdateBlock((current) => ({ ...current, title: event.target.value }))}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Typ">
            <select
              value={block.kind}
              onChange={(event) => onUpdateBlock((current) => ({ ...current, kind: event.target.value as WorkoutBlock["kind"] }))}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              {BLOCK_KINDS.map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}
            </select>
          </Field>
          <Field label="Wiederholen">
            <input
              type="number"
              min={1}
              max={100}
              value={block.repeatCount}
              onChange={(event) => onUpdateBlock((current) => ({ ...current, repeatCount: clampNumber(event.target.valueAsNumber, 1, 100) }))}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </Field>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">Steps</p>
          <Button type="button" variant="ghost" onClick={() => onChange(addWorkoutStep(content, block.id, createWorkoutStep(block.kind, getWorkoutAxisMode(content))))}>
            <Plus size={14} /> Step
          </Button>
        </div>
        {block.steps.map((step) => (
          <StepEditor
            key={step.id}
            block={block}
            step={step}
            content={content}
            resolvedStep={resolved?.steps.find((entry) => entry.stepId === step.id) ?? null}
            onChange={onChange}
          />
        ))}
      </div>
    </aside>
  );
}

function StepEditor({
  block,
  step,
  content,
  resolvedStep,
  onChange,
}: {
  block: WorkoutBlock;
  step: WorkoutStep;
  content: WorkoutContent;
  resolvedStep: ReturnType<typeof resolveWorkoutTargets>["steps"][number] | null;
  onChange: (content: WorkoutContent) => void;
}) {
  const target = step.targets[0] ?? { type: "threshold_power_percentage", minPercent: 70, maxPercent: 80 };
  const axisMode = getWorkoutAxisMode(content);
  const [distanceUnit, setDistanceUnit] = useState<"m" | "km">(
    () => step.duration.type === "distance" && step.duration.meters >= 1000 && step.duration.meters % 1000 === 0
      ? "km"
      : "m",
  );

  function updateStep(update: (current: WorkoutStep) => WorkoutStep) {
    onChange(updateWorkoutStep(content, block.id, step.id, update));
  }

  function updateDuration(minutes: number) {
    updateStep((current) => ({ ...current, duration: { type: "time", seconds: clampNumber(minutes, 1, 1440) * 60 } }));
  }

  function updateDistance(value: number) {
    const meters = distanceUnit === "km" ? value * 1000 : value;
    updateStep((current) => ({
      ...current,
      duration: { type: "distance", meters: Math.round(clampNumber(meters, 1, 100000)) },
    }));
  }

  function updateTarget(patch: Partial<WorkoutTarget>) {
    updateStep((current) => ({ ...current, targets: [{ ...target, ...patch } as WorkoutTarget] }));
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
      <div className="flex items-center justify-between gap-2">
        <input
          value={step.title}
          onChange={(event) => updateStep((current) => ({ ...current, title: event.target.value }))}
          className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <button type="button" onClick={() => onChange(removeWorkoutStep(content, block.id, step.id))} className="rounded-md p-2 text-[var(--muted)] hover:bg-[var(--raised-bg)]">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {axisMode === "distance" ? (
          <Field label="Distanz">
            <div className="grid grid-cols-[minmax(0,1fr)_4.5rem] gap-2">
              <input
                type="number"
                min={distanceUnit === "km" ? 0.001 : 1}
                step={distanceUnit === "km" ? 0.1 : 50}
                value={distanceValue(step.duration, distanceUnit)}
                onChange={(event) => updateDistance(event.target.valueAsNumber)}
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <select
                aria-label="Distanzeinheit"
                value={distanceUnit}
                onChange={(event) => setDistanceUnit(event.target.value as "m" | "km")}
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-2 py-2 text-sm outline-none focus:border-[var(--accent)]"
              >
                <option value="m">m</option>
                <option value="km">km</option>
              </select>
            </div>
          </Field>
        ) : (
          <Field label="Dauer min">
            <input
              type="number"
              min={1}
              value={durationMinutes(step.duration)}
              onChange={(event) => updateDuration(event.target.valueAsNumber)}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </Field>
        )}
        <Field label="Pause sec">
          <input
            type="number"
            min={0}
            value={step.recoverySeconds ?? 0}
            onChange={(event) => updateStep((current) => ({ ...current, recoverySeconds: clampNumber(event.target.valueAsNumber, 0, 3600) }))}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </Field>
      </div>
      <Field label="Zielwert">
        <select
          value={target.type}
          onChange={(event) => updateTarget({ type: event.target.value as WorkoutTarget["type"] })}
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        >
          {TARGET_TYPES.map(([type, label]) => <option key={type} value={type}>{label}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Min %">
          <input
            type="number"
            min={1}
            max={200}
            value={target.minPercent}
            onChange={(event) => updateTarget({ minPercent: clampNumber(event.target.valueAsNumber, 1, 200) })}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </Field>
        <Field label="Max %">
          <input
            type="number"
            min={1}
            max={200}
            value={target.maxPercent ?? target.minPercent}
            onChange={(event) => updateTarget({ maxPercent: clampNumber(event.target.valueAsNumber, 1, 200) })}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </Field>
      </div>
      {resolvedStep ? (
        <div className="space-y-1 text-xs text-[var(--muted)]">
          {resolvedStep.resolvedTargets.map((resolvedTarget) => (
            <p key={`${step.id}-${resolvedTarget.label}`}>{resolvedTarget.label}: {resolvedTarget.minValue}{resolvedTarget.maxValue ? `-${resolvedTarget.maxValue}` : ""} {resolvedTarget.unit}</p>
          ))}
          {resolvedStep.warnings.map((warning) => <p key={`${step.id}-${warning.benchmark}`} className="text-[var(--warn)]">{warning.message}</p>)}
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">{label}</span>
      {children}
    </label>
  );
}

function getBlockExtent(block: WorkoutBlock, axisMode: "time" | "distance") {
  return block.repeatCount * block.steps.reduce((total, step) => {
    const recovery = axisMode === "time" ? step.recoverySeconds ?? 0 : 0;
    return total + getDurationExtent(step.duration, axisMode) + recovery;
  }, 0);
}

function getDurationExtent(duration: WorkoutDuration, axisMode: "time" | "distance") {
  if (axisMode === "distance") return duration.type === "distance" ? duration.meters : 0;
  return duration.type === "time" ? duration.seconds : 0;
}

function getDurationSeconds(duration: WorkoutDuration) {
  return duration.type === "time" ? duration.seconds : 0;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}:${String(remainingSeconds).padStart(2, "0")} min` : `${minutes} min`;
}

function durationMinutes(duration: WorkoutDuration) {
  return Math.max(1, Math.round(getDurationSeconds(duration) / 60));
}

function distanceValue(duration: WorkoutDuration, unit: "m" | "km") {
  const meters = duration.type === "distance" ? duration.meters : 0;
  return unit === "km" ? meters / 1000 : meters;
}

function clampNumber(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(value, maximum));
}

function formatAxisExtent(value: number, axisMode: "time" | "distance") {
  if (axisMode === "time") return formatDuration(value);
  return value >= 1000
    ? `${(value / 1000).toLocaleString("de-DE", { maximumFractionDigits: 2 })} km`
    : `${value} m`;
}