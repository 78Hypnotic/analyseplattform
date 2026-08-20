import {
  ArrowRight,
  Bike,
  BookOpen,
  CalendarDays,
  Footprints,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { formatPace } from "@/lib/analysis/calculations";
import type { TechniqueProfileAxis, TechniqueProfileGroup } from "@/lib/analysis/types";
import type { DashboardImprovements, DashboardMetricDelta, DashboardMetricImprovement } from "@/lib/dashboard/improvements";
import { ButtonLink } from "./button";
import { TechniqueSpiderChart } from "./technique-spider-chart";

export type DashboardAnalysis = {
  id: string;
  title: string;
  discipline: "swim" | "run" | "bike";
  createdAt: string;
};

export type DashboardProfile = {
  fullName: string | null;
  city: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  fitnessLevel: number | null;
  disciplines: string[];
  isComplete: boolean;
  latestSwimAnalyzedAt: string | null;
  latestSwimCssPaceSec: number | null;
  latestRunAnalyzedAt: string | null;
  latestRunCsPaceSec: number | null;
  latestBikeAnalyzedAt: string | null;
  latestBikeFtpWatt: number | null;
};

export type DashboardTrainingPlan = {
  id: string;
  versionId: string;
  title: string;
  focus: string;
  weeks: number;
  discipline: "swim" | "run" | "bike";
  startDate: string;
  completedSessions: number;
  totalSessions: number;
  nextSession: {
    title: string;
    focus: string;
    scheduledFor: string;
  } | null;
  targetTechniqueAxis: TechniqueProfileGroup | null;
};

export type DashboardHomeProps = {
  profile: DashboardProfile;
  analyses: DashboardAnalysis[];
  improvements: DashboardImprovements;
  swimTechniqueAxes: TechniqueProfileAxis[] | null;
  activeTrainingPlan: DashboardTrainingPlan | null;
  trainingPlanAccess: "locked" | "member" | "coach" | "admin";
  isCoach: boolean;
  isAdmin: boolean;
  coachAthleteCount?: number;
};

export function DashboardHome({
  profile,
  analyses,
  improvements,
  swimTechniqueAxes,
  activeTrainingPlan,
  trainingPlanAccess,
  isCoach,
  isAdmin,
  coachAthleteCount = 0,
}: DashboardHomeProps) {
  const firstName = profile.fullName?.trim().split(/\s+/)[0];
  const profileFacts = buildProfileFacts(profile);
  const roleCardSpan = isCoach && isAdmin
    ? "md:col-span-3 xl:col-span-6"
    : "md:col-span-6 xl:col-span-12";

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 pb-24 sm:py-10">
      <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
            Deine Übersicht
          </p>
          <h1 className="display-serif mt-3 text-5xl leading-none text-[var(--foreground)] sm:text-6xl">
            {firstName ? `Willkommen zurück, ${firstName}.` : "Willkommen zurück."}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Training, Diagnostik und Fortschritt an einem Ort.
          </p>
        </div>
        <ButtonLink href="/analyse/new" variant="primary">
          <Sparkles size={16} />
          Neue Analyse
        </ButtonLink>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12">
        {activeTrainingPlan ? (
          <section className="surface relative overflow-hidden p-6 md:col-span-6 xl:col-span-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:items-stretch">
              <div className="flex flex-col justify-between gap-8">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
                        Mein Training · {formatDiscipline(activeTrainingPlan.discipline)}
                      </p>
                      <h2 className="display-serif mt-2 text-4xl text-[var(--foreground)]">
                        {activeTrainingPlan.title}
                      </h2>
                    </div>
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--raised-bg)] text-[var(--accent)]">
                      <CalendarDays size={20} />
                    </span>
                  </div>
                  <p className="mt-4 text-base text-[var(--muted)]">{activeTrainingPlan.focus}</p>
                </div>
                <PlanProgress plan={activeTrainingPlan} />
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-5">
                <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--subtle)]">
                  {activeTrainingPlan.nextSession ? formatSessionDate(activeTrainingPlan.nextSession.scheduledFor) : "Status"}
                </p>
                {activeTrainingPlan.nextSession ? (
                  <>
                    <h3 className="mt-3 text-2xl font-semibold">{activeTrainingPlan.nextSession.title}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">{activeTrainingPlan.nextSession.focus}</p>
                    <p className="mt-5 text-xs text-[var(--subtle)]">
                      Geplant für {formatDate(activeTrainingPlan.nextSession.scheduledFor)}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="mt-3 text-2xl font-semibold">
                      {activeTrainingPlan.totalSessions > 0
                        && activeTrainingPlan.completedSessions === activeTrainingPlan.totalSessions
                        ? "Plan abgeschlossen"
                        : "Keine offene Einheit terminiert"}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {activeTrainingPlan.completedSessions} von {activeTrainingPlan.totalSessions} Einheiten erledigt.
                    </p>
                  </>
                )}
                <Link
                  href={`/trainingsplaene/${activeTrainingPlan.versionId}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]"
                >
                  Trainingsplan öffnen <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <NoActiveTrainingPlan access={trainingPlanAccess} />
        )}

        <div className="grid gap-4 md:col-span-6 md:grid-cols-2 xl:col-span-12 xl:grid-cols-12">
          <section className="surface p-6 md:col-span-2 xl:col-span-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
                  Schwimmen · Technikprofil
                </p>
                <h2 className="mt-2 text-xl font-semibold">Deine Technik im Überblick</h2>
              </div>
              <Waves size={20} className="shrink-0 text-[var(--accent)]" />
            </div>
            {swimTechniqueAxes && swimTechniqueAxes.length >= 3 ? (
              <div className="mt-2 flex justify-center">
                <TechniqueSpiderChart
                  axes={swimTechniqueAxes}
                  focusGroup={activeTrainingPlan?.discipline === "swim"
                    ? activeTrainingPlan.targetTechniqueAxis
                    : null}
                />
              </div>
            ) : (
              <div className="flex min-h-64 items-center justify-center py-8 text-center">
                <div>
                  <p className="font-medium">Noch kein Technikprofil vorhanden</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
                    Die Schwimmdiagnostik bewertet Wasserlage, Atmung, Zug und weitere Technikfelder.
                  </p>
                </div>
              </div>
            )}
            <div className="border-t border-[var(--line)] pt-4">
              <div>
                <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">Aktuelle CSS</p>
                <p className="mt-1 text-2xl font-semibold">
                  {profile.latestSwimCssPaceSec === null ? "-" : `${formatPace(profile.latestSwimCssPaceSec)} / 100 m`}
                </p>
                <MetricImprovementSummary improvement={improvements.swimCss} metricKind="pace" />
              </div>
              <MetricFooter
                date={profile.latestSwimAnalyzedAt}
                href={profile.latestSwimAnalyzedAt ? "/analyse" : "/analyse/new"}
                emptyText="Analyse starten"
                filledText="Schwimmen öffnen"
              />
            </div>
          </section>

          <div className="grid gap-4 md:col-span-2 md:grid-cols-2 xl:col-span-5 xl:grid-cols-1 xl:grid-rows-2">
            <DisciplineMetric
              href={profile.latestRunAnalyzedAt ? "/lauf" : "/lauf/new"}
              icon={<Footprints size={20} />}
              eyebrow="Laufen · Schwellenpace"
              value={profile.latestRunCsPaceSec === null ? "-" : formatPace(profile.latestRunCsPaceSec)}
              unit="min/km"
              date={profile.latestRunAnalyzedAt}
              emptyText="Laufdiagnostik starten"
              improvement={improvements.runCs}
              metricKind="pace"
            />

            <DisciplineMetric
              href={profile.latestBikeAnalyzedAt ? "/rad" : "/rad/new"}
              icon={<Bike size={20} />}
              eyebrow="Radfahren · Leistung"
              value={profile.latestBikeFtpWatt === null ? "-" : String(profile.latestBikeFtpWatt)}
              unit="W FTP"
              date={profile.latestBikeAnalyzedAt}
              emptyText="Raddiagnostik starten"
              improvement={improvements.bikeFtp}
              metricKind="power"
            />
          </div>
        </div>

        <section className="surface p-6 md:col-span-6 xl:col-span-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
                Profil
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                {profile.fullName ?? "Dein Athletenprofil"}
              </h2>
              {profile.city ? <p className="mt-1 text-sm text-[var(--muted)]">{profile.city}</p> : null}
            </div>
            <Settings2 size={19} className="text-[var(--accent)]" />
          </div>
          {profileFacts.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {profileFacts.map((fact) => (
                <div key={fact.label} className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-3">
                  <p className="mono text-[9px] uppercase tracking-[0.12em] text-[var(--subtle)]">{fact.label}</p>
                  <p className="mt-1 text-sm font-medium">{fact.value}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-5 flex flex-col justify-between gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium">
                {profile.disciplines.length > 0 ? profile.disciplines.join(" · ") : "Noch keine Disziplin gewählt"}
              </p>
              {!profile.isComplete ? (
                <p className="mt-1 text-xs text-[var(--subtle)]">Basisdaten für präzisere Analysen vervollständigen</p>
              ) : null}
            </div>
            <DashboardLink href="/profile">Profil bearbeiten</DashboardLink>
          </div>
        </section>

        <section className="surface p-6 md:col-span-6 xl:col-span-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
                Verlauf
              </p>
              <h2 className="mt-2 text-xl font-semibold">Letzte Analysen</h2>
            </div>
          </div>
          {analyses.length === 0 ? (
            <p className="text-sm leading-6 text-[var(--muted)]">
              Noch keine Analyse gespeichert. Starte mit deiner aktuellen Disziplin.
            </p>
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {analyses.slice(0, 4).map((analysis) => (
                <Link
                  key={analysis.id}
                  href={getAnalysisPath(analysis)}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{analysis.title}</p>
                    <p className="mt-1 text-xs text-[var(--subtle)]">
                      {formatDiscipline(analysis.discipline)} · {formatDate(analysis.createdAt)}
                    </p>
                  </div>
                  <ArrowRight size={16} className="shrink-0 text-[var(--accent)]" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {isCoach ? (
          <RoleCard
            href="/coach"
            icon={<UsersRound size={20} />}
            eyebrow="Coach"
            title={`${coachAthleteCount} ${coachAthleteCount === 1 ? "Athlet" : "Athleten"}`}
            text="Profile, Diagnostiken und Reports deiner Zuordnungen öffnen."
            spanClass={roleCardSpan}
          />
        ) : null}

        {isAdmin ? (
          <RoleCard
            href="/admin"
            icon={<ShieldCheck size={20} />}
            eyebrow="Admin"
            title="Steuerzentrale"
            text="Nutzer, Rollen und Trainingspläne verwalten."
            spanClass={roleCardSpan}
          />
        ) : null}
      </div>
    </main>
  );
}

function DisciplineMetric({
  href,
  icon,
  eyebrow,
  value,
  unit,
  date,
  emptyText,
  improvement,
  metricKind,
}: {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  value: string;
  unit: string;
  date: string | null;
  emptyText: string;
  improvement: DashboardMetricImprovement | null;
  metricKind: "pace" | "power";
}) {
  return (
    <section className="surface flex min-h-72 flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">{eyebrow}</p>
        <span className="text-[var(--accent)]">{icon}</span>
      </div>
      <div className="flex items-end gap-2 pt-7">
        <p className="display-serif text-5xl leading-none text-[var(--foreground)]">{value}</p>
        <p className="pb-1 text-sm text-[var(--muted)]">{unit}</p>
      </div>
      <MetricImprovementSummary improvement={improvement} metricKind={metricKind} />
      <MetricFooter date={date} href={href} emptyText={emptyText} filledText="Öffnen" />
    </section>
  );
}

function MetricFooter({
  date,
  href,
  emptyText,
  filledText,
}: {
  date: string | null;
  href: string;
  emptyText: string;
  filledText: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
      <p className="text-xs text-[var(--subtle)]">{date ? `Stand ${formatDate(date)}` : "Noch keine Analyse"}</p>
      <DashboardLink href={href}>{date ? filledText : emptyText}</DashboardLink>
    </div>
  );
}

function MetricImprovementSummary({
  improvement,
  metricKind,
}: {
  improvement: DashboardMetricImprovement | null;
  metricKind: "pace" | "power";
}) {
  if (!improvement) {
    return <p className="mt-5 text-xs text-[var(--subtle)]">Fortschritt ab 2 Tests sichtbar.</p>;
  }

  return (
    <div className="mt-5 grid gap-x-8 gap-y-3 text-xs sm:grid-cols-2">
      <ImprovementLine label="Zum letzten Test" delta={improvement.latestVsPrevious} metricKind={metricKind} />
      <ImprovementLine label="Seit erstem Test" delta={improvement.latestVsFirst} metricKind={metricKind} />
    </div>
  );
}

function ImprovementLine({
  label,
  delta,
  metricKind,
}: {
  label: string;
  delta: DashboardMetricDelta;
  metricKind: "pace" | "power";
}) {
  return (
    <div>
      <span className="mono block text-[9px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</span>
      <span className={delta.direction === "declined" ? "mt-1 block font-medium text-[var(--warn)]" : delta.direction === "improved" ? "mt-1 block font-medium text-[var(--accent)]" : "mt-1 block font-medium text-[var(--muted)]"}>
        {formatImprovementDelta(delta, metricKind)}
      </span>
    </div>
  );
}

function formatImprovementDelta(delta: DashboardMetricDelta, metricKind: "pace" | "power") {
  if (delta.direction === "unchanged") return "unverändert";
  const amount = Math.abs(delta.improvementValue);
  const percent = Math.abs(delta.percentDelta).toLocaleString("de-DE", { maximumFractionDigits: 1 });

  if (metricKind === "pace") {
    const seconds = amount.toLocaleString("de-DE", { maximumFractionDigits: 1 });
    return delta.direction === "improved"
      ? `${seconds} s schneller (${percent} %)`
      : `${seconds} s langsamer (${percent} %)`;
  }

  const watts = Math.round(amount).toLocaleString("de-DE");
  return delta.direction === "improved"
    ? `${watts} W mehr (${percent} %)`
    : `${watts} W weniger (${percent} %)`;
}

function DashboardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--accent)]"
    >
      {children}
      <ArrowRight size={14} />
    </Link>
  );
}

function buildProfileFacts(profile: DashboardProfile) {
  return [
    profile.age ? { label: "Alter", value: `${profile.age} Jahre` } : null,
    profile.heightCm ? { label: "Größe", value: `${formatHeight(profile.heightCm)} m` } : null,
    profile.weightKg ? { label: "Gewicht", value: `${formatNumber(profile.weightKg)} kg` } : null,
    profile.fitnessLevel ? { label: "Fitness", value: `${normalizeFitnessLevel(profile.fitnessLevel)} / 5` } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);
}

function formatHeight(value: number) {
  return (value / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(value: number) {
  return value.toLocaleString("de-DE", { maximumFractionDigits: 1 });
}

function normalizeFitnessLevel(value: number) {
  if (value <= 5) return value;
  return Math.min(5, Math.max(1, Math.round(value / 2)));
}

function RoleCard({
  href,
  icon,
  eyebrow,
  title,
  text,
  spanClass,
}: {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  text: string;
  spanClass: string;
}) {
  return (
    <Link href={href} className={`surface p-6 transition hover:border-[var(--accent)] ${spanClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold">{title}</h2>
        </div>
        <span className="text-[var(--accent)]">{icon}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{text}</p>
    </Link>
  );
}

