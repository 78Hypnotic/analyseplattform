import type { AnalysisInput } from "./types";

export const GOALS = [
  {
    id: "Kraulen lernen",
    label: "Kraulen lernen",
    description: "Technikfokus, Einstieg ins Kraulen",
  },
  {
    id: "Beckenschwimmen",
    label: "Beckenschwimmen",
    description: "Training und Wettkampf im Becken",
  },
  {
    id: "Freiwasserschwimmen",
    label: "Freiwasser",
    description: "Lange Strecken, offenes Wasser",
  },
  {
    id: "Triathlon",
    label: "Triathlon",
    description: "Schwimmen als Teildisziplin",
  },
] as const;

export const LEVELS = [
  {
    id: "Einsteiger",
    label: "Einsteiger",
    description: "< 2 Jahre regelmäßig",
  },
  {
    id: "Fortgeschritten",
    label: "Fortgeschritten",
    description: "Saubere Technik, solide Zeiten",
  },
  {
    id: "Ambitioniert",
    label: "Ambitioniert",
    description: "Regelmäßiges Training, Wettkämpfe",
  },
  {
    id: "Leistungsschwimmer",
    label: "Leistungsschwimmer",
    description: "Strukturiertes Training > 5x/Woche",
  },
] as const;

export const TARGET_DISTANCES = [
  {
    id: "Sprint",
    label: "Sprint",
    description: "Kurze Becken- oder Triathlonstrecken",
  },
  {
    id: "OD",
    label: "OD",
    description: "Olympische Distanz im Triathlon",
  },
  {
    id: "MD",
    label: "MD",
    description: "Mitteldistanz mit längerer Belastung",
  },
  {
    id: "LD",
    label: "LD",
    description: "Langdistanz und lange Freiwasseranteile",
  },
  {
    id: "Becken",
    label: "Becken",
    description: "Pool-Wettkampf oder strukturierter Test",
  },
  {
    id: "Freiwasser",
    label: "Freiwasser",
    description: "Orientierung, Rhythmus und Robustheit",
  },
] as const;

export const CHALLENGE_GROUPS = [
  {
    group: "Wasserlage",
    items: ["Ich komme gut ins Gleiten", "Meine Beine sinken ab", "Ich gleite kaum"],
  },
  {
    group: "Armzug",
    items: [
      "Ich habe einen guten Armzug",
      "Ich habe Probleme mit dem frühen Wasserfassen",
      "Ich habe einen kurzen Armzug",
    ],
  },
  {
    group: "Rückführung",
    items: [
      "Ich kann meine Arme locker nach vorne schwingen",
      "Ich schwimme mit hohem Ellenbogen",
      "Ich führe meine Arme gestreckt nach vorne",
      "Ich bekomme die Arme kaum aus dem Wasser",
    ],
  },
  {
    group: "Rotation",
    items: [
      "Ich liege flach und rotiere kaum",
      "Ich rotiere ausreichend",
      "Ich rotiere zu viel und verliere die Balance",
    ],
  },
  {
    group: "Atmung",
    items: [
      "Keine Probleme mit der Atmung",
      "Ich japse schnell nach Luft",
      "Ich hebe den Kopf zu stark",
      "Ich verliere den Rhythmus beim Atmen",
    ],
  },
  {
    group: "Beinarbeit",
    items: [
      "Mein Beinschlag klappt gut",
      "Beinarbeit macht mich müde",
      "Meine Beine erzeugen kaum Vortrieb",
      "Ich mache kaum Beinschlag",
    ],
  },
  {
    group: "Wassergefühl",
    items: [
      "Ich habe ein gutes Wassergefühl",
      "Ich spüre kaum Druck beim Armzug",
      "Ich ziehe schnell, habe aber kaum Vortrieb",
      "Ich ziehe ruhig und gleichmäßig",
    ],
  },
] as const;

export const DEFAULT_ANALYSIS_INPUT: AnalysisInput = {
  name: "Lena Bergmann",
  age: 34,
  gender: "weiblich",
  height: 172,
  weight: 63,
  bodyFatPercentage: 21.5,
  fitnessLevel: 3,
  poolLength: 25,
  t200: "3:38",
  s200: 21,
  t400: "7:48",
  s400: 22.5,
  t50: "38.2",
  goal: "Triathlon",
  level: "Fortgeschritten",
  targetDistance: "OD",
  raceDate: "",
  swimSessionsPerWeek: 3,
  challenges: [
    "Meine Beine sinken ab",
    "Ich habe Probleme mit dem frühen Wasserfassen",
    "Ich hebe den Kopf zu stark",
  ],
};
