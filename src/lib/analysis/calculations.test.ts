import { describe, expect, it } from "vitest";
import { DEFAULT_ANALYSIS_INPUT } from "./constants";
import { analysisInputSchema } from "./schema";
import { computeCSS, computeTest, derivePlanLength, parseTime, runAnalysis } from "./calculations";
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

  it("rejects CSS when 400m is not slower than 200m", () => {
    expect(Number.isNaN(computeCSS(220, 200))).toBe(true);
  });

  it("returns a stable report for valid data", () => {
    const result = runAnalysis(DEFAULT_ANALYSIS_INPUT);
    expect(result).not.toBeNull();
    expect(result?.plan.name).toBe("Wasserlage & Balance");
    expect(result?.plan.slug).toBe("wasserlage-balance");
    expect(result?.plan.weeks).toBe(6);
    expect(result?.strengths.length).toBeGreaterThanOrEqual(2);
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
