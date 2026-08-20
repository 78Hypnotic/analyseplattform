import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlanLibrary } from "./library";

export type CommunityRole = "member" | "coach" | "admin";

export type CommunityAuthor = {
  id: string | null;
  name: string;
  role: CommunityRole;
};

export type CommunityThreadSummary = {
  id: string;
  libraryId: string;
  title: string;
  content: string;
  status: "published" | "removed";
  author: CommunityAuthor;
  replyCount: number;
  lastActivityAt: string;
  createdAt: string;
};

export type CommunityReply = {
  id: string;
  threadId: string;
  content: string;
  status: "published" | "removed";
  author: CommunityAuthor;
  attachments: CommunityAttachment[];
  removedReason: string | null;
  createdAt: string;
};

export type CommunityAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
};

export type CommunityThreadDetail = CommunityThreadSummary & {
  removedReason: string | null;
  attachments: CommunityAttachment[];
  replies: CommunityReply[];
  canModerate: boolean;
};

export type TrainingPlanCommunityHome =
  | { kind: "signed-out" }
  | { kind: "locked" }
  | { kind: "admin"; libraries: PlanLibrary[]; selectedLibrary: PlanLibrary | null; threads: CommunityThreadSummary[] }
  | { kind: "community"; role: CommunityRole; library: PlanLibrary; threads: CommunityThreadSummary[]; canModerate: boolean };

type LibraryRow = {
  id: string;
  coach_id: string;
  name: string;
  description: string;
  is_active: boolean;
};

type ThreadRow = {
  id: string;
  library_id: string;
  author_id: string | null;
  title: string;
  content: string;
  status: "published" | "removed";
  removed_reason: string | null;
  created_at: string;
  updated_at: string;
};

type ReplyRow = {
  id: string;
  thread_id: string;
  author_id: string | null;
  content: string;
  status: "published" | "removed";
  removed_reason: string | null;
  created_at: string;
};

type AttachmentRow = {
  id: string;
  thread_id: string | null;
  reply_id: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export async function getTrainingPlanCommunityHome(selectedLibraryId?: string): Promise<TrainingPlanCommunityHome> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { kind: "signed-out" };

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  if (roleError) throw new Error(roleError.message);

  const roles = (roleRows ?? []).map((row) => row.role);
  const isAdmin = roles.includes("admin");
  const isCoach = roles.includes("coach");

  if (isAdmin) {
    const { data, error } = await supabase
      .from("coach_plan_libraries")
      .select("id,coach_id,name,description,is_active")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const libraries = await enrichLibraries((data ?? []) as LibraryRow[]);
    const selectedLibrary = libraries.find((library) => library.id === selectedLibraryId) ?? libraries[0] ?? null;
    return {
      kind: "admin",
      libraries,
      selectedLibrary,
      threads: selectedLibrary ? await getLibraryCommunityThreads(selectedLibrary.id) : [],
    };
  }

  if (isCoach) {
    const { data, error } = await supabase
      .from("coach_plan_libraries")
      .select("id,coach_id,name,description,is_active")
      .eq("coach_id", user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { kind: "locked" };

    const library = (await enrichLibraries([data as LibraryRow]))[0];
    if (!library) return { kind: "locked" };
    return {
      kind: "community",
      role: "coach",
      library,
      threads: await getLibraryCommunityThreads(library.id),
      canModerate: true,
    };
  }

  const library = await getActiveMemberLibrary(user.id);
  if (!library) return { kind: "locked" };

  return {
    kind: "community",
    role: "member",
    library,
    threads: await getLibraryCommunityThreads(library.id),
    canModerate: false,
  };
}

export async function getCommunityThread(threadId: string): Promise<CommunityThreadDetail | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: thread, error: threadError } = await supabase
    .from("community_threads")
    .select("id,library_id,author_id,title,content,status,removed_reason,created_at,updated_at")
    .eq("id", threadId)
    .maybeSingle();
  if (threadError) throw new Error(threadError.message);
  if (!thread) return null;

  const threadRow = thread as ThreadRow;
  const library = await getLibraryById(threadRow.library_id);
  if (!library) return null;

  const { data: replies, error: repliesError } = await supabase
    .from("community_replies")
    .select("id,thread_id,author_id,content,status,removed_reason,created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (repliesError) throw new Error(repliesError.message);

  const replyRows = (replies ?? []) as ReplyRow[];
  const authors = await getAuthors([threadRow.author_id, ...replyRows.map((reply) => reply.author_id)], library.coachId);
  const attachments = await getThreadAttachments(threadRow.id, replyRows.map((reply) => reply.id));
  const publishedReplies = replyRows.filter((reply) => reply.status === "published");
  const lastReplyAt = publishedReplies.at(-1)?.created_at;
  const canModerate = await canModerateLibrary(library.id, user.id);

  return {
    id: threadRow.id,
    libraryId: threadRow.library_id,
    title: threadRow.title,
    content: threadRow.content,
    status: threadRow.status,
    removedReason: threadRow.removed_reason,
    attachments: attachments.threadAttachments,
    author: authors.get(threadRow.author_id) ?? unknownAuthor(),
    replyCount: publishedReplies.length,
    lastActivityAt: lastReplyAt ?? threadRow.created_at,
    createdAt: threadRow.created_at,
    replies: replyRows.map((reply) => ({
      id: reply.id,
      threadId: reply.thread_id,
      content: reply.content,
      status: reply.status,
      removedReason: reply.removed_reason,
      attachments: attachments.replyAttachments.get(reply.id) ?? [],
      author: authors.get(reply.author_id) ?? unknownAuthor(),
      createdAt: reply.created_at,
    })),
    canModerate,
  };
}

