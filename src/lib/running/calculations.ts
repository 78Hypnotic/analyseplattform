import {
  ACI_INTERPRETATION,
  ACI_VO2_MAX,
  ACI_VO2_MIN,
  API_INTERPRETATION,
  API_RATIO_MAX,
  API_RATIO_MIN,
  CS_TIME_DELTA_SECONDS,
  INDEX_MAX,
  INDEX_MIN,
  MATRIX_HIGH_THRESHOLD,
  RATIO_HIGH_HINT,
  RATIO_LOW_HINT,
  RUN_TRAINING_ZONES,
  TEST_12MIN_SECONDS,
  TEST_3MIN_SECONDS,
  VO2_PROXY_FACTOR,
} from "./constants";
import type {
  AciBand,
  ApiBand,
  RunIndex,
  RunInput,
  RunPlausibility,
  RunProfileMatrix,
  RunResult,
  RunTrainingZone,
} from "./types";

// Pace formatting (m:ss) is pace-agnostic, so the swim helper is reused here.
export { formatPace } from "@/lib/analysis/calculations";

/** Average speed (m/s) of the 3-minute all-out test. */
export function computeV3(distance3min: number): number {
  if (!Number.isFinite(distance3min) || distance3min <= 0) return Number.NaN;
  return distance3min / TEST_3MIN_SECONDS;
}

/** Average speed (m/s) of the 12-minute (Cooper) all-out test. */
export function computeV12(distance12min: number): number {
  if (!Number.isFinite(distance12min) || distance12min <= 0) return Number.NaN;
  return distance12min / TEST_12MIN_SECONDS;
}

/** Critical Speed (m/s) from the two field-test distances. */
export function computeCriticalSpeed(distance3min: number, distance12min: number): number {
  if (
    !Number.isFinite(distance3min) ||
    !Number.isFinite(distance12min) ||
    distance12min <= distance3min
  ) {
    return Number.NaN;
  }
  return (distance12min - distance3min) / CS_TIME_DELTA_SECONDS;
}

/** Converts a running speed (m/s) into pace (seconds per kilometre). */
export function paceSecPerKm(speedMs: number): number {
  if (!Number.isFinite(speedMs) || speedMs <= 0) return Number.NaN;
  return 1000 / speedMs;
}

/** Endurance ratio v12 / v3 (0–1, higher = more endurance-leaning). */
export function computeEnduranceRatio(v12: number, v3: number): number {
  if (!Number.isFinite(v12) || !Number.isFinite(v3) || v3 <= 0) return Number.NaN;
  return v12 / v3;
}

/** Anaerobic Profile Index (1–10) from the endurance ratio. */
export function computeApi(ratio: number): number {
  if (!Number.isFinite(ratio)) return Number.NaN;
  const raw =
    INDEX_MIN + ((ratio - API_RATIO_MIN) / (API_RATIO_MAX - API_RATIO_MIN)) * (INDEX_MAX - INDEX_MIN);
  return roundIndex(clamp(raw, INDEX_MIN, INDEX_MAX));
}

/** VO₂-Proxy speed (m/s) between CS and the 3-minute speed. Not a VO₂max value. */
export function computeVo2Proxy(cs: number, v3: number): number {
  if (!Number.isFinite(cs) || !Number.isFinite(v3)) return Number.NaN;
  return cs + VO2_PROXY_FACTOR * (v3 - cs);
}

/** Aerobic Capacity Index (1–10) from the VO₂-Proxy speed. */
export function computeAci(vo2Proxy: number): number {
  if (!Number.isFinite(vo2Proxy)) return Number.NaN;
  const raw =
    INDEX_MIN + ((vo2Proxy - ACI_VO2_MIN) / (ACI_VO2_MAX - ACI_VO2_MIN)) * (INDEX_MAX - INDEX_MIN);
  return roundIndex(clamp(raw, INDEX_MIN, INDEX_MAX));
}

export function classifyApi(score: number): RunIndex<ApiBand> {
  const entry = API_INTERPRETATION.find((band) => score <= band.max) ?? API_INTERPRETATION[API_INTERPRETATION.length - 1];
  return { score, band: entry.band, label: entry.label };
}

