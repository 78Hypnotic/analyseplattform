import type { AnalysisInput, AnalysisResult, TargetDistance, TestMetrics } from "./types";

const DEFAULT_TARGET_DISTANCE: TargetDistance = "Becken";
const DEFAULT_SWIM_SESSIONS_PER_WEEK = 3;

export function parseTime(input: string | number | undefined | null): number {
  if (input === undefined || input === null || input === "") return Number.NaN;
  if (typeof input === "number") return input;

  const value = input.trim().replace(",", ".");
  if (value.includes(":")) {
    const parts = value.split(":");
    if (parts.length !== 2) return Number.NaN;
    const minutes = Number.parseInt(parts[0] ?? "", 10);
    const seconds = Number.parseFloat(parts[1] ?? "");
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return Number.NaN;
    return minutes * 60 + seconds;
  }

  return Number.parseFloat(value);
}

export function formatPace(seconds: number): string {
  if (!Number.isFinite(seconds)) return "-";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds - minutes * 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function computeTest(
  distance: 200 | 400,
  timeSec: number,
  strokesPerLength: number,
  poolLength: 25 | 50,
): TestMetrics | null {
  if (
    !Number.isFinite(timeSec) ||
    !Number.isFinite(strokesPerLength) ||
    timeSec <= 0 ||
    strokesPerLength <= 0
  ) {
    return null;
  }

  const pace = (timeSec / distance) * 100;
  const dps = poolLength / strokesPerLength;
  const lengths = distance / poolLength;
  const timePerLength = timeSec / lengths;
  const sr = (strokesPerLength / timePerLength) * 60;

  return { distance, time: timeSec, strokesPerLength, pace, dps, sr, timePerLength };
}

export function computeCSS(t200: number, t400: number): number {
  if (!Number.isFinite(t200) || !Number.isFinite(t400) || t400 <= t200) {
    return Number.NaN;
  }

  return 200 / (t400 - t200);
}

export function cssPace(cssMs: number): number {
  if (!Number.isFinite(cssMs) || cssMs <= 0) return Number.NaN;
  return 100 / cssMs;
}

/**
 * Converts the athlete context and swim test values into a compact coaching report.
 * The function stays deterministic so stored reports, previews and unit tests remain comparable.
 */
export function runAnalysis(input: AnalysisInput): AnalysisResult | null {
  const t200 = parseTime(input.t200);
  const t400 = parseTime(input.t400);
  const t50 = parseTime(input.t50);
  const test200 = computeTest(200, t200, input.s200, input.poolLength);
  const test400 = computeTest(400, t400, input.s400, input.poolLength);

  if (!test200 || !test400) return null;

  const comparison = {
    paceDiff: test400.pace - test200.pace,
    dpsDiff: test400.dps - test200.dps,
    srDiff: test400.sr - test200.sr,
  };
  const cssMs = computeCSS(t200, t400);
  const thresholdPace = cssPace(cssMs);
  if (!Number.isFinite(cssMs) || !Number.isFinite(thresholdPace)) return null;

  const vla = vlaProxy(test200.pace, test400.pace);
  const sprintReserveValue = sprintReserve(t50, cssMs);
  const vo2 = vo2Proxy(test200.pace, thresholdPace);
  const challenges = input.challenges ?? [];
  const legSink = challenges.includes("Meine Beine sinken ab");
  const weakCatch = challenges.includes("Ich habe Probleme mit dem frühen Wasserfassen");

  const strengths: AnalysisResult["strengths"] = [];
  if (comparison.dpsDiff > -0.05 && comparison.dpsDiff < 0.05) {
    strengths.push({
      title: "Stabile Zuglänge unter Belastung",
      description: `Deine DPS fällt zwischen 200 m und 400 m nur um ${comparison.dpsDiff.toFixed(2)} m.`,
    });
  }
  if (test200.dps > 1.8) {
    strengths.push({
      title: "Gute Gleiteigenschaft",
      description: `Mit ${test200.dps.toFixed(2)} m pro Zug holst du viel Strecke aus jedem Armzug.`,
    });
  }
  if (Number.isFinite(sprintReserveValue) && sprintReserveValue > 0.18) {
    strengths.push({
      title: "Ausgeprägte Sprint-Reserve",
      description: "Du kannst deutlich über CSS beschleunigen.",
    });
  }
  if (strengths.length < 2) {
    strengths.push({
      title: "Konstanter Rhythmus",
      description: `Deine Frequenz bleibt zwischen 200 m und 400 m stabil (${comparison.srDiff.toFixed(1)} spm).`,
    });
  }
  if (strengths.length < 3) {
    strengths.push({
      title: "Solide Ausdauerbasis",
      description: `Eine 400 m Pace von ${formatPace(test400.pace)} /100 m ist ein belastbares Fundament.`,
    });
  }

  const issues: AnalysisResult["issues"] = [];
  if (legSink || weakCatch) {
    issues.push({
      tag: "Hauptproblem",
      title: legSink ? "Wasserlage: die Hüfte liegt zu tief" : "Zugphase: dein Catch kommt zu spät",
      cause: legSink
        ? "Wenn die Beine absinken, steigt der Widerstand. Jeder Zug muss diesen Bremseffekt kompensieren."
        : "Der Arm rutscht zu lange im Wasser, bevor Druck entsteht. Dadurch geht Vortrieb verloren.",
      cue: legSink
        ? "Kopf in Verlängerung der Wirbelsäule, Blick nach unten."
        : "Ellenbogen oben halten, früh Druck aufs Wasser geben.",
      drill: legSink
        ? "3 x 50 m Superman-Glide mit 6er-Beinschlag"
        : "4 x 50 m Catch-up mit Fingertip-Dragging",
      note: "Priorität auf den größten Hebel, bevor du Intensität erhöhst.",
    });
  }
  if (comparison.dpsDiff < -0.1 && issues.length < 2) {
    issues.push({
      tag: "Nebenbaustelle",
      title: "DPS-Verlust unter Belastung",
      cause: `Deine Zuglänge fällt um ${Math.abs(comparison.dpsDiff).toFixed(2)} m, wenn die Strecke länger wird.`,
      cue: "Lang bleiben, Zug nicht abkürzen.",
      drill: "5 x 100 m mit Zugzahl-Ziel: maximal +1 Zug gegenüber 200 m Test.",
    });
  }
  if (issues.length === 0) {
    issues.push({
      tag: "Hauptproblem",
      title: "Technikverlust unter Belastung",
      cause: `Frequenz und Zuglänge verschieben sich unter Last (${comparison.srDiff.toFixed(1)} spm, ${comparison.dpsDiff.toFixed(2)} m).`,
      cue: "Lang bleiben, nicht hektisch werden.",
      drill: "8 x 50 m progressiv mit fester Zugzahl-Vorgabe.",
    });
  }

  const targetDistance = input.targetDistance ?? inferTargetDistance(input.goal);
  const swimSessionsPerWeek = input.swimSessionsPerWeek ?? DEFAULT_SWIM_SESSIONS_PER_WEEK;
  const style = pickStyle(input, test200);
  const styleProfile = explainStyle(style);
  const basePlan = pickPlan(input, vla.level, vo2.level, legSink);
  const derivedWeeks = derivePlanLength(basePlan.weeks, swimSessionsPerWeek, input.raceDate);
  const plan = {
    ...basePlan,
    baseWeeks: basePlan.weeks,
    weeks: derivedWeeks,
    timeframeLabel: buildTimeframeLabel(input.raceDate, derivedWeeks),
    retestHint: buildRetestHint(input.raceDate, derivedWeeks),
    targetDistance,
    swimSessionsPerWeek,
  };

  return {
    test200,
    test400,
    comparison,
    cssMs,
    cssPace: thresholdPace,
    vla,
    vo2,
    sprintReserve: Number.isFinite(sprintReserveValue) ? sprintReserveValue : null,
    strengths: strengths.slice(0, 3),
    issues: issues.slice(0, 2),
    potential: {
      paceGain: Math.abs(comparison.paceDiff) > 5 ? "4-8 sek/100m über 400 m" : "2-5 sek/100m über 400 m",
      description:
        "Mehr Effizienz bei gleichem Aufwand, geringere Ermüdung im zweiten Streckenteil und stabilere Technik unter Stress.",
    },
    style,
    styleProfile,
    plan,
  };
}

export function derivePlanLength(
  baseWeeks: number,
  swimSessionsPerWeek = DEFAULT_SWIM_SESSIONS_PER_WEEK,
  raceDate?: string,
  now = new Date(),
): number {
  const safeBaseWeeks = clamp(Math.round(baseWeeks), 1, 16);
  const safeSessions = clamp(Math.round(swimSessionsPerWeek), 1, 7);
  let adjustedWeeks = safeBaseWeeks;

  if (safeSessions <= 2) {
    adjustedWeeks = Math.min(8, safeBaseWeeks + 2);
  } else if (safeSessions >= 4) {
    adjustedWeeks = Math.max(4, safeBaseWeeks - 1);
  }

  const raceWeeks = getWeeksUntilRace(raceDate, now);
  if (raceWeeks !== null) {
    adjustedWeeks = Math.min(adjustedWeeks, raceWeeks);
  }

  return clamp(Math.round(adjustedWeeks), 2, 8);
}

function vlaProxy(p200: number, p400: number): AnalysisResult["vla"] {
  const drop = (p400 - p200) / p200;
  if (drop < 0.03) return { level: "niedrig", score: 0.25, drop };
  if (drop < 0.06) return { level: "mittel", score: 0.55, drop };
  return { level: "hoch", score: 0.85, drop };
}

function sprintReserve(p50: number, cssMs: number): number {
  if (!Number.isFinite(p50) || !Number.isFinite(cssMs)) return Number.NaN;
  return 50 / p50 / cssMs - 1;
}

function vo2Proxy(p200: number, thresholdPace: number): AnalysisResult["vo2"] {
  const ratio = p200 / thresholdPace;
  if (ratio > 1.04) return { level: "hoch", score: 0.8 };
  if (ratio > 1) return { level: "mittel", score: 0.55 };
  return { level: "niedrig", score: 0.35 };
}

function pickStyle(input: AnalysisInput, test200: TestMetrics): string {
  if (input.level === "Einsteiger") return "Der Mühelose";
  if (input.level === "Ambitioniert" && test200.sr > 48) return "Die Windmühle";
  if (input.level === "Leistungsschwimmer") return "Der Galopper";
  return "Der Gleiter";
}

export function explainStyle(style: string): NonNullable<AnalysisResult["styleProfile"]> {
  if (style.includes("Windmühle")) {
    return {
      name: "Die Windmühle",
      description: "Hohe Frequenz, viel Einsatz, aber oft zu wenig Länge pro Zug.",
      trainingFocus: "Frequenz beruhigen, Catch früher setzen und DPS unter Belastung stabilisieren.",
    };
  }

  if (style.includes("Galopper")) {
    return {
      name: "Der Galopper",
      description: "Leistungsorientierter Stil mit klarer Druckphase und hoher Belastungstoleranz.",
      trainingFocus: "Pace kontrollieren, Atmung stabil halten und Ermüdung im zweiten Teil reduzieren.",
    };
  }

  if (style.includes("Gleiter")) {
    return {
      name: "Der Gleiter",
      description: "Langer Zug und ruhige Wasserlage, aber manchmal zu wenig Frequenzwechsel.",
      trainingFocus: "Länge behalten und gezielt mehr Rhythmus für Wettkampftempo aufbauen.",
    };
  }

  return {
    name: "Der Mühelose",
    description: "Ruhiger Ansatz mit Technikpotenzial, bei dem Effizienz vor Intensität steht.",
    trainingFocus: "Wasserlage, Atmung und saubere Wiederholungen festigen, bevor das Tempo steigt.",
  };
}

function pickPlan(
  input: AnalysisInput,
  vlaLevel: AnalysisResult["vla"]["level"],
  vo2Level: AnalysisResult["vo2"]["level"],
  legSink: boolean,
): AnalysisResult["plan"] {
  if (legSink || input.level === "Einsteiger") {
    return { slug: "wasserlage-balance", name: "Wasserlage & Balance", phase: "Technik-Fundament", weeks: 6 };
  }
  if (vo2Level === "niedrig") return { slug: "vo2max-builder", name: "VO2max-Builder", phase: "Basephase", weeks: 8 };
  if (vlaLevel === "hoch") return { slug: "vlamax-senker", name: "VLamax Senker", phase: "Buildphase", weeks: 6 };
  return { slug: "tempohaerte", name: "Tempohärte", phase: "Peakphase", weeks: 6 };
}

function inferTargetDistance(goal: AnalysisInput["goal"]): TargetDistance {
  if (goal === "Freiwasserschwimmen") return "Freiwasser";
  if (goal === "Triathlon") return "OD";
  if (goal === "Beckenschwimmen") return "Becken";
  return DEFAULT_TARGET_DISTANCE;
}

function buildTimeframeLabel(raceDate: string | undefined, weeks: number): string {
  if (!raceDate) return `${weeks} Wochen Aufbau`;
  if (weeks <= 3) return "Kurzfristig bis zum Wettkampf";
  if (weeks <= 6) return "Wettkampfnaher Aufbau";
  return "Aufbau bis zum Wettkampf";
}

function buildRetestHint(raceDate: string | undefined, weeks: number): string {
  if (!raceDate) return `ReTest nach ${weeks} Wochen einplanen.`;
  if (weeks <= 3) return "ReTest als kurzer Technik-Check vor dem Wettkampf.";
  return `ReTest nach ${weeks} Wochen oder spätestens 10-14 Tage vor dem Wettkampf.`;
}

function getWeeksUntilRace(raceDate: string | undefined, now: Date): number | null {
  if (!raceDate) return null;
  const timestamp = Date.parse(`${raceDate}T12:00:00`);
  if (!Number.isFinite(timestamp)) return null;
  const diffMs = timestamp - now.getTime();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil(diffMs / weekMs));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
