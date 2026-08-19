import type {
  StructuredSwimBlock,
  StructuredSwimStep,
  StructuredTrainingPlanSession,
  StructuredTrainingPlanWeek,
  TrainingPlanContentV2,
} from "./types";

export type PlanMetrics = {
  weeks: number;
  sessions: number;
  meters: number;
  reviewSteps: number;
  zoneMeters: Record<"Z1" | "Z2" | "Z3" | "Z4" | "Z5" | "other", number>;
};

export function getStepMeters(step: StructuredSwimStep) {
  return step.repetitions * step.distanceMeters;
}

export function getBlockMeters(block: StructuredSwimBlock) {
  return block.repeatCount * block.steps.reduce((total, step) => total + getStepMeters(step), 0);
}

export function getSessionMeters(session: StructuredTrainingPlanSession) {
  return session.blocks.reduce((total, block) => total + getBlockMeters(block), 0);
}

export function getWeekMeters(week: StructuredTrainingPlanWeek) {
  return week.sessions.reduce((total, session) => total + getSessionMeters(session), 0);
}

export function getPlanMetrics(content: TrainingPlanContentV2): PlanMetrics {
  const metrics: PlanMetrics = {
    weeks: content.weeks.length,
    sessions: 0,
    meters: 0,
    reviewSteps: 0,
    zoneMeters: { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0, other: 0 },
  };

  content.weeks.forEach((week) => {
    metrics.sessions += week.sessions.length;
    week.sessions.forEach((session) => {
      session.blocks.forEach((block) => {
        block.steps.forEach((step) => {
          const meters = block.repeatCount * getStepMeters(step);
          metrics.meters += meters;
          if (step.needsReview) metrics.reviewSteps += 1;
          const zone = step.intensity.type === "zone" ? step.intensity.zone : "other";
          metrics.zoneMeters[zone] += meters;
        });
      });
    });
  });

  return metrics;
}