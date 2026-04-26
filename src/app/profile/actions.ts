"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Name ist zu kurz.").max(80, "Name ist zu lang."),
});

export type ProfileActionState = {
  message?: string;
};

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
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
  revalidatePath("/dashboard");

  return { message: "Profil gespeichert." };
}
