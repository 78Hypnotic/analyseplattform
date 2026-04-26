"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const resetRequestSchema = z.object({
  email: z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse ein."),
});

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen haben."),
    confirmPassword: z.string().min(8, "Bitte bestätige dein Passwort."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  });

export type ResetPasswordState = {
  message?: string;
};

export async function requestPasswordReset(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetRequestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingabe." };
  }

  try {
    await assertRateLimit("password-reset", 3, 60_000);
    const supabase = await createSupabaseServerClient();
    const origin = getAuthRedirectOrigin();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password/update`,
    });

    if (error) {
      return { message: mapResetError(error.message) };
    }
  } catch (error) {
    return { message: mapActionError(error, "Reset-Mail konnte nicht gesendet werden.") };
  }

  redirect(`/reset-password?sent=1&email=${encodeURIComponent(parsed.data.email)}`);
}

export async function updatePassword(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingabe." };
  }

  try {
    await assertRateLimit("password-update", 5, 60_000);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      return { message: mapResetError(error.message) };
    }
  } catch (error) {
    return { message: mapActionError(error, "Passwort konnte nicht geändert werden.") };
  }

  redirect("/analyse");
}

function mapActionError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;

  if (message.includes("Rate limit")) {
    return "Zu viele Versuche. Bitte warte kurz und probiere es erneut.";
  }

  return message;
}

function mapResetError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email rate limit")) {
    return "Das Supabase-E-Mail-Limit ist erreicht. Bitte warte kurz oder richte Custom SMTP ein.";
  }

  if (normalized.includes("auth session missing")) {
    return "Der Reset-Link ist abgelaufen. Bitte fordere einen neuen Link an.";
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
