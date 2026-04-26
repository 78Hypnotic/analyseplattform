"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/roles";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { trainingPlanSchema } from "@/lib/training-plans/schema";

export type TrainingPlanActionState = {
  message?: string;
};

/**
 * Validates and persists the full plan builder payload from the admin UI.
 * The hidden JSON field is intentionally parsed on the server so direct
 * Server Action posts cannot bypass schema validation.
 */
export async function saveTrainingPlan(
  _previousState: TrainingPlanActionState,
  formData: FormData,
): Promise<TrainingPlanActionState> {
  let redirectTo: string | null = null;

  try {
    await assertRateLimit("admin-training-plan-save", 20, 60_000);
    const { supabase, user } = await requireAdmin();
    const parsed = parseTrainingPlanForm(formData);

    if (!parsed.success) {
      return { message: parsed.error.issues[0]?.message ?? "Plan konnte nicht gespeichert werden." };
    }

    const payload = {
      slug: parsed.data.slug,
      title: parsed.data.title,
      focus: parsed.data.focus,
      phase: parsed.data.phase,
      level: parsed.data.level,
      target_distances: parsed.data.target_distances,
      weeks: parsed.data.weeks,
      summary: parsed.data.summary,
      preview: parsed.data.preview,
      content: parsed.data.content,
      is_active: parsed.data.is_active,
      created_by: user.id,
    };

    if (parsed.data.id) {
      const { error } = await supabase
        .from("training_plans")
        .update(payload)
        .eq("id", parsed.data.id);

      if (error) return { message: error.message };

      revalidatePath("/admin");
      revalidatePath("/admin/plans");
      revalidatePath(`/admin/plans/${parsed.data.id}`);
      revalidatePath("/analyse");
      return { message: "Plan gespeichert." };
    }

    const { data, error } = await supabase
      .from("training_plans")
      .insert(payload)
      .select("id")
      .single();

    if (error) return { message: error.message };

    revalidatePath("/admin");
    revalidatePath("/admin/plans");
    revalidatePath("/analyse");
    redirectTo = `/admin/plans/${data.id}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Plan konnte nicht gespeichert werden.";
    return { message };
  }

  if (redirectTo) redirect(redirectTo);
  return { message: "Plan gespeichert." };
}

export async function toggleTrainingPlan(formData: FormData) {
  await assertRateLimit("admin-training-plan-toggle", 30, 60_000);
  const { supabase } = await requireAdmin();
  const parsed = z
    .object({
      id: z.string().uuid(),
      is_active: z.enum(["true", "false"]),
    })
    .parse({
      id: formData.get("id"),
      is_active: formData.get("is_active"),
    });

  await supabase
    .from("training_plans")
    .update({ is_active: parsed.is_active === "true" })
    .eq("id", parsed.id);

  revalidatePath("/admin");
  revalidatePath("/admin/plans");
  revalidatePath("/analyse");
}

export async function deleteTrainingPlan(formData: FormData) {
  await assertRateLimit("admin-training-plan-delete", 10, 60_000);
  const { supabase } = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));

  await supabase.from("training_plans").delete().eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/plans");
  revalidatePath("/analyse");
  redirect("/admin/plans");
}

function parseTrainingPlanForm(formData: FormData) {
  return trainingPlanSchema.safeParse({
    id: emptyToUndefined(formData.get("id")),
    slug: formData.get("slug"),
    title: formData.get("title"),
    focus: formData.get("focus"),
    phase: formData.get("phase"),
    level: formData.get("level"),
    target_distances: formData.getAll("target_distances"),
    weeks: formData.get("weeks"),
    summary: formData.get("summary"),
    preview: formData.get("preview"),
    content: parseJson(formData.get("content")),
    is_active: formData.get("is_active") === "on",
  });
}

function parseJson(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function emptyToUndefined(value: FormDataEntryValue | null) {
  return value === "" ? undefined : value;
}
