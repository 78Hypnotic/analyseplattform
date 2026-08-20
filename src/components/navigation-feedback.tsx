"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const search = searchParams.toString();
  const routeKey = `${pathname}?${search}`;

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === pathname && url.searchParams.toString() === search) return;
      setPending(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, search]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPending(false));
    return () => window.cancelAnimationFrame(frame);
  }, [routeKey]);

  useEffect(() => {
    if (!pending) return;
    const timeout = window.setTimeout(() => setPending(false), 15_000);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  return pending ? (
    <div role="status" aria-live="polite">
      <span className="sr-only">Seite wird geladen</span>
      <span className="route-loading-progress fixed inset-x-0 top-0 z-[200] h-0.5 bg-[var(--accent)]" />
    </div>
  ) : null;
}