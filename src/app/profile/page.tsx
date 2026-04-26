import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AvatarUploader } from "./avatar-uploader";
import { ProfileForm } from "./profile-form";

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

  const profile = data as { full_name?: string | null; avatar_url?: string | null } | null;
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "";
  const fullName = profile?.full_name ?? metadataName;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <p className="mono inline-flex rounded-full border border-[var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          Profil
        </p>
        <h1 className="display-serif mt-4 text-5xl leading-tight text-white">
          Deine Daten.
        </h1>
        <p className="muted mt-4 max-w-2xl leading-7">
          Speichere hier die Basisdaten, die oben im Profil und später in deinen
          Reports verwendet werden.
        </p>
        <AvatarUploader
          userId={user.id}
          fullName={fullName || user.email || "Profil"}
          avatarUrl={profile?.avatar_url}
        />
        <ProfileForm
          email={user.email ?? ""}
          fullName={fullName}
        />
      </main>
    </>
  );
}
