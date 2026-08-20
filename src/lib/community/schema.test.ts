import { describe, expect, it } from "vitest";
import { communityMessageSchema, communityModerationSchema, communitySlugSchema } from "./schema";

const communityId = "11111111-1111-4111-8111-111111111111";

describe("communityMessageSchema", () => {
  it("trims and accepts a message", () => {
    const parsed = communityMessageSchema.parse({ communityId, content: "  Hallo Gruppe  " });
    expect(parsed.content).toBe("Hallo Gruppe");
  });

  it("rejects empty content", () => {
    expect(communityMessageSchema.safeParse({ communityId, content: "   " }).success).toBe(false);
  });

  it("rejects content beyond the limit", () => {
    expect(communityMessageSchema.safeParse({ communityId, content: "a".repeat(4001) }).success).toBe(false);
  });

  it("rejects a non-uuid community", () => {
    expect(communityMessageSchema.safeParse({ communityId: "plattform", content: "Hallo" }).success).toBe(false);
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
