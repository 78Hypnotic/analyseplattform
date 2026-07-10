import {
  ALACTIC_SECONDS,
  BIKE_MODEL_VERSION,
  BIKE_ZONES,
  ENERGY_PER_WATT,
  GLYCOLYTIC_SECONDS,
  K_FACTOR_TABLE,
  KJ_PER_GRAM_CARB,
  KJ_PER_GRAM_FAT,
  KJ_PER_LITER_O2,
  LACTATE_REST,
  LACTATE_THRESHOLD,
  MECH_EFFICIENCY,
  METABOLIC_BANDS,
  O2_PER_LACTATE,
  O2_PER_WATT,
  PLAUSIBILITY_TOLERANCE,
  PROFILE_FACTOR_TABLE,
  PVO2_FACTOR,
  SPRINT_SECONDS,
  VLAMAX_MAX,
  VLAMAX_DOMINANCE_TABLE,
  VLAMAX_MIN,
} from "./constants";
import type {
  BikeInput,
  CurrentBikeResult,
  BikeMetabolicProfile,
  BikePlausibility,
  BikeZone,
  FatCurvePoint,
} from "./types";

/** Power at VO₂max, approximated as a fixed share of PPO. */
export function computePvo2(ppo: number): number {
  if (!Number.isFinite(ppo)) return Number.NaN;
  return ppo * PVO2_FACTOR;
}

/** VO₂max absolute (ml/min) and relative (ml/kg/min). */
export function computeVo2(pvo2: number, weight: number): { abs: number; rel: number } {
  const abs = pvo2 * O2_PER_WATT;
  return { abs, rel: weight > 0 ? abs / weight : Number.NaN };
}

/** Glycolytic mechanical work from the sprint test. */
export function computeGlycolytic(peakWatt: number, avg20sWatt: number) {
  const w20 = avg20sWatt * SPRINT_SECONDS;
  const walakt = peakWatt * ALACTIC_SECONDS;
  const wgly = w20 - walakt;
  const pgly = wgly / GLYCOLYTIC_SECONDS;
  return { w20, walakt, wgly, pgly };
}

/** Glycolytic energy chain through the lactate equivalent. */
export function computeLactateEquivalent(wgly: number, weight: number) {
  const emetKj = wgly / MECH_EFFICIENCY / 1000;
  const o2eq = emetKj / KJ_PER_LITER_O2;
  const o2eqRel = weight > 0 ? (o2eq * 1000) / weight : Number.NaN;
  const laeq = o2eqRel / O2_PER_LACTATE;
  return { emetKj, o2eq, o2eqRel, laeq };
}

/** Maps glycolytic dominance to VLamax, extrapolating with the edge segments. */
export function computeVlamaxProxy(pgly: number, pvo2: number) {
  const glycolyticDominance = pvo2 > 0 ? pgly / pvo2 : Number.NaN;
  const vlamaxProxy = interpolateDominanceTable(glycolyticDominance);
  return { glycolyticDominance, vlamaxProxy };
}

export function interpolateDominanceTable(dominance: number): number {
  if (!Number.isFinite(dominance)) return Number.NaN;

  const table: ReadonlyArray<{ dominance: number; vlamax: number }> = VLAMAX_DOMINANCE_TABLE;
  const first = table[0];
  const last = table[table.length - 1];
  let lower = first;
  let upper = table[1];

  if (dominance >= last.dominance) {
    lower = table[table.length - 2];
    upper = last;
  } else if (dominance > first.dominance) {
    for (let index = 0; index < table.length - 1; index += 1) {
      const candidateLower = table[index];
      const candidateUpper = table[index + 1];
      if (dominance >= candidateLower.dominance && dominance <= candidateUpper.dominance) {
        lower = candidateLower;
        upper = candidateUpper;
        break;
      }
    }
  }

  const fraction = (dominance - lower.dominance) / (upper.dominance - lower.dominance);
  return lower.vlamax + fraction * (upper.vlamax - lower.vlamax);
}

export function isVlamaxInCalibratedRange(vlamax: number): boolean {
  return Number.isFinite(vlamax) && vlamax >= VLAMAX_MIN && vlamax <= VLAMAX_MAX;
}

