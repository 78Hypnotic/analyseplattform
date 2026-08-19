import "server-only";

import type {
  DashboardAnalysis,
  DashboardHomeProps,
  DashboardProfile,
  DashboardTrainingPlan,
} from "@/components/dashboard-home";
import { buildTechniqueProfile } from "@/lib/analysis/calculations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = {
  full_name?: string | null;
  city?: string | null;
  age?: number | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | string | null;
  fitness_level?: number | null;
  disciplines?: string[] | null;
  latest_swim_analyzed_at?: string | null;
  latest_swim_css_pace_sec?: number | string | null;
  latest_run_analyzed_at?: string | null;
  latest_run_cs_pace_sec?: number | string | null;
  latest_bike_analyzed_at?: string | null;
  latest_bike_ftp_watt?: number | null;
};

type AnalysisRow = {
  id: string;
  title: string;
  discipline: DashboardAnalysis["discipline"];
  created_at: string;
};

type SwimAnalysisInputRow = {
  input: unknown;
};

type ActiveTrainingPlanRow = {
  id: string;
  discipline: DashboardTrainingPlan["discipline"];
  start_date: string;
  training_plan_versions: {
    title: string;
    focus: string;
    weeks: number;
  } | null;
};

export async function getAuthenticatedHomeData(): Promise<DashboardHomeProps | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profileResult, analysesResult, latestSwimResult, activePlanResult, rolesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name,city,age,gender,height_cm,weight_kg,fitness_level,disciplines,latest_swim_analyzed_at,latest_swim_css_pace_sec,latest_run_analyzed_at,latest_run_cs_pace_sec,latest_bike_analyzed_at,latest_bike_ftp_watt",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("analyses")
      .select("id,title,discipline,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("analyses")
      .select("input")
      .eq("user_id", user.id)
      .eq("discipline", "swim")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_training_plans")
      .select("id,discipline,start_date,training_plan_versions(title,focus,weeks)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  if (profileResult.error) throw new Error(profileResult.error.message);
  if (analysesResult.error) throw new Error(analysesResult.error.message);
  if (latestSwimResult.error) throw new Error(latestSwimResult.error.message);
  if (activePlanResult.error) throw new Error(activePlanResult.error.message);
  if (rolesResult.error) throw new Error(rolesResult.error.message);

  const roleValues = (rolesResult.data ?? []).map((row) => row.role);
  const isCoach = roleValues.includes("coach");
  const isAdmin = roleValues.includes("admin");
  let coachAthleteCount = 0;

  if (isCoach) {
    const { count, error } = await supabase
      .from("coach_athletes")
      .select("athlete_id", { count: "exact", head: true })
      .eq("coach_id", user.id);

    if (error) throw new Error(error.message);
    coachAthleteCount = count ?? 0;
  }

  const profileRow = profileResult.data as ProfileRow | null;
  const metadataName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;

  return {
    profile: toDashboardProfile(profileRow, metadataName),
    analyses: ((analysesResult.data ?? []) as AnalysisRow[]).map((analysis) => ({
      id: analysis.id,
      title: analysis.title,
      discipline: analysis.discipline,
      createdAt: analysis.created_at,
    })),
    swimTechniqueAxes: toTechniqueAxes((latestSwimResult.data as SwimAnalysisInputRow | null)?.input),
    activeTrainingPlan: toActiveTrainingPlan(activePlanResult.data as ActiveTrainingPlanRow | null),
    isCoach,
    isAdmin,
    coachAthleteCount,
  };
}

function toActiveTrainingPlan(row: ActiveTrainingPlanRow | null): DashboardTrainingPlan | null {
  const version = row?.training_plan_versions;
  if (!row || !version || !row.start_date) return null;

  return {
    id: row.id,
    title: version.title,
    focus: version.focus,
    weeks: version.weeks,
    discipline: row.discipline,
    startDate: row.start_date,
  };
}

function toTechniqueAxes(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const challenges = (value as { challenges?: unknown }).challenges;
  if (!Array.isArray(challenges)) return null;

  return buildTechniqueProfile(
    challenges.filter((challenge): challenge is string => typeof challenge === "string"),
  );
}

function toDashboardProfile(row: ProfileRow | null, metadataName: string | null): DashboardProfile {
  const fullName = row?.full_name || metadataName;

  return {
    fullName,
    city: row?.city ?? null,
    age: row?.age ?? null,
    heightCm: row?.height_cm ?? null,
    weightKg: toNullableNumber(row?.weight_kg),
    fitnessLevel: row?.fitness_level ?? null,
    disciplines: row?.disciplines ?? [],
    isComplete: Boolean(
      fullName
      && row?.age
      && row.gender
      && row.height_cm
      && toNullableNumber(row.weight_kg),
    ),
    latestSwimAnalyzedAt: row?.latest_swim_analyzed_at ?? null,
    latestSwimCssPaceSec: toNullableNumber(row?.latest_swim_css_pace_sec),
    latestRunAnalyzedAt: row?.latest_run_analyzed_at ?? null,
    latestRunCsPaceSec: toNullableNumber(row?.latest_run_cs_pace_sec),
    latestBikeAnalyzedAt: row?.latest_bike_analyzed_at ?? null,
    latestBikeFtpWatt: row?.latest_bike_ftp_watt ?? null,
  };
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}