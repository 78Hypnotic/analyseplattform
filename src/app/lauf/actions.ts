"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { shouldRefreshLatestAnalysis } from "@/lib/analysis-mutation-policy";
import { getAthleteMutationContext, getEditableAnalysis } from "@/lib/coach-mutations";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { runRunningAnalysis } from "@/lib/running/calculations";
import { runInputSchema } from "@/lib/running/schema";
import type { RunInput, RunResult } from "@/lib/running/types";
import { getRunValidationMessages } from "@/lib/running/validation";

export type CreateRunAnalysisState =
  | { ok: true; id: string }
  | { ok: false; message: string; reason?: "unauthenticated" | "validation" | "error" };

export type RunAnalysisMutationOptions = {
  athleteId?: string;
  analysisId?: string;
};

const mutationOptionsSchema = z.object({
  athleteId: z.string().uuid().optional(),
  analysisId: z.string().uuid().optional(),
});

/**
 * Creates or recalculates a running analysis for the current user or an assigned athlete.
 */
export async function createRunAnalysis(
  input: RunInput,
  options: RunAnalysisMutationOptions = {},
): Promise<CreateRunAnalysisState> {
  try {
    await assertRateLimit("create-run-analysis", 10, 60_000);
    const parsed = runInputSchema.parse(input);
    const parsedOptions = mutationOptionsSchema.parse(options);
    const result = runRunningAnalysis(parsed);

    if (!result) {
      const messages = getRunValidationMessages(parsed);
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
      .select("latest_run_analysis_id")
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
      if (!existing || existing.user_id !== context.athleteId || existing.discipline !== "run") {
        return {
          ok: false,
          reason: "error",
          message: "Analyse wurde nicht gefunden oder darf nicht bearbeitet werden.",
        };
      }
      analysisDate = new Date(existing.created_at as string);
    }

    const title = `${parsed.name} · Lauf · ${analysisDate.toLocaleDateString("de-DE")}`;
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
          .eq("discipline", "run")
          .select("id")
          .single()
      : await analysisQuery
          .insert({
            user_id: context.athleteId,
            discipline: "run",
            title,
            input: parsed,
            result,
          })
          .select("id")
          .single();
    if (error || !data) return { ok: false, reason: "error", message: error?.message ?? "Analyse konnte nicht gespeichert werden." };

    const shouldRefreshLatest = shouldRefreshLatestAnalysis({
      analysisId: parsedOptions.analysisId,
      latestAnalysisId: profile?.latest_run_analysis_id as string | null | undefined,
    });
    if (shouldRefreshLatest) {
      const { error: latestProfileError } = await context.supabase
        .from("profiles")
        .update(buildLatestRunProfileUpdate(data.id as string, result))
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

export async function deleteRunAnalysis(formData: FormData) {
  await assertRateLimit("delete-run-analysis", 10, 60_000);
  const id = z.string().uuid().parse(formData.get("id"));
  const editable = await getEditableAnalysis<RunInput>(id, "run");
  if (!editable) return;

  const context = await getAthleteMutationContext(editable.userId);
  if (!context) return;

  const { data: profile } = await context.supabase
    .from("profiles")
    .select("latest_run_analysis_id")
    .eq("id", context.athleteId)
    .maybeSingle();

  const { error } = await context.supabase
    .from("analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", context.athleteId)
    .eq("discipline", "run");
  if (error) throw new Error(error.message);

  if (profile?.latest_run_analysis_id === id) {
    const { data: latestAnalysis, error: latestError } = await context.supabase
      .from("analyses")
      .select("id,result,created_at")
      .eq("user_id", context.athleteId)
      .eq("discipline", "run")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestError) throw new Error(latestError.message);

    const latestProfileUpdate = latestAnalysis
      ? buildLatestRunProfileUpdate(
          latestAnalysis.id as string,
          latestAnalysis.result as RunResult,
          latestAnalysis.created_at as string,
        )
      : buildEmptyLatestRunProfileUpdate();

    const { error: profileError } = await context.supabase
      .from("profiles")
      .update(latestProfileUpdate)
      .eq("id", context.athleteId);
    if (profileError) throw new Error(profileError.message);
  }

  revalidateAnalysisPaths(context.athleteId, id);
}

function buildLatestRunProfileUpdate(
  analysisId: string,
  result: RunResult,
  analyzedAt = new Date().toISOString(),
) {
  return {
    latest_run_analysis_id: analysisId,
    latest_run_analyzed_at: analyzedAt,
    latest_run_cs_pace_sec: Number.isFinite(result.csPaceSecPerKm)
      ? Math.round(result.csPaceSecPerKm * 10) / 10
      : null,
    latest_run_api: result.api.score,
    latest_run_aci: result.aci.score,
  };
}

function buildEmptyLatestRunProfileUpdate() {
  return {
    latest_run_analysis_id: null,
    latest_run_analyzed_at: null,
    latest_run_cs_pace_sec: null,
    latest_run_api: null,
    latest_run_aci: null,
  };
}

function revalidateAnalysisPaths(athleteId: string, analysisId: string) {
  revalidatePath("/lauf");
  revalidatePath(`/lauf/${analysisId}`);
  revalidatePath("/profile");
  revalidatePath("/coach");
  revalidatePath(`/coach/athletes/${athleteId}`);
}
