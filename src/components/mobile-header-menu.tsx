"use client";

import { useState } from "react";
import { ChevronDown, Menu, UserRound, X } from "lucide-react";
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
  hideTrainingPlansLink = false,
}: {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCoach: boolean;
  profileLabel: string | null;
  avatarUrl?: string | null;
  hideTrainingPlansLink?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

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
            {isAuthenticated ? (
              <MobileLink href="/" label="Übersicht" onClick={() => setOpen(false)} />
            ) : (
              <>
                <MobileLink href="/#methodik" label="Methodik" onClick={() => setOpen(false)} />
                <MobileLink href="/#preise" label="Preise" onClick={() => setOpen(false)} />
              </>
            )}
            <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)]">
              <button
                type="button"
                onClick={() => setDiagnosticsOpen((current) => !current)}
                aria-expanded={diagnosticsOpen}
                className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <span>Diagnostik</span>
                <ChevronDown size={16} className={diagnosticsOpen ? "rotate-180 transition" : "transition"} />
              </button>
              {diagnosticsOpen ? (
                <div className="grid gap-1 border-t border-[var(--line)] p-2">
                  <MobileLink href="/analyse" label="Schwimmen" onClick={() => setOpen(false)} nested />
                  <MobileLink href="/lauf" label="Laufen" onClick={() => setOpen(false)} nested />
                  <MobileLink href="/rad" label="Radfahren" onClick={() => setOpen(false)} nested />
                </div>
              ) : null}
            </div>
            {!hideTrainingPlansLink ? (
              <MobileLink href="/trainingsplaene" label="Trainingspläne" onClick={() => setOpen(false)} />
            ) : null}
            <MobileLink href="/community" label="Community" onClick={() => setOpen(false)} />
            {isCoach ? (
              <MobileLink href="/coach" label="Coach" onClick={() => setOpen(false)} />
            ) : null}
            {isAdmin ? (
              <MobileLink href="/admin" label="Admin" onClick={() => setOpen(false)} />
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
  nested = false,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  nested?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={nested
        ? "flex items-center gap-2 rounded-lg px-3 py-2.5 text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
        : "flex items-center gap-2 rounded-lg px-3 py-3 text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--foreground)]"}
    >
      {icon}
      {label}
    </Link>
  );
}
