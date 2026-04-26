import { AlertTriangle, CheckCircle2, Target } from "lucide-react";
import { formatPace } from "@/lib/analysis/calculations";
import type { AnalysisInput, AnalysisResult } from "@/lib/analysis/types";

export function ReportView({
  input,
  result,
}: {
  input: AnalysisInput;
  result: AnalysisResult;
}) {
  const issue = result.issues[0];

  return (
    <div className="space-y-6">
      <section className="surface grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            Analyse-Ergebnis
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            {input.name} schwimmt {result.test400.dps.toFixed(2)} m pro Zug.
          </h1>
          <p className="muted mt-4 max-w-2xl leading-7">
            Profil: {input.level}, Ziel: {input.goal}. Zielbild: {result.style}.
            Der naechste sinnvolle Plan ist {result.plan.name}.
          </p>
        </div>
        <Triangle result={result} />
      </section>

      <section className="metric-grid">
        <Metric label="Pace 200 m" value={formatPace(result.test200.pace)} detail="/100 m" />
        <Metric label="Pace 400 m" value={formatPace(result.test400.pace)} detail="/100 m" />
        <Metric label="CSS" value={formatPace(result.cssPace)} detail="/100 m" accent />
        <Metric label="DPS 400 m" value={result.test400.dps.toFixed(2)} detail="m/Zug" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 size={18} className="text-[var(--accent)]" />
            Staerken
          </div>
          <div className="space-y-4">
            {result.strengths.map((strength) => (
              <div key={strength.title}>
                <h3 className="font-medium">{strength.title}</h3>
                <p className="muted mt-1 text-sm leading-6">{strength.description}</p>
              </div>
            ))}
          </div>
        </div>

        {issue ? (
          <div className="surface border-[var(--warn)] p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--warn)]">
              <AlertTriangle size={18} />
              {issue.tag}
            </div>
            <h2 className="text-2xl font-semibold">{issue.title}</h2>
            <p className="muted mt-3 leading-7">{issue.cause}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[var(--line)] bg-black/20 p-4">
                <p className="mono mb-2 text-xs uppercase text-[var(--subtle)]">Cue</p>
                <p>{issue.cue}</p>
              </div>
              <div className="rounded-lg border border-[var(--line)] bg-black/20 p-4">
                <p className="mono mb-2 text-xs uppercase text-[var(--subtle)]">Drill</p>
                <p>{issue.drill}</p>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="surface p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Target size={18} className="text-[var(--accent-2)]" />
            Potenzial
          </div>
          <h2 className="text-3xl font-semibold">{result.potential.paceGain}</h2>
          <p className="muted mt-3 leading-7">{result.potential.description}</p>
        </div>
        <div className="surface p-5">
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
            Empfohlener Plan
          </p>
          <h2 className="mt-3 text-2xl font-semibold">{result.plan.name}</h2>
          <p className="muted mt-2">
            {result.plan.phase} | {result.plan.weeks} Wochen | Re-Test am Ende
          </p>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div className="surface p-4">
      <p className="mono text-xs uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <p className={accent ? "mt-3 text-3xl font-semibold text-[var(--accent)]" : "mt-3 text-3xl font-semibold"}>
        {value}
      </p>
      <p className="muted mt-1 text-sm">{detail}</p>
    </div>
  );
}

function Triangle({ result }: { result: AnalysisResult }) {
  const cssScore = Math.min(1, Math.max(0.2, 1 - (result.cssPace - 85) / 80));
  const points = [
    { label: "VO2", score: result.vo2.score, x: 90, y: 12 },
    { label: "VLa", score: result.vla.score, x: 20, y: 145 },
    { label: "CSS", score: cssScore, x: 160, y: 145 },
  ];
  const cx = 90;
  const cy = 100;
  const inner = points
    .map((point) => `${cx + (point.x - cx) * point.score},${cy + (point.y - cy) * point.score}`)
    .join(" ");

  return (
    <div className="rounded-lg border border-[var(--line)] bg-black/20 p-4">
      <svg viewBox="0 0 180 165" className="h-48 w-full">
        <polygon points="90,12 20,145 160,145" fill="none" stroke="var(--line)" />
        <polygon points="90,56 55,123 125,123" fill="none" stroke="var(--line)" opacity="0.55" />
        <polygon points={inner} fill="color-mix(in oklab, var(--accent) 25%, transparent)" stroke="var(--accent)" />
        {points.map((point) => (
          <text key={point.label} x={point.x} y={point.y} textAnchor="middle" className="fill-white text-[10px]">
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
