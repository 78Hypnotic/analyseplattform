# Produktvision: Von der Diagnostik zur Trainingsplattform

Stand: 18.08.2026

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
- **Mitglieder** erhalten später im Monatsabo Zugang zu einer Planbibliothek und Community.
- **Pro-Athleten** erhalten später individuelle Betreuung und 1:1-Coaching.
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

Der verbindliche Umfang steht in
[Statische Trainingspläne verkaufen](features/static-training-plan-sales.md).

### 3. Membership und Community

Ein späteres Monatsabo kann eine kuratierte Planbibliothek, laufende Inhalte,
Community-Funktionen und gemeinsame Challenges bündeln. Paketnamen, Preise,
Kündigungsregeln und konkrete Community-Funktionen werden erst nach Validierung
des Einzelplanverkaufs festgelegt.

### 4. KI-unterstützte Trainingsplanung

KI kann Diagnostiken, Ziele, verfügbare Trainingstage und Trainingshistorie in
einen Planentwurf übersetzen. Ein solcher Entwurf wird nicht ungeprüft
veröffentlicht. Ein qualifizierter Coach prüft Änderungen, dokumentiert die
Freigabe und bleibt fachlich verantwortlich. Herkunft, Modell-/Regelversion,
Änderungen und Freigabe müssen nachvollziehbar bleiben.

### 5. Pro-Coaching und Mentaltraining

Ein Pro-Abo kann individuelle Plananpassung, regelmäßige Coach-Reviews,
1:1-Kommunikation und persönliche Zielsteuerung enthalten. Mentaltrainingspläne
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

1. **Einzelkauf:** ein veröffentlichter Trainingsplan wird einmalig erworben.
2. **Membership:** wiederkehrender Zugang zu Plänen und Community.
3. **Pro:** persönliche Betreuung, individuelle Planung und Coach-Leistungen.

Konkrete Preise, Produktnamen und Leistungsgrenzen sind noch nicht beschlossen.
Sie werden versioniert am jeweiligen Angebot geführt und nicht fest in
Planinhalte oder Client-Anwendungen eingebaut.

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

## Nicht-Ziele des nächsten Meilensteins

Der Verkauf statischer Schwimmpläne implementiert noch kein Monatsabo, keine
Community, keine KI-Generierung, kein 1:1-Coaching, kein Mentaltraining, keine
Garmin-Synchronisierung und keine native App. Diese Fähigkeiten werden bei
Datenmodell und Zugriffsrechten berücksichtigt, ohne den ersten Umsatzpfad zu
überladen.