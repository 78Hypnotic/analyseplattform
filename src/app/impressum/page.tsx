import { AppHeader } from "@/components/app-header";
import { LegalPage } from "@/components/legal-page";

export const metadata = {
  title: "Impressum | Trainingsanalyse",
};

export default function ImpressumPage() {
  return (
    <>
      <AppHeader />
      <LegalPage title="Impressum" eyebrow="Rechtliches">
        <section>
          <h2>Angaben gemäß § 5 TMG</h2>
          <p>
            Bitte Betreiberangaben ergänzen: Name/Firma, Rechtsform, Anschrift,
            Vertretungsberechtigte Person.
          </p>
        </section>

        <section>
          <h2>Kontakt</h2>
          <p>
            E-Mail: manuel.hohlwegler@gmx.de
            <br />
            Telefon: bitte ergänzen, falls erforderlich.
          </p>
        </section>

        <section>
          <h2>Umsatzsteuer-ID</h2>
          <p>Bitte ergänzen, falls vorhanden.</p>
        </section>

        <section>
          <h2>Verantwortlich für den Inhalt</h2>
          <p>Bitte Name und Anschrift ergänzen.</p>
        </section>

        <section>
          <h2>Hinweis</h2>
          <p>
            Diese Seite ist als Platzhalter angelegt und muss vor produktiver
            Veröffentlichung rechtlich geprüft und mit vollständigen
            Betreiberangaben ergänzt werden.
          </p>
        </section>
      </LegalPage>
    </>
  );
}
