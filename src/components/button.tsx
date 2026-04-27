import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "secondary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonClassName(variant), className)}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function ButtonLink({
  className,
  variant = "secondary",
  ...props
}: ButtonLinkProps) {
  return <Link className={cn(buttonClassName(variant), className)} {...props} />;
}

function buttonClassName(variant: ButtonProps["variant"]) {
  const base =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
  if (variant === "primary") {
    return cn(base, "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]");
  }
  if (variant === "ghost") {
    return cn(base, "text-[var(--muted)] hover:text-[var(--foreground)]");
  }
  return cn(base, "border border-[var(--line)] bg-[var(--panel-2)] text-[var(--foreground)] hover:border-[var(--accent)]");
}
