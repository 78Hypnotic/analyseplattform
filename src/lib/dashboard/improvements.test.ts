import { describe, expect, it } from "vitest";
import {
  buildDashboardImprovements,
  computeHigherIsBetterDelta,
  computeLowerIsBetterDelta,
} from "./improvements";

describe("dashboard improvements", () => {
  it("treats lower pace as an improvement", () => {
    const delta = computeLowerIsBetterDelta(
      { value: 100, createdAt: "2026-08-20T08:00:00Z" },
      { value: 105, createdAt: "2026-07-20T08:00:00Z" },
    );

    expect(delta.direction).toBe("improved");
    expect(delta.improvementValue).toBe(5);
    expect(delta.percentDelta).toBeCloseTo(4.76, 2);
  });

  it("treats higher power as an improvement", () => {
    const delta = computeHigherIsBetterDelta(
      { value: 260, createdAt: "2026-08-20T08:00:00Z" },
      { value: 240, createdAt: "2026-07-20T08:00:00Z" },
    );

    expect(delta.direction).toBe("improved");
    expect(delta.improvementValue).toBe(20);
    expect(delta.percentDelta).toBeCloseTo(8.33, 2);
  });

  it("builds previous and first comparisons per discipline", () => {
    const improvements = buildDashboardImprovements([
      { discipline: "swim", result: { cssPace: 112 }, created_at: "2026-06-01T08:00:00Z" },
      { discipline: "swim", result: { mode: "technique_only" }, created_at: "2026-07-01T08:00:00Z" },
      { discipline: "swim", result: { cssPace: 108 }, created_at: "2026-08-01T08:00:00Z" },
      { discipline: "swim", result: { cssPace: 104 }, created_at: "2026-08-20T08:00:00Z" },
      { discipline: "run", result: { csPaceSecPerKm: 300 }, created_at: "2026-07-01T08:00:00Z" },
      { discipline: "run", result: { csPaceSecPerKm: 292 }, created_at: "2026-08-01T08:00:00Z" },
      { discipline: "bike", result: { ftpWatt: 230 }, created_at: "2026-07-01T08:00:00Z" },
      { discipline: "bike", result: { ftpWatt: 245 }, created_at: "2026-08-01T08:00:00Z" },
    ]);

    expect(improvements.swimCss?.testCount).toBe(3);
    expect(improvements.swimCss?.latestVsPrevious.improvementValue).toBe(4);
    expect(improvements.swimCss?.latestVsFirst.improvementValue).toBe(8);
    expect(improvements.runCs?.latestVsFirst.direction).toBe("improved");
    expect(improvements.bikeFtp?.latestVsFirst.improvementValue).toBe(15);
  });

  it("returns null when fewer than two usable tests exist", () => {
    const improvements = buildDashboardImprovements([
      { discipline: "swim", result: { mode: "technique_only" }, created_at: "2026-08-01T08:00:00Z" },
      { discipline: "bike", result: { ftpWatt: 240 }, created_at: "2026-08-01T08:00:00Z" },
    ]);

    expect(improvements.swimCss).toBeNull();
    expect(improvements.runCs).toBeNull();
    expect(improvements.bikeFtp).toBeNull();
  });
});