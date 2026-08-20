import { MessageSquare } from "lucide-react";
import type { ReactNode } from "react";

export function LockedCommunity({
  headline,
  text,
  action,
}: {
  headline: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-3xl py-14 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-[var(--panel)] text-[var(--accent)]">
        <MessageSquare size={22} />
      </span>
      <p className="mono mt-6 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Community</p>
      <h1 className="display-serif mt-4 text-5xl leading-tight text-[var(--foreground)] sm:text-6xl">{headline}</h1>
      <p className="mx-auto mt-5 max-w-xl leading-7 text-[var(--muted)]">{text}</p>
      {action ? <div className="mt-7">{action}</div> : null}
    </section>
  );
}
