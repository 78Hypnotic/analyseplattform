import { createPlanNodeId } from "./content";
import type {
  StructuredSwimBlock,
  StructuredSwimStep,
  StructuredTrainingPlanSession,
  StructuredTrainingPlanWeek,
  TrainingPlanContentV2,
  WorkoutBlock,
  WorkoutContent,
  WorkoutStep,
} from "./types";

export function duplicateWeek(content: TrainingPlanContentV2, weekId: string): TrainingPlanContentV2 {
  const index = content.weeks.findIndex((week) => week.id === weekId);
  if (index < 0) return content;
  const duplicate = cloneWeek(content.weeks[index]);
  return { ...content, weeks: insertAt(content.weeks, index + 1, duplicate) };
}

export function duplicateSession(
  content: TrainingPlanContentV2,
  weekId: string,
  sessionId: string,
): TrainingPlanContentV2 {
  return updateWeek(content, weekId, (week) => {
    const index = week.sessions.findIndex((session) => session.id === sessionId);
    if (index < 0) return week;
    return { ...week, sessions: insertAt(week.sessions, index + 1, cloneSession(week.sessions[index])) };
  });
}

export function moveSession(
  content: TrainingPlanContentV2,
  sessionId: string,
  targetWeekId: string,
  targetIndex: number,
): TrainingPlanContentV2 {
  let moved: StructuredTrainingPlanSession | null = null;
  const withoutSession = {
    ...content,
    weeks: content.weeks.map((week) => ({
      ...week,
      sessions: week.sessions.filter((session) => {
        if (session.id !== sessionId) return true;
        moved = session;
        return false;
      }),
    })),
  };
  if (!moved) return content;

  return updateWeek(withoutSession, targetWeekId, (week) => ({
    ...week,
    sessions: insertAt(week.sessions, clampIndex(targetIndex, week.sessions.length), moved as StructuredTrainingPlanSession),
  }));
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex < 0 || fromIndex >= items.length) return items;
  const safeTarget = clampIndex(toIndex, items.length - 1);
  if (safeTarget === fromIndex) return items;
  const result = [...items];
  const [item] = result.splice(fromIndex, 1);
  result.splice(safeTarget, 0, item);
  return result;
}

export function addWorkoutBlock(content: WorkoutContent, block: WorkoutBlock, index = content.blocks.length): WorkoutContent {
  return { ...content, blocks: insertAt(content.blocks, clampIndex(index, content.blocks.length), block) };
}

export function updateWorkoutBlock(
  content: WorkoutContent,
  blockId: string,
  update: (block: WorkoutBlock) => WorkoutBlock,
): WorkoutContent {
  return { ...content, blocks: content.blocks.map((block) => (block.id === blockId ? update(block) : block)) };
}

export function removeWorkoutBlock(content: WorkoutContent, blockId: string): WorkoutContent {
  if (content.blocks.length <= 1) return content;
  return { ...content, blocks: content.blocks.filter((block) => block.id !== blockId) };
}

export function duplicateWorkoutBlock(content: WorkoutContent, blockId: string): WorkoutContent {
  const index = content.blocks.findIndex((block) => block.id === blockId);
  if (index < 0) return content;
  return { ...content, blocks: insertAt(content.blocks, index + 1, cloneWorkoutBlock(content.blocks[index])) };
}

export function moveWorkoutBlock(content: WorkoutContent, blockId: string, targetIndex: number): WorkoutContent {
  const sourceIndex = content.blocks.findIndex((block) => block.id === blockId);
  if (sourceIndex < 0) return content;
  return { ...content, blocks: moveItem(content.blocks, sourceIndex, targetIndex) };
}

export function addWorkoutStep(content: WorkoutContent, blockId: string, step: WorkoutStep): WorkoutContent {
  return updateWorkoutBlock(content, blockId, (block) => ({ ...block, steps: [...block.steps, step] }));
}

export function updateWorkoutStep(
  content: WorkoutContent,
  blockId: string,
  stepId: string,
  update: (step: WorkoutStep) => WorkoutStep,
): WorkoutContent {
  return updateWorkoutBlock(content, blockId, (block) => ({
    ...block,
    steps: block.steps.map((step) => (step.id === stepId ? update(step) : step)),
  }));
}

export function removeWorkoutStep(content: WorkoutContent, blockId: string, stepId: string): WorkoutContent {
  return updateWorkoutBlock(content, blockId, (block) => {
    if (block.steps.length <= 1) return block;
    return { ...block, steps: block.steps.filter((step) => step.id !== stepId) };
  });
}

export function cloneSession(session: StructuredTrainingPlanSession): StructuredTrainingPlanSession {
  return {
    ...session,
    id: createPlanNodeId("workout"),
    title: `${session.title} (Kopie)`,
    timelineWorkout: session.timelineWorkout ? cloneWorkoutContent(session.timelineWorkout) : undefined,
    blocks: session.blocks.map(cloneBlock),
  };
}

function cloneWeek(week: StructuredTrainingPlanWeek): StructuredTrainingPlanWeek {
  return {
    ...week,
    id: createPlanNodeId("week"),
    title: `${week.title} (Kopie)`,
    sessions: week.sessions.map(cloneSession),
  };
}

function cloneBlock(block: StructuredSwimBlock): StructuredSwimBlock {
  return { ...block, id: createPlanNodeId("block"), steps: block.steps.map(cloneStep) };
}

function cloneStep(step: StructuredSwimStep): StructuredSwimStep {
  return { ...step, id: createPlanNodeId("step"), equipment: [...step.equipment], intensity: { ...step.intensity } };
}

function cloneWorkoutBlock(block: WorkoutBlock): WorkoutBlock {
  return {
    ...block,
    id: createPlanNodeId("block"),
    title: `${block.title} (Kopie)`,
    steps: block.steps.map(cloneWorkoutStep),
  };
}

function cloneWorkoutContent(content: WorkoutContent): WorkoutContent {
  return { ...content, blocks: content.blocks.map(cloneWorkoutBlock) };
}

function cloneWorkoutStep(step: WorkoutStep): WorkoutStep {
  return {
    ...step,
    id: createPlanNodeId("step"),
    duration: { ...step.duration },
    targets: step.targets.map((target) => ({ ...target })),
  };
}

function updateWeek(
  content: TrainingPlanContentV2,
  weekId: string,
  update: (week: StructuredTrainingPlanWeek) => StructuredTrainingPlanWeek,
) {
  return { ...content, weeks: content.weeks.map((week) => (week.id === weekId ? update(week) : week)) };
}

function insertAt<T>(items: T[], index: number, item: T) {
  const result = [...items];
  result.splice(index, 0, item);
  return result;
}

function clampIndex(index: number, maximum: number) {
  return Math.max(0, Math.min(index, maximum));
}