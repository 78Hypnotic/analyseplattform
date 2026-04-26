import type { ReactNode } from "react";

export function LegalPage({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
      <div className="legal-content mt-8 space-y-7">{children}</div>
    </main>
  );
}
