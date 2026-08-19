# Offene Punkte zur Produktionsreife

Stand: 18.08.2026

Diese Liste bündelt verbleibende Go-live-Aufgaben. Ein Punkt gilt erst als erledigt, wenn die Umsetzung und der zugehörige Produktionscheck dokumentiert sind.

## 1. Recht und Datenschutz (vor öffentlichem Go-live blockierend)

- [ ] `LEGAL_POSTAL_ADDRESS` in Vercel mit der vollständigen ladungsfähigen Anschrift setzen. Format: `Straße Hausnummer|PLZ Ort|Deutschland`.
- [ ] Betreibername, Rechtsform, Kontakt, optionale Telefonnummer und gegebenenfalls Umsatzsteuer-ID abschließend prüfen und über die `LEGAL_*`-Variablen konfigurieren.
- [ ] Impressum und Datenschutzerklärung durch eine fachkundige Stelle für das konkrete Geschäftsmodell prüfen lassen. Das Repository enthält einen technisch vollständigen Entwurf, aber keine Rechtsberatung.
- [ ] Rechtsgrundlage für Körper-, Leistungs- und mögliche Gesundheitsdaten verbindlich festlegen. Falls Art. 9 DSGVO greift, ausdrückliche Einwilligung mit Version, Zeitpunkt, Widerruf und Nachweis technisch umsetzen, bevor diese Daten öffentlich erhoben werden.
- [ ] Auftragsverarbeitungsverträge mit Vercel und Supabase abschließen; Vertragsparteien, Serverregion, Unterauftragsverarbeiter und Drittlandgarantien dokumentieren.
- [ ] Konkrete Löschfristen für Auth-/Sicherheitslogs, Supportdaten und Backups festlegen und mit den Provider-Einstellungen abgleichen.
- [ ] Prozess für Auskunft, Datenexport, Berichtigung, Widerruf und vollständige Account-Löschung definieren. Verantwortliche Person und Monatsfrist dokumentieren; anschließend Self-Service-Export und -Löschung bewerten.
- [ ] Technische und organisatorische Maßnahmen, Datenschutzvorfälle und Meldewege in einem internen Verzeichnis dokumentieren.
- [ ] Prüfen, ob Informationspflichten nach VSBG oder weitere Pflichtangaben für das gewählte Geschäfts- und Preismodell gelten.

## 2. Kommerzieller Planverkauf (vor Verkaufsstart blockierend)

Diese Punkte blockieren nicht den geschlossenen Diagnostik-Betatest, aber den
öffentlichen Verkauf digitaler Trainingspläne.

- [ ] Preis, Währung, Leistungsumfang und Angebotsdauer für den ersten Schwimmplan verbindlich festlegen.
- [ ] AGB sowie Verbraucherinformationen für digitale Inhalte fachkundig erstellen und verlinken.
- [ ] Widerrufs- und Erstattungsregel einschließlich Beginn der Leistung, Zustimmung und gegebenenfalls Erlöschen des Widerrufsrechts rechtlich prüfen und technisch nachweisbar abbilden.
- [ ] Preisangaben, Checkout-Texte, Bestellbestätigung und Pflichtinformationen vor Absenden der Bestellung rechtlich prüfen.
- [ ] Stripe-Vertrag und Auftragsverarbeitung abschließen; Stripe als Empfänger, Zahlungsdienst und gegebenenfalls Drittlandtransfer in der Datenschutzerklärung ergänzen.
- [ ] Steuerliche Behandlung, Rechnungs-/Belegprozess, Nummernkreise und Aufbewahrungsfristen festlegen.
- [ ] Erstattungen, Chargebacks und Entzug beziehungsweise Erhalt einer bereits gestarteten Freischaltung verbindlich regeln.
- [ ] Supportweg und verantwortliche Person für „bezahlt, aber nicht freigeschaltet“ sowie Rückfragen zu Bestellungen benennen.
- [ ] Verifizierte Stripe-Webhooks, Idempotenz, Retry-Verhalten und Abstimmung zwischen Stripe-Zahlungen und internen Bestellungen überwachen und alarmieren.
- [ ] Produkt-, Zahlungs- und Freischaltungsdaten in Datenexport, Accountlöschung und Löschkonzept aufnehmen.

