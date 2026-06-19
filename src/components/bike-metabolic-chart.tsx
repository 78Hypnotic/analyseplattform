"use client";

import { useRef, useState } from "react";
import type { FatCurvePoint } from "@/lib/cycling/types";

const VIEW_W = 640;
const VIEW_H = 260;
const PAD_L = 38;
const PAD_R = 46;
const PAD_T = 22;
const PAD_B = 34;

/**
 * Interactive substrate + lactate chart. Shows carbohydrate and fat share of
 * energy (left axis, %) and modelled blood lactate (right axis, mmol/l) across
 * power, with a hover tooltip reading off the values at the pointer.
 */
export function BikeMetabolicChart({
  curve,
  ftp,
  fatMaxWatt,
}: {
  curve: FatCurvePoint[];
  ftp: number;
  fatMaxWatt: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (curve.length < 2) return null;

  const points = curve.map((point) => {
    const total = point.fat + point.cho || 1;
    return { ...point, carbPct: (point.cho / total) * 100, fatPct: (point.fat / total) * 100 };
  });

  const lacMax = Math.max(2, Math.ceil(Math.max(...points.map((p) => p.lactate))));

  const x = (watt: number) => PAD_L + (watt / ftp) * (VIEW_W - PAD_L - PAD_R);
  const yPct = (pct: number) => PAD_T + (1 - pct / 100) * (VIEW_H - PAD_T - PAD_B);
  const yLac = (lac: number) => PAD_T + (1 - lac / lacMax) * (VIEW_H - PAD_T - PAD_B);

  const carbLine = points.map((p) => `${x(p.watt).toFixed(1)},${yPct(p.carbPct).toFixed(1)}`).join(" ");
  const fatLine = points.map((p) => `${x(p.watt).toFixed(1)},${yPct(p.fatPct).toFixed(1)}`).join(" ");
  const lacLine = points.map((p) => `${x(p.watt).toFixed(1)},${yLac(p.lactate).toFixed(1)}`).join(" ");

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const vbX = ((event.clientX - rect.left) / rect.width) * VIEW_W;
    const frac = (vbX - PAD_L) / (VIEW_W - PAD_L - PAD_R);
    const idx = Math.round(frac * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, idx)));
  }

  const active = hover !== null ? points[hover] : null;
  const markerX = x(fatMaxWatt);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full touch-none"
        role="img"
        aria-label="Substrat- und Laktatkurve über die Leistung"
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
      >
        {/* horizontal gridlines for the % axis */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <g key={pct}>
            <line x1={PAD_L} y1={yPct(pct)} x2={VIEW_W - PAD_R} y2={yPct(pct)} stroke="var(--line)" strokeWidth={1} />
            <text x={PAD_L - 6} y={yPct(pct) + 3} textAnchor="end" fill="var(--subtle)" fontSize="10">{pct}%</text>
          </g>
        ))}
        {/* right axis ticks (lactate) */}
        {[0, lacMax / 2, lacMax].map((lac) => (
          <text key={lac} x={VIEW_W - PAD_R + 6} y={yLac(lac) + 3} fill="var(--subtle)" fontSize="10">
            {lac.toFixed(0)}
          </text>
        ))}

        {/* FatMax marker */}
        <line x1={markerX} y1={PAD_T} x2={markerX} y2={VIEW_H - PAD_B} stroke="var(--foreground)" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
        <text x={markerX} y={PAD_T - 6} textAnchor="middle" fill="var(--foreground)" fontSize="10">FatMax</text>

        <polyline points={fatLine} fill="none" stroke="color-mix(in oklab, var(--foreground) 45%, transparent)" strokeWidth={2} />
        <polyline points={carbLine} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <polyline points={lacLine} fill="none" stroke="var(--warn)" strokeWidth={2.5} strokeDasharray="2 3" />

        {/* hover guide + dots */}
        {active ? (
          <g>
            <line x1={x(active.watt)} y1={PAD_T} x2={x(active.watt)} y2={VIEW_H - PAD_B} stroke="var(--accent)" strokeWidth={1} />
            <circle cx={x(active.watt)} cy={yPct(active.carbPct)} r={3.5} fill="var(--accent)" />
            <circle cx={x(active.watt)} cy={yPct(active.fatPct)} r={3.5} fill="color-mix(in oklab, var(--foreground) 60%, transparent)" />
            <circle cx={x(active.watt)} cy={yLac(active.lactate)} r={3.5} fill="var(--warn)" />
          </g>
        ) : null}

        <text x={PAD_L} y={VIEW_H - 8} fill="var(--subtle)" fontSize="10">0 W</text>
        <text x={VIEW_W - PAD_R} y={VIEW_H - 8} textAnchor="end" fill="var(--subtle)" fontSize="10">{Math.round(ftp)} W (FTP)</text>
        <text x={VIEW_W - 4} y={PAD_T - 8} textAnchor="end" fill="var(--warn)" fontSize="10">mmol/l</text>
      </svg>

      {active ? (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-[var(--line)] bg-[var(--overlay-bg)] px-3 py-2 text-xs shadow-[0_8px_24px_var(--shadow-color)]"
          style={{ left: `${(x(active.watt) / VIEW_W) * 100}%` }}
        >
          <p className="font-medium">{active.watt} W</p>
          <p className="mt-1 text-[var(--accent)]">KH {Math.round(active.carbPct)} %</p>
          <p className="text-[var(--muted)]">Fett {Math.round(active.fatPct)} %</p>
          <p className="text-[var(--warn)]">Laktat {active.lactate.toFixed(1)} mmol/l</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--muted)]">
        <LegendDot color="var(--accent)" label="Kohlenhydrate" />
        <LegendDot color="color-mix(in oklab, var(--foreground) 45%, transparent)" label="Fett" />
        <LegendDot color="var(--warn)" label="Laktat (Modell)" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-block h-1.5 w-4 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
