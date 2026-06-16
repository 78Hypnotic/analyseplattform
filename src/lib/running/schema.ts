import { z } from "zod";

const raceDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Wettkampfdatum")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Ungültiges Wettkampfdatum");

export const runInputSchema = z
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
    distance3min: z.coerce.number().int().min(200).max(2000),
    distance12min: z.coerce.number().int().min(600).max(8000),
    goal: z.enum(["5k", "10k", "Halbmarathon", "Marathon", "Trail", "Triathlon"]),
    raceDate: z.preprocess((value) => (value === "" ? undefined : value), raceDateSchema.optional()),
    runSessionsPerWeek: z.coerce.number().int().min(1).max(14),
  })
  .superRefine((input, context) => {
    if (input.distance12min <= input.distance3min) {
      context.addIssue({
        code: "custom",
        path: ["distance12min"],
        message: "Die 12-Minuten-Distanz muss größer sein als die 3-Minuten-Distanz.",
      });
    }
  });
