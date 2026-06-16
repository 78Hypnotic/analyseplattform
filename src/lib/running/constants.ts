import type { AciBand, ApiBand, RunGoal, RunInput } from "./types";

// --- Test protocol ---------------------------------------------------------
export const TEST_3MIN_SECONDS = 180;
export const TEST_12MIN_SECONDS = 720;
/** Time delta between the two field tests (720 − 180). */
export const CS_TIME_DELTA_SECONDS = TEST_12MIN_SECONDS - TEST_3MIN_SECONDS;

// --- Index normalisation ---------------------------------------------------
export const INDEX_MIN = 1;
export const INDEX_MAX = 10;

/** API normalisation window for the endurance ratio v12/v3. */
export const API_RATIO_MIN = 0.82;
export const API_RATIO_MAX = 0.96;

/** VO₂-Proxy heuristic: speed between CS and the 3-minute speed. */
export const VO2_PROXY_FACTOR = 0.65;
/** ACI normalisation window for the VO₂-Proxy speed (m/s). */
export const ACI_VO2_MIN = 3.0;
export const ACI_VO2_MAX = 5.2;

/** Score at or above which an index counts as "high" in the 2×2 matrix. */
export const MATRIX_HIGH_THRESHOLD = 5.5;

// --- Goals -----------------------------------------------------------------
export const RUN_GOALS = [
  { id: "5k", label: "5 km", description: "Kurze, schnelle Distanz" },
  { id: "10k", label: "10 km", description: "Tempo-orientierte Mitteldistanz" },
  { id: "Halbmarathon", label: "Halbmarathon", description: "Lange Schwellenleistung" },
  { id: "Marathon", label: "Marathon", description: "Aerobe Langstrecke" },
  { id: "Trail", label: "Trail", description: "Gelände und lange Belastung" },
  { id: "Triathlon", label: "Triathlon", description: "Laufen als Teildisziplin" },
] as const satisfies ReadonlyArray<{ id: RunGoal; label: string; description: string }>;

// --- Interpretation bands --------------------------------------------------
export const API_INTERPRETATION = [
  { max: 2, band: "stark_anaerob", label: "Stark anaerob geprägt" },
  { max: 4, band: "anaerob", label: "Anaerob geprägt" },
  { max: 6, band: "ausgewogen", label: "Ausgewogenes Profil" },
  { max: 8, band: "ausdauerstark", label: "Ausdauerstark" },
  { max: 10, band: "extrem_dieselig", label: "Extrem dieselig" },
] as const satisfies ReadonlyArray<{ max: number; band: ApiBand; label: string }>;

export const ACI_INTERPRETATION = [
  { max: 2, band: "sehr_klein", label: "Sehr kleiner Motor" },
  { max: 4, band: "klein", label: "Kleiner Motor" },
  { max: 6, band: "mittel", label: "Mittlerer Motor" },
  { max: 8, band: "gross", label: "Großer Motor" },
  { max: 10, band: "sehr_gross", label: "Sehr großer Motor" },
] as const satisfies ReadonlyArray<{ max: number; band: AciBand; label: string }>;

// --- Training zones (percentage of Critical Speed) -------------------------
// minPct/maxPct express the share of CS. Z1 uses a practical display floor of
// 50 % because "below 70 %" has no natural lower bound for pace output.
export const RUN_TRAINING_ZONES = [
  { zone: 1, short: "Z1", label: "Rekom", minPct: 0.5, maxPct: 0.7 },
  { zone: 2, short: "Z2", label: "GA1", minPct: 0.71, maxPct: 0.8 },
  { zone: 3, short: "Z3", label: "GA2", minPct: 0.81, maxPct: 0.9 },
  { zone: 4, short: "Z4", label: "Schwelle", minPct: 0.91, maxPct: 1.0 },
  { zone: 5, short: "Z5", label: "EB", minPct: 1.01, maxPct: 1.06 },
  { zone: 6, short: "Z6", label: "SB", minPct: 1.06, maxPct: 1.2 },
] as const;

// --- Plausibility hints ----------------------------------------------------
export const RATIO_HIGH_HINT =
  "Der 3-Minuten-Test wurde vermutlich nicht maximal absolviert.";
export const RATIO_LOW_HINT =
  "Der 12-Minuten-Test wurde vermutlich nicht maximal absolviert oder die Testergebnisse sind auffällig.";

// --- Defaults --------------------------------------------------------------
export const DEFAULT_RUN_INPUT: RunInput = {
  name: "Jonas Keller",
  age: 34,
  gender: "maennlich",
  height: 181,
  weight: 74,
  bodyFatPercentage: 14,
  fitnessLevel: 3,
  distance3min: 850,
  distance12min: 3000,
  goal: "10k",
  raceDate: "",
  runSessionsPerWeek: 3,
};
