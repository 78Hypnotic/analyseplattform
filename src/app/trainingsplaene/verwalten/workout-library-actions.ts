"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCoachAccess } from "@/lib/auth/roles";
import { assertRateLimit } from "@/lib/rate-limit/server";
import { workoutContentSchema } from "@/lib/training-plans/schema";
import type { WorkoutLibraryItem } from "@/lib/training-plans/types";

const workoutLibraryItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  discipline: z.enum(["swim", "run", "bike"]),
  content: workoutContentSchema,
  is_favorite: z.boolean(),
  last_used_at: z.string().nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

const saveWorkoutLibraryItemSchema = z.object({
  title: z.string().trim().min(3).max(120),
  content: workoutContentSchema,
});

const updateWorkoutLibraryItemSchema = saveWorkoutLibraryItemSchema.extend({ id: z.string().uuid() });
const favoriteWorkoutLibraryItemSchema = z.object({ id: z.string().uuid(), isFavorite: z.boolean() });

export type WorkoutLibraryActionResult =
  | { status: "success"; message: string; item?: WorkoutLibraryItem; deletedId?: string }
  | { status: "error"; message: string };

export type WorkoutLibraryListResult =
  | { status: "success"; items: WorkoutLibraryItem[] }
  | { status: "error"; message: string; items: [] };

