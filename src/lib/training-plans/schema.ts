import { z } from "zod";

export const trainingPlanTargetDistanceSchema = z.enum([
  "Sprint",
  "OD",
  "MD",
  "LD",
  "Becken",
  "Freiwasser",
]);

export const trainingPlanContentSchema = z.object({
  weeks: z
    .array(
      z.object({
        title: z.string().trim().min(2).max(80),
        goal: z.string().trim().min(2).max(240),
        sessions: z
          .array(
            z.object({
              title: z.string().trim().min(2).max(80),
              focus: z.string().trim().min(2).max(160),
              blocks: z
                .array(
                  z.object({
                    title: z.string().trim().min(2).max(80),
                    sets: z.string().trim().min(2).max(120),
                    intensity: z.string().trim().min(2).max(80),
                    notes: z.string().trim().max(240).optional(),
                  }),
                )
                .min(1)
                .max(8),
              drills: z
                .array(
                  z.object({
                    name: z.string().trim().min(2).max(80),
                    cue: z.string().trim().min(2).max(180),
                  }),
                )
                .max(8),
            }),
          )
          .min(1)
          .max(8),
      }),
    )
    .min(1)
    .max(16),
});

export const trainingPlanSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.")
    .max(80),
  title: z.string().trim().min(3).max(120),
  focus: z.string().trim().min(2).max(120),
  phase: z.string().trim().min(2).max(120),
  level: z.string().trim().min(2).max(80),
  target_distances: z.array(trainingPlanTargetDistanceSchema).min(1).max(6),
  weeks: z.coerce.number().int().min(1).max(16),
  summary: z.string().trim().min(10).max(1200),
  preview: z.string().trim().min(10).max(1200),
  content: trainingPlanContentSchema,
  is_active: z.boolean(),
});

export type TrainingPlanFormData = z.infer<typeof trainingPlanSchema>;
