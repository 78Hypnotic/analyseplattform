import type { TrainingPlanContent } from "./types";

export function emptyTrainingPlanContent(): TrainingPlanContent {
  return {
    weeks: [
      {
        title: "Woche 1",
        goal: "Fokus des Blocks",
        sessions: [
          {
            title: "Einheit 1",
            focus: "Technik und Hauptserie",
            blocks: [
              {
                title: "Hauptserie",
                sets: "6 x 100 m",
                intensity: "kontrolliert",
                notes: "Pace und Zugzahl stabil halten.",
              },
            ],
            drills: [
              {
                name: "Technikdrill",
                cue: "Ein klarer Cue für diese Einheit.",
              },
            ],
          },
        ],
      },
    ],
  };
}
