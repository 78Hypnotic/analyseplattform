"use server";

import { revalidatePath } from "next/cache";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { analysisInputSchema } from "@/lib/analysis/schema";
import { runAnalysis } from "@/lib/analysis/calculations";
import type { AnalysisInput } from "@/lib/analysis/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateAnalysisState =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createAnalysis(input: AnalysisInput): Promise<CreateAnalysisState> {
  try {
    await assertRateLimit("create-analysis", 10, 60_000);
    const parsed = analysisInputSchema.parse(input);
    const result = runAnalysis(parsed);

    if (!result) {
      return { ok: false, message: "Die Testdaten sind nicht plausibel." };
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, message: "Bitte melde dich an, um die Analyse zu speichern." };
    }

    const title = `${parsed.name} · ${new Date().toLocaleDateString("de-DE")}`;
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

    if (error) return { ok: false, message: error.message };

    revalidatePath("/dashboard");
    return { ok: true, id: data.id as string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyse konnte nicht gespeichert werden.";
    return { ok: false, message };
  }
}
