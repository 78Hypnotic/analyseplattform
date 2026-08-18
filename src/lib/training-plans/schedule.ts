import type { TrainingPlanContent } from "./types";

export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ScheduledPlanSession = {
  weekIndex: number;
  sessionIndex: number;
  sequence: number;
  scheduledFor: string;
};

export type BuildTrainingPlanScheduleInput = {
  content: TrainingPlanContent;
  startDate: string;
  weekdays: IsoWeekday[];
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function buildTrainingPlanSchedule({
  content,
  startDate,
  weekdays,
}: BuildTrainingPlanScheduleInput): ScheduledPlanSession[] {
  const parsedStartDate = parseDateOnly(startDate);
  const maximumSessionsPerWeek = Math.max(
    0,
    ...content.weeks.map((week) => week.sessions.length),
  );

  if (maximumSessionsPerWeek === 0) {
    throw new Error("Der Trainingsplan enthält keine Einheiten.");
  }

  assertWeekdays(weekdays, maximumSessionsPerWeek);
  const selectedWeekdays = new Set<IsoWeekday>(weekdays);
  const schedule: ScheduledPlanSession[] = [];
  let sequence = 0;

  content.weeks.forEach((week, weekIndex) => {
    const weekStart = addDays(parsedStartDate, weekIndex * 7);
    const availableDates = Array.from({ length: 7 }, (_, dayOffset) => addDays(weekStart, dayOffset))
      .filter((date) => selectedWeekdays.has(toIsoWeekday(date)));

    week.sessions.forEach((_, sessionIndex) => {
      const scheduledDate = availableDates[sessionIndex];
      if (!scheduledDate) {
        throw new Error("Für mindestens eine Planwoche wurden zu wenige Trainingstage gewählt.");
      }

      schedule.push({
        weekIndex,
        sessionIndex,
        sequence,
        scheduledFor: formatDateOnly(scheduledDate),
      });
      sequence += 1;
    });
  });

  return schedule;
}

function assertWeekdays(weekdays: IsoWeekday[], requiredCount: number) {
  if (weekdays.length !== requiredCount) {
    throw new Error(`Wähle genau ${requiredCount} Trainingstage aus.`);
  }

  if (new Set(weekdays).size !== weekdays.length) {
    throw new Error("Trainingstage dürfen nicht doppelt gewählt werden.");
  }

  if (!weekdays.every((weekday) => Number.isInteger(weekday) && weekday >= 1 && weekday <= 7)) {
    throw new Error("Trainingstage müssen zwischen Montag und Sonntag liegen.");
  }
}

function parseDateOnly(value: string) {
  if (!DATE_ONLY_PATTERN.test(value)) {
    throw new Error("Das Startdatum muss im Format JJJJ-MM-TT angegeben werden.");
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || formatDateOnly(date) !== value) {
    throw new Error("Das Startdatum ist ungültig.");
  }

  return date;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

function toIsoWeekday(date: Date): IsoWeekday {
  const weekday = date.getUTCDay();
  return (weekday === 0 ? 7 : weekday) as IsoWeekday;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}