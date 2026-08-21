import { describe, expect, it } from "vitest";
import {
  communityChannelCreateSchema,
  communityChannelSlugSchema,
  communityChannelUpdateSchema,
  communityLinkSchema,
  communityMessageSchema,
  communityModerationSchema,
  communitySlugSchema,
} from "./schema";

const communityId = "11111111-1111-4111-8111-111111111111";
const channelId = "22222222-2222-4222-8222-222222222222";

describe("communityMessageSchema", () => {
  it("trims and accepts a message", () => {
    const parsed = communityMessageSchema.parse({ communityId, channelId, content: "  Hallo Gruppe  " });
    expect(parsed.content).toBe("Hallo Gruppe");
  });

  it("rejects empty content", () => {
    expect(communityMessageSchema.safeParse({ communityId, channelId, content: "   " }).success).toBe(false);
  });

  it("rejects content beyond the limit", () => {
    expect(communityMessageSchema.safeParse({ communityId, channelId, content: "a".repeat(4001) }).success).toBe(false);
  });

  it("rejects a non-uuid community", () => {
    expect(communityMessageSchema.safeParse({ communityId: "plattform", channelId, content: "Hallo" }).success).toBe(false);
  });

  it("rejects a missing channel", () => {
    expect(communityMessageSchema.safeParse({ communityId, channelId: "news", content: "Hallo" }).success).toBe(false);
  });
});

describe("communityModerationSchema", () => {
  it("maps a blank reason to null", () => {
    const parsed = communityModerationSchema.parse({ messageId: communityId, reason: "  " });
    expect(parsed.reason).toBeNull();
  });

  it("rejects an overlong reason", () => {
    expect(
      communityModerationSchema.safeParse({ messageId: communityId, reason: "a".repeat(301) }).success,
    ).toBe(false);
  });
});

describe("communitySlugSchema", () => {
  it.each(["plattform", "jörg", "coach--x", ""])("rejects %s when it is not a clean slug", (value) => {
    const result = communitySlugSchema.safeParse(value);
    expect(result.success).toBe(value === "plattform");
  });

  it("accepts a hyphenated slug", () => {
    expect(communitySlugSchema.parse("joerg-mueller")).toBe("joerg-mueller");
  });
});

describe("communityChannelSlugSchema", () => {
  it("accepts a clean channel slug", () => {
    expect(communityChannelSlugSchema.parse("vorstellungsrunde")).toBe("vorstellungsrunde");
  });

  it.each(["threads", "einstellungen"])("rejects the reserved slug %s", (value) => {
    expect(communityChannelSlugSchema.safeParse(value).success).toBe(false);
  });
});

describe("communityChannelCreateSchema", () => {
  it("trims name and description", () => {
    const parsed = communityChannelCreateSchema.parse({
      communityId,
      name: "  Wettk\u00e4mpfe  ",
      description: "  Rennberichte  ",
      type: "chat",
    });
    expect(parsed).toMatchObject({ name: "Wettk\u00e4mpfe", description: "Rennberichte" });
  });

  it("defaults a missing description to an empty string", () => {
    const parsed = communityChannelCreateSchema.parse({ communityId, name: "News", description: null, type: "announcement" });
    expect(parsed.description).toBe("");
  });

  it("rejects an unknown type", () => {
    expect(
      communityChannelCreateSchema.safeParse({ communityId, name: "Karte", description: "", type: "map" }).success,
    ).toBe(false);
  });
});

describe("communityChannelUpdateSchema", () => {
  it("reads an unchecked checkbox as inactive", () => {
    const parsed = communityChannelUpdateSchema.parse({
      channelId,
      name: "News",
      description: "",
      sortOrder: "3",
      isActive: null,
    });
    expect(parsed).toMatchObject({ sortOrder: 3, isActive: false });
  });

  it("reads a checked checkbox as active", () => {
    const parsed = communityChannelUpdateSchema.parse({
      channelId,
      name: "News",
      description: "",
      sortOrder: "0",
      isActive: "on",
    });
    expect(parsed.isActive).toBe(true);
  });
});

describe("communityLinkSchema", () => {
  it("accepts an https link", () => {
    const parsed = communityLinkSchema.parse({
      channelId,
      title: "Trainingslehre",
      description: "",
      url: " https://example.com/artikel ",
    });
    expect(parsed.url).toBe("https://example.com/artikel");
  });

  it.each(["javascript:alert(1)", "data:text/html;base64,PHNjcmlwdD4=", "vbscript:msgbox", "example.com", ""])(
    "rejects the unsafe url %s",
    (url) => {
      expect(communityLinkSchema.safeParse({ channelId, title: "Titel", description: "", url }).success).toBe(false);
    },
  );
});
