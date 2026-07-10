"use client";

import { useActionState } from "react";
import { AlertTriangle, CheckCircle2, Database } from "lucide-react";
import { BIKE_MODEL_VERSION } from "@/lib/cycling/constants";
import {
  runBikeModelMigrationBatch,
  type BikeMigrationActionState,
  type BikeMigrationPreview,
} from "./actions";

export function BikeModelMigrationPanel({ preview }: { preview: BikeMigrationPreview }) {
  const initialState: BikeMigrationActionState = {
    ...preview,
    message: null,
    success: true,
    failedIds: [],
  };
  const [state, action, pending] = useActionState(runBikeModelMigrationBatch, initialState);
  const isComplete = state.remaining === 0;

  return (
    <section className="surface mt-8 border-[color-mix(in_oklab,var(--warn)_45%,var(--line))] p-6">
      <div className="flex items-start gap-3">
        <Database className="mt-1 shrink-0 text-[var(--warn)]" size={20} />
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--warn)]">Datenmigration</p>
          <h2 className="mt-2 text-2xl font-semibold">VLamax-Dominanzmodell</h2>
          <p className="muted mt-2 max-w-3xl leading-7">
            Die Vorschau ist read-only. Erst die bestätigte Aktion schreibt höchstens 50 Analysen pro Batch und
            aktualisiert nach Abschluss die neuesten Rad-Profilwerte.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MigrationMetric label="Gesamt" value={state.total} />
        <MigrationMetric label="Aktuell" value={state.current} />
        <MigrationMetric label="Legacy" value={state.legacy} />
        <MigrationMetric label="Migrierbar" value={state.migratable} />
        <MigrationMetric label="Unplausibel" value={state.unmigratable} />
        <MigrationMetric label="Offen" value={state.remaining} />
      </div>

      {state.message ? (
        <div className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${state.success ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--warn)] text-[var(--warn)]"}`}>
          {state.success ? <CheckCircle2 className="mt-0.5 shrink-0" size={16} /> : <AlertTriangle className="mt-0.5 shrink-0" size={16} />}
          <span>{state.message}</span>
        </div>
      ) : null}

      {state.failedIds.length > 0 ? (
        <p className="mono mt-3 text-xs text-[var(--warn)]">Fehlgeschlagen: {state.failedIds.join(", ")}</p>
      ) : null}

      <form action={action} className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-start gap-3 text-sm text-[var(--muted)]">
          <input
            className="mt-0.5 size-4 accent-[var(--accent)]"
            type="checkbox"
            name="confirmation"
            value={BIKE_MODEL_VERSION}
            required={!isComplete}
            disabled={isComplete || pending}
          />
          <span>Ich bestätige die Neuberechnung und Legacy-Kennzeichnung der gespeicherten Rad-Analysen.</span>
        </label>
        <button
          type="submit"
          disabled={isComplete || pending}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-contrast)] transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Batch läuft …" : isComplete ? "Migration abgeschlossen" : "Nächsten Batch starten"}
        </button>
      </form>
    </section>
  );
}

function MigrationMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-3">
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
