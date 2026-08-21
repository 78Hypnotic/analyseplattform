import { z } from "zod";

export const MAX_COMMUNITY_MESSAGE_LENGTH = 4000;
export const MAX_COMMUNITY_LINK_URL_LENGTH = 2000;

// Slugs, die als eigene Routen unterhalb von /community/[slug] existieren.
export const RESERVED_CHANNEL_SLUGS = ["threads", "einstellungen"] as const;

export const COMMUNITY_CHANNEL_TYPES = ["chat", "announcement", "intro", "links"] as const;

// Altbestand-Marker aus der Thread-Ära werden beim Rendern als Anhang aufgelöst.
// Neue Nachrichten dürfen ihn nicht enthalten, sonst könnten Nutzer Anhangs-Pfade unterschieben.
const LEGACY_ATTACHMENT_MARKER_REGEX = /<!--community-attachments:[A-Za-z0-9_-]*-->/g;

export const communityMessageSchema = z.object({
  communityId: z.string().uuid("Community konnte nicht zugeordnet werden."),
  channelId: z.string().uuid("Kanal konnte nicht zugeordnet werden."),
  content: z
    .string()
    .transform((value) => value.replace(LEGACY_ATTACHMENT_MARKER_REGEX, "").trim())
    .pipe(
      z
        .string()
        .min(1, "Bitte schreibe eine Nachricht.")
        .max(MAX_COMMUNITY_MESSAGE_LENGTH, "Die Nachricht ist zu lang."),
    ),
});

export const communityMessageEditSchema = z.object({
  messageId: z.string().uuid("Nachricht konnte nicht zugeordnet werden."),
  content: communityMessageSchema.shape.content,
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

export const communityChannelSlugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Kanal konnte nicht zugeordnet werden.")
  .refine(
    (value) => !RESERVED_CHANNEL_SLUGS.includes(value as (typeof RESERVED_CHANNEL_SLUGS)[number]),
    "Kanal konnte nicht zugeordnet werden.",
  );

export const communityChannelCreateSchema = z.object({
  communityId: z.string().uuid("Community konnte nicht zugeordnet werden."),
  name: z.string().trim().min(2, "Der Name ist zu kurz.").max(60, "Der Name ist zu lang."),
  description: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().max(300, "Die Beschreibung ist zu lang."),
  ),
  type: z.enum(COMMUNITY_CHANNEL_TYPES, { message: "Unbekannter Kanaltyp." }),
});

export const communityChannelUpdateSchema = z.object({
  channelId: z.string().uuid("Kanal konnte nicht zugeordnet werden."),
  name: communityChannelCreateSchema.shape.name,
  description: communityChannelCreateSchema.shape.description,
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean()),
});

export const communityLinkSchema = z.object({
  channelId: z.string().uuid("Kanal konnte nicht zugeordnet werden."),
  title: z.string().trim().min(3, "Der Titel ist zu kurz.").max(120, "Der Titel ist zu lang."),
  description: communityChannelCreateSchema.shape.description,
  url: z
    .string()
    .trim()
    .max(MAX_COMMUNITY_LINK_URL_LENGTH, "Die URL ist zu lang.")
    .refine(isSafeExternalUrl, "Bitte eine vollständige http- oder https-Adresse angeben."),
});

export const communityLinkModerationSchema = z.object({
  linkId: z.string().uuid("Link konnte nicht zugeordnet werden."),
  reason: communityModerationSchema.shape.reason,
});

// Schützt vor javascript:, data: und anderen Schemata, die im href als XSS-Vektor dienen.
function isSafeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.length > 0;
  } catch {
    return false;
  }
}
