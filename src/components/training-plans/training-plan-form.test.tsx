import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TrainingPlanForm } from "./training-plan-form";

vi.mock("@/app/trainingsplaene/verwalten/actions", () => ({
  saveTrainingPlan: vi.fn(async () => ({})),
}));

vi.mock("./structured-plan-builder", () => ({
  StructuredPlanBuilder: () => <div>Planinhalt</div>,
}));

describe("TrainingPlanForm", () => {
  it("guides users from required-field errors to a valid draft", () => {
    render(<TrainingPlanForm />);

    const saveButton = screen.getByRole("button", { name: "Speichern" }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
    expect(screen.getByText("Pflichtfelder vervollständigen")).toBeTruthy();
    expect(screen.getAllByText("*", { selector: "span[aria-hidden=true]" }).length).toBeGreaterThanOrEqual(7);

    const title = screen.getByRole("textbox", { name: "Titel" });
    fireEvent.blur(title);
    expect(screen.getByText("Bitte mindestens 3 Zeichen eingeben.")).toBeTruthy();

    fireEvent.change(title, { target: { value: "Testplan" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Slug" }), { target: { value: "testplan" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Fokus" }), { target: { value: "Grundlage" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Phase" }), { target: { value: "Base" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Zusammenfassung" }), { target: { value: "Ein vollständiger Trainingsplan." } });
    fireEvent.change(screen.getByRole("textbox", { name: "Gesperrte Vorschau" }), { target: { value: "Vorschau für den vollständigen Plan." } });

    expect(saveButton.disabled).toBe(false);
    expect(screen.queryByText("Pflichtfelder vervollständigen")).toBeNull();
    expect(screen.getByText("Weitere Einstellungen").closest("details")?.hasAttribute("open")).toBe(false);
  });
});