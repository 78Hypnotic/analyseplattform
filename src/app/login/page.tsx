import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/button";
import { signInWithMagicLink } from "./actions";

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
              Link gesendet an {params.email}. Bitte E-Mail pruefen und den Link
              im selben Browser oeffnen.
            </p>
          ) : (
            <form action={signInWithMagicLink} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">E-Mail</span>
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  className="w-full"
                />
              </label>
              <Button variant="primary" className="w-full">
                Link senden
              </Button>
            </form>
          )}
        </section>
      </main>
    </>
  );
}