Produkt- und Technikvertrag: [Statische Trainingspläne verkaufen](features/static-training-plan-sales.md).

## 3. Körperbautyp und KFA-Visualisierung

### Produktionsmigration

- [ ] `supabase/migrations/20260818090000_profile_body_type.sql` auf Produktion anwenden.
- [ ] Danach `/analyse/new`, Analyse-Speicherung, Profil-Update und Coach-Ansicht prüfen.
- [ ] Falls PostgREST die neue Spalte noch nicht kennt: `notify pgrst, 'reload schema';` ausführen.

Solange die Migration fehlt, kann `/analyse/new` mit `column profiles.body_type does not exist` abbrechen.

### Noch fehlende Bilder

| Zweck | Pfad | Anzahl |
| --- | --- | --- |
| Körperbau-Kacheln | `public/bodytype/bodytype-{female,male}-{ektomorph,mesomorph,endomorph}.png` | 6 |
| KFA-Figur je Körperbautyp | `public/bodyfat/bodyfat-{female,male}-{ektomorph,mesomorph,endomorph}-{1..5}.png` | 30 |

Bis zur Bereitstellung greifen die vorhandenen Platzhalter beziehungsweise der bisherige KFA-Bildsatz.

### Fachliche Entscheidungen

- [ ] Entscheiden, ob Lauf und Rad ebenfalls eine Körperbau-Auswahl erhalten.
- [ ] Entscheiden, welcher Bildsatz für Geschlecht „divers“ verwendet wird; derzeit greift der weibliche Satz.
- [ ] Fachliche Regeln definieren, bevor der Körperbautyp Berechnungen beeinflusst. Aktuell wird er nur erfasst, gespeichert und angezeigt.

## 4. Lokale und technische Restpunkte

- [ ] Registry-Zugriff für `playwright-core@1.60.0` freigeben. Der aktuelle Unternehmens-Proxy beantwortet den Tarball-Download mit HTTP 403.
- [ ] Danach ein vollständiges `npm ci` ausführen. Der fehlgeschlagene saubere Installationslauf hat das lokale `node_modules` geleert; Manifest und Lockfile blieben unverändert.
- [ ] Danach `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` und `npm run e2e` erfolgreich ausführen.
- [ ] Die untracked Datei `src/components/body-type-selector.test.tsx` prüfen und bewusst committen oder verwerfen.
- [ ] Bei Browser-Automation den OneDrive-bedingten vollständigen Fast Refresh berücksichtigen, falls weiterhin Timeouts auftreten.

## 5. Späterer Mobile-Launch (kein aktueller Web-Blocker)

Diese Punkte werden erst mit dem iOS-/Android-Meilenstein zu Launch-Gates:

- [ ] Apple- und Google-Developer-Konten, Vertragsrollen, Steuer- und Bankdaten einrichten.
- [ ] Dann aktuelle Store-Regeln für digitale Trainingspläne, Abos, externe Kaufwege und Accountverknüpfung prüfen.
- [ ] Falls erforderlich StoreKit und Google Play Billing mit serverseitiger Transaktionsprüfung an die provider-neutralen Freischaltungen anbinden.
- [ ] Supabase PKCE, sichere Tokenablage, Universal Links/App Links, Logout und Tokenwiderruf testen.
- [ ] Datenschutzangaben, Store Privacy Labels/Data Safety, Berechtigungsdialoge und Accountlöschung für Mobile ergänzen.
- [ ] Geräte-/OS-Testmatrix, Accessibility, Crash Reporting, Support und gestuften Store-Rollout definieren.
- [ ] Offline-Cache, Push-Tokens und Integrationsdaten in Lösch- und Aufbewahrungskonzept aufnehmen.

Architekturleitplanke: [Mobile-Roadmap](architecture/mobile-roadmap.md).