async function getLibraryCommunityThreads(libraryId: string): Promise<CommunityThreadSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data: threads, error } = await supabase
    .from("community_threads")
    .select("id,library_id,author_id,title,content,status,removed_reason,created_at,updated_at")
    .eq("library_id", libraryId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  const threadRows = (threads ?? []) as ThreadRow[];
  if (threadRows.length === 0) return [];

  const [library, repliesByThread] = await Promise.all([
    getLibraryById(libraryId),
    getReplyActivity(threadRows.map((thread) => thread.id)),
  ]);
  if (!library) return [];

  const authors = await getAuthors(threadRows.map((thread) => thread.author_id), library.coachId);
  return threadRows.map((thread) => {
    const replyActivity = repliesByThread.get(thread.id);
    return {
      id: thread.id,
      libraryId: thread.library_id,
      title: thread.title,
      content: thread.content,
      status: thread.status,
      author: authors.get(thread.author_id) ?? unknownAuthor(),
      replyCount: replyActivity?.count ?? 0,
      lastActivityAt: replyActivity?.lastActivityAt ?? thread.created_at,
      createdAt: thread.created_at,
    };
  });
}

async function getReplyActivity(threadIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("community_replies")
    .select("thread_id,created_at,status")
    .in("thread_id", threadIds)
    .eq("status", "published")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const activity = new Map<string, { count: number; lastActivityAt: string }>();
  for (const reply of data ?? []) {
    const row = reply as Pick<ReplyRow, "thread_id" | "created_at">;
    const current = activity.get(row.thread_id);
    activity.set(row.thread_id, {
      count: (current?.count ?? 0) + 1,
      lastActivityAt: row.created_at,
    });
  }
  return activity;
}

