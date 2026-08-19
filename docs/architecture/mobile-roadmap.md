# Mobile-Roadmap für iOS und Android

Status: Zielarchitektur, noch nicht in Umsetzung  
Stand: 18.08.2026

## Entscheidung

Die Plattform wird zunächst web-first weiterentwickelt. Nach Validierung des
Geschäftsmodells ist **Expo mit React Native** die bevorzugte Zielrichtung für
iOS und Android. Die gemeinsame TypeScript-Basis erlaubt, Fachlogik, Typen und
Validierung zu teilen, ohne die heutige Next.js-Oberfläche als mobile App
nachzubauen.

Diese Entscheidung ist reversibel. Flutter oder vollständig native Apps bleiben
möglich, hätten aber einen höheren Aufwand für die erneute Implementierung und
Validierung der bestehenden TypeScript-Fachlogik. Eine PWA kann ergänzend
nützlich sein, ersetzt aber nicht automatisch Store-Vertrieb, sichere native
Integrationen, Hintergrundverarbeitung und eine hochwertige Offline-Nutzung.

## Leitplanken ab heute

Der aktuelle Web-Meilenstein implementiert noch keine Mobile-App. Neue
Fachfunktionen sollen dennoch folgende Grenzen einhalten:

- Berechnungen, Typen und Zod-Schemas enthalten keine React-, Next.js- oder Browserabhängigkeit.
- Next.js Server Actions sind Web-Adapter und kein öffentlicher Mobile-API-Vertrag.
- Freischaltungen hängen fachlich nicht direkt von Stripe-, Apple- oder Google-IDs ab.
- Alle Clients verwenden dieselben serverseitigen Zugriffsregeln und Supabase RLS.
- Service-Role-Schlüssel, Payment-Verifikation, KI-Erstellung und privilegierte Adminaktionen bleiben serverseitig.
- Externe Integrationen werden über widerrufbare Verknüpfungen und stabile interne IDs angebunden.

## Wiederverwendbare Fachlogik

Folgende Bereiche sind heute bereits weitgehend frameworkunabhängig und sollen
vor Beginn der Mobile-App in ein gemeinsames Package, beispielsweise
`packages/core`, extrahiert werden:

- Schwimmberechnung, Typen, Konstanten und Validierung unter `src/lib/analysis`,
- Laufberechnung, Typen, Konstanten und Validierung unter `src/lib/running`,
- Radberechnung, Typen, Konstanten und Validierung unter `src/lib/cycling`,
- Planstruktur und Planvalidierung unter `src/lib/training-plans`,
- reine Zugriffs- und Mutationsentscheidungen wie `canMutateAthlete`,
- gemeinsame API-Datentransferobjekte und Fehlercodes.

Das Shared Package enthält keine Supabase-Clients, Secrets, Cookies,
`revalidatePath`, `redirect` oder UI-Komponenten. Web und Mobile verwenden
dieselben Tests für diese Fachlogik.

Die Extraktion ist kein Bestandteil des ersten Planverkaufs. Sie erfolgt erst,
wenn der erste Mobile-Client geplant wird oder vorher eine zweite Laufzeit die
gemeinsame Logik benötigt.

## Web- und Backend-Grenze

Heute sind Mutationen wie Analyseerstellung, Profilpflege und Adminaktionen an
Next.js Server Actions gebunden. Diese Actions verwenden Cookie-Sessions und
Web-Funktionen wie `redirect()` und `revalidatePath()`. Eine native App kann sie
nicht als stabilen Vertrag voraussetzen.

Vor dem Mobile-Meilenstein erhalten mindestens folgende Bereiche versionierte
Backend-Verträge oder gemeinsam genutzte serverseitige Services:

- Profil lesen und ändern,
- Diagnostik erstellen, lesen und löschen,
- Planangebote und eigene Freischaltungen lesen,
- persönlichen Plan terminieren,
- persönliche Einheiten lesen und abschließen,
- Coach-Athlet-Zugriffe und spätere Plananpassungen,
- Integrationskonten verbinden und trennen.

Die konkrete Transportform kann Next.js Route Handler, Supabase Edge Functions
oder eine getrennte API sein. Entscheidend sind dokumentierte DTOs,
Authentifizierung, idempotente Mutationen, stabile Fehlercodes und Tests. Die
Fachlogik darf nicht in Web- und Mobile-Endpunkten dupliziert werden.

## Supabase und Zugriffsschutz

Eine Mobile-App darf den öffentlichen Supabase-Projektschlüssel zusammen mit
der Session des angemeldeten Nutzers verwenden. Dieser Schlüssel ist kein
Secret. Geeignete nutzerbezogene Lese- und Schreibzugriffe können direkt über
Supabase erfolgen, wenn RLS die Operation vollständig absichert.

Direkter Clientzugriff ist ausgeschlossen für:

