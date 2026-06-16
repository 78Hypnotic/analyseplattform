import type { Gender } from "@/lib/analysis/types";

export type { Gender };

export type RunGoal =
  | "5k"
  | "10k"
  | "Halbmarathon"
  | "Marathon"
  | "Trail"
  | "Triathlon";

export type ApiBand =
  | "stark_anaerob"
  | "anaerob"
  | "ausgewogen"
  | "ausdauerstark"
  | "extrem_dieselig";

export type AciBand =
  | "sehr_klein"
  | "klein"
  | "mittel"
  | "gross"
  | "sehr_gross";

export type MatrixLevel = "hoch" | "niedrig";

export type RunInput = {
  name: string;
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  bodyFatPercentage?: number;
  fitnessLevel?: number;
  /** All-out distance in metres covered in the 3-minute test. */
  distance3min: number;
  /** All-out distance in metres covered in the 12-minute (Cooper) test. */
  distance12min: number;
  goal: RunGoal;
  raceDate?: string;
  runSessionsPerWeek?: number;
};

export type RunIndex<Band extends string = string> = {
  /** 1–10, rounded to one decimal. */
  score: number;
  band: Band;
  label: string;
};

export type RunProfileMatrix = {
  aciLevel: MatrixLevel;
  apiLevel: MatrixLevel;
  title: string;
  description: string;
};

export type RunTrainingZone = {
  zone: number;
  short: string;
  label: string;
  category: string;
  minPct: number;
  maxPct: number;
  /** Pace at the lower %-of-CS bound (slower end, higher s/km). */
  slowerPaceSecPerKm: number;
  /** Pace at the upper %-of-CS bound (faster end, lower s/km). */
  fasterPaceSecPerKm: number;
};

export type RunPlausibility = {
  ratioHigh: boolean;
  ratioLow: boolean;
  messages: string[];
};

export type RunResult = {
  v3: number;
  v12: number;
  /** Critical Speed in m/s. */
  cs: number;
  csPaceSecPerKm: number;
  /** Endurance ratio v12 / v3 (0–1). */
  enduranceRatio: number;
  api: RunIndex<ApiBand>;
  /** VO₂-Proxy speed in m/s. Not a VO₂max estimate. */
  vo2Proxy: number;
  aci: RunIndex<AciBand>;
  profileMatrix: RunProfileMatrix;
  zones: RunTrainingZone[];
  plausibility: RunPlausibility;
};

export type StoredRunAnalysis = {
  id: string;
  title: string;
  input: RunInput;
  result: RunResult;
  created_at: string;
};
