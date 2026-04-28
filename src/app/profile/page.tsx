import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AvatarUploader } from "./avatar-uploader";
import { ProfileForm } from "./profile-form";

type ProfileData = {
  full_name?: string | null;
  avatar_url?: string | null;
  age?: number | null;
  gender?: "weiblich" | "maennlich" | "divers" | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  body_fat_percentage?: number | string | null;
  fitness_level?: number | null;
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as ProfileData | null;
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "";
  const fullName = profile?.full_name ?? metadataName;
  const profileSummary = buildProfileSummary(profile);
  const exportHref = buildProfileExportHref({
    email: user.email ?? "",
    fullName,
    age: profile?.age ?? null,
    gender: profile?.gender ?? null,
    heightCm: profile?.height_cm ?? null,
    weightKg: profile?.weight_kg ?? null,
    bodyFatPercentage: toNullableNumber(profile?.body_fat_percentage),
    fitnessLevel: profile?.fitness_level ?? null,
  });
  const completion = calculateProfileCompletion({
    email: user.email,
    fullName,
    avatarUrl: profile?.avatar_url,
    age: profile?.age,
    gender: profile?.gender,
    heightCm: profile?.height_cm,
    weightKg: profile?.weight_kg,
    bodyFatPercentage: profile?.body_fat_percentage,
    fitnessLevel: profile?.fitness_level,
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
            <a
              href={exportHref}
              download="athleten-profil.json"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
            >
              Daten exportieren
            </a>
            <Button form="profile-form" variant="primary">
              Änderungen speichern
            </Button>
          </div>
        </section>

        <section className="surface overflow-hidden bg-[linear-gradient(110deg,var(--panel)_0%,var(--panel)_55%,color-mix(in_oklab,var(--accent)_10%,var(--panel))_100%)] p-6 sm:p-7">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="flex items-center gap-5">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color-mix(in_oklab,var(--accent)_35%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_12%,var(--panel))] text-2xl font-semibold sm:size-24">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="Profilbild" className="size-full object-cover" />
                ) : (
                  <span>{buildInitials(fullName || user.email || "Profil")}</span>
                )}
              </div>
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

        <nav className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--panel)] p-1 text-sm">
          <span className="rounded-lg bg-[var(--brand-bg)] px-4 py-2 text-[var(--brand-fg)]">Stammdaten</span>
          <span className="px-4 py-2 text-[var(--muted)]">Training</span>
          <span className="px-4 py-2 text-[var(--muted)]">Privatsphäre</span>
        </nav>

        <ProfileForm
          email={user.email ?? ""}
          fullName={fullName}
          age={profile?.age ?? null}
          gender={profile?.gender ?? null}
          heightCm={profile?.height_cm ?? null}
          weightKg={profile?.weight_kg ?? null}
          bodyFatPercentage={toNullableNumber(profile?.body_fat_percentage)}
          fitnessLevel={profile?.fitness_level ?? null}
        />
        <AvatarUploader
          fullName={fullName || user.email || "Profil"}
          avatarUrl={profile?.avatar_url}
        />
      </main>
    </>
  );
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function calculateProfileCompletion(profile: {
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  age?: number | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bodyFatPercentage?: number | string | null;
  fitnessLevel?: number | null;
}) {
  const values = [
    profile.email,
    profile.fullName,
    profile.avatarUrl,
    profile.age,
    profile.gender,
    profile.heightCm,
    profile.weightKg,
    profile.bodyFatPercentage,
    profile.fitnessLevel,
  ];
  const filled = values.filter((value) => value !== null && value !== undefined && value !== "").length;
  return Math.round((filled / values.length) * 100);
}

function buildProfileSummary(profile: ProfileData | null) {
  const items = [
    profile?.age ? `${profile.age} Jahre` : null,
    profile?.height_cm ? `${profile.height_cm / 100} m` : null,
    profile?.weight_kg ? `${profile.weight_kg} kg` : null,
    profile?.fitness_level ? `Fitness ${profile.fitness_level}/10` : null,
  ];
  return items.filter((item): item is string => Boolean(item));
}

function buildInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${second}`.toUpperCase();
}

function buildProfileExportHref(profile: {
  email: string;
  fullName: string;
  age: number | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  fitnessLevel: number | null;
}) {
  const payload = {
    exportedAt: new Date().toISOString(),
    profile,
  };
  return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
}
