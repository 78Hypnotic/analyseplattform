import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmptyWorkoutContent } from "@/lib/training-plans/content";
import { WorkoutTimelineLauncher } from "./workout-timeline-dialog";

afterEach(() => {
  document.body.style.overflow = "";
});

describe("WorkoutTimelineLauncher", () => {
  it("opens the builder in a modal and saves the draft", () => {
    const onChange = vi.fn();
    const content = createEmptyWorkoutContent("bike");
    render(<WorkoutTimelineLauncher content={content} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Workout Builder öffnen" }));

    expect(screen.getByRole("dialog", { name: "Workout bearbeiten" })).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Grundlage" }));
    fireEvent.click(screen.getByRole("button", { name: "Workout übernehmen" }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].blocks).toHaveLength(content.blocks.length + 1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("discards the draft when cancelled", () => {
    const onChange = vi.fn();
    render(<WorkoutTimelineLauncher content={createEmptyWorkoutContent("run")} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Workout Builder öffnen" }));
    fireEvent.click(screen.getByRole("button", { name: "Intervall" }));
    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape without saving", () => {
    const onChange = vi.fn();
    render(<WorkoutTimelineLauncher content={createEmptyWorkoutContent("swim")} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Workout Builder öffnen" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("saves the selected workout discipline", () => {
    const onChange = vi.fn();
    render(
      <WorkoutTimelineLauncher
        content={createEmptyWorkoutContent("swim")}
        onChange={onChange}
        title="Neue Schwimmeinheit"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Workout Builder öffnen" }));
    fireEvent.click(screen.getByRole("button", { name: "Rad" }));
    expect(screen.getByRole("heading", { name: "Neue Radeinheit" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Workout übernehmen" }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ discipline: "bike" }));
  });
});