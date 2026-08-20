import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "./loading";

describe("route loading shell", () => {
  it("provides an immediate accessible loading state", () => {
    render(<Loading />);

    expect(screen.getByRole("main", { name: "Seite wird geladen" }).getAttribute("aria-busy")).toBe("true");
    expect(document.querySelector(".route-loading-progress")).toBeTruthy();
  });
});