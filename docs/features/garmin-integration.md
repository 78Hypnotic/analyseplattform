# Garmin-Integration

Status: geplant  
Stand: 19.08.2026

## Ziel

Die Plattform verbindet ein Garmin-Konto freiwillig mit dem Athletenprofil.
Absolvierte Schwimm-, Lauf- und Radaktivitäten können aus Garmin Connect
importiert, im Trainingsverlauf angezeigt und nachvollziehbar einer persönlichen
Planeinheit zugeordnet werden. In einer späteren Stufe können strukturierte
Workouts und Trainingspläne aus der Plattform an Garmin Connect und kompatible
Garmin-Geräte übergeben werden.

Die Integration erweitert den bestehenden Trainingskreislauf:

`Diagnostik -> Trainingsplan -> Garmin-Workout -> Aktivität -> Zuordnung -> Fortschritt -> Re-Diagnostik`

Garmin ist ein optionaler Integrationskanal. Persönliche Pläne und manuelle
Erledigung bleiben auch ohne Garmin vollständig nutzbar.

## Garmin-Zugang

Die Umsetzung setzt eine Freigabe für das Garmin Connect Developer Program
voraus. Das Programm ist für geschäftliche Nutzung vorgesehen und verwendet
OAuth 2.0. Garmin nennt für die Antragsentscheidung üblicherweise zwei
Werktage und für eine typische Integration etwa ein bis vier Wochen.

Für die Plattform werden zunächst beantragt:

- **Activity API:** Aktivitäten und detaillierte Aktivitätsdateien empfangen,
- **Training API:** strukturierte Workouts und Trainingspläne veröffentlichen.

Die Health API für Schlaf, Ruhepuls und weitere Tagesdaten ist kein Bestandteil
des ersten Garmin-Meilensteins. Sie benötigt eine eigene Produkt-, Datenschutz-
und Löschentscheidung.

Der Garmin-Antrag muss Produktzweck, Zielgruppe, erwartete Nutzerzahl,
gewünschte APIs, Datenschutzprozess und geplante Datenverwendung verständlich
beschreiben. Eine Implementierung gegen nicht freigegebene oder inoffizielle
Garmin-Endpunkte ist ausgeschlossen.

## Verbindliche Produktentscheidungen

- Die Verbindung ist freiwillig und jederzeit widerrufbar.
- Der erste Meilenstein ist **Import-only** über die Activity API.
- Importierte Aktivitäten werden idempotent anhand einer externen Aktivitäts-ID gespeichert.
- Eine Aktivität wird nicht allein aufgrund gleicher Sportart automatisch als
  korrekt absolvierte Planeinheit gewertet.
- Automatische Zuordnung darf nur über dokumentierte, konservative Regeln
  erfolgen und bleibt für den Nutzer korrigierbar.
- Manuell erledigte Einheiten funktionieren unabhängig vom Garmin-Status.
- OAuth-Tokens und Garmin-Secrets bleiben ausschließlich serverseitig und
  werden verschlüsselt gespeichert.
- Rohdaten werden nur gespeichert, wenn sie für eine erklärte Funktion benötigt
  werden und eine Löschfrist festgelegt ist.
- Training API und Health API werden erst nach einem stabilen Activity-Import umgesetzt.

## Entwicklungsstufen

### 0. Partnerzugang und Vertrag

1. Garmin Connect Developer Program für Activity API und Training API beantragen.
2. Freigegebene Scopes, Branding-Vorgaben, Limits und Testumgebung dokumentieren.
3. Datenschutzinformationen, Einwilligung, Löschung und Supportprozess anpassen.
4. Garmin-Clientdaten ausschließlich in geschützten Server-Umgebungsvariablen hinterlegen.

Ohne freigegebenen Partnerzugang beginnt keine produktive OAuth- oder API-Implementierung.

### 1. Activity-Import-MVP

Der Athlet kann Garmin im Profil beziehungsweise unter Integrationen verbinden
und trennen. Nach Einwilligung importiert die Plattform neue Aktivitäten über
die von Garmin freigegebene Push- oder Ping/Pull-Architektur.

Der MVP umfasst:

