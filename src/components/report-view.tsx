import {
  AlertTriangle,
  CalendarCheck2,
  Dumbbell,
  Lock,
  RefreshCcw,
  ShoppingCart,
} from "lucide-react";
import { explainStyle, formatPace, isTechniqueOnlyResult } from "@/lib/analysis/calculations";
import type {
  AnalysisInput,
  AnalysisResult,
  ReferenceIndex,
  StandardAnalysisResult,
  TechniqueOnlyAnalysisResult,
  TestMetrics,
} from "@/lib/analysis/types";
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
  const focus = getPublicTrainingFocus(result.plan.slug, result.plan.name);

  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          Analyse-Ergebnis
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Deine CSS beträgt {formatPace(result.cssPace)} /100 m.
        </h1>
        <p className="muted mt-4 max-w-2xl leading-7">
          Das ist aktuell deine Schwellenpace im Schwimmen.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Profil: {input.level} · Ziel: {input.goal} {targetDistance !== "Becken" ? targetDistance : ""} · Fokus: {focus}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniFact label="Technikklasse" value={techniqueGate.techniqueClass ?? techniqueGate.status.toUpperCase()} />
          <MiniFact label="Einheiten/Woche" value={String(sessionsPerWeek)} />
          <MiniFact label="Zeitrahmen" value={result.plan.timeframeLabel ?? `${result.plan.weeks} Wochen`} />
          <MiniFact label="ReTest" value={`${result.plan.weeks} Wo.`} />
        </div>
      </section>

      {techniqueGate.status === "gelb" ? (
        <section className="surface border-[var(--warn)] p-4 text-sm text-[var(--warn)]">
          {techniqueGate.message}
        </section>
      ) : null}

      <PhysiologicalProfileCard result={result} />
      <SwimMechanicsCard result={result} />

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <StyleProfileCard profile={styleProfile} />
        <TrainingLeverCard
          issue={issue}
          result={result}
          trainingPlanPreview={trainingPlanPreview}
        />
      </section>

      <RetestCard result={result} />
      <ExpertDetails input={input} result={result} />
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
      <section className="surface border-[color-mix(in_oklab,var(--warn)_68%,var(--line))] p-6">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--warn)]">
          {result.techniqueGate.title}
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Erst Technik stabilisieren, dann physiologisch auswerten.
        </h1>
        <p className="muted mt-4 max-w-2xl leading-7">{result.techniqueGate.message}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MiniFact label="Technikklasse" value={result.techniqueGate.techniqueClass ?? "Technik-Gate"} />
          <MiniFact label="200 m Pace" value={formatPace(result.test200.pace)} />
          <MiniFact label="Fokus" value={getPublicTrainingFocus(result.plan.slug, result.plan.name)} />
        </div>
      </section>

      <SwimMechanicsCard result={result} />

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <StyleProfileCard profile={styleProfile} />
        <TrainingLeverCard
          issue={issue}
          result={result}
          trainingPlanPreview={trainingPlanPreview}
        />
      </section>

      <RetestCard result={result} />
      <ExpertDetails input={input} result={result} />
    </div>
  );
}

function PhysiologicalProfileCard({ result }: { result: StandardAnalysisResult }) {
  const cssScore = result.spiderScores?.css ?? scoreReferenceForBar(result.reference.css);
  const bars = [
    {
      label: "Aerobe Kapazität",
      score: Math.round(result.vo2.score * 100),
      value: capacityLabel(result.vo2.score * 100, "aerobic"),
      text: aerobicCapacityText(result.vo2.score),
    },
    {
      label: "Anaerobe Kapazität",
      score: Math.round(result.vla.score * 100),
      value: capacityLabel(result.vla.score * 100, "anaerobic"),
      text: anaerobicCapacityText(result.vla.score),
    },
    {
      label: "Schwellenleistung / CSS",
      score: cssScore,
      value: capacityLabel(cssScore, "css"),
      text: cssCapacityText(cssScore),
    },
  ];

  return (
    <section className="surface p-5">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
        Physiologisches Profil
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Leistungsindizes für dein Schwimmen</h2>
      <p className="muted mt-2 max-w-2xl leading-7">
        Die Einordnung basiert auf deinem Schwimmtest und bleibt bewusst qualitativ, keine Labordiagnostik.
      </p>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {bars.map((bar) => (
          <CapacityBar key={bar.label} label={bar.label} score={bar.score} value={bar.value} text={bar.text} />
        ))}
      </div>
    </section>
  );
}

