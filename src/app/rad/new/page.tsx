import { AppHeader } from "@/components/app-header";
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

export default async function NewBikeAnalysisPage({
  searchParams,
}: {
  searchParams?: Promise<{ resume?: string | string[] }>;
}) {
  const params = await searchParams;
  const resume = Array.isArray(params?.resume) ? params.resume[0] === "1" : params?.resume === "1";
  const { initialInput, isAuthenticated } = await getInitialBikeContext();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <CyclingFlow
          initialInput={initialInput}
          isAuthenticated={isAuthenticated}
          resumePendingAnalysis={resume}
        />
      </main>
    </>
  );
}

async function getInitialBikeContext(): Promise<{
  initialInput?: InitialBikeInput;
  isAuthenticated: boolean;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { isAuthenticated: false };

  const { data } = await supabase
    .from("profiles")
    .select("full_name,age,gender,height_cm,weight_kg,body_fat_percentage,fitness_level")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as ProfileData | null;
  if (!profile) return { isAuthenticated: true };

  return {
    isAuthenticated: true,
    initialInput: {
      name: profile.full_name ?? "",
      age: toOptionalInteger(profile.age),
      gender: profile.gender ?? "",
      height: toOptionalInteger(profile.height_cm),
      weight: toOptionalInteger(profile.weight_kg),
      bodyFatPercentage: toOptionalNumber(profile.body_fat_percentage),
      fitnessLevel: toOptionalFitnessLevel(profile.fitness_level),
    },
  };
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
