# Statische Trainingspläne verkaufen

Status: geplant  
Stand: 19.08.2026

## Ziel

Der Meilenstein führt einen Kunden von einer Schwimmdiagnostik zu einem
gekauften, persönlich terminierten Trainingsplan. Im Profil sieht der Kunde den
aktuellen Plan, den Fortschritt und die nächste Einheit. Nach Abschluss führt
die Plattform zurück zur Schwimmdiagnostik oder zu einem passenden Folgeplan.

Für den fortgeschrittenen Schwimmreport werden coach-geprüfte Attributpläne
ergänzt. Sie dauern in der Regel vier Wochen und machen die erwartete
Entwicklung des priorisierten Attributs bereits im Radar sichtbar. Der
fachliche Vertrag steht in
[Attributpläne im fortgeschrittenen Schwimmreport](advanced-swim-report-plans.md).

Damit entsteht der erste kommerzielle Trainingskreislauf:

`Diagnostik -> Empfehlung -> Kauf -> Terminierung -> Training -> Abschluss -> Re-Diagnostik/Folgeplan`

Der persönliche Plan ist in der Plattform vollständig nutzbar: Der Athlet sieht
seine Wochen und Einheiten, öffnet die Workout-Details, markiert absolvierte
Workouts als erledigt und sieht den daraus berechneten Fortschritt. Eine Garmin-
Synchronisation gehört nicht zu diesem Web-Meilenstein und folgt als eigener
Integrationsschritt nach stabiler manueller Nutzung.

## Verbindliche Produktentscheidungen

- Der erste verkaufte Plantyp ist **Schwimmen**.
- Ein Schwimm-Attributplan kostet im Einzelkauf **4,99 EUR**.
- Das beschlossene Zielmodell bietet alternativ ein Gruppencoaching-Abo für
  **12,99 EUR** mit freier Wahl aus der coach-kuratierten Trainingsbibliothek.
  Die technische Einführung wiederkehrender Zahlungen darf nach dem
  Einzelkauf-Meilenstein erfolgen.
- Der Web-Checkout läuft über **Stripe Checkout**.
- Vor dem Checkout ist ein Benutzerkonto erforderlich.
- Der Kunde wählt ein **Startdatum und feste Trainingstage**.
- Einheiten können als erledigt markiert werden.
- Das Profil zeigt mindestens aktuellen Plan, Fortschritt und nächste Einheit.
- Der Planabschluss bietet eine erneute Schwimmdiagnostik und einen Folgeplan an.
- Verkaufte Pläne referenzieren eine unveränderliche Veröffentlichungsversion.
- Die fachliche Freischaltung bleibt vom Zahlungsprovider getrennt.

## Vorhandene Grundlage

- `training_plans` enthält editierbare Admin-Planvorlagen mit Wochen,
  Einheiten, Blöcken und Drills.
- Der Builder unter `/admin/plans` pflegt diese Vorlagen.
- Die Schwimmdiagnostik erzeugt mit `result.plan.slug` eine Planempfehlung.
- `getActiveTrainingPlanPreview` lädt eine begrenzte Vorschau für den Report.
- Die Profilseite ist die bestehende Athletenoberfläche für den späteren
  aktuellen Plan.
- Supabase RLS, Rollen und Coach-Athlet-Zuordnungen bilden die Basis für den
  Zugriffsschutz.

Diese Bausteine enthalten noch keinen Kauf, keine persönliche Planinstanz,
keinen Fortschritt und keine sichere Freischaltung des vollständigen Inhalts.

## Begriffe

- **Planvorlage:** editierbarer Datensatz, den ein Admin im Builder pflegt.
- **Planversion:** unveränderlicher, veröffentlichter Snapshot einer Planvorlage.
- **Angebot:** verkäufliche Planversion mit Preis, Währung und Verfügbarkeit.
- **Bestellung:** provider-neutraler Zahlungs- und Erstattungsnachweis.
- **Freischaltung:** serverseitig festgestelltes Recht eines Nutzers auf eine Planversion.
- **Persönlicher Plan:** terminierte Instanz einer freigeschalteten Planversion für einen Nutzer.
- **Persönliche Einheit:** konkrete Einheit des persönlichen Plans mit Datum und Status.

## Nutzerreise

### 1. Empfehlung und Vorschau

Nach einer gespeicherten Schwimmdiagnostik zeigt der Report den empfohlenen
aktiven Plan. Die Vorschau enthält Titel, Ziel, Dauer, Trainingshäufigkeit,
Kurzbeschreibung, Preis und einen klaren Kauf-CTA. Vollständige Wochen,
Einheiten und Drills werden vor der Freischaltung nicht an den Client geliefert.

