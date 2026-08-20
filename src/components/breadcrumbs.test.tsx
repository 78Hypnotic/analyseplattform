import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "./breadcrumbs";

describe("Breadcrumbs", () => {
  it("links ancestors and marks the current page", () => {
    render(<Breadcrumbs items={[
      { label: "Coach", href: "/coach" },
      { label: "Athleten", href: "/coach" },
      { label: "Mara Muster" },
    ]} />);

    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Coach" }).getAttribute("href")).toBe("/coach");
    expect(screen.getByText("Mara Muster").getAttribute("aria-current")).toBe("page");
  });
});