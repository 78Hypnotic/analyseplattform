import { fireEvent, render, screen } from "@testing-library/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NavigationFeedback } from "./navigation-feedback";

vi.mock("next/navigation", () => ({ usePathname: vi.fn(), useSearchParams: vi.fn() }));

describe("NavigationFeedback", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/community");
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>,
    );
  });

  it("shows immediate feedback for an internal route click", () => {
    render(
      <>
        <NavigationFeedback />
        <Link href="/trainingsplaene" onClick={(event) => event.preventDefault()}>Trainingspläne</Link>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Trainingspläne" }));
    expect(screen.getByRole("status").textContent).toContain("Seite wird geladen");
  });

  it("ignores links that keep the current URL", () => {
    render(
      <>
        <NavigationFeedback />
        <Link href="/community" onClick={(event) => event.preventDefault()}>Community</Link>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Community" }));
    expect(screen.queryByRole("status")).toBeNull();
  });
});