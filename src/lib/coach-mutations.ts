import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/auth/roles";
import { canMutateAthlete } from "@/lib/coach-access-policy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MutationContext = {
  supabase: SupabaseClient;
  user: User;
  athleteId: string;
  isActingForAthlete: boolean;
};

export type EditableAnalysis<TInput> = {
  id: string;
  userId: string;
  discipline: "swim" | "run" | "bike";
  input: TInput;
};

export async function getAthleteMutationContext(
  requestedAthleteId?: string,
): Promise<MutationContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const athleteId = requestedAthleteId ?? user.id;
  await assertAthleteMutationAccess(supabase, user, athleteId);

  return {
    supabase,
    user,
    athleteId,
    isActingForAthlete: athleteId !== user.id,
  };
}

export async function getEditableAnalysis<TInput>(
  analysisId: string,
  expectedDiscipline: "swim" | "run" | "bike",
): Promise<EditableAnalysis<TInput> | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("analyses")
    .select("id,user_id,discipline,input")
    .eq("id", analysisId)
    .eq("discipline", expectedDiscipline)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  await assertAthleteMutationAccess(supabase, user, data.user_id as string);

  return {
    id: data.id as string,
    userId: data.user_id as string,
    discipline: data.discipline as "swim" | "run" | "bike",
    input: data.input as TInput,
  };
}

async function assertAthleteMutationAccess(
  supabase: SupabaseClient,
  user: User,
  athleteId: string,
) {
  if (athleteId === user.id) return;

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .limit(3);

  if (roleError) throw new Error(roleError.message);

  const roles = new Set((roleRows ?? []).map((row) => row.role as AppRole));
  if (roles.has("admin")) return;
  if (!roles.has("coach")) throw new Error("Keine Berechtigung für diesen Athleten.");

  const { data: assignment, error: assignmentError } = await supabase
    .from("coach_athletes")
    .select("athlete_id")
    .eq("coach_id", user.id)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  if (assignmentError) throw new Error(assignmentError.message);
  if (!canMutateAthlete({
    actorId: user.id,
    athleteId,
    roles,
    isAssigned: Boolean(assignment),
  })) {
    throw new Error("Der Athlet ist diesem Coach nicht zugeordnet.");
  }
}
