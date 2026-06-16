"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { bikeInputSchema } from "@/lib/cycling/schema";
import { runBikeAnalysis } from "@/lib/cycling/calculations";
import type { BikeInput, BikeResult } from "@/lib/cycling/types";
import { getBikeValidationMessages } from "@/lib/cycling/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateBikeAnalysisState =
  | { ok: true; id: string }
  | { ok: false; message: string; reason?: "unauthenticated" | "validation" | "error" };

export async function createBikeAnalysis(input: BikeInput): Promise<CreateBikeAnalysisState> {
  try {
    await assertRateLimit("create-bike-analysis", 10, 60_000);
    const parsed = bikeInputSchema.parse(input);
    const result = runBikeAnalysis(parsed);

    if (!result) {
      const messages = getBikeValidationMessages(parsed);
      return {
        ok: false,
        reason: "validation",
        message: messages[0] ?? "Die Testdaten sind nicht plausibel.",
      };
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        reason: "unauthenticated",
        message: "Bitte melde dich an, um die Analyse zu speichern.",
      };
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("ftp_rad,vo2max,vlamax")
      .eq("id", user.id)
      .maybeSingle();

    const title = `${parsed.name} · Rad · ${new Date().toLocaleDateString("de-DE")}`;
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      full_name: parsed.name,
      age: parsed.age,
      gender: parsed.gender,
      height_cm: parsed.height,
      weight_kg: parsed.weight,
      body_fat_percentage: parsed.bodyFatPercentage ?? null,
      fitness_level: parsed.fitnessLevel ?? null,
      // Auto-suggest derived performance fields only when not already set.
      ...buildProfileSuggestion(existingProfile, result),
    });

    if (profileError) return { ok: false, reason: "error", message: profileError.message };

    const { data, error } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        discipline: "bike",
        title,
        input: parsed,
        result,
      })
      .select("id")
      .single();

    if (error) return { ok: false, reason: "error", message: error.message };

    const { error: latestProfileError } = await supabase
      .from("profiles")
      .update(buildLatestBikeProfileUpdate(data.id as string, result))
      .eq("id", user.id);

    if (latestProfileError) return { ok: false, reason: "error", message: latestProfileError.message };

    revalidatePath("/profile");
    revalidatePath("/rad");
    return { ok: true, id: data.id as string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyse konnte nicht gespeichert werden.";
    return { ok: false, reason: "error", message };
  }
}

export async function deleteBikeAnalysis(formData: FormData) {
  await assertRateLimit("delete-bike-analysis", 10, 60_000);
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("latest_bike_analysis_id")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("discipline", "bike");

  if (error) throw new Error(error.message);

  if (profile?.latest_bike_analysis_id === id) {
    const { data: latestAnalysis, error: latestError } = await supabase
      .from("analyses")
      .select("id,result,created_at")
      .eq("user_id", user.id)
      .eq("discipline", "bike")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw new Error(latestError.message);

    const latestProfileUpdate = latestAnalysis
      ? buildLatestBikeProfileUpdate(
          latestAnalysis.id as string,
          latestAnalysis.result as BikeResult,
          latestAnalysis.created_at as string,
        )
      : buildEmptyLatestBikeProfileUpdate();

    const { error: profileError } = await supabase
      .from("profiles")
      .update(latestProfileUpdate)
      .eq("id", user.id);

    if (profileError) throw new Error(profileError.message);
  }

  revalidatePath("/rad");
  revalidatePath(`/rad/${id}`);
  revalidatePath("/profile");
}

type ExistingProfileFields = {
  ftp_rad?: number | null;
  vo2max?: number | string | null;
  vlamax?: number | string | null;
};

function buildProfileSuggestion(existing: ExistingProfileFields | null, result: BikeResult) {
  const suggestion: Record<string, number> = {};
  if (isEmpty(existing?.ftp_rad)) suggestion.ftp_rad = Math.round(result.ftpWatt);
  if (isEmpty(existing?.vo2max)) suggestion.vo2max = Math.round(result.vo2rel * 10) / 10;
  if (isEmpty(existing?.vlamax)) suggestion.vlamax = Math.round(result.vlamaxProxy * 100) / 100;
  return suggestion;
}

function isEmpty(value: number | string | null | undefined) {
  return value === null || value === undefined || value === "";
}

function buildLatestBikeProfileUpdate(
  analysisId: string,
  result: BikeResult,
  analyzedAt = new Date().toISOString(),
) {
  return {
    latest_bike_analysis_id: analysisId,
    latest_bike_analyzed_at: analyzedAt,
    latest_bike_ftp_watt: Math.round(result.ftpWatt),
    latest_bike_vo2max_rel: Math.round(result.vo2rel * 10) / 10,
    latest_bike_vlamax_proxy: Math.round(result.vlamaxProxy * 100) / 100,
  };
}

function buildEmptyLatestBikeProfileUpdate() {
  return {
    latest_bike_analysis_id: null,
    latest_bike_analyzed_at: null,
    latest_bike_ftp_watt: null,
    latest_bike_vo2max_rel: null,
    latest_bike_vlamax_proxy: null,
  };
}
