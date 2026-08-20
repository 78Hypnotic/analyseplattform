import { z } from "zod";

export const communityThreadSchema = z.object({
  libraryId: z.string().uuid("Community konnte nicht zugeordnet werden."),
  title: z.string().trim().min(3, "Bitte gib einen Titel ein.").max(120, "Der Titel ist zu lang."),
  content: z.string().trim().min(2, "Bitte schreibe einen Beitrag.").max(3000, "Der Beitrag ist zu lang."),
});

export const communityReplySchema = z.object({
  threadId: z.string().uuid("Beitrag konnte nicht zugeordnet werden."),
  content: z.string().trim().min(2, "Bitte schreibe eine Antwort.").max(2000, "Die Antwort ist zu lang."),
});

export const communityModerationSchema = z.object({
  id: z.string().uuid("Beitrag konnte nicht zugeordnet werden."),
  reason: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(300, "Der Moderationsgrund ist zu lang.").nullable(),
  ),
});