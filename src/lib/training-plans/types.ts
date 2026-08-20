import type { SwimLevel, TargetDistance } from "@/lib/analysis/types";
import type { TechniqueProfileGroup } from "@/lib/analysis/types";

export type TrainingPlanBlock = {
  title: string;
  sets: string;
  intensity: string;
  notes?: string;
};

export type TrainingPlanDrill = {
  name: string;
  cue: string;
};

export type TrainingPlanSession = {
  title: string;
  focus: string;
  blocks: TrainingPlanBlock[];
  drills: TrainingPlanDrill[];
};

export type TrainingPlanWeek = {
  title: string;
  goal: string;
  sessions: TrainingPlanSession[];
};

export type TrainingPlanContent = {
  weeks: TrainingPlanWeek[];
};


export type WorkoutDuration =
  | { type: "time"; seconds: number }
  | { type: "distance"; meters: number };

export type WorkoutStepMode = "time" | "distance";

export type WorkoutTarget =
  | { type: "threshold_power_percentage"; minPercent: number; maxPercent?: number }
  | { type: "max_heart_rate_percentage"; minPercent: number; maxPercent?: number }
  | { type: "vo2max_power_percentage"; minPercent: number; maxPercent?: number };

export type WorkoutStep = {
  id: string;
  title: string;
  duration: WorkoutDuration;
  targets: WorkoutTarget[];
  recoverySeconds?: number;
  notes?: string;
};

export type WorkoutBlock = {
  id: string;
  title: string;
  kind: "warmup" | "steady" | "interval" | "recovery" | "cooldown";
  repeatCount: number;
  steps: WorkoutStep[];
};

export type WorkoutContent = {
  schemaVersion: 1;
  discipline: TrainingPlanDiscipline;
  blocks: WorkoutBlock[];
};

export type WorkoutLibraryItem = {
  id: string;
  title: string;
  discipline: TrainingPlanDiscipline;
  content: WorkoutContent;
  is_favorite: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AthleteBenchmarkSnapshot = {
  discipline: TrainingPlanDiscipline;
  thresholdPowerWatts?: number | null;
  maxHeartRateBpm?: number | null;
  vo2maxPowerWatts?: number | null;
};
export type SwimStroke = "freestyle" | "backstroke" | "breaststroke" | "butterfly" | "medley" | "choice";
export type SwimEquipment = "pullbuoy" | "paddles" | "fins" | "snorkel" | "kickboard";
export type SwimIntensity =
  | { type: "zone"; zone: "Z1" | "Z2" | "Z3" | "Z4" | "Z5" }
  | { type: "css"; offsetSecondsPer100m: number }
  | { type: "rpe"; min: number; max: number }
  | { type: "free"; label: string };

export type StructuredSwimStep = {
  id: string;
  repetitions: number;
  distanceMeters: number;
  restSeconds: number;
  stroke: SwimStroke;
  intensity: SwimIntensity;
  equipment: SwimEquipment[];
  drillName?: string;
  cue?: string;
  notes?: string;
  needsReview?: boolean;
  legacyText?: string;
};

export type StructuredSwimBlock = {
  id: string;
  title: string;
  kind: "warmup" | "drill" | "main" | "recovery" | "cooldown";
  repeatCount: number;
  steps: StructuredSwimStep[];
};

export type StructuredTrainingPlanSession = {
  id: string;
  title: string;
  focus: string;
  preferredWeekday?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  estimatedDurationMinutes?: number;
  timelineWorkout?: WorkoutContent;
  blocks: StructuredSwimBlock[];
};

export type StructuredTrainingPlanWeek = {
  id: string;
  title: string;
  goal: string;
  sessions: StructuredTrainingPlanSession[];
};

export type TrainingPlanContentV2 = {
  schemaVersion: 2;
  weeks: StructuredTrainingPlanWeek[];
};

export type AnyTrainingPlanContent = TrainingPlanContent | TrainingPlanContentV2;

export type TrainingPlanLevel = SwimLevel | "Alle";
export type TrainingPlanDiscipline = "swim" | "run" | "bike";

export type TrainingPlan = {
  id: string;
  discipline: TrainingPlanDiscipline;
  slug: string;
  title: string;
  focus: string;
  phase: string;
  level: TrainingPlanLevel | string;
  target_distances: TargetDistance[];
  weeks: number;
  summary: string;
  preview: string;
  content: AnyTrainingPlanContent;
  content_schema_version?: 1 | 2 | 3;
  target_technique_axis?: TechniqueProfileGroup | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TrainingPlanPreview = Pick<
  TrainingPlan,
  "id" | "slug" | "title" | "focus" | "phase" | "weeks" | "summary" | "preview" | "target_distances"
>;

export type TrainingPlanVersion = {
  id: string;
  training_plan_id: string;
  version_number: number;
  discipline: TrainingPlanDiscipline;
  slug: string;
  title: string;
  focus: string;
  phase: string;
  level: string;
  target_distances: TargetDistance[];
  weeks: number;
  summary: string;
  preview: string;
  content: AnyTrainingPlanContent;
  content_schema_version?: 1 | 2 | 3;
  target_technique_axis?: TechniqueProfileGroup | null;
  published_by: string | null;
  published_at: string;
};

export type TrainingPlanVersionSummary = Omit<TrainingPlanVersion, "content" | "preview">;
