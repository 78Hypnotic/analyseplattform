"use client";

import { useState } from "react";
import { Activity, LogOut, Menu, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { Button } from "./button";
import { ThemeToggle } from "./theme-toggle";

export function MobileHeaderMenu({
  isAuthenticated,
  isAdmin,
  isCoach,
  profileLabel,
  avatarUrl,
}: {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCoach: boolean;
  profileLabel: string | null;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        className="px-2"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {open ? (
        <div className="absolute inset-x-0 top-16 z-50 border-b border-[var(--line)] bg-[var(--overlay-bg)] px-5 py-4 shadow-[0_24px_60px_var(--shadow-color)]">
          <nav className="mx-auto grid max-w-6xl gap-2 text-sm">
            <MobileLink href="/#disciplines" label="Disziplinen" onClick={() => setOpen(false)} />
            <MobileLink href="/#methodik" label="Methodik" onClick={() => setOpen(false)} />
            <MobileLink href="/#preise" label="Preise" onClick={() => setOpen(false)} />
            <MobileLink href="/analyse" label="Analyse" icon={<Activity size={16} />} onClick={() => setOpen(false)} />
            {isCoach || isAdmin ? (
              <MobileLink href="/coach" label="Coach" icon={<UsersRound size={16} />} onClick={() => setOpen(false)} />
            ) : null}
            {isAdmin ? (
              <MobileLink href="/admin" label="Admin" icon={<ShieldCheck size={16} />} onClick={() => setOpen(false)} />
            ) : null}
            <div className="flex items-center justify-between rounded-lg px-3 py-2 text-[var(--muted)]">
              <span>Theme</span>
              <ThemeToggle />
            </div>
            {isAuthenticated ? (
              <>
                <MobileLink
                  href="/profile"
                  label={profileLabel ?? "Profil"}
                  icon={<MobileAvatar avatarUrl={avatarUrl} label={profileLabel ?? "Profil"} />}
                  onClick={() => setOpen(false)}
                />
                <form action={signOut}>
                  <Button variant="ghost" className="w-full justify-start px-3">
                    <LogOut size={16} />
                    Abmelden
                  </Button>
                </form>
              </>
            ) : (
              <MobileLink href="/login" label="Login" onClick={() => setOpen(false)} />
            )}
          </nav>
        </div>
      ) : null}
    </div>
  );
}

function MobileAvatar({ avatarUrl, label }: { avatarUrl?: string | null; label: string }) {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--panel-2)] text-[9px] font-semibold text-[var(--foreground)]">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <UserRound size={14} aria-hidden="true" />
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}

function MobileLink({
  href,
  label,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-3 py-3 text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
    >
      {icon}
      {label}
    </Link>
  );
}
