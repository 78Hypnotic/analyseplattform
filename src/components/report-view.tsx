import { CalendarCheck2, RefreshCcw, Waves } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { TechniqueSpiderChart } from "@/components/technique-spider-chart";
import { SwimZoneScale } from "@/components/swim-zone-scale";
import { buildSwimZones, buildTechniqueProfile, computeSwolf, formatPace, isTechniqueOnlyResult } from "@/lib/analysis/calculations";
import type {
  AnalysisInput,
  AnalysisResult,
  ReferenceIndex,
  StandardAnalysisResult,
  TechniqueOnlyAnalysisResult,
  TechniqueProfileAxis,
  TestMetrics,
} from "@/lib/analysis/types";
import { getBodyTypeLabel } from "@/lib/body-type";
import type { TrainingPlanPreview } from "@/lib/training-plans/types";

const BEGINNER_PLAN_PRICE = "29,99";
const BEGINNER_PLAN_WEEKS = 8;
const TRAINING_PLAN_PRICE = "29,99";

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
    if (!result.test50 && !result.test200) {
      return <BeginnerReportView input={input} result={result} trainingPlanPreview={trainingPlanPreview} />;
    }

    return <TechniqueOnlyReportView input={input} result={result} />;
  }

  return <StandardReportView input={input} result={result} />;
}

/**
 * Ohne Testzeiten gibt es keine belastbaren Metriken, deshalb führt der Report direkt zum Anfängerplan.
 */
