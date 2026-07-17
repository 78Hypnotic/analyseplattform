"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthRedirectOrigin } from "@/lib/auth/redirect-url";
import { requireCoachAccess } from "@/lib/auth/roles";
import { getAthleteMutationContext } from "@/lib/coach-mutations";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_DISCIPLINES = [
  "Schwimmen",
  "Laufen",
  "Radfahren",
  "Triathlon",
  "Open Water",
  "Crosstraining",
  "Krafttraining",
  "Yoga / Mobility",
] as const;

const inviteAthleteSchema = z.object({
  fullName: z.string().trim().min(2, "Bitte gib einen Namen ein.").max(80),
  email: z.string().trim().toLowerCase().email("Bitte gib eine gültige E-Mail-Adresse ein."),
});

const coachProfileSchema = z.object({
  athleteId: z.string().uuid(),
  fullName: z.string().trim().min(2, "Name ist zu kurz.").max(80, "Name ist zu lang."),
  city: optionalTrimmedStringSchema(120),
  age: optionalIntegerSchema(8, 100),
  gender: z.preprocess(
    (value) => (value === "" || value === null ? null : value),
    z.enum(["weiblich", "maennlich", "divers"]).nullable(),
  ),
  heightCm: optionalIntegerSchema(100, 230),
  weightKg: optionalIntegerSchema(25, 180),
  bodyFatPercentage: optionalNumberSchema(3, 60),
  fitnessLevel: optionalIntegerSchema(1, 5),
  vo2max: optionalNumberSchema(10, 100),
  vlamax: optionalNumberSchema(0, 2),
  ftpRad: optionalIntegerSchema(50, 700),
  muscleMassKg: optionalNumberSchema(10, 120),
  disciplines: z.array(z.enum(ALLOWED_DISCIPLINES)).max(8),
});

export type CoachActionState = {
  message?: string;
  success?: boolean;
};

/**
 * Invites a new user account and assigns the resulting athlete to the current coach.
 */
export async function createCoachAthlete(
  _previousState: CoachActionState,
  formData: FormData,
): Promise<CoachActionState> {
  try {
    await assertRateLimit("coach-athlete-invite", 5, 60 * 60_000);
    const { user, roles } = await requireCoachAccess();
    if (!roles.includes("coach")) {
      return { message: "Nur Coaches können eigene Athleten einladen." };
    }

    const parsed = inviteAthleteSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
    });
    if (!parsed.success) {
      return { message: parsed.error.issues[0]?.message ?? "Bitte prüfe die Eingaben." };
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: { full_name: parsed.data.fullName },
      redirectTo: `${getAuthRedirectOrigin()}/auth/callback?next=/reset-password/update`,
    });

    if (error) return { message: mapInviteError(error.message) };

    const athleteId = data.user?.id;
    if (!athleteId) return { message: "Athletenkonto konnte nicht angelegt werden." };

    try {
      const { error: profileError } = await admin.from("profiles").upsert({
        id: athleteId,
        email: parsed.data.email,
        full_name: parsed.data.fullName,
      });
      if (profileError) throw new Error(profileError.message);

      const { error: roleError } = await admin
        .from("user_roles")
        .upsert(
          { user_id: athleteId, role: "user" },
          { onConflict: "user_id,role" },
        );
      if (roleError) throw new Error(roleError.message);

      const { error: assignmentError } = await admin.from("coach_athletes").insert({
        coach_id: user.id,
        athlete_id: athleteId,
        created_by: user.id,
      });
      if (assignmentError) throw new Error(assignmentError.message);
    } catch (setupError) {
      await admin.auth.admin.deleteUser(athleteId);
      throw setupError;
    }

    revalidatePath("/coach");
    return {
      success: true,
      message: `Einladung an ${parsed.data.email} wurde gesendet.`,
    };
  } catch (error) {
    return { message: mapInviteError(error instanceof Error ? error.message : "Einladung fehlgeschlagen.") };
  }
}

/**
 * Updates only athletic profile fields after revalidating the active coach assignment.
 */
export async function updateCoachAthleteProfile(
  _previousState: CoachActionState,
  formData: FormData,
): Promise<CoachActionState> {
  try {
    await assertRateLimit("coach-athlete-profile-update", 20, 60_000);
    const parsed = coachProfileSchema.safeParse({
      athleteId: formData.get("athleteId"),
      fullName: formData.get("fullName"),
      city: formData.get("city"),
      age: formData.get("age"),
      gender: formData.get("gender"),
      heightCm: formData.get("heightCm"),
      weightKg: formData.get("weightKg"),
      bodyFatPercentage: formData.get("bodyFatPercentage"),
      fitnessLevel: formData.get("fitnessLevel"),
      vo2max: formData.get("vo2max"),
      vlamax: formData.get("vlamax"),
      ftpRad: formData.get("ftpRad"),
      muscleMassKg: formData.get("muscleMassKg"),
      disciplines: formData.getAll("disciplines"),
    });

    if (!parsed.success) {
      return { message: parsed.error.issues[0]?.message ?? "Profil konnte nicht gespeichert werden." };
    }

    const context = await getAthleteMutationContext(parsed.data.athleteId);
    if (!context || !context.isActingForAthlete) {
      return { message: "Keine Berechtigung für dieses Athletenprofil." };
    }

    const { data, error } = await context.supabase
      .from("profiles")
      .update({
        full_name: parsed.data.fullName,
        city: parsed.data.city,
        age: parsed.data.age,
        gender: parsed.data.gender,
        height_cm: parsed.data.heightCm,
        weight_kg: parsed.data.weightKg,
        body_fat_percentage: parsed.data.bodyFatPercentage,
        fitness_level: parsed.data.fitnessLevel,
        vo2max: parsed.data.vo2max,
        vlamax: parsed.data.vlamax,
        ftp_rad: parsed.data.ftpRad,
        muscle_mass_kg: parsed.data.muscleMassKg,
        disciplines: parsed.data.disciplines,
      })
      .eq("id", context.athleteId)
      .select("id")
      .single();

    if (error || !data) return { message: error?.message ?? "Profil konnte nicht gespeichert werden." };

    revalidatePath("/coach");
    revalidatePath(`/coach/athletes/${context.athleteId}`);
    revalidatePath("/profile");
    return { success: true, message: "Profil gespeichert." };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Profil konnte nicht gespeichert werden." };
  }
}

function optionalIntegerSchema(min: number, max: number) {
  return z.preprocess(normalizeOptionalNumberInput, z.coerce.number().int().min(min).max(max).nullable());
}

function optionalNumberSchema(min: number, max: number) {
  return z.preprocess(normalizeOptionalNumberInput, z.coerce.number().min(min).max(max).nullable());
}

function optionalTrimmedStringSchema(max: number) {
  return z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable(),
  );
}

function normalizeOptionalNumberInput(value: unknown) {
  if (value === "" || value === null) return null;
  return typeof value === "string" ? value.replace(",", ".") : value;
}

function mapInviteError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("already") || normalized.includes("registered") || normalized.includes("exists")) {
    return "Diese E-Mail-Adresse ist bereits registriert. Ein Admin muss den bestehenden Nutzer zuordnen.";
  }
  if (normalized.includes("email rate limit")) {
    return "Das E-Mail-Limit ist erreicht. Bitte warte kurz oder prüfe die SMTP-Konfiguration.";
  }
  if (normalized.includes("rate limit")) {
    return "Zu viele Einladungen. Bitte versuche es später erneut.";
  }
  return message;
}
