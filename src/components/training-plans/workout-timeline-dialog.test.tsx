import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyWorkoutContent } from "@/lib/training-plans/content";
import type { WorkoutLibraryItem } from "@/lib/training-plans/types";

const libraryActions = vi.hoisted(() => ({
  listWorkoutLibraryItems: vi.fn(),
  saveWorkoutLibraryItem: vi.fn(),
  updateWorkoutLibraryItem: vi.fn(),
  setWorkoutLibraryFavorite: vi.fn(),
  markWorkoutLibraryItemUsed: vi.fn(),
  deleteWorkoutLibraryItem: vi.fn(),
}));
const feedback = vi.hoisted(() => ({ notify: vi.fn(), dismiss: vi.fn(), isOnline: true }));

vi.mock("@/app/trainingsplaene/verwalten/workout-library-actions", () => libraryActions);
vi.mock("@/components/feedback-provider", () => ({ useFeedback: () => feedback }));

import { WorkoutTimelineLauncher } from "./workout-timeline-dialog";

beforeEach(() => {
  vi.clearAllMocks();
  feedback.notify.mockReset();
  feedback.isOnline = true;
  libraryActions.listWorkoutLibraryItems.mockResolvedValue({ status: "success", items: [] });
  libraryActions.saveWorkoutLibraryItem.mockResolvedValue({ status: "error", message: "Nicht konfiguriert." });
  libraryActions.updateWorkoutLibraryItem.mockResolvedValue({ status: "error", message: "Nicht konfiguriert." });
  libraryActions.setWorkoutLibraryFavorite.mockResolvedValue({ status: "error", message: "Nicht konfiguriert." });
  libraryActions.markWorkoutLibraryItemUsed.mockResolvedValue({ status: "error", message: "Nicht konfiguriert." });
  libraryActions.deleteWorkoutLibraryItem.mockResolvedValue({ status: "error", message: "Nicht konfiguriert." });
});

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

  it("undoes and redoes builder changes from the toolbar", () => {
    const onChange = vi.fn();
    const content = createEmptyWorkoutContent("bike");
    render(<WorkoutTimelineLauncher content={content} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Workout Builder öffnen" }));
    const undo = screen.getByRole("button", { name: "Rückgängig" }) as HTMLButtonElement;
    const redo = screen.getByRole("button", { name: "Wiederholen" }) as HTMLButtonElement;
    expect(undo.disabled).toBe(true);
    expect(redo.disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Grundlage" }));
    expect(undo.disabled).toBe(false);
    fireEvent.click(undo);
    expect(redo.disabled).toBe(false);
    fireEvent.click(redo);
    fireEvent.click(screen.getByRole("button", { name: "Workout übernehmen" }));

    expect(onChange.mock.calls[0][0].blocks).toHaveLength(content.blocks.length + 1);
  });

  it("supports Ctrl+Z and Ctrl+Shift+Z outside text fields", () => {
    const onChange = vi.fn();
    const content = createEmptyWorkoutContent("bike");
    render(<WorkoutTimelineLauncher content={content} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Workout Builder öffnen" }));
    fireEvent.click(screen.getByRole("button", { name: "Grundlage" }));
    fireEvent.keyDown(document, { key: "z", ctrlKey: true });
    fireEvent.keyDown(document, { key: "z", ctrlKey: true, shiftKey: true });
    fireEvent.click(screen.getByRole("button", { name: "Workout übernehmen" }));

    expect(onChange.mock.calls[0][0].blocks).toHaveLength(content.blocks.length + 1);
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

    expect(onChange.mock.calls[0][0]).toEqual(expect.objectContaining({ discipline: "bike" }));
  });

  it("switches an individual step from duration to distance", () => {
    const onChange = vi.fn();
    render(<WorkoutTimelineLauncher content={createEmptyWorkoutContent("bike")} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Workout Builder öffnen" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Distanz" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Workout übernehmen" }));

    expect(onChange.mock.calls[0][0].blocks[0].steps[0].duration).toEqual({ type: "distance", meters: 2000 });
    expect(onChange.mock.calls[0][0].blocks[1].steps[0].duration).toEqual({ type: "time", seconds: 300 });
  });

  it("saves the current draft to the workout library", async () => {
    const item = libraryItem();
    libraryActions.saveWorkoutLibraryItem.mockResolvedValue({ status: "success", message: "Gespeichert.", item });
    render(<WorkoutTimelineLauncher content={item.content} onChange={() => {}} title={item.title} />);

    fireEvent.click(screen.getByRole("button", { name: "Workout Builder öffnen" }));
    fireEvent.click(screen.getByRole("button", { name: "In Bibliothek speichern" }));

    await waitFor(() => expect(libraryActions.saveWorkoutLibraryItem).toHaveBeenCalledWith({
      title: item.title,
      content: item.content,
    }));
    expect(await screen.findByText("Gespeichert.")).toBeTruthy();
    expect(feedback.notify).toHaveBeenCalledWith(expect.objectContaining({ tone: "success", title: "Bibliothek gespeichert" }));
  });

  it("blocks library writes while offline", async () => {
    feedback.isOnline = false;
    render(<WorkoutTimelineLauncher content={createEmptyWorkoutContent("bike")} onChange={() => {}} title="Offline Workout" />);

    fireEvent.click(screen.getByRole("button", { name: "Workout Builder öffnen" }));
    await waitFor(() => expect(libraryActions.listWorkoutLibraryItems).toHaveBeenCalled());
    expect((screen.getByRole("button", { name: "In Bibliothek speichern" }) as HTMLButtonElement).disabled).toBe(true);
    expect(libraryActions.saveWorkoutLibraryItem).not.toHaveBeenCalled();
  });

  it("loads and deletes a saved library workout", async () => {
    const item = libraryItem();
    libraryActions.listWorkoutLibraryItems.mockResolvedValue({ status: "success", items: [item] });
    libraryActions.markWorkoutLibraryItemUsed.mockResolvedValue({ status: "success", message: "Aktualisiert.", item: { ...item, last_used_at: "2026-08-20T12:00:00.000Z" } });
    libraryActions.deleteWorkoutLibraryItem.mockResolvedValue({ status: "success", message: "Workout gelöscht.", deletedId: item.id });
    render(<WorkoutTimelineLauncher content={createEmptyWorkoutContent("swim")} onChange={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Workout Builder öffnen" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Bibliothek/ }).textContent).toContain("1"));
    fireEvent.click(screen.getByRole("button", { name: /^Bibliothek/ }));
    expect(await screen.findByText(item.title)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Laden" }));
    expect(screen.getByText("Breite = relative Dauer / Distanz · Höhe = Intensität")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));
    fireEvent.click(screen.getByRole("button", { name: "Löschen bestätigen" }));
    await waitFor(() => expect(libraryActions.deleteWorkoutLibraryItem).toHaveBeenCalledWith(item.id));
    await waitFor(() => expect(screen.queryByText(item.title)).toBeNull());
    expect(screen.getByRole("button", { name: "In Bibliothek speichern" })).toBeTruthy();
  });

  it("rolls back an optimistic delete when the server rejects it", async () => {
    const item = libraryItem();
    libraryActions.listWorkoutLibraryItems.mockResolvedValue({ status: "success", items: [item] });
    libraryActions.deleteWorkoutLibraryItem.mockResolvedValue({ status: "error", message: "Löschen fehlgeschlagen." });
    render(<WorkoutTimelineLauncher content={createEmptyWorkoutContent("bike")} onChange={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Workout Builder öffnen" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Bibliothek/ }).textContent).toContain("1"));
    fireEvent.click(screen.getByRole("button", { name: /^Bibliothek/ }));
    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));
    fireEvent.click(screen.getByRole("button", { name: "Löschen bestätigen" }));

    await waitFor(() => expect(screen.getByText(item.title)).toBeTruthy());
    expect(feedback.notify).toHaveBeenCalledWith(expect.objectContaining({ tone: "error", title: "Löschen fehlgeschlagen" }));
  });

  it("filters the library and renders compact workout previews", async () => {
    const bike = libraryItem();
    const swim = {
      ...libraryItem(),
      id: "22222222-2222-4222-8222-222222222222",
      title: "CSS Intervalle",
      discipline: "swim" as const,
      content: {
        ...libraryItem().content,
        discipline: "swim" as const,
        blocks: [
          ...libraryItem().content.blocks,
          {
            id: "time-block",
            title: "Zeitserie",
            kind: "interval" as const,
            repeatCount: 1,
            steps: [{
              id: "time-step",
              title: "Belastung",
              duration: { type: "time" as const, seconds: 300 },
              targets: [{ type: "max_heart_rate_percentage" as const, minPercent: 85, maxPercent: 90 }],
            }],
          },
        ],
      },
    };
    libraryActions.listWorkoutLibraryItems.mockResolvedValue({ status: "success", items: [bike, swim] });
    render(<WorkoutTimelineLauncher content={createEmptyWorkoutContent("swim")} onChange={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Workout Builder öffnen" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Bibliothek/ }).textContent).toContain("2"));
    fireEvent.click(screen.getByRole("button", { name: /^Bibliothek/ }));
    expect(screen.getAllByLabelText("Workout-Vorschau")).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("Workout-Bibliothek durchsuchen"), { target: { value: "CSS" } });
    expect(screen.getByText("CSS Intervalle")).toBeTruthy();
    expect(screen.queryByText(bike.title)).toBeNull();
    fireEvent.change(screen.getByLabelText("Workout-Bibliothek durchsuchen"), { target: { value: "" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Sportart" }), { target: { value: "bike" } });
    expect(screen.getByText(bike.title)).toBeTruthy();
    expect(screen.queryByText("CSS Intervalle")).toBeNull();
    fireEvent.change(screen.getByRole("combobox", { name: "Sportart" }), { target: { value: "all" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Vorgabe" }), { target: { value: "mixed" } });
    expect(screen.getByText("CSS Intervalle")).toBeTruthy();
    expect(screen.queryByText(bike.title)).toBeNull();
    fireEvent.change(screen.getByRole("combobox", { name: "Intensität" }), { target: { value: "max_heart_rate_percentage" } });
    expect(screen.getByText("CSS Intervalle")).toBeTruthy();
  });

  it("favorites, loads, and updates an existing library workout", async () => {
    const item = libraryItem();
    const favorite = { ...item, is_favorite: true };
    libraryActions.listWorkoutLibraryItems.mockResolvedValue({ status: "success", items: [item] });
    libraryActions.setWorkoutLibraryFavorite.mockResolvedValue({ status: "success", message: "Favorit gespeichert.", item: favorite });
    libraryActions.markWorkoutLibraryItemUsed.mockResolvedValue({ status: "success", message: "Aktualisiert.", item });
    libraryActions.updateWorkoutLibraryItem.mockResolvedValue({ status: "success", message: "Aktualisiert.", item });
    render(<WorkoutTimelineLauncher content={createEmptyWorkoutContent("bike")} onChange={() => {}} title={item.title} />);

    fireEvent.click(screen.getByRole("button", { name: "Workout Builder öffnen" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Bibliothek/ }).textContent).toContain("1"));
    fireEvent.click(screen.getByRole("button", { name: /^Bibliothek/ }));
    fireEvent.click(screen.getByRole("button", { name: `${item.title} als Favorit markieren` }));
    await waitFor(() => expect(libraryActions.setWorkoutLibraryFavorite).toHaveBeenCalledWith({ id: item.id, isFavorite: true }));
    fireEvent.click(screen.getByRole("button", { name: "Laden" }));
    await waitFor(() => expect(libraryActions.markWorkoutLibraryItemUsed).toHaveBeenCalledWith(item.id));
    fireEvent.click(screen.getByRole("button", { name: "Bibliothek aktualisieren" }));
    await waitFor(() => expect(libraryActions.updateWorkoutLibraryItem).toHaveBeenCalledWith({ id: item.id, title: item.title, content: item.content }));
  });
});

function libraryItem(): WorkoutLibraryItem {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Lange Radausfahrt",
    discipline: "bike",
    content: {
      schemaVersion: 1,
      discipline: "bike",
      blocks: [{
        id: "library-block",
        title: "Grundlage",
        kind: "steady",
        repeatCount: 1,
        steps: [{
          id: "library-step",
          title: "Ausdauer",
          duration: { type: "distance", meters: 40000 },
          targets: [{ type: "threshold_power_percentage", minPercent: 65, maxPercent: 75 }],
        }],
      }],
    },
    is_favorite: false,
    last_used_at: null,
    created_at: "2026-08-20T10:00:00.000Z",
    updated_at: "2026-08-20T10:00:00.000Z",
  };
}