"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type PreviewMetricData = { label: string; value: string; hint: string; active?: boolean };

type Slide = {
  eyebrow: string;
  title: ReactNode;
  metrics: PreviewMetricData[];
  box: { tag: string; heading: string; text: string };
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Schwimmdiagnostik · Lena B.",
    title: (
      <>
        Du gewinnst auf <em>Frequenz</em> und verlierst <em>Länge</em>.
      </>
    ),
    metrics: [
      { label: "Pace 400", value: "1:57", hint: "/100 m" },
      { label: "CSS", value: "1:55", hint: "Schwelle", active: true },
      { label: "DPS 400", value: "1.11", hint: "m / Zug" },
    ],
    box: {
      tag: "Hauptproblem",
      heading: "Wasserlage: die Hüfte liegt zu tief",
      text: "Beine sinken ab — jeder Zug kompensiert den Bremseffekt statt Vortrieb zu erzeugen.",
    },
  },
  {
    eyebrow: "Laufdiagnostik · Jonas K.",
    title: (
      <>
        Großer <em>Motor</em>, aktuell <em>anaerob</em> geprägt.
      </>
    ),
    metrics: [
      { label: "Critical Speed", value: "4:11", hint: "/km", active: true },
      { label: "API", value: "5.0", hint: "/ 10" },
      { label: "ACI", value: "7.0", hint: "/ 10" },
    ],
    box: {
      tag: "Trainingsbereiche",
      heading: "Pace-Zonen direkt aus deiner Critical Speed",
      text: "Z1 Rekom bis Z6 Spitze – als konkrete Pace pro Kilometer für die tägliche Steuerung.",
    },
  },
  {
    eyebrow: "Rad-Diagnostik · Jonas K.",
    title: (
      <>
        Solide <em>Schwelle</em>, ausgeprägter <em>Fettstoffwechsel</em>.
      </>
    ),
    metrics: [
      { label: "FTP", value: "294", hint: "W", active: true },
      { label: "VO₂max", value: "61", hint: "ml/kg/min" },
      { label: "FatMax", value: "194", hint: "W" },
    ],
    box: {
      tag: "Trainingsbereiche",
      heading: "Wattbereiche direkt aus deiner FTP",
      text: "Z1 bis Z7 – plus FatMax als Ankerpunkt für den Fettstoffwechsel.",
    },
  },
];

const ROTATE_MS = 4800;

export function HeroDisciplinePreview() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="surface rounded-[20px] bg-[color-mix(in_oklab,var(--panel)_92%,var(--accent)_8%)] p-7 shadow-[0_24px_60px_var(--shadow-color)]">
      {/* All slides share one grid cell so the card is always as tall as the
          tallest slide — only visibility crossfades, the layout never shifts. */}
      <div className="grid">
        {SLIDES.map((slide, slideIndex) => (
          <div
            key={slide.eyebrow}
            aria-hidden={slideIndex !== index}
            className={`transition-opacity duration-500 ${slideIndex === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
            style={{ gridArea: "1 / 1" }}
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-[var(--subtle)]">{slide.eyebrow}</p>
              <p className="mono text-[10px] uppercase tracking-[0.16em] text-[#8fe388]">· Abgeschlossen</p>
            </div>
            <h2 className="display-serif text-3xl leading-tight">{slide.title}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {slide.metrics.map((metric) => (
                <PreviewMetric key={metric.label} {...metric} />
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-[color-mix(in_oklab,var(--accent)_35%,var(--line))] bg-[color-mix(in_oklab,var(--panel)_94%,var(--accent)_6%)] p-4">
              <p className="mono mb-2 inline-flex rounded bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[var(--accent)]">
                {slide.box.tag}
              </p>
              <h3 className="font-semibold">{slide.box.heading}</h3>
              <p className="muted mt-2 text-sm leading-6">{slide.box.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {SLIDES.map((item, dotIndex) => (
          <button
            key={item.eyebrow}
            type="button"
            aria-label={`Disziplin ${dotIndex + 1} anzeigen`}
            aria-current={dotIndex === index}
            onClick={() => setIndex(dotIndex)}
            className={
              dotIndex === index
                ? "h-1.5 w-6 rounded-full bg-[var(--accent)] transition-all"
                : "h-1.5 w-1.5 rounded-full bg-[var(--line)] transition-all hover:bg-[var(--muted)]"
            }
          />
        ))}
      </div>
    </div>
  );
}

function PreviewMetric({ label, value, hint, active }: PreviewMetricData) {
  return (
    <div
      className={
        active
          ? "rounded-lg border border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] p-4"
          : "rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4"
      }
    >
      <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">{label}</p>
      <p className={active ? "display-serif mt-3 text-3xl text-[var(--accent)]" : "display-serif mt-3 text-3xl"}>
        {value}
      </p>
      <p className="mono mt-1 text-[10px] text-[var(--subtle)]">{hint}</p>
    </div>
  );
}
