"use client";

import { useState } from "react";
import { Activity, LogOut, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { Button } from "./button";

export function MobileHeaderMenu({
  isAuthenticated,
  profileLabel,
}: {
  isAuthenticated: boolean;
  profileLabel: string | null;
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
        <div className="absolute inset-x-0 top-16 z-50 border-b border-[var(--line)] bg-[rgba(11,12,13,0.98)] px-5 py-4 shadow-2xl shadow-black/40">
          <nav className="mx-auto grid max-w-6xl gap-2 text-sm">
            <MobileLink href="/#disciplines" label="Disziplinen" onClick={() => setOpen(false)} />
            <MobileLink href="/#methodik" label="Methodik" onClick={() => setOpen(false)} />
            <MobileLink href="/#preise" label="Preise" onClick={() => setOpen(false)} />
            <MobileLink href="/analyse" label="Analyse" icon={<Activity size={16} />} onClick={() => setOpen(false)} />
            {isAuthenticated ? (
              <>
                <MobileLink
                  href="/profile"
                  label={profileLabel ?? "Profil"}
                  icon={<UserRound size={16} />}
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
      className="flex items-center gap-2 rounded-lg px-3 py-3 text-[var(--muted)] hover:bg-[var(--panel)] hover:text-white"
    >
      {icon}
      {label}
    </Link>
  );
}
