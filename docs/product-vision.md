# Produktvision: Von der Diagnostik zur Trainingsplattform

Stand: 19.08.2026

## Zielbild

Die Plattform begleitet Ausdauersportler nicht nur bei einer einzelnen
Diagnostik, sondern durch einen wiederkehrenden Trainingskreislauf:

1. sportartspezifische Diagnostik durchführen,
2. Ergebnisse verständlich einordnen,
3. einen passenden Trainingsplan auswählen und freischalten,
4. die nächsten Einheiten im Alltag umsetzen,
5. Fortschritt sichtbar machen,
6. zum passenden Zeitpunkt erneut diagnostizieren,
7. Training und Folgeplan anhand der neuen Ausgangslage anpassen.

Die Diagnostik bleibt der fachliche Einstieg und die Grundlage für Empfehlungen.
Der langfristige Produktwert entsteht aus der kontinuierlichen Begleitung zwischen
zwei Diagnostiken.

## Produktversprechen

Die Plattform übersetzt Feldtests und Trainingsdaten in klare nächste Schritte.
Sie verbindet nachvollziehbare Auswertung, strukturierte Trainingsplanung und
menschliche Coaching-Qualität. Automatisierung soll Coaches unterstützen, aber
nicht deren fachliche Verantwortung verdecken.

## Zielgruppen und Rollen

- **Besucher** lernen Methodik und Angebot kennen und sehen begrenzte Planvorschauen.
- **Registrierte Athleten** speichern Diagnostiken und verwalten ihr Profil.
- **Plankunden** erwerben einzelne Pläne und verfolgen ihre persönlichen Einheiten.
- **Gruppencoaching-Mitglieder** wählen während ihres bezahlten Abos selbst aus
	einer von Coaches aufgebauten Trainingsbibliothek.
- **Individualcoaching-Athleten** erhalten eine wöchentlich angepasste Planung
	durch einen KI-Agenten auf Basis ihres Profils, ihrer Rückmeldungen und
	freigegebener Garmin-Daten.
- **Coaches** betreuen zugeordnete Athleten, prüfen Planentwürfe und geben sie frei.
- **Admins** verwalten Nutzer, Rollen, Planvorlagen, Veröffentlichungen und Produktangebote.

## Entwicklungsstufen

### 1. Diagnostik-MVP

Der aktuelle Web-MVP bildet Diagnostiken für Schwimmen, Laufen und Radfahren,
gespeicherte Reports, Profile sowie Coach- und Adminzugänge ab. Ein
Trainingsplan-Builder und gesperrte Planvorschauen sind vorhanden.

### 2. Verkauf statischer Trainingspläne

Der nächste Meilenstein schließt erstmals den Weg von der Schwimmdiagnostik zum
Training. Kunden kaufen einen veröffentlichten Schwimmplan einmalig, legen
Startdatum und feste Trainingstage fest und sehen im Profil den aktuellen Plan,
Fortschritt und die nächste Einheit. Nach Abschluss folgt die Aufforderung zur
Re-Diagnostik oder zu einem passenden Folgeplan.

Die Schwimm-Attributpläne dauern in der Regel vier Wochen und kosten im
Einzelkauf 4,99 EUR. Im fortgeschrittenen Report werden das nächste
Zielattribut und dessen coach-geprüfte erwartete Entwicklung im Radar gezeigt.

Der verbindliche Umfang steht in
[Statische Trainingspläne verkaufen](features/static-training-plan-sales.md).

### 3. Gruppencoaching

Das Gruppencoaching-Abo kostet 12,99 EUR pro Monat. Während der aktiven Mitgliedschaft kann der
Athlet frei aus einer von Coaches kuratierten Trainingsbibliothek wählen und
Pläne seinem Profil hinzufügen. Der Zugriff auf Bibliotheksinhalte endet mit dem
bezahlten Abozeitraum; Trainingshistorie und separat gekaufte Pläne bleiben
erhalten. Community-Funktionen und gemeinsame Challenges sind ein eigener
späterer Ausbau. Eine Garmin-Synchronisation ist für das Gruppencoaching keine
Voraussetzung.

### 4. Individuelles KI-Coaching

Ein KI-Agent plant Woche für Woche individuell anhand von Diagnostiken, Zielen,
Verfügbarkeit, Trainingshistorie und freigegebenen Garmin-Daten. Jeden Samstag
füllt der Athlet einen Evaluationsbogen zu Belastung, Erholung, Beschwerden,
Motivation und Verfügbarkeit aus. Diese historische Rückmeldung erweitert das
Athletenprofil und fließt in die nächste Woche ein.

