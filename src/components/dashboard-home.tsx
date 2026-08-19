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
import type { TechniqueProfileAxis } from "@/lib/analysis/types";
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
  title: string;
  focus: string;
  weeks: number;
  discipline: "swim" | "run" | "bike";
  startDate: string;
};

export type DashboardHomeProps = {
  profile: DashboardProfile;
  analyses: DashboardAnalysis[];
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
            <div className="relative flex h-full min-h-72 flex-col">
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
              <div className="mt-auto max-w-xl pt-12">
                <p className="text-lg font-medium text-[var(--foreground)]">{activeTrainingPlan.focus}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {activeTrainingPlan.weeks} Wochen · gestartet am {formatDate(activeTrainingPlan.startDate)}
                </p>
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
                <TechniqueSpiderChart axes={swimTechniqueAxes} />
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
            <div className="flex items-end justify-between gap-4 border-t border-[var(--line)] pt-4">
              <div>
                <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">Aktuelle CSS</p>
                <p className="mt-1 text-2xl font-semibold">
                  {profile.latestSwimCssPaceSec === null ? "-" : `${formatPace(profile.latestSwimCssPaceSec)} / 100 m`}
                </p>
              </div>
              <DashboardLink href={profile.latestSwimAnalyzedAt ? "/analyse" : "/analyse/new"}>
                {profile.latestSwimAnalyzedAt ? "Schwimmen öffnen" : "Analyse starten"}
              </DashboardLink>
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
            />

            <DisciplineMetric
              href={profile.latestBikeAnalyzedAt ? "/rad" : "/rad/new"}
              icon={<Bike size={20} />}
              eyebrow="Radfahren · Leistung"
              value={profile.latestBikeFtpWatt === null ? "-" : String(profile.latestBikeFtpWatt)}
              unit="W FTP"
              date={profile.latestBikeAnalyzedAt}
              emptyText="Raddiagnostik starten"
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
}: {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  value: string;
  unit: string;
  date: string | null;
  emptyText: string;
}) {
  return (
    <section className="surface flex min-h-44 flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">{eyebrow}</p>
        <span className="text-[var(--accent)]">{icon}</span>
      </div>
      <div className="my-auto flex items-end gap-2 py-5">
        <p className="display-serif text-5xl leading-none text-[var(--foreground)]">{value}</p>
        <p className="pb-1 text-sm text-[var(--muted)]">{unit}</p>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
        <p className="text-xs text-[var(--subtle)]">{date ? `Stand ${formatDate(date)}` : "Noch keine Analyse"}</p>
        <DashboardLink href={href}>{date ? "Öffnen" : emptyText}</DashboardLink>
      </div>
    </section>
  );
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