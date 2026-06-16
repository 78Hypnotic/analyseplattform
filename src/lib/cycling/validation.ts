import { bikeInputSchema } from "./schema";
import { computeGlycolytic, computeVlamaxProxy } from "./calculations";
import { VLAMAX_MAX, VLAMAX_MIN } from "./constants";
import type { BikeInput } from "./types";

export type BikeFieldKey = keyof BikeInput;

export type BikeValidationResult = {
  messages: string[];
  fieldErrors: Partial<Record<BikeFieldKey, string>>;
};

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  age: "Alter",
  gender: "Geschlecht",
  height: "Größe",
  weight: "Gewicht",
  bodyFatPercentage: "KFA",
  fitnessLevel: "Fitnesslevel",
  sprintPeakWatt: "Sprint Peak-Leistung",
  sprintAvg20sWatt: "Sprint Ø 20 s",
  rampLastStageWatt: "Letzte Rampenstufe",
  rampExtraSeconds: "Zusatzsekunden",
  goal: "Ziel",
  raceDate: "Wettkampfdatum",
  bikeSessionsPerWeek: "Radeinheiten pro Woche",
  validation12minWatt: "12-Minuten-Leistung",
};

const FIELD_MESSAGES: Record<string, string> = {
  name: "muss 2 bis 80 Zeichen haben.",
  age: "muss zwischen 8 und 100 liegen.",
  gender: "bitte auswählen.",
  height: "muss zwischen 100 und 230 cm liegen.",
  weight: "muss zwischen 25 und 180 kg liegen.",
  bodyFatPercentage: "muss zwischen 3 und 60 % liegen.",
  fitnessLevel: "muss zwischen 1 und 5 liegen.",
  sprintPeakWatt: "muss zwischen 200 und 2500 W liegen.",
  sprintAvg20sWatt: "muss zwischen 150 und 2000 W liegen.",
  rampLastStageWatt: "muss zwischen 50 und 700 W liegen.",
  rampExtraSeconds: "muss zwischen 0 und 29 liegen.",
  goal: "bitte auswählen.",
  raceDate: "bitte als gültiges Datum eingeben.",
  bikeSessionsPerWeek: "muss zwischen 1 und 14 liegen.",
  validation12minWatt: "muss zwischen 50 und 700 W liegen.",
};

export function getBikeValidationMessages(input: unknown): string[] {
  return getBikeValidationResult(input).messages;
}

export function getBikeValidationResult(input: unknown): BikeValidationResult {
  const parsed = bikeInputSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Partial<Record<BikeFieldKey, string>> = {};
    const messages = parsed.error.issues.map((issue) => {
      const key = String(issue.path[0] ?? "");
      const field = FIELD_LABELS[key] ?? "Eingabe";
      const fieldMessage =
        issue.code === "custom" ? issue.message : (FIELD_MESSAGES[key] ?? issue.message);
      if (isBikeFieldKey(key) && !fieldErrors[key]) {
        fieldErrors[key] = fieldMessage;
      }
      return `${field}: ${fieldMessage}`;
    });
    return { messages, fieldErrors };
  }

  return getCalculationValidationResult(parsed.data);
}

function getCalculationValidationResult(input: BikeInput): BikeValidationResult {
  const messages: string[] = [];
  const fieldErrors: Partial<Record<BikeFieldKey, string>> = {};

  const { wgly } = computeGlycolytic(input.sprintPeakWatt, input.sprintAvg20sWatt);
  if (wgly <= 0) {
    const fieldMessage = "ergibt keine glykolytische Arbeit. Bitte Sprintwerte prüfen.";
    messages.push(`Sprint Ø 20 s: ${fieldMessage}`);
    fieldErrors.sprintAvg20sWatt = fieldMessage;
    return { messages, fieldErrors };
  }

  const { vlamaxProxy } = computeVlamaxProxy(wgly, input.weight);
  if (!Number.isFinite(vlamaxProxy) || vlamaxProxy < VLAMAX_MIN || vlamaxProxy > VLAMAX_MAX) {
    const fieldMessage = `ergibt einen VLamax-Proxy außerhalb des plausiblen Bereichs (${VLAMAX_MIN}–${VLAMAX_MAX}). Bitte Sprintwerte prüfen.`;
    messages.push(`Sprint Ø 20 s: ${fieldMessage}`);
    fieldErrors.sprintAvg20sWatt = fieldMessage;
  }

  return { messages, fieldErrors };
}

function isBikeFieldKey(key: string): key is BikeFieldKey {
  return key in FIELD_LABELS;
}
