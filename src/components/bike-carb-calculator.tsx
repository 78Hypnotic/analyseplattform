"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { estimateFueling } from "@/lib/cycling/calculations";

/**
 * Interactive fuelling calculator: given a target power and duration, estimates
 * carbohydrate (and fat) demand from the same fat/CHO model as the report.
 */
export function BikeCarbCalculator({
  ftp,
  kFactor,
  fatMaxWatt,
}: {
  ftp: number;
  kFactor: number;
  fatMaxWatt: number;
}) {
  const [watt, setWatt] = useState(() => Math.round(ftp * 0.75));
  const [minutes, setMinutes] = useState(90);

  const fueling = useMemo(() => estimateFueling(ftp, kFactor, watt), [ftp, kFactor, watt]);

  const presets = [
    { label: "FatMax", value: Math.round(fatMaxWatt) },
    { label: "GA1 (65 %)", value: Math.round(ftp * 0.65) },
    { label: "Schwelle", value: Math.round(ftp) },
  ];

  const hours = minutes / 60;
  const carbPerHour = fueling ? fueling.carbGramsPerHour : 0;
  const carbTotal = carbPerHour * hours;
  const fatPerHour = fueling ? fueling.fatGramsPerHour : 0;
  const kcalPerHour = fueling ? fueling.kcalPerHour : 0;

  return (
    <section className="surface p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Calculator size={18} className="text-[var(--accent)]" />
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Kohlenhydrat-Rechner</p>
      </div>
      <h2 className="text-2xl font-semibold">Wie viele Kohlenhydrate brauchst du?</h2>
      <p className="muted mt-2 max-w-2xl leading-7">
        Schätzt aus deiner Ziel-Leistung und Dauer den Kohlenhydratbedarf — auf Basis desselben
        Fett-/KH-Modells wie oben.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <label className="grid gap-2 text-sm">
            <span className="flex items-center justify-between">
              <span>Ziel-Leistung</span>
              <span className="mono text-[var(--accent)]">{watt} W · {Math.round((watt / ftp) * 100)} % FTP</span>
            </span>
            <input
              type="range"
              min={Math.round(ftp * 0.4)}
              max={Math.round(ftp * 1.1)}
              step={5}
              value={watt}
              onChange={(event) => setWatt(Number(event.target.value))}
              className="w-full"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setWatt(preset.value)}
                className={
                  watt === preset.value
                    ? "rounded-lg border border-[var(--accent)] bg-[var(--panel-2)] px-3 py-1.5 text-xs"
                    : "rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--accent)]"
                }
              >
                {preset.label} · {preset.value} W
              </button>
            ))}
          </div>
          <label className="grid gap-2 text-sm">
            <span>Dauer (Minuten)</span>
            <input
              type="number"
              min={10}
              max={600}
              step={5}
              value={minutes}
              onChange={(event) => setMinutes(Math.max(0, Number(event.target.value)))}
              className="w-full"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Result label="Kohlenhydrate" value={`${Math.round(carbPerHour)} g/h`} highlight />
          <Result label="KH gesamt" value={`${Math.round(carbTotal)} g`} highlight />
          <Result label="Fett" value={`${Math.round(fatPerHour)} g/h`} />
          <Result label="Energie" value={`${Math.round(kcalPerHour)} kcal/h`} />
        </div>
      </div>

      <p className="muted mt-4 text-xs leading-5">
        Richtwert aus dem Simulationsmodell — keine Ernährungsberatung. Die Aufnahme­fähigkeit liegt je
        nach Training meist bei ~60–120 g KH/h.
      </p>
    </section>
  );
}

function Result({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={
        highlight
          ? "rounded-lg border border-[color-mix(in_oklab,var(--accent)_38%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_8%,var(--raised-bg))] p-4"
          : "rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4"
      }
    >
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <p className={highlight ? "display-serif mt-2 text-3xl text-[var(--accent)]" : "mt-2 text-2xl font-semibold"}>{value}</p>
    </div>
  );
}
