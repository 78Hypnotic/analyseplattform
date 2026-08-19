import { isStructuredTrainingPlanContent } from "@/lib/training-plans/content";
import { getSessionMeters } from "@/lib/training-plans/metrics";
import type {
  AnyTrainingPlanContent,
  StructuredSwimStep,
  TrainingPlanContent,
  TrainingPlanContentV2,
} from "@/lib/training-plans/types";

export function TrainingPlanContentView({ content }: { content: AnyTrainingPlanContent }) {
  return isStructuredTrainingPlanContent(content)
    ? <StructuredContentView content={content} />
    : <LegacyContentView content={content} />;
}

function StructuredContentView({ content }: { content: TrainingPlanContentV2 }) {
  return (
    <section className="mt-10 space-y-5">
      {content.weeks.map((week, weekIndex) => (
        <article key={week.id} className="surface p-6">
          <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--subtle)]">Woche {weekIndex + 1}</p>
          <h2 className="mt-2 text-2xl font-semibold">{week.title}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{week.goal}</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {week.sessions.map((session, sessionIndex) => (
              <section key={session.id} className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">Einheit {sessionIndex + 1}</p>
                    <h3 className="mt-2 text-lg font-semibold">{session.title}</h3>
                    <p className="mt-1 text-sm text-[var(--accent)]">{session.focus}</p>
                  </div>
                  <p className="display-serif text-2xl">{formatMeters(getSessionMeters(session))}</p>
                </div>
                <div className="mt-4 space-y-4">
                  {session.blocks.map((block) => (
                    <div key={block.id} className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{block.title}</p>
                        {block.repeatCount > 1 ? <span className="text-xs text-[var(--subtle)]">{block.repeatCount} Runden</span> : null}
                      </div>
                      <div className="mt-2 space-y-2">
                        {block.steps.map((step) => (
                          <div key={step.id} className="text-sm">
                            <p>
                              <span className="font-medium">{step.repetitions} × {step.distanceMeters} m</span>
                              <span className="text-[var(--muted)]"> · {formatStroke(step.stroke)} · {formatIntensity(step)}</span>
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--subtle)]">
                              {step.restSeconds > 0 ? `${step.restSeconds} s Pause` : "ohne Pause"}
                              {step.equipment.length > 0 ? ` · ${step.equipment.map(formatEquipment).join(", ")}` : ""}
                            </p>
                            {step.cue ? <p className="mt-1 text-xs text-[var(--accent)]">{step.cue}</p> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function LegacyContentView({ content }: { content: TrainingPlanContent }) {
  return (
    <section className="mt-10 space-y-5">
      {content.weeks.map((week, weekIndex) => (
        <article key={`${week.title}-${weekIndex}`} className="surface p-6">
          <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--subtle)]">Woche {weekIndex + 1}</p>
          <h2 className="mt-2 text-2xl font-semibold">{week.title}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{week.goal}</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {week.sessions.map((session, sessionIndex) => (
              <section key={`${session.title}-${sessionIndex}`} className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-5">
                <p className="mono text-[9px] uppercase tracking-[0.14em] text-[var(--subtle)]">Einheit {sessionIndex + 1}</p>
                <h3 className="mt-2 text-lg font-semibold">{session.title}</h3>
                <p className="mt-1 text-sm text-[var(--accent)]">{session.focus}</p>
                <div className="mt-4 space-y-3">
                  {session.blocks.map((block, blockIndex) => (
                    <div key={`${block.title}-${blockIndex}`} className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0">
                      <p className="font-medium">{block.title}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{block.sets} · {block.intensity}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function formatIntensity(step: StructuredSwimStep) {
  if (step.intensity.type === "zone") return step.intensity.zone;
  if (step.intensity.type === "css") return `CSS ${step.intensity.offsetSecondsPer100m >= 0 ? "+" : ""}${step.intensity.offsetSecondsPer100m} s/100 m`;
  if (step.intensity.type === "rpe") return `RPE ${step.intensity.min}–${step.intensity.max}`;
  return step.intensity.label;
}

function formatStroke(value: StructuredSwimStep["stroke"]) {
  return ({ freestyle: "Kraul", backstroke: "Rücken", breaststroke: "Brust", butterfly: "Delfin", medley: "Lagen", choice: "Wahl" })[value];
}

function formatEquipment(value: StructuredSwimStep["equipment"][number]) {
  return ({ pullbuoy: "Pullbuoy", paddles: "Paddles", fins: "Flossen", snorkel: "Schnorchel", kickboard: "Brett" })[value];
}

function formatMeters(value: number) {
  return value >= 1000 ? `${(value / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} km` : `${value} m`;
}