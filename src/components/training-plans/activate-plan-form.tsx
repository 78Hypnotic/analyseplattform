"use client";

import { useActionState, useState } from "react";
import { CalendarDays, Check, Play } from "lucide-react";
import { activateTrainingPlan } from "@/app/trainingsplaene/[versionId]/actions";
import { Button } from "@/components/button";

const WEEKDAYS = [
  [1, "Mo"], [2, "Di"], [3, "Mi"], [4, "Do"], [5, "Fr"], [6, "Sa"], [7, "So"],
] as const;

export function ActivatePlanForm({
  versionId,
  requiredTrainingDays,
  minimumStartDate,
}: {
  versionId: string;
  requiredTrainingDays: number;
  minimumStartDate: string;
}) {
  const [state, action, pending] = useActionState(activateTrainingPlan, {});
  const [weekdays, setWeekdays] = useState<number[]>([]);

  function toggleWeekday(day: number) {
    setWeekdays((current) => current.includes(day)
      ? current.filter((item) => item !== day)
      : current.length < requiredTrainingDays
        ? [...current, day]
        : current);
  }

  return (
    <form action={action} className="surface mt-8 p-6">
      <input type="hidden" name="versionId" value={versionId} />
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--raised-bg)] text-[var(--accent)]">
          <CalendarDays size={20} />
        </span>
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">Plan aktivieren</p>
          <h2 className="mt-2 text-2xl font-semibold">Wann möchtest du starten?</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Wähle genau {requiredTrainingDays} Trainingstage. Die Einheiten werden in ihrer gespeicherten Reihenfolge terminiert.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(14rem,0.7fr)_1.3fr]">
        <label className="grid gap-2 text-sm">
          Startdatum
          <input type="date" name="startDate" min={minimumStartDate} defaultValue={minimumStartDate} required />
        </label>
        <fieldset>
          <legend className="text-sm">Trainingstage</legend>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {WEEKDAYS.map(([day, label]) => {
              const selected = weekdays.includes(day);
              return (
                <label
                  key={day}
                  className={selected
                    ? "flex h-11 cursor-pointer items-center justify-center gap-1 rounded-lg border border-[var(--accent)] text-sm text-[var(--accent)]"
                    : "flex h-11 cursor-pointer items-center justify-center rounded-lg border border-[var(--line)] text-sm text-[var(--muted)]"}
                >
                  <input
                    type="checkbox"
                    name="weekdays"
                    value={day}
                    checked={selected}
                    onChange={() => toggleWeekday(day)}
                    className="sr-only"
                  />
                  {selected ? <Check size={14} /> : null}
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {state.message ? (
        <p role="alert" className="mt-4 text-sm text-[var(--warn)]">{state.message}</p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <Button type="submit" variant="primary" disabled={pending || weekdays.length !== requiredTrainingDays}>
          <Play size={16} />
          {pending ? "Aktiviert..." : "Trainingsplan starten"}
        </Button>
      </div>
    </form>
  );
}