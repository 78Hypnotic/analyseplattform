import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CyclingReportView } from "./cycling-report-view";
import { runBikeAnalysis } from "@/lib/cycling/calculations";
import { DEFAULT_BIKE_INPUT } from "@/lib/cycling/constants";
import type { BikeResult } from "@/lib/cycling/types";

describe("CyclingReportView", () => {
  it("shows the glycolytic dominance for current reports", () => {
    const result = validResult();
    render(<CyclingReportView input={DEFAULT_BIKE_INPUT} result={result} />);

    expect(screen.getByText("Dominanz D")).toBeTruthy();
    expect(screen.getByText(result.glycolyticDominance.toFixed(3))).toBeTruthy();
    expect(screen.queryByText("Alte Modellversion")).toBeNull();
  });

  it("warns when a persisted report cannot be migrated", () => {
    const current = validResult();
    const legacy: BikeResult = {
      ...current,
      modelVersion: "legacy-laeq-v1",
      migrationStatus: "legacy_unmigratable",
      migrationTargetVersion: "vlamax-dominance-v1",
      migrationReason: "vlamax_out_of_range",
    };
    render(<CyclingReportView input={DEFAULT_BIKE_INPUT} result={legacy} />);

    expect(screen.getByText("Alte Modellversion")).toBeTruthy();
    expect(screen.getByText(/historischen Werte bleiben/)).toBeTruthy();
  });
});

function validResult() {
  const result = runBikeAnalysis(DEFAULT_BIKE_INPUT);
  if (!result) throw new Error("Fixture must be valid");
  return result;
}
