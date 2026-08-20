"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  communityModerationSchema,
  communityReplySchema,
  communityThreadSchema,
} from "@/lib/training-plans/community-schema";

const MAX_COMMUNITY_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_COMMUNITY_ATTACHMENTS = 4;
const ALLOWED_COMMUNITY_ATTACHMENT_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function createCommunityThread(formData: FormData) {
  await assertRateLimit("community-thread-create", 8, 60_000);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = communityThreadSchema.safeParse({
    libraryId: formData.get("libraryId"),
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Beitrag konnte nicht erstellt werden.");

  const { data, error } = await supabase
    .from("community_threads")
    .insert({
      library_id: parsed.data.libraryId,
      author_id: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await uploadCommunityAttachments({
    supabase,
    userId: user.id,
    files: formData.getAll("images"),
    threadId: data.id,
  });

  revalidateCommunityPaths(data.id);
  redirect(`/community/${data.id}`);
}

export async function createCommunityReply(formData: FormData) {
  await assertRateLimit("community-reply-create", 20, 60_000);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = communityReplySchema.safeParse({
    threadId: formData.get("threadId"),
    content: formData.get("content"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Antwort konnte nicht erstellt werden.");

  const { data, error } = await supabase
    .from("community_replies")
    .insert({
      thread_id: parsed.data.threadId,
      author_id: user.id,
      content: parsed.data.content,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await uploadCommunityAttachments({
    supabase,
    userId: user.id,
    files: formData.getAll("images"),
    replyId: data.id,
  });

  revalidateCommunityPaths(parsed.data.threadId);
}

export async function removeCommunityThread(formData: FormData) {
  await assertRateLimit("community-thread-remove", 20, 60_000);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = communityModerationSchema.safeParse({
    id: formData.get("threadId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Beitrag konnte nicht moderiert werden.");

  const { error } = await supabase
    .from("community_threads")
    .update({
      status: "removed",
      removed_at: new Date().toISOString(),
      removed_by: user.id,
      removed_reason: parsed.data.reason,
    })
    .eq("id", parsed.data.id);
  if (error) throw new Error(error.message);

  revalidateCommunityPaths(parsed.data.id);
}

export async function removeCommunityReply(formData: FormData) {
  await assertRateLimit("community-reply-remove", 30, 60_000);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = communityModerationSchema.safeParse({
    id: formData.get("replyId"),
    reason: formData.get("reason"),
  });
  const threadId = formData.get("threadId");
  if (!parsed.success || typeof threadId !== "string") {
    throw new Error(parsed.success ? "Antwort konnte nicht zugeordnet werden." : parsed.error.issues[0]?.message);
  }

  const { error } = await supabase
    .from("community_replies")
    .update({
      status: "removed",
      removed_at: new Date().toISOString(),
      removed_by: user.id,
      removed_reason: parsed.data.reason,
    })
    .eq("id", parsed.data.id);
  if (error) throw new Error(error.message);

  revalidateCommunityPaths(threadId);
}

function revalidateCommunityPaths(threadId: string) {
  revalidatePath("/community");
  revalidatePath(`/community/${threadId}`);
  revalidatePath("/trainingsplaene");
}

async function uploadCommunityAttachments({
  supabase,
  userId,
  files,
  threadId,
  replyId,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  files: FormDataEntryValue[];
  threadId?: string;
  replyId?: string;
}) {
  const images = files.filter((file): file is File => file instanceof File && file.size > 0);
  if (images.length === 0) return;
  if (images.length > MAX_COMMUNITY_ATTACHMENTS) throw new Error("Bitte maximal 4 Bilder anhängen.");

  for (const file of images) {
    await uploadCommunityAttachment({ supabase, userId, file, threadId, replyId });
  }
}

async function uploadCommunityAttachment({
  supabase,
  userId,
  file,
  threadId,
  replyId,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  file: File;
  threadId?: string;
  replyId?: string;
}) {
  const extension = ALLOWED_COMMUNITY_ATTACHMENT_TYPES.get(file.type);
  if (!extension) throw new Error("Bitte JPG, PNG oder WebP hochladen.");
  if (file.size > MAX_COMMUNITY_ATTACHMENT_BYTES) throw new Error("Ein Bild darf maximal 5 MB groß sein.");

  const storagePath = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("community-attachments").upload(storagePath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) throw new Error(uploadError.message);

  const { error: attachmentError } = await supabase.from("community_attachments").insert({
    thread_id: threadId ?? null,
    reply_id: replyId ?? null,
    uploaded_by: userId,
    storage_path: storagePath,
    file_name: file.name || `Bild.${extension}`,
    mime_type: file.type,
    size_bytes: file.size,
  });

  if (attachmentError) {
    await supabase.storage.from("community-attachments").remove([storagePath]);
    if (isMissingAttachmentEndpointError(attachmentError)) return;
    throw new Error(attachmentError.message);
  }
}

function isMissingAttachmentEndpointError(error: { code?: string; message?: string }) {
  return Boolean(
    error.code === "PGRST205"
    || error.message?.toLowerCase().includes("community_attachments")
    || error.message?.toLowerCase().includes("schema cache"),
  );
}