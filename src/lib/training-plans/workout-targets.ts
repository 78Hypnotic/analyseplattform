import type { AthleteBenchmarkSnapshot, WorkoutContent, WorkoutStep, WorkoutTarget } from "./types";

export type ResolvedWorkoutTarget = {
  target: WorkoutTarget;
  label: string;
  unit: "watt" | "bpm";
  minValue: number;
  maxValue?: number;
};

export type WorkoutTargetWarning = {
  target: WorkoutTarget;
  benchmark: "thresholdPowerWatts" | "maxHeartRateBpm" | "vo2maxPowerWatts";
  message: string;
};

export type ResolvedWorkoutStepTargets = {
  stepId: string;
  resolvedTargets: ResolvedWorkoutTarget[];
  warnings: WorkoutTargetWarning[];
};

export type ResolvedWorkoutTargets = {
  discipline: WorkoutContent["discipline"];
  steps: ResolvedWorkoutStepTargets[];
  warnings: WorkoutTargetWarning[];
};

export function resolveWorkoutTargets(
  workout: WorkoutContent,
  benchmarks: AthleteBenchmarkSnapshot,
): ResolvedWorkoutTargets {
  const steps = workout.blocks.flatMap((block) =>
    block.steps.map((step) => resolveWorkoutStepTargets(step, benchmarks)),
  );

  return {
    discipline: workout.discipline,
    steps,
    warnings: steps.flatMap((step) => step.warnings),
  };
}

export function resolveWorkoutStepTargets(
  step: WorkoutStep,
  benchmarks: AthleteBenchmarkSnapshot,
): ResolvedWorkoutStepTargets {
  const resolvedTargets: ResolvedWorkoutTarget[] = [];
  const warnings: WorkoutTargetWarning[] = [];

  step.targets.forEach((target) => {
    const result = resolveWorkoutTarget(target, benchmarks);
    if ("warning" in result) {
      warnings.push(result.warning);
      return;
    }
    resolvedTargets.push(result.resolvedTarget);
  });

  return { stepId: step.id, resolvedTargets, warnings };
}

export function resolveWorkoutTarget(
  target: WorkoutTarget,
  benchmarks: AthleteBenchmarkSnapshot,
): { resolvedTarget: ResolvedWorkoutTarget } | { warning: WorkoutTargetWarning } {
  if (target.type === "threshold_power_percentage") {
    return resolvePercentageTarget(target, benchmarks.thresholdPowerWatts, "thresholdPowerWatts", "FTP/FSL", "watt");
  }
  if (target.type === "max_heart_rate_percentage") {
    return resolvePercentageTarget(target, benchmarks.maxHeartRateBpm, "maxHeartRateBpm", "HFmax", "bpm");
  }
  return resolvePercentageTarget(target, benchmarks.vo2maxPowerWatts, "vo2maxPowerWatts", "VO2max-Leistung", "watt");
}

function resolvePercentageTarget(
  target: WorkoutTarget,
  benchmarkValue: number | null | undefined,
  benchmark: WorkoutTargetWarning["benchmark"],
  label: string,
  unit: ResolvedWorkoutTarget["unit"],
): { resolvedTarget: ResolvedWorkoutTarget } | { warning: WorkoutTargetWarning } {
  if (!benchmarkValue || benchmarkValue <= 0) {
    return {
      warning: {
        target,
        benchmark,
        message: `${label} ist im Athletenprofil nicht hinterlegt.`,
      },
    };
  }

  return {
    resolvedTarget: {
      target,
      label,
      unit,
      minValue: Math.round(benchmarkValue * target.minPercent / 100),
      maxValue: target.maxPercent === undefined
        ? undefined
        : Math.round(benchmarkValue * target.maxPercent / 100),
    },
  };
}