"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/roles";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Bitte gib einen Namen ein.").max(80),
  email: z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z.string().min(10, "Das Passwort muss mindestens 10 Zeichen haben.").max(128),
});

export type CreateUserActionState = {
  message?: string;
  success?: boolean;
};

export async function createAdminUser(
  _previousState: CreateUserActionState,
  formData: FormData,
): Promise<CreateUserActionState> {
  try {
    await assertRateLimit("admin-user-create", 10, 60_000);
    await requireAdmin();

    const parsed = createUserSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      return { message: parsed.error.issues[0]?.message ?? "Bitte prüfe die Eingaben." };
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.fullName,
      },
    });

    if (error) {
      return { message: mapCreateUserError(error.message) };
    }

    const userId = data.user?.id;
    if (!userId) {
      return { message: "User konnte nicht erstellt werden." };
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      email: parsed.data.email,
      full_name: parsed.data.fullName,
    });

    if (profileError) throw new Error(profileError.message);

    const { error: roleError } = await admin.from("user_roles").upsert({
      user_id: userId,
      role: "user",
    });

    if (roleError) throw new Error(roleError.message);

    revalidatePath("/admin");
    revalidatePath("/admin/users");

    return { success: true, message: "User wurde angelegt." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "User konnte nicht erstellt werden.";
    return { message: mapCreateUserError(message) };
  }
}

function mapCreateUserError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already") || normalized.includes("registered") || normalized.includes("exists")) {
    return "Diese E-Mail-Adresse ist bereits registriert.";
  }

  if (normalized.includes("admin api key") || normalized.includes("service role key")) {
    return "SUPABASE_SECRET_KEY oder SUPABASE_SERVICE_ROLE_KEY fehlt auf dem Server.";
  }

  return message;
}