- OAuth-2.0-Verbindung und Callback,
- Status „Verbunden“, Zeitpunkt der letzten Synchronisierung und Fehlerstatus,
- Import von Schwimmen, Laufen und Radfahren,
- externe ID, Sportart, Startzeit, Dauer, Distanz und verfügbare Kernmetriken,
- idempotente Verarbeitung wiederholter Events,
- begrenzten Backfill nach erstmaliger Verbindung,
- manuelle Zuordnung einer Aktivität zu einer persönlichen Einheit,
- Trennung der Verbindung und Löschung beziehungsweise Entkopplung nach der
  dokumentierten Aufbewahrungsregel.

FIT-, GPX- oder TCX-Dateien werden erst dauerhaft gespeichert, wenn eine konkrete
Funktion die Detaildaten benötigt. Für den ersten sichtbaren Verlauf reichen
normalisierte Zusammenfassungen.

### 2. Assistierte Zuordnung und Fortschritt

Die Plattform schlägt eine passende persönliche Einheit anhand konservativer
Merkmale vor:

- gleiche Disziplin,
- zeitliche Nähe zum geplanten Datum,
- ungefähr passender Umfang oder passende Dauer,
- keine bereits verwendete externe Aktivität.

Der Nutzer bestätigt oder verwirft den Vorschlag. Eine bestätigte Zuordnung
kann die Einheit serverseitig als erledigt markieren. Dabei werden externe
Aktivität, Entscheidungszeitpunkt und Zuordnungsart protokolliert.

Eine automatische Bestätigung ist erst zulässig, wenn fachliche Toleranzen,
Fehlerfälle und Rücknahmeverhalten definiert und mit realen Nutzungsdaten
validiert wurden.

### 3. Training API

Strukturierte persönliche Einheiten werden in das von Garmin unterstützte
Workout-Format übersetzt und nach Einwilligung an Garmin Connect veröffentlicht.
Garmin Connect übernimmt die Synchronisierung mit kompatiblen Geräten.

Diese Stufe umfasst:

- Mapping interner Blöcke, Ziele und Wiederholungen auf Garmin-Workout-Schritte,
- unterstützte Sportarten und Gerätegrenzen,
- Veröffentlichung einzelner Workouts,
- spätere Veröffentlichung mehrwöchiger Trainingspläne,
- persistierte externe Workout- und Plan-IDs,
- idempotente Aktualisierung beziehungsweise explizite Neuanlage,
- verständliche Fehlerzustände für nicht unterstützte Workout-Strukturen.

Verkaufte unveränderliche Planversionen bleiben die fachliche Quelle. Eine
Garmin-Veröffentlichung verändert die gekaufte Planversion nicht.

### 4. Erweiterte Coachingdaten

Erst nach stabiler Activity- und Training-Integration können freigegebene
Belastungs- oder Health-Daten in Coaching und Wochenplanung einfließen. Dafür
werden Zweck, Minimalumfang, fachliche Interpretation, Aufbewahrung und
Gesundheitsdaten-Rechtsgrundlage separat beschlossen.

Fehlende Synchronisierung, Gerätewechsel oder unvollständige Daten dürfen nie
automatisch zu einer Belastungssteigerung führen.

## Ziel-Datenmodell

Die konkreten Namen sind Arbeitsverträge für eine spätere Migration.

### `integration_accounts`

- `id`, `user_id`, `provider` mit zunächst `garmin`,
- externe Garmin-Nutzerreferenz,
- verschlüsselte Access- und Refresh-Token beziehungsweise providerabhängige Credentials,
- gewährte Scopes und Einwilligungsversion,
- Status `active`, `reauthorization_required`, `revoked` oder `error`,
- letzte erfolgreiche Synchronisierung, letzter Fehler und Zeitstempel,
- eindeutige Kombination aus Nutzer und Provider.

Tokenwerte dürfen weder über direkte Supabase-Clientabfragen noch in Logs oder
Adminoberflächen ausgegeben werden. Die Service Role ist keine
Verschlüsselungsstrategie; Schlüsselverwaltung und Rotation werden gesondert
festgelegt.

