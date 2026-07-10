"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/roles";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BIKE_MODEL_VERSION, LEGACY_BIKE_MODEL_VERSION } from "@/lib/cycling/constants";
import {
  buildBikeProfileMigrationUpdates,
  prepareBikeMigration,
  type BikeMigrationRow,
} from "@/lib/cycling/migration";

const BATCH_SIZE = 50;
const READ_PAGE_SIZE = 200;
const confirmationSchema = z.literal(BIKE_MODEL_VERSION);
const migrationRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  input: z.record(z.string(), z.unknown()),
  result: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  discipline: z.literal("bike"),
});

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export type BikeMigrationPreview = {
  total: number;
  current: number;
  legacy: number;
  migratable: number;
  unmigratable: number;
  remaining: number;
};

export type BikeMigrationActionState = BikeMigrationPreview & {
  message: string | null;
  success: boolean;
  failedIds: string[];
};

export async function getBikeModelMigrationPreview(): Promise<BikeMigrationPreview> {
  await requireAdmin();
  const rows = await fetchBikeMigrationRows(createSupabaseAdminClient());
  return buildPreview(rows);
}

/**
 * Migrates at most one bounded batch and finalizes latest profile summaries
 * only after every bike analysis has either reached the current model or has
 * been marked as an unmigratable legacy snapshot.
 */
export async function runBikeModelMigrationBatch(
  previousState: BikeMigrationActionState,
  formData: FormData,
): Promise<BikeMigrationActionState> {
  await assertRateLimit("admin-bike-model-migration", 5, 60_000);
  await requireAdmin();

  const confirmation = confirmationSchema.safeParse(formData.get("confirmation"));
  if (!confirmation.success) {
    return { ...previousState, success: false, message: "Bitte bestätige die Modellmigration.", failedIds: [] };
  }

  const admin = createSupabaseAdminClient();
  const rows = await fetchBikeMigrationRows(admin);
  const outcomes = rows.map(prepareBikeMigration);
  const pending = outcomes.filter((outcome) => outcome.status !== "already_processed").slice(0, BATCH_SIZE);

  if (pending.length === 0) {
    await refreshLatestBikeProfiles(admin, rows);
    return { ...buildPreview(rows), success: true, message: "Die Modellmigration ist bereits abgeschlossen.", failedIds: [] };
  }

  const updates = pending.map((outcome) => outcome.row);
  const { error } = await admin.from("analyses").upsert(
    updates.map(toAnalysisUpsert),
    { onConflict: "id" },
  );
  if (error) {
    return {
      ...buildPreview(rows),
      success: false,
      message: error.message,
      failedIds: updates.map((row) => row.id),
    };
  }

  const updatedById = new Map(updates.map((row) => [row.id, row]));
  const updatedRows = rows.map((row) => updatedById.get(row.id) ?? row);
  const preview = buildPreview(updatedRows);

  if (preview.remaining === 0) {
    await refreshLatestBikeProfiles(admin, updatedRows);
    revalidateBikePaths();
  }

  return {
    ...preview,
    success: true,
    message: preview.remaining === 0
      ? `Migration abgeschlossen: ${preview.current} aktuell, ${preview.legacy} Legacy.`
      : `${updates.length} Analysen verarbeitet. ${preview.remaining} sind noch offen.`,
    failedIds: [],
  };
}

async function fetchBikeMigrationRows(admin: AdminClient): Promise<BikeMigrationRow[]> {
  const rows: BikeMigrationRow[] = [];
  for (let from = 0; ; from += READ_PAGE_SIZE) {
    const { data, error } = await admin
      .from("analyses")
      .select("id,user_id,title,input,result,created_at,discipline")
      .eq("discipline", "bike")
      .order("created_at", { ascending: true })
      .range(from, from + READ_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);

    const page = migrationRowSchema.array().parse(data ?? []);
    rows.push(...page);
    if (page.length < READ_PAGE_SIZE) return rows;
  }
}

function buildPreview(rows: BikeMigrationRow[]): BikeMigrationPreview {
  const outcomes = rows.map(prepareBikeMigration);
  const current = rows.filter((row) => row.result.modelVersion === BIKE_MODEL_VERSION).length;
  const legacy = rows.filter(
    (row) =>
      row.result.modelVersion === LEGACY_BIKE_MODEL_VERSION &&
      row.result.migrationTargetVersion === BIKE_MODEL_VERSION,
  ).length;
  const migratable = outcomes.filter((outcome) => outcome.status === "migratable").length;
  const unmigratable = outcomes.filter((outcome) => outcome.status === "legacy").length;
  return {
    total: rows.length,
    current,
    legacy,
    migratable,
    unmigratable,
    remaining: migratable + unmigratable,
  };
}

async function refreshLatestBikeProfiles(admin: AdminClient, rows: BikeMigrationRow[]) {
  const profileUpdates = buildBikeProfileMigrationUpdates(rows);
  if (profileUpdates.length === 0) return;
  const { error } = await admin.from("profiles").upsert(profileUpdates, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

function toAnalysisUpsert(row: BikeMigrationRow) {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    input: row.input,
    result: row.result,
    created_at: row.created_at,
    discipline: row.discipline,
  };
}

function revalidateBikePaths() {
  revalidatePath("/admin/methodik");
  revalidatePath("/profile");
  revalidatePath("/rad");
}
