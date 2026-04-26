import { AppHeader } from "@/components/app-header";
import { LegalPage } from "@/components/legal-page";

export const metadata = {
  title: "Datenschutz | Trainingsanalyse",
};

export default function DatenschutzPage() {
  return (
    <>
      <AppHeader />
      <LegalPage title="Datenschutzerklärung" eyebrow="Rechtliches">
        <section>
          <h2>Verantwortlicher</h2>
          <p>
            Bitte Verantwortlichen ergänzen: Name/Firma, Anschrift,
            Kontakt-E-Mail und gegebenenfalls Datenschutzkontakt.
          </p>
        </section>

        <section>
          <h2>Verarbeitete Daten</h2>
          <p>
            Die Plattform verarbeitet Accountdaten wie E-Mail-Adresse und Name,
            Profildaten sowie Trainings- und Analyseangaben, die Nutzer selbst
            eingeben. Dazu gehören unter anderem Testzeiten, Zugzahlen,
            Körperdaten und gewählte Trainingsziele.
          </p>
        </section>

        <section>
          <h2>Zwecke der Verarbeitung</h2>
          <p>
            Die Daten werden zur Anmeldung, Speicherung und Anzeige von
            Trainingsanalysen, zur Berechnung von Kennzahlen und zur Verwaltung
            des Nutzerprofils verarbeitet.
          </p>
        </section>

        <section>
          <h2>Hosting und Dienstleister</h2>
          <p>
            Die Anwendung wird über Vercel bereitgestellt. Authentifizierung und
            Datenbank laufen über Supabase. Beide Anbieter können technische
            Zugriffsdaten verarbeiten, die für Betrieb, Sicherheit und
            Auslieferung der Anwendung notwendig sind.
          </p>
        </section>

        <section>
          <h2>Cookies</h2>
          <p>
            Es werden derzeit nur technisch notwendige Cookies beziehungsweise
            vergleichbare Speichermechanismen für Login-Sessions verwendet. Es
            ist aktuell kein Tracking, keine Werbung und kein Analytics-Dienst
            eingebunden.
          </p>
        </section>

        <section>
          <h2>Speicherdauer und Rechte</h2>
          <p>
            Daten werden gespeichert, solange der Account besteht oder gesetzliche
            Pflichten eine Speicherung erfordern. Nutzer können Auskunft,
            Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und
            Widerspruch verlangen.
          </p>
        </section>

        <section>
          <h2>Hinweis</h2>
          <p>
            Diese Datenschutzerklärung ist ein technischer Entwurf. Vor
            produktiver Nutzung müssen Anbieterangaben, Rechtsgrundlagen,
            Auftragsverarbeitungsverträge und konkrete Speicherfristen rechtlich
            geprüft und ergänzt werden.
          </p>
        </section>
      </LegalPage>
    </>
  );
}
