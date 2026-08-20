import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import type { WorkoutContent } from "@/lib/training-plans/types";
import { WorkoutTimelineBuilder } from "./workout-timeline-builder";

describe("WorkoutTimelineBuilder", () => {
  it("visualizes repeated work and recovery segments by duration and intensity", () => {
    render(<WorkoutTimelineBuilder content={intervalWorkout} onChange={() => {}} />);

    const workSegments = screen.getAllByRole("button", { name: /VO2 Intervalle: Belastung \d, 5 min, 110%/ });
    const recoverySegments = screen.getAllByRole("button", { name: /VO2 Intervalle: Erholung, 3 min, 45%/ });

    expect(workSegments).toHaveLength(3);
    expect(recoverySegments).toHaveLength(3);
    expect(workSegments[0].getAttribute("style")).toContain("height: 55%");
    expect(workSegments[0].getAttribute("style")).toContain("flex-grow: 300");
    expect(workSegments[0].className).toContain("workout-timeline-segment");
    expect(workSegments[1].style.animationDelay).toBe("56ms");
  });

  it("edits distance in kilometers and scales the timeline by meters", () => {
    render(<DistanceBuilderHarness />);

    expect(screen.getByText("Breite = Distanz · Höhe = Intensität")).toBeTruthy();
    expect(screen.getAllByText("3 km")).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("Distanzeinheit"), { target: { value: "km" } });
    fireEvent.change(screen.getByLabelText("Distanz"), { target: { value: "2.5" } });

    expect(screen.getByTestId("distance-meters").textContent).toBe("2500");
  });
});

function DistanceBuilderHarness() {
  const [content, setContent] = useState<WorkoutContent>({
    schemaVersion: 1,
    discipline: "bike",
    axisMode: "distance",
    blocks: [{
      id: "distance-block",
      title: "Distanzblock",
      kind: "steady",
      repeatCount: 1,
      steps: [{
        id: "distance-step",
        title: "Grundlage",
        duration: { type: "distance", meters: 3000 },
        targets: [{ type: "threshold_power_percentage", minPercent: 65, maxPercent: 75 }],
      }],
    }],
  });
  const duration = content.blocks[0].steps[0].duration;

  return (
    <>
      <WorkoutTimelineBuilder content={content} onChange={setContent} />
      <output data-testid="distance-meters">{duration.type === "distance" ? duration.meters : 0}</output>
    </>
  );
}

const intervalWorkout: WorkoutContent = {
  schemaVersion: 1,
  discipline: "bike",
  blocks: [
    {
      id: "block-vo2",
      title: "VO2 Intervalle",
      kind: "interval",
      repeatCount: 3,
      steps: [
        {
          id: "step-work",
          title: "Belastung",
          duration: { type: "time", seconds: 300 },
          recoverySeconds: 180,
          targets: [{ type: "threshold_power_percentage", minPercent: 105, maxPercent: 110 }],
        },
      ],
    },
  ],
};