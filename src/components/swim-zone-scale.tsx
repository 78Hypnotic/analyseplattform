import { formatPace } from "@/lib/analysis/calculations";
import type { SwimZone } from "@/lib/analysis/types";

export function SwimZoneScale({ zones, cssPace }: { zones: SwimZone[]; cssPace: number }) {
  if (zones.length === 0 || !Number.isFinite(cssPace)) return null;

  const min = Math.min(...zones.map((zone) => zone.fastestPace));
  const max = Math.max(...zones.map((zone) => zone.slowestPace));
  const span = max - min;
  const widthOf = (zone: SwimZone) => ((zone.slowestPace - zone.fastestPace) / span) * 100;
  const cssPosition = ((max - cssPace) / span) * 100;

  return (
    <div>
      <div className="mono flex justify-between text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">
        <span>locker</span>
        <span>hart</span>
      </div>
      <div className="mt-2 flex">
        {zones.map((zone) => (
          <div key={zone.id} className="text-center" style={{ width: `${widthOf(zone)}%` }}>
            <span className="mono text-xs font-medium">{zone.id}</span>
          </div>
        ))}
      </div>
      <div className="relative mt-1 flex h-10 overflow-hidden rounded-lg border border-[var(--line)]">
        {zones.map((zone, index) => (
          <div
            key={zone.id}
            className="border-r border-[var(--line)] last:border-r-0"
            style={{
              width: `${widthOf(zone)}%`,
              backgroundColor: `color-mix(in oklab, var(--accent) ${12 + index * 9}%, transparent)`,
            }}
          />
        ))}
        <div
          className="absolute inset-y-0 w-0 border-l border-dashed border-[var(--foreground)]"
          style={{ left: `${cssPosition}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="relative mt-2 h-4">
        <span
          className="mono absolute -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]"
          style={{ left: `${cssPosition}%` }}
        >
          CSS {formatPace(cssPace)}
        </span>
      </div>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => (
          <li key={zone.id} className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
            <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">
              {zone.id} {zone.name}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--accent)]">
              {formatPace(zone.fastestPace)} – {formatPace(zone.slowestPace)}
              <span className="ml-2 text-xs font-normal text-[var(--subtle)]">/100 m</span>
            </p>
            <p className="muted mt-2 text-sm leading-6">{zone.purpose}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