- Service-Role-Operationen,
- Stripe-, Apple- und Google-Webhook-Verarbeitung,
- Preis- und Kaufverifikation,
- Rollen- und Coach-Zuordnungsverwaltung,
- KI-Generierung und Coach-Freigabe mit privilegierten Daten,
- Geheimnisse externer Integrationen,
- administrative Massenoperationen.

RLS bleibt unabhängig vom Client die letzte Zugriffsschranke. API-Endpunkte
prüfen zusätzlich Session, Eingaben und fachliche Berechtigung. Weder Web noch
Mobile dürfen Zugriff allein aus lokal gespeicherten Rollen oder Kaufstatus
ableiten.

## Mobile Auth

Die Mobile-App verwendet Supabase Auth mit PKCE und nativer Sessionverwaltung:

- Access- und Refresh-Token werden nur in Keychain beziehungsweise Android Keystore gespeichert.
- E-Mail-Bestätigung und Passwort-Reset kehren über verifizierte Universal Links/App Links in die App zurück.
- Redirect-Ziele werden gegen eine feste Allowlist geprüft.
- Token werden über die Supabase-Sessionmechanik erneuert und bei Logout lokal entfernt.
- Kritische Rollenänderungen und Accountlöschung dürfen nicht nur auf einen lokal gecachten Token vertrauen.
- Web verwendet weiterhin sichere HttpOnly-Cookies; Mobile und Web teilen nicht denselben Session-Speicher.

Vor Veröffentlichung werden Accountübernahme, verlorenes Gerät, Tokenwiderruf,
erneute Anmeldung und parallele Web-/Mobile-Sessions getestet.

## Navigation und Deep Links

Die spätere App benötigt stabile HTTPS-Links, die auf Web und Mobile dieselbe
Ressource adressieren. Vorgesehene Ziele sind:

- Report beziehungsweise Diagnostik,
- persönlicher Trainingsplan,
- konkrete nächste Einheit,
- Checkout-Ergebnis auf dem Web,
- E-Mail-Bestätigung und Passwort-Reset,
- Einladung oder Zuordnung zu einem Coach.

Links enthalten nur nicht sensible Ressourcen-IDs. Der Client lädt die Daten
nach Session- und RLS-Prüfung; ein Link selbst gewährt keinen Zugriff. Custom
Schemes können Entwicklung und Fallback unterstützen, aber Universal Links und
Android App Links sind der Produktionsvertrag.

## Commerce und provider-neutrale Freischaltungen

Der erste Verkaufsmeilenstein verwendet Stripe Checkout im Web. Eine spätere
native App darf daraus nicht ableiten, dass digitale Pläne in allen
Store-Konstellationen ebenfalls über Stripe verkauft werden dürfen. Vor dem
Mobile-Commerce-Meilenstein werden die dann aktuellen Regeln von Apple, Google,
Region und Geschäftsmodell geprüft. Für native Käufe können StoreKit und Google
Play Billing erforderlich sein.

Das Backend trennt deshalb:

- **Angebot:** welche unveränderliche Planversion zu welchen Konditionen angeboten wird,
- **Bestellung:** welcher Provider eine Zahlung oder Erstattung bestätigt hat,
- **Freischaltung:** worauf der Nutzer fachlich zugreifen darf,
- **persönlicher Plan:** wie der freigeschaltete Inhalt terminiert und absolviert wird.

Stripe, Apple und Google können später dieselbe Freischaltung erzeugen. Jeder
Provider erhält eine eigene serverseitige Verifikation und idempotente externe
Transaktionsreferenzen. Der Client sendet niemals nur ein lokales „gekauft“-Flag.

Auf Web, iOS und Android gekaufte Freischaltungen gehören zum selben
Benutzerkonto und sind auf allen Clients sichtbar, soweit Verträge und
Store-Regeln dies erlauben. Erstattungen und Widerruf aktualisieren dieselbe
zentrale Freischaltung nach einer ausdrücklich dokumentierten Regel.

## Offline und Synchronisierung

Der erste Mobile-Release sollte persönliche Pläne und anstehende Einheiten auch
bei schlechter Verbindung lesbar machen. Der Server bleibt die Quelle der
Wahrheit.

Vorgesehene Regeln:

- Planversionen sind unveränderlich und dadurch sicher cachebar.
- Persönliche Einheiten besitzen stabile IDs und einen serverseitigen Änderungszeitpunkt.
- Offline-Abschlüsse werden mit einer eindeutigen Mutations-ID vorgemerkt und idempotent synchronisiert.
- Ein Abschluss ist wiederholbar; doppelte Requests erzeugen keinen doppelten Fortschritt.
- Konflikte bei Terminverschiebung, Pause und Coach-Änderung werden vor deren Mobile-Umsetzung spezifiziert.
- Sensible Daten werden verschlüsselt oder gar nicht dauerhaft lokal gespeichert.
- Logout und Accountlöschung entfernen den nutzerbezogenen Offline-Cache.

Eine lokale SQLite-Datenbank ist für strukturierte Pläne und eine Sync-Queue die
bevorzugte Ausgangsbasis. Die konkrete Bibliothek wird beim Mobile-Prototyp
anhand der benötigten Offline-Komplexität ausgewählt.

