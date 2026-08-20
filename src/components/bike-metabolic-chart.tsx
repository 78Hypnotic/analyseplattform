"use client";

import { useRef, useState } from "react";
import { computeSubstrateOxidation } from "@/lib/cycling/calculations";
import type { FatCurvePoint } from "@/lib/cycling/types";

const VIEW_W = 640;
const VIEW_H = 220;
const PAD_L = 38;
const PAD_R = 46;
const PAD_T = 22;
const PAD_B = 34;

type HoverState = {
  index: number;
};

/**
 * Interactive metabolic chart for locating FatMax on modelled substrate energy demand.
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
  const oxidationSvgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  if (curve.length < 2) return null;

  const points = curve.map(chartPoint);

  const maxFatKcal = Math.max(...points.map((point) => point.fatKcalPerHour));
  const maxCarbKcal = Math.max(...points.map((point) => point.carbKcalPerHour));
  const fatRateMax = Math.max(50, Math.ceil(maxFatKcal / 50) * 50);
  const carbRateMax = Math.max(100, Math.ceil(maxCarbKcal / 100) * 100);

  const x = (watt: number) => PAD_L + (watt / ftp) * (VIEW_W - PAD_L - PAD_R);
  const yFatRate = (rate: number) => PAD_T + (1 - rate / fatRateMax) * (VIEW_H - PAD_T - PAD_B);
  const yCarbRate = (rate: number) => PAD_T + (1 - rate / carbRateMax) * (VIEW_H - PAD_T - PAD_B);

  const carbRateLine = points.map((p) => `${x(p.watt).toFixed(1)},${yCarbRate(p.carbKcalPerHour).toFixed(1)}`).join(" ");
  const fatRateLine = points.map((p) => `${x(p.watt).toFixed(1)},${yFatRate(p.fatKcalPerHour).toFixed(1)}`).join(" ");

  function handleMove(
    event: React.PointerEvent<SVGSVGElement>,
    svg: SVGSVGElement | null,
  ) {
    const rect = svg?.getBoundingClientRect();
    if (!rect) return;
    const vbX = ((event.clientX - rect.left) / rect.width) * VIEW_W;
    const frac = (vbX - PAD_L) / (VIEW_W - PAD_L - PAD_R);
    const idx = Math.round(frac * (points.length - 1));
    setHover({ index: Math.max(0, Math.min(points.length - 1, idx)) });
  }

  const active = hover !== null ? points[hover.index] : null;
  const tooltipLeft = active === null ? 50 : Math.max(17, Math.min(83, (x(active.watt) / VIEW_W) * 100));
  const markerX = x(fatMaxWatt);
  const fatMaxPoint = points.reduce((nearest, point) =>
    Math.abs(point.watt - fatMaxWatt) < Math.abs(nearest.watt - fatMaxWatt) ? point : nearest,
  );

  return (
    <div>
        <p className="text-sm font-medium">Energieverbrauch (Modell)</p>
        <p className="muted mt-1 text-xs leading-5">Der FatMax-Proxy liegt am höchsten Punkt der modellierten Fettenergie-Kurve.</p>
        <div className="relative">
          <svg
            ref={oxidationSvgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="mt-2 w-full touch-none"
            role="img"
            aria-label="Modellierter Energieverbrauch aus Fett und Kohlenhydraten über die Leistung"
            onPointerMove={(event) => handleMove(event, oxidationSvgRef.current)}
            onPointerDown={(event) => handleMove(event, oxidationSvgRef.current)}
            onPointerLeave={() => setHover(null)}
          >
            {[0, fatRateMax / 2, fatRateMax].map((rate) => (
              <g key={rate}>
                <line x1={PAD_L} y1={yFatRate(rate)} x2={VIEW_W - PAD_R} y2={yFatRate(rate)} stroke="var(--line)" strokeWidth={1} />
                <text x={PAD_L - 6} y={yFatRate(rate) + 3} textAnchor="end" fill="var(--subtle)" fontSize="10">{Math.round(rate)}</text>
              </g>
            ))}
            {[0, carbRateMax / 2, carbRateMax].map((rate) => (
              <text key={rate} x={VIEW_W - PAD_R + 6} y={yCarbRate(rate) + 3} fill="var(--subtle)" fontSize="10">{Math.round(rate)}</text>
            ))}
            <line x1={markerX} y1={PAD_T} x2={markerX} y2={VIEW_H - PAD_B} stroke="var(--foreground)" strokeWidth={1} strokeDasharray="4 4" opacity={0.55} />
            <text x={markerX} y={PAD_T - 6} textAnchor="middle" fill="var(--foreground)" fontSize="10">FatMax-Proxy</text>
            <polyline points={fatRateLine} fill="none" stroke="color-mix(in oklab, var(--foreground) 48%, transparent)" strokeWidth={2.5} />
            <polyline points={carbRateLine} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
            <circle cx={markerX} cy={yFatRate(fatMaxPoint.fatKcalPerHour)} r={4} fill="var(--panel)" stroke="var(--foreground)" strokeWidth={2} />
            {active ? (
              <g>
                <line x1={x(active.watt)} y1={PAD_T} x2={x(active.watt)} y2={VIEW_H - PAD_B} stroke="var(--accent)" strokeWidth={1} />
                <circle cx={x(active.watt)} cy={yCarbRate(active.carbKcalPerHour)} r={3.5} fill="var(--accent)" />
                <circle cx={x(active.watt)} cy={yFatRate(active.fatKcalPerHour)} r={3.5} fill="var(--foreground)" />
              </g>
            ) : null}
            <AxisLabels ftp={ftp} />
            <text x={PAD_L} y={PAD_T - 8} fill="var(--subtle)" fontSize="10">Fett kcal/h</text>
            <text x={VIEW_W - 4} y={PAD_T - 8} textAnchor="end" fill="var(--subtle)" fontSize="10">KH kcal/h</text>
          </svg>
          {active ? (
            <ChartTooltip point={active} left={tooltipLeft} />
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--muted)]">
          <LegendDot color="var(--foreground)" label="Fett (kcal/h)" />
          <LegendDot color="var(--accent)" label="Kohlenhydrate (kcal/h)" />
        </div>
        <FatMaxSummary point={fatMaxPoint} />
    </div>
  );
}

function AxisLabels({ ftp }: { ftp: number }) {
  return (
    <>
      <text x={PAD_L} y={VIEW_H - 8} fill="var(--subtle)" fontSize="10">0 W</text>
      <text x={VIEW_W - PAD_R} y={VIEW_H - 8} textAnchor="end" fill="var(--subtle)" fontSize="10">{Math.round(ftp)} W (FTP)</text>
    </>
  );
}

function ChartTooltip({
  point,
  left,
}: {
  point: ReturnType<typeof chartPoint>;
  left: number;
}) {
  return (
    <div
      className="pointer-events-none absolute top-3 z-10 min-w-44 -translate-x-1/2 rounded-lg border border-[var(--line)] bg-[var(--overlay-bg)] px-3 py-2 text-xs shadow-[0_8px_24px_var(--shadow-color)]"
      style={{ left: `${left}%` }}
      role="status"
    >
      <p className="font-medium">{point.watt} W</p>
      <p className="mt-1">Fett {Math.round(point.fatKcalPerHour)} kcal/h</p>
      <p className="text-[var(--accent)]">KH {Math.round(point.carbKcalPerHour)} kcal/h</p>
      <p className="text-[var(--subtle)]">{Math.round(point.fatPct)} % Fett · {Math.round(point.carbPct)} % KH</p>
    </div>
  );
}

function FatMaxSummary({ point }: { point: ReturnType<typeof chartPoint> }) {
  const values = [
    { label: "Leistung", value: `${point.watt} W` },
    { label: "Fettenergie", value: `${Math.round(point.fatKcalPerHour)} kcal/h` },
    { label: "KH-Energie", value: `${Math.round(point.carbKcalPerHour)} kcal/h` },
    { label: "Energieanteile", value: `${Math.round(point.fatPct)} % Fett · ${Math.round(point.carbPct)} % KH` },
    { label: "Laktat-Modell", value: `${point.lactate.toFixed(1)} mmol/l` },
  ];

  return (
    <div className="mt-4 rounded-lg border border-[color-mix(in_oklab,var(--accent)_35%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_6%,var(--raised-bg))] p-3">
      <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">Werte am FatMax-Proxy</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {values.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] text-[var(--subtle)]">{item.label}</p>
            <p className="mt-1 text-sm font-medium">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function chartPoint(point: FatCurvePoint) {
  const oxidation = computeSubstrateOxidation(point);
  return {
    ...point,
    carbPct: oxidation.carbFraction * 100,
    fatPct: oxidation.fatFraction * 100,
    carbGramsPerHour: oxidation.carbGramsPerHour,
    fatGramsPerHour: oxidation.fatGramsPerHour,
    carbKcalPerHour: oxidation.carbGramsPerHour * 4,
    fatKcalPerHour: oxidation.fatGramsPerHour * 9,
  };
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block h-1.5 w-4 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
