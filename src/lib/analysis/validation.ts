import { analysisInputSchema } from "./schema";
import { computeCSS, parseTime } from "./calculations";
import type { AnalysisInput } from "./types";

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  age: "Alter",
  gender: "Geschlecht",
  height: "Größe",
  weight: "Gewicht",
  poolLength: "Becken",
  t200: "200 m Zeit",
  s200: "200 m Züge pro Bahn",
  t400: "400 m Zeit",
  s400: "400 m Züge pro Bahn",
  t50: "50 m Sprintzeit",
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
  poolLength: "bitte 25 m oder 50 m auswählen.",
  t200: "bitte als Sekunden oder mm:ss eingeben.",
  s200: "muss größer als 0 und maximal 80 sein.",
  t400: "bitte als Sekunden oder mm:ss eingeben.",
  s400: "muss größer als 0 und maximal 80 sein.",
  t50: "bitte als Sekunden oder mm:ss eingeben.",
  goal: "bitte auswählen.",
  level: "bitte auswählen.",
  targetDistance: "bitte auswählen.",
  raceDate: "bitte als gültiges Datum eingeben.",
  swimSessionsPerWeek: "muss zwischen 1 und 7 liegen.",
  challenges: "bitte maximal 12 Einträge auswählen.",
};

export function getAnalysisValidationMessages(input: unknown): string[] {
  const parsed = analysisInputSchema.safeParse(input);

  if (!parsed.success) {
    return parsed.error.issues.map((issue) => {
      const key = String(issue.path[0] ?? "");
      const field = FIELD_LABELS[key] ?? "Eingabe";
      return `${field}: ${FIELD_MESSAGES[key] ?? issue.message}`;
    });
  }

  return getCalculationValidationMessages(parsed.data);
}

function getCalculationValidationMessages(input: AnalysisInput): string[] {
  const messages: string[] = [];
  const t200 = parseTime(input.t200);
  const t400 = parseTime(input.t400);

  if (!Number.isFinite(t200) || t200 <= 0) {
    messages.push("200 m Zeit: muss größer als 0 sein.");
  }
  if (!Number.isFinite(t400) || t400 <= 0) {
    messages.push("400 m Zeit: muss größer als 0 sein.");
  }
  if (Number.isFinite(t200) && Number.isFinite(t400) && Number.isNaN(computeCSS(t200, t400))) {
    messages.push("400 m Zeit: muss langsamer sein als die 200 m Zeit.");
  }

  return messages;
}
