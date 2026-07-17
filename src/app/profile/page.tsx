import Link from "next/link";
import { redirect } from "next/navigation";
import { AnalysisAttribution } from "@/components/analysis-attribution";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AvatarUploader } from "./avatar-uploader";
import { ProfileForm } from "./profile-form";

type ProfileData = {
  full_name?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  age?: number | null;
  gender?: "weiblich" | "maennlich" | "divers" | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  body_fat_percentage?: number | string | null;
  fitness_level?: number | null;
  vo2max?: number | string | null;
  vlamax?: number | string | null;
  ftp_rad?: number | null;
  muscle_mass_kg?: number | string | null;
  disciplines?: string[] | null;
  profile_visibility?: "private" | "public" | null;
  latest_swim_analysis_id?: string | null;
  latest_swim_analyzed_at?: string | null;
  latest_swim_technique_status?: "rot" | "gelb" | "gruen" | null;
  latest_swim_css_pace_sec?: number | string | null;
  latest_swim_vo2_proxy?: "hoch" | "mittel" | "niedrig" | "nicht_ermittelbar" | null;
  latest_swim_vla_profile?: "Diesel" | "Allrounder" | "Sprinter" | null;
  latest_run_analysis_id?: string | null;
  latest_run_analyzed_at?: string | null;
  latest_run_cs_pace_sec?: number | string | null;
  latest_run_api?: number | string | null;
  latest_run_aci?: number | string | null;
  latest_bike_analysis_id?: string | null;
  latest_bike_analyzed_at?: string | null;
  latest_bike_ftp_watt?: number | null;
  latest_bike_vo2max_rel?: number | string | null;
  latest_bike_vlamax_proxy?: number | string | null;
};

type ProfileAnalysisRow = {
  id: string;
  title: string;
  discipline: "swim" | "run" | "bike";
  user_id: string;
  created_at: string;
  created_by: string | null;
  created_by_name: string | null;
  updated_by: string | null;
  updated_by_name: string | null;
  updated_at: string;
};

export const dynamic = "force-dynamic";

/**
 * Loads the authenticated profile and renders the editable athlete data surface.
 */
export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data }, { data: recentAnalysisData, error: recentAnalysisError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("analyses")
      .select("id,title,discipline,user_id,created_at,created_by,created_by_name,updated_by,updated_by_name,updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);
  if (recentAnalysisError) throw new Error(recentAnalysisError.message);

  const profile = data as ProfileData | null;
  const recentAnalyses = (recentAnalysisData ?? []) as ProfileAnalysisRow[];
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "";
  const fullName = profile?.full_name ?? metadataName;
  const profileSummary = buildProfileSummary(profile);
  const completion = calculateProfileCompletion({
    email: user.email,
    fullName,
    avatarUrl: profile?.avatar_url,
    city: profile?.city,
    age: profile?.age,
    gender: profile?.gender,
    heightCm: profile?.height_cm,
    weightKg: profile?.weight_kg,
    bodyFatPercentage: profile?.body_fat_percentage,
    fitnessLevel: profile?.fitness_level,
    vo2max: profile?.vo2max,
    vlamax: profile?.vlamax,
    ftpRad: profile?.ftp_rad,
    muscleMassKg: profile?.muscle_mass_kg,
  });

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl space-y-8 px-5 py-10 pb-24">
        <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mono text-xs uppercase tracking-[0.2em] text-[var(--subtle)]">
              Athleten-Profil
            </p>
            <h1 className="display-serif mt-4 max-w-3xl text-5xl leading-none text-[var(--foreground)] sm:text-7xl">
              Wer du bist und was wir wissen müssen.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--muted)]">
              Je präziser dein Profil, desto besser ordnen wir Testergebnisse ein.
              Jeder ausgefüllte Block macht deine Analyse genauer.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button form="profile-form" variant="primary">
              Änderungen speichern
            </Button>
          </div>
        </section>

        <section className="surface relative overflow-hidden p-6 sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-full w-[30rem] bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--accent)_16%,transparent)_0%,color-mix(in_oklab,var(--accent)_8%,transparent)_28%,transparent_72%)]"
          />
          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="flex items-center gap-5">
              <AvatarUploader
                fullName={fullName || user.email || "Profil"}
                avatarUrl={profile?.avatar_url}
              />
              <div>
                <h2 className="display-serif text-4xl text-[var(--foreground)]">
                  {fullName || "Dein Profil"}
                </h2>
                <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--muted)]">
                  {profileSummary.length > 0 ? (
                    profileSummary.map((item) => <span key={item}>{item}</span>)
                  ) : (
                    <span>Basisdaten noch nicht vollständig</span>
                  )}
                </p>
              </div>
            </div>
            <div className="min-w-44">
              <p className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--subtle)]">
                Profil-Vollständigkeit
              </p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--raised-bg)]">
                  <div className="h-full bg-[var(--accent)]" style={{ width: `${completion}%` }} />
                </div>
                <span className="display-serif text-3xl text-[var(--accent)]">{completion}%</span>
              </div>
            </div>
          </div>
        </section>

        <LatestSwimSummary profile={profile} />
        <LatestRunSummary profile={profile} />
        <LatestBikeSummary profile={profile} />
        <RecentAnalyses analyses={recentAnalyses} />

        <ProfileForm
          email={user.email ?? ""}
          fullName={fullName}
          city={profile?.city ?? null}
          age={profile?.age ?? null}
          gender={profile?.gender ?? null}
          heightCm={profile?.height_cm ?? null}
          weightKg={profile?.weight_kg ?? null}
          bodyFatPercentage={toNullableNumber(profile?.body_fat_percentage)}
          fitnessLevel={profile?.fitness_level ?? null}
          vo2max={toNullableNumber(profile?.vo2max)}
          vlamax={toNullableNumber(profile?.vlamax)}
          ftpRad={profile?.ftp_rad ?? null}
          muscleMassKg={toNullableNumber(profile?.muscle_mass_kg)}
          disciplines={profile?.disciplines ?? []}
          profileVisibility={profile?.profile_visibility ?? "private"}
        />
      </main>
    </>
  );
}

