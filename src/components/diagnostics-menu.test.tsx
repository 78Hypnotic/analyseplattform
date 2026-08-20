import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { DiagnosticsMenu } from "./diagnostics-menu";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

describe("DiagnosticsMenu", () => {
  it("marks diagnostics and its active discipline on report routes", () => {
    vi.mocked(usePathname).mockReturnValue("/rad/report-id");
    render(<DiagnosticsMenu />);

    expect(screen.getByRole("button", { name: /Diagnostik/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Radfahren" }).getAttribute("aria-current")).toBe("page");
  });
});