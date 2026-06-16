import { runInputSchema } from "./schema";
import { computeEnduranceRatio, computeV12, computeV3 } from "./calculations";
import type { RunInput } from "./types";

export type RunFieldKey = keyof RunInput;

export type RunValidationResult = {
  messages: string[];
  fieldErrors: Partial<Record<RunFieldKey, string>>;
};

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  age: "Alter",
  gender: "Geschlecht",
  height: "Größe",
  weight: "Gewicht",
  bodyFatPercentage: "KFA",
  fitnessLevel: "Fitnesslevel",
  distance3min: "3-Minuten-Distanz",
  distance12min: "12-Minuten-Distanz",
  goal: "Ziel",
  raceDate: "Wettkampfdatum",
  runSessionsPerWeek: "Laufeinheiten pro Woche",
};

const FIELD_MESSAGES: Record<string, string> = {
  name: "muss 2 bis 80 Zeichen haben.",
  age: "muss zwischen 8 und 100 liegen.",
  gender: "bitte auswählen.",
  height: "muss zwischen 100 und 230 cm liegen.",
  weight: "muss zwischen 25 und 180 kg liegen.",
  bodyFatPercentage: "muss zwischen 3 und 60 % liegen.",
  fitnessLevel: "muss zwischen 1 und 5 liegen.",
  distance3min: "muss zwischen 200 und 2000 m liegen.",
  distance12min: "muss zwischen 600 und 8000 m liegen.",
  goal: "bitte auswählen.",
  raceDate: "bitte als gültiges Datum eingeben.",
  runSessionsPerWeek: "muss zwischen 1 und 14 liegen.",
};

export function getRunValidationMessages(input: unknown): string[] {
  return getRunValidationResult(input).messages;
}

export function getRunValidationResult(input: unknown): RunValidationResult {
  const parsed = runInputSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<RunFieldKey, string>> = {};
    const messages = parsed.error.issues.map((issue) => {
      const key = String(issue.path[0] ?? "");
      const field = FIELD_LABELS[key] ?? "Eingabe";
      const fieldMessage =
        issue.code === "custom" ? issue.message : (FIELD_MESSAGES[key] ?? issue.message);
      if (isRunFieldKey(key) && !fieldErrors[key]) {
        fieldErrors[key] = fieldMessage;
      }
      return `${field}: ${fieldMessage}`;
    });
    return { messages, fieldErrors };
  }

  return getCalculationValidationResult(parsed.data);
}

function getCalculationValidationResult(input: RunInput): RunValidationResult {
  const messages: string[] = [];
  const fieldErrors: Partial<Record<RunFieldKey, string>> = {};

  const ratio = computeEnduranceRatio(computeV12(input.distance12min), computeV3(input.distance3min));
  if (Number.isFinite(ratio) && ratio >= 1) {
    const fieldMessage = "muss eine langsamere Durchschnittspace ergeben als der 3-Minuten-Test.";
    messages.push(`12-Minuten-Distanz: ${fieldMessage}`);
    fieldErrors.distance12min = fieldMessage;
  }

  return { messages, fieldErrors };
}

function isRunFieldKey(key: string): key is RunFieldKey {
  return key in FIELD_LABELS;
}
