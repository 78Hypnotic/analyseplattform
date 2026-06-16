import { describe, expect, it } from "vitest";
import { DEFAULT_RUN_INPUT } from "./constants";
import {
  buildProfileMatrix,
  buildTrainingZones,
  computeAci,
  computeApi,
  computeCriticalSpeed,
  computeEnduranceRatio,
  computeV12,
  computeV3,
  computeVo2Proxy,
  paceSecPerKm,
  runRunningAnalysis,
} from "./calculations";
import { getRunValidationResult } from "./validation";
import type { RunInput } from "./types";

describe("running diagnostics calculations", () => {
  it("computes test speeds from distances", () => {
    expect(computeV3(850)).toBeCloseTo(4.7222, 3);
    expect(computeV12(3000)).toBeCloseTo(4.1667, 3);
  });

  it("computes Critical Speed from the two distances", () => {
    expect(computeCriticalSpeed(850, 3000)).toBeCloseTo(3.9815, 3);
  });

  it("rejects Critical Speed when the 12-minute distance is not larger", () => {
    expect(Number.isNaN(computeCriticalSpeed(3000, 850))).toBe(true);
    expect(Number.isNaN(computeCriticalSpeed(1000, 1000))).toBe(true);
  });

  it("converts speed to pace per kilometre", () => {
    expect(paceSecPerKm(3.9815)).toBeCloseTo(251.16, 1);
  });

  it("computes the endurance ratio", () => {
    expect(computeEnduranceRatio(4.1667, 4.7222)).toBeCloseTo(0.8824, 3);
  });

  it("matches the briefing API example (ratio 0.875 -> 4.5)", () => {
    expect(computeApi(0.875)).toBe(4.5);
  });

  it("clamps API to the 1-10 range", () => {
    expect(computeApi(0.6)).toBe(1);
    expect(computeApi(1.1)).toBe(10);
  });

  it("matches the briefing VO2-Proxy example (CS 4.0, v3 4.8 -> 4.52)", () => {
    expect(computeVo2Proxy(4.0, 4.8)).toBeCloseTo(4.52, 2);
  });

  it("matches the briefing ACI example (VO2-Proxy 4.52 -> 7.2)", () => {
    expect(computeAci(4.52)).toBe(7.2);
  });

  it("clamps ACI to the 1-10 range", () => {
    expect(computeAci(2.5)).toBe(1);
    expect(computeAci(5.5)).toBe(10);
  });

  it("builds the 2x2 profile matrix from the high threshold", () => {
    expect(buildProfileMatrix(5.0, 7.0)).toMatchObject({ aciLevel: "hoch", apiLevel: "niedrig" });
    expect(buildProfileMatrix(8.0, 8.0)).toMatchObject({ aciLevel: "hoch", apiLevel: "hoch" });
    expect(buildProfileMatrix(7.0, 4.0)).toMatchObject({ aciLevel: "niedrig", apiLevel: "hoch" });
    expect(buildProfileMatrix(3.0, 3.0)).toMatchObject({ aciLevel: "niedrig", apiLevel: "niedrig" });
  });

  it("derives CS-relative training zones with faster paces at higher percentages", () => {
    const zones = buildTrainingZones(4);
    expect(zones).toHaveLength(6);
    const threshold = zones.find((zone) => zone.zone === 4);
    // 91-100% of 4 m/s -> pace between 1000/4 (250s) and 1000/3.64 (~274.7s)
    expect(threshold?.fasterPaceSecPerKm).toBeCloseTo(250, 0);
    expect(threshold?.slowerPaceSecPerKm).toBeGreaterThan(threshold?.fasterPaceSecPerKm ?? 0);
  });

  it("produces the full diagnostic for the worked example (850 / 3000)", () => {
    const result = runRunningAnalysis({ ...DEFAULT_RUN_INPUT, distance3min: 850, distance12min: 3000 });
    expect(result).not.toBeNull();
    expect(result?.cs).toBeCloseTo(3.9815, 3);
    expect(result?.api.score).toBe(5.0);
    expect(result?.aci.score).toBe(7.0);
    expect(result?.profileMatrix).toMatchObject({ aciLevel: "hoch", apiLevel: "niedrig" });
    expect(result?.plausibility.messages).toHaveLength(0);
  });

  it("flags an implausibly low ratio (12-minute test too short)", () => {
    const result = runRunningAnalysis({ ...DEFAULT_RUN_INPUT, distance3min: 900, distance12min: 2900 });
    expect(result?.plausibility.ratioLow).toBe(true);
  });

  it("flags an implausibly high ratio (3-minute test not maximal)", () => {
    const result = runRunningAnalysis({ ...DEFAULT_RUN_INPUT, distance3min: 800, distance12min: 3150 });
    expect(result?.plausibility.ratioHigh).toBe(true);
  });

  it("returns null when the model is invalid", () => {
    expect(runRunningAnalysis({ ...DEFAULT_RUN_INPUT, distance3min: 3000, distance12min: 850 })).toBeNull();
  });

  it("surfaces a validation error when 12-minute distance is not larger", () => {
    const input: RunInput = { ...DEFAULT_RUN_INPUT, distance3min: 1000, distance12min: 900 };
    const result = getRunValidationResult(input);
    expect(result.fieldErrors.distance12min).toBeTruthy();
  });
});
