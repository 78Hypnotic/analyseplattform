import { describe, expect, it } from "vitest";
import { duplicateSession, duplicateWeek, moveSession } from "./commands";
import { assertPublishableTrainingPlanContent, upgradeLegacyTrainingPlanContent } from "./content";
import { getPlanMetrics } from "./metrics";
import type { TrainingPlanContent, TrainingPlanContentV2 } from "./types";

const legacy: TrainingPlanContent = {
  weeks: [{
    title: "Woche 1",
    goal: "Technik",
    sessions: [{
      title: "CSS",
      focus: "Schwelle",
      blocks: [
        { title: "Hauptserie", sets: "6 x 100 m", intensity: "CSS + 3 s" },
        { title: "Sonderform", sets: "Pyramide", intensity: "locker" },
      ],
      drills: [],
    }],
  }],
};

describe("structured training plan content", () => {
  it("upgrades parseable legacy sets and marks ambiguous text for review", () => {
    const upgraded = upgradeLegacyTrainingPlanContent(legacy);
    const [first, second] = upgraded.weeks[0].sessions[0].blocks;

    expect(first.steps[0]).toMatchObject({ repetitions: 6, distanceMeters: 100, needsReview: false });
    expect(second.steps[0]).toMatchObject({ needsReview: true, legacyText: "Pyramide · locker" });
    expect(() => assertPublishableTrainingPlanContent(upgraded)).toThrow("1 importierte Schritte");
  });

  it("calculates exact meters including repeated blocks and zones", () => {
    const content = fixture();
    content.weeks[0].sessions[0].blocks[0].repeatCount = 2;
    const metrics = getPlanMetrics(content);

    expect(metrics.meters).toBe(1600);
    expect(metrics.zoneMeters.Z2).toBe(1600);
    expect(metrics.sessions).toBe(1);
  });

  it("duplicates nested nodes with new ids", () => {
    const content = fixture();
    const duplicated = duplicateWeek(content, "week-1");

    expect(duplicated.weeks).toHaveLength(2);
    expect(duplicated.weeks[1].id).not.toBe("week-1");
    expect(duplicated.weeks[1].sessions[0].id).not.toBe("workout-1");
    expect(duplicated.weeks[1].sessions[0].blocks[0].steps[0].id).not.toBe("step-1");
  });

  it("duplicates and moves workouts between weeks", () => {
    const base = fixture();
    const withSecondWeek: TrainingPlanContentV2 = {
      ...base,
      weeks: [...base.weeks, { id: "week-2", title: "Woche 2", goal: "Ausdauer", sessions: [] }],
    };
    const duplicated = duplicateSession(withSecondWeek, "week-1", "workout-1");
    const duplicateId = duplicated.weeks[0].sessions[1].id;
    const moved = moveSession(duplicated, duplicateId, "week-2", 0);

    expect(moved.weeks[0].sessions).toHaveLength(1);
    expect(moved.weeks[1].sessions[0].id).toBe(duplicateId);
  });
});

function fixture(): TrainingPlanContentV2 {
  return {
    schemaVersion: 2,
    weeks: [{
      id: "week-1",
      title: "Woche 1",
      goal: "Technik",
      sessions: [{
        id: "workout-1",
        title: "Aerob",
        focus: "Grundlage",
        blocks: [{
          id: "block-1",
          title: "Hauptserie",
          kind: "main",
          repeatCount: 1,
          steps: [{
            id: "step-1",
            repetitions: 8,
            distanceMeters: 100,
            restSeconds: 20,
            stroke: "freestyle",
            intensity: { type: "zone", zone: "Z2" },
            equipment: [],
          }],
        }],
      }],
    }],
  };
}