import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppHeaderShell } from "./app-header-shell";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

describe("AppHeaderShell", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/community");
  });

  it("keeps the shared header on user-facing routes", () => {
    render(<AppHeaderShell><div>Header</div></AppHeaderShell>);
    expect(screen.getByText("Header")).toBeTruthy();
  });

  it("hides the shared header on internal E2E previews", () => {
    vi.mocked(usePathname).mockReturnValue("/e2e-report-preview");
    render(<AppHeaderShell><div>Header</div></AppHeaderShell>);
    expect(screen.queryByText("Header")).toBeNull();
  });
});