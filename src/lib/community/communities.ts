import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

// Altbestand aus der Thread-Ära: Anhänge konnten als base64-Marker im Text landen.
const ATTACHMENT_MARKER_REGEX = /\n?\n?<!--community-attachments:([A-Za-z0-9_-]+)-->/g;
const MESSAGE_PAGE_SIZE = 50;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type CommunityKind = "platform" | "coach";
export type CommunityRole = "member" | "coach" | "admin";

export type CommunityAuthor = {
  id: string | null;
  name: string;
  role: CommunityRole;
};

export type CommunityAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
};

export type CommunitySummary = {
  id: string;
  kind: CommunityKind;
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  messageCount: number;
  lastActivityAt: string | null;
};

export type CommunityMessage = {
  id: string;
  content: string;
  status: "published" | "removed";
  removedReason: string | null;
  createdAt: string;
  author: CommunityAuthor;
  attachments: CommunityAttachment[];
  isOwn: boolean;
};

export type CommunityChannel = {
  community: CommunitySummary;
  canModerate: boolean;
  currentUserId: string;
  messages: CommunityMessage[];
  olderCursor: string | null;
};

export type CommunityListResult =
  | { kind: "signed-out" }
  | { kind: "ok"; communities: CommunitySummary[] };

export type CommunityChannelResult =
  | { kind: "signed-out" }
  | { kind: "not-found" }
  | { kind: "ok"; channel: CommunityChannel };

type CommunityRow = {
  id: string;
  kind: CommunityKind;
  slug: string;
  name: string;
  description: string;
  coach_id: string | null;
};

type MessageRow = {
  id: string;
  author_id: string | null;
  content: string;
  status: "published" | "removed";
  removed_reason: string | null;
  created_at: string;
};

type AttachmentRow = {
  id: string;
  message_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
};

type StoredAttachment = {
  id: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export async function listAccessibleCommunities(): Promise<CommunityListResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "signed-out" };

  const { data, error } = await supabase
    .from("communities")
    .select("id,kind,slug,name,description,coach_id")
    .eq("is_active", true);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as CommunityRow[];
  const [coachNames, activity] = await Promise.all([
    getDisplayNames(rows.map((row) => row.coach_id)),
    getCommunityActivity(supabase, rows.map((row) => row.id)),
  ]);

  const communities = rows
    .map((row) => toSummary(row, coachNames, activity.get(row.id)))
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "platform" ? -1 : 1;
      return a.title.localeCompare(b.title, "de");
    });

  return { kind: "ok", communities };
}

export async function getCommunityBySlug(
  slug: string,
  options: { before?: string } = {},
): Promise<CommunityChannelResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "signed-out" };

  const { data, error } = await supabase
    .from("communities")
    .select("id,kind,slug,name,description,coach_id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { kind: "not-found" };

  const community = data as CommunityRow;

  let query = supabase
    .from("community_messages")
    .select("id,author_id,content,status,removed_reason,created_at")
    .eq("community_id", community.id)
    .order("created_at", { ascending: false })
    .limit(MESSAGE_PAGE_SIZE + 1);
  if (options.before) query = query.lt("created_at", options.before);

  const [{ data: messageData, error: messageError }, { data: canModerate, error: moderationError }] = await Promise.all([
    query,
    supabase.rpc("can_moderate_community", { target_community_id: community.id }),
  ]);
  if (messageError) throw new Error(messageError.message);
  if (moderationError) throw new Error(moderationError.message);

  const rows = (messageData ?? []) as MessageRow[];
  const hasOlder = rows.length > MESSAGE_PAGE_SIZE;
  const page = rows.slice(0, MESSAGE_PAGE_SIZE).reverse();

  const parsed = page.map((row) => ({ row, ...parseContentAttachments(row.content) }));
  const [authors, attachmentsByMessage, activity] = await Promise.all([
    getAuthors(page.map((row) => row.author_id), community.coach_id),
    getAttachments(supabase, parsed),
    getCommunityActivity(supabase, [community.id]),
  ]);
  const coachNames = await getDisplayNames([community.coach_id]);

  return {
    kind: "ok",
    channel: {
      community: toSummary(community, coachNames, activity.get(community.id)),
      canModerate: canModerate === true,
      currentUserId: user.id,
      olderCursor: hasOlder ? page[0]?.created_at ?? null : null,
      messages: parsed.map(({ row, content }) => ({
        id: row.id,
        content,
        status: row.status,
        removedReason: row.removed_reason,
        createdAt: row.created_at,
        author: authors.get(row.author_id) ?? unknownAuthor(),
        attachments: attachmentsByMessage.get(row.id) ?? [],
        isOwn: row.author_id === user.id,
      })),
    },
  };
}

function toSummary(
  row: CommunityRow,
  coachNames: Map<string, string>,
  activity: { messageCount: number; lastActivityAt: string | null } | undefined,
): CommunitySummary {
  const coachName = row.coach_id ? coachNames.get(row.coach_id) ?? "Coach" : null;

  return {
    id: row.id,
    kind: row.kind,
    slug: row.slug,
    eyebrow: row.kind === "platform" ? "Plattform" : "Gruppencoaching",
    title: row.kind === "platform" ? row.name : coachName ?? row.name,
    description: row.description,
    messageCount: activity?.messageCount ?? 0,
    lastActivityAt: activity?.lastActivityAt ?? null,
  };
}

