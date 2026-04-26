import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emptyTrainingPlanContent } from "./defaults";
import { trainingPlanContentSchema } from "./schema";
import type { TrainingPlan, TrainingPlanContent, TrainingPlanPreview } from "./types";

type TrainingPlanRow = Omit<TrainingPlan, "content" | "target_distances"> & {
  content: unknown;
  target_distances: unknown;
};

const TARGET_DISTANCES = ["Sprint", "OD", "MD", "LD", "Becken", "Freiwasser"] as const;

export async function getTrainingPlans(limit = 50): Promise<TrainingPlan[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("training_plans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return ((data ?? []) as TrainingPlanRow[]).map(parseTrainingPlan);
}

export async function getTrainingPlanById(id: string): Promise<TrainingPlan | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("training_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? parseTrainingPlan(data as TrainingPlanRow) : null;
}

export async function getActiveTrainingPlanPreview(slug?: string | null): Promise<TrainingPlanPreview | null> {
  if (!slug) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("training_plans")
    .select("id,slug,title,focus,phase,weeks,summary,preview,target_distances")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as TrainingPlanRow;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    focus: row.focus,
    phase: row.phase,
    weeks: row.weeks,
    summary: row.summary,
    preview: row.preview,
    target_distances: parseTargetDistances(row.target_distances),
  };
}

function parseTrainingPlan(row: TrainingPlanRow): TrainingPlan {
  return {
    ...row,
    content: parseContent(row.content),
    target_distances: parseTargetDistances(row.target_distances),
  };
}

function parseContent(value: unknown): TrainingPlanContent {
  const parsed = trainingPlanContentSchema.safeParse(value);
  return parsed.success ? parsed.data : emptyTrainingPlanContent();
}

function parseTargetDistances(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is (typeof TARGET_DISTANCES)[number] =>
    TARGET_DISTANCES.includes(item as (typeof TARGET_DISTANCES)[number]),
  );
}
