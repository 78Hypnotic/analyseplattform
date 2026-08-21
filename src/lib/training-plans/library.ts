import "server-only";

import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseTrainingPlanContent } from "./content";
import type {
  TrainingPlanVersion,
  TrainingPlanVersionSummary,
} from "./types";

export type PlanLibrary = {
  id: string;
  slug: string;
  coachId: string;
  coachName: string;
  name: string;
  description: string;
  isActive: boolean;
};

export type TrainingPlanLibraryHome =
  | { kind: "signed-out" }
  | { kind: "locked" }
  | { kind: "member"; library: PlanLibrary; versions: TrainingPlanVersionSummary[] }
  | { kind: "coach"; library: PlanLibrary | null; versions: TrainingPlanVersionSummary[] }
  | {
      kind: "admin";
      libraries: PlanLibrary[];
      selectedLibrary: PlanLibrary | null;
      versions: TrainingPlanVersionSummary[];
    };

export type TrainingPlanSelectionState =
  | { kind: "available" }
  | { kind: "active-plan-exists" }
  | { kind: "unavailable"; reason: "signed-out" | "not-in-library" | "membership-required" };

type LibraryRow = {
  id: string;
  slug: string;
  coach_id: string;
  name: string;
  description: string;
  is_active: boolean;
};

type LibraryVersionRow = {
  training_plan_version_id: string;
  sort_order: number;
};

type VersionSummaryRow = Omit<TrainingPlanVersionSummary, "target_distances"> & {
  target_distances: unknown;
};

type VersionRow = Omit<TrainingPlanVersion, "content" | "target_distances"> & {
  content: unknown;
  target_distances: unknown;
};

const VERSION_SUMMARY_COLUMNS =
  "id,training_plan_id,version_number,discipline,slug,title,focus,phase,level,target_distances,weeks,summary,target_technique_axis,published_by,published_at";

export async function getTrainingPlanLibraryHome(
  selectedLibraryId?: string,
): Promise<TrainingPlanLibraryHome> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { kind: "signed-out" };

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roleError) throw new Error(roleError.message);
  const roles = (roleRows ?? []).map((row) => row.role);

  if (roles.includes("admin")) {
    const { data, error } = await supabase
      .from("coach_plan_libraries")
      .select("id,slug,coach_id,name,description,is_active")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    const libraries = await enrichLibraries((data ?? []) as LibraryRow[]);
    const selectedLibrary = libraries.find((library) => library.id === selectedLibraryId) ?? null;
    return {
      kind: "admin",
      libraries,
      selectedLibrary,
      versions: selectedLibrary ? await getLibraryVersions(selectedLibrary.id) : [],
    };
  }

  if (roles.includes("coach")) {
    const { data, error } = await supabase
      .from("coach_plan_libraries")
      .select("id,slug,coach_id,name,description,is_active")
      .eq("coach_id", user.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return { kind: "coach", library: null, versions: [] };

    const library = (await enrichLibraries([data as LibraryRow]))[0] ?? null;
    return {
      kind: "coach",
      library,
      versions: library ? await getLibraryVersions(library.id) : [],
    };
  }

  const now = new Date().toISOString();
  const { data: membership, error: membershipError } = await supabase
    .from("group_coaching_memberships")
    .select("library_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .lte("valid_from", now)
    .or(`valid_until.is.null,valid_until.gt.${now}`)
    .limit(1)
    .maybeSingle();

  if (membershipError) throw new Error(membershipError.message);
  if (!membership) return { kind: "locked" };

  const { data: libraryData, error: libraryError } = await supabase
    .from("coach_plan_libraries")
    .select("id,slug,coach_id,name,description,is_active")
    .eq("id", membership.library_id)
    .eq("is_active", true)
    .maybeSingle();

  if (libraryError) throw new Error(libraryError.message);
  if (!libraryData) return { kind: "locked" };

  const library = (await enrichLibraries([libraryData as LibraryRow]))[0];
  if (!library) return { kind: "locked" };

  return { kind: "member", library, versions: await getLibraryVersions(library.id) };
}

export async function getAccessibleTrainingPlanVersionById(
  id: string,
): Promise<TrainingPlanVersion | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("training_plan_versions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as VersionRow;
  return {
    ...row,
    target_distances: parseTargetDistances(row.target_distances),
    content: parseTrainingPlanContent(row.content),
  };
}

async function getLibraryVersions(libraryId: string) {
  return getCachedLibraryVersions(libraryId);
}

const getCachedLibraryVersions = unstable_cache(
  async (libraryId: string) => {
    const admin = createSupabaseAdminClient();
    const { data: links, error: linksError } = await admin
      .from("coach_library_versions")
      .select("training_plan_version_id,sort_order")
      .eq("library_id", libraryId)
      .order("sort_order", { ascending: true });

    if (linksError) throw new Error(linksError.message);
    const linkRows = (links ?? []) as LibraryVersionRow[];
    if (linkRows.length === 0) return [];

    const { data: versions, error: versionsError } = await admin
      .from("training_plan_versions")
      .select(VERSION_SUMMARY_COLUMNS)
      .in("id", linkRows.map((link) => link.training_plan_version_id));

    if (versionsError) throw new Error(versionsError.message);
    const byId = new Map(
      ((versions ?? []) as VersionSummaryRow[]).map((version) => [
        version.id,
        { ...version, target_distances: parseTargetDistances(version.target_distances) },
      ]),
    );

    return linkRows
      .map((link) => byId.get(link.training_plan_version_id))
      .filter((version): version is TrainingPlanVersionSummary => Boolean(version));
  },
  ["training-plan-library-versions"],
  { revalidate: 30, tags: ["training-plan-library"] },
);

async function enrichLibraries(rows: LibraryRow[]) {
  if (rows.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const coachIds = Array.from(new Set(rows.map((row) => row.coach_id)));
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .in("id", coachIds);

  if (error) throw new Error(error.message);
  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.full_name || profile.email || "Coach"]),
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    coachId: row.coach_id,
    coachName: profileById.get(row.coach_id) ?? "Coach",
    name: row.name,
    description: row.description,
    isActive: row.is_active,
  }));
}

function parseTargetDistances(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is TrainingPlanVersion["target_distances"][number] =>
    ["Sprint", "OD", "MD", "LD", "Becken", "Freiwasser"].includes(String(item)),
  );
}

export async function getTrainingPlanSelectionState(
  versionId: string,
): Promise<TrainingPlanSelectionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { kind: "unavailable", reason: "signed-out" };

  const { data: existingPlan, error: existingPlanError } = await supabase
    .from("user_training_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("discipline", "swim")
    .in("status", ["setup_required", "active", "paused"])
    .limit(1)
    .maybeSingle();

  if (existingPlanError) throw new Error(existingPlanError.message);
  if (existingPlan) return { kind: "active-plan-exists" };

  const { data: libraryLink, error: linkError } = await supabase
    .from("coach_library_versions")
    .select("library_id")
    .eq("training_plan_version_id", versionId)
    .maybeSingle();

  if (linkError) throw new Error(linkError.message);
  if (!libraryLink) return { kind: "unavailable", reason: "not-in-library" };

  const now = new Date().toISOString();
  const { data: membership, error: membershipError } = await supabase
    .from("group_coaching_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("library_id", libraryLink.library_id)
    .eq("status", "active")
    .lte("valid_from", now)
    .or(`valid_until.is.null,valid_until.gt.${now}`)
    .maybeSingle();

  if (membershipError) throw new Error(membershipError.message);
  return membership
    ? { kind: "available" }
    : { kind: "unavailable", reason: "membership-required" };
}
