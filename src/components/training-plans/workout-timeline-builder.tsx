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
import { createWorkoutBlock, createWorkoutStep } from "@/lib/training-plans/content";
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
    const block = createWorkoutBlock(kind);
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
          <div
            className="flex min-h-36 gap-3 overflow-x-auto rounded-lg border border-dashed border-[var(--line)] bg-[var(--soft-bg)] p-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, content.blocks.length)}
          >
            {content.blocks.map((block, index) => (
              <BlockCard
                key={block.id}
                block={block}
                selected={block.id === selectedBlock?.id}
                resolvedStepCount={resolved?.steps.filter((step) => block.steps.some((blockStep) => blockStep.id === step.stepId)).length ?? 0}
                onSelect={() => setSelectedBlockId(block.id)}
                onDropBefore={(event) => handleDrop(event, index)}
                onDuplicate={() => onChange(duplicateWorkoutBlock(content, block.id))}
                onRemove={() => removeBlock(block.id)}
              />
            ))}
            {content.blocks.length === 0 ? (
              <div className="flex min-h-24 min-w-64 items-center justify-center rounded-lg border border-[var(--line)] text-sm text-[var(--muted)]">
                Block aus der Palette hierher ziehen
              </div>
            ) : null}
          </div>
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

function BlockCard({
  block,
  selected,
  resolvedStepCount,
  onSelect,
  onDropBefore,
  onDuplicate,
  onRemove,
}: {
  block: WorkoutBlock;
  selected: boolean;
  resolvedStepCount: number;
  onSelect: () => void;
  onDropBefore: (event: React.DragEvent) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const minutes = Math.round(getBlockSeconds(block) / 60);

  return (
    <article
      draggable
      onDragStart={(event) => event.dataTransfer.setData("application/x-workout-block-id", block.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDropBefore}
      onClick={onSelect}
      className={cn(
        "flex min-w-56 flex-col gap-3 rounded-lg border bg-[var(--panel)] p-3 text-left transition",
        selected ? "border-[var(--accent)] shadow-sm" : "border-[var(--line)] hover:border-[var(--accent)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">{block.kind}</p>
          <h3 className="mt-1 truncate text-sm font-semibold text-[var(--foreground)]">{block.title}</h3>
        </div>
        <GripVertical size={16} className="shrink-0 text-[var(--subtle)]" />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-[var(--muted)]">
        <span>{block.repeatCount}x</span>
        <span>{block.steps.length} Steps</span>
        <span>{minutes} min</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--subtle)]">{resolvedStepCount ? "Targets berechenbar" : "Relative Targets"}</span>
        <div className="flex gap-1">
          <button type="button" onClick={(event) => { event.stopPropagation(); onDuplicate(); }} className="rounded-md p-1 text-[var(--muted)] hover:bg-[var(--raised-bg)]">
            <Copy size={14} />
          </button>
          <button type="button" onClick={(event) => { event.stopPropagation(); onRemove(); }} className="rounded-md p-1 text-[var(--muted)] hover:bg-[var(--raised-bg)]">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
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
          <Button type="button" variant="ghost" onClick={() => onChange(addWorkoutStep(content, block.id, createWorkoutStep(block.kind)))}>
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

  function updateStep(update: (current: WorkoutStep) => WorkoutStep) {
    onChange(updateWorkoutStep(content, block.id, step.id, update));
  }

  function updateDuration(minutes: number) {
    updateStep((current) => ({ ...current, duration: { type: "time", seconds: clampNumber(minutes, 1, 1440) * 60 } }));
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
        <Field label="Dauer min">
          <input
            type="number"
            min={1}
            value={durationMinutes(step.duration)}
            onChange={(event) => updateDuration(event.target.valueAsNumber)}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </Field>
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

function getBlockSeconds(block: WorkoutBlock) {
  return block.repeatCount * block.steps.reduce((total, step) => total + getDurationSeconds(step.duration) + (step.recoverySeconds ?? 0), 0);
}

function getDurationSeconds(duration: WorkoutDuration) {
  return duration.type === "time" ? duration.seconds : 0;
}

function durationMinutes(duration: WorkoutDuration) {
  return Math.max(1, Math.round(getDurationSeconds(duration) / 60));
}

function clampNumber(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(value, maximum));
}