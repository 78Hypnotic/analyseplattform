import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardHome, type DashboardHomeProps } from "./dashboard-home";

const baseProps: DashboardHomeProps = {
  profile: {
    fullName: "Mara Muster",
    city: null,
    age: null,
    heightCm: null,
    weightKg: null,
    fitnessLevel: null,
    disciplines: [],
    isComplete: false,
    latestSwimAnalyzedAt: null,
    latestSwimCssPaceSec: null,
    latestRunAnalyzedAt: null,
    latestRunCsPaceSec: null,
    latestBikeAnalyzedAt: null,
    latestBikeFtpWatt: null,
  },
  analyses: [],
  swimTechniqueAxes: null,
  activeTrainingPlan: null,
  isCoach: false,
  isAdmin: false,
};

describe("DashboardHome", () => {
  it("hides the training module when no plan is active", () => {
    render(<DashboardHome {...baseProps} />);

    expect(screen.getByRole("heading", { name: "Willkommen zurück, Mara." })).toBeTruthy();
    expect(screen.queryByText(/Mein Training/)).toBeNull();
    expect(screen.getByText(/Noch keine Analyse gespeichert/)).toBeTruthy();
    expect(screen.getByText("Noch kein Technikprofil vorhanden")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Mara Muster" })).toBeTruthy();
    expect(screen.getByText("Basisdaten für präzisere Analysen vervollständigen")).toBeTruthy();
    expect(screen.queryByText("Steuerzentrale")).toBeNull();
  });

  it("shows a summary when a training plan is active", () => {
    render(
      <DashboardHome
        {...baseProps}
        activeTrainingPlan={{
          id: "plan-1",
          title: "Technik stabilisieren",
          focus: "Wasserlage und früher Catch",
          weeks: 4,
          discipline: "swim",
          startDate: "2026-08-17",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Technik stabilisieren" })).toBeTruthy();
    expect(screen.getByText("Wasserlage und früher Catch")).toBeTruthy();
    expect(screen.getByText(/4 Wochen/)).toBeTruthy();
  });

  it("shows the athlete's key profile information", () => {
    render(
      <DashboardHome
        {...baseProps}
        profile={{
          ...baseProps.profile,
          city: "Hamburg",
          age: 34,
          heightCm: 172,
          weightKg: 63.5,
          fitnessLevel: 4,
          disciplines: ["Schwimmen", "Laufen", "Radfahren"],
          isComplete: true,
        }}
      />,
    );

    expect(screen.getByText("Hamburg")).toBeTruthy();
    expect(screen.getByText("34 Jahre")).toBeTruthy();
    expect(screen.getByText("1,72 m")).toBeTruthy();
    expect(screen.getByText("63,5 kg")).toBeTruthy();
    expect(screen.getByText("4 / 5")).toBeTruthy();
    expect(screen.getByText("Schwimmen · Laufen · Radfahren")).toBeTruthy();
  });

  it("shows the swim technique radar, running threshold pace, and bike FTP", () => {
    render(
      <DashboardHome
        {...baseProps}
        profile={{
          ...baseProps.profile,
          latestSwimAnalyzedAt: "2026-08-18T08:00:00Z",
          latestSwimCssPaceSec: 105,
          latestRunAnalyzedAt: "2026-08-17T08:00:00Z",
          latestRunCsPaceSec: 286,
          latestBikeAnalyzedAt: "2026-08-16T08:00:00Z",
          latestBikeFtpWatt: 238,
        }}
        swimTechniqueAxes={[
          { group: "Wasserlage", score: 85, status: "stark", statement: "Stabil" },
          { group: "Atmung", score: 55, status: "offen", statement: "Offen" },
          { group: "Zug", score: 30, status: "fokus", statement: "Fokus" },
        ]}
      />,
    );

    expect(screen.getByRole("img", { name: /Technikprofil/ })).toBeTruthy();
    expect(screen.getByText("4:46")).toBeTruthy();
    expect(screen.getByText("238")).toBeTruthy();
    expect(screen.queryByText("Schnellstart")).toBeNull();
  });

  it("links analyses to their discipline reports", () => {
    render(
      <DashboardHome
        {...baseProps}
        analyses={[
          { id: "swim-1", title: "CSS Analyse", discipline: "swim", createdAt: "2026-08-18T08:00:00Z" },
          { id: "run-1", title: "Critical Speed", discipline: "run", createdAt: "2026-08-17T08:00:00Z" },
          { id: "bike-1", title: "FTP Analyse", discipline: "bike", createdAt: "2026-08-16T08:00:00Z" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: /CSS Analyse/ }).getAttribute("href")).toBe("/analyse/swim-1");
    expect(screen.getByRole("link", { name: /Critical Speed/ }).getAttribute("href")).toBe("/lauf/run-1");
    expect(screen.getByRole("link", { name: /FTP Analyse/ }).getAttribute("href")).toBe("/rad/bike-1");
  });

  it("adds coach and admin modules without replacing the athlete dashboard", () => {
    render(<DashboardHome {...baseProps} isCoach isAdmin coachAthleteCount={3} />);

    expect(screen.getByRole("heading", { name: "3 Athleten" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Steuerzentrale" })).toBeTruthy();
    expect(screen.queryByText(/Mein Training/)).toBeNull();
  });
});