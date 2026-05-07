import { z } from "zod";

const timeSchema = z
  .string()
  .trim()
  .regex(/^(\d+([,.]\d+)?|\d+:\d{1,2}([,.]\d+)?)$/, "Ungültiges Zeitformat");

const optionalTimeSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  timeSchema.optional(),
);

const optionalPositiveStrokeSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().positive().max(80).optional(),
);

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
    z.coerce.number().int().min(1).max(5).optional(),
  ),
  poolLength: z.coerce.number().pipe(z.union([z.literal(25), z.literal(50)])),
  canSwim400m: z.boolean().default(true),
  testType: z.enum(["water_start", "dive_start", "wall_push"]).default("wall_push"),
  equipment: z.enum(["ohne", "pullbuoy", "neo", "paddles"]).default("ohne"),
  t50: timeSchema,
  s50: optionalPositiveStrokeSchema,
  t200: timeSchema,
  s200: z.coerce.number().positive().max(80),
  t400: optionalTimeSchema,
  s400: optionalPositiveStrokeSchema,
  goal: z.enum(["Kraulen lernen", "Beckenschwimmen", "Freiwasserschwimmen", "Triathlon"]),
  level: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? "Fortgeschritten" : value),
    z.enum(["Einsteiger", "Fortgeschritten", "Ambitioniert", "Leistungsschwimmer"]),
  ),
  targetDistance: z.enum(["Sprint", "OD", "MD", "LD", "Becken", "Freiwasser"]),
  raceDate: z.preprocess((value) => (value === "" ? undefined : value), raceDateSchema.optional()),
  swimSessionsPerWeek: z.coerce.number().int().min(1).max(7),
  challenges: z.array(z.string().trim().min(2).max(120)).max(12),
}).superRefine((input, context) => {
  if (!input.canSwim400m) return;

  if (!input.t400) {
    context.addIssue({
      code: "custom",
      path: ["t400"],
      message: "400 m Zeit ist Pflicht, wenn 400 m am Stück möglich sind.",
    });
  }

  if (input.s400 === undefined) {
    context.addIssue({
      code: "custom",
      path: ["s400"],
      message: "Züge pro Bahn für 400 m sind Pflicht, wenn 400 m am Stück möglich sind.",
    });
  }
});
