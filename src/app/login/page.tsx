import { AppHeader } from "@/components/app-header";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center px-5 py-12">
        <section className="surface w-full p-6">
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            Login
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Einloggen</h1>
          <p className="muted mt-4 leading-7">
            Melde dich mit E-Mail und Passwort an oder erstelle direkt einen
            Account.
          </p>
          <LoginForm />
        </section>
      </main>
    </>
  );
}
