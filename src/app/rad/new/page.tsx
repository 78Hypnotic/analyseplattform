import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { AppHeader } from "@/components/app-header";
import { getAthleteMutationContext, getEditableAnalysis } from "@/lib/coach-mutations";
import type { BikeInput } from "@/lib/cycling/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InitialBikeInput } from "./cycling-flow";
import { CyclingFlow } from "./cycling-flow";

export const dynamic = "force-dynamic";

type ProfileData = {
  full_name?: string | null;
  age?: number | null;
  gender?: "weiblich" | "maennlich" | "divers" | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  body_fat_percentage?: number | string | null;
  fitness_level?: number | null;
};

type AnalysisSearchParams = {
  resume?: string | string[];
  athlete?: string | string[];
  edit?: string | string[];
};

export default async function NewBikeAnalysisPage({
  searchParams,
}: {
  searchParams?: Promise<AnalysisSearchParams>;
}) {
  const params = await searchParams;
  const resume = getSingleParam(params?.resume) === "1";
  const athleteId = parseOptionalUuid(getSingleParam(params?.athlete));
  const analysisId = parseOptionalUuid(getSingleParam(params?.edit));
  const context = await getInitialBikeContext(athleteId, analysisId);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <CyclingFlow
          initialInput={context.initialInput}
          isAuthenticated={context.isAuthenticated}
          resumePendingAnalysis={resume}
          athleteId={context.athleteId}
          analysisId={context.analysisId}
        />
      </main>
    </>
  );
}

/**
 * Resolves self, assigned-athlete and edit contexts without trusting URL parameters.
 */
async function getInitialBikeContext(
  athleteId?: string,
  analysisId?: string,
): Promise<{
  initialInput?: InitialBikeInput;
  isAuthenticated: boolean;
  athleteId?: string;
  analysisId?: string;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (athleteId || analysisId) redirect("/login");
    return { isAuthenticated: false };
  }

  if (analysisId) {
    const editable = await getEditableAnalysis<BikeInput>(analysisId, "bike");
    if (!editable || (athleteId && editable.userId !== athleteId)) notFound();
    return {
      isAuthenticated: true,
      initialInput: editable.input,
      athleteId: editable.userId === user.id ? undefined : editable.userId,
      analysisId: editable.id,
    };
  }

  const target = await getAthleteMutationContext(athleteId);
  if (!target) redirect("/login");

  const { data, error } = await target.supabase
    .from("profiles")
    .select("full_name,age,gender,height_cm,weight_kg,body_fat_percentage,fitness_level")
    .eq("id", target.athleteId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const profile = data as ProfileData | null;
  return {
    isAuthenticated: true,
    athleteId: target.isActingForAthlete ? target.athleteId : undefined,
    initialInput: profile ? toInitialInput(profile) : undefined,
  };
}

function toInitialInput(profile: ProfileData): InitialBikeInput {
  return {
    name: profile.full_name ?? "",
    age: toOptionalInteger(profile.age),
    gender: profile.gender ?? "",
    height: toOptionalInteger(profile.height_cm),
    weight: toOptionalInteger(profile.weight_kg),
    bodyFatPercentage: toOptionalNumber(profile.body_fat_percentage),
    fitnessLevel: toOptionalFitnessLevel(profile.fitness_level),
  };
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseOptionalUuid(value: string | undefined) {
  if (!value) return undefined;
  const parsed = z.string().uuid().safeParse(value);
  if (!parsed.success) notFound();
  return parsed.data;
}

function toOptionalInteger(value: number | null | undefined): number | "" {
  return typeof value === "number" ? value : "";
}

function toOptionalNumber(value: number | string | null | undefined): number | "" {
  if (value === null || value === undefined) return "";
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : "";
}

function toOptionalFitnessLevel(value: number | null | undefined): number | "" {
  if (typeof value !== "number") return "";
  if (value <= 5) return value;
  return Math.min(5, Math.max(1, Math.round(value / 2)));
}
