import type { TechniqueProfileAxis } from "@/lib/analysis/types";

const WIDTH = 420;
const HEIGHT = 300;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const RADIUS = 100;
const RINGS = [0.25, 0.5, 0.75, 1];

export function TechniqueSpiderChart({ axes }: { axes: TechniqueProfileAxis[] }) {
  if (axes.length < 3) return null;

  const angleFor = (index: number) => (Math.PI * 2 * index) / axes.length - Math.PI / 2;
  const pointFor = (index: number, ratio: number) => {
    const angle = angleFor(index);
    const distance = RADIUS * Math.max(0, Math.min(1, ratio));
    return [CENTER_X + Math.cos(angle) * distance, CENTER_Y + Math.sin(angle) * distance] as const;
  };
  const labelFor = (index: number) => {
    const angle = angleFor(index);
    return [CENTER_X + Math.cos(angle) * (RADIUS + 26), CENTER_Y + Math.sin(angle) * (RADIUS + 18)] as const;
  };
  const polygon = axes
    .map((axis, index) => pointFor(index, axis.score / 100).map((value) => value.toFixed(1)).join(","))
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full max-w-[420px]"
      role="img"
      aria-label={`Technikprofil: ${axes.map((axis) => `${axis.group} ${Math.round(axis.score)} von 100`).join(", ")}`}
    >
      {RINGS.map((ring) => (
        <polygon
          key={ring}
          points={axes.map((_, index) => pointFor(index, ring).join(",")).join(" ")}
          fill="none"
          stroke="var(--line)"
          strokeWidth={1}
        />
      ))}
      {axes.map((axis, index) => {
        const [x, y] = pointFor(index, 1);
        return <line key={axis.group} x1={CENTER_X} y1={CENTER_Y} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} />;
      })}
      <polygon
        points={polygon}
        fill="var(--accent)"
        fillOpacity={0.18}
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {axes.map((axis, index) => {
        const [x, y] = pointFor(index, axis.score / 100);
        return <circle key={axis.group} cx={x} cy={y} r={3.5} fill="var(--accent)" />;
      })}
      {axes.map((axis, index) => {
        const [x, y] = labelFor(index);
        const anchor = x > CENTER_X + 4 ? "start" : x < CENTER_X - 4 ? "end" : "middle";
        return (
          <text
            key={axis.group}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fill="var(--muted)"
            fontSize={11}
          >
            {axis.group}
          </text>
        );
      })}
    </svg>
  );
}
