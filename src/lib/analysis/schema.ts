import { z } from "zod";

const timeSchema = z
  .string()
  .trim()
  .regex(/^(\d+([,.]\d+)?|\d+:\d{1,2}([,.]\d+)?)$/, "Ungueltiges Zeitformat");

export const analysisInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  age: z.coerce.number().int().min(8).max(100),
  gender: z.enum(["weiblich", "maennlich", "divers"]),
  height: z.coerce.number().int().min(100).max(230),
  weight: z.coerce.number().int().min(25).max(180),
  poolLength: z.coerce.number().pipe(z.union([z.literal(25), z.literal(50)])),
  t200: timeSchema,
  s200: z.coerce.number().positive().max(80),
  t400: timeSchema,
  s400: z.coerce.number().positive().max(80),
  t50: z.union([timeSchema, z.literal("")]).optional(),
  goal: z.enum(["Kraulen lernen", "Beckenschwimmen", "Freiwasserschwimmen", "Triathlon"]),
  level: z.enum(["Einsteiger", "Fortgeschritten", "Ambitioniert", "Leistungsschwimmer"]),
  challenges: z.array(z.string().trim().min(2).max(120)).max(12),
});
