"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  communityChannelCreateSchema,
  communityChannelUpdateSchema,
  communitySlugSchema,
} from "@/lib/community/schema";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createCommunityChannel(formData: FormData) {
  await assertRateLimit("community-channel-create", 20, 60_000);
  const { supabase, userId } = await requireSession();

  const parsed = communityChannelCreateSchema.safeParse({
    communityId: formData.get("communityId"),
    name: formData.get("name"),
    description: formData.get("description"),
    type: formData.get("type"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Kanal konnte nicht angelegt werden.");

  const { data: lastChannel, error: orderError } = await supabase
    .from("community_channels")
    .select("sort_order")
    .eq("community_id", parsed.data.communityId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (orderError) throw new Error(orderError.message);

  // Slug wird per Datenbank-Trigger aus dem Namen abgeleitet und eindeutig gemacht.
  const { error } = await supabase.from("community_channels").insert({
    community_id: parsed.data.communityId,
    name: parsed.data.name,
    description: parsed.data.description,
    type: parsed.data.type,
    sort_order: Math.min((lastChannel?.sort_order ?? 0) + 1, 999),
    created_by: userId,
  });
  if (error) throw new Error(error.message);

  revalidateCommunity(formData);
}

export async function updateCommunityChannel(formData: FormData) {
  await assertRateLimit("community-channel-update", 40, 60_000);
  const { supabase } = await requireSession();

  const parsed = communityChannelUpdateSchema.safeParse({
    channelId: formData.get("channelId"),
    name: formData.get("name"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Kanal konnte nicht gespeichert werden.");

  const { error } = await supabase
    .from("community_channels")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      sort_order: parsed.data.sortOrder,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.channelId);
  if (error) throw new Error(error.message);

  revalidateCommunity(formData);
}

async function requireSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return { supabase, userId: user.id };
}

function revalidateCommunity(formData: FormData) {
  revalidatePath("/community");

  const community = communitySlugSchema.safeParse(formData.get("communitySlug"));
  if (!community.success) return;

  revalidatePath(`/community/${community.data}`, "layout");
}
