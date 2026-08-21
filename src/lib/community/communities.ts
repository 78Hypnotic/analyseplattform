import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

// Altbestand aus der Thread-Ära: Anhänge konnten als base64-Marker im Text landen.
const ATTACHMENT_MARKER_REGEX = /\n?\n?<!--community-attachments:([A-Za-z0-9_-]+)-->/g;
const MESSAGE_PAGE_SIZE = 50;
const LINK_PAGE_SIZE = 100;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type CommunityKind = "platform" | "coach";
export type CommunityRole = "member" | "coach" | "admin";
export type CommunityChannelType = "chat" | "announcement" | "intro" | "links";

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
  defaultChannelSlug: string | null;
  channelCount: number;
  messageCount: number;
  lastActivityAt: string | null;
};

export type CommunityChannelSummary = {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: CommunityChannelType;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  entryCount: number;
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

export type CommunityLink = {
  id: string;
  url: string;
  host: string;
  title: string;
  description: string;
  status: "published" | "removed";
  removedReason: string | null;
  createdAt: string;
  author: CommunityAuthor;
  isOwn: boolean;
};

export type CommunityNavigation = {
  community: CommunitySummary;
  channels: CommunityChannelSummary[];
  canModerate: boolean;
};

export type CommunityChannelView = {
  community: CommunitySummary;
  channel: CommunityChannelSummary;
  canModerate: boolean;
  canPost: boolean;
  canAddLink: boolean;
  currentUserId: string;
  ownMessageId: string | null;
  messages: CommunityMessage[];
  links: CommunityLink[];
  olderCursor: string | null;
};

export type DashboardCommunityUpdate = {
  id: string;
  communitySlug: string;
  communityTitle: string;
  channelSlug: string;
  channelName: string;
  channelType: CommunityChannelType;
  authorName: string;
  snippet: string;
  createdAt: string;
};

export type CommunityListResult =
  | { kind: "signed-out" }
  | { kind: "ok"; communities: CommunitySummary[] };

export type CommunityNavigationResult =
  | { kind: "signed-out" }
  | { kind: "not-found" }
  | { kind: "ok"; navigation: CommunityNavigation };

export type CommunityChannelResult =
  | { kind: "signed-out" }
  | { kind: "not-found" }
  | { kind: "ok"; view: CommunityChannelView };

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

type ChannelRow = {
  id: string;
  community_id: string;
  slug: string;
  name: string;
  description: string;
  type: CommunityChannelType;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
};

type ChannelActivityRow = {
  channel_id: string;
  entry_count: number;
  last_activity_at: string | null;
};

type LinkRow = {
  id: string;
  created_by: string | null;
  url: string;
  title: string;
  description: string;
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
  const [coachNames, channelsByCommunity] = await Promise.all([
    getDisplayNames(rows.map((row) => row.coach_id)),
    getChannelsByCommunity(supabase, rows.map((row) => row.id), false),
  ]);

  const communities = rows
    .map((row) => toSummary(row, coachNames, channelsByCommunity.get(row.id) ?? []))
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "platform" ? -1 : 1;
      return a.title.localeCompare(b.title, "de");
    });

  return { kind: "ok", communities };
}

export async function getCommunityNavigation(slug: string): Promise<CommunityNavigationResult> {
  const context = await loadCommunityContext(slug);
  if (context.kind !== "ok") return context;

  const { community, channels, canModerate } = context;
  return { kind: "ok", navigation: { community, channels, canModerate } };
}

export async function getCommunityChannel(
  slug: string,
  channelSlug: string | null,
  options: { before?: string } = {},
): Promise<CommunityChannelResult> {
  const context = await loadCommunityContext(slug);
  if (context.kind !== "ok") return context;

  const { supabase, user, community, channels, canModerate, coachId } = context;
  const channel = channelSlug
    ? channels.find((entry) => entry.slug === channelSlug)
    : channels.find((entry) => entry.isDefault) ?? channels[0];
  if (!channel) return { kind: "not-found" };

  const [messagePage, links, canPost, canAddLink] = await Promise.all([
    channel.type === "links"
      ? Promise.resolve({ messages: [], olderCursor: null })
      : loadChannelMessages(supabase, coachId, channel, user.id, options.before),
    channel.type === "links" ? loadChannelLinks(supabase, coachId, channel, user.id) : Promise.resolve([]),
    callChannelCheck(supabase, "can_post_in_channel", channel.id),
    channel.type === "links"
      ? callChannelCheck(supabase, "can_contribute_link", channel.id)
      : Promise.resolve(false),
  ]);

  return {
    kind: "ok",
    view: {
      community,
      channel,
      canModerate,
      canPost,
      canAddLink,
      currentUserId: user.id,
      ownMessageId: messagePage.messages.find((message) => message.isOwn && message.status === "published")?.id ?? null,
      messages: messagePage.messages,
      links,
      olderCursor: messagePage.olderCursor,
    },
  };
}

