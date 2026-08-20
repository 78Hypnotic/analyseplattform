import { describe, expect, it } from "vitest";
import { workoutContentSchema } from "./schema";
import { convertWorkoutAxisMode, createEmptyWorkoutContent, getWorkoutAxisMode } from "./content";
import { resolveWorkoutTargets } from "./workout-targets";
import type { AthleteBenchmarkSnapshot, WorkoutContent } from "./types";

const workout: WorkoutContent = {
  schemaVersion: 1,
  discipline: "bike",
  blocks: [
    {
      id: "block-1",
      title: "VO2max Intervalle",
      kind: "interval",
      repeatCount: 1,
      steps: [
        {
          id: "step-1",
          title: "Belastung",
          duration: { type: "time", seconds: 300 },
          targets: [
            { type: "threshold_power_percentage", minPercent: 105, maxPercent: 110 },
            { type: "max_heart_rate_percentage", minPercent: 90 },
            { type: "vo2max_power_percentage", minPercent: 95, maxPercent: 100 },
          ],
          recoverySeconds: 180,
        },
      ],
    },
  ],
};

describe("workoutContentSchema", () => {
  it("accepts relative FTP, HFmax and VO2max power targets", () => {
    expect(workoutContentSchema.safeParse(workout).success).toBe(true);
  });

  it("rejects inverted percentage target ranges", () => {
    const result = workoutContentSchema.safeParse({
      ...workout,
      blocks: [
        {
          ...workout.blocks[0],
          steps: [
            {
              ...workout.blocks[0].steps[0],
              targets: [{ type: "threshold_power_percentage", minPercent: 110, maxPercent: 100 }],
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("treats existing workouts without an axis mode as time based", () => {
    expect(getWorkoutAxisMode(workout)).toBe("time");
    expect(workoutContentSchema.safeParse(workout).success).toBe(true);
  });

  it("requires every step to match the workout axis mode", () => {
    expect(workoutContentSchema.safeParse({ ...workout, axisMode: "distance" }).success).toBe(false);
  });

  it("converts steps to editable defaults when the axis mode changes", () => {
    const distanceWorkout = convertWorkoutAxisMode(createEmptyWorkoutContent("bike"), "distance");

    expect(distanceWorkout.axisMode).toBe("distance");
    expect(distanceWorkout.blocks[0].steps[0].duration).toEqual({ type: "distance", meters: 2000 });
    expect(distanceWorkout.blocks[1].steps[0].duration).toEqual({ type: "distance", meters: 1000 });
    expect(workoutContentSchema.safeParse(distanceWorkout).success).toBe(true);
  });
});

describe("resolveWorkoutTargets", () => {
  it("resolves relative athlete targets to concrete values", () => {
    const benchmarks: AthleteBenchmarkSnapshot = {
      discipline: "bike",
      thresholdPowerWatts: 280,
      maxHeartRateBpm: 190,
      vo2maxPowerWatts: 360,
    };

    const result = resolveWorkoutTargets(workout, benchmarks);

    expect(result.warnings).toEqual([]);
    expect(result.steps[0].resolvedTargets).toMatchObject([
      { label: "FTP/FSL", unit: "watt", minValue: 294, maxValue: 308 },
      { label: "HFmax", unit: "bpm", minValue: 171 },
      { label: "VO2max-Leistung", unit: "watt", minValue: 342, maxValue: 360 },
    ]);
  });

  it("marks missing profile values without blocking resolution of available targets", () => {
    const benchmarks: AthleteBenchmarkSnapshot = {
      discipline: "bike",
      thresholdPowerWatts: 280,
      maxHeartRateBpm: null,
      vo2maxPowerWatts: undefined,
    };

    const result = resolveWorkoutTargets(workout, benchmarks);

    expect(result.steps[0].resolvedTargets).toMatchObject([
      { label: "FTP/FSL", unit: "watt", minValue: 294, maxValue: 308 },
    ]);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings.map((warning) => warning.benchmark)).toEqual([
      "maxHeartRateBpm",
      "vo2maxPowerWatts",
    ]);
  });
});