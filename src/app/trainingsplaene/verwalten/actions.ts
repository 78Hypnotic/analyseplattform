"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCoachAccess } from "@/lib/auth/roles";
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
    const { supabase, user, isAdmin } = await requireCoachAccess();
    const parsed = parseTrainingPlanForm(formData);

    if (!parsed.success) {
      return { message: parsed.error.issues[0]?.message ?? "Plan konnte nicht gespeichert werden." };
    }

    const payload = {
      discipline: parsed.data.discipline,
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
      is_active: false,
    };

    if (parsed.data.id) {
      const { data: existing, error: existingError } = await supabase
        .from("training_plans")
        .select("created_by,is_active")
        .eq("id", parsed.data.id)
        .maybeSingle();

      if (existingError) return { message: existingError.message };
      if (!existing || (!isAdmin && existing.created_by !== user.id)) {
        return { message: "Du darfst diesen Plan nicht bearbeiten." };
      }

      const { error } = await supabase
        .from("training_plans")
        .update({ ...payload, is_active: existing.is_active })
        .eq("id", parsed.data.id);

      if (error) return { message: error.message };

      revalidatePath("/admin");
      revalidatePath("/trainingsplaene");
      revalidatePath("/trainingsplaene/verwalten");
      revalidatePath(`/trainingsplaene/verwalten/${parsed.data.id}`);
      revalidatePath("/analyse");
      return { message: "Plan gespeichert." };
    }

    const { data, error } = await supabase
      .from("training_plans")
      .insert({ ...payload, created_by: user.id })
      .select("id")
      .single();

    if (error) return { message: error.message };

    revalidatePath("/admin");
    revalidatePath("/trainingsplaene");
    revalidatePath("/trainingsplaene/verwalten");
    revalidatePath("/analyse");
    redirectTo = `/trainingsplaene/verwalten/${data.id}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Plan konnte nicht gespeichert werden.";
    return { message };
  }

  if (redirectTo) redirect(redirectTo);
  return { message: "Plan gespeichert." };
}

export async function publishTrainingPlan(formData: FormData) {
  await assertRateLimit("training-plan-publish", 10, 60_000);
  const { supabase, user, isAdmin } = await requireCoachAccess();
  const id = z.string().uuid().parse(formData.get("id"));

  const { data: plan, error: planError } = await supabase
    .from("training_plans")
    .select("created_by")
    .eq("id", id)
    .maybeSingle();

  if (planError) throw new Error(planError.message);
  if (!plan || (!isAdmin && plan.created_by !== user.id)) {
    throw new Error("Du darfst diesen Plan nicht veröffentlichen.");
  }

  const { error } = await supabase.rpc("publish_training_plan", { target_plan_id: id });
  if (error) throw new Error(error.message);

  revalidatePath("/trainingsplaene");
  revalidatePath("/trainingsplaene/verwalten");
  revalidatePath(`/trainingsplaene/verwalten/${id}`);
  revalidatePath("/admin");
  revalidatePath("/analyse");
}

export async function deleteTrainingPlan(formData: FormData) {
  await assertRateLimit("training-plan-delete", 10, 60_000);
  const { supabase, user, isAdmin } = await requireCoachAccess();
  const id = z.string().uuid().parse(formData.get("id"));

  const { data: plan, error: planError } = await supabase
    .from("training_plans")
    .select("created_by")
    .eq("id", id)
    .maybeSingle();

  if (planError) throw new Error(planError.message);
  if (!plan || (!isAdmin && plan.created_by !== user.id)) {
    throw new Error("Du darfst diesen Plan nicht löschen.");
  }

  const { error } = await supabase.from("training_plans").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/trainingsplaene");
  revalidatePath("/trainingsplaene/verwalten");
  revalidatePath("/analyse");
  redirect("/trainingsplaene/verwalten");
}

function parseTrainingPlanForm(formData: FormData) {
  return trainingPlanSchema.safeParse({
    id: emptyToUndefined(formData.get("id")),
    discipline: formData.get("discipline"),
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
    is_active: formData.get("is_active") === "true",
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