## Push-Benachrichtigungen

Push kann später an die nächste Einheit, einen auslaufenden Plan, eine
Coach-Nachricht oder eine Re-Diagnostik erinnern. Dafür gelten:

- ausdrückliches Opt-in und getrennte Benachrichtigungseinstellungen,
- keine sensiblen Körper- oder Leistungsdaten im sichtbaren Push-Text,
- mehrere Geräte pro Nutzer mit einzeln widerrufbaren Tokens,
- serverseitige Planung mit Zeitzone und Ruhezeiten,
- Entfernung ungültiger Tokens und dokumentierte Aufbewahrungsdauer.

Push ist kein verlässlicher Zustellkanal für sicherheitskritische Nachrichten.

## Garmin und weitere Integrationen

Garmin, Apple Health, Health Connect und weitere Anbieter werden über eine
eigene Integrationsschicht angebunden. Kernobjekte wie persönliche Einheiten
speichern nur interne IDs und optionale externe Referenzen, keine
providerspezifische Fachlogik.

Jede Verknüpfung benötigt:

- explizite Einwilligung und klare Zwecke,
- minimale OAuth-/Daten-Scopes,
- verschlüsselte serverseitige Tokenablage,
- widerrufbare Verbindung und Löschprozess,
- idempotenten Import mit externer Aktivitäts-ID,
- Hintergrundjobs, Rate-Limit- und Fehlerbehandlung,
- dokumentierte Zuordnung zwischen externer Aktivität und persönlicher Einheit.

Ein importiertes Training wird nicht ohne nachvollziehbare Regeln automatisch
als korrekt absolvierte Planeinheit bewertet.

Im individuellen KI-Coaching können freigegebene Garmin-Daten zusätzlich in die
wöchentliche Planung einfließen. Der Agent kombiniert sie mit dem historischen
Athletenprofil und dem Samstags-Evaluationsbogen. Für jede erzeugte Woche wird
gespeichert, welche Daten zum Planungszeitpunkt vorlagen; spätere Synchronisation
ändert keine bereits veröffentlichte Woche rückwirkend. Fehlende Daten oder
Gesundheitswarnzeichen dürfen keine automatische Belastungssteigerung auslösen.

## Phasen

### Phase 1: Web-Geschäftsmodell validieren

- Diagnostik produktionsreif betreiben,
- statische Schwimmpläne über Stripe verkaufen,
- persönliche Pläne und Fortschritt im Web validieren,
- Athletenansicht mit Wochen, Workout-Details und serverseitigem Abhaken von Einheiten bereitstellen,
- provider-neutrale Freischaltungen und unveränderliche Planversionen verwenden.

### Phase 2: Mobile Foundation

- Expo-/React-Native-Projekt und EAS-Builds einrichten,
- Shared Core Package extrahieren,
- Supabase PKCE, Secure Storage und Deep Links umsetzen,
- stabile Verträge für Profil, Diagnostik, Pläne und Sessions bereitstellen,
- Mobile-CI, Geräte-/OS-Matrix und Store-Testkanäle aufbauen.

### Phase 3: Mobile Training

- Diagnostiken und Reports anzeigen,
- persönliche Pläne, nächste Einheit und Fortschritt bereitstellen,
- lesbaren Offline-Modus und idempotente Abschluss-Synchronisierung umsetzen,
- Push-Erinnerungen optional ergänzen.

### Phase 4: Mobile Commerce und Integrationen

- aktuelle Apple-/Google-Commerce-Regeln prüfen,
- erforderliche In-App-Käufe und Receipt-Verifikation implementieren,
- provider-neutrale Freischaltungen mit Web-Käufen abgleichen,
- Garmin und weitere Integrationen schrittweise anbinden. Dafür zuerst OAuth,
  Einwilligung, minimale Scopes, verschlüsselte Token, idempotenten Import,
  externe Aktivitäts-IDs und Regeln zur Zuordnung zu Planeinheiten umsetzen.

## Startkriterien für die Mobile-Umsetzung

Die Mobile-App beginnt erst, wenn:

- der Web-Planverkauf technisch und wirtschaftlich validiert ist,
- Planversion, Freischaltung und persönliche Einheiten stabil modelliert sind,
- zentrale Nutzungspfade einen dokumentierten Backend-Vertrag besitzen,
- Auth, Datenschutz, Löschung und Support produktionsreif sind,
- Zuständigkeit und Budget für Store-Betrieb, Geräte-Tests und Releases bestehen.

## Nicht Bestandteil der aktuellen Umsetzung

Diese Roadmap ist eine Architekturleitplanke. Sie beauftragt noch kein
Expo-Projekt, keine API-Migration, keinen Offline-Speicher, keine Push-Funktion,
keine Store-Produkte und keine Garmin-Anbindung. Der aktuelle nächste
Meilenstein bleibt [der Web-Verkauf statischer Schwimmpläne](../features/static-training-plan-sales.md).