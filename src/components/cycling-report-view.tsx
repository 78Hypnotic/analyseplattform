import { AlertTriangle, Flame, Gauge, Info, Zap } from "lucide-react";
import { BikeCarbCalculator } from "@/components/bike-carb-calculator";
import { BikeMetabolicChart } from "@/components/bike-metabolic-chart";
import { VLAMAX_MAX, VLAMAX_MIN } from "@/lib/cycling/constants";
import type { BikeInput, BikeResult, BikeZone } from "@/lib/cycling/types";

export function CyclingReportView({ input, result }: { input: BikeInput; result: BikeResult }) {
  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          Rad-Diagnostik
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Deine Schwelle (FTP): {Math.round(result.ftpWatt)} W.
        </h1>
        <p className="muted mt-4 max-w-2xl leading-7">
          Das entspricht {result.ftpPerKg.toFixed(2)} W/kg – deine simulierte maximal nachhaltige Leistung.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Ziel: {bikeGoalLabel(input.goal)} · Profil: {result.metabolicProfile.label}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniFact label="FTP" value={`${Math.round(result.ftpWatt)} W · ${result.ftpPerKg.toFixed(2)} W/kg`} />
          <MiniFact label="VO₂max" value={`${result.vo2rel.toFixed(1)} ml/kg/min`} />
          <MiniFact label="VLamax-Proxy" value={`${result.vlamaxProxy.toFixed(2)} mmol/l/s`} />
          <MiniFact label="FatMax" value={`${Math.round(result.fatMaxWatt)} W`} />
        </div>
      </section>

      {result.plausibility.status !== "none" ? <PlausibilityCard result={result} /> : null}

      <KeyMetricsCard result={result} />
      <MetabolicProfileCard result={result} />
      <FatCurveCard result={result} />
      <TrainingZonesCard result={result} />
      <BikeCarbCalculator ftp={result.ftpWatt} kFactor={result.kFactor} fatMaxWatt={result.fatMaxWatt} />
      <DisclaimerCard />
      <ExpertDetails input={input} result={result} />
    </div>
  );
}

function PlausibilityCard({ result }: { result: BikeResult }) {
  const isWarn = result.plausibility.status === "sprint_high" || result.plausibility.status === "sprint_low";
  return (
    <section className={isWarn ? "surface border-[var(--warn)] p-5" : "surface border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] p-5"}>
      <div className={isWarn ? "mb-2 flex items-center gap-2 text-sm font-medium text-[var(--warn)]" : "mb-2 flex items-center gap-2 text-sm font-medium text-[var(--accent)]"}>
        {isWarn ? <AlertTriangle size={18} /> : <Info size={18} />}
        Plausibilitätsprüfung (12-Minuten-Test)
      </div>
      <p className={isWarn ? "text-sm text-[var(--warn)]" : "muted text-sm leading-6"}>{result.plausibility.message}</p>
    </section>
  );
}

function KeyMetricsCard({ result }: { result: BikeResult }) {
  const tiles = [
    { label: "VO₂max relativ", value: result.vo2rel.toFixed(1), unit: "ml/kg/min", caption: `${(result.vo2abs / 1000).toFixed(2)} L/min absolut` },
    { label: "MAP / PPO", value: String(Math.round(result.ppo)), unit: "W", caption: `PVO₂ ${Math.round(result.pvo2)} W` },
    { label: "VLamax-Proxy", value: result.vlamaxProxy.toFixed(2), unit: "mmol/l/s", caption: "anaerob-glykolytische Kapazität" },
    { label: "FatMax", value: String(Math.round(result.fatMaxWatt)), unit: "W", caption: `${Math.round(result.fatMaxPctFtp * 100)} % der FTP` },
  ];

  return (
    <section className="surface p-5">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
        Metabolischer Fingerabdruck
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Deine simulierten Leistungswerte</h2>
      <p className="muted mt-2 max-w-2xl leading-7">
        Abgeleitet aus Sprint- und Rampentest. Reproduzierbares Simulationsmodell, keine Labormessung.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
            <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">{tile.label}</p>
            <p className="display-serif mt-3 text-3xl text-[var(--accent)]">{tile.value}</p>
            <p className="mono mt-1 text-[10px] text-[var(--subtle)]">{tile.unit}</p>
            <p className="muted mt-2 text-sm leading-6">{tile.caption}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MetabolicProfileCard({ result }: { result: BikeResult }) {
  const span = VLAMAX_MAX - VLAMAX_MIN;
  const pct = Math.max(0, Math.min(100, ((result.vlamaxProxy - VLAMAX_MIN) / span) * 100));

  return (
    <section className="surface p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Zap size={18} className="text-[var(--accent)]" />
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Metabolisches Profil</p>
      </div>
      <h2 className="text-2xl font-semibold">{result.metabolicProfile.label}</h2>
      <p className="muted mt-2 max-w-2xl leading-7">{result.metabolicProfile.description}</p>
      <div className="mt-5">
        <div className="relative h-2 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--warn)]">
          <div
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--panel)] bg-[var(--foreground)] shadow"
            style={{ left: `${pct}%` }}
            aria-hidden
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)] mono">
          <span>Diesel · hohe Schwelle</span>
          <span>Anaerob dominant</span>
        </div>
      </div>
    </section>
  );
}