async function getThreadAttachments(threadId: string, replyIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data: threadAttachments, error: threadError } = await supabase
    .from("community_attachments")
    .select("id,thread_id,reply_id,storage_path,file_name,mime_type,size_bytes")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (threadError) throw new Error(threadError.message);

  const replyAttachmentsResult = replyIds.length > 0
    ? await supabase
        .from("community_attachments")
        .select("id,thread_id,reply_id,storage_path,file_name,mime_type,size_bytes")
        .in("reply_id", replyIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };
  if (replyAttachmentsResult.error) throw new Error(replyAttachmentsResult.error.message);

  const threadRows = (threadAttachments ?? []) as AttachmentRow[];
  const replyRows = (replyAttachmentsResult.data ?? []) as AttachmentRow[];
  const signedAttachments = await signAttachments([...threadRows, ...replyRows]);
  const byId = new Map(signedAttachments.map((attachment) => [attachment.id, attachment]));
  const replyAttachments = new Map<string, CommunityAttachment[]>();

  for (const row of replyRows) {
    if (!row.reply_id) continue;
    const attachment = byId.get(row.id);
    if (!attachment) continue;
    replyAttachments.set(row.reply_id, [...(replyAttachments.get(row.reply_id) ?? []), attachment]);
  }

  return {
    threadAttachments: threadRows.map((row) => byId.get(row.id)).filter((attachment): attachment is CommunityAttachment => Boolean(attachment)),
    replyAttachments,
  };
}

async function signAttachments(rows: AttachmentRow[]): Promise<CommunityAttachment[]> {
  if (rows.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const signed = await Promise.all(rows.map(async (row) => {
    const { data, error } = await supabase.storage.from("community-attachments").createSignedUrl(row.storage_path, 60 * 60);
    if (error || !data?.signedUrl) return null;

    return {
      id: row.id,
      fileName: row.file_name,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      url: data.signedUrl,
    };
  }));

  return signed.filter((attachment): attachment is CommunityAttachment => Boolean(attachment));
}

async function getActiveMemberLibrary(userId: string) {
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const { data: membership, error: membershipError } = await supabase
    .from("group_coaching_memberships")
    .select("library_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .lte("valid_from", now)
    .or(`valid_until.is.null,valid_until.gt.${now}`)
    .limit(1)
    .maybeSingle();
  if (membershipError) throw new Error(membershipError.message);
  if (!membership) return null;

  return getLibraryById(membership.library_id);
}

async function getLibraryById(libraryId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("coach_plan_libraries")
    .select("id,coach_id,name,description,is_active")
    .eq("id", libraryId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  return (await enrichLibraries([data as LibraryRow]))[0] ?? null;
}

async function enrichLibraries(rows: LibraryRow[]) {
  if (rows.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const coachIds = Array.from(new Set(rows.map((row) => row.coach_id)));
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .in("id", coachIds);
  if (error) throw new Error(error.message);

  const profileById = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile.full_name || profile.email || "Coach"]),
  );

  return rows.map((row): PlanLibrary => ({
    id: row.id,
    coachId: row.coach_id,
    coachName: profileById.get(row.coach_id) ?? "Coach",
    name: row.name,
    description: row.description,
    isActive: row.is_active,
  }));
}

async function getAuthors(authorIds: Array<string | null>, coachId: string) {
  const supabase = await createSupabaseServerClient();
  const ids = Array.from(new Set(authorIds.filter((id): id is string => Boolean(id))));
  if (ids.length === 0) return new Map<string | null, CommunityAuthor>();

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .in("id", ids);
  if (profileError) throw new Error(profileError.message);

  const profileById = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));

  return new Map<string | null, CommunityAuthor>(ids.map((id) => {
    const profile = profileById.get(id);
    const role: CommunityRole = id === coachId ? "coach" : "member";
    return [id, {
      id,
      name: profile?.full_name || (role === "coach" ? profile?.email : null) || (role === "coach" ? "Coach" : "Athlet"),
      role,
    }];
  }));
}

async function canModerateLibrary(libraryId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: roles, error: roleError }, { data: library, error: libraryError }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("coach_plan_libraries").select("coach_id").eq("id", libraryId).maybeSingle(),
  ]);
  if (roleError) throw new Error(roleError.message);
  if (libraryError) throw new Error(libraryError.message);

  return (roles ?? []).some((row) => row.role === "admin") || library?.coach_id === userId;
}

function unknownAuthor(): CommunityAuthor {
  return { id: null, name: "Gelöschtes Konto", role: "member" };
}