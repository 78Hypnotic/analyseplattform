import { Activity, LogOut, Waves } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { Button } from "./button";

export function AppHeader({ userEmail }: { userEmail?: string | null }) {
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

        <nav className="flex items-center gap-2 text-sm">
          <Link className="hidden items-center gap-2 rounded-lg px-3 py-2 text-[var(--muted)] hover:text-white sm:flex" href="/dashboard">
            <Activity size={16} />
            Dashboard
          </Link>
          {userEmail ? (
            <form action={signOut} className="flex items-center gap-3">
              <span className="mono hidden max-w-48 truncate text-xs text-[var(--subtle)] sm:block">
                {userEmail}
              </span>
              <Button variant="ghost" className="px-2" title="Abmelden">
                <LogOut size={16} />
              </Button>
            </form>
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
