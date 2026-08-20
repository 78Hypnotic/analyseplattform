"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ActiveNavLink({
  href,
  children,
  exact = false,
  className,
  activeClassName = "bg-[var(--raised-bg)] text-[var(--foreground)]",
  title,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
  className?: string;
  activeClassName?: string;
  title?: string;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={title}
      className={cn(className, active && activeClassName)}
    >
      {children}
    </Link>
  );
}