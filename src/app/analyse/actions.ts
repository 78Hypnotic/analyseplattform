"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { analysisInputSchema } from "@/lib/analysis/schema";
import { runAnalysis } from "@/lib/analysis/calculations";
import type { AnalysisInput, AnalysisResult } from "@/lib/analysis/types";
import { getAnalysisValidationMessages } from "@/lib/analysis/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateAnalysisState =
  | { ok: true; id: string }
  | { ok: false; message: string; reason?: "unauthenticated" | "validation" | "error" };

export async function createAnalysis(input: AnalysisInput): Promise<CreateAnalysisState> {
  try {
    await assertRateLimit("create-analysis", 10, 60_000);
    const parsed = analysisInputSchema.parse(input);
    const result = runAnalysis(parsed);

    if (!result) {
      const messages = getAnalysisValidationMessages(parsed);
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

    const title = `${parsed.name} · ${new Date().toLocaleDateString("de-DE")}`;
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
    });

    if (profileError) return { ok: false, reason: "error", message: profileError.message };

    const { data, error } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        title,
        input: parsed,
        result,
      })
      .select("id")
      .single();

    if (error) return { ok: false, reason: "error", message: error.message };

    const { error: latestProfileError } = await supabase
      .from("profiles")
      .update(buildLatestSwimProfileUpdate(data.id as string, result))
      .eq("id", user.id);

    if (latestProfileError) return { ok: false, reason: "error", message: latestProfileError.message };

    revalidatePath("/profile");
    revalidatePath("/analyse");
    return { ok: true, id: data.id as string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyse konnte nicht gespeichert werden.";
    return { ok: false, reason: "error", message };
  }
}

export async function deleteAnalysis(formData: FormData) {
  await assertRateLimit("delete-analysis", 10, 60_000);
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("latest_swim_analysis_id")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  if (profile?.latest_swim_analysis_id === id) {
    const { data: latestAnalysis, error: latestError } = await supabase
      .from("analyses")
      .select("id,result,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw new Error(latestError.message);

    const latestProfileUpdate = latestAnalysis
      ? buildLatestSwimProfileUpdate(
          latestAnalysis.id as string,
          latestAnalysis.result as AnalysisResult,
          latestAnalysis.created_at as string,
        )
      : buildEmptyLatestSwimProfileUpdate();

    const { error: profileError } = await supabase
      .from("profiles")
      .update(latestProfileUpdate)
      .eq("id", user.id);

    if (profileError) throw new Error(profileError.message);
  }

  revalidatePath("/analyse");
  revalidatePath(`/analyse/${id}`);
  revalidatePath("/profile");
}

function buildLatestSwimProfileUpdate(
  analysisId: string,
  result: AnalysisResult,
  analyzedAt = new Date().toISOString(),
) {
  return {
    latest_swim_analysis_id: analysisId,
    latest_swim_analyzed_at: analyzedAt,
    latest_swim_technique_status: result.techniqueGate.status,
    latest_swim_css_pace_sec: result.mode === "standard" ? result.cssPace : null,
    latest_swim_vo2_proxy: result.mode === "standard" ? result.vo2.level : null,
    latest_swim_vla_profile: result.mode === "standard" ? result.vla.profile : null,
  };
}

function buildEmptyLatestSwimProfileUpdate() {
  return {
    latest_swim_analysis_id: null,
    latest_swim_analyzed_at: null,
    latest_swim_technique_status: null,
    latest_swim_css_pace_sec: null,
    latest_swim_vo2_proxy: null,
    latest_swim_vla_profile: null,
  };
}
