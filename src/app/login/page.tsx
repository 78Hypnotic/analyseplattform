import { AppHeader } from "@/components/app-header";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; email?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center px-5 py-12">
        <section className="surface w-full p-6">
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            Login
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Magic Link anfordern</h1>
          {sent ? (
            <p className="muted mt-4 leading-7">
              Link gesendet an {params.email}. Bitte E-Mail prüfen und den Link
              im selben Browser öffnen.
            </p>
          ) : (
            <LoginForm />
          )}
        </section>
      </main>
    </>
  );
}
