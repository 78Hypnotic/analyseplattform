import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";
import Loading from "./loading";

describe("route loading shell", () => {
  it("provides an immediate accessible loading state", () => {
    render(<Loading />);

    expect(screen.getByRole("main", { name: "Seite wird geladen" }).getAttribute("aria-busy")).toBe("true");
    expect(document.querySelector(".route-loading-progress")).toBeTruthy();
  });

  it.each(["dashboard", "list", "report", "form", "community", "library", "planner"] as const)(
    "renders the %s loading variant",
    (variant) => {
      const { unmount } = render(<PageLoadingSkeleton variant={variant} />);
      expect(screen.getByRole("main", { name: "Seite wird geladen" }).dataset.loadingVariant).toBe(variant);
      unmount();
    },
  );
});