### `external_activities`

- `id`, `integration_account_id`, `user_id`, `provider`,
- eindeutige `external_activity_id`,
- Disziplin, Startzeit, Zeitzone, Dauer und Distanz,
- verfügbare normalisierte Kennzahlen wie Pace, Herzfrequenz oder Leistung,
- optionaler Verweis auf kontrolliert gespeicherte Detaildaten,
- Provider-Erstellungs- und Aktualisierungszeitpunkt,
- Importstatus, Rohdatenversion und interne Zeitstempel.

Die Kombination aus Provider, Integrationskonto und externer Aktivitäts-ID ist
eindeutig. Wiederholte Garmin-Benachrichtigungen aktualisieren denselben Datensatz.

### `activity_session_matches`

- `id`, `external_activity_id`, `user_plan_session_id`,
- Status `suggested`, `confirmed`, `rejected` oder `detached`,
- Zuordnungsart `manual`, später optional `rule`,
- Regelversion und nachvollziehbare Begründung,
- bestätigende Person und Zeitstempel.

`user_plan_sessions.external_activity_provider` und
`user_plan_sessions.external_activity_id` bleiben die kompakte aktive Referenz.
Die Match-Tabelle hält Verlauf und Korrekturen nachvollziehbar.

### `integration_events`

- Provider und eindeutige externe Event-ID,
- Eventtyp, Empfangs- und Verarbeitungszeitpunkt,
- Verarbeitungsstatus, Versuchszahl und letzter Fehler,
- nur die für Idempotenz und Support erforderlichen Providerdaten.

## Serverarchitektur

Die Garmin-Integration läuft ausschließlich über serverseitige Adapter:

1. OAuth-Start erzeugt einen kurzlebigen, an Nutzer und Browser gebundenen State.
2. OAuth-Callback prüft State und Session, tauscht den Code serverseitig und
   speichert Credentials verschlüsselt.
3. Garmin-Events werden über einen öffentlichen, providerverifizierten Endpoint empfangen.
4. Der Endpoint bestätigt nur valide Events und registriert sie idempotent.
5. Hintergrundverarbeitung lädt beziehungsweise normalisiert Aktivitäten und
   schreibt sie unter Service-Role-Kontrolle.
6. Nutzeroberflächen lesen ausschließlich eigene normalisierte Daten über RLS
   oder einen zusätzlich autorisierten Serververtrag.

Providerlogik liegt hinter einem internen Vertrag, beispielsweise:

```ts
type ActivityProvider = {
  buildAuthorizationUrl(input: AuthorizationInput): Promise<string>;
  exchangeAuthorizationCode(input: CallbackInput): Promise<ProviderCredentials>;
  disconnect(accountId: string): Promise<void>;
  importActivity(reference: ExternalActivityReference): Promise<NormalizedActivity>;
  publishWorkout?(workout: StructuredWorkout): Promise<PublishedWorkoutReference>;
};
```

Garmin-spezifische Payloads dürfen nicht zum allgemeinen Plan- oder
Aktivitätsmodell der Plattform werden.

## Zugriffsschutz und Datenschutz

- Nutzer sehen und trennen nur das eigene Integrationskonto.
- Zugeordnete Coaches sehen nur ausdrücklich freigegebene normalisierte Daten.
- Admins erhalten keinen pauschalen Zugriff auf Token oder unnötige Rohdaten.
- OAuth-State ist kurzlebig, einmalig und gegen Login-CSRF geschützt.
- Callback- und Event-Endpunkte besitzen Rate Limits und strukturierte Auditlogs.
- Secrets, Tokens, Autorisierungscodes und vollständige Providerpayloads werden
  nicht in normalen Anwendungslogs gespeichert.
- Einwilligung benennt APIs, Datenarten, Zwecke, Aufbewahrung und Widerruf.
- Trennung stoppt künftigen Import und widerruft die Providerverbindung, soweit
  Garmin dies unterstützt.
- Accountlöschung umfasst Integrationskonto, Zuordnungen, Tokens und die
  beschlossene Löschung oder Anonymisierung importierter Aktivitäten.
