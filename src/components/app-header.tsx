import { LogOut, Waves } from "lucide-react";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { signOut } from "@/app/login/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/auth/roles";
import { ActiveNavLink } from "./active-nav-link";
import { Button } from "./button";
import { DiagnosticsMenu } from "./diagnostics-menu";
import { MobileHeaderMenu } from "./mobile-header-menu";
import { ThemeToggle } from "./theme-toggle";

export async function AppHeader() {
  const currentUser = await getCurrentUserProfile();
  const resolvedUserEmail = currentUser.email;
  const profileLabel = currentUser.name || currentUser.email;
  const isAdmin = currentUser.roles.includes("admin");
  const isCoach = currentUser.roles.includes("coach");
  const profileInitials = buildInitials(profileLabel ?? "Profil");

  return (
    <header className="relative border-b border-[var(--line)] bg-[var(--header-bg)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--brand-bg)] text-[var(--brand-fg)]">
            <Waves size={18} />
          </span>
          <span>
            <span className="block text-sm font-semibold">Trainingsanalyse</span>
            <span className="mono block text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
              Endurance Coaching
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {resolvedUserEmail ? (
            <>
              <ActiveNavLink exact className="rounded-lg px-3 py-2 text-[var(--muted)] hover:text-[var(--foreground)]" href="/">
                Übersicht
              </ActiveNavLink>
              <DiagnosticsMenu />
            </>
          ) : (
            <>
              <DiagnosticsMenu />
              <Link className="rounded-lg px-3 py-2 text-[var(--muted)] hover:text-[var(--foreground)]" href="/#methodik">
                Methodik
              </Link>
              <Link className="rounded-lg px-3 py-2 text-[var(--muted)] hover:text-[var(--foreground)]" href="/#preise">
                Preise
              </Link>
            </>
          )}
          <ActiveNavLink className="rounded-lg px-3 py-2 text-[var(--muted)] hover:text-[var(--foreground)]" href="/trainingsplaene">
            Trainingspläne
          </ActiveNavLink>
          {resolvedUserEmail ? (
            <ActiveNavLink className="rounded-lg px-3 py-2 text-[var(--muted)] hover:text-[var(--foreground)]" href="/community">
              Community
            </ActiveNavLink>
          ) : null}
          {isCoach ? (
            <ActiveNavLink className="rounded-lg px-3 py-2 text-[var(--muted)] hover:text-[var(--foreground)]" href="/coach">
              Coach
            </ActiveNavLink>
          ) : null}
          {isAdmin ? (
            <ActiveNavLink className="rounded-lg px-3 py-2 text-[var(--muted)] hover:text-[var(--foreground)]" href="/admin">
              Admin
            </ActiveNavLink>
          ) : null}
          <ThemeToggle />
          {resolvedUserEmail ? (
            <div className="flex items-center gap-2">
              <ActiveNavLink
                href="/profile"
                className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                activeClassName="border-[var(--accent)] text-[var(--foreground)]"
                title="Profil bearbeiten"
              >
                <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--raised-bg)] text-[10px] font-semibold text-[var(--foreground)]">
                  {currentUser.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentUser.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span>{profileInitials}</span>
                  )}
                </span>
                <span className="mono hidden max-w-44 truncate text-xs sm:block">
                  {profileLabel}
                </span>
              </ActiveNavLink>
              <form action={signOut}>
                <Button variant="ghost" className="px-2" title="Abmelden">
                  <LogOut size={16} />
                </Button>
              </form>
            </div>
          ) : (
            <ActiveNavLink exact className="rounded-lg px-3 py-2 text-[var(--muted)] hover:text-[var(--foreground)]" href="/login">
              Login
            </ActiveNavLink>
          )}
        </nav>
        <MobileHeaderMenu
          isAuthenticated={Boolean(resolvedUserEmail)}
          isAdmin={isAdmin}
          isCoach={isCoach}
          profileLabel={profileLabel}
          avatarUrl={currentUser.avatarUrl}
        />
      </div>
    </header>
  );
}

async function getCurrentUserProfile() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { email: null, name: null, roles: [] as AppRole[] };

    const metadataName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null;

    let profileData: { full_name?: string | null; avatar_url?: string | null } | null = null;
    let roleValues: unknown[] | undefined;
    try {
      const cached = await getCachedHeaderData(user.id);
      profileData = cached.profile;
      roleValues = cached.roles;
    } catch {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      profileData = profile;
      roleValues = roles?.map((row) => row.role);
    }

    const profile = profileData;
    const roles = normalizeRoles(roleValues);

    return {
      email: user.email ?? null,
      name: profile?.full_name || metadataName,
      avatarUrl: profile?.avatar_url ?? getMetadataAvatarUrl(user.user_metadata?.avatar_url),
      roles,
    };
  } catch {
    return { email: null, name: null, roles: [] as AppRole[], avatarUrl: null };
  }
}

const getCachedHeaderData = unstable_cache(
  async (userId: string) => {
    const admin = createSupabaseAdminClient();
    const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] = await Promise.all([
      admin.from("profiles").select("full_name,avatar_url").eq("id", userId).maybeSingle(),
      admin.from("user_roles").select("role").eq("user_id", userId),
    ]);
    if (profileError) throw new Error(profileError.message);
    if (rolesError) throw new Error(rolesError.message);
    return {
      profile: profile as { full_name?: string | null; avatar_url?: string | null } | null,
      roles: (roles ?? []).map((row) => row.role),
    };
  },
  ["app-header-user"],
  { revalidate: 60, tags: ["app-header-user"] },
);

function normalizeRoles(values: unknown[] | undefined): AppRole[] {
  const roles = (values ?? []).filter(isAppRole);
  return roles.length > 0 ? Array.from(new Set(roles)) : ["user"];
}

function isAppRole(value: unknown): value is AppRole {
  return value === "user" || value === "coach" || value === "admin";
}

function getMetadataAvatarUrl(value: unknown) {
  return typeof value === "string" ? value : null;
}

function buildInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${second}`.toUpperCase();
}
