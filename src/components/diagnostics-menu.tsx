"use client";

import { Activity, Bike, ChevronDown, Footprints } from "lucide-react";
import { usePathname } from "next/navigation";
import { ActiveNavLink } from "./active-nav-link";
import { cn } from "@/lib/utils";

export function DiagnosticsMenu() {
  const pathname = usePathname();
  const active = ["/analyse", "/lauf", "/rad"].some((route) => pathname === route || pathname.startsWith(`${route}/`));

  return (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-1 rounded-lg px-3 py-2 text-[var(--muted)] hover:text-[var(--foreground)] focus-visible:text-[var(--foreground)]",
          active && "bg-[var(--raised-bg)] text-[var(--foreground)]",
        )}
      >
        Diagnostik
        <ChevronDown size={14} className="transition group-hover:rotate-180 group-focus-within:rotate-180" />
      </button>
      <div
        role="menu"
        className="invisible absolute left-0 top-full z-50 w-52 translate-y-1 rounded-lg border border-[var(--line)] bg-[var(--overlay-bg)] p-2 opacity-0 shadow-[0_18px_50px_var(--shadow-color)] transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        <DiagnosticsLink href="/analyse" icon={<Activity size={16} />} label="Schwimmen" />
        <DiagnosticsLink href="/lauf" icon={<Footprints size={16} />} label="Laufen" />
        <DiagnosticsLink href="/rad" icon={<Bike size={16} />} label="Radfahren" />
      </div>
    </div>
  );
}

function DiagnosticsLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <ActiveNavLink
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
      activeClassName="bg-[var(--panel)] text-[var(--foreground)]"
    >
      <span className="text-[var(--accent)]">{icon}</span>
      {label}
    </ActiveNavLink>
  );
}