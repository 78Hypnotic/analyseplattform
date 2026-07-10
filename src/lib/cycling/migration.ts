import {
  computeGlycolytic,
  computePvo2,
  computeVlamaxProxy,
  isVlamaxInCalibratedRange,
  runBikeAnalysis,
} from "./calculations";
import { BIKE_MODEL_VERSION, LEGACY_BIKE_MODEL_VERSION } from "./constants";
import { bikeInputSchema } from "./schema";
import type { BikeInput, BikeMigrationReason, CurrentBikeResult } from "./types";

export type BikeMigrationRow = {
  id: string;
  user_id: string;
  title: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  created_at: string;
  discipline: "bike";
};

export type BikeMigrationOutcome =
  | { status: "already_processed"; row: BikeMigrationRow }
  | { status: "migratable"; row: BikeMigrationRow; result: CurrentBikeResult }
  | { status: "legacy"; row: BikeMigrationRow; reason: BikeMigrationReason };

export type BikeProfileMigrationUpdate = {
  id: string;
  latest_bike_analysis_id: string | null;
  latest_bike_analyzed_at: string | null;
  latest_bike_ftp_watt: number | null;
  latest_bike_vo2max_rel: number | null;
  latest_bike_vlamax_proxy: number | null;
};

/**
 * Normalizes legacy inputs, evaluates the dominance model, and returns either
 * a complete current result or a metadata-only Legacy update that preserves
 * the historical metrics.
 */
export function prepareBikeMigration(row: BikeMigrationRow): BikeMigrationOutcome {
  if (
    row.result.modelVersion === BIKE_MODEL_VERSION ||
    row.result.migrationTargetVersion === BIKE_MODEL_VERSION
  ) {
    return { status: "already_processed", row };
  }

  const normalized = normalizeBikeInput(row.input, row.result);
  if (!normalized) {
    return legacyOutcome(row, row.input, "invalid_input");
  }

  const { pgly } = computeGlycolytic(
    normalized.calculationInput.sprintPeakWatt,
    normalized.calculationInput.sprintAvg20sWatt,
  );
  const pvo2 = computePvo2(normalized.calculationInput.oneMinPowerWatt);
  const { glycolyticDominance, vlamaxProxy } = computeVlamaxProxy(pgly, pvo2);

  if (!isVlamaxInCalibratedRange(vlamaxProxy)) {
    return legacyOutcome(
      row,
      normalized.storedInput,
      "vlamax_out_of_range",
      glycolyticDominance,
      vlamaxProxy,
    );
  }

  const result = runBikeAnalysis(normalized.calculationInput);
  if (!result) {
    return legacyOutcome(
      row,
      normalized.storedInput,
      "calculation_failed",
      glycolyticDominance,
      vlamaxProxy,
    );
  }

  const migratedResult: CurrentBikeResult = {
    ...result,
    legacySnapshot: row.result,
  };
  return {
    status: "migratable",
    result: migratedResult,
    row: { ...row, input: normalized.storedInput, result: migratedResult },
  };
}

export function buildBikeProfileMigrationUpdates(
  rows: BikeMigrationRow[],
): BikeProfileMigrationUpdate[] {
  const rowsByUser = new Map<string, BikeMigrationRow[]>();
  for (const row of rows) {
    rowsByUser.set(row.user_id, [...(rowsByUser.get(row.user_id) ?? []), row]);
  }

  return Array.from(rowsByUser, ([id, userRows]) => {
    const latest = userRows
      .filter((row) => row.result.modelVersion === BIKE_MODEL_VERSION)
      .sort((left, right) => right.created_at.localeCompare(left.created_at))[0];
    if (!latest) return emptyProfileUpdate(id);

    const ftpWatt = toFinitePositiveNumber(latest.result.ftpWatt);
    const vo2rel = toFinitePositiveNumber(latest.result.vo2rel);
    const vlamaxProxy = toFinitePositiveNumber(latest.result.vlamaxProxy);
    if (ftpWatt === null || vo2rel === null || vlamaxProxy === null) return emptyProfileUpdate(id);

    return {
      id,
      latest_bike_analysis_id: latest.id,
      latest_bike_analyzed_at: latest.created_at,
      latest_bike_ftp_watt: Math.round(ftpWatt),
      latest_bike_vo2max_rel: Math.round(vo2rel * 10) / 10,
      latest_bike_vlamax_proxy: Math.round(vlamaxProxy * 100) / 100,
    };
  });
}

function normalizeBikeInput(
  input: Record<string, unknown>,
  result: Record<string, unknown>,
): { calculationInput: BikeInput; storedInput: Record<string, unknown> } | null {
  const enteredOneMinutePower = toFinitePositiveNumber(input.oneMinPowerWatt);
  const storedPpo = toFinitePositiveNumber(result.ppo);
  const oneMinPowerWatt = enteredOneMinutePower ?? storedPpo;
  if (oneMinPowerWatt === null) return null;

  const parsed = bikeInputSchema.safeParse({
    ...input,
    oneMinPowerWatt: Math.round(oneMinPowerWatt),
  });
  if (!parsed.success) return null;

  return {
    calculationInput: { ...parsed.data, oneMinPowerWatt },
    storedInput: { ...input, oneMinPowerWatt },
  };
}

function legacyOutcome(
  row: BikeMigrationRow,
  input: Record<string, unknown>,
  reason: BikeMigrationReason,
  glycolyticDominance?: number,
  projectedVlamax?: number,
): BikeMigrationOutcome {
  const legacyResult = {
    ...row.result,
    modelVersion: LEGACY_BIKE_MODEL_VERSION,
    migrationStatus: "legacy_unmigratable",
    migrationTargetVersion: BIKE_MODEL_VERSION,
    migrationReason: reason,
    ...(Number.isFinite(glycolyticDominance) ? { glycolyticDominance } : {}),
    ...(Number.isFinite(projectedVlamax) ? { projectedVlamax } : {}),
  };
  return {
    status: "legacy",
    reason,
    row: { ...row, input, result: legacyResult },
  };
}

function toFinitePositiveNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function emptyProfileUpdate(id: string): BikeProfileMigrationUpdate {
  return {
    id,
    latest_bike_analysis_id: null,
    latest_bike_analyzed_at: null,
    latest_bike_ftp_watt: null,
    latest_bike_vo2max_rel: null,
    latest_bike_vlamax_proxy: null,
  };
}
