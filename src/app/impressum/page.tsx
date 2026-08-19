import { AppHeader } from "@/components/app-header";
import { LegalPage } from "@/components/legal-page";
import { getLegalOperator } from "@/lib/legal";

export const metadata = {
  title: "Impressum | Trainingsanalyse",
};

export default function ImpressumPage() {
  const operator = getLegalOperator();

  return (
    <>
      <AppHeader />
      <LegalPage title="Impressum" eyebrow="Rechtliches">
        <section>
          <h2>Angaben gemäß § 5 DDG</h2>
          <p>{operator.name}</p>
          <address className="mt-2 not-italic text-[var(--muted)]">
            {operator.addressLines.length > 0
              ? operator.addressLines.map((line) => <span className="block" key={line}>{line}</span>)
              : "Ladungsfähige Anschrift wird über LEGAL_POSTAL_ADDRESS konfiguriert."}
          </address>
        </section>

        <section>
          <h2>Kontakt</h2>
          <p>
            E-Mail: <a href={`mailto:${operator.email}`}>{operator.email}</a>
            {operator.phone ? <><br />Telefon: {operator.phone}</> : null}
          </p>
        </section>

        {operator.vatId ? (
          <section>
            <h2>Umsatzsteuer-Identifikationsnummer</h2>
            <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {operator.vatId}</p>
          </section>
        ) : null}

        <section>
          <h2>Verantwortlich für den Inhalt</h2>
          <p>
            {operator.name}, Anschrift wie oben.
          </p>
        </section>
      </LegalPage>
    </>
  );
}
