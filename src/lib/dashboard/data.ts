import "server-only";

import type {
  DashboardAnalysis,
  DashboardHomeProps,
  DashboardProfile,
  DashboardTrainingPlan,
} from "@/components/dashboard-home";
import { buildTechniqueProfile } from "@/lib/analysis/calculations";
import type { TechniqueProfileGroup } from "@/lib/analysis/types";
import { listRecentCommunityUpdates } from "@/lib/community/communities";
import {
  buildDashboardImprovements,
  type DashboardImprovementAnalysisRow,
} from "@/lib/dashboard/improvements";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseTrainingPlanContent } from "@/lib/training-plans/content";

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

type ImprovementAnalysisRow = DashboardImprovementAnalysisRow;

type SwimAnalysisInputRow = {
  input: unknown;
};

type ActiveTrainingPlanRow = {
  id: string;
  discipline: DashboardTrainingPlan["discipline"];
  start_date: string;
  training_plan_version_id: string;
};

type TrainingPlanVersionRow = {
  title: string;
  focus: string;
  weeks: number;
  content: unknown;
  target_technique_axis: TechniqueProfileGroup | null;
};

type UserPlanSessionRow = {
  week_index: number;
  session_index: number;
  status: "scheduled" | "completed" | "skipped";
  sequence: number;
  scheduled_for: string;
};

export async function getAuthenticatedHomeData(): Promise<DashboardHomeProps | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date().toISOString();
  const [
    profileResult,
    analysesResult,
    latestSwimResult,
    activePlanResult,
    membershipResult,
    rolesResult,
    improvementAnalysesResult,
    communityUpdates,
  ] = await Promise.all([
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
      .select("id,discipline,start_date,training_plan_version_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("group_coaching_memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .lte("valid_from", now)
      .or(`valid_until.is.null,valid_until.gt.${now}`)
      .limit(1)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase
      .from("analyses")
      .select("discipline,result,created_at")
      .eq("user_id", user.id)
      .in("discipline", ["swim", "run", "bike"])
      .order("created_at", { ascending: false })
      .limit(100),
    listRecentCommunityUpdates(4),
  ]);

  if (profileResult.error) throw new Error(profileResult.error.message);
  if (analysesResult.error) throw new Error(analysesResult.error.message);
  if (latestSwimResult.error) throw new Error(latestSwimResult.error.message);
  if (activePlanResult.error) throw new Error(activePlanResult.error.message);
  if (membershipResult.error) throw new Error(membershipResult.error.message);
  if (rolesResult.error) throw new Error(rolesResult.error.message);
  if (improvementAnalysesResult.error) throw new Error(improvementAnalysesResult.error.message);

  const activePlanRow = activePlanResult.data as ActiveTrainingPlanRow | null;
  let activeTrainingPlan: DashboardTrainingPlan | null = null;

  if (activePlanRow) {
    const [versionResult, sessionResult] = await Promise.all([
      supabase
        .from("training_plan_versions")
        .select("title,focus,weeks,content,target_technique_axis")
        .eq("id", activePlanRow.training_plan_version_id)
        .maybeSingle(),
      supabase
        .from("user_plan_sessions")
        .select("week_index,session_index,status,sequence,scheduled_for")
        .eq("user_training_plan_id", activePlanRow.id)
        .order("sequence", { ascending: true }),
    ]);

    if (versionResult.error) throw new Error(versionResult.error.message);
    if (sessionResult.error) throw new Error(sessionResult.error.message);
    activeTrainingPlan = toActiveTrainingPlan(
      activePlanRow,
      versionResult.data as TrainingPlanVersionRow | null,
      (sessionResult.data ?? []) as UserPlanSessionRow[],
    );
  }

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
    improvements: buildDashboardImprovements((improvementAnalysesResult.data ?? []) as ImprovementAnalysisRow[]),
    swimTechniqueAxes: toTechniqueAxes((latestSwimResult.data as SwimAnalysisInputRow | null)?.input),
    activeTrainingPlan,
    trainingPlanAccess: isAdmin
      ? "admin"
      : isCoach
        ? "coach"
        : membershipResult.data
          ? "member"
          : "locked",
    communityUpdates,
    isCoach,
    isAdmin,
    coachAthleteCount,
  };
}

function toActiveTrainingPlan(
  row: ActiveTrainingPlanRow,
  version: TrainingPlanVersionRow | null,
  sessions: UserPlanSessionRow[],
): DashboardTrainingPlan | null {
  if (!version || !row.start_date) return null;

  const content = parseTrainingPlanContent(version.content);
  const next = sessions.find((session) => session.status === "scheduled") ?? null;
  const workout = next
    ? content.weeks[next.week_index]?.sessions[next.session_index]
    : null;

  return {
    id: row.id,
    versionId: row.training_plan_version_id,
    title: version.title,
    focus: version.focus,
    weeks: version.weeks,
    discipline: row.discipline,
    startDate: row.start_date,
    completedSessions: sessions.filter((session) => session.status === "completed").length,
    totalSessions: sessions.length,
    nextSession: next
      ? {
          title: workout?.title ?? "Geplante Einheit",
          focus: workout?.focus ?? version.focus,
          scheduledFor: next.scheduled_for,
        }
      : null,
    targetTechniqueAxis: version.target_technique_axis,
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