- AVV, Drittlandtransfer und Garmin-Datenschutzbedingungen werden vor dem
  Produktionsstart fachkundig geprüft.

## Fehler- und Randfälle

- Doppeltes Event erzeugt keine zweite Aktivität.
- Event trifft vor Abschluss der Verbindung ein und wird sicher verworfen oder wiederholt.
- Token ist abgelaufen oder widerrufen; UI fordert erneute Autorisierung.
- Garmin ist vorübergehend nicht erreichbar; Verarbeitung wird mit Backoff wiederholt.
- Backfill und Live-Event liefern dieselbe Aktivität.
- Aktivität wurde in Garmin nachträglich geändert oder gelöscht.
- Eine Aktivität passt zu mehreren Einheiten und wird nicht automatisch zugeordnet.
- Eine Einheit wurde bereits manuell abgeschlossen.
- Nutzer trennt Garmin während laufender Hintergrundverarbeitung.
- Workout enthält Schritte, die das Garmin-Format oder Gerät nicht unterstützt.
- Zeitzonenwechsel und Aktivitäten über Mitternacht verändern keine Zuordnung unkontrolliert.

## Monitoring und Support

Mindestens überwacht werden:

- aktive und fehlerhafte Integrationskonten,
- Eventeingang und Verarbeitungsverzögerung,
- Importerfolg, Duplikate und dauerhafte Fehler,
- OAuth-Abbrüche und erneute Autorisierung,
- Zuordnungsvorschläge, Bestätigungen und Korrekturen,
- Training-API-Veröffentlichungen und Gerätefehler.

Ein Supportfall muss anhand interner IDs nachvollziehbar sein, ohne Tokens oder
unnötige Gesundheits- und Leistungsdaten offenzulegen.

## Akzeptanzkriterien des Activity-Import-MVP

- Ein angemeldeter Nutzer kann Garmin über OAuth 2.0 verbinden.
- Der Nutzer sieht Status, letzte Synchronisierung und kann die Verbindung trennen.
- Neue Schwimm-, Lauf- und Radaktivitäten werden idempotent importiert.
- Wiederholte Events erzeugen keine Duplikate.
- Nutzer sehen ausschließlich eigene importierte Aktivitäten.
- Eine Aktivität kann manuell genau einer persönlichen Einheit zugeordnet und
  wieder entkoppelt werden.
- Ohne explizite Bestätigung wird keine persönliche Einheit automatisch erledigt.
- Widerruf stoppt den Import und entfernt gespeicherte Credentials.
- Fehler sind wiederholbar, beobachtbar und führen nicht zum Verlust manueller Trainingsdaten.
- Export und Accountlöschung berücksichtigen Garmin-Daten.

## Nicht im ersten Umfang

- Health API und Women's Health API,
- vollautomatische Erledigung persönlicher Einheiten,
- automatische Trainingsanpassung oder medizinische Interpretation,
- Live-Verbindung direkt zum Gerät über Garmin Health SDKs,
- Connect-IQ-App, Watchface oder Datenfeld,
- Apple Health, Health Connect, Strava oder weitere Provider,
- dauerhafte Speicherung vollständiger FIT-Dateien ohne konkreten Produktzweck,
- Training API vor erfolgreicher Validierung des Activity-Imports.

## Abhängigkeiten und Reihenfolge

1. Persönliche Pläne und `user_plan_sessions` im Web vollständig nutzbar machen.
2. Garmin-Partnerzugang für Activity API und Training API beantragen.
3. Rechtsgrundlage, Einwilligung, Löschfristen und Supportprozess festlegen.
4. Integrationsmigration, OAuth und sicheren Credential-Speicher implementieren.
5. Activity-Import mit manueller Zuordnung produktiv validieren.
6. Assistierte Zuordnung und erst danach Training API umsetzen.
7. Health- oder KI-Coaching-Nutzung als separaten Meilenstein entscheiden.

Die allgemeine Integrations- und Mobilearchitektur steht in der
[Mobile-Roadmap](../architecture/mobile-roadmap.md). Der Plan- und
Einheitenvertrag steht in [Statische Trainingspläne verkaufen](static-training-plan-sales.md).