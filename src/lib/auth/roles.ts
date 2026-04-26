import "server-only";

import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "user" | "admin";

export type CurrentUserRole = {
  user: {
    id: string;
    email?: string;
  } | null;
  role: AppRole | null;
  isAdmin: boolean;
};

export async function getCurrentUserRole(): Promise<CurrentUserRole> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, role: null, isAdmin: false };
  }

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = isAppRole(data?.role) ? data.role : "user";

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    role,
    isAdmin: role === "admin",
  };
}

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data?.role !== "admin") notFound();

  return { supabase, user };
}

function isAppRole(value: unknown): value is AppRole {
  return value === "user" || value === "admin";
}
