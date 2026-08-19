import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TechniqueSpiderChart } from "./technique-spider-chart";

const axes = [
  { group: "Wasserlage" as const, score: 30, status: "fokus" as const, statement: "Beine sinken" },
  { group: "Zugphase" as const, score: 55, status: "offen" as const, statement: "Offen" },
  { group: "Druckphase" as const, score: 85, status: "stark" as const, statement: "Stark" },
];

describe("TechniqueSpiderChart", () => {
  it("renders the current profile without a forecast by default", () => {
    const { container } = render(<TechniqueSpiderChart axes={axes} />);
    expect(screen.getByRole("img").getAttribute("aria-label")).not.toContain("Trainingsfokus");
    expect(container.querySelector("[stroke-dasharray]")).toBeNull();
  });

  it("renders a dashed, accessible focus sector without claiming a forecast", () => {
    const { container } = render(<TechniqueSpiderChart axes={axes} focusGroup="Wasserlage" />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("Trainingsfokus: Wasserlage, keine Prognose");
    expect(container.querySelector('[stroke-dasharray="6 5"]')).toBeTruthy();
    expect(screen.getByText(/Trainingsfokus: Wasserlage/)).toBeTruthy();
  });
});