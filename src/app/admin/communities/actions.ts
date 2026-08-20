"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/roles";
import { assertRateLimit } from "@/lib/rate-limit/server";

const grantSchema = z.object({
  libraryId: z.string().uuid(),
  userId: z.string().uuid(),
});

const membershipSchema = z.object({
  membershipId: z.string().uuid(),
  status: z.enum(["active", "paused", "cancelled", "expired"]),
});

const revokeSchema = z.object({
  membershipId: z.string().uuid(),
});

export async function grantCommunityMembership(formData: FormData) {
  await assertRateLimit("admin-community-grant", 30, 60_000);
  const { supabase, user } = await requireAdmin();
  const parsed = grantSchema.parse({
    libraryId: formData.get("libraryId"),
    userId: formData.get("userId"),
  });

  const { error } = await supabase
    .from("group_coaching_memberships")
    .upsert(
      {
        user_id: parsed.userId,
        library_id: parsed.libraryId,
        status: "active",
        source: "admin",
        granted_by: user.id,
      },
      { onConflict: "user_id,library_id" },
    );
  if (error) throw new Error(error.message);

  revalidateCommunityAdmin();
}

export async function setCommunityMembershipStatus(formData: FormData) {
  await assertRateLimit("admin-community-status", 60, 60_000);
  const { supabase } = await requireAdmin();
  const parsed = membershipSchema.parse({
    membershipId: formData.get("membershipId"),
    status: formData.get("status"),
  });

  const { error } = await supabase
    .from("group_coaching_memberships")
    .update({ status: parsed.status })
    .eq("id", parsed.membershipId);
  if (error) throw new Error(error.message);

  revalidateCommunityAdmin();
}

export async function revokeCommunityMembership(formData: FormData) {
  await assertRateLimit("admin-community-revoke", 30, 60_000);
  const { supabase } = await requireAdmin();
  const parsed = revokeSchema.parse({ membershipId: formData.get("membershipId") });

  const { error } = await supabase
    .from("group_coaching_memberships")
    .delete()
    .eq("id", parsed.membershipId);
  if (error) throw new Error(error.message);

  revalidateCommunityAdmin();
}

function revalidateCommunityAdmin() {
  revalidatePath("/admin/communities");
  revalidatePath("/community");
}
