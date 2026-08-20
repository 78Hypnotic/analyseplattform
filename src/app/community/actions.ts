"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { communityMessageSchema, communityModerationSchema, communitySlugSchema } from "@/lib/community/schema";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 4;
const ALLOWED_ATTACHMENT_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function createCommunityMessage(formData: FormData) {
  await assertRateLimit("community-message-create", 20, 60_000);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = communityMessageSchema.safeParse({
    communityId: formData.get("communityId"),
    content: formData.get("content"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Nachricht konnte nicht gesendet werden.");

  const images = readImages(formData.getAll("images"));

  const { data, error } = await supabase
    .from("community_messages")
    .insert({
      community_id: parsed.data.communityId,
      author_id: user.id,
      content: parsed.data.content,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  try {
    await uploadAttachments({ userId: user.id, messageId: data.id, images });
  } catch (uploadError) {
    await createSupabaseAdminClient().from("community_messages").delete().eq("id", data.id);
    throw uploadError;
  }

  revalidateCommunity(formData.get("communitySlug"));
}

export async function removeCommunityMessage(formData: FormData) {
  await assertRateLimit("community-message-remove", 30, 60_000);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = communityModerationSchema.safeParse({
    messageId: formData.get("messageId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Nachricht konnte nicht moderiert werden.");

  const { error } = await supabase
    .from("community_messages")
    .update({
      status: "removed",
      removed_at: new Date().toISOString(),
      removed_by: user.id,
      removed_reason: parsed.data.reason,
    })
    .eq("id", parsed.data.messageId);
  if (error) throw new Error(error.message);

  revalidateCommunity(formData.get("communitySlug"));
}

function revalidateCommunity(slug: FormDataEntryValue | null) {
  revalidatePath("/community");
  const parsed = communitySlugSchema.safeParse(slug);
  if (parsed.success) revalidatePath(`/community/${parsed.data}`);
}

function readImages(files: FormDataEntryValue[]) {
  const images = files.filter((file): file is File => file instanceof File && file.size > 0);
  if (images.length > MAX_ATTACHMENTS) throw new Error(`Bitte maximal ${MAX_ATTACHMENTS} Bilder anhängen.`);

  for (const image of images) {
    if (!ALLOWED_ATTACHMENT_TYPES.has(image.type)) throw new Error("Bitte JPG, PNG oder WebP hochladen.");
    if (image.size > MAX_ATTACHMENT_BYTES) throw new Error("Ein Bild darf maximal 5 MB groß sein.");
  }

  return images;
}

async function uploadAttachments({
  userId,
  messageId,
  images,
}: {
  userId: string;
  messageId: string;
  images: File[];
}) {
  if (images.length === 0) return;

  const admin = createSupabaseAdminClient();
  const uploaded: string[] = [];

  try {
    for (const image of images) {
      const extension = ALLOWED_ATTACHMENT_TYPES.get(image.type);
      const storagePath = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await admin.storage.from("community-attachments").upload(storagePath, image, {
        cacheControl: "3600",
        contentType: image.type,
        upsert: false,
      });
      if (uploadError) throw new Error(uploadError.message);
      uploaded.push(storagePath);

      const { error: attachmentError } = await admin.from("community_attachments").insert({
        message_id: messageId,
        uploaded_by: userId,
        storage_path: storagePath,
        file_name: image.name || `Bild.${extension}`,
        mime_type: image.type,
        size_bytes: image.size,
      });
      if (attachmentError) throw new Error(attachmentError.message);
    }
  } catch (error) {
    if (uploaded.length > 0) await admin.storage.from("community-attachments").remove(uploaded);
    throw error;
  }
}
