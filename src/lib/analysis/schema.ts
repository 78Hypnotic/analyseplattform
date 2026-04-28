import { z } from "zod";

const timeSchema = z
  .string()
  .trim()
  .regex(/^(\d+([,.]\d+)?|\d+:\d{1,2}([,.]\d+)?)$/, "Ungültiges Zeitformat");

const raceDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Wettkampfdatum")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Ungültiges Wettkampfdatum");

export const analysisInputSchema = z.object({
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
    z.coerce.number().int().min(1).max(10).optional(),
  ),
  poolLength: z.coerce.number().pipe(z.union([z.literal(25), z.literal(50)])),
  t200: timeSchema,
  s200: z.coerce.number().positive().max(80),
  t400: timeSchema,
  s400: z.coerce.number().positive().max(80),
  t50: z.union([timeSchema, z.literal("")]).optional(),
  goal: z.enum(["Kraulen lernen", "Beckenschwimmen", "Freiwasserschwimmen", "Triathlon"]),
  level: z.enum(["Einsteiger", "Fortgeschritten", "Ambitioniert", "Leistungsschwimmer"]),
  targetDistance: z.enum(["Sprint", "OD", "MD", "LD", "Becken", "Freiwasser"]),
  raceDate: z.preprocess((value) => (value === "" ? undefined : value), raceDateSchema.optional()),
  swimSessionsPerWeek: z.coerce.number().int().min(1).max(7),
  challenges: z.array(z.string().trim().min(2).max(120)).max(12),
});
