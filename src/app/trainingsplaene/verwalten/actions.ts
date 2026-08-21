"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { TechniqueProfileGroup } from "@/lib/analysis/types";
import { requireCoachAccess } from "@/lib/auth/roles";
import { assertRateLimit } from "@/lib/rate-limit/server";
import {
  assertPublishableTrainingPlanContent,
  isStructuredTrainingPlanContent,
  parseTrainingPlanContent,
} from "@/lib/training-plans/content";
import {
  formatTrainingPlanValidationError,
  trainingPlanSchema,
  type TrainingPlanFieldName,
} from "@/lib/training-plans/schema";

export type TrainingPlanActionState = {
  message?: string;
  status?: "success" | "error";
  fieldErrors?: Partial<Record<TrainingPlanFieldName, string>>;
  savedTargetTechniqueAxis?: TechniqueProfileGroup | null;
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
      const feedback = formatTrainingPlanValidationError(parsed.error);
      return {
        ...feedback,
        status: "error",
      };
    }

    const payload = {
      discipline: parsed.data.discipline,
      slug: parsed.data.slug,
      title: parsed.data.title,
      focus: parsed.data.focus,
      phase: parsed.data.phase,
      level: parsed.data.level,
      target_distances: parsed.data.target_distances,
      summary: parsed.data.summary,
      preview: parsed.data.preview,
      target_technique_axis: parsed.data.target_technique_axis,
      content: parsed.data.content,
      content_schema_version: isStructuredTrainingPlanContent(parsed.data.content) ? 2 : 1,
      weeks: parsed.data.content.weeks.length,
      is_active: false,
    };

    if (parsed.data.id) {
      const { data: existing, error: existingError } = await supabase
        .from("training_plans")
        .select("created_by,is_active")
        .eq("id", parsed.data.id)
        .maybeSingle();

      if (existingError) return { message: existingError.message, status: "error" };
      if (!existing || (!isAdmin && existing.created_by !== user.id)) {
        return { message: "Du darfst diesen Plan nicht bearbeiten.", status: "error" };
      }

      const { data: savedPlan, error } = await supabase
        .from("training_plans")
        .update({ ...payload, is_active: existing.is_active })
        .eq("id", parsed.data.id)
        .select("target_technique_axis")
        .single();

      if (error) return { message: error.message, status: "error" };

      revalidatePath("/admin");
      updateTag("training-plan-library");
      revalidatePath("/trainingsplaene");
      revalidatePath("/trainingsplaene/verwalten");
      revalidatePath(`/trainingsplaene/verwalten/${parsed.data.id}`);
      revalidatePath("/analyse");
      return {
        message: "Plan gespeichert.",
        status: "success",
        savedTargetTechniqueAxis: savedPlan.target_technique_axis as TechniqueProfileGroup | null,
      };
    }

    const { data, error } = await supabase
      .from("training_plans")
      .insert({ ...payload, created_by: user.id })
      .select("id")
      .single();

    if (error) return { message: error.message, status: "error" };

    revalidatePath("/admin");
    updateTag("training-plan-library");
    revalidatePath("/trainingsplaene");
    revalidatePath("/trainingsplaene/verwalten");
    revalidatePath("/analyse");
    redirectTo = `/trainingsplaene/verwalten/${data.id}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Plan konnte nicht gespeichert werden.";
    return { message, status: "error" };
  }

  if (redirectTo) redirect(redirectTo);
  return { message: "Plan gespeichert.", status: "success" };
}

export async function publishTrainingPlan(formData: FormData) {
  await assertRateLimit("training-plan-publish", 10, 60_000);
  const { supabase, user, isAdmin } = await requireCoachAccess();
  const id = z.string().uuid().parse(formData.get("id"));

  const { data: plan, error: planError } = await supabase
    .from("training_plans")
    .select("created_by, content")
    .eq("id", id)
    .maybeSingle();

  if (planError) throw new Error(planError.message);
  if (!plan || (!isAdmin && plan.created_by !== user.id)) {
    throw new Error("Du darfst diesen Plan nicht veröffentlichen.");
  }

  assertPublishableTrainingPlanContent(parseTrainingPlanContent(plan.content));

  const { error } = await supabase.rpc("publish_training_plan", { target_plan_id: id });
  if (error) throw new Error(error.message);

  revalidatePath("/trainingsplaene");
  updateTag("training-plan-library");
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
  updateTag("training-plan-library");
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
    target_technique_axis: emptyToNull(formData.get("target_technique_axis")),
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

function emptyToNull(value: FormDataEntryValue | null) {
  return value === "" || value === null ? null : value;
}