function BeginnerReportView({
  input,
  result,
  trainingPlanPreview,
}: {
  input: AnalysisInput;
  result: TechniqueOnlyAnalysisResult;
  trainingPlanPreview?: TrainingPlanPreview | null;
}) {
  const firstName = input.name.trim().split(" ")[0] ?? input.name;
  const sessionsPerWeek = input.swimSessionsPerWeek ?? result.plan.swimSessionsPerWeek ?? 3;
  const planTitle = trainingPlanPreview?.title ?? result.plan.name;
  const planFocus = trainingPlanPreview?.focus ?? getPublicTrainingFocus(result.plan.slug, result.plan.name);
  const planSummary =
    trainingPlanPreview?.summary ??
    "Wasserlage, Atmung und ruhige Wiederholungen. Der Plan führt dich Schritt für Schritt zu 400 m am Stück.";

  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <p className="mono flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          <Waves size={14} aria-hidden="true" />
          Willkommen
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Schön, dass du mit dem Schwimmen anfängst, {firstName}.
        </h1>
        <p className="muted mt-4 max-w-2xl leading-7">
          Zahlen wie CSS oder Pace bringen dir jetzt noch nichts. Zuerst geht es um Wasserlage, Atmung und
          Sicherheit im Becken. Genau dafür ist dein Einstiegsplan gemacht.
        </p>
      </section>

      <section className="surface p-5">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Dein Ziel</p>
        <h2 className="mt-2 text-2xl font-semibold">400 m am Stück – gut machbar in {BEGINNER_PLAN_WEEKS} Wochen</h2>
        <p className="muted mt-3 max-w-3xl leading-7">
          Fast alle schaffen das schneller als gedacht, sobald die Technik stimmt. Darauf zahlen deine ersten
          Einheiten ein:
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <BeginnerFocus title="Ruhig atmen" text="Gleichmäßig ins Wasser ausatmen nimmt Hektik aus jeder Bahn." />
          <BeginnerFocus title="Hoch liegen" text="Kopf tief, Blick nach unten: Die Beine kommen von allein nach oben." />
          <BeginnerFocus title="Länge vor Tempo" text="Lieber wenige lange Züge als viel Kraft. Das spart Energie." />
        </div>
      </section>

      <section className="surface border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] p-6">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Trainingsplan</p>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{planTitle}</h2>
        <p className="muted mt-3 max-w-3xl leading-7">{planSummary}</p>
        {trainingPlanPreview?.preview ? (
          <p className="mt-4 max-w-3xl rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4 text-sm leading-6 text-[var(--muted)]">
            {trainingPlanPreview.preview}
          </p>
        ) : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MiniFact label="Fokus" value={planFocus} />
          <MiniFact label="Umfang" value={`${BEGINNER_PLAN_WEEKS} Wochen · ${sessionsPerWeek}x/Woche`} />
          <MiniFact label="Ziel" value="400 m am Stück" />
        </div>
        <div className="mt-6 border-t border-[var(--line)] pt-6">
          <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">So geht es weiter</p>
          <BeginnerMilestones sessionsPerWeek={sessionsPerWeek} />
        </div>
        <div className="mt-6 flex flex-col gap-4 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">Preis</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight">
              {BEGINNER_PLAN_PRICE}<span className="ml-1 text-base text-[var(--subtle)]">EUR</span>
            </p>
            <p className="muted mt-1 text-sm">Einmalig für {BEGINNER_PLAN_WEEKS} Wochen Einstiegsplan</p>
          </div>
          <div className="no-print flex flex-wrap items-center gap-3">
            <ButtonLink href="/#preise" variant="primary">
              Anfängerplan freischalten
            </ButtonLink>
            <ButtonLink href="/analyse/new" variant="ghost">
              Später erneut testen
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}

function BeginnerFocus({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="muted mt-2 text-sm leading-6">{text}</p>
    </div>
  );
}

function BeginnerMilestones({ sessionsPerWeek }: { sessionsPerWeek: number }) {
  const milestones = [
    {
      title: "Jetzt: Einstiegsplan starten",
      text: `${BEGINNER_PLAN_WEEKS} Wochen mit ${sessionsPerWeek} Einheiten pro Woche. Fokus auf Wasserlage, Atmung und ruhige Technik.`,
    },
    {
      title: "Meilenstein: 400 m am Stück",
      text: "Sobald du 400 m ohne Pause durchschwimmst, ist die technische Basis gelegt.",
    },
    {
      title: "ReTest: 50 m, 200 m und 400 m",
      text: "Der vollständige Schwimmtest liefert Pace, Zuglänge und Zugfrequenz.",
    },
    {
      title: "Plan für Fortgeschrittene",
      text: "Mit CSS und Leistungsprofil bekommst du einen Plan, der auf deine Werte zugeschnitten ist.",
    },
  ];

  return (
    <ol className="mt-4">
      {milestones.map((milestone, index) => (
        <li key={milestone.title} className="relative flex gap-4 pb-6 last:pb-0">
          {index < milestones.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px -translate-x-1/2 bg-[var(--line)]"
            />
          ) : null}
          <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--panel-2)] text-xs font-medium text-[var(--accent)]">
            {index + 1}
          </span>
          <div className="min-w-0 pt-1">
            <p className="text-sm font-medium">{milestone.title}</p>
            <p className="muted mt-1 text-sm leading-6">{milestone.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function StandardReportView({
  input,
  result,
}: {
  input: AnalysisInput;
  result: StandardAnalysisResult;
}) {
  const targetDistance = input.targetDistance ?? result.plan.targetDistance ?? "Becken";
  const focus = getPublicTrainingFocus(result.plan.slug, result.plan.name);
  const techniqueProfile = buildTechniqueProfile(input.challenges);
  const focusAxis = techniqueProfile.find((axis) => axis.status === "fokus") ?? null;

  return (
    <div className="space-y-6">
      <section className="surface p-6">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          Analyse-Ergebnis
        </p>
        {result.styleProfile ? (
          <p className="mt-4 inline-flex rounded-full border border-[var(--accent)] bg-[var(--panel-2)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
            Dein Profil: {result.styleProfile.name}
          </p>
        ) : null}
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Deine CSS beträgt {formatPace(result.cssPace)} /100 m.
        </h1>
        <p className="muted mt-4 max-w-2xl leading-7">{buildHeadlineInsight(result, focusAxis)}</p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Profil: {input.level} · Ziel: {input.goal} {targetDistance !== "Becken" ? targetDistance : ""} · Fokus: {focus}
        </p>
      </section>

      <SwimMechanicsCard result={result} techniqueProfile={techniqueProfile} poolLength={input.poolLength} />

      <BiggestLeverCard result={result} focusAxis={focusAxis} />
      <SwimZonesCard result={result} />
      <PlanRecommendationCard input={input} result={result} focusAxis={focusAxis} />
      <ExpertDetails input={input} result={result} />
    </div>
  );
}

/** Verbindet die Referenzeinordnung der Schwelle mit dem größten Technikhebel. */
function buildHeadlineInsight(result: StandardAnalysisResult, focusAxis: TechniqueProfileAxis | null) {
  const cssLabel = result.reference.css?.label;
  const base =
    cssLabel && cssLabel !== "Keine Referenz verfügbar"
      ? `Das ist deine Schwellenpace. Im Vergleich zu deiner Altersgruppe: ${cssLabel}.`
      : "Das ist aktuell deine Schwellenpace im Schwimmen.";

  if (focusAxis) {
    return `${base} Der größte Hebel liegt aktuell nicht im Umfang, sondern im Bereich ${focusAxis.group}.`;
  }

  return `${base} Der nächste Schritt ist, dieses Tempo unter Belastung stabil zu halten.`;
}

function TechniqueOnlyReportView({
  input,
  result,
}: {
  input: AnalysisInput;
  result: TechniqueOnlyAnalysisResult;
}) {
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
          <MiniFact
            label={result.test200 ? "200 m Pace" : "Einheiten/Woche"}
            value={
              result.test200
                ? formatPace(result.test200.pace)
                : String(input.swimSessionsPerWeek ?? result.plan.swimSessionsPerWeek ?? 3)
            }
          />
          <MiniFact label="Fokus" value={getPublicTrainingFocus(result.plan.slug, result.plan.name)} />
        </div>
      </section>

      <SwimMechanicsCard result={result} />

      <RetestCard result={result} />
      <ExpertDetails input={input} result={result} />
    </div>
  );
}

function SwimMechanicsCard({
  result,
  techniqueProfile,
  poolLength,
}: {
  result: AnalysisResult;
  techniqueProfile?: TechniqueProfileAxis[];
  poolLength?: number;
}) {
  const metrics = getPrimaryMechanics(result);
  if (!metrics) return null;

  const swolf = computeSwolf(metrics.raw);

  return (
    <section className="surface p-5">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
        Schwimm-Mechanik
      </p>
      <h2 className="mt-2 text-2xl font-semibold">So entsteht deine Geschwindigkeit</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <MechanicMetric label="DPS" value={metrics.dps} detail="m/Zug" />
        <MechanicMetric label="SR" value={metrics.sr} detail="Züge/min" />
        <MechanicMetric label="Zugzahl" value={metrics.strokes} detail="Züge pro Bahn" />
        <MechanicMetric
          label="SWOLF"
          value={swolf.toFixed(0)}
          detail={poolLength ? `Zeit + Züge je ${poolLength} m` : "Zeit + Züge pro Bahn"}
        />
      </div>
      <p className="muted mt-5 max-w-3xl leading-7">{mechanicsSummary(metrics.raw)}</p>
      {techniqueProfile ? <TechniqueProfileBlock axes={techniqueProfile} /> : null}
    </section>
  );
}

function TechniqueProfileBlock({ axes }: { axes: TechniqueProfileAxis[] }) {
  const focusAxes = axes.filter((axis) => axis.status === "fokus");
  const strongAxes = axes.filter((axis) => axis.status === "stark");

  return (
    <div className="mt-6 border-t border-[var(--line)] pt-6">
      <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">Technikprofil</p>
      <h3 className="mt-2 text-xl font-semibold">Deine Ausprägungen je Technikbereich</h3>
      <p className="muted mt-2 max-w-3xl leading-7">
        Abgeleitet aus deinen Angaben im Kontext. Beim ReTest siehst du, welche Bereiche sich verändert haben.
      </p>
      <div className="mt-5 grid items-center gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <TechniqueSpiderChart axes={axes} />
        <ul className="grid gap-2">
          {axes.map((axis) => (
            <li
              key={axis.group}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] px-4 py-3"
            >
              <span className="text-sm font-medium">{axis.group}</span>
              <span className="muted text-sm">{axis.statement}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="muted mt-5 max-w-3xl text-sm leading-6">
        {focusAxes.length > 0
          ? `Aktuell größter Hebel: ${focusAxes.map((axis) => axis.group).join(", ")}.`
          : strongAxes.length > 0
            ? "Keine offenen Baustellen gemeldet. Halte die Qualität unter Tempo stabil."
            : "Noch keine Kontextangaben. Beim nächsten Test lohnt sich die Selbsteinschätzung."}
      </p>
    </div>
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

function BiggestLeverCard({
  result,
  focusAxis,
}: {
  result: StandardAnalysisResult;
  focusAxis: TechniqueProfileAxis | null;
}) {
  const topIssue = result.issues[0];
  const title = focusAxis
    ? `${focusAxis.group}: ${focusAxis.statement}`
    : (topIssue?.title ?? getPublicTrainingFocus(result.plan.slug, result.plan.name));

  return (
    <section className="surface border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] p-6">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Dein größter Hebel</p>
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{title}</h2>
      <p className="muted mt-3 max-w-3xl leading-7">
        {topIssue?.cause ?? "Mehr Umfang bringt wenig, solange Zuglänge und Frequenz unter Tempo auseinanderlaufen."}
      </p>
      <p className="mt-5 max-w-3xl border-l-2 border-[var(--accent)] pl-4 text-lg leading-8">
        {topIssue?.cue ?? "Halte Zuglänge und Frequenz unter Tempo stabil, statt nur härter zu schwimmen."}
      </p>
      <p className="muted mt-5 max-w-3xl text-sm leading-6">
        Realistisch erreichbar bis zum ReTest: {result.potential.paceGain}.
      </p>
    </section>
  );
}

function SwimZonesCard({ result }: { result: StandardAnalysisResult }) {
  const zones = buildSwimZones(result.cssPace);
  if (zones.length === 0) return null;

  return (
    <section className="surface p-5">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">Trainingszonen</p>
      <h2 className="mt-2 text-2xl font-semibold">Deine Pace-Bereiche pro 100 m</h2>
      <p className="muted mt-2 max-w-3xl leading-7">
        Abgeleitet aus deiner CSS von {formatPace(result.cssPace)} /100 m. Damit steuerst du jede Einheit im Becken,
        ohne Laborwerte zu brauchen.
      </p>
      <div className="mt-5">
        <SwimZoneScale zones={zones} cssPace={result.cssPace} />
      </div>
    </section>
  );
}

function PlanRecommendationCard({
  input,
  result,
  focusAxis,
}: {
  input: AnalysisInput;
  result: StandardAnalysisResult;
  focusAxis: TechniqueProfileAxis | null;
}) {
  const sessionsPerWeek = input.swimSessionsPerWeek ?? result.plan.swimSessionsPerWeek ?? 3;
  const reason = focusAxis
    ? `Weil deine Schwelle bereits trägt, der Bereich ${focusAxis.group} sie aber ausbremst, setzt dieser Plan genau dort an und übersetzt deine Zonen in konkrete Einheiten.`
    : `Dieser Plan übersetzt deine Zonen in konkrete Einheiten und hält den Fokus auf ${getPublicTrainingFocus(result.plan.slug, result.plan.name).toLowerCase()}.`;

  return (
    <section className="surface border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] p-6">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Empfohlener Trainingsplan</p>
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{result.plan.name}</h2>
      <p className="muted mt-3 max-w-3xl leading-7">{reason}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniFact label="Phase" value={result.plan.phase} />
        <MiniFact label="Umfang" value={`${result.plan.weeks} Wochen · ${sessionsPerWeek}x/Woche`} />
        <MiniFact label="ReTest" value={`nach ${result.plan.weeks} Wochen`} />
      </div>
      <p className="muted mt-4 max-w-3xl text-sm leading-6">
        {result.plan.retestHint ?? "Gleicher Pool, gleiche Testfolge, gleiche Pausen. Nur so ist der Vergleich belastbar."}
      </p>

      <div className="mt-6 flex flex-col gap-4 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">Preis</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">
            {TRAINING_PLAN_PRICE}<span className="ml-1 text-base text-[var(--subtle)]">EUR</span>
          </p>
          <p className="muted mt-1 text-sm">Einmalig für {result.plan.weeks} Wochen inklusive ReTest</p>
        </div>
        <div className="no-print flex flex-wrap items-center gap-3">
          <ButtonLink href="/#preise" variant="primary">
            Trainingsplan freischalten
          </ButtonLink>
          <ButtonLink href="/analyse/new" variant="ghost">
            <RefreshCcw size={16} />
            ReTest starten
          </ButtonLink>
        </div>
      </div>
    </section>
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
            <DetailItem label="200 m Zeit" value={input.t200 || "nicht erfasst"} />
            <DetailItem label="400 m Zeit" value={input.t400 || "nicht erfasst"} />
            <DetailItem label="Züge 50 m" value={input.s50 ? String(input.s50) : "nicht erfasst"} />
            <DetailItem label="Züge 200 m" value={input.s200 ? String(input.s200) : "nicht erfasst"} />
            <DetailItem label="Züge 400 m" value={input.s400 ? String(input.s400) : "nicht erfasst"} />
            <DetailItem label="KFA" value={input.bodyFatPercentage ? `${input.bodyFatPercentage} %` : "nicht erfasst"} />
            <DetailItem label="Körperbautyp" value={input.bodyType ? getBodyTypeLabel(input.bodyType) : "nicht erfasst"} />
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
  if (!raw) return null;

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