Jede erzeugte Woche und wesentliche Anpassung bleibt mit Eingabestand,
Begründung sowie Modell- und Regelversion nachvollziehbar. Fachliche
Belastungsgrenzen und definierte Eskalationsfälle verhindern, dass unvollständige
Daten oder Gesundheitswarnzeichen unkontrolliert die Belastung erhöhen.

### 5. Menschliches Pro-Coaching und Mentaltraining

Ein späteres Pro-Angebot kann regelmäßige menschliche Coach-Reviews,
1:1-Kommunikation und persönliche Zielsteuerung ergänzen. Mentaltrainingspläne
werden als eigener, fachlich verantworteter Inhaltstyp aufgebaut und nicht als
unbelegte automatische Empfehlung in bestehende Diagnostiken gemischt.

### 6. Integrationen und mobile Apps

Garmin und weitere Sportplattformen können später Aktivitäten, Belastung und
Erledigungsstatus synchronisieren. Verknüpfungen bleiben freiwillig, verwenden
minimale Berechtigungen und können jederzeit getrennt werden.

Web bleibt zunächst der primäre Produktkanal. Spätere Apps für iOS und Android
sollen dieselbe Fachlogik, dieselben Konten und dieselben Freischaltungen nutzen.
Die Zielrichtung steht in der [Mobile-Roadmap](architecture/mobile-roadmap.md).

## Geschäftsmodell

Die geplante Entwicklung folgt drei Ebenen:

1. **Einzelkauf:** ein veröffentlichter Schwimm-Attributplan wird für 4,99 EUR
	einmalig erworben.
2. **Gruppencoaching:** für 12,99 EUR pro Monat zeitlich begrenzter Zugang zur
	coach-kuratierten Trainingsbibliothek mit Selbstwahl.
3. **Individuelles KI-Coaching:** wöchentlich adaptive persönliche Planung aus
	Profil, Garmin-Daten, Trainingsverlauf und Samstags-Evaluation.

Die Preise für Schwimm-Attributpläne und Gruppencoaching sind beschlossen. Der
Preis des individuellen KI-Coachings, Produktnamen, steuerliche Darstellung und
weitere Leistungsgrenzen bleiben offen. Preise werden versioniert am jeweiligen
Angebot geführt und nicht fest in Planinhalte oder Client-Anwendungen eingebaut.

## Produktprinzipien

- **Diagnostik führt zu Handlung:** Jeder Report soll einen nachvollziehbaren nächsten Schritt anbieten.
- **Geschlossener Trainingskreislauf:** Planabschluss führt zu Re-Diagnostik oder Folgeplan statt in eine Sackgasse.
- **Coach in the loop:** KI erstellt Entwürfe; fachlich relevante Veröffentlichung benötigt menschliche Freigabe.
- **Unveränderliche Veröffentlichung:** Käufer behalten genau die Planversion, die sie erworben haben.
- **Provider-neutrale Freischaltung:** Zugriff hängt nicht direkt von Stripe, Apple oder Google ab.
- **Datensparsamkeit:** Körper-, Leistungs- und Integrationsdaten werden nur für klar erklärte Zwecke verarbeitet.
- **Sichere Mandantentrennung:** Nutzer sehen eigene Daten; Coaches nur ausdrücklich zugeordnete Athleten.
- **Plattformunabhängige Fachlogik:** Berechnungen, Typen und Validierung bleiben von Web- und Mobile-Oberflächen getrennt.
- **Messbarer Nutzen:** Produktentscheidungen orientieren sich an Aktivierung, Planfortschritt, Abschluss und Re-Diagnostik statt nur an Registrierungen.

Der verbindliche Vertrag für Zugriffsfristen und adaptive Wochenplanung steht in
[Trainingspläne, Gruppencoaching und individuelles KI-Coaching](features/coaching-business-model.md).

## Nicht-Ziele des nächsten Meilensteins

Der erste Verkauf statischer Schwimmpläne implementiert technisch noch kein Gruppencoaching-Abo, keine
Community, keine KI-Generierung, kein 1:1-Coaching, kein Mentaltraining, keine
Garmin-Synchronisierung und keine native App. Diese Fähigkeiten werden bei
Datenmodell und Zugriffsrechten berücksichtigt, ohne den ersten Umsatzpfad zu
überladen.

Die fachliche Ausgestaltung der Attributpläne und der Radar-Prognose steht in
[Attributpläne im fortgeschrittenen Schwimmreport](features/advanced-swim-report-plans.md).