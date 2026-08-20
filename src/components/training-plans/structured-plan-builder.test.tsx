import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createEmptyStructuredPlan } from "@/lib/training-plans/content";
import type { TrainingPlanContentV2 } from "@/lib/training-plans/types";
import { StructuredPlanBuilder } from "./structured-plan-builder";

describe("StructuredPlanBuilder", () => {
  it("opens the timeline dialog immediately when a workout is added", () => {
    render(<BuilderHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Workout" }));

    expect(screen.getByRole("dialog", { name: "Neue Schwimmeinheit" })).toBeTruthy();
    expect(screen.getByTestId("session-count").textContent).toBe("2");
  });

  it("stores the selected discipline and updates an untouched default title", () => {
    render(<BuilderHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Workout" }));
    fireEvent.click(screen.getByRole("button", { name: "Rad" }));
    fireEvent.click(screen.getByRole("button", { name: "Workout übernehmen" }));

    expect(screen.getByTestId("latest-session-title").textContent).toBe("Neue Radeinheit");
  });

  it("opens an existing workout directly and saves its session details", () => {
    render(<BuilderHarness />);

    fireEvent.click(screen.getByRole("button", { name: /Neue Schwimmeinheit/ }));

    expect(screen.getByRole("dialog", { name: "Neue Schwimmeinheit" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Titel"), { target: { value: "Schwelle kompakt" } });
    fireEvent.change(screen.getByLabelText("Fokus"), { target: { value: "FTP stabilisieren" } });
    fireEvent.change(screen.getByLabelText("Trainingstag"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Gesamtdauer min"), { target: { value: "75" } });
    fireEvent.click(screen.getByRole("button", { name: "Workout übernehmen" }));

    expect(screen.getByTestId("latest-session-title").textContent).toBe("Schwelle kompakt");
    expect(screen.getByTestId("latest-session-focus").textContent).toBe("FTP stabilisieren");
    expect(screen.getByTestId("latest-session-weekday").textContent).toBe("3");
    expect(screen.getByTestId("latest-session-duration").textContent).toBe("75");
  });
});

function BuilderHarness() {
  const [content, setContent] = useState<TrainingPlanContentV2>(() => createEmptyStructuredPlan());
  const sessionCount = content.weeks.reduce((total, week) => total + week.sessions.length, 0);
  const latestSession = content.weeks[0].sessions.at(-1);

  return (
    <>
      <StructuredPlanBuilder content={content} onChange={setContent} />
      <output data-testid="session-count">{sessionCount}</output>
      <output data-testid="latest-session-title">{latestSession?.title ?? ""}</output>
      <output data-testid="latest-session-focus">{latestSession?.focus ?? ""}</output>
      <output data-testid="latest-session-weekday">{latestSession?.preferredWeekday ?? ""}</output>
      <output data-testid="latest-session-duration">{latestSession?.estimatedDurationMinutes ?? ""}</output>
    </>
  );
}