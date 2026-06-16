import { AlertTriangle, Gauge, Info, RefreshCcw } from "lucide-react";
import { formatPace } from "@/lib/running/calculations";
import { INDEX_MAX } from "@/lib/running/constants";
import type { RunInput, RunResult, RunTrainingZone } from "@/lib/running/types";

export function RunningReportView({ input, result }: { input: RunInput; result: RunResult }) {
  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          Laufdiagnostik
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Deine Critical Speed: {formatPace(result.csPaceSecPerKm)} /km.
        </h1>
        <p className="muted mt-4 max-w-2xl leading-7">
          Das ist aktuell deine höchste dauerhaft stabile Laufgeschwindigkeit ({result.cs.toFixed(2)} m/s).
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Ziel: {input.goal} · Profil: {result.profileMatrix.title}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniFact label="Critical Speed" value={`${formatPace(result.csPaceSecPerKm)} /km`} />
          <MiniFact label="API" value={`${result.api.score.toFixed(1)} / 10`} />
          <MiniFact label="ACI" value={`${result.aci.score.toFixed(1)} / 10`} />
          <MiniFact label="Profil" value={result.profileMatrix.title} />
        </div>
      </section>

      {result.plausibility.messages.length > 0 ? (
        <section className="surface border-[var(--warn)] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--warn)]">
            <AlertTriangle size={18} />
            Plausibilitätshinweis
          </div>
          <ul className="space-y-2 text-sm text-[var(--warn)]">
            {result.plausibility.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <ProfileIndexCard result={result} />
      <ProfileMatrixCard result={result} />
      <TrainingZonesCard result={result} />
      <RetestCard />
      <DisclaimerCard />
      <ExpertDetails input={input} result={result} />
    </div>
  );
}

function ProfileIndexCard({ result }: { result: RunResult }) {
  const bars = [
    {
      label: "Anaerobic Profile Index (API)",
      score: result.api.score,
      caption: result.api.label,
      text: "Verhältnis von Kurzzeit- zu Dauerleistung. Hoch = ausdauerstark, niedrig = anaerob geprägt.",
    },
    {
      label: "Aerobic Capacity Index (ACI)",
      score: result.aci.score,
      caption: result.aci.label,
      text: "Beschreibt die Größe des aeroben Motors. Kein VO₂max-Wert, sondern ein Profilindex.",
    },
  ];

  return (
    <section className="surface p-5">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
        Leistungsindizes
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Dein Laufprofil in zwei Kennzahlen</h2>
      <p className="muted mt-2 max-w-2xl leading-7">
        Beide Indizes sind auf einer Skala von 1 bis 10 normiert und dienen der Profilbeschreibung und dem Vergleich von Retests.
      </p>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {bars.map((bar) => (
          <IndexBar key={bar.label} {...bar} />
        ))}
      </div>
    </section>
  );
}

function IndexBar({ label, score, caption, text }: { label: string; score: number; caption: string; text: string }) {
  const pct = Math.max(0, Math.min(100, (score / INDEX_MAX) * 100));

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">{label}</p>
        <p className="text-sm font-medium text-[var(--accent)]">{score.toFixed(1)} / 10</p>
      </div>
      <div className="mt-4 h-2 rounded-full bg-[var(--line)]">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-sm font-medium">{caption}</p>
      <p className="muted mt-1 text-sm leading-6">{text}</p>
    </div>
  );
}

function ProfileMatrixCard({ result }: { result: RunResult }) {
  const { aciLevel, apiLevel } = result.profileMatrix;
  const cells = [
    { aci: "hoch", api: "niedrig", title: "Großer Motor, anaerob geprägt" },
    { aci: "hoch", api: "hoch", title: "Großer Motor + hohe Ausdauer" },
    { aci: "niedrig", api: "niedrig", title: "Kleiner Motor, anaerob geprägt" },
    { aci: "niedrig", api: "hoch", title: "Dieselig, kleiner Motor" },
  ] as const;

  return (
    <section className="surface p-5">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
        Profilmatrix
      </p>
      <h2 className="mt-2 text-2xl font-semibold">{result.profileMatrix.title}</h2>
      <p className="muted mt-2 max-w-2xl leading-7">{result.profileMatrix.description}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {cells.map((cell) => {
          const active = cell.aci === aciLevel && cell.api === apiLevel;
          return (
            <div
              key={cell.title}
              className={
                active
                  ? "rounded-lg border border-[var(--accent)] bg-[var(--panel-2)] p-4"
                  : "rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4 opacity-70"
              }
            >
              <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">
                ACI {cell.aci} · API {cell.api}
              </p>
              <p className={active ? "mt-2 text-sm font-medium text-[var(--accent)]" : "mt-2 text-sm font-medium"}>
                {cell.title}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TrainingZonesCard({ result }: { result: RunResult }) {
  return (
    <section className="surface p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Gauge size={18} className="text-[var(--accent)]" />
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Trainingsbereiche</p>
      </div>
      <h2 className="text-2xl font-semibold">Deine Pace-Zonen aus der Critical Speed</h2>
      <p className="muted mt-2 max-w-2xl leading-7">
        Abgeleitet als Prozentanteil der Critical Speed ({formatPace(result.csPaceSecPerKm)} /km = 100 %).
      </p>
      <div className="mt-5 overflow-hidden rounded-lg border border-[var(--line)]">
        <div className="grid grid-cols-[auto_1fr_auto] gap-2 border-b border-[var(--line)] bg-[var(--raised-bg)] px-4 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)] mono">
          <span>Zone</span>
          <span>% der CS</span>
          <span className="text-right">Pace /km</span>
        </div>
        {result.zones.map((zone) => (
          <ZoneRow key={zone.zone} zone={zone} />
        ))}
      </div>
    </section>
  );
}

function ZoneRow({ zone }: { zone: RunTrainingZone }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-[var(--line)] px-4 py-3 last:border-b-0">
      <div className="min-w-28">
        <p className="text-sm font-medium">{zone.short}</p>
        <p className="muted text-xs">{zone.label}</p>
      </div>
      <p className="muted text-sm">
        {Math.round(zone.minPct * 100)}–{Math.round(zone.maxPct * 100)} %
      </p>
      <p className="text-right text-sm font-medium text-[var(--accent)]">
        {formatPace(zone.fasterPaceSecPerKm)}–{formatPace(zone.slowerPaceSecPerKm)}
      </p>
    </div>
  );
}

function RetestCard() {
  return (
    <section className="surface border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <RefreshCcw size={18} className="text-[var(--accent)]" />
        ReTest
      </div>
      <h2 className="text-2xl font-semibold">Gleiche Tests, gleiche Bedingungen</h2>
      <p className="muted mt-3 max-w-3xl leading-7">
        Wiederhole beide All-Out-Tests (3 Minuten und 12 Minuten) auf vergleichbarer Strecke und unter ähnlichen Bedingungen.
        Nur so sind Critical Speed, API und ACI über die Zeit belastbar vergleichbar.
      </p>
    </section>
  );
}

function DisclaimerCard() {
  return (
    <section className="surface p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
        <Info size={18} />
        Wichtiger Hinweis
      </div>
      <p className="muted leading-7">
        Diese Diagnostik liefert <strong>keine VO₂max</strong>, <strong>keine VLamax</strong> und{" "}
        <strong>keine Laborwerte</strong>. Sie liefert ausschließlich funktionelle Leistungskennzahlen, Profilindizes,
        Vergleichswerte für Retests und Trainingsgrundlagen für die Ableitung von Trainingsbereichen.
      </p>
    </section>
  );
}

function ExpertDetails({ input, result }: { input: RunInput; result: RunResult }) {
  return (
    <details className="surface p-5">
      <summary className="cursor-pointer text-sm font-medium">Expertenmodus / Details</summary>
      <div className="mt-5 space-y-6">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Rohdaten</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <DetailItem label="3-Min-Distanz" value={`${input.distance3min} m`} />
            <DetailItem label="12-Min-Distanz" value={`${input.distance12min} m`} />
            <DetailItem label="Laufeinheiten/Woche" value={input.runSessionsPerWeek ? String(input.runSessionsPerWeek) : "nicht erfasst"} />
          </div>
        </div>
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Abgeleitete Werte</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <DetailItem label="v3 (3 Min)" value={`${result.v3.toFixed(2)} m/s`} />
            <DetailItem label="v12 (12 Min)" value={`${result.v12.toFixed(2)} m/s`} />
            <DetailItem label="Critical Speed" value={`${result.cs.toFixed(2)} m/s`} />
            <DetailItem label="Endurance Ratio" value={`${(result.enduranceRatio * 100).toFixed(1)} %`} />
            <DetailItem label="VO₂-Proxy" value={`${result.vo2Proxy.toFixed(2)} m/s`} />
            <DetailItem label="CS-Pace" value={`${formatPace(result.csPaceSecPerKm)} /km`} />
          </div>
        </div>
      </div>
    </details>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-3">
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}