Im fortgeschrittenen Schwimmreport stimmen Planempfehlung, hervorgehobenes
Radar-Attribut und prognostizierte Zielkontur überein. Die Prognose ist
coach-geprüft, an die unveränderliche Planversion gebunden und wird als
erwartetes Potenzial statt als garantiertes Ergebnis bezeichnet.

Ein Plan kann zusätzlich über eine eigene Angebotsseite aufgerufen werden. Ohne
passende Diagnostik erklärt die Seite, für wen der Plan gedacht ist, und bietet
optional zuerst die Schwimmdiagnostik an.

### 2. Account und Checkout

Ein nicht angemeldeter Besucher wird vor dem Checkout zur Registrierung oder
Anmeldung geführt und danach zum Angebot zurückgebracht. Der Server erstellt
die Stripe Checkout Session ausschließlich aus einer aktiven Planversion und
dem serverseitig gespeicherten Angebot. Preis, Währung, Nutzer und Planversion
werden nicht aus frei manipulierbaren Clientwerten übernommen.

### 3. Bezahlung und Freischaltung

Nur ein verifizierter Stripe-Webhook darf eine Bestellung als bezahlt markieren
und die Freischaltung erzeugen. Die Rückkehr auf eine Success-URL ist kein
Zahlungsnachweis. Webhook-Events werden anhand ihrer externen Event- und
Transaktions-IDs idempotent verarbeitet.

Nach erfolgreicher Freischaltung sieht der Kunde einen Status „Zahlung erhalten“
und wird zur Terminierung geführt. Falls Stripe den Browser früher zurückführt
als der Webhook verarbeitet wurde, zeigt die Anwendung einen prüfbaren
Zwischenzustand und fragt den serverseitigen Status erneut ab.

### 4. Persönliche Terminierung

Der Kunde wählt:

- ein Startdatum,
- genau so viele feste Wochentage, wie die maximale Anzahl Einheiten einer
  Planwoche erfordert.

Das Startdatum markiert den Beginn der ersten Planwoche. Die Einheiten jeder
Woche werden in ihrer gespeicherten Reihenfolge den ausgewählten Wochentagen
zugeordnet. Die Zuordnung erzeugt persistierte persönliche Einheiten mit
konkretem Datum; sie wird nicht bei jedem Seitenaufruf neu berechnet.

Beispiel: Start Montag, Trainingstage Dienstag/Donnerstag/Samstag. Die erste,
zweite und dritte Einheit jeder Planwoche werden diesen Tagen in dieser
Reihenfolge zugeordnet.

### 5. Training und Profil

Im Profil erscheint oberhalb der Diagnostik-Historie ein Bereich „Mein Training“:

- aktiver Plan und aktuelle Woche,
- Fortschritt als erledigte Einheiten im Verhältnis zu allen Einheiten,
- nächste Einheit mit Datum, Titel, Fokus und geschätztem Umfang,
- Link zur vollständigen persönlichen Planansicht.

„Nächste Einheit“ ist deterministisch die älteste nicht erledigte persönliche
Einheit. Liegt ihr Termin in der Vergangenheit, wird sie als überfällig gezeigt;
danach folgen heutige und kommende Einheiten. Eine erledigte Einheit erhält
einen serverseitigen Zeitstempel und verschwindet aus der nächsten Position.

### 6. Abschluss

Ein Plan ist abgeschlossen, wenn alle persönlichen Einheiten erledigt sind oder
der Kunde den Abschluss ausdrücklich bestätigt. Das bloße Verstreichen des
letzten Termins schließt den Plan nicht automatisch ab.

Der Abschlusszustand zeigt:

- eine Zusammenfassung des Planfortschritts,
- einen CTA zur erneuten Schwimmdiagnostik,
- einen Folgeplan, wenn eine passende veröffentlichte Empfehlung existiert.

Eine neue Diagnostik darf den abgeschlossenen Plan nicht verändern. Sie erzeugt
eine neue Empfehlung für den nächsten Trainingszyklus.

## Ziel-Datenmodell

Die Namen sind Arbeitsverträge für die Umsetzung. Die konkrete Migration muss
Constraints, Indizes, Zeitstempel und RLS vollständig definieren.

### `training_plan_versions`

Unveränderlicher Snapshot einer veröffentlichten Planvorlage:

- `id`, `training_plan_id`, `version_number`,
- `discipline` mit zunächst `swim`,
- Snapshot von Titel, Fokus, Niveau, Zielstrecken, Wochen und `content`,
- `published_at`, `published_by`,
- eindeutige Kombination aus Planvorlage und Versionsnummer.

