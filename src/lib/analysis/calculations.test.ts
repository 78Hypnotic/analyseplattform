import { describe, expect, it } from "vitest";
import { DEFAULT_ANALYSIS_INPUT } from "./constants";
import { computeCSS, computeTest, parseTime, runAnalysis } from "./calculations";

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
    expect(result?.strengths.length).toBeGreaterThanOrEqual(2);
  });
});
