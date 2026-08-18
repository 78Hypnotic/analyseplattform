"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const WEEKDAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Datum wählen",
  fieldKey,
  minDate,
  clearable = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fieldKey?: string;
  minDate?: Date;
  clearable?: boolean;
}) {
  const labelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const today = useMemo(() => startOfDay(new Date()), []);
  const minDay = useMemo(() => startOfDay(minDate ?? today), [minDate, today]);
  const selected = useMemo(() => fromIso(value), [value]);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected ?? minDay));

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggle() {
    if (!open) setViewMonth(startOfMonth(selected ?? minDay));
    setOpen(!open);
  }

  function select(date: Date) {
    onChange(toIso(date));
    setOpen(false);
    triggerRef.current?.focus();
  }

  function clear() {
    onChange("");
    setOpen(false);
    triggerRef.current?.focus();
  }

  const days = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);
  const canGoBack = startOfMonth(minDay).getTime() < viewMonth.getTime();

  return (
    <div className="grid min-w-0 gap-2 text-sm" data-analysis-field={fieldKey}>
      <span id={labelId}>{label}</span>
      <div ref={containerRef} className="relative" data-datepicker-open={open ? "" : undefined}>
        <button
          ref={triggerRef}
          type="button"
          aria-labelledby={labelId}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={toggle}
          className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-[0.85rem] py-3 text-left focus:border-[var(--accent)] focus:outline-none"
        >
          <span className={value ? "truncate" : "truncate text-[var(--subtle)]"}>
            {value ? formatDe(value) : placeholder}
          </span>
          <Calendar size={16} className="shrink-0 text-[var(--subtle)]" />
        </button>

        {open ? (
          <div
            role="dialog"
            aria-labelledby={labelId}
            className="absolute left-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label="Vorheriger Monat"
                disabled={!canGoBack}
                onClick={() => setViewMonth((current) => addMonths(current, -1))}
                className="rounded-lg border border-[var(--line)] p-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-medium">
                {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </span>
              <button
                type="button"
                aria-label="Nächster Monat"
                onClick={() => setViewMonth((current) => addMonths(current, 1))}
                className="rounded-lg border border-[var(--line)] p-2"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--subtle)]">
              {WEEKDAY_NAMES.map((weekday) => (
                <span key={weekday} className="py-1">
                  {weekday}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {days.map((day) => {
                const iso = toIso(day);
                const disabled = day.getTime() < minDay.getTime();
                const isSelected = value === iso;
                const isOutsideMonth = day.getMonth() !== viewMonth.getMonth();

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    aria-pressed={isSelected}
                    onClick={() => select(day)}
                    className={dayClassName({
                      disabled,
                      isSelected,
                      isOutsideMonth,
                      isToday: day.getTime() === today.getTime(),
                    })}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 text-sm">
              <button
                type="button"
                onClick={() => select(maxDate(today, minDay))}
                className="rounded-lg border border-[var(--line)] px-3 py-2"
              >
                Heute
              </button>
              {clearable && value ? (
                <button
                  type="button"
                  onClick={clear}
                  className="rounded-lg px-3 py-2 text-[var(--muted)] underline underline-offset-4"
                >
                  Löschen
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function dayClassName({
  disabled,
  isSelected,
  isOutsideMonth,
  isToday,
}: {
  disabled: boolean;
  isSelected: boolean;
  isOutsideMonth: boolean;
  isToday: boolean;
}) {
  const base = "rounded-lg border py-2 text-sm";
  if (disabled) return `${base} border-transparent opacity-40 cursor-not-allowed`;
  if (isSelected) return `${base} border-[var(--accent)] bg-[var(--panel-2)]`;
  const tone = isOutsideMonth
    ? "text-[var(--subtle)]"
    : isToday
      ? "text-[var(--accent)]"
      : "text-[var(--foreground)]";
  return `${base} border-transparent hover:border-[var(--line)] ${tone}`;
}

function buildCalendarDays(month: Date) {
  const firstOfMonth = startOfMonth(month);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const start = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  );
}

// Bewusst kein toISOString(): das würde in östlichen Zeitzonen einen Tag zurückspringen.
function toIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function formatDe(value: string) {
  const date = fromIso(value);
  if (!date) return value;
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function maxDate(a: Date, b: Date) {
  return a.getTime() >= b.getTime() ? a : b;
}
