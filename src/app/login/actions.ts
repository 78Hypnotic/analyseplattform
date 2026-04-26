"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z.string().min(1, "Bitte gib dein Passwort ein."),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Bitte gib deinen Namen ein.").max(80),
  email: z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen haben."),
});

export type LoginActionState = {
  message?: string;
};

export async function signInWithPassword(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben." };
  }

  try {
    await assertRateLimit("login-password", 8, 60_000);
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return { message: mapAuthError(error.message) };
    }
  } catch (error) {
    return { message: mapActionError(error, "Login fehlgeschlagen.") };
  }

  redirect("/dashboard");
}

export async function signUpWithPassword(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben." };
  }

  try {
    await assertRateLimit("signup-password", 5, 60_000);
    const supabase = await createSupabaseServerClient();
    const origin = getAuthRedirectOrigin();

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return { message: mapAuthError(error.message) };
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: parsed.data.email,
        full_name: parsed.data.fullName,
      });
    }

    if (!data.session) {
      return {
        message:
          "Account erstellt. Bitte bestätige deine E-Mail und logge dich danach mit deinem Passwort ein.",
      };
    }
  } catch (error) {
    return { message: mapActionError(error, "Account konnte nicht erstellt werden.") };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

function mapActionError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;

  if (message.includes("Unexpected token '<'") || message.includes("Supabase")) {
    return "Supabase ist nicht korrekt konfiguriert. Prüfe NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.";
  }

  if (message.includes("Rate limit")) {
    return "Zu viele Versuche. Bitte warte kurz und probiere es erneut.";
  }

  return message;
}

function mapAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "E-Mail oder Passwort ist falsch.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Bitte bestätige zuerst deine E-Mail-Adresse.";
  }

  return message;
}

function getAuthRedirectOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
