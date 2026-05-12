import { analysisInputSchema } from "./schema";
import { computeCSS, computePace, parseTime } from "./calculations";
import type { AnalysisInput } from "./types";

export type AnalysisFieldKey = keyof AnalysisInput;

export type AnalysisValidationResult = {
  messages: string[];
  fieldErrors: Partial<Record<AnalysisFieldKey, string>>;
};

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  age: "Alter",
  gender: "Geschlecht",
  height: "Größe",
  weight: "Gewicht",
  bodyFatPercentage: "KFA",
  fitnessLevel: "Fitnesslevel",
  poolLength: "Becken",
  canSwim400m: "400 m am Stück",
  testType: "Testart",
  equipment: "Hilfsmittel",
  t50: "50 m Zeit",
  s50: "50 m Züge pro Bahn",
  t200: "200 m Zeit",
  s200: "200 m Züge pro Bahn",
  t400: "400 m Zeit",
  s400: "400 m Züge pro Bahn",
  goal: "Ziel",
  level: "Niveau",
  targetDistance: "Zielwettkampf",
  raceDate: "Wettkampfdatum",
  swimSessionsPerWeek: "Schwimmeinheiten pro Woche",
  challenges: "Technische Herausforderungen",
};

const FIELD_MESSAGES: Record<string, string> = {
  name: "muss 2 bis 80 Zeichen haben.",
  age: "muss zwischen 8 und 100 liegen.",
  gender: "bitte auswählen.",
  height: "muss zwischen 100 und 230 cm liegen.",
  weight: "muss zwischen 25 und 180 kg liegen.",
  bodyFatPercentage: "muss zwischen 3 und 60 % liegen.",
  fitnessLevel: "muss zwischen 1 und 5 liegen.",
  poolLength: "bitte 25 m oder 50 m auswählen.",
  canSwim400m: "bitte auswählen.",
  testType: "bitte auswählen.",
  equipment: "bitte auswählen.",
  t50: "bitte als Sekunden oder mm:ss eingeben.",
  s50: "muss größer als 0 und maximal 80 sein.",
  t200: "bitte als Sekunden oder mm:ss eingeben.",
  s200: "muss größer als 0 und maximal 80 sein.",
  t400: "bitte als Sekunden oder mm:ss eingeben.",
  s400: "muss größer als 0 und maximal 80 sein.",
  goal: "bitte auswählen.",
  level: "bitte auswählen.",
  targetDistance: "bitte auswählen.",
  raceDate: "bitte als gültiges Datum eingeben.",
  swimSessionsPerWeek: "muss zwischen 1 und 7 liegen.",
  challenges: "bitte maximal 12 Einträge auswählen.",
};

export function getAnalysisValidationMessages(input: unknown): string[] {
  return getAnalysisValidationResult(input).messages;
}

export function getAnalysisValidationResult(input: unknown): AnalysisValidationResult {
  const parsed = analysisInputSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<AnalysisFieldKey, string>> = {};
    const messages = parsed.error.issues.map((issue) => {
      const key = String(issue.path[0] ?? "");
      const field = FIELD_LABELS[key] ?? "Eingabe";
      const fieldMessage =
        key === "raceDate"
          ? FIELD_MESSAGES[key]
          : issue.code === "custom"
            ? issue.message
            : (FIELD_MESSAGES[key] ?? issue.message);
      const message = `${field}: ${fieldMessage}`;
      if (isAnalysisFieldKey(key) && !fieldErrors[key]) {
        fieldErrors[key] = fieldMessage;
      }
      return message;
    });
    return { messages, fieldErrors };
  }

  return getCalculationValidationResult(parsed.data);
}

function getCalculationValidationResult(input: AnalysisInput): AnalysisValidationResult {
  const messages: string[] = [];
  const fieldErrors: Partial<Record<AnalysisFieldKey, string>> = {};
  const t50 = parseTime(input.t50);
  const t200 = parseTime(input.t200);
  const t400 = parseTime(input.t400);

  if (!Number.isFinite(t50) || t50 <= 0) {
    addValidationError(messages, fieldErrors, "t50", "50 m Zeit: muss größer als 0 sein.", "muss größer als 0 sein.");
  }
  if (!Number.isFinite(t200) || t200 <= 0) {
    addValidationError(messages, fieldErrors, "t200", "200 m Zeit: muss größer als 0 sein.", "muss größer als 0 sein.");
  }
  if (input.canSwim400m) {
    if (!Number.isFinite(t400) || t400 <= 0) {
      addValidationError(messages, fieldErrors, "t400", "400 m Zeit: muss größer als 0 sein.", "muss größer als 0 sein.");
    }
    if (Number.isFinite(t200) && Number.isFinite(t400) && Number.isNaN(computeCSS(t200, t400))) {
      addValidationError(
        messages,
        fieldErrors,
        "t400",
        "400 m Zeit: muss langsamer sein als die 200 m Zeit.",
        "muss langsamer sein als die 200 m Zeit.",
      );
    }
    if (
      Number.isFinite(t200) &&
      Number.isFinite(t400) &&
      computePace(400, t400) <= computePace(200, t200)
    ) {
      addValidationError(
        messages,
        fieldErrors,
        "t400",
        "400 m Pace: muss langsamer sein als die 200 m Pace.",
        "muss langsamer sein als die 200 m Pace.",
      );
    }
  }

  return { messages, fieldErrors };
}

function addValidationError(
  messages: string[],
  fieldErrors: Partial<Record<AnalysisFieldKey, string>>,
  field: AnalysisFieldKey,
  message: string,
  fieldMessage: string,
) {
  messages.push(message);
  fieldErrors[field] ??= fieldMessage;
}

function isAnalysisFieldKey(key: string): key is AnalysisFieldKey {
  return key in FIELD_LABELS;
}
