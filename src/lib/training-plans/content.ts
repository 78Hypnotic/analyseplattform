import { emptyTrainingPlanContent } from "./defaults";
import { trainingPlanContentSchema, trainingPlanContentV2Schema } from "./schema";
import type {
  AnyTrainingPlanContent,
  StructuredSwimBlock,
  StructuredSwimStep,
  StructuredTrainingPlanSession,
  TrainingPlanBlock,
  TrainingPlanContent,
  TrainingPlanContentV2,
  TrainingPlanDiscipline,
  TrainingPlanDrill,
  WorkoutBlock,
  WorkoutContent,
  WorkoutStep,
} from "./types";

const SET_PATTERN = /^\s*(\d+)\s*[x×]\s*(\d+)\s*m?\s*$/i;

export function parseTrainingPlanContent(value: unknown): AnyTrainingPlanContent {
  const structured = trainingPlanContentV2Schema.safeParse(value);
  if (structured.success) return structured.data;

  const legacy = trainingPlanContentSchema.safeParse(value);
  return legacy.success ? legacy.data : emptyTrainingPlanContent();
}

export function isStructuredTrainingPlanContent(
  content: AnyTrainingPlanContent,
): content is TrainingPlanContentV2 {
  return "schemaVersion" in content && content.schemaVersion === 2;
}

export function isLegacyTrainingPlanContent(
  content: AnyTrainingPlanContent,
): content is TrainingPlanContent {
  return !isStructuredTrainingPlanContent(content);
}

export function upgradeLegacyTrainingPlanContent(content: TrainingPlanContent): TrainingPlanContentV2 {
  return {
    schemaVersion: 2,
    weeks: content.weeks.map((week) => ({
      id: createPlanNodeId("week"),
      title: week.title,
      goal: week.goal,
      sessions: week.sessions.map((session) => ({
        id: createPlanNodeId("workout"),
        title: session.title,
        focus: session.focus,
        blocks: [
          ...session.blocks.map(upgradeLegacyBlock),
          ...session.drills.map(upgradeLegacyDrill),
        ],
      })),
    })),
  };
}

export function assertPublishableTrainingPlanContent(content: AnyTrainingPlanContent) {
  const parsed = trainingPlanContentV2Schema.safeParse(content);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Der Plan ist nicht vollständig strukturiert.");
  }

  const reviewSteps = parsed.data.weeks.flatMap((week) =>
    week.sessions.flatMap((session) =>
      session.blocks.flatMap((block) => block.steps.filter((step) => step.needsReview)),
    ),
  );
  if (reviewSteps.length > 0) {
    throw new Error(`${reviewSteps.length} importierte Schritte müssen vor der Veröffentlichung geprüft werden.`);
  }

  return parsed.data;
}

export function createEmptyStructuredPlan(): TrainingPlanContentV2 {
  return {
    schemaVersion: 2,
    weeks: [
      {
        id: createPlanNodeId("week"),
        title: "Woche 1",
        goal: "Fokus des Blocks",
        sessions: [createEmptyStructuredSession()],
      },
    ],
  };
}

export function createEmptyStructuredSession(): StructuredTrainingPlanSession {
  return {
    id: createPlanNodeId("workout"),
    title: "Neue Schwimmeinheit",
    focus: "Technik und Hauptserie",
    blocks: [
      {
        id: createPlanNodeId("block"),
        title: "Einschwimmen",
        kind: "warmup",
        repeatCount: 1,
        steps: [createEmptyStructuredStep()],
      },
    ],
  };
}

export function createEmptyStructuredStep(): StructuredSwimStep {
  return {
    id: createPlanNodeId("step"),
    repetitions: 4,
    distanceMeters: 100,
    restSeconds: 20,
    stroke: "freestyle",
    intensity: { type: "zone", zone: "Z2" },
    equipment: [],
  };
}

export function createEmptyWorkoutContent(discipline: TrainingPlanDiscipline = "bike"): WorkoutContent {
  return {
    schemaVersion: 1,
    discipline,
    blocks: [
      createWorkoutBlock("warmup"),
      createWorkoutBlock("interval"),
      createWorkoutBlock("cooldown"),
    ],
  };
}

export function createWorkoutBlock(kind: WorkoutBlock["kind"] = "steady"): WorkoutBlock {
  const titleByKind: Record<WorkoutBlock["kind"], string> = {
    warmup: "Warm-up",
    steady: "Grundlage",
    interval: "Intervallblock",
    recovery: "Erholung",
    cooldown: "Cooldown",
  };

  return {
    id: createPlanNodeId("block"),
    title: titleByKind[kind],
    kind,
    repeatCount: kind === "interval" ? 4 : 1,
    steps: [createWorkoutStep(kind)],
  };
}

export function createWorkoutStep(kind: WorkoutBlock["kind"] = "steady"): WorkoutStep {
  const targetByKind: WorkoutStep["targets"][number] = kind === "interval"
    ? { type: "vo2max_power_percentage", minPercent: 90, maxPercent: 100 }
    : { type: "threshold_power_percentage", minPercent: 65, maxPercent: 75 };

  return {
    id: createPlanNodeId("step"),
    title: kind === "interval" ? "Belastung" : "Abschnitt",
    duration: { type: "time", seconds: kind === "interval" ? 300 : 600 },
    targets: [targetByKind],
    recoverySeconds: kind === "interval" ? 180 : undefined,
  };
}

export function createPlanNodeId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomId}`;
}

function upgradeLegacyBlock(block: TrainingPlanBlock): StructuredSwimBlock {
  const match = block.sets.match(SET_PATTERN);
  const parsed = match
    ? { repetitions: Number(match[1]), distanceMeters: Number(match[2]) }
    : null;

  return {
    id: createPlanNodeId("block"),
    title: block.title,
    kind: inferBlockKind(block.title),
    repeatCount: 1,
    steps: [
      {
        id: createPlanNodeId("step"),
        repetitions: parsed?.repetitions ?? 1,
        distanceMeters: parsed?.distanceMeters ?? 25,
        restSeconds: 0,
        stroke: "freestyle",
        intensity: { type: "free", label: block.intensity },
        equipment: [],
        notes: block.notes,
        needsReview: !parsed,
        legacyText: `${block.sets} · ${block.intensity}`,
      },
    ],
  };
}

function upgradeLegacyDrill(drill: TrainingPlanDrill): StructuredSwimBlock {
  return {
    id: createPlanNodeId("block"),
    title: drill.name,
    kind: "drill",
    repeatCount: 1,
    steps: [
      {
        ...createEmptyStructuredStep(),
        repetitions: 1,
        distanceMeters: 25,
        intensity: { type: "free", label: "Technik" },
        drillName: drill.name,
        cue: drill.cue,
        needsReview: true,
        legacyText: drill.cue,
      },
    ],
  };
}

function inferBlockKind(title: string): StructuredSwimBlock["kind"] {
  const normalized = title.toLowerCase();
  if (normalized.includes("ein") || normalized.includes("warm")) return "warmup";
  if (normalized.includes("drill") || normalized.includes("technik")) return "drill";
  if (normalized.includes("aus") || normalized.includes("cool")) return "cooldown";
  if (normalized.includes("pause") || normalized.includes("erholung")) return "recovery";
  return "main";
}