function RecentAnalyses({ analyses }: { analyses: ProfileAnalysisRow[] }) {
  return (
    <section className="surface p-6 sm:p-7">
      <div className="mb-5">
        <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
          Testverlauf
        </p>
        <h2 className="display-serif mt-2 text-3xl text-[var(--foreground)]">
          Deine letzten Analysen
        </h2>
      </div>
      {analyses.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Noch keine Analyse gespeichert.</p>
      ) : (
        <div className="grid gap-3">
          {analyses.map((analysis) => (
            <Link
              key={analysis.id}
              href={getProfileAnalysisPath(analysis.discipline, analysis.id)}
              className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4 transition hover:border-[var(--accent)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{analysis.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {formatProfileDiscipline(analysis.discipline)} ·{" "}
                    {new Date(analysis.created_at).toLocaleDateString("de-DE")}
                  </p>
                  <AnalysisAttribution audit={analysis} className="mt-1" />
                </div>
                <span className="text-sm font-medium text-[var(--accent)]">Report öffnen</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function getProfileAnalysisPath(discipline: ProfileAnalysisRow["discipline"], id: string) {
  if (discipline === "run") return `/lauf/${id}`;
  if (discipline === "bike") return `/rad/${id}`;
  return `/analyse/${id}`;
}

function formatProfileDiscipline(discipline: ProfileAnalysisRow["discipline"]) {
  if (discipline === "run") return "Laufen";
  if (discipline === "bike") return "Rad";
  return "Schwimmen";
}

function LatestSwimSummary({ profile }: { profile: ProfileData | null }) {
  const hasSummary = Boolean(profile?.latest_swim_analyzed_at || profile?.latest_swim_technique_status);

  return (
    <section className="surface p-6 sm:p-7">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">Schwimm-Diagnostik</p>
          <h2 className="display-serif mt-2 text-3xl text-[var(--foreground)]">Letzte berechnete Werte</h2>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {hasSummary && profile?.latest_swim_analyzed_at
            ? new Date(profile.latest_swim_analyzed_at).toLocaleDateString("de-DE")
            : "Noch keine Analyse gespeichert"}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryMetric label="Technik-Gate" value={formatTechniqueStatus(profile?.latest_swim_technique_status)} />
        <SummaryMetric label="CSS" value={formatSeconds(profile?.latest_swim_css_pace_sec)} />
        <SummaryMetric label="VO2-Proxy" value={formatProxy(profile?.latest_swim_vo2_proxy)} />
        <SummaryMetric label="VLa-Profil" value={profile?.latest_swim_vla_profile ?? "-"} />
      </div>
    </section>
  );
}

function LatestRunSummary({ profile }: { profile: ProfileData | null }) {
  const hasSummary = Boolean(profile?.latest_run_analyzed_at || profile?.latest_run_cs_pace_sec);

  return (
    <section className="surface p-6 sm:p-7">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">Lauf-Diagnostik</p>
          <h2 className="display-serif mt-2 text-3xl text-[var(--foreground)]">Letzte berechnete Werte</h2>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {hasSummary && profile?.latest_run_analyzed_at
            ? new Date(profile.latest_run_analyzed_at).toLocaleDateString("de-DE")
            : "Noch keine Analyse gespeichert"}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryMetric label="Critical Speed" value={formatPacePerKm(profile?.latest_run_cs_pace_sec)} />
        <SummaryMetric label="API" value={formatIndex(profile?.latest_run_api)} />
        <SummaryMetric label="ACI" value={formatIndex(profile?.latest_run_aci)} />
      </div>
    </section>
  );
}

function LatestBikeSummary({ profile }: { profile: ProfileData | null }) {
  const hasSummary = Boolean(profile?.latest_bike_analyzed_at || profile?.latest_bike_ftp_watt);

  return (
    <section className="surface p-6 sm:p-7">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">Rad-Diagnostik</p>
          <h2 className="display-serif mt-2 text-3xl text-[var(--foreground)]">Letzte berechnete Werte</h2>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {hasSummary && profile?.latest_bike_analyzed_at
            ? new Date(profile.latest_bike_analyzed_at).toLocaleDateString("de-DE")
            : "Noch keine Analyse gespeichert"}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryMetric label="FTP" value={profile?.latest_bike_ftp_watt ? `${profile.latest_bike_ftp_watt} W` : "-"} />
        <SummaryMetric label="VO₂max" value={formatVo2(profile?.latest_bike_vo2max_rel)} />
        <SummaryMetric label="VLamax-Proxy" value={formatVlamax(profile?.latest_bike_vlamax_proxy)} />
      </div>
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--raised-bg)] p-4">
      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--subtle)]">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatSeconds(value: number | string | null | undefined) {
  const numberValue = toNullableNumber(value);
  if (numberValue === null) return "-";
  const minutes = Math.floor(numberValue / 60);
  const seconds = Math.round(numberValue - minutes * 60);
  return `${minutes}:${String(seconds).padStart(2, "0")} /100 m`;
}

function formatPacePerKm(value: number | string | null | undefined) {
  const numberValue = toNullableNumber(value);
  if (numberValue === null) return "-";
  const minutes = Math.floor(numberValue / 60);
  const seconds = Math.round(numberValue - minutes * 60);
  return `${minutes}:${String(seconds).padStart(2, "0")} /km`;
}

function formatIndex(value: number | string | null | undefined) {
  const numberValue = toNullableNumber(value);
  if (numberValue === null) return "-";
  return `${numberValue.toFixed(1)} / 10`;
}

function formatVo2(value: number | string | null | undefined) {
  const numberValue = toNullableNumber(value);
  if (numberValue === null) return "-";
  return `${numberValue.toFixed(1)} ml/kg/min`;
}

function formatVlamax(value: number | string | null | undefined) {
  const numberValue = toNullableNumber(value);
  if (numberValue === null) return "-";
  return `${numberValue.toFixed(2)} mmol/l/s`;
}

function formatTechniqueStatus(value: ProfileData["latest_swim_technique_status"]) {
  if (value === "rot") return "Rot";
  if (value === "gelb") return "Gelb";
  if (value === "gruen") return "Grün";
  return "-";
}

function formatProxy(value: ProfileData["latest_swim_vo2_proxy"]) {
  if (value === "nicht_ermittelbar") return "Nicht ermittelbar";
  return value ?? "-";
}

function calculateProfileCompletion(profile: {
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  city?: string | null;
  age?: number | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bodyFatPercentage?: number | string | null;
  fitnessLevel?: number | null;
  vo2max?: number | string | null;
  vlamax?: number | string | null;
  ftpRad?: number | null;
  muscleMassKg?: number | string | null;
}) {
  const values = [
    profile.email,
    profile.fullName,
    profile.avatarUrl,
    profile.city,
    profile.age,
    profile.gender,
    profile.heightCm,
    profile.weightKg,
    profile.bodyFatPercentage,
    profile.fitnessLevel,
    profile.vo2max,
    profile.vlamax,
    profile.ftpRad,
    profile.muscleMassKg,
  ];
  const filled = values.filter((value) => value !== null && value !== undefined && value !== "").length;
  return Math.round((filled / values.length) * 100);
}

function buildProfileSummary(profile: ProfileData | null) {
  const items = [
    profile?.city ?? null,
    profile?.age ? `${profile.age} Jahre` : null,
    profile?.height_cm ? `${profile.height_cm / 100} m` : null,
    profile?.weight_kg ? `${profile.weight_kg} kg` : null,
    profile?.fitness_level ? `Fitness ${normalizeFitnessLevel(profile.fitness_level)}/5` : null,
  ];
  return items.filter((item): item is string => Boolean(item));
}

function normalizeFitnessLevel(value: number) {
  if (value <= 5) return value;
  return Math.min(5, Math.max(1, Math.round(value / 2)));
}
