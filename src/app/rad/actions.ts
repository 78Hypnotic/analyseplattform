"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { shouldRefreshLatestAnalysis } from "@/lib/analysis-mutation-policy";
import { getAthleteMutationContext, getEditableAnalysis } from "@/lib/coach-mutations";
import { runBikeAnalysis } from "@/lib/cycling/calculations";
import { bikeInputSchema } from "@/lib/cycling/schema";
import type { BikeInput, BikeResult } from "@/lib/cycling/types";
import { getBikeValidationMessages } from "@/lib/cycling/validation";
import { assertRateLimit } from "@/lib/rate-limit/server";

export type CreateBikeAnalysisState =
  | { ok: true; id: string }
  | { ok: false; message: string; reason?: "unauthenticated" | "validation" | "error" };

export type BikeAnalysisMutationOptions = {
  athleteId?: string;
  analysisId?: string;
};

const mutationOptionsSchema = z.object({
  athleteId: z.string().uuid().optional(),
  analysisId: z.string().uuid().optional(),
});

/**
 * Creates or recalculates a bike analysis for the current user or an assigned athlete.
 */
export async function createBikeAnalysis(
  input: BikeInput,
  options: BikeAnalysisMutationOptions = {},
): Promise<CreateBikeAnalysisState> {
  try {
    await assertRateLimit("create-bike-analysis", 10, 60_000);
    const parsed = bikeInputSchema.parse(input);
    const parsedOptions = mutationOptionsSchema.parse(options);
    const result = runBikeAnalysis(parsed);

    if (!result) {
      const messages = getBikeValidationMessages(parsed);
      return {
        ok: false,
        reason: "validation",
        message: messages[0] ?? "Die Testdaten sind nicht plausibel.",
      };
    }

    const context = await getAthleteMutationContext(parsedOptions.athleteId);
    if (!context) {
      return {
        ok: false,
        reason: "unauthenticated",
        message: "Bitte melde dich an, um die Analyse zu speichern.",
      };
    }

    const { data: profile, error: profileReadError } = await context.supabase
      .from("profiles")
      .select("ftp_rad,vo2max,vlamax,latest_bike_analysis_id")
      .eq("id", context.athleteId)
      .maybeSingle();
    if (profileReadError) return { ok: false, reason: "error", message: profileReadError.message };

    let analysisDate = new Date();
    if (parsedOptions.analysisId) {
      const { data: existing, error: existingError } = await context.supabase
        .from("analyses")
        .select("user_id,discipline,created_at")
        .eq("id", parsedOptions.analysisId)
        .maybeSingle();
      if (existingError) return { ok: false, reason: "error", message: existingError.message };
      if (!existing || existing.user_id !== context.athleteId || existing.discipline !== "bike") {
        return {
          ok: false,
          reason: "error",
          message: "Analyse wurde nicht gefunden oder darf nicht bearbeitet werden.",
        };
      }
      analysisDate = new Date(existing.created_at as string);
    }

    const title = `${parsed.name} · Rad · ${analysisDate.toLocaleDateString("de-DE")}`;
    const { data: updatedProfile, error: profileError } = await context.supabase
      .from("profiles")
      .update({
        full_name: parsed.name,
        age: parsed.age,
        gender: parsed.gender,
        height_cm: parsed.height,
        weight_kg: parsed.weight,
        body_fat_percentage: parsed.bodyFatPercentage ?? null,
        fitness_level: parsed.fitnessLevel ?? null,
        ...buildProfileSuggestion(profile, result),
      })
      .eq("id", context.athleteId)
      .select("id")
      .single();
    if (profileError || !updatedProfile) {
      return {
        ok: false,
        reason: "error",
        message: profileError?.message ?? "Athletenprofil wurde nicht gefunden.",
      };
    }

    const analysisQuery = context.supabase.from("analyses");
    const { data, error } = parsedOptions.analysisId
      ? await analysisQuery
          .update({ title, input: parsed, result })
          .eq("id", parsedOptions.analysisId)
          .eq("user_id", context.athleteId)
          .eq("discipline", "bike")
          .select("id")
          .single()
      : await analysisQuery
          .insert({
            user_id: context.athleteId,
            discipline: "bike",
            title,
            input: parsed,
            result,
          })
          .select("id")
          .single();
    if (error || !data) return { ok: false, reason: "error", message: error?.message ?? "Analyse konnte nicht gespeichert werden." };

    const shouldRefreshLatest = shouldRefreshLatestAnalysis({
      analysisId: parsedOptions.analysisId,
      latestAnalysisId: profile?.latest_bike_analysis_id as string | null | undefined,
    });
    if (shouldRefreshLatest) {
      const { error: latestProfileError } = await context.supabase
        .from("profiles")
        .update(buildLatestBikeProfileUpdate(data.id as string, result))
        .eq("id", context.athleteId);
      if (latestProfileError) return { ok: false, reason: "error", message: latestProfileError.message };
    }

    revalidateAnalysisPaths(context.athleteId, data.id as string);
    return { ok: true, id: data.id as string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyse konnte nicht gespeichert werden.";
    return { ok: false, reason: "error", message };
  }
}

export async function deleteBikeAnalysis(formData: FormData) {
  await assertRateLimit("delete-bike-analysis", 10, 60_000);
  const id = z.string().uuid().parse(formData.get("id"));
  const editable = await getEditableAnalysis<BikeInput>(id, "bike");
  if (!editable) return;

  const context = await getAthleteMutationContext(editable.userId);
  if (!context) return;

  const { data: profile } = await context.supabase
    .from("profiles")
    .select("latest_bike_analysis_id")
    .eq("id", context.athleteId)
    .maybeSingle();

  const { error } = await context.supabase
    .from("analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", context.athleteId)
    .eq("discipline", "bike");
  if (error) throw new Error(error.message);

  if (profile?.latest_bike_analysis_id === id) {
    const { data: latestAnalysis, error: latestError } = await context.supabase
      .from("analyses")
      .select("id,result,created_at")
      .eq("user_id", context.athleteId)
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

    const { error: profileError } = await context.supabase
      .from("profiles")
      .update(latestProfileUpdate)
      .eq("id", context.athleteId);
    if (profileError) throw new Error(profileError.message);
  }

  revalidateAnalysisPaths(context.athleteId, id);
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

function revalidateAnalysisPaths(athleteId: string, analysisId: string) {
  revalidatePath("/rad");
  revalidatePath(`/rad/${analysisId}`);
  revalidatePath("/profile");
  revalidatePath("/coach");
  revalidatePath(`/coach/athletes/${athleteId}`);
}