export async function listWorkoutLibraryItems(): Promise<WorkoutLibraryListResult> {
  try {
    const { supabase, user } = await requireCoachAccess();
    const { data, error } = await supabase
      .from("workout_library_items")
      .select("id,title,discipline,content,is_favorite,last_used_at,created_at,updated_at")
      .eq("owner_id", user.id)
      .order("is_favorite", { ascending: false })
      .order("last_used_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false });

    if (error) return { status: "error", message: "Workout-Bibliothek konnte nicht geladen werden.", items: [] };

    const items = (data ?? []).flatMap((row) => {
      const parsed = workoutLibraryItemSchema.safeParse(row);
      return parsed.success ? [parsed.data] : [];
    });
    return { status: "success", items };
  } catch {
    return { status: "error", message: "Workout-Bibliothek konnte nicht geladen werden.", items: [] };
  }
}

export async function saveWorkoutLibraryItem(input: unknown): Promise<WorkoutLibraryActionResult> {
  try {
    await assertRateLimit("workout-library-save", 20, 60_000);
    const { supabase, user } = await requireCoachAccess();
    const parsed = saveWorkoutLibraryItemSchema.safeParse(input);
    if (!parsed.success) {
      return { status: "error", message: "Bitte Titel und Workout-Inhalt prüfen." };
    }

    const { data, error } = await supabase
      .from("workout_library_items")
      .insert({
        owner_id: user.id,
        title: parsed.data.title,
        discipline: parsed.data.content.discipline,
        content: parsed.data.content,
      })
      .select("id,title,discipline,content,is_favorite,last_used_at,created_at,updated_at")
      .single();

    if (error) return { status: "error", message: "Workout konnte nicht gespeichert werden." };
    const saved = workoutLibraryItemSchema.safeParse(data);
    if (!saved.success) return { status: "error", message: "Gespeichertes Workout ist unvollständig." };

    revalidateWorkoutLibrary();
    return { status: "success", message: "Workout in der Bibliothek gespeichert.", item: saved.data };
  } catch {
    return { status: "error", message: "Workout konnte nicht gespeichert werden." };
  }
}

export async function updateWorkoutLibraryItem(input: unknown): Promise<WorkoutLibraryActionResult> {
  try {
    await assertRateLimit("workout-library-update", 30, 60_000);
    const { supabase, user } = await requireCoachAccess();
    const parsed = updateWorkoutLibraryItemSchema.safeParse(input);
    if (!parsed.success) return { status: "error", message: "Bitte Workout und Titel prüfen." };

    const { data, error } = await supabase
      .from("workout_library_items")
      .update({
        title: parsed.data.title,
        discipline: parsed.data.content.discipline,
        content: parsed.data.content,
      })
      .eq("id", parsed.data.id)
      .eq("owner_id", user.id)
      .select("id,title,discipline,content,is_favorite,last_used_at,created_at,updated_at")
      .maybeSingle();

    if (error || !data) return { status: "error", message: "Workout konnte nicht aktualisiert werden." };
    const saved = workoutLibraryItemSchema.safeParse(data);
    if (!saved.success) return { status: "error", message: "Aktualisiertes Workout ist unvollständig." };
    revalidateWorkoutLibrary();
    return { status: "success", message: "Workout in der Bibliothek aktualisiert.", item: saved.data };
  } catch {
    return { status: "error", message: "Workout konnte nicht aktualisiert werden." };
  }
}

export async function setWorkoutLibraryFavorite(input: unknown): Promise<WorkoutLibraryActionResult> {
  try {
    const { supabase, user } = await requireCoachAccess();
    const parsed = favoriteWorkoutLibraryItemSchema.safeParse(input);
    if (!parsed.success) return { status: "error", message: "Ungültiges Workout." };

    const { data, error } = await supabase
      .from("workout_library_items")
      .update({ is_favorite: parsed.data.isFavorite })
      .eq("id", parsed.data.id)
      .eq("owner_id", user.id)
      .select("id,title,discipline,content,is_favorite,last_used_at,created_at,updated_at")
      .maybeSingle();
    if (error || !data) return { status: "error", message: "Favorit konnte nicht geändert werden." };
    const saved = workoutLibraryItemSchema.safeParse(data);
    return saved.success
      ? { status: "success", message: parsed.data.isFavorite ? "Favorit gespeichert." : "Favorit entfernt.", item: saved.data }
      : { status: "error", message: "Favorit konnte nicht geändert werden." };
  } catch {
    return { status: "error", message: "Favorit konnte nicht geändert werden." };
  }
}

export async function markWorkoutLibraryItemUsed(id: string): Promise<WorkoutLibraryActionResult> {
  try {
    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) return { status: "error", message: "Ungültiges Workout." };
    const { supabase, user } = await requireCoachAccess();
    const { data, error } = await supabase
      .from("workout_library_items")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", parsedId.data)
      .eq("owner_id", user.id)
      .select("id,title,discipline,content,is_favorite,last_used_at,created_at,updated_at")
      .maybeSingle();
    if (error || !data) return { status: "error", message: "Zuletzt verwendet konnte nicht gespeichert werden." };
    const saved = workoutLibraryItemSchema.safeParse(data);
    return saved.success
      ? { status: "success", message: "Zuletzt verwendet aktualisiert.", item: saved.data }
      : { status: "error", message: "Zuletzt verwendet konnte nicht gespeichert werden." };
  } catch {
    return { status: "error", message: "Zuletzt verwendet konnte nicht gespeichert werden." };
  }
}

export async function deleteWorkoutLibraryItem(id: string): Promise<WorkoutLibraryActionResult> {
  try {
    await assertRateLimit("workout-library-delete", 10, 60_000);
    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) return { status: "error", message: "Ungültiges Workout." };

    const { supabase, user } = await requireCoachAccess();
    const { data, error } = await supabase
      .from("workout_library_items")
      .delete()
      .eq("id", parsedId.data)
      .eq("owner_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) return { status: "error", message: "Workout konnte nicht gelöscht werden." };
    if (!data) return { status: "error", message: "Workout wurde nicht gefunden." };

    revalidateWorkoutLibrary();
    return { status: "success", message: "Workout gelöscht.", deletedId: parsedId.data };
  } catch {
    return { status: "error", message: "Workout konnte nicht gelöscht werden." };
  }
}

function revalidateWorkoutLibrary() {
  revalidatePath("/trainingsplaene/verwalten");
  revalidatePath("/trainingsplaene/verwalten/new");
}
