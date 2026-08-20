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

  revalidateCommunityPaths(data.id);
  redirect(`/trainingsplaene/community/${data.id}`);
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

  const { error } = await supabase.from("community_replies").insert({
    thread_id: parsed.data.threadId,
    author_id: user.id,
    content: parsed.data.content,
  });
  if (error) throw new Error(error.message);

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
  revalidatePath("/trainingsplaene");
  revalidatePath("/trainingsplaene/community");
  revalidatePath(`/trainingsplaene/community/${threadId}`);
}