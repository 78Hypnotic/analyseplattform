import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActiveNavLink } from "./active-nav-link";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

describe("ActiveNavLink", () => {
  beforeEach(() => vi.mocked(usePathname).mockReturnValue("/community/coach"));

  it("marks matching nested routes as current", () => {
    render(<ActiveNavLink href="/community">Community</ActiveNavLink>);
    expect(screen.getByRole("link", { name: "Community" }).getAttribute("aria-current")).toBe("page");
  });

  it("supports exact root matching", () => {
    render(<ActiveNavLink href="/" exact>Übersicht</ActiveNavLink>);
    expect(screen.getByRole("link", { name: "Übersicht" }).getAttribute("aria-current")).toBeNull();
  });
});