"use client";

import { useId, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type AthleteSelectOption = {
  id: string;
  name: string;
  email: string;
};

/**
 * Searchable form control for large athlete lists while still submitting a plain athleteId.
 */
export function AthleteSearchSelect({ athletes }: { athletes: AthleteSelectOption[] }) {
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const selectedAthlete = athletes.find((athlete) => athlete.id === selectedId);
  const sortedAthletes = useMemo(
    () =>
      [...athletes].sort((first, second) =>
        first.name.localeCompare(second.name, "de", { sensitivity: "base" }),
      ),
    [athletes],
  );
  const filteredAthletes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sortedAthletes.slice(0, 50);

    return sortedAthletes
      .filter((athlete) => {
        const haystack = `${athlete.name} ${athlete.email}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 50);
  }, [query, sortedAthletes]);

  return (
    <div className="relative grid gap-2 text-sm">
      <span>Athlet</span>
      <input
        name="athleteId"
        value={selectedId}
        onChange={() => undefined}
        required
        className="sr-only"
        tabIndex={-1}
      />
      <button
        type="button"
        disabled={athletes.length === 0}
        onClick={() => setIsOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
        }}
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex h-12 w-full items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-4 text-left text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={cn("truncate", selectedAthlete ? "text-[var(--foreground)]" : "text-[var(--muted)]")}>
          {selectedAthlete ? `${selectedAthlete.name} (${selectedAthlete.email})` : "Athlet suchen"}
        </span>
        <Search size={16} className="shrink-0 text-[var(--subtle)]" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] shadow-xl">
          <div className="border-b border-[var(--line)] p-2">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setIsOpen(false);
                  event.currentTarget.blur();
                }
              }}
              placeholder="Name oder E-Mail suchen"
              type="search"
              className="h-10 w-full"
            />
          </div>
          <div id={listboxId} role="listbox" className="max-h-72 overflow-y-auto p-1">
            {filteredAthletes.length === 0 ? (
              <p className="muted px-3 py-2 text-sm">Keine Athleten gefunden.</p>
            ) : (
              filteredAthletes.map((athlete) => (
                <button
                  key={athlete.id}
                  type="button"
                  role="option"
                  aria-selected={selectedId === athlete.id}
                  onClick={() => {
                    setSelectedId(athlete.id);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--raised-bg)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{athlete.name}</span>
                    <span className="mono mt-0.5 block truncate text-xs text-[var(--subtle)]">{athlete.email}</span>
                  </span>
                  {selectedId === athlete.id ? <Check size={16} className="shrink-0 text-[var(--accent)]" /> : null}
                </button>
              ))
            )}
          </div>
          {athletes.length > 50 ? (
            <p className="mono border-t border-[var(--line)] px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">
              Max. 50 Treffer sichtbar, weiter eingrenzen per Suche.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