export async function listRecentCommunityUpdates(limit = 5): Promise<DashboardCommunityUpdate[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // RLS begrenzt die Nachrichten bereits auf zugängliche Communities.
  const { data, error } = await supabase
    .from("community_messages")
    .select("id,author_id,content,created_at,channel_id,community_id")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit * 4);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{
    id: string;
    author_id: string | null;
    content: string;
    created_at: string;
    channel_id: string;
    community_id: string;
  }>;
  if (rows.length === 0) return [];

  const [channels, communities] = await Promise.all([
    loadChannelsByIds(supabase, uniqueIds(rows.map((row) => row.channel_id))),
    loadCommunitiesByIds(supabase, uniqueIds(rows.map((row) => row.community_id))),
  ]);
  const coachNames = await getDisplayNames([...communities.values()].map((row) => row.coach_id));
  const authorNames = await getDisplayNames(rows.map((row) => row.author_id));

  const updates: DashboardCommunityUpdate[] = [];
  for (const row of rows) {
    if (updates.length >= limit) break;

    const channel = channels.get(row.channel_id);
    const community = communities.get(row.community_id);
    if (!channel?.is_active || !community) continue;

    updates.push({
      id: row.id,
      communitySlug: community.slug,
      communityTitle: toSummary(community, coachNames, []).title,
      channelSlug: channel.slug,
      channelName: channel.name,
      channelType: channel.type,
      authorName: row.author_id ? authorNames.get(row.author_id) ?? "Mitglied" : "Gelöschtes Konto",
      snippet: toSnippet(parseContentAttachments(row.content).content),
      createdAt: row.created_at,
    });
  }

  return updates;
}

type CommunityContext =
  | { kind: "signed-out" }
  | { kind: "not-found" }
  | {
      kind: "ok";
      supabase: SupabaseServerClient;
      user: { id: string };
      community: CommunitySummary;
      channels: CommunityChannelSummary[];
      canModerate: boolean;
      coachId: string | null;
    };

async function loadCommunityContext(slug: string): Promise<CommunityContext> {
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

  const row = data as CommunityRow;
  const { data: canModerate, error: moderationError } = await supabase.rpc("can_moderate_community", {
    target_community_id: row.id,
  });
  if (moderationError) throw new Error(moderationError.message);

  const [coachNames, channelsByCommunity] = await Promise.all([
    getDisplayNames([row.coach_id]),
    getChannelsByCommunity(supabase, [row.id], canModerate === true),
  ]);
  const channels = channelsByCommunity.get(row.id) ?? [];

  return {
    kind: "ok",
    supabase,
    user,
    community: toSummary(row, coachNames, channels),
    channels,
    canModerate: canModerate === true,
    coachId: row.coach_id,
  };
}

async function loadChannelMessages(
  supabase: SupabaseServerClient,
  coachId: string | null,
  channel: CommunityChannelSummary,
  userId: string,
  before?: string,
) {
  let query = supabase
    .from("community_messages")
    .select("id,author_id,content,status,removed_reason,created_at")
    .eq("channel_id", channel.id)
    .order("created_at", { ascending: false })
    .limit(MESSAGE_PAGE_SIZE + 1);
  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as MessageRow[];
  const hasOlder = rows.length > MESSAGE_PAGE_SIZE;
  const page = rows.slice(0, MESSAGE_PAGE_SIZE).reverse();

  const parsed = page.map((row) => ({ row, ...parseContentAttachments(row.content) }));
  const [authors, attachmentsByMessage] = await Promise.all([
    getAuthors(page.map((row) => row.author_id), coachId),
    getAttachments(supabase, parsed),
  ]);

  return {
    olderCursor: hasOlder ? page[0]?.created_at ?? null : null,
    messages: parsed.map(({ row, content }) => ({
      id: row.id,
      content,
      status: row.status,
      removedReason: row.removed_reason,
      createdAt: row.created_at,
      author: authors.get(row.author_id) ?? unknownAuthor(),
      attachments: attachmentsByMessage.get(row.id) ?? [],
      isOwn: row.author_id === userId,
    })),
  };
}

