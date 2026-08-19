import { describe, expect, it } from "vitest";
import { trainingPlanSchema } from "./schema";

const validPlan = {
  discipline: "swim" as const,
  slug: "technik-stabilisieren",
  title: "Technik stabilisieren",
  focus: "Wasserlage",
  phase: "Technikblock",
  level: "Fortgeschritten",
  target_distances: ["Becken" as const],
  weeks: 4,
  summary: "Ein fokussierter Plan für eine stabilere Wasserlage.",
  preview: "Vier Wochen mit progressiven Technikaufgaben und einem ReTest.",
  content: {
    weeks: [
      {
        title: "Woche 1",
        goal: "Wasserlage stabilisieren",
        sessions: [
          {
            title: "Technikeinstieg",
            focus: "Körperlinie",
            blocks: [{ title: "Hauptserie", sets: "6 x 100 m", intensity: "locker" }],
            drills: [{ name: "Superman Glide", cue: "Blick nach unten" }],
          },
        ],
      },
    ],
  },
  is_active: false,
};

describe("trainingPlanSchema", () => {
  it("accepts a structured swim plan", () => {
    expect(trainingPlanSchema.safeParse(validPlan).success).toBe(true);
  });

  it("keeps the first builder milestone swim-only", () => {
    const result = trainingPlanSchema.safeParse({ ...validPlan, discipline: "run" });
    expect(result.success).toBe(false);
  });

  it("rejects plans without structured sessions", () => {
    const result = trainingPlanSchema.safeParse({
      ...validPlan,
      content: { weeks: [{ title: "Woche 1", goal: "Technik", sessions: [] }] },
    });
    expect(result.success).toBe(false);
  });
});