function FatCurveCard({ result }: { result: BikeResult }) {
  return (
    <section className="surface p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Flame size={18} className="text-[var(--accent)]" />
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Stoffwechsel & Laktat</p>
      </div>
      <h2 className="text-2xl font-semibold">Substrate & Laktat über die Leistung</h2>
      <p className="muted mt-2 max-w-2xl leading-7">
        Kohlenhydrat- und Fettanteil sowie das modellierte Laktat über die Leistung. FatMax liegt bei{" "}
        {Math.round(result.fatMaxWatt)} W ({Math.round(result.fatMaxPctFtp * 100)} % FTP). Fahre über die Kurve, um
        Werte abzulesen.
      </p>
      <div className="mt-5">
        <BikeMetabolicChart curve={result.fatCurve} ftp={result.ftpWatt} fatMaxWatt={result.fatMaxWatt} />
      </div>
    </section>
  );
}

function TrainingZonesCard({ result }: { result: BikeResult }) {
  return (
    <section className="surface p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Gauge size={18} className="text-[var(--accent)]" />
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Trainingsbereiche</p>
      </div>
      <h2 className="text-2xl font-semibold">Deine Wattbereiche aus der FTP</h2>
      <p className="muted mt-2 max-w-2xl leading-7">
        Coggan-Zonenmodell, abgeleitet aus deiner Schwellenleistung von {Math.round(result.ftpWatt)} W (= 100 %).
      </p>
      <div className="mt-5 overflow-hidden rounded-lg border border-[var(--line)]">
        <div className="grid grid-cols-[auto_1fr_auto] gap-2 border-b border-[var(--line)] bg-[var(--raised-bg)] px-4 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)] mono">
          <span>Zone</span>
          <span>% der FTP</span>
          <span className="text-right">Watt</span>
        </div>
        {result.zones.map((zone) => (
          <ZoneRow key={zone.zone} zone={zone} />
        ))}
      </div>
    </section>
  );
}

function ZoneRow({ zone }: { zone: BikeZone }) {
  const pctLabel = zone.maxPct === null
    ? `> ${Math.round(zone.minPct * 100)} %`
    : `${Math.round(zone.minPct * 100)}–${Math.round(zone.maxPct * 100)} %`;
  const wattLabel = zone.maxWatt === null ? `> ${zone.minWatt} W` : `${zone.minWatt}–${zone.maxWatt} W`;

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-[var(--line)] px-4 py-3 last:border-b-0">
      <div className="min-w-32">
        <p className="text-sm font-medium">{zone.short}</p>
        <p className="muted text-xs">{zone.label}</p>
      </div>
      <p className="muted text-sm">{pctLabel}</p>
      <p className="text-right text-sm font-medium text-[var(--accent)]">{wattLabel}</p>
    </div>
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
        Dies ist ein <strong>physiologisch plausibles Simulationsmodell</strong> auf Basis mechanischer Leistung –
        <strong> keine direkte Labormessung</strong>. VO₂max, VLamax und FTP sind reproduzierbare Schätzwerte zur
        Trainingssteuerung und für den Vergleich von Retests.
      </p>
    </section>
  );
}

function ExpertDetails({ input, result }: { input: BikeInput; result: BikeResult }) {
  return (
    <details className="surface p-5">
      <summary className="cursor-pointer text-sm font-medium">Expertenmodus / Details</summary>
      <div className="mt-5 space-y-6">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Testdaten</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <DetailItem label="Peak 1 s" value={`${input.sprintPeakWatt} W`} />
            <DetailItem label="20 s Ø" value={`${input.sprintAvg20sWatt} W`} />
            <DetailItem label="1 min Ø" value={`${input.oneMinPowerWatt} W`} />
            <DetailItem label="Gewicht" value={`${input.weight} kg`} />
            <DetailItem label="12-Min-Test" value={input.validation12minWatt ? `${input.validation12minWatt} W` : "nicht erfasst"} />
          </div>
        </div>
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Berechnungskette</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <DetailItem label="PPO / MAP" value={`${result.ppo.toFixed(1)} W`} />
            <DetailItem label="PVO₂" value={`${result.pvo2.toFixed(1)} W`} />
            <DetailItem label="VO₂max abs" value={`${result.vo2abs.toFixed(0)} ml/min`} />
            <DetailItem label="W20 / Walakt" value={`${result.w20} / ${result.walakt} J`} />
            <DetailItem label="Wgly / Pgly" value={`${result.wgly} J / ${Math.round(result.pgly)} W`} />
            <DetailItem label="Emet" value={`${result.emetKj.toFixed(1)} kJ`} />
            <DetailItem label="O₂-Äquivalent" value={`${result.o2eq.toFixed(2)} L`} />
            <DetailItem label="Laktatäquivalent" value={`${result.laeq.toFixed(2)} mmol/l`} />
            <DetailItem label="Profilfaktor" value={result.profileFactor.toFixed(3)} />
            <DetailItem label="k-Faktor" value={result.kFactor.toFixed(4)} />
            <DetailItem label="FatMax" value={`${Math.round(result.fatMaxWatt)} W (${Math.round(result.fatMaxPctFtp * 100)} %)`} />
            <DetailItem label="FTP" value={`${result.ftpWatt.toFixed(1)} W`} />
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

function bikeGoalLabel(goal: BikeInput["goal"]) {
  if (goal === "Strasse") return "Straße";
  if (goal === "Zeitfahren") return "Zeitfahren";
  if (goal === "MTB_Gravel") return "MTB / Gravel";
  if (goal === "GranFondo") return "Gran Fondo";
  return "Triathlon";
}
