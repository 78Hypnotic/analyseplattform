"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";
const themeChangeEvent = "themechange";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, getServerTheme);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Light theme aktivieren" : "Dark theme aktivieren"}
      aria-pressed={!isDark}
      title={isDark ? "Light theme" : "Dark theme"}
      suppressHydrationWarning
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--panel-2)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]",
        className,
      )}
    >
      {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
    </button>
  );
}

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";

  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : "light";
}

function getServerTheme(): Theme {
  return "light";
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener(themeChangeEvent, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(themeChangeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}
