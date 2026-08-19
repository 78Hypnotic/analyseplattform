"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActivatePlanState = {
  status?: "error";
  message?: string;
};

const activationSchema = z.object({
  versionId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekdays: z.array(z.coerce.number().int().min(1).max(7)).min(1).max(7),
});

export async function activateTrainingPlan(
  _previousState: ActivatePlanState,
  formData: FormData,
): Promise<ActivatePlanState> {
  await assertRateLimit("activate-library-training-plan", 5, 60_000);
  const parsed = activationSchema.safeParse({
    versionId: formData.get("versionId"),
    startDate: formData.get("startDate"),
    weekdays: formData.getAll("weekdays"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Bitte Startdatum und Trainingstage vollständig auswählen." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Bitte melde dich erneut an." };

  const { error } = await supabase.rpc("activate_library_training_plan", {
    target_version_id: parsed.data.versionId,
    plan_start_date: parsed.data.startDate,
    selected_weekdays: parsed.data.weekdays,
  });

  if (error) return { status: "error", message: error.message };
  redirect("/");
}