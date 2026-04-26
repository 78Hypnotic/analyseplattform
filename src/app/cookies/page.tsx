import { AppHeader } from "@/components/app-header";
import { LegalPage } from "@/components/legal-page";

export const metadata = {
  title: "Cookies | Trainingsanalyse",
};

export default function CookiesPage() {
  return (
    <>
      <AppHeader />
      <LegalPage title="Cookie- und Tracking-Entscheidung" eyebrow="Rechtliches">
        <section>
          <h2>Aktueller Stand</h2>
          <p>
            Die Plattform nutzt aktuell keine Analytics-, Marketing- oder
            Tracking-Cookies. Es gibt daher keinen Cookie-Banner.
          </p>
        </section>

        <section>
          <h2>Technisch notwendige Cookies</h2>
          <p>
            Supabase setzt Session-Cookies beziehungsweise vergleichbare
            Auth-Speichermechanismen, damit eingeloggte Nutzer angemeldet bleiben
            und geschützte Seiten wie Analysen und Profile nutzen können.
          </p>
        </section>

        <section>
          <h2>Entscheidung</h2>
          <p>
            Solange nur technisch notwendige Auth-Cookies genutzt werden, bleibt
            die Seite ohne Consent-Banner. Wenn später Analytics, Retargeting,
            A/B-Testing oder externe Tracking-Skripte ergänzt werden, muss vorab
            ein Consent-Management eingebaut und die Datenschutzerklärung
            aktualisiert werden.
          </p>
        </section>
      </LegalPage>
    </>
  );
}