export function classifyAci(score: number): RunIndex<AciBand> {
  const entry = ACI_INTERPRETATION.find((band) => score <= band.max) ?? ACI_INTERPRETATION[ACI_INTERPRETATION.length - 1];
  return { score, band: entry.band, label: entry.label };
}

export function buildProfileMatrix(apiScore: number, aciScore: number): RunProfileMatrix {
  const apiLevel = apiScore >= MATRIX_HIGH_THRESHOLD ? "hoch" : "niedrig";
  const aciLevel = aciScore >= MATRIX_HIGH_THRESHOLD ? "hoch" : "niedrig";

  if (aciLevel === "hoch" && apiLevel === "niedrig") {
    return { aciLevel, apiLevel, title: "Großer Motor, anaerob geprägt", description: "Viel aerobe Kapazität, aber das Profil ist anaerob ausgerichtet." };
  }
  if (aciLevel === "hoch" && apiLevel === "hoch") {
    return { aciLevel, apiLevel, title: "Großer Motor und hohe Ausdauer", description: "Große aerobe Kapazität gepaart mit starker Dauerleistungsfähigkeit." };
  }
  if (aciLevel === "niedrig" && apiLevel === "hoch") {
    return { aciLevel, apiLevel, title: "Dieselig, aber kleiner Motor", description: "Stabile Dauerleistung bei aktuell kleinerer aerober Kapazität." };
  }
  return { aciLevel, apiLevel, title: "Kleiner Motor, anaerob geprägt", description: "Kleinere aerobe Kapazität bei anaerob geprägtem Profil." };
}

/** CS-relative training zones with pace ranges (m:ss per km). */
export function buildTrainingZones(cs: number): RunTrainingZone[] {
  return RUN_TRAINING_ZONES.map((zone) => ({
    zone: zone.zone,
    short: zone.short,
    label: zone.label,
    category: `${zone.short} ${zone.label}`,
    minPct: zone.minPct,
    maxPct: zone.maxPct,
    slowerPaceSecPerKm: paceSecPerKm(cs * zone.minPct),
    fasterPaceSecPerKm: paceSecPerKm(cs * zone.maxPct),
  }));
}

export function buildPlausibility(ratio: number): RunPlausibility {
  const ratioHigh = Number.isFinite(ratio) && ratio > API_RATIO_MAX;
  const ratioLow = Number.isFinite(ratio) && ratio < API_RATIO_MIN;
  const messages: string[] = [];
  if (ratioHigh) messages.push(RATIO_HIGH_HINT);
  if (ratioLow) messages.push(RATIO_LOW_HINT);
  return { ratioHigh, ratioLow, messages };
}

/**
 * Turns the two field-test distances and athlete context into a deterministic
 * running diagnostic. Returns null when the inputs cannot form a valid model
 * (12-minute distance not greater than the 3-minute distance, or v12 ≥ v3).
 */
export function runRunningAnalysis(input: RunInput): RunResult | null {
  const v3 = computeV3(input.distance3min);
  const v12 = computeV12(input.distance12min);
  const cs = computeCriticalSpeed(input.distance3min, input.distance12min);

  if (!Number.isFinite(v3) || !Number.isFinite(v12) || !Number.isFinite(cs) || cs <= 0) {
    return null;
  }

  const enduranceRatio = computeEnduranceRatio(v12, v3);
  if (!Number.isFinite(enduranceRatio) || enduranceRatio >= 1) return null;

  const apiScore = computeApi(enduranceRatio);
  const vo2Proxy = computeVo2Proxy(cs, v3);
  const aciScore = computeAci(vo2Proxy);

  return {
    v3,
    v12,
    cs,
    csPaceSecPerKm: paceSecPerKm(cs),
    enduranceRatio,
    api: classifyApi(apiScore),
    vo2Proxy,
    aci: classifyAci(aciScore),
    profileMatrix: buildProfileMatrix(apiScore, aciScore),
    zones: buildTrainingZones(cs),
    plausibility: buildPlausibility(enduranceRatio),
  };
}

function roundIndex(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
