import type { Gender } from "@/lib/analysis/types";

export type { Gender };

export type BikeGoal =
  | "Strasse"
  | "Zeitfahren"
  | "MTB_Gravel"
  | "GranFondo"
  | "Triathlon";

export type MetabolicBand = "diesel" | "ausdauer" | "ausgewogen" | "tempo" | "anaerob";

export type PlausibilityStatus = "none" | "ok" | "sprint_high" | "sprint_low";

export type BikeInput = {
  name: string;
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  bodyFatPercentage?: number;
  fitnessLevel?: number;
  /** Peak 1-second power during the sprint (W). */
  sprintPeakWatt: number;
  /** Average power across the full 20-second sprint (W). */
  sprintAvg20sWatt: number;
  /** Best 1-minute average power (W) — used directly as MAP/PPO. */
  oneMinPowerWatt: number;
  goal: BikeGoal;
  raceDate?: string;
  bikeSessionsPerWeek?: number;
  /** Optional 12-minute best-effort power (W) for plausibility checking. */
  validation12minWatt?: number;
};

export type BikeZone = {
  zone: number;
  short: string;
  label: string;
  minPct: number;
  maxPct: number | null;
  minWatt: number;
  maxWatt: number | null;
};

export type FatCurvePoint = {
  watt: number;
  fat: number;
  cho: number;
  /** Modelled blood lactate (mmol/l) at this power. */
  lactate: number;
};

export type BikeMetabolicProfile = {
  band: MetabolicBand;
  label: string;
  description: string;
};

export type BikePlausibility = {
  status: PlausibilityStatus;
  deviationPct: number | null;
  message: string | null;
};

export type BikeResult = {
  ppo: number;
  pvo2: number;
  vo2abs: number;
  vo2rel: number;
  w20: number;
  walakt: number;
  wgly: number;
  pgly: number;
  emetKj: number;
  o2eq: number;
  o2eqRel: number;
  laeq: number;
  /** VLamax proxy in mmol/l/s. Not a lab measurement. */
  vlamaxProxy: number;
  profileFactor: number;
  ftpWatt: number;
  ftpPerKg: number;
  kFactor: number;
  fatMaxWatt: number;
  fatMaxPctFtp: number;
  fatCurve: FatCurvePoint[];
  metabolicProfile: BikeMetabolicProfile;
  zones: BikeZone[];
  plausibility: BikePlausibility;
};

export type StoredBikeAnalysis = {
  id: string;
  title: string;
  input: BikeInput;
  result: BikeResult;
  created_at: string;
};
