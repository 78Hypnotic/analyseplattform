import { describe, expect, it } from "vitest";
import { shouldRefreshLatestAnalysis } from "./analysis-mutation-policy";

describe("shouldRefreshLatestAnalysis", () => {
  it("refreshes profile summaries for new analyses", () => {
    expect(shouldRefreshLatestAnalysis({ latestAnalysisId: "latest" })).toBe(true);
  });

  it("refreshes profile summaries when the latest analysis is edited", () => {
    expect(shouldRefreshLatestAnalysis({
      analysisId: "latest",
      latestAnalysisId: "latest",
    })).toBe(true);
  });

  it("keeps profile summaries unchanged when an older analysis is edited", () => {
    expect(shouldRefreshLatestAnalysis({
      analysisId: "older",
      latestAnalysisId: "latest",
    })).toBe(false);
  });
});