/** Linear interpolation over a sorted {vlamax, value} table, clamped at the edges. */
export function interpolateTable(
  table: ReadonlyArray<{ vlamax: number; value: number }>,
  x: number,
): number {
  if (x <= table[0].vlamax) return table[0].value;
  const last = table[table.length - 1];
  if (x >= last.vlamax) return last.value;

  for (let i = 0; i < table.length - 1; i += 1) {
    const lower = table[i];
    const upper = table[i + 1];
    if (x >= lower.vlamax && x <= upper.vlamax) {
      const frac = (x - lower.vlamax) / (upper.vlamax - lower.vlamax);
      return lower.value + frac * (upper.value - lower.value);
    }
  }
  return last.value;
}

export function profileFactorFor(vlamax: number): number {
  return interpolateTable(PROFILE_FACTOR_TABLE, vlamax);
}

export function kFactorFor(vlamax: number): number {
  return interpolateTable(K_FACTOR_TABLE, vlamax);
}

/** Simulated threshold / FTP. */
export function computeFtp(pvo2: number, profileFactor: number): number {
  return pvo2 * profileFactor;
}

/**
 * Sweeps power from rest to FTP and returns the substrate/lactate curve.
 * CHO follows an exponential approaching the threshold demand; fat is the
 * remainder of the total demand (both share the ENERGY_PER_WATT scale).
 * Lactate is a transparent FTP-anchored model: LACTATE_REST at rest, rising
 * exponentially to LACTATE_THRESHOLD at FTP.
 */
export function buildFatCurve(ftp: number, k: number): FatCurvePoint[] {
  if (!Number.isFinite(ftp) || ftp <= 0 || !Number.isFinite(k)) return [];
  const energyThreshold = ftp * ENERGY_PER_WATT;
  const lactateGrowth = Math.log(LACTATE_THRESHOLD / LACTATE_REST);
  const step = Math.max(1, Math.round(ftp / 120));
  const points: FatCurvePoint[] = [];

  for (let watt = step; watt <= Math.round(ftp); watt += step) {
    const cho = energyThreshold * Math.exp(-k * (ftp - watt));
    const total = watt * ENERGY_PER_WATT;
    const fat = Math.max(0, total - cho);
    const lactate = LACTATE_REST * Math.exp(lactateGrowth * (watt / ftp));
    points.push({ watt, fat, cho, lactate });
  }
  return points;
}

/** Power with maximal fat oxidation (argmax over the fat curve). */
export function computeFatMax(ftp: number, k: number, curve?: FatCurvePoint[]): { watt: number; pctFtp: number } {
  const points = curve ?? buildFatCurve(ftp, k);
  if (points.length === 0 || ftp <= 0) return { watt: Number.NaN, pctFtp: Number.NaN };

  let best = points[0];
  for (const point of points) {
    if (point.fat > best.fat) best = point;
  }
  return { watt: best.watt, pctFtp: best.watt / ftp };
}

/** Converts one model point into relative shares and absolute oxidation rates. */
export function computeSubstrateOxidation(point: Pick<FatCurvePoint, "watt" | "fat" | "cho">): {
  carbFraction: number;
  fatFraction: number;
  carbGramsPerHour: number;
  fatGramsPerHour: number;
  kcalPerHour: number;
} {
  const total = point.fat + point.cho;
  const carbFraction = total > 0 ? Math.max(0, Math.min(1, point.cho / total)) : 0;
  const fatFraction = total > 0 ? 1 - carbFraction : 0;
  const metabolicKjPerHour = (point.watt / MECH_EFFICIENCY) * 3.6;

  return {
    carbFraction,
    fatFraction,
    carbGramsPerHour: (metabolicKjPerHour * carbFraction) / KJ_PER_GRAM_CARB,
    fatGramsPerHour: (metabolicKjPerHour * fatFraction) / KJ_PER_GRAM_FAT,
    kcalPerHour: metabolicKjPerHour / 4.184,
  };
}

export function classifyMetabolicProfile(vlamax: number): BikeMetabolicProfile {
  const entry = METABOLIC_BANDS.find((band) => vlamax <= band.max) ?? METABOLIC_BANDS[METABOLIC_BANDS.length - 1];
  return { band: entry.band, label: entry.label, description: entry.description };
}

export function buildTrainingZones(ftp: number): BikeZone[] {
  return BIKE_ZONES.map((zone) => ({
    zone: zone.zone,
    short: zone.short,
    label: zone.label,
    minPct: zone.minPct,
    maxPct: zone.maxPct,
    minWatt: Math.round(ftp * zone.minPct),
    maxWatt: zone.maxPct === null ? null : Math.round(ftp * zone.maxPct),
  }));
}

