import type { AnalysisInput, AnalysisResult, TestMetrics } from "./types";

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
  const weakCatch = challenges.includes("Ich habe Probleme mit dem fruehen Wasserfassen");

  const strengths: AnalysisResult["strengths"] = [];
  if (comparison.dpsDiff > -0.05 && comparison.dpsDiff < 0.05) {
    strengths.push({
      title: "Stabile Zuglaenge unter Belastung",
      description: `Deine DPS faellt zwischen 200 m und 400 m nur um ${comparison.dpsDiff.toFixed(2)} m.`,
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
      title: "Ausgepraegte Sprint-Reserve",
      description: "Du kannst deutlich ueber CSS beschleunigen.",
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
      title: legSink ? "Wasserlage: die Huefte liegt zu tief" : "Zugphase: dein Catch kommt zu spaet",
      cause: legSink
        ? "Wenn die Beine absinken, steigt der Widerstand. Jeder Zug muss diesen Bremseffekt kompensieren."
        : "Der Arm rutscht zu lange im Wasser, bevor Druck entsteht. Dadurch geht Vortrieb verloren.",
      cue: legSink
        ? "Kopf in Verlaengerung der Wirbelsaeule, Blick nach unten."
        : "Ellenbogen oben halten, frueh Druck aufs Wasser geben.",
      drill: legSink
        ? "3 x 50 m Superman-Glide mit 6er-Beinschlag"
        : "4 x 50 m Catch-up mit Fingertip-Dragging",
      note: "Prioritaet auf den groessten Hebel, bevor du Intensitaet erhoehst.",
    });
  }
  if (comparison.dpsDiff < -0.1 && issues.length < 2) {
    issues.push({
      tag: "Nebenbaustelle",
      title: "DPS-Verlust unter Belastung",
      cause: `Deine Zuglaenge faellt um ${Math.abs(comparison.dpsDiff).toFixed(2)} m, wenn die Strecke laenger wird.`,
      cue: "Lang bleiben, Zug nicht abkuerzen.",
      drill: "5 x 100 m mit Zugzahl-Ziel: maximal +1 Zug gegenueber 200 m Test.",
    });
  }
  if (issues.length === 0) {
    issues.push({
      tag: "Hauptproblem",
      title: "Technikverlust unter Belastung",
      cause: `Frequenz und Zuglaenge verschieben sich unter Last (${comparison.srDiff.toFixed(1)} spm, ${comparison.dpsDiff.toFixed(2)} m).`,
      cue: "Lang bleiben, nicht hektisch werden.",
      drill: "8 x 50 m progressiv mit fester Zugzahl-Vorgabe.",
    });
  }

  const style = pickStyle(input, test200);
  const plan = pickPlan(input, vla.level, vo2.level, legSink);

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
      paceGain: Math.abs(comparison.paceDiff) > 5 ? "4-8 sek/100m ueber 400 m" : "2-5 sek/100m ueber 400 m",
      description:
        "Mehr Effizienz bei gleichem Aufwand, geringere Ermuedung im zweiten Streckenteil und stabilere Technik unter Stress.",
    },
    style,
    plan,
  };
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
  if (input.level === "Einsteiger") return "Der Muehelose";
  if (input.level === "Ambitioniert" && test200.sr > 48) return "Die Windmuehle";
  if (input.level === "Leistungsschwimmer") return "Der Galopper";
  return "Der Gleiter";
}

function pickPlan(
  input: AnalysisInput,
  vlaLevel: AnalysisResult["vla"]["level"],
  vo2Level: AnalysisResult["vo2"]["level"],
  legSink: boolean,
): AnalysisResult["plan"] {
  if (legSink || input.level === "Einsteiger") {
    return { name: "Wasserlage & Balance", phase: "Technik-Fundament", weeks: 6 };
  }
  if (vo2Level === "niedrig") return { name: "VO2max-Builder", phase: "Basephase", weeks: 8 };
  if (vlaLevel === "hoch") return { name: "VLamax Senker", phase: "Buildphase", weeks: 6 };
  return { name: "Tempohaerte", phase: "Peakphase", weeks: 6 };
}
