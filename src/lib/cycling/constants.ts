import type { BikeGoal, BikeInput, MetabolicBand } from "./types";

// --- Test protocol & model constants (Briefing v2.1) -----------------------
export const SPRINT_SECONDS = 20;
export const ALACTIC_SECONDS = 4;
export const GLYCOLYTIC_SECONDS = 16;

/** PVO₂ is approximated as a fixed share of the ramp peak power (PPO). */
export const PVO2_FACTOR = 0.875;
/** ~12 ml O₂/min per watt of aerobic power. */
export const O2_PER_WATT = 12;
/** Mechanical efficiency of cycling (Briefing v2.1: 22.5 %). */
export const MECH_EFFICIENCY = 0.225;
/** Metabolic energy per litre of O₂. */
export const KJ_PER_LITER_O2 = 20.9;
/** ml/kg O₂ equivalent per 1 mmol/l lactate. */
export const O2_PER_LACTATE = 3;
/** Relative total energy demand per watt (for the fat/CHO model). */
export const ENERGY_PER_WATT = 3.82;

/** Lactate model anchors (mmol/l): resting baseline and threshold at FTP. */
export const LACTATE_REST = 1.0;
export const LACTATE_THRESHOLD = 4.0;
/** Energy yield per gram of carbohydrate (kJ/g) for fuelling calculations. */
export const KJ_PER_GRAM_CARB = 17.1;
/** Energy yield per gram of fat (kJ/g) for fuelling calculations. */
export const KJ_PER_GRAM_FAT = 37.7;

/** Plausible VLamax-proxy band the model is calibrated for. */
export const VLAMAX_MIN = 0.25;
export const VLAMAX_MAX = 0.9;

/** Deviation beyond which the optional 12-min test flags the sprint. */
export const PLAUSIBILITY_TOLERANCE = 0.1;

// --- Lookup tables (linear interpolation, clamped at the edges) ------------
export const PROFILE_FACTOR_TABLE = [
  { vlamax: 0.3, value: 0.83 },
  { vlamax: 0.35, value: 0.82 },
  { vlamax: 0.4, value: 0.81 },
  { vlamax: 0.45, value: 0.8 },
  { vlamax: 0.5, value: 0.79 },
  { vlamax: 0.55, value: 0.78 },
  { vlamax: 0.6, value: 0.77 },
  { vlamax: 0.65, value: 0.76 },
  { vlamax: 0.7, value: 0.75 },
  { vlamax: 0.75, value: 0.74 },
  { vlamax: 0.8, value: 0.73 },
  { vlamax: 0.85, value: 0.72 },
  { vlamax: 0.9, value: 0.71 },
] as const;

export const K_FACTOR_TABLE = [
  { vlamax: 0.25, value: 0.024 },
  { vlamax: 0.3, value: 0.023 },
  { vlamax: 0.35, value: 0.0215 },
  { vlamax: 0.4, value: 0.0195 },
  { vlamax: 0.45, value: 0.018 },
  { vlamax: 0.5, value: 0.0168 },
  { vlamax: 0.55, value: 0.0158 },
  { vlamax: 0.6, value: 0.0148 },
  { vlamax: 0.65, value: 0.0139 },
  { vlamax: 0.7, value: 0.013 },
  { vlamax: 0.75, value: 0.0122 },
  { vlamax: 0.8, value: 0.0115 },
  { vlamax: 0.85, value: 0.0108 },
  { vlamax: 0.9, value: 0.0102 },
] as const;

// --- Goals -----------------------------------------------------------------
export const BIKE_GOALS = [
  { id: "Strasse", label: "Straße", description: "Straßenrennen und lange Ausfahrten" },
  { id: "Zeitfahren", label: "Zeitfahren", description: "Konstante Schwellenleistung" },
  { id: "MTB_Gravel", label: "MTB / Gravel", description: "Variable Belastung im Gelände" },
  { id: "GranFondo", label: "Gran Fondo", description: "Lange Marathon-Distanzen" },
  { id: "Triathlon", label: "Triathlon", description: "Radfahren als Teildisziplin" },
] as const satisfies ReadonlyArray<{ id: BikeGoal; label: string; description: string }>;

// --- Metabolic profile bands (from VLamax proxy) ---------------------------
export const METABOLIC_BANDS = [
  { max: 0.45, band: "diesel", label: "Diesel-Profil", description: "Niedrige VLamax: hohe Schwelle relativ zur VO₂max, ausdauerbetont." },
  { max: 0.55, band: "ausdauer", label: "Ausdauerorientiert", description: "Eher niedrige VLamax: stabile Dauerleistung mit guter Schwelle." },
  { max: 0.65, band: "ausgewogen", label: "Ausgewogenes Profil", description: "Mittlere VLamax: ausgewogenes Verhältnis aus Schwelle und Spritzigkeit." },
  { max: 0.75, band: "tempo", label: "Tempobetont", description: "Erhöhte VLamax: gute Beschleunigung, etwas niedrigere relative Schwelle." },
  { max: Infinity, band: "anaerob", label: "Anaerob dominant", description: "Hohe VLamax: starke Glykolyse, niedrigere Schwelle relativ zur VO₂max." },
] as const satisfies ReadonlyArray<{ max: number; band: MetabolicBand; label: string; description: string }>;

// --- Training zones (Coggan, % of FTP) -------------------------------------
export const BIKE_ZONES = [
  { zone: 1, short: "Z1", label: "Aktive Erholung", minPct: 0, maxPct: 0.55 },
  { zone: 2, short: "Z2", label: "Grundlage (GA1)", minPct: 0.56, maxPct: 0.75 },
  { zone: 3, short: "Z3", label: "Tempo (GA2)", minPct: 0.76, maxPct: 0.9 },
  { zone: 4, short: "Z4", label: "Schwelle", minPct: 0.91, maxPct: 1.05 },
  { zone: 5, short: "Z5", label: "VO₂max", minPct: 1.06, maxPct: 1.2 },
  { zone: 6, short: "Z6", label: "Anaerob", minPct: 1.21, maxPct: 1.5 },
  { zone: 7, short: "Z7", label: "Neuromuskulär", minPct: 1.51, maxPct: null },
] as const satisfies ReadonlyArray<{ zone: number; short: string; label: string; minPct: number; maxPct: number | null }>;

// --- Defaults --------------------------------------------------------------
export const DEFAULT_BIKE_INPUT: BikeInput = {
  name: "Jonas Keller",
  age: 34,
  gender: "maennlich",
  height: 181,
  weight: 75,
  bodyFatPercentage: 14,
  fitnessLevel: 3,
  sprintPeakWatt: 900,
  sprintAvg20sWatt: 700,
  oneMinPowerWatt: 438,
  goal: "Strasse",
  raceDate: "",
  bikeSessionsPerWeek: 4,
};
