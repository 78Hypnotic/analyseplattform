import { Activity, LogOut, UserRound, Waves } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "./button";

export async function AppHeader({ userEmail }: { userEmail?: string | null }) {
  const currentUser = userEmail === undefined ? await getCurrentUserProfile() : { email: userEmail, name: null };
  const resolvedUserEmail = currentUser.email;
  const profileLabel = currentUser.name || currentUser.email;

  return (
    <header className="border-b border-[var(--line)] bg-black/30">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white text-black">
            <Waves size={18} />
          </span>
          <span>
            <span className="block text-sm font-semibold">Trainingsanalyse</span>
            <span className="mono block text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
              Endurance Coaching
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link className="hidden rounded-lg px-3 py-2 text-[var(--muted)] hover:text-white md:block" href="/#disciplines">
            Disziplinen
          </Link>
          <Link className="hidden rounded-lg px-3 py-2 text-[var(--muted)] hover:text-white md:block" href="/#methodik">
            Methodik
          </Link>
          <Link className="hidden rounded-lg px-3 py-2 text-[var(--muted)] hover:text-white md:block" href="/#preise">
            Preise
          </Link>
          <Link className="hidden items-center gap-2 rounded-lg px-3 py-2 text-[var(--muted)] hover:text-white sm:flex" href="/dashboard">
            <Activity size={16} />
            Analyse
          </Link>
          {resolvedUserEmail ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-white"
                title="Profil bearbeiten"
              >
                <UserRound size={15} />
                <span className="mono hidden max-w-44 truncate text-xs sm:block">
                  {profileLabel}
                </span>
              </Link>
              <form action={signOut}>
              <Button variant="ghost" className="px-2" title="Abmelden">
                <LogOut size={16} />
              </Button>
              </form>
            </div>
          ) : (
            <Link className="rounded-lg px-3 py-2 text-[var(--muted)] hover:text-white" href="/login">
              Login
            </Link>
          )}
        </nav>
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

    if (!user) return { email: null, name: null };

    const metadataName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const profile = data as { full_name?: string | null } | null;

    return {
      email: user.email ?? null,
      name: profile?.full_name || metadataName,
    };
  } catch {
    return { email: null, name: null };
  }
}
