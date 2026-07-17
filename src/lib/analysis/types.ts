export type Gender = "weiblich" | "maennlich" | "divers";
export type PoolLength = 25 | 50;
export type SwimTestType = "water_start" | "dive_start" | "wall_push";
export type SwimEquipment = "ohne" | "pullbuoy" | "neo" | "paddles";
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

export type TechniqueStatus = "rot" | "gelb" | "gruen";
export type TechniqueClass =
  | "Technik-Einsteiger"
  | "Technik in Aufbau"
  | "Solider Hobbyschwimmer"
  | "Ambitionierter Hobbyschwimmer"
  | "Starker Agegrouper"
  | "Leistungsschwimmer";
export type TechniqueGateReason =
  | "cannot_swim_400m"
  | "equipment_used"
  | "pace_over_2_00"
  | "pace_between_1_50_and_2_00"
  | "technique_stable";
export type AnalysisMode = "standard" | "technique_only";
export type VLaProfile = "Diesel" | "Allrounder" | "Sprinter";
export type ProxyLevel = "niedrig" | "mittel" | "hoch";
export type Vo2ProxyLevel = ProxyLevel | "nicht_ermittelbar";
export type SprintReserveCategory = ProxyLevel | "nicht_ermittelbar";
export type SprintReservePlausibilityStatus =
  | "plausibel"
  | "auffaellig"
  | "interessant_stark"
  | "tendenziell_sprinterlastig"
  | "tendenziell_diesellastig"
  | "neutral";
export type VLaPerformanceBand = "stark" | "mittel" | "schwaecher";
export type CssExpectation = "passt" | "unter_erwartung" | "ueber_erwartung" | "nicht_ermittelbar";
export type CssPerformanceLevel = "minimal" | "niedrig" | "mittel" | "hoch" | "sehr_hoch" | "nicht_ermittelbar";
export type SpiderScoreKey =
  | "css"
  | "dps"
  | "sr"
  | "dpsStability"
  | "srAdaptation"
  | "tempoEfficiency";
export type ReferenceLabel =
  | "Alters-Elite oder besser"
  | "Sehr nah an der Alters-Elite"
  | "Gutes Altersniveau"
  | "Solides Hobbyniveau"
  | "Großes Entwicklungspotenzial"
  | "Keine Referenz verfügbar";

export type SprintMetrics = {
  distance: 50;
  time: number;
  pace: number;
  strokesPerLength?: number;
  dps?: number;
  sr?: number;
  timePerLength?: number;
};

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
  bodyFatPercentage?: number;
  fitnessLevel?: number;
  poolLength: PoolLength;
  canSwim400m: boolean;
  testType: SwimTestType;
  equipment: SwimEquipment;
  t50: string;
  s50?: number;
  t200: string;
  s200: number;
  t400?: string;
  s400?: number;
  goal: SwimGoal;
  level: SwimLevel;
  targetDistance?: TargetDistance;
  raceDate?: string;
  swimSessionsPerWeek?: number;
  challenges: string[];
};

export type TechniqueGateResult = {
  status: TechniqueStatus;
  reason: TechniqueGateReason;
  techniqueClass?: TechniqueClass | null;
  title: string;
  message: string;
};

export type ReferenceComparison = {
  ageBucket: number | null;
  sex: "maennlich" | "weiblich" | null;
  t50: ReferenceIndex | null;
  t200: ReferenceIndex | null;
  t400: ReferenceIndex | null;
  css: ReferenceIndex | null;
};

export type ReferenceIndex = {
  reference: number;
  value: number;
  index: number;
  label: ReferenceLabel;
};

type AnalysisPlan = {
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

type AnalysisBaseResult = {
  mode: AnalysisMode;
  techniqueGate: TechniqueGateResult;
  test50: SprintMetrics;
  test200: TestMetrics;
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
  plan: AnalysisPlan;
};

export type StandardAnalysisResult = AnalysisBaseResult & {
  mode: "standard";
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
    level: ProxyLevel;
    profile: VLaProfile;
    score: number;
    drop: number;
    performanceBand?: VLaPerformanceBand;
    thresholds?: {
      dieselMax: number;
      sprinterMin: number;
    };
  };
  vo2: {
    level: Vo2ProxyLevel;
    score: number;
    deviation: number | null;
  };
  sprintReserve: number | null;
  sprintReserveCategory?: SprintReserveCategory;
  sprintReservePlausibility?: {
    status: SprintReservePlausibilityStatus;
    label: string;
    text: string;
  };
  metabolicProfile?: {
    label: string;
    matrixProfile: string;
    expectedCss: CssPerformanceLevel;
    actualCss: CssPerformanceLevel;
    vo2Potential: string;
    vlaContext: string;
    cssInterpretation: string;
    priority: string;
  };
  spiderScores?: Record<SpiderScoreKey, number>;
  cssExpectation?: CssExpectation;
  reference: ReferenceComparison;
};

export type TechniqueOnlyAnalysisResult = AnalysisBaseResult & {
  mode: "technique_only";
  test400?: TestMetrics;
  comparison?: never;
  cssMs?: never;
  cssPace?: never;
  vla?: never;
  vo2?: never;
  sprintReserve?: null;
  reference?: ReferenceComparison;
};

export type AnalysisResult = StandardAnalysisResult | TechniqueOnlyAnalysisResult;

export type AnalysisAudit = {
  user_id: string;
  created_at: string;
  created_by: string | null;
  created_by_name: string | null;
  updated_by: string | null;
  updated_by_name: string | null;
  updated_at: string;
};

export type StoredAnalysis = AnalysisAudit & {
  id: string;
  title: string;
  input: AnalysisInput;
  result: AnalysisResult;
  created_at: string;
};
