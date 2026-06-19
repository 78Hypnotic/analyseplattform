import { describe, expect, it } from "vitest";
import { DEFAULT_BIKE_INPUT, PROFILE_FACTOR_TABLE } from "./constants";
import {
  buildFatCurve,
  buildTrainingZones,
  computeFatMax,
  computeFtp,
  computeGlycolytic,
  computePvo2,
  computeVlamaxProxy,
  computeVo2,
  estimateFueling,
  interpolateTable,
  kFactorFor,
  profileFactorFor,
  runBikeAnalysis,
} from "./calculations";
import { getBikeValidationResult } from "./validation";

describe("bike diagnostics calculations", () => {
  it("uses the 1-minute power directly as PPO and derives VO2max", () => {
    const pvo2 = computePvo2(438);
    expect(pvo2).toBeCloseTo(383.25, 2);
    const vo2 = computeVo2(pvo2, 75);
    expect(vo2.abs).toBeCloseTo(4599, 0);
    expect(vo2.rel).toBeCloseTo(61.32, 1);
  });

  it("computes glycolytic work from the sprint", () => {
    const glyco = computeGlycolytic(900, 700);
    expect(glyco.w20).toBe(14000);
    expect(glyco.walakt).toBe(3600);
    expect(glyco.wgly).toBe(10400);
    expect(glyco.pgly).toBe(650);
  });

  it("computes the VLamax proxy chain (efficiency 0.225)", () => {
    const chain = computeVlamaxProxy(10400, 75);
    expect(chain.emetKj).toBeCloseTo(46.2222, 3);
    expect(chain.o2eq).toBeCloseTo(2.2116, 3);
    expect(chain.o2eqRel).toBeCloseTo(29.488, 2);
    expect(chain.laeq).toBeCloseTo(9.829, 2);
    expect(chain.vlamaxProxy).toBeCloseTo(0.6143, 3);
  });

  it("interpolates and clamps the lookup tables", () => {
    expect(interpolateTable(PROFILE_FACTOR_TABLE, 0.6)).toBeCloseTo(0.77, 5);
    expect(interpolateTable(PROFILE_FACTOR_TABLE, 0.2)).toBe(0.83);
    expect(interpolateTable(PROFILE_FACTOR_TABLE, 0.95)).toBe(0.71);
    expect(profileFactorFor(0.6143)).toBeCloseTo(0.7671, 3);
    expect(kFactorFor(0.6143)).toBeCloseTo(0.01454, 4);
  });

  it("computes FTP from PVO2 and the profile factor", () => {
    expect(computeFtp(382.8125, 0.7671)).toBeCloseTo(293.69, 1);
  });

  it("locates FatMax below threshold", () => {
    const fatMax = computeFatMax(293.69, 0.01454);
    expect(fatMax.watt).toBeGreaterThan(170);
    expect(fatMax.watt).toBeLessThan(220);
    expect(fatMax.pctFtp).toBeGreaterThan(0.5);
    expect(fatMax.pctFtp).toBeLessThan(0.8);
  });

  it("builds seven Coggan training zones", () => {
    const zones = buildTrainingZones(294);
    expect(zones).toHaveLength(7);
    expect(zones[3]).toMatchObject({ short: "Z4", minWatt: Math.round(294 * 0.91), maxWatt: Math.round(294 * 1.05) });
    expect(zones[6].maxWatt).toBeNull();
  });

  it("produces the full diagnostic for the worked example", () => {
    const result = runBikeAnalysis({ ...DEFAULT_BIKE_INPUT, sprintPeakWatt: 900, sprintAvg20sWatt: 700, oneMinPowerWatt: 438, weight: 75 });
    expect(result).not.toBeNull();
    expect(result?.ppo).toBe(438);
    expect(result?.vo2rel).toBeCloseTo(61.32, 1);
    expect(result?.vlamaxProxy).toBeCloseTo(0.6143, 3);
    expect(result?.ftpWatt).toBeCloseTo(294, 0);
    expect(result?.ftpPerKg).toBeCloseTo(3.92, 1);
    expect(result?.fatMaxWatt).toBeGreaterThan(170);
    expect(result?.fatMaxWatt).toBeLessThan(220);
    expect(result?.fatCurve.length).toBeGreaterThan(50);
  });

  it("anchors the modelled lactate curve at rest and threshold", () => {
    const curve = buildFatCurve(294, 0.01454);
    expect(curve[0].lactate).toBeCloseTo(1.0, 1);
    expect(curve[curve.length - 1].lactate).toBeCloseTo(4.0, 1);
  });

  it("estimates carbohydrate fuelling from the model", () => {
    const fueling = estimateFueling(294, 0.01454, 200);
    expect(fueling).not.toBeNull();
    expect(fueling?.carbFraction).toBeGreaterThan(0.2);
    expect(fueling?.carbFraction).toBeLessThan(0.6);
    expect(fueling?.carbGramsPerHour).toBeGreaterThan(40);
    expect(fueling?.carbGramsPerHour).toBeLessThan(110);
  });

  it("flags the sprint when the 12-minute test diverges", () => {
    const high = runBikeAnalysis({ ...DEFAULT_BIKE_INPUT, validation12minWatt: 240 });
    expect(high?.plausibility.status).toBe("sprint_high");
    const low = runBikeAnalysis({ ...DEFAULT_BIKE_INPUT, validation12minWatt: 360 });
    expect(low?.plausibility.status).toBe("sprint_low");
  });

  it("returns null when the sprint average exceeds the peak", () => {
    expect(runBikeAnalysis({ ...DEFAULT_BIKE_INPUT, sprintPeakWatt: 600, sprintAvg20sWatt: 700 })).toBeNull();
  });

  it("returns null when the VLamax proxy is out of the calibrated band", () => {
    expect(runBikeAnalysis({ ...DEFAULT_BIKE_INPUT, sprintPeakWatt: 2000, sprintAvg20sWatt: 2000, weight: 25 })).toBeNull();
  });

  it("surfaces a validation error for an out-of-band sprint", () => {
    const result = getBikeValidationResult({ ...DEFAULT_BIKE_INPUT, sprintPeakWatt: 2000, sprintAvg20sWatt: 2000, weight: 25 });
    expect(result.fieldErrors.sprintAvg20sWatt).toBeTruthy();
  });
});
