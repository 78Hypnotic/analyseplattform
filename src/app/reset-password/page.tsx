import { AppHeader } from "@/components/app-header";
import { ResetPasswordForm } from "./reset-password-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
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
            Passwort
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Passwort zurücksetzen</h1>
          {sent ? (
            <p className="muted mt-4 leading-7">
              Reset-Link gesendet an {params.email}. Öffne den Link im selben Browser und vergib danach ein neues Passwort.
            </p>
          ) : (
            <>
              <p className="muted mt-4 leading-7">
                Du bekommst einen sicheren Link, mit dem du dein Passwort neu setzen kannst.
              </p>
              <ResetPasswordForm />
            </>
          )}
        </section>
      </main>
    </>
  );
}
