import { describe, expect, it } from "vitest";
import type { TrainingPlanContent } from "./types";
import { buildTrainingPlanSchedule } from "./schedule";

const content: TrainingPlanContent = {
  weeks: [
    {
      title: "Woche 1",
      goal: "Rhythmus finden",
      sessions: [
        createSession("Technik"),
        createSession("Ausdauer"),
        createSession("Tempo"),
      ],
    },
    {
      title: "Woche 2",
      goal: "Belastung festigen",
      sessions: [createSession("Technik"), createSession("Ausdauer")],
    },
  ],
};

describe("buildTrainingPlanSchedule", () => {
  it("ordnet Einheiten innerhalb jeder Planwoche chronologisch den gewählten Tagen zu", () => {
    expect(buildTrainingPlanSchedule({
      content,
      startDate: "2026-08-19",
      weekdays: [2, 4, 6],
    })).toEqual([
      { weekIndex: 0, sessionIndex: 0, sequence: 0, scheduledFor: "2026-08-20" },
      { weekIndex: 0, sessionIndex: 1, sequence: 1, scheduledFor: "2026-08-22" },
      { weekIndex: 0, sessionIndex: 2, sequence: 2, scheduledFor: "2026-08-25" },
      { weekIndex: 1, sessionIndex: 0, sequence: 3, scheduledFor: "2026-08-27" },
      { weekIndex: 1, sessionIndex: 1, sequence: 4, scheduledFor: "2026-08-29" },
    ]);
  });

  it("bleibt über Monats- und Jahresgrenzen stabil", () => {
    const oneWeekContent: TrainingPlanContent = { weeks: [content.weeks[0]] };

    expect(buildTrainingPlanSchedule({
      content: oneWeekContent,
      startDate: "2026-12-30",
      weekdays: [2, 4, 6],
    }).map((session) => session.scheduledFor)).toEqual([
      "2026-12-31",
      "2027-01-02",
      "2027-01-05",
    ]);
  });

  it("verlangt genau so viele eindeutige Tage wie die größte Planwoche", () => {
    expect(() => buildTrainingPlanSchedule({
      content,
      startDate: "2026-08-19",
      weekdays: [2, 4],
    })).toThrow("Wähle genau 3 Trainingstage aus.");

    expect(() => buildTrainingPlanSchedule({
      content,
      startDate: "2026-08-19",
      weekdays: [2, 2, 6],
    })).toThrow("Trainingstage dürfen nicht doppelt gewählt werden.");
  });

  it("lehnt ungültige Startdaten und Pläne ohne Einheiten ab", () => {
    expect(() => buildTrainingPlanSchedule({
      content,
      startDate: "2026-02-30",
      weekdays: [2, 4, 6],
    })).toThrow("Das Startdatum ist ungültig.");

    expect(() => buildTrainingPlanSchedule({
      content: { weeks: [] },
      startDate: "2026-08-19",
      weekdays: [],
    })).toThrow("Der Trainingsplan enthält keine Einheiten.");
  });
});

function createSession(title: string) {
  return {
    title,
    focus: title,
    blocks: [{ title: "Hauptsatz", sets: "4 x 100 m", intensity: "locker" }],
    drills: [],
  };
}