export function buildPlausibility(ftp: number, validation12minWatt?: number): BikePlausibility {
  if (!validation12minWatt || !Number.isFinite(validation12minWatt) || validation12minWatt <= 0) {
    return { status: "none", deviationPct: null, message: null };
  }

  const deviationPct = (ftp - validation12minWatt) / validation12minWatt;

  if (deviationPct > PLAUSIBILITY_TOLERANCE) {
    return {
      status: "sprint_high",
      deviationPct,
      message:
        "Die berechnete Schwelle liegt deutlich über deiner 12-Minuten-Leistung. Der Sprint wurde vermutlich überschätzt.",
    };
  }
  if (deviationPct < -PLAUSIBILITY_TOLERANCE) {
    return {
      status: "sprint_low",
      deviationPct,
      message:
        "Deine 12-Minuten-Leistung liegt deutlich über der berechneten Schwelle. Der Sprint wurde vermutlich unterschätzt oder der Profilfaktor ist zu aggressiv.",
    };
  }
  return {
    status: "ok",
    deviationPct,
    message: "Die berechnete Schwelle passt zur 12-Minuten-Leistung.",
  };
}

/**
 * Estimates substrate use and fuelling at a target power, using the same
 * fat/CHO model as the curve. Rates are per hour and duration-independent.
 */
export function estimateFueling(ftp: number, k: number, watt: number) {
  if (!Number.isFinite(ftp) || ftp <= 0 || !Number.isFinite(watt) || watt <= 0) return null;
  const total = watt * ENERGY_PER_WATT;
  const cho = ftp * ENERGY_PER_WATT * Math.exp(-k * (ftp - watt));
  const oxidation = computeSubstrateOxidation({ watt, cho, fat: Math.max(0, total - cho) });

  return {
    carbFraction: oxidation.carbFraction,
    carbGramsPerHour: oxidation.carbGramsPerHour,
    fatGramsPerHour: oxidation.fatGramsPerHour,
    kcalPerHour: oxidation.kcalPerHour,
  };
}

/**
 * Turns the sprint + 1-minute power test and athlete context into a
 * deterministic metabolic bike diagnostic. Returns null when the inputs cannot
 * form a plausible model (no glycolytic work, sprint average above peak, or a
 * VLamax proxy outside the calibrated band).
 */
export function runBikeAnalysis(input: BikeInput): CurrentBikeResult | null {
  if (!Number.isFinite(input.weight) || input.weight <= 0) return null;
  if (input.sprintAvg20sWatt > input.sprintPeakWatt) return null;

  // The best 1-minute average power is used directly as MAP/PPO.
  const ppo = input.oneMinPowerWatt;
  const pvo2 = computePvo2(ppo);
  if (!Number.isFinite(ppo) || ppo <= 0 || !Number.isFinite(pvo2) || pvo2 <= 0) return null;

  const { abs: vo2abs, rel: vo2rel } = computeVo2(pvo2, input.weight);
  const { w20, walakt, wgly, pgly } = computeGlycolytic(input.sprintPeakWatt, input.sprintAvg20sWatt);
  if (!Number.isFinite(wgly) || wgly <= 0) return null;

  const { emetKj, o2eq, o2eqRel, laeq } = computeLactateEquivalent(wgly, input.weight);
  const { glycolyticDominance, vlamaxProxy } = computeVlamaxProxy(pgly, pvo2);
  if (!isVlamaxInCalibratedRange(vlamaxProxy)) {
    return null;
  }

  const profileFactor = profileFactorFor(vlamaxProxy);
  const ftpWatt = computeFtp(pvo2, profileFactor);
  const kFactor = kFactorFor(vlamaxProxy);
  const fatCurve = buildFatCurve(ftpWatt, kFactor);
  const fatMax = computeFatMax(ftpWatt, kFactor, fatCurve);

  return {
    modelVersion: BIKE_MODEL_VERSION,
    glycolyticDominance,
    ppo,
    pvo2,
    vo2abs,
    vo2rel,
    w20,
    walakt,
    wgly,
    pgly,
    emetKj,
    o2eq,
    o2eqRel,
    laeq,
    vlamaxProxy,
    profileFactor,
    ftpWatt,
    ftpPerKg: ftpWatt / input.weight,
    kFactor,
    fatMaxWatt: fatMax.watt,
    fatMaxPctFtp: fatMax.pctFtp,
    fatCurve,
    metabolicProfile: classifyMetabolicProfile(vlamaxProxy),
    zones: buildTrainingZones(ftpWatt),
    plausibility: buildPlausibility(ftpWatt, input.validation12minWatt),
  };
}
