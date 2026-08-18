import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReportView } from "./report-view";
import { runAnalysis } from "../lib/analysis/calculations";
import type { AnalysisInput } from "../lib/analysis/types";

const STANDARD_INPUT: AnalysisInput = {
  name: "Lena Bergmann",
  age: 34,
  gender: "weiblich",
  height: 172,
  weight: 63,
  bodyFatPercentage: 21,
  fitnessLevel: 3,
  poolLength: 25,
  canSwim400m: true,
  testType: "wall_push",
  equipment: "ohne",
  t50: "38.2",
  s50: 22,
  t200: "3:38",
  s200: 21,
  t400: "7:48",
  s400: 22,
  goal: "Triathlon",
  level: "Fortgeschritten",
  targetDistance: "MD",
  raceDate: "",
  swimSessionsPerWeek: 3,
  challenges: [],
};

describe("ReportView", () => {
  it("renders the standard report as a coaching-first CSS report", () => {
    const result = runAnalysis(STANDARD_INPUT);
    if (!result || result.mode !== "standard") {
      throw new Error("Expected standard analysis result");
    }

    render(<ReportView input={STANDARD_INPUT} result={result} />);

    expect(screen.getByRole("heading", { name: /Deine CSS beträgt/i })).toBeTruthy();
    expect(screen.queryByText("Physiologisches Profil")).toBeNull();
    expect(screen.queryByText("Aerobe Kapazität")).toBeNull();
    expect(screen.queryByText("Anaerobe Kapazität")).toBeNull();
    expect(screen.getByText("Schwimm-Mechanik")).toBeTruthy();
    expect(screen.getByText("SWOLF")).toBeTruthy();
    expect(screen.getByText("Technikprofil")).toBeTruthy();
    expect(screen.getByRole("img", { name: /Technikprofil:/i })).toBeTruthy();
    expect(screen.getByText("Dein größter Hebel")).toBeTruthy();
    expect(screen.getByText("Trainingszonen")).toBeTruthy();
    expect(screen.getByText("Z3 Schwelle")).toBeTruthy();
    expect(screen.getByText("Empfohlener Trainingsplan")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Trainingsplan freischalten" })).toBeTruthy();
    expect(screen.queryByText("Dein aktuelles Schwimmmuster")).toBeNull();
    expect(screen.queryByText("Trainingshebel")).toBeNull();
    expect(screen.getByText("Expertenmodus / Details")).toBeTruthy();
    expect(screen.queryByText("Radar")).toBeNull();
    expect(screen.queryByText("VO2-Proxy")).toBeNull();
    expect(screen.queryByText("VLa-Proxy")).toBeNull();
    expect(screen.queryByText("Sprint-Reserve")).toBeNull();
  });

  it("keeps technique-only reports focused on technique before physiology", () => {
    const input: AnalysisInput = {
      ...STANDARD_INPUT,
      canSwim400m: false,
      t400: "",
      s400: undefined,
    };
    const result = runAnalysis(input);
    if (!result || result.mode !== "technique_only") {
      throw new Error("Expected technique-only analysis result");
    }

    render(<ReportView input={input} result={result} />);

    expect(screen.getByRole("heading", { name: "Erst Technik stabilisieren, dann physiologisch auswerten." })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /Deine CSS beträgt/i })).toBeNull();
    expect(screen.getByText("Schwimm-Mechanik")).toBeTruthy();
    expect(screen.queryByText("Trainingshebel")).toBeNull();
  });

  it("renders beginner reports without any swim test data", () => {
    const input: AnalysisInput = {
      ...STANDARD_INPUT,
      canSwim400m: false,
      level: "Einsteiger",
      goal: "Kraulen lernen",
      targetDistance: "Becken",
      t50: "",
      s50: undefined,
      t200: "",
      s200: undefined,
      t400: "",
      s400: undefined,
    };
    const result = runAnalysis(input);
    if (!result || result.mode !== "technique_only") {
      throw new Error("Expected technique-only analysis result");
    }

    render(<ReportView input={input} result={result} />);

    expect(screen.getByRole("heading", { name: /Schön, dass du mit dem Schwimmen anfängst/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Anfängerplan freischalten" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /Deine CSS beträgt/i })).toBeNull();
    expect(screen.queryByText("Schwimm-Mechanik")).toBeNull();
    expect(screen.queryByText("Expertenmodus / Details")).toBeNull();
  });

  it("renders stored legacy standard reports without newer optional fields", () => {
    const result = runAnalysis(STANDARD_INPUT);
    if (!result || result.mode !== "standard") {
      throw new Error("Expected standard analysis result");
    }

    const legacyResult = structuredClone(result) as Record<string, unknown>;
    delete legacyResult.mode;
    delete legacyResult.techniqueGate;
    delete legacyResult.styleProfile;
    delete legacyResult.metabolicProfile;
    delete legacyResult.spiderScores;
    legacyResult.plan = {
      slug: result.plan.slug,
      name: result.plan.name,
      phase: result.plan.phase,
      weeks: result.plan.weeks,
    };

    render(<ReportView input={STANDARD_INPUT} result={legacyResult as never} />);

    expect(screen.getByRole("heading", { name: /Deine CSS beträgt/i })).toBeTruthy();
    expect(screen.getByText("Schwimm-Mechanik")).toBeTruthy();
    expect(screen.getByText("Expertenmodus / Details")).toBeTruthy();
  });
});
