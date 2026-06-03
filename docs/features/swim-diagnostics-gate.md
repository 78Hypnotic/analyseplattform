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
am Stück nicht möglich sind, wird der 400-m-Test ausgeblendet und erst der
Report erklärt den Technik-only-Modus.

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

## Report-Ausgabe

Standardberichte zeigen CSS als Hauptbotschaft. VO2- und VLa-Proxies werden in
der sichtbaren Oberfläche nicht als Laborwerte ausgegeben, sondern als
sportartspezifische Indizes für aerobe und anaerobe Kapazität. Rohdaten,
Pace-Differenzen, Sprintreserve, Referenzwerte und Profil-Scores liegen im
eingeklappten Expertenmodus.

Technique-only Reports zeigen keine CSS-Hauptbotschaft. Sie erklären zuerst,
warum die physiologische Auswertung blockiert ist, und führen den Athleten zu
Technikfokus, Schwimm-Mechanik, Trainingshebel und ReTest.

## Planempfehlung

- Technik-Gate rot: `wasserlage-balance`
- VO2-Proxy niedrig: `vo2max-builder`
- VLa-Profil Sprinter: `vlamax-senker`
- sonst: `tempohaerte`

Nach dem Speichern wird die letzte Swim-Summary zusätzlich in `profiles`
gespiegelt, damit Profil und spätere Empfehlungen nicht die gesamte
Analysehistorie laden müssen.
