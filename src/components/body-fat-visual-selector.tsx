"use client";

import Image from "next/image";
import { BODY_FAT_PRESETS, getBodyFatPresetForValue, getBodyFatStatus, type BodyFatSex } from "@/lib/body-fat";

export function BodyFatVisualSelector({
  sex,
  value,
  onSexChange,
  onValueChange,
  compact = false,
}: {
  sex: BodyFatSex;
  value: number | null | "";
  onSexChange: (sex: BodyFatSex) => void;
  onValueChange: (value: number) => void;
  compact?: boolean;
}) {
  const sliderValue = clamp(typeof value === "number" ? value : sex === "female" ? 26 : 20, 8, 42);
  const status = getBodyFatStatus(sex, value);
  const presets = BODY_FAT_PRESETS[sex];
  const selectedPreset = getBodyFatPresetForValue(sex, value);

  return (
    <div className={compact ? "grid gap-5" : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]"}>
      <div className="min-w-0">
        <div className="mb-5 inline-grid grid-cols-2 gap-1 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-1 text-sm">
          <SelectorSegment label="Weiblich" active={sex === "female"} onClick={() => onSexChange("female")} />
          <SelectorSegment label="Männlich" active={sex === "male"} onClick={() => onSexChange("male")} />
        </div>

        <div className="grid gap-2 sm:grid-cols-5">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onValueChange(preset.value)}
              className={
                preset.label === status
                  ? "flex min-h-24 flex-col justify-between rounded-lg border border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_12%,var(--panel))] p-3 text-left text-[var(--foreground)]"
                  : "flex min-h-24 flex-col justify-between rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 text-left text-[var(--subtle)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
              }
            >
              <span className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--subtle)]">{preset.label}</span>
              <span className="display-serif mt-2 text-lg text-[var(--foreground)]">{preset.range}</span>
            </button>
          ))}
        </div>

        <div className="mt-7">
          <VisualSlider
            ariaLabel="Körperfett visuell schätzen"
            min={8}
            max={42}
            step={0.5}
            value={sliderValue}
            onChange={onValueChange}
          />
          <div className="mt-3 grid grid-cols-5 gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--subtle)]">
            <span className="text-left">{presets[0].label}</span>
            <span className="col-span-3 text-center text-[var(--accent)]">{status}</span>
            <span className="text-right">{presets[presets.length - 1].label}</span>
          </div>
        </div>
      </div>

      <div className={compact ? "hidden" : "flex flex-col items-center justify-between rounded-lg border border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_70%,transparent)] p-4"}>
        <div className="flex min-h-80 w-full items-end justify-center overflow-hidden">
          <Image
            src={selectedPreset.imageSrc}
            alt=""
            width={230}
            height={670}
            sizes="230px"
            className="max-h-80 w-auto select-none object-contain"
            priority={false}
            aria-hidden="true"
          />
        </div>
        <div className="mt-4 w-full text-right">
          <p className="display-serif text-5xl leading-none text-[var(--foreground)]">
            {formatBodyFatValue(value)}
            <span className="text-xl text-[var(--subtle)]">%</span>
          </p>
          <p className="mono mt-2 text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">{status}</p>
        </div>
      </div>
    </div>
  );
}

function SelectorSegment({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={active ? "rounded-md bg-[var(--brand-bg)] px-8 py-2 text-[var(--brand-fg)]" : "rounded-md px-8 py-2 text-[var(--muted)]"}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function VisualSlider({
  ariaLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  ariaLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative h-8">
      <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--accent)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--brand-bg)] bg-[var(--panel-2)] shadow-lg shadow-[var(--shadow-color)]"
        style={{ left: `${progress}%` }}
      />
      <input
        aria-label={ariaLabel}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function formatBodyFatValue(value: number | null | "") {
  return typeof value === "number" ? value.toFixed(1) : "--";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
