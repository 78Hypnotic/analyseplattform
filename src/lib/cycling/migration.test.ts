import { describe, expect, it } from "vitest";
import { runBikeAnalysis } from "./calculations";
import { DEFAULT_BIKE_INPUT } from "./constants";
import {
  buildBikeProfileMigrationUpdates,
  prepareBikeMigration,
  type BikeMigrationRow,
} from "./migration";

describe("bike model migration", () => {
  it("recomputes a current input and retains the previous result", () => {
    const row = createLegacyRow({ ...DEFAULT_BIKE_INPUT });
    const outcome = prepareBikeMigration(row);

    expect(outcome.status).toBe("migratable");
    expect(outcome.row.result.modelVersion).toBe("vlamax-dominance-v1");
    expect(outcome.row.result.legacySnapshot).toEqual(row.result);
  });

  it("normalizes the legacy ramp protocol from the stored PPO", () => {
    const input = { ...DEFAULT_BIKE_INPUT, rampLastStageWatt: 325, rampExtraSeconds: 9 };
    delete (input as Partial<typeof input>).oneMinPowerWatt;
    const row = createLegacyRow(input, 332.5);
    const outcome = prepareBikeMigration(row);

    expect(outcome.status).toBe("migratable");
    expect(outcome.row.input.oneMinPowerWatt).toBe(332.5);
    expect(outcome.row.input.rampLastStageWatt).toBe(325);
    expect(outcome.row.result.ppo).toBe(332.5);
  });

  it("keeps an out-of-range result as marked legacy data", () => {
    const row = createLegacyRow({ ...DEFAULT_BIKE_INPUT, oneMinPowerWatt: 438 });
    const outcome = prepareBikeMigration(row);

    expect(outcome.status).toBe("legacy");
    expect(outcome.row.result.modelVersion).toBe("legacy-laeq-v1");
    expect(outcome.row.result.migrationStatus).toBe("legacy_unmigratable");
    expect(outcome.row.result.migrationReason).toBe("vlamax_out_of_range");
    expect(outcome.row.result.projectedVlamax).toBeCloseTo(0.24801, 5);
  });

  it("skips rows already handled for the target model", () => {
    const input = { ...DEFAULT_BIKE_INPUT };
    const current = runBikeAnalysis(input);
    if (!current) throw new Error("Fixture must be valid");
    const row = createRow(input, current);

    expect(prepareBikeMigration(row).status).toBe("already_processed");
  });

  it("rebuilds only latest-bike profile fields and clears users without a valid result", () => {
    const valid = prepareBikeMigration(createLegacyRow({ ...DEFAULT_BIKE_INPUT }));
    const invalidSource = createLegacyRow({ ...DEFAULT_BIKE_INPUT, oneMinPowerWatt: 438 });
    const invalid = prepareBikeMigration({
      ...invalidSource,
      id: "33333333-3333-4333-8333-333333333333",
      user_id: "44444444-4444-4444-8444-444444444444",
    });
    const updates = buildBikeProfileMigrationUpdates([valid.row, invalid.row]);

    expect(updates[0].latest_bike_analysis_id).toBe(valid.row.id);
    expect(updates[0]).not.toHaveProperty("ftp_rad");
    expect(updates[0]).not.toHaveProperty("vo2max");
    expect(updates[0]).not.toHaveProperty("vlamax");
    expect(updates[1]).toMatchObject({
      id: invalid.row.user_id,
      latest_bike_analysis_id: null,
      latest_bike_ftp_watt: null,
      latest_bike_vlamax_proxy: null,
    });
  });
});

function createLegacyRow(input: Record<string, unknown>, storedPpo = 420): BikeMigrationRow {
  const current = runBikeAnalysis({ ...DEFAULT_BIKE_INPUT, oneMinPowerWatt: 420 });
  if (!current) throw new Error("Fixture must be valid");
  const legacyResult: Record<string, unknown> = { ...current, ppo: storedPpo };
  delete legacyResult.modelVersion;
  delete legacyResult.glycolyticDominance;
  return createRow(input, legacyResult);
}

function createRow(input: Record<string, unknown>, result: Record<string, unknown>): BikeMigrationRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "22222222-2222-4222-8222-222222222222",
    title: "Testanalyse",
    input,
    result,
    created_at: "2026-06-18T10:00:00.000Z",
    discipline: "bike",
  };
}