function getAnalysisPath(analysis: DashboardAnalysis) {
  if (analysis.discipline === "run") return `/lauf/${analysis.id}`;
  if (analysis.discipline === "bike") return `/rad/${analysis.id}`;
  return `/analyse/${analysis.id}`;
}

function formatDiscipline(discipline: DashboardAnalysis["discipline"]) {
  if (discipline === "run") return "Laufen";
  if (discipline === "bike") return "Radfahren";
  return "Schwimmen";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("de-DE");
}

function NoActiveTrainingPlan({
  access,
}: {
  access: DashboardHomeProps["trainingPlanAccess"];
}) {
  const copy = access === "member"
    ? {
        title: "Noch kein Trainingsplan aktiv",
        text: "Deine Gruppencoaching-Bibliothek ist freigeschaltet. Wähle dort deinen nächsten Schwimmplan aus.",
        action: "Trainingsplan auswählen",
      }
    : access === "coach"
      ? {
          title: "Noch kein eigener Trainingsplan aktiv",
          text: "Öffne deine Coach-Bibliothek oder verwalte neue Planvorlagen.",
          action: "Bibliothek öffnen",
        }
      : access === "admin"
        ? {
            title: "Noch kein eigener Trainingsplan aktiv",
            text: "Öffne die Coach-Bibliotheken oder verwalte Planvorlagen.",
            action: "Bibliotheken öffnen",
          }
        : {
            title: "Noch kein Trainingsplan aktiv",
            text: "Trainingspläne sind Bestandteil des Gruppencoachings. Dort erhältst du Zugriff auf die Bibliothek deines Coaches.",
            action: "Zugang ansehen",
          };

  return (
    <Link
      href="/trainingsplaene"
      className="surface group flex flex-col justify-between gap-8 p-6 transition hover:border-[var(--accent)] md:col-span-6 md:flex-row md:items-center xl:col-span-12"
    >
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--raised-bg)] text-[var(--accent)]">
          <BookOpen size={20} />
        </span>
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">Mein Training</p>
          <h2 className="mt-2 text-xl font-semibold">{copy.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{copy.text}</p>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[var(--accent)]">
        {copy.action} <ArrowRight size={16} className="transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function PlanProgress({ plan }: { plan: DashboardTrainingPlan }) {
  const progress = plan.totalSessions > 0
    ? Math.round((plan.completedSessions / plan.totalSessions) * 100)
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-[var(--muted)]">
          {plan.completedSessions} / {plan.totalSessions} Einheiten absolviert
        </span>
        <span className="font-medium text-[var(--foreground)]">{progress}%</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--raised-bg)]"
        role="progressbar"
        aria-label="Trainingsplan-Fortschritt"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div className="h-full bg-[var(--accent)]" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-xs text-[var(--subtle)]">
        {plan.weeks} Wochen · gestartet am {formatDate(plan.startDate)}
      </p>
    </div>
  );
}

function formatSessionDate(value: string) {
  const today = new Date();
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const sessionDate = new Date(`${value}T00:00:00`);
  const difference = Math.round((sessionDate.getTime() - currentDate.getTime()) / 86_400_000);
  if (difference < 0) return "Überfällig";
  if (difference === 0) return "Heute";
  if (difference === 1) return "Morgen";
  return formatDate(value);
}