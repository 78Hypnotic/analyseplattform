import "server-only";

import { requireCoachAccess } from "@/lib/auth/roles";
import type { AnalysisInput, AnalysisResult, StoredAnalysis } from "@/lib/analysis/types";

export type CoachAthleteSummary = {
  id: string;
  email: string;
  fullName: string;
  city: string | null;
  age: number | null;
  latestSwimAnalyzedAt: string | null;
  latestSwimTechniqueStatus: "rot" | "gelb" | "gruen" | null;
  latestSwimCssPaceSec: number | null;
  latestSwimVo2Proxy: "hoch" | "mittel" | "niedrig" | "nicht_ermittelbar" | null;
  latestSwimVlaProfile: "Diesel" | "Allrounder" | "Sprinter" | null;
};

export type CoachAthleteDetail = CoachAthleteSummary & {
  gender: "weiblich" | "maennlich" | "divers" | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  fitnessLevel: number | null;
  disciplines: string[];
  analyses: StoredAnalysis[];
};

type CoachAssignmentRow = {
  athlete_id: string;
};

type ProfileRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  city?: string | null;
  age?: number | null;
  gender?: "weiblich" | "maennlich" | "divers" | null;
  height_cm?: number | null;
  weight_kg?: number | string | null;
  body_fat_percentage?: number | string | null;
  fitness_level?: number | null;
  disciplines?: string[] | null;
  latest_swim_analyzed_at?: string | null;
  latest_swim_technique_status?: "rot" | "gelb" | "gruen" | null;
  latest_swim_css_pace_sec?: number | string | null;
  latest_swim_vo2_proxy?: "hoch" | "mittel" | "niedrig" | "nicht_ermittelbar" | null;
  latest_swim_vla_profile?: "Diesel" | "Allrounder" | "Sprinter" | null;
};

type AnalysisRow = {
  id: string;
  title: string;
  input: AnalysisInput;
  result: AnalysisResult;
  created_at: string;
  discipline?: "swim" | "run" | "bike" | null;
};

export async function getAssignedCoachAthletes(limit = 50): Promise<CoachAthleteSummary[]> {
  const { supabase, user, isCoach } = await requireCoachAccess();
  const assignmentQuery = supabase
    .from("coach_athletes")
    .select("athlete_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data: assignments, error: assignmentError } = isCoach
    ? await assignmentQuery.eq("coach_id", user.id)
    : await assignmentQuery;

  if (assignmentError) throw new Error(assignmentError.message);

  const athleteIds = Array.from(new Set(((assignments ?? []) as CoachAssignmentRow[]).map((row) => row.athlete_id)));
  if (athleteIds.length === 0) return [];

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id,email,full_name,city,age,latest_swim_analyzed_at,latest_swim_technique_status,latest_swim_css_pace_sec,latest_swim_vo2_proxy,latest_swim_vla_profile",
    )
    .in("id", athleteIds)
    .limit(athleteIds.length);

  if (error) throw new Error(error.message);

  const profileById = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));
  return athleteIds
    .map((id) => profileById.get(id))
    .filter((profile): profile is ProfileRow => Boolean(profile))
    .map(toAthleteSummary);
}

/**
 * Loads one assigned athlete with a limited report history for the coach detail page.
 * The assignment check is explicit so direct URL attempts fail before rendering data.
 */
export async function getCoachAthleteDetail(athleteId: string): Promise<CoachAthleteDetail | null> {
  const { supabase, user, isCoach } = await requireCoachAccess();

  if (isCoach) {
    const { data: assignment, error: assignmentError } = await supabase
      .from("coach_athletes")
      .select("athlete_id")
      .eq("coach_id", user.id)
      .eq("athlete_id", athleteId)
      .maybeSingle();

    if (assignmentError) throw new Error(assignmentError.message);
    if (!assignment) return null;
  }

  const [{ data: profile, error: profileError }, { data: analyses, error: analysesError }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id,email,full_name,city,age,gender,height_cm,weight_kg,body_fat_percentage,fitness_level,disciplines,latest_swim_analyzed_at,latest_swim_technique_status,latest_swim_css_pace_sec,latest_swim_vo2_proxy,latest_swim_vla_profile",
      )
      .eq("id", athleteId)
      .maybeSingle(),
    supabase
      .from("analyses")
      .select("id,title,input,result,created_at,discipline")
      .eq("user_id", athleteId)
      .eq("discipline", "swim")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (profileError) throw new Error(profileError.message);
  if (analysesError) throw new Error(analysesError.message);
  if (!profile) return null;

  const summary = toAthleteSummary(profile as ProfileRow);
  return {
    ...summary,
    gender: (profile as ProfileRow).gender ?? null,
    heightCm: (profile as ProfileRow).height_cm ?? null,
    weightKg: toNullableNumber((profile as ProfileRow).weight_kg),
    bodyFatPercentage: toNullableNumber((profile as ProfileRow).body_fat_percentage),
    fitnessLevel: (profile as ProfileRow).fitness_level ?? null,
    disciplines: (profile as ProfileRow).disciplines ?? [],
    analyses: ((analyses ?? []) as AnalysisRow[]).map((analysis) => ({
      id: analysis.id,
      title: analysis.title,
      input: analysis.input,
      result: analysis.result,
      created_at: analysis.created_at,
    })),
  };
}

function toAthleteSummary(profile: ProfileRow): CoachAthleteSummary {
  return {
    id: profile.id,
    email: profile.email ?? profile.id,
    fullName: profile.full_name || profile.email || "Athlet",
    city: profile.city ?? null,
    age: profile.age ?? null,
    latestSwimAnalyzedAt: profile.latest_swim_analyzed_at ?? null,
    latestSwimTechniqueStatus: profile.latest_swim_technique_status ?? null,
    latestSwimCssPaceSec: toNullableNumber(profile.latest_swim_css_pace_sec),
    latestSwimVo2Proxy: profile.latest_swim_vo2_proxy ?? null,
    latestSwimVlaProfile: profile.latest_swim_vla_profile ?? null,
  };
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}
