import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CommunityChannelSummary } from "@/lib/community/communities";
import { ChannelNav } from "./channel-nav";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

function buildChannel(
  overrides: Partial<CommunityChannelSummary> & Pick<CommunityChannelSummary, "id" | "slug" | "name" | "type">,
): CommunityChannelSummary {
  return {
    description: "",
    sortOrder: 0,
    isDefault: false,
    isActive: true,
    entryCount: 0,
    lastActivityAt: null,
    ...overrides,
  };
}

const channels: CommunityChannelSummary[] = [
  buildChannel({ id: "1", slug: "news", name: "News", type: "announcement" }),
  buildChannel({ id: "2", slug: "allgemein", name: "Allgemein", type: "chat", isDefault: true, sortOrder: 1 }),
  buildChannel({ id: "3", slug: "vorstellungsrunde", name: "Vorstellungsrunde", type: "intro", sortOrder: 2 }),
  buildChannel({ id: "4", slug: "links", name: "Links", type: "links", sortOrder: 3 }),
];

describe("ChannelNav", () => {
  beforeEach(() => vi.mocked(usePathname).mockReturnValue("/community/plattform"));

  it("links every channel to its own route", () => {
    render(<ChannelNav communitySlug="plattform" channels={channels} canModerate={false} />);

    for (const channel of channels) {
      const link = screen.getAllByRole("link", { name: channel.name })[0];
      expect(link.getAttribute("href")).toBe(`/community/plattform/${channel.slug}`);
    }
  });

  it("marks the default channel active on the community root", () => {
    render(<ChannelNav communitySlug="plattform" channels={channels} canModerate={false} />);

    expect(screen.getAllByRole("link", { name: "Allgemein" })[0].getAttribute("aria-current")).toBe("page");
  });

  it("marks the visited channel active", () => {
    vi.mocked(usePathname).mockReturnValue("/community/plattform/links");
    render(<ChannelNav communitySlug="plattform" channels={channels} canModerate={false} />);

    expect(screen.getAllByRole("link", { name: "Links" })[0].getAttribute("aria-current")).toBe("page");
    expect(screen.getAllByRole("link", { name: "Allgemein" })[0].getAttribute("aria-current")).toBeNull();
  });

  it("hides the management link from members", () => {
    render(<ChannelNav communitySlug="plattform" channels={channels} canModerate={false} />);

    expect(screen.queryByRole("link", { name: "Kanäle verwalten" })).toBeNull();
  });

  it("shows the management link to moderators", () => {
    render(<ChannelNav communitySlug="plattform" channels={channels} canModerate />);

    expect(screen.getAllByRole("link", { name: "Kanäle verwalten" })[0].getAttribute("href")).toBe(
      "/community/plattform/einstellungen",
    );
  });
});
