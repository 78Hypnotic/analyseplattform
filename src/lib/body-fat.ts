import type { BodyType } from "./body-type";

export type BodyFatSex = "female" | "male";

export const BODY_FAT_PRESETS = {
  female: [
    { level: 1, value: 14, label: "Athletisch", range: "10-16%", imageSrc: "/bodyfat/bodyfat-female-1.png" },
    { level: 2, value: 20, label: "Fit", range: "17-22%", imageSrc: "/bodyfat/bodyfat-female-2.png" },
    { level: 3, value: 26, label: "Normal", range: "23-28%", imageSrc: "/bodyfat/bodyfat-female-3.png" },
    { level: 4, value: 32, label: "Erhöht", range: "29-34%", imageSrc: "/bodyfat/bodyfat-female-4.png" },
    { level: 5, value: 38, label: "Hoch", range: "35%+", imageSrc: "/bodyfat/bodyfat-female-5.png" },
  ],
  male: [
    { level: 1, value: 8, label: "Athletisch", range: "6-10%", imageSrc: "/bodyfat/bodyfat-male-1.png" },
    { level: 2, value: 14, label: "Fit", range: "11-17%", imageSrc: "/bodyfat/bodyfat-male-2.png" },
    { level: 3, value: 20, label: "Normal", range: "18-24%", imageSrc: "/bodyfat/bodyfat-male-3.png" },
    { level: 4, value: 26, label: "Erhöht", range: "25-29%", imageSrc: "/bodyfat/bodyfat-male-4.png" },
    { level: 5, value: 32, label: "Hoch", range: "30%+", imageSrc: "/bodyfat/bodyfat-male-5.png" },
  ],
} as const;

export function getBodyFatStatus(sex: BodyFatSex, value: number | null | "") {
  if (value === null || value === "") return "Normal";
  if (sex === "male") {
    if (value <= 10) return "Athletisch";
    if (value <= 17) return "Fit";
    if (value <= 24) return "Normal";
    if (value <= 29) return "Erhöht";
    return "Hoch";
  }
  if (value <= 16) return "Athletisch";
  if (value <= 22) return "Fit";
  if (value <= 28) return "Normal";
  if (value <= 34) return "Erhöht";
  return "Hoch";
}

export function getBodyFatImageSrc(sex: BodyFatSex, value: number | null | "", bodyType?: BodyType | null) {
  const preset = getBodyFatPresetForValue(sex, value);
  return bodyType ? `/bodyfat/bodyfat-${sex}-${bodyType}-${preset.level}.png` : preset.imageSrc;
}

export function getBodyFatFallbackImageSrc(sex: BodyFatSex, value: number | null | "") {
  return getBodyFatPresetForValue(sex, value).imageSrc;
}

export function getBodyFatPresetForValue(sex: BodyFatSex, value: number | null | "") {
  const presets = BODY_FAT_PRESETS[sex];
  if (value === null || value === "") {
    return presets.find((item) => item.label === "Normal") ?? presets[2];
  }
  return presets.reduce((nearest, item) => (Math.abs(item.value - value) < Math.abs(nearest.value - value) ? item : nearest), presets[0]);
}

export function getBodyFatSexFromGender(gender: "weiblich" | "maennlich" | "divers" | "" | null | undefined): BodyFatSex {
  return gender === "maennlich" ? "male" : "female";
}