async function loadChannelLinks(
  supabase: SupabaseServerClient,
  coachId: string | null,
  channel: CommunityChannelSummary,
  userId: string,
): Promise<CommunityLink[]> {
  const { data, error } = await supabase
    .from("community_links")
    .select("id,created_by,url,title,description,status,removed_reason,created_at")
    .eq("channel_id", channel.id)
    .order("created_at", { ascending: false })
    .limit(LINK_PAGE_SIZE);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as LinkRow[];
  const authors = await getAuthors(rows.map((row) => row.created_by), coachId);

  return rows.map((row) => ({
    id: row.id,
    url: row.url,
    host: toHost(row.url),
    title: row.title,
    description: row.description,
    status: row.status,
    removedReason: row.removed_reason,
    createdAt: row.created_at,
    author: authors.get(row.created_by) ?? unknownAuthor(),
    isOwn: row.created_by === userId,
  }));
}

async function callChannelCheck(
  supabase: SupabaseServerClient,
  fn: "can_post_in_channel" | "can_contribute_link",
  channelId: string,
) {
  const { data, error } = await supabase.rpc(fn, { target_channel_id: channelId });
  if (error) throw new Error(error.message);
  return data === true;
}

async function getChannelsByCommunity(
  supabase: SupabaseServerClient,
  communityIds: string[],
  includeInactive: boolean,
) {
  const byCommunity = new Map<string, CommunityChannelSummary[]>();
  if (communityIds.length === 0) return byCommunity;

  let query = supabase
    .from("community_channels")
    .select("id,community_id,slug,name,description,type,sort_order,is_default,is_active")
    .in("community_id", communityIds)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (!includeInactive) query = query.eq("is_active", true);

  const [{ data, error }, { data: activityData, error: activityError }] = await Promise.all([
    query,
    supabase.from("community_channel_activity").select("channel_id,entry_count,last_activity_at").in("community_id", communityIds),
  ]);
  if (error) throw new Error(error.message);
  if (activityError) throw new Error(activityError.message);

  const activity = new Map(
    ((activityData ?? []) as ChannelActivityRow[]).map((row) => [row.channel_id, row]),
  );

  for (const row of (data ?? []) as ChannelRow[]) {
    const stats = activity.get(row.id);
    const summary: CommunityChannelSummary = {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      type: row.type,
      sortOrder: row.sort_order,
      isDefault: row.is_default,
      isActive: row.is_active,
      entryCount: Number(stats?.entry_count ?? 0),
      lastActivityAt: stats?.last_activity_at ?? null,
    };
    byCommunity.set(row.community_id, [...(byCommunity.get(row.community_id) ?? []), summary]);
  }

  return byCommunity;
}

async function loadChannelsByIds(supabase: SupabaseServerClient, channelIds: string[]) {
  if (channelIds.length === 0) return new Map<string, ChannelRow>();

  const { data, error } = await supabase
    .from("community_channels")
    .select("id,community_id,slug,name,description,type,sort_order,is_default,is_active")
    .in("id", channelIds);
  if (error) throw new Error(error.message);

  return new Map(((data ?? []) as ChannelRow[]).map((row) => [row.id, row]));
}

async function loadCommunitiesByIds(supabase: SupabaseServerClient, communityIds: string[]) {
  if (communityIds.length === 0) return new Map<string, CommunityRow>();

  const { data, error } = await supabase
    .from("communities")
    .select("id,kind,slug,name,description,coach_id")
    .in("id", communityIds);
  if (error) throw new Error(error.message);

  return new Map(((data ?? []) as CommunityRow[]).map((row) => [row.id, row]));
}

function toSummary(
  row: CommunityRow,
  coachNames: Map<string, string>,
  channels: CommunityChannelSummary[],
): CommunitySummary {
  const coachName = row.coach_id ? coachNames.get(row.coach_id) ?? "Coach" : null;
  const activeChannels = channels.filter((channel) => channel.isActive);
  const lastActivityAt = activeChannels
    .map((channel) => channel.lastActivityAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;

  return {
    id: row.id,
    kind: row.kind,
    slug: row.slug,
    eyebrow: row.kind === "platform" ? "Plattform" : "Gruppencoaching",
    title: row.kind === "platform" ? row.name : coachName ?? row.name,
    description: row.description,
    defaultChannelSlug: activeChannels.find((channel) => channel.isDefault)?.slug ?? activeChannels[0]?.slug ?? null,
    channelCount: activeChannels.length,
    messageCount: activeChannels.reduce((total, channel) => total + channel.entryCount, 0),
    lastActivityAt,
  };
}

function toHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
}

function toSnippet(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized.length > 140 ? `${normalized.slice(0, 139).trimEnd()}…` : normalized;
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
    // Der Marker steckt im nutzerkontrollierten Nachrichtentext: nur der RLS-gebundene
    // Client darf signieren, sonst liesse sich jeder Bucket-Pfad freischalten.
    const signed = await signAttachments(supabase, legacy.map((entry) => entry.attachment));
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