Eine veröffentlichte Version wird nicht aktualisiert oder gelöscht, solange eine
Bestellung oder persönliche Instanz darauf verweist. Änderungen am Admin-Plan
werden als neue Version veröffentlicht.

### `plan_offers`

Verkäufliches Angebot für genau eine Planversion:

- `id`, `training_plan_version_id`,
- `price_minor`, `currency`, `is_active`,
- optionaler externer Produkt-/Preisbezug je Zahlungsprovider,
- Gültigkeitszeitraum und Zeitstempel.

`price_minor` speichert den Betrag in der kleinsten Währungseinheit. Clients
zeigen nur serverseitig geladene Preise an.

### `plan_orders`

Provider-neutraler Zahlungsnachweis:

- `id`, `user_id`, `plan_offer_id`,
- `provider` mit zunächst `stripe`, später beispielsweise `apple` oder `google`,
- eindeutige externe Checkout-/Transaktions- und Eventreferenzen,
- unveränderlicher Betrag und Währung zum Kaufzeitpunkt,
- Status `pending`, `paid`, `failed`, `refunded` oder `cancelled`,
- Zeitstempel für Zahlung und Erstattung.

Provider-Rohdaten werden nur soweit erforderlich gespeichert. Eine externe ID
darf nicht allein als Zugriffsrecht verwendet werden.

### `user_training_plans`

Freischaltung und persönliche Instanz:

- `id`, `user_id`, `training_plan_version_id`,
- optional `plan_order_id`,
- Quelle `purchase`, später `subscription`, `admin` oder `coach`,
- `start_date`, ausgewählte Wochentage und Status,
- Status `setup_required`, `active`, `paused`, `completed` oder `revoked`,
- Abschluss- und Zeitstempel.

Die Kombination aus Nutzer, Planversion und zugrunde liegender Bestellung darf
nicht versehentlich mehrfach freigeschaltet werden.

### `user_plan_sessions`

Persistierter persönlicher Kalender:

- `id`, `user_training_plan_id`,
- stabile Referenz auf Woche und Einheit der Planversion,
- globale Reihenfolge und `scheduled_for`,
- Status `scheduled`, `completed` oder `skipped`,
- `completed_at`, optional später externe Aktivitätsreferenz und kurze Notiz.

Für den ersten Meilenstein muss die UI nur `scheduled` und `completed`
bearbeiten. `paused` und `skipped` werden im Datenmodell berücksichtigt, aber
erst nach einer eigenen Produktentscheidung als Bedienfunktion angeboten.

## Zugriffskontrolle

- Nutzer lesen nur eigene Bestellungen, persönlichen Pläne und Einheiten.
- Nutzer ändern nur erlaubte Felder eigener Instanzen, beispielsweise Terminierung
  und Abschlussstatus; Preis, Planversion, Quelle und Eigentümer sind nicht
  clientseitig änderbar.
- Zugeordnete Coaches dürfen persönliche Pläne ihrer Athleten zunächst lesen.
  Schreibrechte sind Bestandteil des späteren Pro-Coaching-Meilensteins.
- Admins verwalten Vorlagen, Versionen und Angebote; manuelle Freischaltungen
  müssen Quelle und handelnde Person protokollieren.
- Der vollständige Inhalt einer Planversion ist nur über eine gültige
  Freischaltung, Coach-Zuordnung oder Adminrolle lesbar.
- Die Supabase Service Role wird ausschließlich serverseitig für verifizierte
  Payment-Webhooks und klar abgegrenzte Adminoperationen verwendet.

RLS ist die letzte Zugriffsschranke. Server Actions und spätere API-Endpunkte
prüfen zusätzlich Authentifizierung, Eingaben und Geschäftsregeln.

## Stripe-Vertrag

### Checkout-Erstellung

1. Nutzer und gewünschtes aktives Angebot serverseitig laden.
2. Prüfen, ob bereits eine aktive Freischaltung oder bezahlte Bestellung besteht.
3. Stripe Checkout Session mit serverseitigem Preis erzeugen.
4. Interne Bestell-ID als Referenz setzen; keine Client-Metadaten als Wahrheit verwenden.
5. Eine `pending`-Bestellung idempotent speichern.

### Webhook-Verarbeitung

1. Signatur gegen das rohe Request-Body prüfen.
2. Externe Event-ID atomar als verarbeitet registrieren.
3. Betrag, Währung, Checkout-Referenz und erwartetes Angebot vergleichen.
4. Bestellung auf `paid` setzen und genau eine Freischaltung erzeugen.
5. Verarbeitung bei Wiederholung ohne doppelten Kauf fortsetzen oder erfolgreich beenden.
6. Fehler protokollieren und wiederholbar machen; dem Nutzer keinen Zugriff auf Basis der Success-URL geben.

