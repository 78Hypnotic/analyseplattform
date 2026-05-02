import { describe, expect, it } from "vitest";
import { DEFAULT_ANALYSIS_INPUT } from "./constants";
import { analysisInputSchema } from "./schema";
import {
  buildSprintReservePlausibility,
  classifySprintReserve,
  classifyTechniqueClass,
  computeCSS,
  computeCssPace,
  computeSprintTest,
  computeTest,
  derivePlanLength,
  getReferenceAgeBucket,
  parseTime,
  runAnalysis,
} from "./calculations";
import { getAnalysisValidationMessages } from "./validation";
import type { AnalysisInput } from "./types";

describe("swim analysis calculations", () => {
  it("parses seconds and minute formats", () => {
    expect(parseTime("38.2")).toBe(38.2);
    expect(parseTime("3:38")).toBe(218);
    expect(parseTime("3:38,5")).toBe(218.5);
  });

  it("computes pace, DPS and stroke rate for 25m pools", () => {
    const test = computeTest(200, 218, 21, 25);
    expect(test?.pace).toBeCloseTo(109);
    expect(test?.dps).toBeCloseTo(1.1904);
    expect(test?.sr).toBeCloseTo(46.2385);
  });

  it("computes pace, DPS and stroke rate for 50m pools", () => {
    const test = computeTest(400, 468, 42, 50);
    expect(test?.pace).toBeCloseTo(117);
    expect(test?.dps).toBeCloseTo(1.1904);
    expect(test?.sr).toBeCloseTo(43.0769);
  });

  it("computes optional sprint stroke metrics for 50m tests", () => {
    const test = computeSprintTest(38.2, 22, 25);

    expect(test?.pace).toBeCloseTo(76.4);
    expect(test?.strokesPerLength).toBe(22);
    expect(test?.dps).toBeCloseTo(1.1364);
    expect(test?.sr).toBeCloseTo(69.1099);
  });

  it("keeps sprint stroke metrics optional for legacy inputs", () => {
    const test = computeSprintTest(38.2, undefined, 25);

    expect(test?.pace).toBeCloseTo(76.4);
    expect(test?.strokesPerLength).toBeUndefined();
    expect(test?.dps).toBeUndefined();
    expect(test?.sr).toBeUndefined();
  });

  it("rejects CSS when 400m is not slower than 200m", () => {
    expect(Number.isNaN(computeCSS(220, 200))).toBe(true);
  });

  it("returns a stable report for valid data", () => {
    const result = runAnalysis(DEFAULT_ANALYSIS_INPUT);
    expect(result).not.toBeNull();
    expect(result?.mode).toBe("standard");
    if (result?.mode !== "standard") throw new Error("Expected standard analysis result");
    expect(result?.techniqueGate.status).toBe("gelb");
    expect(result?.plan.name).toBe("Wasserlage & Balance");
    expect(result?.plan.slug).toBe("wasserlage-balance");
    expect(result?.plan.weeks).toBe(6);
    expect(result?.vla.profile).toBe("Allrounder");
    expect(result?.vla.performanceBand).toBe("schwaecher");
    expect(result?.vo2.level).toBe("niedrig");
    expect(result?.sprintReserveCategory).toBe("hoch");
    expect(result?.sprintReservePlausibility?.status).toBe("tendenziell_sprinterlastig");
    expect(result?.metabolicProfile?.priority).toBe("Hebel A: VO2 erhöhen.");
    expect(Object.values(result?.spiderScores ?? {}).every((score) => score >= 0 && score <= 100)).toBe(true);
    expect(result?.techniqueGate.techniqueClass).toBe("Solider Hobbyschwimmer");
    expect(result?.strengths.length).toBeGreaterThanOrEqual(2);
  });

  it("uses the document CSS pace formula", () => {
    expect(computeCssPace(218, 468)).toBe(125);
  });

  it("classifies sprint reserve from the briefing thresholds", () => {
    expect(classifySprintReserve(0.09)).toBe("niedrig");
    expect(classifySprintReserve(0.1)).toBe("mittel");
    expect(classifySprintReserve(0.2)).toBe("mittel");
    expect(classifySprintReserve(0.21)).toBe("hoch");
    expect(classifySprintReserve(Number.NaN)).toBe("nicht_ermittelbar");
  });

  it("cross-checks VLa profiles with sprint reserve neutrally", () => {
    expect(buildSprintReservePlausibility("Sprinter", "hoch").status).toBe("plausibel");
    expect(buildSprintReservePlausibility("Diesel", "niedrig").status).toBe("plausibel");
    expect(buildSprintReservePlausibility("Sprinter", "niedrig").status).toBe("auffaellig");
    expect(buildSprintReservePlausibility("Diesel", "hoch").status).toBe("interessant_stark");
    expect(buildSprintReservePlausibility("Allrounder", "mittel").status).toBe("plausibel");
  });

  it("uses performance-dependent VLa thresholds", () => {
    const analysisForPaces = (pace200: number, pace400: number) =>
      runAnalysis({
        ...DEFAULT_ANALYSIS_INPUT,
        gender: "divers",
        t200: String(pace200 * 2),
        t400: String(pace400 * 4),
        s200: 21,
        s400: 22,
      });

    const strong = analysisForPaces(100 / 1.09, 100);
    const medium = analysisForPaces(110 / 1.09, 110);
    const weaker = analysisForPaces(120 / 1.09, 120);

    expect(strong?.mode).toBe("standard");
    expect(medium?.mode).toBe("standard");
    expect(weaker?.mode).toBe("standard");
    if (strong?.mode !== "standard" || medium?.mode !== "standard" || weaker?.mode !== "standard") {
      throw new Error("Expected standard analysis results");
    }

    expect(strong.vla.performanceBand).toBe("stark");
    expect(strong.vla.profile).toBe("Sprinter");
    expect(medium.vla.performanceBand).toBe("mittel");
    expect(medium.vla.profile).toBe("Allrounder");
    expect(weaker.vla.performanceBand).toBe("schwaecher");
    expect(weaker.vla.profile).toBe("Allrounder");
  });

  it("creates spider scores for the six briefing axes", () => {
    const result = runAnalysis(DEFAULT_ANALYSIS_INPUT);

    expect(result?.mode).toBe("standard");
    if (result?.mode !== "standard") throw new Error("Expected standard analysis result");
    const scores = result.spiderScores;
    if (!scores) throw new Error("Expected spider scores");
    expect(Object.keys(scores).sort()).toEqual([
      "css",
      "dps",
      "dpsStability",
      "sr",
      "srAdaptation",
      "tempoEfficiency",
    ]);
    expect(scores.dps).toBeGreaterThanOrEqual(0);
    expect(scores.sr).toBeGreaterThanOrEqual(0);
    expect(scores.dpsStability).toBeGreaterThanOrEqual(0);
    expect(scores.srAdaptation).toBeGreaterThanOrEqual(0);
    expect(scores.tempoEfficiency).toBeGreaterThanOrEqual(0);
  });

  it("classifies 400m technique bands from the diagnostics thresholds", () => {
    expect(classifyTechniqueClass(false, null)).toBe("Technik-Einsteiger");
    expect(classifyTechniqueClass(true, 131)).toBe("Technik-Einsteiger");
    expect(classifyTechniqueClass(true, 121)).toBe("Technik in Aufbau");
    expect(classifyTechniqueClass(true, 111)).toBe("Solider Hobbyschwimmer");
    expect(classifyTechniqueClass(true, 101)).toBe("Ambitionierter Hobbyschwimmer");
    expect(classifyTechniqueClass(true, 91)).toBe("Starker Agegrouper");
    expect(classifyTechniqueClass(true, 90)).toBe("Leistungsschwimmer");
    expect(classifyTechniqueClass(true, Number.NaN)).toBeNull();
  });

  it("creates a technique-only report when 400m is not possible", () => {
    const result = runAnalysis({
      ...DEFAULT_ANALYSIS_INPUT,
      canSwim400m: false,
      t400: "",
      s400: undefined,
    });

    expect(result?.mode).toBe("technique_only");
    expect(result?.techniqueGate.reason).toBe("cannot_swim_400m");
    expect(result?.techniqueGate.techniqueClass).toBe("Technik-Einsteiger");
    expect(result?.plan.slug).toBe("wasserlage-balance");
  });

  it("blocks standard diagnostics when equipment is used", () => {
    const result = runAnalysis({
      ...DEFAULT_ANALYSIS_INPUT,
      equipment: "pullbuoy",
    });

    expect(result?.mode).toBe("technique_only");
    expect(result?.techniqueGate.reason).toBe("equipment_used");
    expect(result?.plan.slug).toBe("wasserlage-balance");
  });

  it("maps reference ages to 5-year buckets", () => {
    expect(getReferenceAgeBucket(18)).toBe(20);
    expect(getReferenceAgeBucket(34)).toBe(35);
    expect(getReferenceAgeBucket(73)).toBe(70);
  });

  it("derives plan length from sessions and race date", () => {
    const now = new Date("2026-04-26T12:00:00");

    expect(derivePlanLength(6, 2)).toBe(8);
    expect(derivePlanLength(6, 3)).toBe(6);
    expect(derivePlanLength(6, 5)).toBe(5);
    expect(derivePlanLength(8, 2, "2026-05-10", now)).toBe(2);
  });

  it("keeps legacy inputs without race context renderable", () => {
    const legacyInput: AnalysisInput = {
      ...DEFAULT_ANALYSIS_INPUT,
      targetDistance: undefined,
      raceDate: undefined,
      swimSessionsPerWeek: undefined,
    };

    const result = runAnalysis(legacyInput);

    expect(result).not.toBeNull();
    expect(result?.plan.targetDistance).toBe("OD");
    expect(result?.plan.swimSessionsPerWeek).toBe(3);
  });

  it("validates race context and rejects impossible values", () => {
    const inputWithoutFitnessLevel: Partial<AnalysisInput> = { ...DEFAULT_ANALYSIS_INPUT };
    delete inputWithoutFitnessLevel.fitnessLevel;

    expect(analysisInputSchema.safeParse(DEFAULT_ANALYSIS_INPUT).success).toBe(true);
    expect(analysisInputSchema.safeParse(inputWithoutFitnessLevel).success).toBe(true);
    expect(
      analysisInputSchema.safeParse({
        ...DEFAULT_ANALYSIS_INPUT,
        bodyFatPercentage: "",
        fitnessLevel: "",
      }).success,
    ).toBe(true);
    expect(
      analysisInputSchema.safeParse({
        ...DEFAULT_ANALYSIS_INPUT,
        fitnessLevel: 5,
      }).success,
    ).toBe(true);
    expect(
      analysisInputSchema.safeParse({
        ...DEFAULT_ANALYSIS_INPUT,
        t50: "",
      }).success,
    ).toBe(false);
    expect(
      analysisInputSchema.safeParse({
        ...DEFAULT_ANALYSIS_INPUT,
        canSwim400m: false,
        t400: "",
        s400: "",
      }).success,
    ).toBe(true);
    expect(
      analysisInputSchema.safeParse({
        ...DEFAULT_ANALYSIS_INPUT,
        swimSessionsPerWeek: -1,
      }).success,
    ).toBe(false);
    expect(
      analysisInputSchema.safeParse({
        ...DEFAULT_ANALYSIS_INPUT,
        targetDistance: undefined,
      }).success,
    ).toBe(false);
    expect(
      analysisInputSchema.safeParse({
        ...DEFAULT_ANALYSIS_INPUT,
        raceDate: "2026-99-99",
      }).success,
    ).toBe(false);
    expect(
      analysisInputSchema.safeParse({
        ...DEFAULT_ANALYSIS_INPUT,
        bodyFatPercentage: 99,
      }).success,
    ).toBe(false);
    expect(
      analysisInputSchema.safeParse({
        ...DEFAULT_ANALYSIS_INPUT,
        fitnessLevel: 6,
      }).success,
    ).toBe(false);
  });

  it("returns actionable validation messages for missing context fields", () => {
    const messages = getAnalysisValidationMessages({
      ...DEFAULT_ANALYSIS_INPUT,
      swimSessionsPerWeek: "",
    });

    expect(messages[0]).toContain("Schwimmeinheiten pro Woche");
  });

  it("returns actionable validation messages for impossible test timing", () => {
    const messages = getAnalysisValidationMessages({
      ...DEFAULT_ANALYSIS_INPUT,
      t200: "3:20",
      t400: "3:10",
    });

    expect(messages).toContain("400 m Zeit: muss langsamer sein als die 200 m Zeit.");
  });
});
