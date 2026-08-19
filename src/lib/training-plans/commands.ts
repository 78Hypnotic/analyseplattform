import { createPlanNodeId } from "./content";
import type {
  StructuredSwimBlock,
  StructuredSwimStep,
  StructuredTrainingPlanSession,
  StructuredTrainingPlanWeek,
  TrainingPlanContentV2,
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

export function cloneSession(session: StructuredTrainingPlanSession): StructuredTrainingPlanSession {
  return {
    ...session,
    id: createPlanNodeId("workout"),
    title: `${session.title} (Kopie)`,
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