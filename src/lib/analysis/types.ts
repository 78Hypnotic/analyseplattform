export type Gender = "weiblich" | "maennlich" | "divers";
export type PoolLength = 25 | 50;
export type TargetDistance = "Sprint" | "OD" | "MD" | "LD" | "Becken" | "Freiwasser";
export type SwimGoal =
  | "Kraulen lernen"
  | "Beckenschwimmen"
  | "Freiwasserschwimmen"
  | "Triathlon";
export type SwimLevel =
  | "Einsteiger"
  | "Fortgeschritten"
  | "Ambitioniert"
  | "Leistungsschwimmer";

export type TestMetrics = {
  distance: 200 | 400;
  time: number;
  strokesPerLength: number;
  pace: number;
  dps: number;
  sr: number;
  timePerLength: number;
};

export type AnalysisInput = {
  name: string;
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  poolLength: PoolLength;
  t200: string;
  s200: number;
  t400: string;
  s400: number;
  t50?: string;
  goal: SwimGoal;
  level: SwimLevel;
  targetDistance?: TargetDistance;
  raceDate?: string;
  swimSessionsPerWeek?: number;
  challenges: string[];
};

export type AnalysisResult = {
  test200: TestMetrics;
  test400: TestMetrics;
  comparison: {
    paceDiff: number;
    dpsDiff: number;
    srDiff: number;
  };
  cssMs: number;
  cssPace: number;
  vla: {
    level: "niedrig" | "mittel" | "hoch";
    score: number;
    drop: number;
  };
  vo2: {
    level: "niedrig" | "mittel" | "hoch";
    score: number;
  };
  sprintReserve: number | null;
  strengths: Array<{ title: string; description: string }>;
  issues: Array<{
    tag: string;
    title: string;
    cause: string;
    cue: string;
    drill: string;
    note?: string;
  }>;
  potential: {
    paceGain: string;
    description: string;
  };
  style: string;
  styleProfile?: {
    name: string;
    description: string;
    trainingFocus: string;
  };
  plan: {
    slug?: string;
    name: string;
    phase: string;
    baseWeeks?: number;
    weeks: number;
    timeframeLabel?: string;
    retestHint?: string;
    targetDistance?: TargetDistance;
    swimSessionsPerWeek?: number;
  };
};

export type StoredAnalysis = {
  id: string;
  title: string;
  input: AnalysisInput;
  result: AnalysisResult;
  created_at: string;
};
