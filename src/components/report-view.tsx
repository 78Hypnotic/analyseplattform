import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  Dumbbell,
  Gauge,
  Lock,
  RefreshCcw,
  ShoppingCart,
  Target,
} from "lucide-react";
import { explainStyle, formatPace, isTechniqueOnlyResult } from "@/lib/analysis/calculations";
import type { AnalysisInput, AnalysisResult, ReferenceIndex, StandardAnalysisResult, TechniqueOnlyAnalysisResult } from "@/lib/analysis/types";
import type { TrainingPlanPreview } from "@/lib/training-plans/types";

export function ReportView({
  input,
  result,
  trainingPlanPreview,
}: {
  input: AnalysisInput;
  result: AnalysisResult;
  trainingPlanPreview?: TrainingPlanPreview | null;
}) {
  if (isTechniqueOnlyResult(result)) {
    return (
      <TechniqueOnlyReportView
        input={input}
        result={result}
        trainingPlanPreview={trainingPlanPreview}
      />
    );
  }

  return <StandardReportView input={input} result={result} trainingPlanPreview={trainingPlanPreview} />;
}

function StandardReportView({
  input,
  result,
  trainingPlanPreview,
}: {
  input: AnalysisInput;
  result: StandardAnalysisResult;
  trainingPlanPreview?: TrainingPlanPreview | null;
}) {
  const issue = result.issues[0];
  const styleProfile = result.styleProfile ?? explainStyle(result.style);
  const targetDistance = input.targetDistance ?? result.plan.targetDistance ?? "Becken";
  const sessionsPerWeek = input.swimSessionsPerWeek ?? result.plan.swimSessionsPerWeek ?? 3;
  const techniqueGate = getTechniqueGate(result);

  return (
    <div className="space-y-6">
      <section className="surface grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            Analyse-Ergebnis
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            {input.name} schwimmt {result.test400.dps.toFixed(2)} m pro Zug.
          </h1>
          <p className="muted mt-4 max-w-2xl leading-7">
            Profil: {input.level}, Ziel: {input.goal}, Zielstrecke: {targetDistance}.
            Der nächste sinnvolle Block ist {result.plan.name}.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniFact label="Technikklasse" value={techniqueGate.techniqueClass ?? techniqueGate.status.toUpperCase()} />
            <MiniFact label="Einheiten/Woche" value={String(sessionsPerWeek)} />
            <MiniFact label="Zeitrahmen" value={result.plan.timeframeLabel ?? `${result.plan.weeks} Wochen`} />
            <MiniFact label="ReTest" value={`${result.plan.weeks} Wo.`} />
          </div>
        </div>
        <Triangle result={result} />
      </section>

      {techniqueGate.status === "gelb" ? (
        <section className="surface border-[var(--warn)] p-4 text-sm text-[var(--warn)]">
          {techniqueGate.message}
        </section>
      ) : null}

      <SprintReserveCard result={result} />

      <section className="metric-grid">
        <Metric label="Pace 200 m" value={formatPace(result.test200.pace)} detail="/100 m" accent />
        <Metric label="Pace 400 m" value={formatPace(result.test400.pace)} detail="/100 m" />
        <Metric label="CSS" value={formatPace(result.cssPace)} detail="/100 m Schwelle" accent />
        <Metric label="DPS 400 m" value={result.test400.dps.toFixed(2)} detail="m/Zug" />
        <Metric label="SR 400 m" value={result.test400.sr.toFixed(1)} detail="Züge/min" />
        <Metric label="VLa-Proxy" value={result.vla.profile} detail={`${Math.round(result.vla.drop * 100)} % Drop`} />
      </section>

      <AgeClassComparisonCard result={result} />

      <MetricMeaningGrid result={result} />

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="surface p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 size={18} className="text-[var(--accent)]" />
            Stärken
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

        {issue ? <PrimaryIssueCard issue={issue} /> : null}
      </section>

      {result.issues.length > 1 ? (
        <section className="surface p-5">
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
            Nebenbefunde
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {result.issues.slice(1, 5).map((secondaryIssue) => (
              <div key={secondaryIssue.title} className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
                <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--warn)]">
                  {secondaryIssue.tag}
                </p>
                <h3 className="mt-2 font-semibold">{secondaryIssue.title}</h3>
                <p className="muted mt-2 text-sm leading-6">{secondaryIssue.cause}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <StyleProfileCard profile={styleProfile} />
        <TrainingPlanCard result={result} trainingPlanPreview={trainingPlanPreview} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="surface p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Target size={18} className="text-[var(--accent-2)]" />
            Potenzial
          </div>
          <h2 className="text-3xl font-semibold">{result.potential.paceGain}</h2>
          <p className="muted mt-3 leading-7">{result.potential.description}</p>
        </div>
        <RetestCard result={result} />
      </section>

      <RawDataDetails input={input} result={result} />
    </div>
  );
}

function TechniqueOnlyReportView({
  input,
  result,
  trainingPlanPreview,
}: {
  input: AnalysisInput;
  result: TechniqueOnlyAnalysisResult;
  trainingPlanPreview?: TrainingPlanPreview | null;
}) {
  const issue = result.issues[0];
  const styleProfile = result.styleProfile ?? explainStyle(result.style);

  return (
    <div className="space-y-6">
      <section className="surface grid gap-6 border-[color-mix(in_oklab,var(--warn)_68%,var(--line))] p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--warn)]">
            {result.techniqueGate.title}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Erst Technik stabilisieren, dann physiologisch auswerten.
          </h1>
          <p className="muted mt-4 max-w-2xl leading-7">{result.techniqueGate.message}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniFact label="Technikklasse" value={result.techniqueGate.techniqueClass ?? "Technik-Gate"} />
            <MiniFact label="200 m Pace" value={formatPace(result.test200.pace)} />
            <MiniFact label="Plan" value={result.plan.name} />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-5">
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Warum blockiert?</p>
          <h2 className="mt-3 text-2xl font-semibold">{issue?.title ?? "Technik-Gate Rot"}</h2>
          <p className="muted mt-3 leading-7">{issue?.cause ?? result.techniqueGate.message}</p>
        </div>
      </section>

      {issue ? <PrimaryIssueCard issue={issue} /> : null}

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <StyleProfileCard profile={styleProfile} />
        <TrainingPlanCard result={result} trainingPlanPreview={trainingPlanPreview} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="surface p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Target size={18} className="text-[var(--accent-2)]" />
            Ziel des Blocks
          </div>
          <h2 className="text-3xl font-semibold">{result.potential.paceGain}</h2>
          <p className="muted mt-3 leading-7">{result.potential.description}</p>
        </div>
        <RetestCard result={result} />
      </section>

      <RawDataDetails input={input} result={result} />
    </div>
  );
}

function SprintReserveCard({ result }: { result: StandardAnalysisResult }) {
  const value = result.sprintReserve;

  return (
    <section className="surface grid gap-5 border-[color-mix(in_oklab,var(--accent)_44%,var(--line))] p-5 md:grid-cols-[0.75fr_1.25fr]">
      <div>
        <div className="mb-4 flex items-center gap-2 text-sm font-medium">
          <Gauge size={18} className="text-[var(--accent)]" />
          Sprint-Reserve
        </div>
        <p className="display-serif text-5xl leading-none text-[var(--accent)]">
          {value === null ? "fehlt" : `${Math.round(value * 100)} %`}
        </p>
      </div>
      <div>
        <h2 className="text-2xl font-semibold">
          {value === null ? "50-m-Test ergänzt die Diagnose." : sprintReserveHeadline(value)}
        </h2>
        <p className="muted mt-3 leading-7">
          {value === null
            ? "Ohne 50-m-Zeit bleibt unklar, wie groß der Abstand zwischen maximaler Geschwindigkeit und CSS wirklich ist."
            : sprintReserveText(value)}
        </p>
      </div>
    </section>
  );
}

function AgeClassComparisonCard({ result }: { result: StandardAnalysisResult }) {
  const comparison = result.reference;
  const rows = [
    { label: "50 m", value: comparison.t50, kind: "time" },
    { label: "200 m", value: comparison.t200, kind: "time" },
    { label: "400 m", value: comparison.t400, kind: "time" },
    { label: "CSS", value: comparison.css, kind: "pace" },
  ] as const;
  const hasReference = rows.some((row) => row.value !== null);

  return (
    <section className="surface p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
            Altersklassen-Vergleich
          </p>
          <p className="muted mt-1 text-sm">
            Vergleich mit starkem Agegroup-Niveau.
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {comparison.ageBucket && comparison.sex
              ? `Referenz: ${comparison.ageBucket} Jahre · ${sexLabel(comparison.sex)}`
              : "Keine AK-/Sex-Referenz verfügbar"}
          </h2>
        </div>
        {hasReference ? (
          <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">
            Leistungsorientierte AK-Referenz
          </span>
        ) : null}
      </div>

      {hasReference ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {rows.map((row) => (
            <ReferenceMetric
              key={row.label}
              label={row.label}
              item={row.value}
              kind={row.kind}
            />
          ))}
        </div>
      ) : (
        <p className="muted mt-4 leading-7">
          Für divers wird aktuell keine AK-/Sex-Referenzwertung angezeigt, damit keine falsche Vergleichsgruppe verwendet wird.
        </p>
      )}
    </section>
  );
}

function ReferenceMetric({
  label,
  item,
  kind,
}: {
  label: string;
  item: ReferenceIndex | null;
  kind: "time" | "pace";
}) {
  if (!item) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
        <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
        <p className="muted mt-3 text-sm">Keine Referenz</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="muted">Du</p>
          <p className="font-medium">{formatReferenceValue(item.value, kind)}</p>
        </div>
        <div>
          <p className="muted">AK-Referenz</p>
          <p className="font-medium">{formatReferenceValue(item.reference, kind)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-[var(--accent)]">
        {formatReferenceDelta(item.index)} · {item.label}
      </p>
    </div>
  );
}

function PrimaryIssueCard({
  issue,
}: {
  issue: AnalysisResult["issues"][number];
}) {
  return (
    <div className="surface border-[color-mix(in_oklab,var(--warn)_72%,var(--line))] bg-[color-mix(in_oklab,var(--panel)_88%,var(--warn)_8%)] p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--warn)]">
        <AlertTriangle size={18} />
        Hauptproblem · {issue.tag}
      </div>
      <h2 className="text-2xl font-semibold">{issue.title}</h2>
      <p className="muted mt-3 leading-7">{issue.cause}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
          <p className="mono mb-2 text-xs uppercase text-[var(--subtle)]">Cue</p>
          <p>{issue.cue}</p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
          <p className="mono mb-2 text-xs uppercase text-[var(--subtle)]">Drill</p>
          <p>{issue.drill}</p>
        </div>
      </div>
      {issue.note ? (
        <p className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-3 text-sm text-[var(--muted)]">
          {issue.note}
        </p>
      ) : null}
    </div>
  );
}

function StyleProfileCard({
  profile,
}: {
  profile: NonNullable<AnalysisResult["styleProfile"]>;
}) {
  return (
    <div className="surface p-5">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Stilprofil</p>
      <h2 className="mt-3 text-2xl font-semibold">{profile.name}</h2>
      <p className="muted mt-3 leading-7">{profile.description}</p>
      <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
        <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">
          Was bedeutet das im Training?
        </p>
        <p className="mt-2 text-sm leading-6">{profile.trainingFocus}</p>
      </div>
    </div>
  );
}

function TrainingPlanCard({
  result,
  trainingPlanPreview,
}: {
  result: AnalysisResult;
  trainingPlanPreview?: TrainingPlanPreview | null;
}) {
  const phases = [
    { title: "Woche 1-2", text: "Technikfokus, Cue stabilisieren, kurze saubere Wiederholungen." },
    { title: `Woche 3-${Math.max(4, result.plan.weeks - 2)}`, text: "Hauptserie verlängern, Ziel-DPS halten, Pace kontrollieren." },
    { title: `Woche ${result.plan.weeks}`, text: "Entlastung, Testprotokoll wiederholen, Werte vergleichen." },
  ];

  return (
    <div className="surface p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium">
        <Dumbbell size={18} className="text-[var(--accent)]" />
        Trainingsplan
      </div>
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
        {result.plan.phase} · {result.plan.timeframeLabel ?? `${result.plan.weeks} Wochen`}
      </p>
      <h2 className="mt-3 text-2xl font-semibold">{trainingPlanPreview?.title ?? result.plan.name}</h2>
      <p className="muted mt-2">{trainingPlanPreview?.summary ?? `${result.plan.weeks} Wochen mit ReTest am Ende.`}</p>
      <div className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
            <Lock size={16} />
            Gesperrte Planvorschau
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
          >
            <ShoppingCart size={16} />
            Trainingsplan freischalten
          </button>
        </div>
        <p className="muted mt-3 text-sm leading-6">
          {trainingPlanPreview?.preview ?? "Der passende Plan ist vorbereitet. Die vollständigen Wochen, Einheiten und Drills werden später über die Freischaltung sichtbar."}
        </p>
      </div>
      <div className="mt-5 grid gap-3">
        {phases.map((phase) => (
          <div key={phase.title} className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
            <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">{phase.title}</p>
            <p className="muted mt-2 text-sm leading-6">{phase.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RetestCard({ result }: { result: AnalysisResult }) {
  return (
    <section className="surface h-full border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium">
        <RefreshCcw size={18} className="text-[var(--accent)]" />
        ReTest-Empfehlung
      </div>
      <h2 className="text-2xl font-semibold">Nach {result.plan.weeks} Wochen wiederholen</h2>
      <p className="muted mt-3 leading-7">
        {result.plan.retestHint ?? "Gleicher Pool, gleiche Testfolge, gleiche Pausen. Nur so ist der Vergleich belastbar."}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <RetestMetric label="Ziel 400 m" value={result.potential.paceGain} />
        <RetestMetric label="Kontrolle" value="DPS + SR" />
        <RetestMetric label="Termin" value={`${result.plan.weeks} Wo.`} />
      </div>
    </section>
  );
}

function RetestMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
      <CalendarCheck2 size={18} className="text-[var(--accent)]" />
      <p className="mono mt-3 text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
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

function MetricMeaningGrid({ result }: { result: StandardAnalysisResult }) {
  const meanings = [
    {
      label: "CSS",
      text: `Deine Schwellenpace liegt bei ${formatPace(result.cssPace)} /100 m. Daraus lassen sich ruhige Dauer-, Schwellen- und ReTest-Serien steuern.`,
    },
    {
      label: "DPS",
      text: `Mit ${result.test400.dps.toFixed(2)} m/Zug ist sichtbar, wie viel Strecke du aus einem Armzug holst. Sinkt DPS, braucht der Plan Technikanker.`,
    },
    {
      label: "SR",
      text: `Die Frequenz liegt bei ${result.test400.sr.toFixed(1)} Zügen/min. Zu viel SR kostet Länge, zu wenig SR limitiert Wettkampftempo.`,
    },
    {
      label: "Sprint-Reserve",
      text: result.sprintReserve === null
        ? "Ohne 50-m-Test bleibt die Reserve offen. Ergänze ihn, wenn Sprint und CSS besser getrennt werden sollen."
        : `Die Reserve liegt bei ${Math.round(result.sprintReserve * 100)} %. Sie zeigt, wie viel Tempo oberhalb der Schwelle verfügbar ist.`,
    },
  ];

  return (
    <section className="surface p-5">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
        Was bedeutet das im Training?
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {meanings.map((item) => (
          <div key={item.label} className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
            <h3 className="font-semibold text-[var(--accent)]">{item.label}</h3>
            <p className="muted mt-2 text-sm leading-6">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Triangle({ result }: { result: StandardAnalysisResult }) {
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
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
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
      <div className="mt-3 grid gap-2 text-sm">
        <TriangleNote label="VO2" text={`aerobe Leistung: ${levelLabel(result.vo2.level)}`} />
        <TriangleNote label="VLa" text={`Laktat-Proxy: ${levelLabel(result.vla.level)}`} />
        <TriangleNote label="CSS" text={`Dauertempo: ${formatPace(result.cssPace)} /100 m`} />
      </div>
    </div>
  );
}

function RawDataDetails({ input, result }: { input: AnalysisInput; result: AnalysisResult }) {
  const fitnessLevel = input.fitnessLevel ? normalizeFitnessLevel(input.fitnessLevel) : null;
  const isTechniqueOnly = isTechniqueOnlyResult(result);
  const techniqueGate = getTechniqueGate(result);

  return (
    <details className="surface p-5">
      <summary className="cursor-pointer text-sm font-medium">Rohdaten anzeigen</summary>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <RawData label="50 m Zeit" value={input.t50 || "nicht erfasst"} />
        <RawData label="200 m Zeit" value={input.t200} />
        <RawData label="400 m Zeit" value={input.t400 || "nicht erfasst"} />
        <RawData label="Züge 200 m" value={String(input.s200)} />
        <RawData label="Züge 400 m" value={input.s400 ? String(input.s400) : "nicht erfasst"} />
        <RawData label="KFA" value={input.bodyFatPercentage ? `${input.bodyFatPercentage} %` : "nicht erfasst"} />
        <RawData label="Fitnesslevel" value={fitnessLevel ? `${fitnessLevel}/5` : "nicht erfasst"} />
        <RawData label="Becken" value={`${input.poolLength} m`} />
        <RawData label="Technik-Gate" value={techniqueGate.status.toUpperCase()} />
        <RawData label="Technikklasse" value={techniqueGate.techniqueClass ?? "nicht erfasst"} />
        {!isTechniqueOnly ? (
          <>
            <RawData label="Pace-Differenz" value={`${result.comparison.paceDiff.toFixed(1)} s/100 m`} />
            <RawData label="DPS-Differenz" value={`${result.comparison.dpsDiff.toFixed(2)} m`} />
            <RawData label="SR-Differenz" value={`${result.comparison.srDiff.toFixed(1)} Züge/min`} />
          </>
        ) : null}
      </div>
    </details>
  );
}

function normalizeFitnessLevel(value: number) {
  if (value <= 5) return value;
  return Math.min(5, Math.max(1, Math.round(value / 2)));
}

function getTechniqueGate(result: AnalysisResult) {
  return result.techniqueGate ?? {
    status: "gruen" as const,
    reason: "technique_stable" as const,
    techniqueClass: null,
    title: "Technik-Gate Grün",
    message: "Technik ausreichend stabil. Die physiologische Auswertung ist möglich.",
  };
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-3">
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function TriangleNote({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-2">
      <span className="font-medium text-[var(--accent)]">{label}</span>
      <span className="muted text-right">{text}</span>
    </div>
  );
}

function RawData({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function sexLabel(sex: "maennlich" | "weiblich") {
  return sex === "maennlich" ? "männlich" : "weiblich";
}

function formatReferenceValue(value: number, kind: "time" | "pace") {
  const formatted = value < 60 ? `${value.toFixed(1)} s` : formatPace(value);
  return kind === "pace" ? `${formatted} /100 m` : formatted;
}

function formatReferenceDelta(index: number) {
  if (index <= 0) return `${Math.abs(Math.round(index * 100))} % schneller`;
  return `${Math.round(index * 100)} % über Referenz`;
}

function levelLabel(level: StandardAnalysisResult["vla"]["level"] | StandardAnalysisResult["vo2"]["level"]) {
  if (level === "nicht_ermittelbar") return "nicht ermittelbar";
  if (level === "hoch") return "hoch";
  if (level === "mittel") return "mittel";
  return "niedrig";
}

function sprintReserveHeadline(value: number) {
  if (value >= 0.2) return "Viel Tempo oberhalb der Schwelle.";
  if (value >= 0.1) return "Solide Reserve, gut dosierbar.";
  return "Reserve knapp, CSS und Sprint liegen nah beieinander.";
}

function sprintReserveText(value: number) {
  if (value >= 0.2) {
    return "Du kannst deutlich schneller als CSS schwimmen. Im Training lohnt sich, diese Reserve kontrolliert in Technik und Race Pace zu übersetzen.";
  }
  if (value >= 0.1) {
    return "Die Reserve ist vorhanden, sollte aber über saubere kurze Wiederholungen stabilisiert werden.";
  }
  return "Der Fokus sollte auf aerober Basis, Wasserlage und Zuglänge liegen, bevor mehr Spitzenintensität dazukommt.";
}
