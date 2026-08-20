import { z } from "zod";

export const MAX_COMMUNITY_MESSAGE_LENGTH = 4000;

export const communityMessageSchema = z.object({
  communityId: z.string().uuid("Community konnte nicht zugeordnet werden."),
  content: z
    .string()
    .trim()
    .min(1, "Bitte schreibe eine Nachricht.")
    .max(MAX_COMMUNITY_MESSAGE_LENGTH, "Die Nachricht ist zu lang."),
});

export const communityModerationSchema = z.object({
  messageId: z.string().uuid("Nachricht konnte nicht zugeordnet werden."),
  reason: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(300, "Der Moderationsgrund ist zu lang.").nullable(),
  ),
});

export const communitySlugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Community konnte nicht zugeordnet werden.");
