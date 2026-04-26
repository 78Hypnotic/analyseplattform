"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email();

export type LoginActionState = {
  message?: string;
};

export async function signInWithMagicLink(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"));

  if (!parsedEmail.success) {
    return { message: "Bitte gib eine gültige E-Mail-Adresse ein." };
  }

  const email = parsedEmail.data;

  try {
    await assertRateLimit("login", 5, 60_000);
    const headerStore = await headers();
    const origin = headerStore.get("origin") ?? "http://localhost:3000";
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return { message: error.message };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Magic Link konnte nicht gesendet werden.";

    if (message.includes("Unexpected token '<'") || message.includes("Supabase")) {
      return {
        message:
          "Supabase ist nicht korrekt konfiguriert. Prüfe NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.",
      };
    }

    if (message.includes("Rate limit")) {
      return { message: "Zu viele Login-Versuche. Bitte warte kurz und probiere es erneut." };
    }

    return { message };
  }

  redirect(`/login?sent=1&email=${encodeURIComponent(email)}`);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
