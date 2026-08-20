import { describe, expect, it } from "vitest";
import {
  communityModerationSchema,
  communityReplySchema,
  communityThreadSchema,
} from "./community-schema";

const uuid = "00000000-0000-4000-8000-000000000001";

describe("community schemas", () => {
  it("trims and accepts a valid thread", () => {
    const result = communityThreadSchema.safeParse({
      libraryId: uuid,
      title: "  Technikfrage  ",
      content: "  Wie gestaltet ihr die lockere Einheit nach dem Test?  ",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.title).toBe("Technikfrage");
    expect(result.data.content).toBe("Wie gestaltet ihr die lockere Einheit nach dem Test?");
  });

  it("rejects empty replies", () => {
    const result = communityReplySchema.safeParse({ threadId: uuid, content: "   " });

    expect(result.success).toBe(false);
  });

  it("normalizes empty moderation reasons", () => {
    const result = communityModerationSchema.safeParse({ id: uuid, reason: "  " });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.reason).toBeNull();
  });
});