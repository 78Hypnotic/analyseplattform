import { z } from "zod";
import { TECHNIQUE_PROFILE_GROUPS } from "@/lib/analysis/constants";

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

const structuredIdSchema = z.string().trim().min(1).max(80);

export const swimIntensitySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("zone"), zone: z.enum(["Z1", "Z2", "Z3", "Z4", "Z5"]) }),
  z.object({
    type: z.literal("css"),
    offsetSecondsPer100m: z.number().int().min(-20).max(60),
  }),
  z.object({
    type: z.literal("rpe"),
    min: z.number().int().min(1).max(10),
    max: z.number().int().min(1).max(10),
  }).refine((value) => value.min <= value.max, { message: "Der minimale RPE darf nicht über dem maximalen RPE liegen." }),
  z.object({ type: z.literal("free"), label: z.string().trim().min(2).max(80) }),
]);

export const structuredSwimStepSchema = z.object({
  id: structuredIdSchema,
  repetitions: z.number().int().min(1).max(100),
  distanceMeters: z.number().int().min(5).max(5000),
  restSeconds: z.number().int().min(0).max(1800),
  stroke: z.enum(["freestyle", "backstroke", "breaststroke", "butterfly", "medley", "choice"]),
  intensity: swimIntensitySchema,
  equipment: z.array(z.enum(["pullbuoy", "paddles", "fins", "snorkel", "kickboard"])).max(5),
  drillName: z.string().trim().max(80).optional(),
  cue: z.string().trim().max(180).optional(),
  notes: z.string().trim().max(240).optional(),
  needsReview: z.boolean().optional(),
  legacyText: z.string().trim().max(320).optional(),
});

export const structuredSwimBlockSchema = z.object({
  id: structuredIdSchema,
  title: z.string().trim().min(2).max(80),
  kind: z.enum(["warmup", "drill", "main", "recovery", "cooldown"]),
  repeatCount: z.number().int().min(1).max(20),
  steps: z.array(structuredSwimStepSchema).min(1).max(24),
});

export const structuredTrainingPlanSessionSchema = z.object({
  id: structuredIdSchema,
  title: z.string().trim().min(2).max(80),
  focus: z.string().trim().min(2).max(160),
  preferredWeekday: z.union([
    z.literal(1), z.literal(2), z.literal(3), z.literal(4),
    z.literal(5), z.literal(6), z.literal(7),
  ]).optional(),
  estimatedDurationMinutes: z.number().int().min(1).max(600).optional(),
  blocks: z.array(structuredSwimBlockSchema).min(1).max(12),
});

export const trainingPlanContentV2Schema = z.object({
  schemaVersion: z.literal(2),
  weeks: z.array(z.object({
    id: structuredIdSchema,
    title: z.string().trim().min(2).max(80),
    goal: z.string().trim().min(2).max(240),
    sessions: z.array(structuredTrainingPlanSessionSchema).min(1).max(8),
  })).min(1).max(16),
});

export const anyTrainingPlanContentSchema = z.union([trainingPlanContentV2Schema, trainingPlanContentSchema]);

export const trainingPlanSchema = z.object({
  id: z.string().uuid().optional(),
  discipline: z.literal("swim"),
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
  target_technique_axis: z.enum(TECHNIQUE_PROFILE_GROUPS).nullable(),
  content: anyTrainingPlanContentSchema,
  is_active: z.boolean(),
});

export type TrainingPlanFormData = z.infer<typeof trainingPlanSchema>;

export type TrainingPlanFieldName =
  | "title"
  | "slug"
  | "focus"
  | "phase"
  | "level"
  | "target_distances"
  | "summary"
  | "preview"
  | "target_technique_axis"
  | "content";

export type TrainingPlanValidationFeedback = {
  message: string;
  fieldErrors: Partial<Record<TrainingPlanFieldName, string>>;
};

const FIELD_LABELS: Record<TrainingPlanFieldName, string> = {
  title: "Titel",
  slug: "Slug",
  focus: "Fokus",
  phase: "Phase",
  level: "Niveau",
  target_distances: "Zielstrecken",
  summary: "Zusammenfassung",
  preview: "Gesperrte Vorschau",
  target_technique_axis: "Technik-Zielattribut",
  content: "Workout-Struktur",
};

export function formatTrainingPlanValidationError(
  error: z.ZodError,
): TrainingPlanValidationFeedback {
  const fieldErrors: Partial<Record<TrainingPlanFieldName, string>> = {};
  let firstMessage = "Plan konnte nicht gespeichert werden.";

  error.issues.forEach((issue, index) => {
    const field = getFieldName(issue.path[0]);
    const message = translateIssue(issue, field);
    if (!fieldErrors[field]) fieldErrors[field] = message;
    if (index === 0) {
      const context = field === "content" ? formatContentContext(issue.path) : FIELD_LABELS[field];
      firstMessage = `${context}: ${message}`;
    }
  });

  return { message: firstMessage, fieldErrors };
}

function getFieldName(value: PropertyKey | undefined): TrainingPlanFieldName {
  const key = String(value ?? "content");
  return key in FIELD_LABELS ? key as TrainingPlanFieldName : "content";
}

function translateIssue(issue: z.core.$ZodIssue, field: TrainingPlanFieldName) {
  if (field === "target_distances" && issue.code === "too_small") {
    return "Bitte mindestens eine Zielstrecke auswählen.";
  }
  if (field === "slug" && issue.code === "invalid_format") {
    return "Nur Kleinbuchstaben, Zahlen und Bindestriche verwenden.";
  }
  if (field === "content" && issue.code === "too_small") {
    const collection = getContentCollection(issue.path);
    if (collection === "weeks") return "Bitte mindestens eine Woche anlegen.";
    if (collection === "sessions") return "Bitte mindestens ein Workout anlegen.";
    if (collection === "blocks") return "Bitte mindestens einen Block anlegen.";
    if (collection === "steps") return "Bitte mindestens einen Schritt anlegen.";
  }
  if (issue.code === "too_small") {
    const minimum = "minimum" in issue ? Number(issue.minimum) : 1;
    return `Bitte mindestens ${minimum} Zeichen eingeben.`;
  }
  if (issue.code === "too_big") {
    const maximum = "maximum" in issue ? Number(issue.maximum) : null;
    return maximum ? `Bitte höchstens ${maximum} Zeichen eingeben.` : "Der Wert ist zu lang.";
  }
  if (issue.code === "invalid_type") return "Bitte einen gültigen Wert eingeben.";
  if (issue.code === "invalid_value") return "Bitte eine gültige Auswahl treffen.";
  return issue.message && !issue.message.startsWith("Too ")
    ? issue.message
    : "Bitte den Wert prüfen.";
}

function getContentCollection(path: PropertyKey[]) {
  return [...path]
    .reverse()
    .find((item) => item === "weeks" || item === "sessions" || item === "blocks" || item === "steps");
}

function formatContentContext(path: PropertyKey[]) {
  const weekPosition = path.indexOf("weeks");
  const sessionPosition = path.indexOf("sessions");
  const weekIndex = weekPosition >= 0 && typeof path[weekPosition + 1] === "number"
    ? Number(path[weekPosition + 1]) + 1
    : null;
  const sessionIndex = sessionPosition >= 0 && typeof path[sessionPosition + 1] === "number"
    ? Number(path[sessionPosition + 1]) + 1
    : null;
  if (weekIndex && sessionIndex) return `Workout-Struktur · Woche ${weekIndex}, Workout ${sessionIndex}`;
  if (weekIndex) return `Workout-Struktur · Woche ${weekIndex}`;
  return FIELD_LABELS.content;
}
