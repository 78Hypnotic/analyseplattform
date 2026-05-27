"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/roles";
import { assertRateLimit } from "@/lib/rate-limit/server";

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["user", "coach"]),
});

const assignmentSchema = z
  .object({
    coachId: z.string().uuid(),
    athleteId: z.string().uuid(),
  })
  .refine((value) => value.coachId !== value.athleteId, {
    message: "Coach und Athlet mussen unterschiedliche Nutzer sein.",
  });

export async function setCoachRole(formData: FormData) {
  await assertRateLimit("admin-coach-role", 30, 60_000);
  const { supabase, user } = await requireAdmin();
  const parsed = roleSchema.parse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (parsed.userId === user.id) {
    throw new Error("Die eigene Admin-Rolle kann hier nicht geandert werden.");
  }

  const { error: currentRoleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", parsed.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (currentRoleError) throw new Error(currentRoleError.message);

  if (parsed.role === "coach") {
    const { error } = await supabase.from("user_roles").insert({
      user_id: parsed.userId,
      role: "coach",
    });

    if (error && error.code !== "23505") throw new Error(error.message);
  }

  if (parsed.role === "user") {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", parsed.userId)
      .eq("role", "coach");

    if (error) throw new Error(error.message);

    const { error: assignmentError } = await supabase
      .from("coach_athletes")
      .delete()
      .eq("coach_id", parsed.userId);

    if (assignmentError) throw new Error(assignmentError.message);
  }

  revalidateCoachAdminPaths();
}

export async function assignAthleteToCoach(formData: FormData) {
  await assertRateLimit("admin-coach-assignment-create", 30, 60_000);
  const { supabase, user } = await requireAdmin();
  const parsed = assignmentSchema.parse({
    coachId: formData.get("coachId"),
    athleteId: formData.get("athleteId"),
  });

  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("user_id,role")
    .in("user_id", [parsed.coachId, parsed.athleteId]);

  if (roleError) throw new Error(roleError.message);

  const coachHasRole = roles?.some((role) => role.user_id === parsed.coachId && role.role === "coach");

  if (!coachHasRole) throw new Error("Der ausgewahlte Nutzer ist kein Coach.");

  const { error } = await supabase.from("coach_athletes").insert({
    coach_id: parsed.coachId,
    athlete_id: parsed.athleteId,
    created_by: user.id,
  });

  if (error && error.code !== "23505") throw new Error(error.message);

  revalidateCoachAdminPaths();
}

export async function removeCoachAssignment(formData: FormData) {
  await assertRateLimit("admin-coach-assignment-delete", 30, 60_000);
  const { supabase } = await requireAdmin();
  const parsed = assignmentSchema.parse({
    coachId: formData.get("coachId"),
    athleteId: formData.get("athleteId"),
  });

  const { error } = await supabase
    .from("coach_athletes")
    .delete()
    .eq("coach_id", parsed.coachId)
    .eq("athlete_id", parsed.athleteId);

  if (error) throw new Error(error.message);

  revalidateCoachAdminPaths();
}

function revalidateCoachAdminPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/coaches");
  revalidatePath("/coach");
}
