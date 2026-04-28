"use server";

import { revalidatePath } from "next/cache";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { analysisInputSchema } from "@/lib/analysis/schema";
import { runAnalysis } from "@/lib/analysis/calculations";
import type { AnalysisInput } from "@/lib/analysis/types";
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

    revalidatePath("/profile");
    revalidatePath("/analyse");
    return { ok: true, id: data.id as string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyse konnte nicht gespeichert werden.";
    return { ok: false, reason: "error", message };
  }
}
