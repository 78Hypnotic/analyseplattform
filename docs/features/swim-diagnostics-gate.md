# Swim Diagnostics Gate

Die Schwimm-Analyse nutzt vor jeder physiologischen Auswertung ein Technik-Gate.
Standarddiagnostik ist nur belastbar, wenn der Athlet 400 m am Stück schwimmen
kann, ohne Hilfsmittel getestet wurde und die 400-m-Pace maximal 2:00 min/100 m
beträgt.

Der Analyseflow startet mit Testdaten und Testprotokoll. Der Trainingskontext
folgt im zweiten Schritt. Hilfsmittel werden in der UI nicht abgefragt; der
Flow zeigt nur den Hinweis, dass der Test ohne Pullbuoy, Neo oder Paddles
geschwommen werden muss. Das Feld `equipment` bleibt für alte Daten als Default
`ohne` erhalten.

Die Eingabe zeigt keine Technik-Gate- oder Technikklassen-Preview. Wenn 400 m
am Stück nicht möglich sind, entfallen sämtliche Testzeiten (50 m, 200 m und
400 m). Nur das Athletenprofil wird erfasst, der Kontextschritt wird
übersprungen und mit Defaults belegt (`goal: Kraulen lernen`,
`targetDistance: Becken`, `swimSessionsPerWeek: 3`, `level: Einsteiger`,
keine Challenges). Der Report erklärt danach den Technik-only-Modus und zeigt
den Anfängerplan; ohne Session führt der Weg vorher über das Login-Gate
(`/login?next=/analyse/new?resume=1`).

## Analysemodi

- `standard`: Gate gelb oder grün, vollständige CSS-, VO2-Proxy- und VLa-Proxy-Auswertung.
- `technique_only`: Gate rot, keine physiologische Auswertung, aber Technikfeedback und Planempfehlung.

Rot wird gesetzt bei:

- 400 m am Stück nicht möglich
- Hilfsmittel ungleich `ohne`
- 400-m-Pace über 2:00 min/100 m

Gelb wird gesetzt bei 400-m-Pace über 1:50 bis 2:00 min/100 m. Grün wird bei
maximal 1:50 min/100 m gesetzt.

Die zusätzliche Technikklasse wird aus der 400-m-Pace abgeleitet:

- keine 400 m oder Pace über 2:10: `Technik-Einsteiger`
- Pace über 2:00: `Technik in Aufbau`
- Pace über 1:50: `Solider Hobbyschwimmer`
- Pace über 1:40: `Ambitionierter Hobbyschwimmer`
- Pace über 1:30: `Starker Agegrouper`
- Pace bis 1:30: `Leistungsschwimmer`

## Berechnungen

- 50-m-Pace: `t50 * 2`
- 200-m-Pace: `t200 / 2`
- 400-m-Pace: `t400 / 4`
- CSS-Pace: `(t400 - t200) / 2`
- VO2-Proxy: `(t200 - ref200) / ref200`
- VLa-Proxy: `(pace400 - pace200) / pace200`

VO2-Proxy wird nur berechnet, wenn für Alter und Geschlecht Referenzwerte
vorliegen. Für `divers` bleiben Referenzindex und VO2-Proxy nicht ermittelbar.

## Trainingszonen

Die Zonen sind Prozentwerte der CSS-Pace nach Swim-Smooth-Methodik, nicht feste
Sekunden-Offsets. Dadurch skalieren sie mit dem Leistungsniveau und bleiben für
Einsteiger wie für schnelle Schwimmer sinnvoll.

- Z5 Sprint: 75-90 % der CSS-Pace
- Z4 VO2max: 90-97 %
- Z3 Schwelle: 97-110 %
- Z2 Grundlage: 110-120 %
- Z1 Recovery: 120-135 %

Die CSS liegt damit bewusst am schnellen Ende von Z3, nicht in dessen Mitte.
Z1 ist die breiteste, Z4 die schmalste Zone.

## Report-Ausgabe

Standardberichte zeigen CSS als Hauptbotschaft. VO2- und VLa-Proxies werden in
der sichtbaren Oberfläche nicht als Laborwerte ausgegeben, sondern als
qualitative Einordnung der aeroben und anaeroben Kapazität. Rohdaten,
Pace-Differenzen, Sprintreserve, Referenzwerte und Profil-Scores liegen im
eingeklappten Expertenmodus.

Technique-only Reports zeigen keine CSS-Hauptbotschaft. Sie erklären zuerst,
warum die physiologische Auswertung blockiert ist, und führen den Athleten zu
Technikfokus, Schwimm-Mechanik, Trainingshebel und ReTest. Liegen gar keine
Testzeiten vor, entfällt zusätzlich die Schwimm-Mechanik-Karte.

## Planempfehlung

Die aktuell implementierte Empfehlung verwendet folgende grobe Plan-Slugs:

- Technik-Gate rot: `wasserlage-balance`
- VO2-Proxy niedrig: `vo2max-builder`
- VLa-Profil Sprinter: `vlamax-senker`
- sonst: `tempohaerte`

Im Zielmodell des fortgeschrittenen Schwimmreports wird diese grobe Zuordnung
durch coach-geprüfte Pläne für die Radar-Attribute Wasserlage, Zugphase,
Druckphase, Rückführung, Rotation, Atmung, Beinarbeit und Wassergefühl
verfeinert. Der Report zeigt das als Nächstes priorisierte Attribut, den in der
Regel vierwöchigen Plan und eine coach-geprüfte Zielkontur im Radar. Der Plan
kostet einzeln 4,99 EUR oder ist bei aktivem Gruppencoaching-Abo für 12,99 EUR
ohne weiteren Einzelkauf aus der Trainingsbibliothek wählbar. Details stehen in
[Attributpläne im fortgeschrittenen Schwimmreport](advanced-swim-report-plans.md).

Nach dem Speichern wird die letzte Swim-Summary zusätzlich in `profiles`
gespiegelt, damit Profil und spätere Empfehlungen nicht die gesamte
Analysehistorie laden müssen.