### Erstattung und Widerruf

Eine Erstattung setzt die Bestellung auf `refunded`. Ob eine bereits gestartete
Planinstanz widerrufen wird, folgt der noch festzulegenden rechtlichen und
geschäftlichen Regel. Diese Entscheidung darf nicht implizit im Webhook-Code
liegen und ist vor dem kommerziellen Go-live zu dokumentieren.

## Fehler- und Randfälle

- **Doppelter Webhook:** dieselbe externe Transaktion erzeugt keine zweite Freischaltung.
- **Verzögerter Webhook:** Success-Seite zeigt „Zahlung wird bestätigt“ statt Zugriff vorzutäuschen.
- **Abgebrochener Checkout:** Bestellung bleibt nicht dauerhaft aktiv und kann sicher neu gestartet werden.
- **Deaktiviertes Angebot:** kein neuer Checkout; bestehende Käufer behalten ihre Planversion.
- **Geänderte Planvorlage:** bestehende Käufer behalten den veröffentlichten Snapshot.
- **Zu wenige Trainingstage:** Terminierung wird abgelehnt und erklärt die notwendige Anzahl.
- **Verschobener Start:** vor der ersten erledigten Einheit kann eine neue Terminierung alle offenen Einheiten atomar ersetzen; danach ist eine eigene Verschiebungsfunktion nötig.
- **Fehlende Diagnostik:** Direktkauf bleibt möglich, wenn das Angebot dies erlaubt; die Plattform erklärt die fehlende Personalisierungsgrundlage.
- **Erstattung:** Zugriff folgt der dokumentierten Erstattungsregel und wird revisionssicher geändert.
- **Parallele aktive Pläne:** Im ersten Meilenstein ist höchstens ein aktiver Schwimmplan pro Nutzer vorgesehen.

## Akzeptanzkriterien

- Ein Admin kann aus einer vollständigen Vorlage eine unveränderliche Version veröffentlichen und ein aktives Angebot pflegen.
- Ein angemeldeter Nutzer kann den empfohlenen Attributplan zum serverseitigen
  Einzelpreis von 4,99 EUR über Stripe Checkout kaufen.
- Manipulierte Plan-, Preis- oder Nutzerwerte im Client führen zu keiner falschen Bestellung.
- Nur ein gültig signierter, passender Webhook erzeugt idempotent die Freischaltung.
- Ein Käufer kann Startdatum und ausreichend viele feste Trainingstage wählen.
- Die Plattform erzeugt reproduzierbar genau eine persönliche Einheit pro Einheit der Planversion.
- Ein Nutzer sieht ausschließlich seine vollständigen Pläne und persönlichen Einheiten.
- Das Profil zeigt aktiven Plan, Fortschritt und die korrekt bestimmte nächste Einheit.
- Das Markieren als erledigt aktualisiert Fortschritt und nächste Einheit ohne Doppelabschluss.
- Nach Planabschluss erscheinen Re-Diagnostik und Folgeplan-CTA.
- Alte Käufe bleiben nach Änderungen an der Admin-Vorlage unverändert nutzbar.
- Coach- und Adminzugriffe entsprechen Zuordnung und Rolle; anonyme Nutzer erhalten nur Vorschauen.

## Nicht im Umfang

- technische Umsetzung des beschlossenen Gruppencoaching-Abos für 12,99 EUR und
  wiederkehrender Zahlungen,
- Community und Challenges,
- Gutscheine, Bundles und dynamische Preise,
- KI-generierte oder individuell durch Coaches bearbeitete Pläne,
- Mentaltrainingspläne,
- Garmin- oder Aktivitätssynchronisierung,
- Push-Benachrichtigungen und Offline-Modus,
- native iOS-/Android-App und In-App-Käufe,
- Lauf- und Radtrainingspläne.

Diese Fähigkeiten werden in der [Produktvision](../product-vision.md) und der
[Mobile-Roadmap](../architecture/mobile-roadmap.md) eingeordnet.

## Vor kommerziellem Go-live offen

- steuerliche Darstellung der festgelegten Preise und genaue Leistungsgrenzen,
- Widerrufs- und Erstattungsregel für digitale Inhalte,
- AGB, Preisangaben und Zahlungsinformationen,
- Stripe-Verträge, Datenschutzangaben und Steuer-/Belegprozess,
- Supportweg bei Zahlung ohne sichtbare Freischaltung,
- Monitoring, Alarmierung und Abstimmung von Stripe-Auszahlungen mit Bestellungen.

Die übergreifende Liste steht in
[Offene Punkte zur Produktionsreife](../produktionsreife-offene-punkte.md).