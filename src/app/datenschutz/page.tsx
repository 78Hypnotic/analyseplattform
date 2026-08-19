import { AppHeader } from "@/components/app-header";
import { LegalPage } from "@/components/legal-page";
import { getLegalOperator } from "@/lib/legal";

export const metadata = {
  title: "Datenschutz | Trainingsanalyse",
};

export default function DatenschutzPage() {
  const operator = getLegalOperator();

  return (
    <>
      <AppHeader />
      <LegalPage title="Datenschutzerklärung" eyebrow="Rechtliches">
        <section>
          <h2>1. Verantwortlicher</h2>
          <p>
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO)
            ist {operator.name}, Anschrift wie im Impressum. Kontakt: {" "}
            <a href={`mailto:${operator.email}`}>{operator.email}</a>.
          </p>
        </section>

        <section>
          <h2>2. Verarbeitete Daten</h2>
          <p>
            Wir verarbeiten Accountdaten wie Name, E-Mail-Adresse und
            Authentifizierungsdaten, freiwillige Profildaten, Profilbilder,
            Trainer-Athleten-Zuordnungen sowie Trainings- und Analyseangaben.
            Dazu gehören insbesondere Alter, Geschlecht, Größe, Gewicht,
            Körperfett, Fitnesswerte, Testleistungen, Trainingsziele und die
            daraus berechneten Ergebnisse. Zusätzlich verarbeiten unsere
            Systeme technisch erforderliche Verbindungs-, Protokoll- und
            Sicherheitsdaten.
          </p>
        </section>

        <section>
          <h2>3. Zwecke und Rechtsgrundlagen</h2>
          <p>
            Die Verarbeitung dient der Registrierung und Anmeldung, der
            Verwaltung von Profilen und Trainer-Zuordnungen, der Berechnung,
            Speicherung und Darstellung von Trainingsanalysen sowie dem sicheren
            Betrieb der Plattform. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b
            DSGVO, soweit die Verarbeitung zur Bereitstellung der angeforderten
            Plattformfunktionen erforderlich ist. Sicherheitsmaßnahmen und die
            Abwehr von Missbrauch beruhen auf Art. 6 Abs. 1 Buchst. f DSGVO.
            Gesetzlich vorgeschriebene Verarbeitungen beruhen auf Art. 6 Abs. 1
            Buchst. c DSGVO.
          </p>
          <p className="mt-3">
            Körper- und Leistungsangaben können je nach Inhalt Gesundheitsdaten
            im Sinne von Art. 9 DSGVO darstellen. Soweit Art. 9 DSGVO anwendbar
            ist, erfolgt ihre Verarbeitung nur auf Grundlage einer zusätzlich
            einschlägigen Ausnahme, insbesondere einer ausdrücklichen
            Einwilligung nach Art. 9 Abs. 2 Buchst. a DSGVO. Eine erteilte
            Einwilligung kann jederzeit mit Wirkung für die Zukunft widerrufen
            werden; die Rechtmäßigkeit der vorherigen Verarbeitung bleibt
            unberührt.
          </p>
        </section>

        <section>
          <h2>4. Hosting und Auftragsverarbeiter</h2>
          <p>
            Die Anwendung wird über Vercel bereitgestellt. Authentifizierung,
            Datenbank und Dateispeicher werden über Supabase betrieben. Diese
            Anbieter verarbeiten Daten in unserem Auftrag, soweit dies für
            Hosting, Auslieferung, Authentifizierung, Speicherung und Sicherheit
            erforderlich ist. Mit den eingesetzten Auftragsverarbeitern werden
            die nach Art. 28 DSGVO erforderlichen Vereinbarungen geschlossen.
            Weitere Empfänger erhalten Daten nur, wenn dies für die Leistung
            erforderlich, gesetzlich vorgeschrieben oder von einer Einwilligung
            gedeckt ist.
          </p>
        </section>

        <section>
          <h2>5. Übermittlungen in Drittländer</h2>
          <p>
            Bei eingesetzten Dienstleistern kann eine Verarbeitung außerhalb der
            Europäischen Union oder des Europäischen Wirtschaftsraums nicht
            vollständig ausgeschlossen werden. Eine solche Übermittlung erfolgt
            nur unter den Voraussetzungen der Art. 44 ff. DSGVO, etwa auf Basis
            eines Angemessenheitsbeschlusses oder geeigneter Garantien wie den
            Standardvertragsklauseln der Europäischen Kommission.
          </p>
        </section>

        <section>
          <h2>6. Cookies und lokale Speicherung</h2>
          <p>
            Die Plattform verwendet technisch notwendige Cookies beziehungsweise
            vergleichbare Speichermechanismen für Anmeldung, Sitzungsverwaltung
            und die lokale Darstellungseinstellung. Diese Verarbeitung ist für
            die angeforderten Funktionen erforderlich. Es werden derzeit keine
            Analytics-, Marketing- oder Werbedienste eingesetzt.
          </p>
        </section>

        <section>
          <h2>7. Speicherdauer und Löschung</h2>
          <p>
            Account- und Profildaten werden grundsätzlich für die Dauer des
            Nutzerkontos gespeichert. Analysen bleiben gespeichert, bis sie vom
            Nutzer gelöscht werden oder das Nutzerkonto gelöscht wird.
            Profilbilder werden bei Austausch oder Entfernung gelöscht.
            Gesetzliche Aufbewahrungspflichten sowie technisch notwendige
            Löschzyklen in Protokollen und Sicherungskopien können zu einer
            längeren, zweckgebundenen Speicherung führen.
          </p>
        </section>

        <section>
          <h2>8. Betroffenenrechte</h2>
          <p>
            Betroffene Personen haben nach Maßgabe der gesetzlichen Voraussetzungen
            das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
            Verarbeitung, Datenübertragbarkeit und Widerspruch. Einwilligungen
            können jederzeit mit Wirkung für die Zukunft widerrufen werden.
            Anfragen können an {" "}
            <a href={`mailto:${operator.email}`}>{operator.email}</a> gerichtet
            werden. Darüber hinaus besteht ein Beschwerderecht bei einer
            Datenschutzaufsichtsbehörde.
          </p>
        </section>

        <section>
          <h2>9. Automatisierte Auswertung</h2>
          <p>
            Die Plattform berechnet anhand der eingegebenen Test- und Profildaten
            Trainingskennzahlen und Empfehlungen. Diese Auswertungen dienen der
            sportlichen Orientierung und entfalten keine rechtliche oder ähnlich
            erhebliche Wirkung. Eine ausschließlich automatisierte Entscheidung
            im Sinne von Art. 22 DSGVO findet nicht statt.
          </p>
        </section>

        <section>
          <h2>10. Bereitstellung der Daten und Sicherheit</h2>
          <p>
            Für Registrierung und Nutzung sind die jeweils als erforderlich
            gekennzeichneten Angaben notwendig. Weitere Profil- und Leistungsdaten
            sind freiwillig; ohne sie können einzelne Analysefunktionen nicht oder
            nur eingeschränkt genutzt werden. Wir setzen angemessene technische
            und organisatorische Maßnahmen ein, um personenbezogene Daten gegen
            Verlust, unbefugten Zugriff und Missbrauch zu schützen.
          </p>
        </section>

        <p className="text-sm text-[var(--subtle)]">Stand: 18. August 2026</p>
      </LegalPage>
    </>
  );
}
