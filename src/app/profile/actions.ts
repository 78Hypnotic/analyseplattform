"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Name ist zu kurz.").max(80, "Name ist zu lang."),
});

const avatarPathSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/avatar\.(jpg|jpeg|png|webp)$/i,
    "Ungültiger Avatar-Pfad.",
  );

export type ProfileActionState = {
  message?: string;
};

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  await assertRateLimit("profile-update", 20, 60_000);
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Profil konnte nicht gespeichert werden." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });

  if (authError) return { message: authError.message };

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: parsed.data.fullName,
  });

  if (profileError && !profileError.message.includes("full_name")) {
    return { message: profileError.message };
  }

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/analyse");

  return { message: "Profil gespeichert." };
}

export type AvatarActionState =
  | { ok: true; message: string; avatarUrl: string | null }
  | { ok: false; message: string };

export async function updateAvatar(avatarPath: string): Promise<AvatarActionState> {
  try {
    await assertRateLimit("profile-avatar-update", 12, 60_000);
    const parsed = avatarPathSchema.parse(avatarPath);
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, message: "Bitte melde dich erneut an." };

    if (!parsed.startsWith(`${user.id}/`)) {
      return { ok: false, message: "Du kannst nur dein eigenes Profilbild speichern." };
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(parsed);
    const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

    const { error: authError } = await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl },
    });

    if (authError) return { ok: false, message: authError.message };

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      avatar_path: parsed,
      avatar_url: avatarUrl,
    });

    if (error) return { ok: false, message: error.message };

    revalidateProfileSurfaces();
    return { ok: true, message: "Profilbild gespeichert.", avatarUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profilbild konnte nicht gespeichert werden.";
    return { ok: false, message };
  }
}

export async function removeAvatar(): Promise<AvatarActionState> {
  try {
    await assertRateLimit("profile-avatar-remove", 12, 60_000);
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, message: "Bitte melde dich erneut an." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_path")
      .eq("id", user.id)
      .maybeSingle();

    const avatarPath =
      typeof profile?.avatar_path === "string" && profile.avatar_path.startsWith(`${user.id}/`)
        ? profile.avatar_path
        : null;

    if (avatarPath) {
      await supabase.storage.from("avatars").remove([avatarPath]);
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: { avatar_url: null },
    });

    if (authError) return { ok: false, message: authError.message };

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_path: null, avatar_url: null })
      .eq("id", user.id);

    if (error) return { ok: false, message: error.message };

    revalidateProfileSurfaces();
    return { ok: true, message: "Profilbild entfernt.", avatarUrl: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profilbild konnte nicht entfernt werden.";
    return { ok: false, message };
  }
}

function revalidateProfileSurfaces() {
  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/analyse");
  revalidatePath("/admin");
}
