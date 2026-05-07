import { SWIM_REFERENCE_AGES, SWIM_REFERENCES } from "./constants";
import type {
  AnalysisInput,
  AnalysisResult,
  CssExpectation,
  CssPerformanceLevel,
  Gender,
  ProxyLevel,
  ReferenceComparison,
  ReferenceIndex,
  SprintMetrics,
  SprintReserveCategory,
  StandardAnalysisResult,
  TargetDistance,
  TechniqueClass,
  TechniqueGateResult,
  TechniqueOnlyAnalysisResult,
  TestMetrics,
  VLaPerformanceBand,
  VLaProfile,
  Vo2ProxyLevel,
} from "./types";

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

export function formatPace(seconds: number | null | undefined): string {
  if (!Number.isFinite(seconds)) return "-";
  const safeSeconds = seconds as number;
  const minutes = Math.floor(safeSeconds / 60);
  const rest = Math.round(safeSeconds - minutes * 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function computePace(distance: 50 | 200 | 400, timeSec: number): number {
  if (!Number.isFinite(timeSec) || timeSec <= 0) return Number.NaN;
  return (timeSec / distance) * 100;
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

  const pace = computePace(distance, timeSec);
  const dps = poolLength / strokesPerLength;
  const lengths = distance / poolLength;
  const timePerLength = timeSec / lengths;
  const sr = (strokesPerLength / timePerLength) * 60;

  return { distance, time: timeSec, strokesPerLength, pace, dps, sr, timePerLength };
}

export function computeSprintTest(
  timeSec: number,
  strokesPerLength: number | undefined,
  poolLength: 25 | 50,
): SprintMetrics | null {
  if (!Number.isFinite(timeSec) || timeSec <= 0) return null;

  const base = { distance: 50 as const, time: timeSec, pace: computePace(50, timeSec) };
  if (!Number.isFinite(strokesPerLength) || strokesPerLength === undefined || strokesPerLength <= 0) {
    return base;
  }

  const lengths = 50 / poolLength;
  const timePerLength = timeSec / lengths;
  const dps = poolLength / strokesPerLength;
  const sr = (strokesPerLength / timePerLength) * 60;

  return { ...base, strokesPerLength, dps, sr, timePerLength };
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

export function computeCssPace(t200: number, t400: number): number {
  if (!Number.isFinite(t200) || !Number.isFinite(t400) || t400 <= t200) {
    return Number.NaN;
  }

  return (t400 - t200) / 2;
}

export function isTechniqueOnlyResult(result: AnalysisResult): result is TechniqueOnlyAnalysisResult {
  return result.mode === "technique_only";
}

/**
 * Converts the athlete context and swim test values into a compact coaching report.
 * The function stays deterministic so stored reports, previews and unit tests remain comparable.
 */
export function runAnalysis(input: AnalysisInput): AnalysisResult | null {
  const t50 = parseTime(input.t50);
  const t200 = parseTime(input.t200);
  const t400 = parseTime(input.t400);
  const test50 = computeSprintTest(t50, input.s50, input.poolLength);
  const test200 = computeTest(200, t200, input.s200, input.poolLength);
  const test400 =
    input.canSwim400m && input.s400 !== undefined
      ? computeTest(400, t400, input.s400, input.poolLength)
      : null;

  if (!test50 || !test200) return null;
  if (input.canSwim400m && !test400) return null;

  const techniqueGate = evaluateTechniqueGate(input, test400);
  const targetDistance = input.targetDistance ?? inferTargetDistance(input.goal);
  const swimSessionsPerWeek = input.swimSessionsPerWeek ?? DEFAULT_SWIM_SESSIONS_PER_WEEK;
  const style = pickStyle(input, test200);
  const styleProfile = explainStyle(style);

  if (techniqueGate.status === "rot") {
    return buildTechniqueOnlyResult({
      input,
      test50,
      test200,
      test400: test400 ?? undefined,
      techniqueGate,
      targetDistance,
      swimSessionsPerWeek,
      style,
      styleProfile,
    });
  }

  if (!test400 || test400.pace <= test200.pace) return null;

  const comparison = {
    paceDiff: test400.pace - test200.pace,
    dpsDiff: test400.dps - test200.dps,
    srDiff: test400.sr - test200.sr,
  };
  const cssMs = computeCSS(t200, t400);
  const thresholdPace = computeCssPace(t200, t400);
  if (!Number.isFinite(cssMs) || !Number.isFinite(thresholdPace)) return null;

  const reference = buildReferenceComparison(input, t50, t200, t400, thresholdPace);
  const vla = vlaProxy(test200.pace, test400.pace, reference.t400, test400.pace);
  const sprintReserveValue = sprintReserve(t50, cssMs);
  const sprintReserveCategory = classifySprintReserve(sprintReserveValue);
  const sprintReservePlausibility = buildSprintReservePlausibility(vla.profile, sprintReserveCategory);
  const vo2 = vo2Proxy(t200, reference.t200);
  const metabolicBasis = classifyMetabolicCssExpectation(vo2.level, vla, reference.css);
  const metabolicProfile = buildMetabolicProfile(input, vo2.level, vla, metabolicBasis);
  const spiderScores = buildSpiderScores(resultReferenceCss(reference.css), test200, test400);
  const challenges = input.challenges ?? [];
  const legSink = challenges.includes("Meine Beine sinken ab");
  const weakCatch = challenges.includes("Ich habe Probleme mit dem frühen Wasserfassen");
  const strengths = buildStandardStrengths(comparison, test200, test400, sprintReserveValue);
  const issues = buildStandardIssues(comparison, legSink, weakCatch);
  const basePlan = pickPlan(input, techniqueGate, vla, vo2, legSink);
  const derivedWeeks = derivePlanLength(basePlan.weeks, swimSessionsPerWeek, input.raceDate);

  return {
    mode: "standard",
    techniqueGate,
    test50,
    test200,
    test400,
    comparison,
    cssMs,
    cssPace: thresholdPace,
    vla,
    vo2,
    sprintReserve: Number.isFinite(sprintReserveValue) ? sprintReserveValue : null,
    sprintReserveCategory,
    sprintReservePlausibility,
    metabolicProfile,
    spiderScores,
    cssExpectation: metabolicBasis.cssExpectation,
    reference,
    strengths: strengths.slice(0, 3),
    issues: issues.slice(0, 2),
    potential: {
      paceGain: Math.abs(comparison.paceDiff) > 5 ? "4-8 sek/100m über 400 m" : "2-5 sek/100m über 400 m",
      description:
        "Mehr Effizienz bei gleichem Aufwand, geringere Ermüdung im zweiten Streckenteil und stabilere Technik unter Stress.",
    },
    style,
    styleProfile,
    plan: {
      ...basePlan,
      baseWeeks: basePlan.weeks,
      weeks: derivedWeeks,
      timeframeLabel: buildTimeframeLabel(input.raceDate, derivedWeeks),
      retestHint: buildRetestHint(input.raceDate, derivedWeeks),
      targetDistance,
      swimSessionsPerWeek,
    },
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

export function getReferenceAgeBucket(age: number): number {
  const rounded = Math.round(age / 5) * 5;
  return clamp(rounded, SWIM_REFERENCE_AGES[0], SWIM_REFERENCE_AGES[SWIM_REFERENCE_AGES.length - 1]);
}

export function classifyReferenceIndex(index: number | null): ReferenceIndex["label"] {
  if (index === null || !Number.isFinite(index)) return "Keine Referenz verfügbar";
  if (index <= 0) return "Alters-Elite oder besser";
  if (index <= 0.08) return "Sehr nah an der Alters-Elite";
  if (index <= 0.2) return "Gutes Altersniveau";
  if (index <= 0.4) return "Solides Hobbyniveau";
  return "Großes Entwicklungspotenzial";
}

export function classifyTechniqueClass(
  canSwim400m: boolean,
  pace400: number | null | undefined,
): TechniqueClass | null {
  if (!canSwim400m) return "Technik-Einsteiger";
  const pace = typeof pace400 === "number" ? pace400 : Number.NaN;
  if (!Number.isFinite(pace)) return null;
  if (pace > 130) return "Technik-Einsteiger";
  if (pace > 120) return "Technik in Aufbau";
  if (pace > 110) return "Solider Hobbyschwimmer";
  if (pace > 100) return "Ambitionierter Hobbyschwimmer";
  if (pace > 90) return "Starker Agegrouper";
  return "Leistungsschwimmer";
}

function evaluateTechniqueGate(input: AnalysisInput, test400: TestMetrics | null): TechniqueGateResult {
  const techniqueClass = classifyTechniqueClass(input.canSwim400m, test400?.pace ?? null);

  if (!input.canSwim400m) {
    return {
      status: "rot",
      reason: "cannot_swim_400m",
      techniqueClass,
      title: "Technik-Gate Rot",
      message:
        "Technik limitiert die Schwimmleistung aktuell so stark, dass eine physiologische Auswertung nicht belastbar ist.",
    };
  }

  if (input.equipment !== "ohne") {
    return {
      status: "rot",
      reason: "equipment_used",
      techniqueClass,
      title: "Test nicht vergleichbar",
      message: "Hilfsmittel verfälschen den Test. Für die Standarddiagnostik bitte ohne Pullbuoy, Neo oder Paddles testen.",
    };
  }

  if (!test400 || test400.pace > 120) {
    return {
      status: "rot",
      reason: "pace_over_2_00",
      techniqueClass: techniqueClass ?? "Technik-Einsteiger",
      title: "Technik-Gate Rot",
      message:
        "Technik limitiert die Schwimmleistung aktuell so stark, dass eine physiologische Auswertung nicht belastbar ist.",
    };
  }

  if (test400.pace > 110) {
    return {
      status: "gelb",
      reason: "pace_between_1_50_and_2_00",
      techniqueClass,
      title: "Technik-Gate Gelb",
      message: "Technik beeinflusst das Ergebnis. Die physiologische Auswertung ist nur eingeschränkt zu interpretieren.",
    };
  }

  return {
    status: "gruen",
    reason: "technique_stable",
    techniqueClass,
    title: "Technik-Gate Grün",
    message: "Technik ausreichend stabil. Die physiologische Auswertung ist möglich.",
  };
}

function buildTechniqueOnlyResult({
  input,
  test50,
  test200,
  test400,
  techniqueGate,
  targetDistance,
  swimSessionsPerWeek,
  style,
  styleProfile,
}: {
  input: AnalysisInput;
  test50: SprintMetrics;
  test200: TestMetrics;
  test400?: TestMetrics;
  techniqueGate: TechniqueGateResult;
  targetDistance: TargetDistance;
  swimSessionsPerWeek: number;
  style: string;
  styleProfile: NonNullable<AnalysisResult["styleProfile"]>;
}): TechniqueOnlyAnalysisResult {
  const basePlan = pickBeginnerTechniquePlan();
  const derivedWeeks = derivePlanLength(basePlan.weeks, swimSessionsPerWeek, input.raceDate);

  return {
    mode: "technique_only",
    techniqueGate,
    test50,
    test200,
    test400,
    sprintReserve: null,
    strengths: [
      {
        title: "Testbasis angelegt",
        description: `50 m und 200 m sind erfasst. Damit kann der Technikblock sauber gesteuert werden.`,
      },
      {
        title: "Klarer nächster Schritt",
        description:
          techniqueGate.reason === "cannot_swim_400m"
            ? "Das erste Ziel ist 400 m am Stück mit ruhiger Wasserlage."
            : "Der nächste Test sollte ohne Hilfsmittel und mit stabiler 400-m-Pace erfolgen.",
      },
    ],
    issues: [
      buildTechniqueOnlyIssue(techniqueGate),
    ],
    potential: {
      paceGain: techniqueGate.reason === "cannot_swim_400m" ? "400 m am Stück erreichen" : "Standardtest belastbar machen",
      description:
        "Der größte Hebel liegt zuerst in Wasserlage, Atmung und kontrollierbaren Wiederholungen. Danach werden CSS, VO2-Proxy und VLa-Proxy belastbarer.",
    },
    style,
    styleProfile,
    plan: {
      ...basePlan,
      baseWeeks: basePlan.weeks,
      weeks: derivedWeeks,
      timeframeLabel: buildTimeframeLabel(input.raceDate, derivedWeeks),
      retestHint: buildRetestHint(input.raceDate, derivedWeeks),
      targetDistance,
      swimSessionsPerWeek,
    },
  };
}

function buildTechniqueOnlyIssue(techniqueGate: TechniqueGateResult): AnalysisResult["issues"][number] {
  if (techniqueGate.reason === "cannot_swim_400m") {
    return {
      tag: "Technik-Gate",
      title: "400 m am Stück sind noch nicht stabil",
      cause: "Ohne stabile 400 m ist eine metabolische Ableitung aus 200/400 m nicht belastbar.",
      cue: "Ruhig ausatmen, Kopf tief halten, Länge vor Tempo.",
      drill: "6 x 50 m locker mit 20 s Pause, danach 4 x 25 m Technikfokus.",
      note: "Der empfohlene Anfängerplan baut zuerst die durchgängige 400-m-Fähigkeit auf.",
    };
  }

  if (techniqueGate.reason === "equipment_used") {
    return {
      tag: "Testprotokoll",
      title: "Hilfsmittel verfälschen den Standardtest",
      cause: "Pullbuoy, Neo oder Paddles verändern Wasserlage und Vortrieb. Die Werte sind nicht mit Referenzen vergleichbar.",
      cue: "Test ohne Hilfsmittel wiederholen.",
      drill: "4 x 100 m locker ohne Hilfsmittel, Fokus auf gleiche Zugzahl pro Bahn.",
      note: "Der Plan bleibt technikorientiert, bis ein Standardtest vorliegt.",
    };
  }

  return {
    tag: "Technik-Gate",
    title: "400 m Pace liegt über 2:00 min/100 m",
    cause: "Die technische Limitierung überlagert aktuell VO2-, VLa- und CSS-Ableitungen.",
    cue: "Tempo reduzieren, Wasserlage stabilisieren, nicht gegen den Widerstand arbeiten.",
    drill: "8 x 50 m Technik mit vollständiger Kontrolle, jede Wiederholung gleichmäßig schwimmen.",
    note: "Nach einem Technikblock sollte der 400-m-Test wiederholt werden.",
  };
}

function buildStandardStrengths(
  comparison: StandardAnalysisResult["comparison"],
  test200: TestMetrics,
  test400: TestMetrics,
  sprintReserveValue: number,
): StandardAnalysisResult["strengths"] {
  const strengths: StandardAnalysisResult["strengths"] = [];

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

  return strengths;
}

function buildStandardIssues(
  comparison: StandardAnalysisResult["comparison"],
  legSink: boolean,
  weakCatch: boolean,
): StandardAnalysisResult["issues"] {
  const issues: StandardAnalysisResult["issues"] = [];

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

  return issues;
}

export function classifySprintReserve(value: number): SprintReserveCategory {
  if (!Number.isFinite(value)) return "nicht_ermittelbar";
  if (value < 0.1) return "niedrig";
  if (value <= 0.2) return "mittel";
  return "hoch";
}

export function buildSprintReservePlausibility(
  vlaProfile: VLaProfile,
  sprintCategory: SprintReserveCategory,
): NonNullable<StandardAnalysisResult["sprintReservePlausibility"]> {
  if (sprintCategory === "nicht_ermittelbar") {
    return {
      status: "neutral",
      label: "Reserve nicht ermittelbar",
      text: "Ohne belastbare Sprintreserve bleibt der Cross-Check zum VLa-Profil offen.",
    };
  }

  if (vlaProfile === "Sprinter" && sprintCategory === "hoch") {
    return {
      status: "plausibel",
      label: "Sprinterprofil plausibel",
      text: "Die hohe Sprintreserve stützt den VLa-Proxy.",
    };
  }
  if (vlaProfile === "Diesel" && sprintCategory === "niedrig") {
    return {
      status: "plausibel",
      label: "Dieselprofil plausibel",
      text: "Die geringe Sprintreserve passt zum stabilen Diesel-Muster.",
    };
  }
  if (vlaProfile === "Sprinter" && sprintCategory === "niedrig") {
    return {
      status: "auffaellig",
      label: "Auffälliger Cross-Check",
      text: "Der 200-zu-400-Abfall wird nicht durch Top-End-Speed bestätigt. Technik, Pacing oder aerobe Stabilität prüfen.",
    };
  }
  if (vlaProfile === "Diesel" && sprintCategory === "hoch") {
    return {
      status: "interessant_stark",
      label: "Starkes Allround-Muster",
      text: "Hohe Speed-Reserve bei stabiler 400-m-Leistung. Das kann auf gute Ökonomie oder starke Gesamtleistung hinweisen.",
    };
  }
  if (vlaProfile === "Allrounder" && sprintCategory === "hoch") {
    return {
      status: "tendenziell_sprinterlastig",
      label: "Tendenziell sprinterlastig",
      text: "Die Sprintreserve ist höher als der Drop allein vermuten lässt.",
    };
  }
  if (vlaProfile === "Allrounder" && sprintCategory === "niedrig") {
    return {
      status: "tendenziell_diesellastig",
      label: "Tendenziell diesellastig",
      text: "Die Sprintreserve ist niedriger als der mittlere Drop erwarten lässt.",
    };
  }

  return {
    status: "plausibel",
    label: "Ausgeglichenes Profil",
    text: "VLa-Proxy und Sprintreserve ergeben zusammen ein unauffälliges Muster.",
  };
}

function vlaProxy(
  pace200: number,
  pace400: number,
  reference400: ReferenceIndex | null,
  pace400ForBand: number,
): StandardAnalysisResult["vla"] {
  const drop = (pace400 - pace200) / pace200;
  const performanceBand = classifyVlaPerformanceBand(reference400, pace400ForBand);
  const thresholds = getVlaThresholds(performanceBand);

  if (drop < thresholds.dieselMax) {
    return { level: "niedrig", profile: "Diesel", score: 0.25, drop, performanceBand, thresholds };
  }
  if (drop <= thresholds.sprinterMin) {
    return { level: "mittel", profile: "Allrounder", score: 0.55, drop, performanceBand, thresholds };
  }
  return { level: "hoch", profile: "Sprinter", score: 0.85, drop, performanceBand, thresholds };
}

function sprintReserve(t50: number, cssMs: number): number {
  if (!Number.isFinite(t50) || !Number.isFinite(cssMs)) return Number.NaN;
  const pace50 = computePace(50, t50);
  const thresholdPace = cssPace(cssMs);
  if (!Number.isFinite(pace50) || !Number.isFinite(thresholdPace) || thresholdPace <= 0) return Number.NaN;
  return (thresholdPace - pace50) / thresholdPace;
}

function classifyVlaPerformanceBand(reference400: ReferenceIndex | null, pace400: number): VLaPerformanceBand {
  if (reference400) {
    if (reference400.index <= 0.1) return "stark";
    if (reference400.index <= 0.3) return "mittel";
    return "schwaecher";
  }
  if (pace400 <= 100) return "stark";
  if (pace400 <= 115) return "mittel";
  return "schwaecher";
}

function getVlaThresholds(performanceBand: VLaPerformanceBand) {
  if (performanceBand === "stark") return { dieselMax: 0.04, sprinterMin: 0.08 };
  if (performanceBand === "mittel") return { dieselMax: 0.05, sprinterMin: 0.1 };
  return { dieselMax: 0.06, sprinterMin: 0.12 };
}

type MetabolicCssBasis = {
  cssExpectation: CssExpectation;
  matrixProfile: string;
  expectedCss: CssPerformanceLevel;
  actualCss: CssPerformanceLevel;
};

function classifyMetabolicCssExpectation(
  vo2Level: Vo2ProxyLevel,
  vla: StandardAnalysisResult["vla"],
  referenceCss: ReferenceIndex | null,
): MetabolicCssBasis {
  const matrix = expectedCssFromMetabolicMatrix(vo2Level, vla.level);
  const actualCss = classifyActualCssPerformance(referenceCss);

  if (actualCss === "nicht_ermittelbar" || matrix.expectedCss === "nicht_ermittelbar") {
    return {
      ...matrix,
      actualCss,
      cssExpectation: "nicht_ermittelbar",
    };
  }

  const actualRank = cssPerformanceRank(actualCss);
  const expectedRank = cssPerformanceRank(matrix.expectedCss);
  const cssExpectation =
    actualRank < expectedRank ? "unter_erwartung" : actualRank > expectedRank ? "ueber_erwartung" : "passt";

  return {
    ...matrix,
    actualCss,
    cssExpectation,
  };
}

function expectedCssFromMetabolicMatrix(
  vo2Level: Vo2ProxyLevel,
  vlaLevel: ProxyLevel,
): Pick<MetabolicCssBasis, "matrixProfile" | "expectedCss"> {
  if (vo2Level === "nicht_ermittelbar") {
    return { matrixProfile: "Metabolisches Profil offen", expectedCss: "nicht_ermittelbar" };
  }

  if (vo2Level === "niedrig" && vlaLevel === "niedrig") {
    return { matrixProfile: "Diesel mit geringer Leistungsbasis", expectedCss: "niedrig" };
  }
  if (vo2Level === "niedrig" && vlaLevel === "mittel") {
    return { matrixProfile: "Allrounder mit geringer Leistungsbasis", expectedCss: "niedrig" };
  }
  if (vo2Level === "niedrig" && vlaLevel === "hoch") {
    return { matrixProfile: "Sprinter ohne Ausdauerbasis", expectedCss: "minimal" };
  }
  if (vo2Level === "mittel" && vlaLevel === "niedrig") {
    return { matrixProfile: "Diesel mit solider Grundlage", expectedCss: "hoch" };
  }
  if (vo2Level === "mittel" && vlaLevel === "mittel") {
    return { matrixProfile: "Allrounder", expectedCss: "mittel" };
  }
  if (vo2Level === "mittel" && vlaLevel === "hoch") {
    return { matrixProfile: "Sprinter mit solider Grundlage", expectedCss: "niedrig" };
  }
  if (vo2Level === "hoch" && vlaLevel === "niedrig") {
    return { matrixProfile: "Diesel auf hohem Niveau", expectedCss: "sehr_hoch" };
  }
  if (vo2Level === "hoch" && vlaLevel === "mittel") {
    return { matrixProfile: "Allrounder auf hohem Niveau", expectedCss: "hoch" };
  }

  return { matrixProfile: "Sprinter auf hohem Niveau", expectedCss: "hoch" };
}

function classifyActualCssPerformance(referenceCss: ReferenceIndex | null): CssPerformanceLevel {
  if (!referenceCss) return "nicht_ermittelbar";
  if (referenceCss.index <= 0) return "sehr_hoch";
  if (referenceCss.index <= 0.1) return "hoch";
  if (referenceCss.index <= 0.25) return "mittel";
  if (referenceCss.index <= 0.5) return "niedrig";
  return "minimal";
}

function cssPerformanceRank(level: CssPerformanceLevel) {
  if (level === "minimal") return 0;
  if (level === "niedrig") return 1;
  if (level === "mittel") return 2;
  if (level === "hoch") return 3;
  if (level === "sehr_hoch") return 4;
  return -1;
}

function buildMetabolicProfile(
  input: AnalysisInput,
  vo2Level: Vo2ProxyLevel,
  vla: StandardAnalysisResult["vla"],
  basis: MetabolicCssBasis,
): NonNullable<StandardAnalysisResult["metabolicProfile"]> {
  const cssExpectation = basis.cssExpectation;
  const enduranceGoal = isEnduranceTarget(input.targetDistance ?? inferTargetDistance(input.goal));
  const vo2Potential =
    vo2Level === "niedrig"
      ? "VO2 niedrig: großer Hebel für aerobe Kapazität."
      : vo2Level === "mittel"
        ? "VO2 mittel: relevanter Hebel, abhängig von Ziel und Zeitraum."
        : vo2Level === "hoch"
          ? "VO2 hoch: kleinerer Hebel, Fokus eher auf Effizienz, VLa oder spezifisches Tempo."
          : "VO2 nicht ermittelbar: Referenzdaten fehlen für diese Eingabe.";
  const vlaContext = enduranceGoal
    ? vla.level === "hoch"
      ? "Ausdauerziel: hohe VLa kann die Dauerleistung begrenzen. Dummy-Text bis zur finalen Textlogik."
      : "Ausdauerziel: niedrige bis mittlere VLa passt eher zu stabiler Leistung. Dummy-Text bis zur finalen Textlogik."
    : vla.level === "hoch"
      ? "Sprint-/Beckenziel: hohe VLa kann für Beschleunigung hilfreich sein. Dummy-Text bis zur finalen Textlogik."
      : "Sprint-/Beckenziel: niedrige VLa kann Top-End-Speed limitieren. Dummy-Text bis zur finalen Textlogik.";
  const cssInterpretation =
    cssExpectation === "unter_erwartung"
      ? "CSS liegt unter der metabolischen Erwartung: Technik, Effizienz oder Umsetzung prüfen."
      : cssExpectation === "ueber_erwartung"
        ? "CSS liegt über der Erwartung: spricht für gute Technik oder starke Umsetzung."
        : cssExpectation === "passt"
          ? "CSS passt zum metabolischen Profil: spezifisches Training und Feinschliff priorisieren."
          : "CSS-Erwartung nicht ermittelbar, weil AK-/Sex-Referenz fehlt.";
  const priority =
    vo2Level === "niedrig"
      ? "Hebel A: VO2 erhöhen."
      : enduranceGoal && vla.level === "hoch"
        ? "Hebel B: VLa senken."
        : cssExpectation === "unter_erwartung"
          ? "Hebel C: Technik und Umsetzung verbessern."
          : "Hebel C: CSS spezifisch trainieren.";

  return {
    label: `VO2 ${levelLabelForProfile(vo2Level)} · VLa ${vla.profile} · CSS ${cssExpectationLabel(cssExpectation)}`,
    matrixProfile: basis.matrixProfile,
    expectedCss: basis.expectedCss,
    actualCss: basis.actualCss,
    vo2Potential,
    vlaContext,
    cssInterpretation,
    priority,
  };
}

function buildSpiderScores(
  cssReferenceIndex: number | null,
  test200: TestMetrics,
  test400: TestMetrics,
): NonNullable<StandardAnalysisResult["spiderScores"]> {
  const dpsDrop = (test200.dps - test400.dps) / test200.dps;
  const srChange = (test200.sr - test400.sr) / test400.sr;
  const paceGain = (test400.pace - test200.pace) / test400.pace;

  return {
    css: scoreCssReference(cssReferenceIndex),
    dps: scoreLinear(test200.dps, 1.2, 2, 0, 100, 50, 1.5),
    sr: scoreLinear(test200.sr, 45, 85, 0, 100, 50, 60),
    dpsStability: scoreDpsStability(dpsDrop),
    srAdaptation: scoreSrAdaptation(srChange),
    tempoEfficiency: scoreTempoEfficiency(paceGain, dpsDrop, srChange),
  };
}

function resultReferenceCss(referenceCss: ReferenceIndex | null) {
  return referenceCss?.index ?? null;
}

function scoreCssReference(index: number | null) {
  if (index === null || !Number.isFinite(index)) return 50;
  if (index <= 0) return 100;
  if (index <= 0.1) return interpolate(index, 0, 0.1, 100, 75);
  if (index <= 0.25) return interpolate(index, 0.1, 0.25, 75, 50);
  if (index <= 0.5) return interpolate(index, 0.25, 0.5, 50, 25);
  if (index <= 0.7) return interpolate(index, 0.5, 0.7, 25, 0);
  return 0;
}

function scoreDpsStability(drop: number) {
  if (!Number.isFinite(drop)) return 50;
  if (drop <= 0.05) return 100;
  if (drop <= 0.1) return interpolate(drop, 0.05, 0.1, 100, 75);
  if (drop <= 0.2) return interpolate(drop, 0.1, 0.2, 75, 50);
  if (drop <= 0.3) return interpolate(drop, 0.2, 0.3, 50, 25);
  return 0;
}

function scoreSrAdaptation(change: number) {
  if (!Number.isFinite(change)) return 50;
  const absChange = Math.abs(change);
  if (absChange >= 0.05 && absChange <= 0.15) return 100;
  if (absChange > 0.15 && absChange <= 0.25) return 75;
  if (absChange < 0.05 || absChange <= 0.35) return 50;
  if (absChange <= 0.5) return 25;
  return 0;
}

function scoreTempoEfficiency(paceGain: number, dpsDrop: number, srChange: number) {
  if (![paceGain, dpsDrop, srChange].every(Number.isFinite)) return 50;
  const raw = 50 + paceGain * 220 - Math.max(0, dpsDrop) * 130 - Math.max(0, Math.abs(srChange) - 0.15) * 90;
  return clamp(Math.round(raw), 0, 100);
}

function scoreLinear(value: number, min: number, max: number, minScore: number, maxScore: number, midScore: number, mid: number) {
  if (!Number.isFinite(value)) return 50;
  if (value <= min) return minScore;
  if (value >= max) return maxScore;
  if (value <= mid) return interpolate(value, min, mid, minScore, midScore);
  return interpolate(value, mid, max, midScore, maxScore);
}

function interpolate(value: number, inputMin: number, inputMax: number, outputMin: number, outputMax: number) {
  const ratio = (value - inputMin) / (inputMax - inputMin);
  return Math.round(outputMin + ratio * (outputMax - outputMin));
}

function isEnduranceTarget(targetDistance: TargetDistance) {
  return targetDistance === "OD" || targetDistance === "MD" || targetDistance === "LD" || targetDistance === "Freiwasser";
}

function levelLabelForProfile(level: Vo2ProxyLevel) {
  return level === "nicht_ermittelbar" ? "offen" : level;
}

function cssExpectationLabel(expectation: CssExpectation) {
  if (expectation === "unter_erwartung") return "unter Erwartung";
  if (expectation === "ueber_erwartung") return "über Erwartung";
  if (expectation === "passt") return "passend";
  return "offen";
}

function vo2Proxy(time200: number, reference200: ReferenceIndex | null): StandardAnalysisResult["vo2"] {
  if (!reference200) return { level: "nicht_ermittelbar", score: 0, deviation: null };

  const deviation = (time200 - reference200.reference) / reference200.reference;
  if (deviation <= 0.08) return { level: "hoch", score: 0.8, deviation };
  if (deviation <= 0.2) return { level: "mittel", score: 0.55, deviation };
  return { level: "niedrig", score: 0.35, deviation };
}

function buildReferenceComparison(
  input: AnalysisInput,
  time50: number,
  time200: number,
  time400: number,
  ownCssPace: number,
): ReferenceComparison {
  const sex = referenceSex(input.gender);
  if (!sex) {
    return {
      ageBucket: null,
      sex: null,
      t50: null,
      t200: null,
      t400: null,
      css: null,
    };
  }

  const ageBucket = getReferenceAgeBucket(input.age);
  const ref50 = getReferenceTime(sex, 50, ageBucket);
  const ref200 = getReferenceTime(sex, 200, ageBucket);
  const ref400 = getReferenceTime(sex, 400, ageBucket);
  const refCss = ref200 !== null && ref400 !== null ? (ref400 - ref200) / 2 : null;

  return {
    ageBucket,
    sex,
    t50: buildReferenceIndex(time50, ref50),
    t200: buildReferenceIndex(time200, ref200),
    t400: buildReferenceIndex(time400, ref400),
    css: buildReferenceIndex(ownCssPace, refCss),
  };
}

function buildReferenceIndex(value: number, reference: number | null): ReferenceIndex | null {
  if (reference === null) return null;
  const index = (value - reference) / reference;
  return {
    reference,
    value,
    index,
    label: classifyReferenceIndex(index),
  };
}

function getReferenceTime(sex: Exclude<Gender, "divers">, distance: 50 | 200 | 400, ageBucket: number) {
  const ageIndex = SWIM_REFERENCE_AGES.indexOf(ageBucket as (typeof SWIM_REFERENCE_AGES)[number]);
  if (ageIndex < 0) return null;
  return SWIM_REFERENCES[sex][distance][ageIndex] ?? null;
}

function referenceSex(gender: Gender): Exclude<Gender, "divers"> | null {
  return gender === "divers" ? null : gender;
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
  techniqueGate: TechniqueGateResult,
  vla: StandardAnalysisResult["vla"],
  vo2: StandardAnalysisResult["vo2"],
  legSink: boolean,
): StandardAnalysisResult["plan"] {
  if (techniqueGate.status === "rot" || legSink || input.level === "Einsteiger") {
    return pickBeginnerTechniquePlan();
  }
  if (vo2.level === "niedrig") return { slug: "vo2max-builder", name: "VO2max-Builder", phase: "Basephase", weeks: 8 };
  if (vla.profile === "Sprinter" || vla.level === "hoch") return { slug: "vlamax-senker", name: "VLamax Senker", phase: "Buildphase", weeks: 6 };
  return { slug: "tempohaerte", name: "Tempohärte", phase: "Peakphase", weeks: 6 };
}

function pickBeginnerTechniquePlan(): StandardAnalysisResult["plan"] {
  return { slug: "wasserlage-balance", name: "Wasserlage & Balance", phase: "Technik-Fundament", weeks: 6 };
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
