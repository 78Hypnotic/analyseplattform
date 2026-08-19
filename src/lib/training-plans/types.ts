import type { SwimLevel, TargetDistance } from "@/lib/analysis/types";

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
  content: TrainingPlanContent;
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
  content: TrainingPlanContent;
  published_by: string | null;
  published_at: string;
};

export type TrainingPlanVersionSummary = Omit<TrainingPlanVersion, "content" | "preview">;
