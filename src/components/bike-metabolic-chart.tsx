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
  chart: "oxidation" | "shares";
};

/**
 * Interactive metabolic chart with two honest views of the same model:
 * absolute oxidation rates for locating FatMax and relative energy shares
 * alongside the explicitly schematic lactate trajectory.
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
  const shareSvgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  if (curve.length < 2) return null;

  const points = curve.map(chartPoint);

  const lacMax = Math.max(2, Math.ceil(Math.max(...points.map((p) => p.lactate))));
  const maxRate = Math.max(...points.flatMap((point) => [point.carbGramsPerHour, point.fatGramsPerHour]));
  const rateMax = Math.max(50, Math.ceil(maxRate / 50) * 50);

  const x = (watt: number) => PAD_L + (watt / ftp) * (VIEW_W - PAD_L - PAD_R);
  const yPct = (pct: number) => PAD_T + (1 - pct / 100) * (VIEW_H - PAD_T - PAD_B);
  const yLac = (lac: number) => PAD_T + (1 - lac / lacMax) * (VIEW_H - PAD_T - PAD_B);
  const yRate = (rate: number) => PAD_T + (1 - rate / rateMax) * (VIEW_H - PAD_T - PAD_B);

  const carbLine = points.map((p) => `${x(p.watt).toFixed(1)},${yPct(p.carbPct).toFixed(1)}`).join(" ");
  const fatLine = points.map((p) => `${x(p.watt).toFixed(1)},${yPct(p.fatPct).toFixed(1)}`).join(" ");
  const lacLine = points.map((p) => `${x(p.watt).toFixed(1)},${yLac(p.lactate).toFixed(1)}`).join(" ");
  const carbRateLine = points.map((p) => `${x(p.watt).toFixed(1)},${yRate(p.carbGramsPerHour).toFixed(1)}`).join(" ");
  const fatRateLine = points.map((p) => `${x(p.watt).toFixed(1)},${yRate(p.fatGramsPerHour).toFixed(1)}`).join(" ");

  function handleMove(
    event: React.PointerEvent<SVGSVGElement>,
    svg: SVGSVGElement | null,
    chart: HoverState["chart"],
  ) {
    const rect = svg?.getBoundingClientRect();
    if (!rect) return;
    const vbX = ((event.clientX - rect.left) / rect.width) * VIEW_W;
    const frac = (vbX - PAD_L) / (VIEW_W - PAD_L - PAD_R);
    const idx = Math.round(frac * (points.length - 1));
    setHover({ index: Math.max(0, Math.min(points.length - 1, idx)), chart });
  }

  const active = hover !== null ? points[hover.index] : null;
  const tooltipLeft = active === null ? 50 : Math.max(17, Math.min(83, (x(active.watt) / VIEW_W) * 100));
  const markerX = x(fatMaxWatt);
  const fatMaxPoint = points.reduce((nearest, point) =>
    Math.abs(point.watt - fatMaxWatt) < Math.abs(nearest.watt - fatMaxWatt) ? point : nearest,
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium">Absolute Oxidationsraten (Modell)</p>
        <p className="muted mt-1 text-xs leading-5">Der FatMax-Proxy liegt am höchsten Punkt der modellierten Fettverbrennung.</p>
        <div className="relative">
          <svg
            ref={oxidationSvgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="mt-2 w-full touch-none"
            role="img"
            aria-label="Modellierte absolute Fett- und Kohlenhydratoxidation über die Leistung"
            onPointerMove={(event) => handleMove(event, oxidationSvgRef.current, "oxidation")}
            onPointerDown={(event) => handleMove(event, oxidationSvgRef.current, "oxidation")}
            onPointerLeave={() => setHover(null)}
          >
            {[0, rateMax / 2, rateMax].map((rate) => (
              <g key={rate}>
                <line x1={PAD_L} y1={yRate(rate)} x2={VIEW_W - PAD_R} y2={yRate(rate)} stroke="var(--line)" strokeWidth={1} />
                <text x={PAD_L - 6} y={yRate(rate) + 3} textAnchor="end" fill="var(--subtle)" fontSize="10">{Math.round(rate)}</text>
              </g>
            ))}
            <line x1={markerX} y1={PAD_T} x2={markerX} y2={VIEW_H - PAD_B} stroke="var(--foreground)" strokeWidth={1} strokeDasharray="4 4" opacity={0.55} />
            <text x={markerX} y={PAD_T - 6} textAnchor="middle" fill="var(--foreground)" fontSize="10">FatMax-Proxy</text>
            <polyline points={fatRateLine} fill="none" stroke="color-mix(in oklab, var(--foreground) 48%, transparent)" strokeWidth={2.5} />
            <polyline points={carbRateLine} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
            <circle cx={markerX} cy={yRate(fatMaxPoint.fatGramsPerHour)} r={4} fill="var(--panel)" stroke="var(--foreground)" strokeWidth={2} />
            {active && hover?.chart === "oxidation" ? (
              <g>
                <line x1={x(active.watt)} y1={PAD_T} x2={x(active.watt)} y2={VIEW_H - PAD_B} stroke="var(--accent)" strokeWidth={1} />
                <circle cx={x(active.watt)} cy={yRate(active.carbGramsPerHour)} r={3.5} fill="var(--accent)" />
                <circle cx={x(active.watt)} cy={yRate(active.fatGramsPerHour)} r={3.5} fill="var(--foreground)" />
              </g>
            ) : null}
            <AxisLabels ftp={ftp} />
            <text x={PAD_L} y={PAD_T - 8} fill="var(--subtle)" fontSize="10">g/h</text>
          </svg>
          {active && hover?.chart === "oxidation" ? (
            <ChartTooltip point={active} chart="oxidation" left={tooltipLeft} />
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--muted)]">
          <LegendDot color="var(--foreground)" label="Fettoxidation (g/h)" />
          <LegendDot color="var(--accent)" label="Kohlenhydratoxidation (g/h)" />
        </div>
        <FatMaxSummary point={fatMaxPoint} />
      </div>

      <div>
        <p className="text-sm font-medium">Relative Energieanteile & schematisches Laktat</p>
        <p className="muted mt-1 text-xs leading-5">Die Prozentkurven zeigen die Zusammensetzung, nicht die absolute Verbrennungsmenge.</p>
        <div className="relative">
          <svg
            ref={shareSvgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="mt-2 w-full touch-none"
            role="img"
            aria-label="Relative Energieanteile und schematisches Laktat über die Leistung"
            onPointerMove={(event) => handleMove(event, shareSvgRef.current, "shares")}
            onPointerDown={(event) => handleMove(event, shareSvgRef.current, "shares")}
            onPointerLeave={() => setHover(null)}
          >
            {[0, 25, 50, 75, 100].map((pct) => (
              <g key={pct}>
                <line x1={PAD_L} y1={yPct(pct)} x2={VIEW_W - PAD_R} y2={yPct(pct)} stroke="var(--line)" strokeWidth={1} />
                <text x={PAD_L - 6} y={yPct(pct) + 3} textAnchor="end" fill="var(--subtle)" fontSize="10">{pct}%</text>
              </g>
            ))}
            {[0, lacMax / 2, lacMax].map((lac) => (
              <text key={lac} x={VIEW_W - PAD_R + 6} y={yLac(lac) + 3} fill="var(--subtle)" fontSize="10">{lac.toFixed(0)}</text>
            ))}
            <polyline points={fatLine} fill="none" stroke="color-mix(in oklab, var(--foreground) 48%, transparent)" strokeWidth={2} />
            <polyline points={carbLine} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
            <polyline points={lacLine} fill="none" stroke="var(--warn)" strokeWidth={2.5} strokeDasharray="2 3" />
            {active && hover?.chart === "shares" ? (
              <g>
                <line x1={x(active.watt)} y1={PAD_T} x2={x(active.watt)} y2={VIEW_H - PAD_B} stroke="var(--accent)" strokeWidth={1} />
                <circle cx={x(active.watt)} cy={yPct(active.carbPct)} r={3.5} fill="var(--accent)" />
                <circle cx={x(active.watt)} cy={yPct(active.fatPct)} r={3.5} fill="var(--foreground)" />
                <circle cx={x(active.watt)} cy={yLac(active.lactate)} r={3.5} fill="var(--warn)" />
              </g>
            ) : null}
            <AxisLabels ftp={ftp} />
            <text x={VIEW_W - 4} y={PAD_T - 8} textAnchor="end" fill="var(--warn)" fontSize="10">mmol/l (Modell)</text>
          </svg>
          {active && hover?.chart === "shares" ? (
            <ChartTooltip point={active} chart="shares" left={tooltipLeft} />
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--muted)]">
          <LegendDot color="var(--foreground)" label="Fettanteil (%)" />
          <LegendDot color="var(--accent)" label="Kohlenhydratanteil (%)" />
          <LegendDot color="var(--warn)" label="Laktat (schematisches Modell)" dashed />
        </div>
      </div>

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
  chart,
  left,
}: {
  point: ReturnType<typeof chartPoint>;
  chart: HoverState["chart"];
  left: number;
}) {
  return (
    <div
      className="pointer-events-none absolute top-3 z-10 min-w-44 -translate-x-1/2 rounded-lg border border-[var(--line)] bg-[var(--overlay-bg)] px-3 py-2 text-xs shadow-[0_8px_24px_var(--shadow-color)]"
      style={{ left: `${left}%` }}
      role="status"
    >
      <p className="font-medium">{point.watt} W</p>
      {chart === "oxidation" ? (
        <>
          <p className="mt-1">Fett {Math.round(point.fatGramsPerHour)} g/h</p>
          <p className="text-[var(--accent)]">KH {Math.round(point.carbGramsPerHour)} g/h</p>
          <p className="text-[var(--subtle)]">{Math.round(point.fatPct)} % Fett · {Math.round(point.carbPct)} % KH</p>
        </>
      ) : (
        <>
          <p className="mt-1">Fettanteil {Math.round(point.fatPct)} %</p>
          <p className="text-[var(--accent)]">KH-Anteil {Math.round(point.carbPct)} %</p>
          <p className="text-[var(--warn)]">Laktat-Modell {point.lactate.toFixed(1)} mmol/l</p>
        </>
      )}
    </div>
  );
}

function FatMaxSummary({ point }: { point: ReturnType<typeof chartPoint> }) {
  const values = [
    { label: "Leistung", value: `${point.watt} W` },
    { label: "Fettoxidation", value: `${Math.round(point.fatGramsPerHour)} g/h` },
    { label: "KH-Oxidation", value: `${Math.round(point.carbGramsPerHour)} g/h` },
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
  };
}

function LegendDot({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={dashed ? "inline-block h-0 w-4 border-t-2 border-dashed" : "inline-block h-1.5 w-4 rounded-full"}
        style={dashed ? { borderColor: color } : { backgroundColor: color }}
      />
      {label}
    </span>
  );
}