async function getCommunityActivity(supabase: SupabaseServerClient, communityIds: string[]) {
  const entries = await Promise.all(communityIds.map(async (id) => {
    const [countResult, latestResult] = await Promise.all([
      supabase
        .from("community_messages")
        .select("id", { count: "exact", head: true })
        .eq("community_id", id)
        .eq("status", "published"),
      supabase
        .from("community_messages")
        .select("created_at")
        .eq("community_id", id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (countResult.error) throw new Error(countResult.error.message);
    if (latestResult.error) throw new Error(latestResult.error.message);

    return [id, {
      messageCount: countResult.count ?? 0,
      lastActivityAt: latestResult.data?.created_at ?? null,
    }] as const;
  }));

  return new Map(entries);
}

// Profile sind per RLS auf eigene/zugeordnete Nutzer beschränkt, Chat-Namen brauchen daher den Service-Client.
async function getDisplayNames(userIds: Array<string | null>) {
  const ids = uniqueIds(userIds);
  if (ids.length === 0) return new Map<string, string>();

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("profiles").select("id,full_name").in("id", ids);
  if (error) throw new Error(error.message);

  return new Map(((data ?? []) as Array<{ id: string; full_name: string | null }>).map((profile) => [
    profile.id,
    profile.full_name?.trim() || "Mitglied",
  ]));
}

async function getAuthors(authorIds: Array<string | null>, coachId: string | null) {
  const ids = uniqueIds(authorIds);
  if (ids.length === 0) return new Map<string | null, CommunityAuthor>();

  const admin = createSupabaseAdminClient();
  const [names, { data: roleRows, error: roleError }] = await Promise.all([
    getDisplayNames(ids),
    admin.from("user_roles").select("user_id,role").in("user_id", ids),
  ]);
  if (roleError) throw new Error(roleError.message);

  const rolesByUser = new Map<string, Set<string>>();
  for (const row of (roleRows ?? []) as Array<{ user_id: string; role: string }>) {
    const roles = rolesByUser.get(row.user_id) ?? new Set<string>();
    roles.add(row.role);
    rolesByUser.set(row.user_id, roles);
  }

  return new Map<string | null, CommunityAuthor>(ids.map((id) => {
    const roles = rolesByUser.get(id);
    const role: CommunityRole = roles?.has("admin")
      ? "admin"
      : id === coachId || roles?.has("coach")
        ? "coach"
        : "member";

    return [id, { id, name: names.get(id) ?? "Mitglied", role }];
  }));
}

async function getAttachments(
  supabase: SupabaseServerClient,
  messages: Array<{ row: MessageRow; attachments: StoredAttachment[] }>,
) {
  const byMessage = new Map<string, CommunityAttachment[]>();
  const messageIds = messages.map(({ row }) => row.id);

  if (messageIds.length > 0) {
    const { data, error } = await supabase
      .from("community_attachments")
      .select("id,message_id,storage_path,file_name,mime_type,size_bytes")
      .in("message_id", messageIds)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as AttachmentRow[];
    const signed = await signAttachments(supabase, rows.map(toStoredAttachment));
    for (const row of rows) {
      const attachment = signed.get(row.storage_path);
      if (!attachment) continue;
      byMessage.set(row.message_id, [...(byMessage.get(row.message_id) ?? []), attachment]);
    }
  }

  const legacy = messages.flatMap(({ row, attachments }) => attachments.map((attachment) => ({ messageId: row.id, attachment })));
  if (legacy.length > 0) {
    const signed = await signAttachments(createSupabaseAdminClient(), legacy.map((entry) => entry.attachment));
    for (const { messageId, attachment } of legacy) {
      const signedAttachment = signed.get(attachment.storagePath);
      if (!signedAttachment) continue;
      byMessage.set(messageId, [...(byMessage.get(messageId) ?? []), signedAttachment]);
    }
  }

  return byMessage;
}

async function signAttachments(
  client: { storage: SupabaseServerClient["storage"] },
  attachments: StoredAttachment[],
) {
  const signed = await Promise.all(attachments.map(async (attachment) => {
    const { data, error } = await client.storage
      .from("community-attachments")
      .createSignedUrl(attachment.storagePath, SIGNED_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) return null;

    return [attachment.storagePath, {
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      url: data.signedUrl,
    }] as const;
  }));

  return new Map(signed.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)));
}

function toStoredAttachment(row: AttachmentRow): StoredAttachment {
  return {
    id: row.id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
  };
}

function parseContentAttachments(content: string) {
  const attachments: StoredAttachment[] = [];
  const cleaned = content
    .replace(ATTACHMENT_MARKER_REGEX, (_match, encoded: string) => {
      try {
        const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as unknown;
        if (Array.isArray(parsed)) attachments.push(...parsed.filter(isStoredAttachment));
      } catch {
        return "";
      }
      return "";
    })
    .trimEnd();

  return { content: cleaned, attachments };
}

function isStoredAttachment(value: unknown): value is StoredAttachment {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<StoredAttachment>;
  return typeof item.id === "string"
    && typeof item.storagePath === "string"
    && typeof item.fileName === "string"
    && typeof item.mimeType === "string"
    && typeof item.sizeBytes === "number";
}

function uniqueIds(ids: Array<string | null>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

function unknownAuthor(): CommunityAuthor {
  return { id: null, name: "Gelöschtes Konto", role: "member" };
}
