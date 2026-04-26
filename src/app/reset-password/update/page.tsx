import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UpdatePasswordForm } from "./update-password-form";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/reset-password");

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center px-5 py-12">
        <section className="surface w-full p-6">
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            Passwort
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Neues Passwort setzen</h1>
          <p className="muted mt-4 leading-7">
            Wähle ein neues Passwort mit mindestens acht Zeichen.
          </p>
          <UpdatePasswordForm />
        </section>
      </main>
    </>
  );
}
