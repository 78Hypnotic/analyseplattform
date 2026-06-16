import { z } from "zod";

const raceDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Wettkampfdatum")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Ungültiges Wettkampfdatum");

export const bikeInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    age: z.coerce.number().int().min(8).max(100),
    gender: z.enum(["weiblich", "maennlich", "divers"]),
    height: z.coerce.number().int().min(100).max(230),
    weight: z.coerce.number().int().min(25).max(180),
    bodyFatPercentage: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce.number().min(3).max(60).optional(),
    ),
    fitnessLevel: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce.number().int().min(1).max(5).optional(),
    ),
    sprintPeakWatt: z.coerce.number().int().min(200).max(2500),
    sprintAvg20sWatt: z.coerce.number().int().min(150).max(2000),
    rampLastStageWatt: z.coerce.number().int().min(50).max(700),
    rampExtraSeconds: z.coerce.number().int().min(0).max(29),
    goal: z.enum(["Strasse", "Zeitfahren", "MTB_Gravel", "GranFondo", "Triathlon"]),
    raceDate: z.preprocess((value) => (value === "" ? undefined : value), raceDateSchema.optional()),
    bikeSessionsPerWeek: z.coerce.number().int().min(1).max(14),
    validation12minWatt: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce.number().int().min(50).max(700).optional(),
    ),
  })
  .superRefine((input, context) => {
    if (input.sprintAvg20sWatt > input.sprintPeakWatt) {
      context.addIssue({
        code: "custom",
        path: ["sprintAvg20sWatt"],
        message: "Die Durchschnittsleistung kann nicht über der Peak-Leistung liegen.",
      });
    }
    if (input.sprintAvg20sWatt * 20 <= input.sprintPeakWatt * 4) {
      context.addIssue({
        code: "custom",
        path: ["sprintAvg20sWatt"],
        message: "Sprintwerte ergeben keine glykolytische Arbeit. Bitte Peak und Durchschnitt prüfen.",
      });
    }
  });