function CapacityBar({ label, score, value, text }: { label: string; score: number; value: string; text: string }) {
  const safeScore = Math.max(0, Math.min(100, score));

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">{label}</p>
        <p className="text-sm font-medium text-[var(--accent)]">{value}</p>
      </div>
      <div className="mt-4 h-2 rounded-full bg-[var(--line)]">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${safeScore}%` }} />
      </div>
      <p className="muted mt-3 text-sm leading-6">{text}</p>
    </div>
  );
}

function SwimMechanicsCard({ result }: { result: AnalysisResult }) {
  const metrics = getPrimaryMechanics(result);

  return (
    <section className="surface p-5">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
        Schwimm-Mechanik
      </p>
      <h2 className="mt-2 text-2xl font-semibold">So entsteht deine Geschwindigkeit</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <MechanicMetric label="DPS" value={metrics.dps} detail="m/Zug" />
        <MechanicMetric label="SR" value={metrics.sr} detail="Züge/min" />
        <MechanicMetric label="Zugzahl" value={metrics.strokes} detail="Züge pro Bahn" />
      </div>
      <p className="muted mt-5 max-w-3xl leading-7">{mechanicsSummary(metrics.raw)}</p>
    </section>
  );
}

function MechanicMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
      <p className="mono text-xs uppercase tracking-[0.14em] text-[var(--subtle)]">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-[var(--accent)]">{value}</p>
      <p className="muted mt-2 text-sm">{detail}</p>
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
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
        Dein aktuelles Schwimmmuster
      </p>
      <h2 className="mt-3 text-2xl font-semibold">{profile.name}</h2>
      <p className="muted mt-3 leading-7">
        Im aktuellen Test zeigt sich dieses Muster: {profile.description}
      </p>
      <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
        <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">
          Coaching-Fokus
        </p>
        <p className="mt-2 text-sm leading-6">{profile.trainingFocus}</p>
      </div>
    </div>
  );
}

function TrainingLeverCard({
  issue,
  result,
  trainingPlanPreview,
}: {
  issue: AnalysisResult["issues"][number] | undefined;
  result: AnalysisResult;
  trainingPlanPreview?: TrainingPlanPreview | null;
}) {
  const focus = getPublicTrainingFocus(result.plan.slug, result.plan.name);
  const timeframe = result.plan.timeframeLabel ?? `${result.plan.weeks} Wochen`;

  return (
    <section className="surface border-[color-mix(in_oklab,var(--warn)_48%,var(--line))] p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--warn)]">
        <AlertTriangle size={18} />
        Trainingshebel
      </div>
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
        Hauptproblem
      </p>
      <h2 className="mt-2 text-2xl font-semibold">{issue?.title ?? "Fokus stabilisieren"}</h2>
      <p className="muted mt-3 leading-7">
        {issue?.cause ?? "Der nächste Block bündelt Technik, Rhythmus und kontrollierbare Wiederholungen."}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <LeverItem label="Haupthebel" value={focus} />
        <LeverItem label="Cue" value={issue?.cue ?? "Ruhig bleiben und Länge halten."} />
        <LeverItem label="Drill" value={issue?.drill ?? "6 x 50 m locker mit stabiler Zugzahl."} />
      </div>
      <div className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
              <Dumbbell size={18} />
              Trainingsblock
            </div>
            <p className="muted mt-2 text-sm">{timeframe}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
          >
            <ShoppingCart size={16} />
            Trainingsplan freischalten
          </button>
        </div>
        <div className="mt-4 rounded-lg border border-[color-mix(in_oklab,var(--accent)_38%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_8%,var(--raised-bg))] p-4">
          <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
            Potenzial mit diesem Fokus
          </p>
          <p className="mt-2 text-2xl font-semibold">{result.potential.paceGain}</p>
          <p className="muted mt-2 text-sm leading-6">{result.potential.description}</p>
        </div>
        <p className="muted mt-3 text-sm leading-6">
          {trainingPlanPreview?.summary ?? `${result.plan.weeks} Wochen mit einem klaren Schwerpunkt und ReTest am Ende.`}
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--accent)]">
          <Lock size={16} />
          <span>Die vollständigen Einheiten und Progressionen bleiben bis zur Freischaltung gesperrt.</span>
        </div>
        {trainingPlanPreview?.preview ? (
          <p className="muted mt-3 text-sm leading-6">{trainingPlanPreview.preview}</p>
        ) : null}
      </div>
    </section>
  );
}

function LeverItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
      <p className="mono mb-2 text-xs uppercase text-[var(--subtle)]">{label}</p>
      <p className="text-sm leading-6">{value}</p>
    </div>
  );
}

function RetestCard({ result }: { result: AnalysisResult }) {
  return (
    <section className="surface border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium">
        <RefreshCcw size={18} className="text-[var(--accent)]" />
        ReTest
      </div>
      <h2 className="text-2xl font-semibold">Nach {result.plan.weeks} Wochen wiederholen</h2>
      <p className="muted mt-3 max-w-3xl leading-7">
        {result.plan.retestHint ?? "Gleicher Pool, gleiche Testfolge, gleiche Pausen. Nur so ist der Vergleich belastbar."}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <RetestMetric label="Wann" value={`${result.plan.weeks} Wochen`} />
        <RetestMetric label="Worauf achten" value={isTechniqueOnlyResult(result) ? "400 m stabil" : "CSS, DPS + SR"} />
        <RetestMetric label="Realistisches Ziel" value={result.potential.paceGain} />
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

/**
 * Keeps diagnostic internals available without making them part of the coaching-first reading path.
 */
function ExpertDetails({ input, result }: { input: AnalysisInput; result: AnalysisResult }) {
  const fitnessLevel = input.fitnessLevel ? normalizeFitnessLevel(input.fitnessLevel) : null;
  const isTechniqueOnly = isTechniqueOnlyResult(result);
  const techniqueGate = getTechniqueGate(result);
  const scores = !isTechniqueOnly ? result.spiderScores ?? fallbackSpiderScores(result) : null;
  const referenceRows = !isTechniqueOnly
    ? [
        { label: "50 m", value: result.reference.t50, kind: "time" as const },
        { label: "200 m", value: result.reference.t200, kind: "time" as const },
        { label: "400 m", value: result.reference.t400, kind: "time" as const },
        { label: "CSS", value: result.reference.css, kind: "pace" as const },
      ]
    : [];
  const hasReference = referenceRows.some((row) => row.value !== null);

  return (
    <details className="surface p-5">
      <summary className="cursor-pointer text-sm font-medium">Expertenmodus / Details</summary>
      <div className="mt-5 space-y-6">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Rohdaten</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <DetailItem label="50 m Zeit" value={input.t50 || "nicht erfasst"} />
            <DetailItem label="200 m Zeit" value={input.t200} />
            <DetailItem label="400 m Zeit" value={input.t400 || "nicht erfasst"} />
            <DetailItem label="Züge 50 m" value={input.s50 ? String(input.s50) : "nicht erfasst"} />
            <DetailItem label="Züge 200 m" value={String(input.s200)} />
            <DetailItem label="Züge 400 m" value={input.s400 ? String(input.s400) : "nicht erfasst"} />
            <DetailItem label="KFA" value={input.bodyFatPercentage ? `${input.bodyFatPercentage} %` : "nicht erfasst"} />
            <DetailItem label="Fitnesslevel" value={fitnessLevel ? `${fitnessLevel}/5` : "nicht erfasst"} />
            <DetailItem label="Becken" value={`${input.poolLength} m`} />
            <DetailItem label="Technik-Gate" value={techniqueGate.status.toUpperCase()} />
            <DetailItem label="Technikklasse" value={techniqueGate.techniqueClass ?? "nicht erfasst"} />
            <DetailItem label="Testmodus" value={result.mode} />
          </div>
        </div>

        {!isTechniqueOnly ? (
          <>
            <div>
              <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Technische Cross-Checks</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <DetailItem label="Pace-Differenz" value={`${result.comparison.paceDiff.toFixed(1)} s/100 m`} />
                <DetailItem label="DPS-Differenz" value={`${result.comparison.dpsDiff.toFixed(2)} m`} />
                <DetailItem label="SR-Differenz" value={`${result.comparison.srDiff.toFixed(1)} Züge/min`} />
                <DetailItem label="Sprintreserve" value={formatSprintReserve(result)} />
                <DetailItem label="Sprintreserve-Kategorie" value={result.sprintReserveCategory ?? "nicht erfasst"} />
                <DetailItem label="Sprintreserve-Check" value={result.sprintReservePlausibility?.text ?? "nicht erfasst"} />
                <DetailItem label="VLa-Band" value={result.vla.performanceBand ?? "nicht erfasst"} />
                <DetailItem label="VO2-Level" value={result.vo2.level} />
                <DetailItem label="CSS-Erwartung" value={result.cssExpectation ?? "nicht erfasst"} />
              </div>
            </div>

            {scores ? (
              <div>
                <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Profil-Scores</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <DetailItem label="CSS" value={String(Math.round(scores.css))} />
                  <DetailItem label="DPS" value={String(Math.round(scores.dps))} />
                  <DetailItem label="SR" value={String(Math.round(scores.sr))} />
                  <DetailItem label="DPS-Stabilität" value={String(Math.round(scores.dpsStability))} />
                  <DetailItem label="SR-Anpassung" value={String(Math.round(scores.srAdaptation))} />
                  <DetailItem label="Tempo-Effizienz" value={String(Math.round(scores.tempoEfficiency))} />
                </div>
              </div>
            ) : null}

            <div>
              <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Vergleichswerte</p>
              {hasReference ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {referenceRows.map((row) => (
                    <ReferenceMetric key={row.label} label={row.label} item={row.value} kind={row.kind} />
                  ))}
                </div>
              ) : (
                <p className="muted mt-4 leading-7">
                  Keine AK-/Sex-Referenz verfügbar.
                </p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </details>
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

function getPrimaryMechanics(result: AnalysisResult) {
  const raw = result.test400 ?? result.test200;

  return {
    raw,
    dps: raw.dps.toFixed(2),
    sr: raw.sr.toFixed(1),
    strokes: formatStrokeCount(raw.strokesPerLength),
  };
}

function formatStrokeCount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function mechanicsSummary(test: TestMetrics) {
  if (test.dps >= 1.75 && test.sr < 60) {
    return "Deine Zuglänge ist aktuell deutlich ausgeprägter als deine Frequenz. Tempo entsteht deshalb vor allem über lange Züge.";
  }
  if (test.sr >= 62 && test.dps < 1.6) {
    return "Deine Frequenz ist aktuell deutlich ausgeprägter als deine Zuglänge. Tempo entsteht deshalb vor allem über Rhythmus.";
  }
  if (test.dps >= 1.7 && test.sr >= 58) {
    return "Zuglänge und Frequenz arbeiten bereits gut zusammen; der nächste Schritt ist Stabilität unter Belastung.";
  }
  return "Dein Tempo entsteht aktuell über einen soliden Grundrhythmus; Zuglänge und Frequenz können noch stabiler zusammenfinden.";
}

function capacityLabel(score: number, type: "aerobic" | "anaerobic" | "css") {
  if (type === "anaerobic") {
    if (score >= 70) return "ausgeprägt";
    if (score >= 45) return "ausgeglichen";
    return "ruhig";
  }

  if (type === "css") {
    if (score >= 75) return "stark";
    if (score >= 50) return "solide";
    if (score >= 25) return "entwickelbar";
    return "viel Potenzial";
  }

  if (score >= 70) return "stark";
  if (score >= 50) return "solide";
  if (score >= 25) return "entwickelbar";
  return "viel Potenzial";
}

function aerobicCapacityText(score: number) {
  if (score >= 0.7) return "Gute aerobe Basis; der nächste Schritt ist saubere Umsetzung im Wettkampftempo.";
  if (score >= 0.5) return "Solide aerobe Basis mit weiterem Entwicklungspotenzial.";
  return "Die aerobe Basis ist aktuell der wichtigste Entwicklungshebel.";
}

function anaerobicCapacityText(score: number) {
  if (score >= 0.7) return "Viel Kurztempo ist vorhanden; wichtig ist jetzt die kontrollierte Dosierung.";
  if (score >= 0.5) return "Deine Kurztempo-Reserve wirkt ausgeglichen und gut trainierbar.";
  return "Dein Profil ist ruhig; der Fokus liegt eher auf stabiler Geschwindigkeit.";
}

function cssCapacityText(score: number) {
  if (score >= 75) return "Deine Schwellenleistung ist im Verhältnis stark.";
  if (score >= 50) return "Deine Schwellenleistung ist solide und gut steuerbar.";
  return "Bei der Schwellenleistung liegt noch klares Potenzial.";
}

function getPublicTrainingFocus(slug: string | undefined, name: string) {
  if (slug === "vo2max-builder") return "Aerobe Kapazität aufbauen";
  if (slug === "vlamax-senker") return "Anaerobe Kapazität dosieren";
  if (slug === "wasserlage-balance") return "Wasserlage & Balance";
  if (slug === "tempohaerte") return "Tempohärte";
  return name;
}

function formatSprintReserve(result: StandardAnalysisResult) {
  if (result.sprintReserve === null) return "nicht erfasst";
  return `${Math.round(result.sprintReserve * 100)} %`;
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

function formatReferenceValue(value: number, kind: "time" | "pace") {
  const formatted = value < 60 ? `${value.toFixed(1)} s` : formatPace(value);
  return kind === "pace" ? `${formatted} /100 m` : formatted;
}

function formatReferenceDelta(index: number) {
  if (index <= 0) return `${Math.abs(Math.round(index * 100))} % schneller`;
  return `${Math.round(index * 100)} % über Referenz`;
}

function scoreReferenceForBar(reference: ReferenceIndex | null) {
  if (!reference) return 50;
  if (reference.index <= 0) return 100;
  if (reference.index <= 0.1) return Math.round(100 - (reference.index / 0.1) * 25);
  if (reference.index <= 0.25) return Math.round(75 - ((reference.index - 0.1) / 0.15) * 25);
  if (reference.index <= 0.5) return Math.round(50 - ((reference.index - 0.25) / 0.25) * 25);
  if (reference.index <= 0.7) return Math.round(25 - ((reference.index - 0.5) / 0.2) * 25);
  return 0;
}

function fallbackSpiderScores(result: StandardAnalysisResult) {
  const css = result.reference.css ? Math.max(0, Math.min(100, 100 - Math.max(0, result.reference.css.index) * 180)) : 50;
  const dpsDrop = (result.test200.dps - result.test400.dps) / result.test200.dps;
  const srChange = Math.abs((result.test200.sr - result.test400.sr) / result.test400.sr);

  return {
    css,
    dps: Math.max(0, Math.min(100, ((result.test200.dps - 1.2) / 0.8) * 100)),
    sr: Math.max(0, Math.min(100, ((result.test200.sr - 45) / 40) * 100)),
    dpsStability: Math.max(0, Math.min(100, 100 - Math.max(0, dpsDrop - 0.05) * 320)),
    srAdaptation: srChange >= 0.05 && srChange <= 0.15 ? 100 : Math.max(0, 75 - Math.abs(srChange - 0.15) * 180),
    tempoEfficiency: 50,
  };
}
