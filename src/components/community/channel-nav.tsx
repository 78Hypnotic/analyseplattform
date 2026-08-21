"use client";

import { Link2, Megaphone, MessagesSquare, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CommunityChannelSummary, CommunityChannelType } from "@/lib/community/communities";
import { cn } from "@/lib/utils";

export function ChannelNav({
  communitySlug,
  channels,
  canModerate,
}: {
  communitySlug: string;
  channels: CommunityChannelSummary[];
  canModerate: boolean;
}) {
  const pathname = usePathname();
  const base = `/community/${communitySlug}`;
  const settingsHref = `${base}/einstellungen`;
  const activeSlug = resolveActiveSlug(pathname, base, channels);
  const activeLabel = pathname === settingsHref
    ? "Kanäle verwalten"
    : channels.find((channel) => channel.slug === activeSlug)?.name ?? "Kanäle";

  const items = (
    <ul className="grid gap-1">
      {channels.map((channel) => (
        <li key={channel.id}>
          <Link
            href={`${base}/${channel.slug}`}
            aria-current={channel.slug === activeSlug ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
              channel.slug === activeSlug
                ? "bg-[var(--panel-2)] text-[var(--foreground)]"
                : "text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--foreground)]",
            )}
          >
            <ChannelIcon type={channel.type} />
            <span className="min-w-0 flex-1 truncate">{channel.name}</span>
            {channel.isActive ? null : (
              <span className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">aus</span>
            )}
          </Link>
        </li>
      ))}
      {canModerate ? (
        <li className="mt-2 border-t border-[var(--line)] pt-2">
          <Link
            href={settingsHref}
            aria-current={pathname === settingsHref ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
              pathname === settingsHref
                ? "bg-[var(--panel-2)] text-[var(--foreground)]"
                : "text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--foreground)]",
            )}
          >
            <Settings size={15} className="shrink-0 text-[var(--accent)]" />
            Kanäle verwalten
          </Link>
        </li>
      ) : null}
    </ul>
  );

  return (
    <nav aria-label="Kanäle">
      <details className="surface p-2 lg:hidden">
        <summary className="cursor-pointer px-2 py-1 text-sm text-[var(--foreground)]">
          Kanal: <span className="text-[var(--accent)]">{activeLabel}</span>
        </summary>
        <div className="mt-2">{items}</div>
      </details>
      <div className="hidden lg:block">{items}</div>
    </nav>
  );
}

function ChannelIcon({ type }: { type: CommunityChannelType }) {
  const props = { size: 15, className: "shrink-0 text-[var(--accent)]" } as const;
  if (type === "announcement") return <Megaphone {...props} />;
  if (type === "intro") return <Users {...props} />;
  if (type === "links") return <Link2 {...props} />;
  return <MessagesSquare {...props} />;
}

function resolveActiveSlug(pathname: string, base: string, channels: CommunityChannelSummary[]) {
  if (pathname === base) return channels.find((channel) => channel.isDefault)?.slug ?? channels[0]?.slug ?? null;
  return channels.find((channel) => pathname === `${base}/${channel.slug}`)?.slug ?? null;
}
