import "server-only";

import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "user" | "coach" | "admin";

export type CurrentUserRole = {
  user: {
    id: string;
    email?: string;
  } | null;
  roles: AppRole[];
  role: AppRole | null;
  isAdmin: boolean;
  isCoach: boolean;
};

export async function getCurrentUserRole(): Promise<CurrentUserRole> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, roles: [], role: null, isAdmin: false, isCoach: false };
  }

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = normalizeRoles(data?.map((row) => row.role));
  const role = getPrimaryRole(roles);

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    roles,
    role,
    isAdmin: roles.includes("admin"),
    isCoach: roles.includes("coach"),
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
    .eq("role", "admin")
    .maybeSingle();

  if (data?.role !== "admin") notFound();

  return { supabase, user };
}

export async function requireCoachAccess() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = normalizeRoles(data?.map((row) => row.role));

  if (!roles.includes("coach") && !roles.includes("admin")) notFound();

  return {
    supabase,
    user,
    roles,
    role: getPrimaryRole(roles),
    isAdmin: roles.includes("admin"),
    isCoach: roles.includes("coach"),
  };
}

function normalizeRoles(values: unknown[] | undefined): AppRole[] {
  const roles = (values ?? []).filter(isAppRole);
  return roles.length > 0 ? Array.from(new Set(roles)) : ["user"];
}

function getPrimaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("coach")) return "coach";
  return "user";
}

function isAppRole(value: unknown): value is AppRole {
  return value === "user" || value === "coach" || value === "admin";
}
