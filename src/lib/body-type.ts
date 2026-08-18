import type { BodyFatSex } from "./body-fat";

export type BodyType = "ektomorph" | "mesomorph" | "endomorph";

export const BODY_TYPES = [
  {
    value: "ektomorph",
    label: "Schlank",
    term: "ektomorph",
    description: "Schmaler Bau, lange Gliedmaßen, baut Masse langsam auf.",
  },
  {
    value: "mesomorph",
    label: "Athletisch",
    term: "mesomorph",
    description: "Breite Schultern, kompakter Rumpf, baut Muskulatur leicht auf.",
  },
  {
    value: "endomorph",
    label: "Kräftig",
    term: "endomorph",
    description: "Kräftiger Rumpf, breitere Hüfte, speichert Reserven schneller.",
  },
] as const satisfies ReadonlyArray<{
  value: BodyType;
  label: string;
  term: string;
  description: string;
}>;

export function getBodyTypeImageSrc(sex: BodyFatSex, bodyType: BodyType) {
  return `/bodytype/bodytype-${sex}-${bodyType}.png`;
}

export function getBodyTypeLabel(bodyType: BodyType) {
  return BODY_TYPES.find((item) => item.value === bodyType)?.label ?? bodyType;
}

export function parseBodyType(value: unknown): BodyType | undefined {
  return BODY_TYPES.some((item) => item.value === value) ? (value as BodyType) : undefined;
}
