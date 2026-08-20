"use client";

import { usePathname } from "next/navigation";

export function AppHeaderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return pathname.startsWith("/e2e-") ? null : children;
}