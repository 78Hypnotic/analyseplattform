import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FeedbackProvider, useFeedback } from "./feedback-provider";

function Trigger() {
  const { notify, isOnline } = useFeedback();
  return (
    <>
      <span data-testid="online-state">{isOnline ? "online" : "offline"}</span>
      <button type="button" onClick={() => notify({ tone: "success", title: "Gespeichert" })}>Toast</button>
    </>
  );
}

describe("FeedbackProvider", () => {
  it("shows and dismisses a toast", () => {
    render(<FeedbackProvider><Trigger /></FeedbackProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Toast" }));
    expect(screen.getByRole("status").textContent).toContain("Gespeichert");
    fireEvent.click(screen.getByRole("button", { name: "Benachrichtigung schließen" }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("announces offline state", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
    render(<FeedbackProvider><Trigger /></FeedbackProvider>);
    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByRole("alert").textContent).toContain("Du bist offline");
  });
});