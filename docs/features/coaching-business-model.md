# Trainingspläne, Gruppencoaching und individuelles KI-Coaching

Status: Produktentscheidung
Stand: 19.08.2026

## Ziel

Die Plattform bietet drei klar getrennte Leistungsstufen. Sie unterscheiden
sich darin, wer den Plan auswählt, wie lange der Athlet Zugriff erhält und ob
das Training während der Nutzung individuell angepasst wird.

## 1. Statische Trainingspläne

Coaches erstellen fachlich geprüfte Trainingspläne und veröffentlichen
unveränderliche Versionen. Ein Athlet kauft einen konkreten Plan einmalig und
behält dauerhaft Zugriff auf genau diese Planversion.

Der Plan wird dem Profil hinzugefügt, terminiert und anhand seiner Einheiten
abgearbeitet. Neue Versionen oder andere Bibliothekspläne sind nicht automatisch
im Einzelkauf enthalten.

## 2. Gruppencoaching mit Trainingsbibliothek

Coaches bauen eine kuratierte Bibliothek aus veröffentlichten Trainingsplänen
auf. Ein Athlet mit aktiv bezahltem Gruppencoaching-Abo kann aus dieser
Bibliothek selbst einen passenden Plan auswählen, seinem Profil hinzufügen und
abarbeiten.

Der Bibliothekszugriff besteht nur bis zum Ende des bezahlten Abozeitraums. Nach
Ablauf oder Kündigung gilt:

- neue Bibliothekspläne können nicht mehr ausgewählt werden,
- Planinhalte aus dem Gruppenabo sind nicht mehr zugänglich,
- Fortschritt und absolvierte Einheiten bleiben als Athletenhistorie erhalten,
- bei erneuter Aktivierung kann der Zugriff wiederhergestellt werden, sofern
  der Plan weiterhin Teil der Bibliothek ist.

Ein Abo erzeugt damit kein dauerhaftes Eigentum an einzelnen Planversionen. Ein
separat gekaufter statischer Plan bleibt vom Aboende unberührt.

Ein Nutzer mit aktiver Membership kann eine veröffentlichte V2-Planversion aus
der Bibliothek seines Coaches öffnen, ein Startdatum sowie die erforderliche
Anzahl Trainingstage wählen und daraus atomar einen aktiven persönlichen Plan
mit datierten `user_plan_sessions` erzeugen. Die Dashboard-Kachel führt bei
fehlendem aktivem Plan direkt in diese Bibliothek. Nutzer ohne Membership sehen
statt der Inhalte weiterhin die Gruppencoaching-Sperrseite.

Bei einem aktiven Plan zeigt die Kachel den persistierten Fortschritt aus den
persönlichen Sessions und die nächste geplante Einheit. Erledigte Einheiten
zählen zum Planfortschritt; eine technische Verbesserung wird davon getrennt
erst durch einen ReTest festgestellt.

Die Zahlungsintegration für das Gruppencoaching ist davon getrennt und noch
nicht umgesetzt. Sie erzeugt beziehungsweise verlängert später ausschließlich
die Membership; die Planaktivierung vertraut nicht auf einen Client-Abo-Status.

Die Selbstwahl erfolgt aus einer gefilterten Bibliothek. Disziplin, Ziel,
Leistungsniveau, Dauer und Trainingshäufigkeit müssen sichtbar sein. Pläne, die
für das Profil des Athleten ungeeignet oder ausdrücklich ausgeschlossen sind,
dürfen nicht ohne deutlichen Hinweis gestartet werden.

## 3. Individuelles Coaching durch einen KI-Agenten

Das individuelle Coaching verwendet keinen unverändert durchlaufenden
Bibliotheksplan. Ein KI-Agent plant stattdessen Woche für Woche für genau einen
Athleten und passt die kommende Woche an dessen aktuellen Verlauf an.

Als Eingaben dienen mindestens:

- Ziele, Verfügbarkeit, Leistungsstand und bekannte Einschränkungen aus dem
  Athletenprofil,
- aktuelle Diagnostiken und bisherige Trainingshistorie,
- freigegebene Garmin-Aktivitäts- und Belastungsdaten,
- Erfüllung, Abweichungen und Rückmeldungen aus der vergangenen Trainingswoche,
- ein wöchentlicher Evaluationsbogen, den der Athlet jeden Samstag ausfüllt.

Der Samstagsbogen erfasst mindestens subjektive Belastung, Erholung, Müdigkeit,
Schmerzen oder Beschwerden, Motivation, Zeitverfügbarkeit und besondere
Ereignisse der vergangenen beziehungsweise kommenden Woche. Die Antworten
werden historisiert und erweitern das persönliche Athletenprofil, ohne ältere
Angaben rückwirkend zu überschreiben.

Nach Eingang der Daten erstellt der Agent den Vorschlag für die nächste
Trainingswoche. Jede erzeugte Woche speichert Eingabestand, Regel- und
Modellversion, Begründung der wesentlichen Anpassungen sowie den Zeitpunkt der
Freigabe. Nachträgliche Änderungen erzeugen eine neue Version und verändern
keine bereits absolvierte Woche.

Garmin-Daten werden nicht allein als Wahrheit behandelt. Fehlende oder
fehlerhafte Synchronisation darf nicht automatisch zu einer stärkeren Belastung
führen. Schmerz-, Krankheits- oder Überlastungshinweise lösen keine medizinische
Diagnose aus, sondern reduzieren beziehungsweise stoppen die automatische
Planung und führen in einen festzulegenden Klärungsweg.

## Abgrenzung der Zugriffsrechte

| Produkt | Planauswahl | Anpassung | Zugriff |
| --- | --- | --- | --- |
| Statischer Einzelplan | konkreter Plan beim Kauf | keine laufende Individualisierung | dauerhaft auf gekaufte Version |
| Gruppencoaching | Athlet aus Coach-Bibliothek | Auswahl eines bestehenden Plans | nur während bezahltem Abozeitraum |
| Individuelles KI-Coaching | Agent plant für den Athleten | wöchentlich anhand Profil, Garmin und Evaluation | nur während aktivem Coachingvertrag |

Zahlungsstatus, fachliche Freischaltung und persönliche Planinstanz bleiben
technisch getrennt. Clients dürfen Zugriff weder aus einem lokalen Abo-Flag noch
aus einer erfolgreichen Checkout-Rückleitung ableiten.

## Akzeptanzkriterien

- Ein Coach kann veröffentlichte Planversionen einer Gruppenbibliothek
  hinzufügen und daraus entfernen.
- Nur ein aktives, bezahltes Gruppencoaching-Abo gewährt Zugriff auf die
  vollständigen Bibliotheksinhalte.
- Ein Athlet kann geeignete Bibliothekspläne selbst auswählen und seinem Profil
  hinzufügen.
- Das Aboende sperrt Bibliotheksinhalte, löscht aber keine Trainingshistorie.
- Separat gekaufte Pläne bleiben nach Aboende zugänglich.
- Im individuellen Coaching wird jede Trainingswoche versioniert aus den
  zu diesem Zeitpunkt verfügbaren Daten erzeugt.
- Der Samstagsbogen wird als eigener, historischer Datensatz gespeichert und
  fließt nachvollziehbar in die nächste Wochenplanung ein.
- Garmin-Verknüpfung und Datennutzung sind freiwillig, widerrufbar und auf die
  erklärten Coachingzwecke begrenzt.
- Kritische Gesundheits- oder Datenqualitätsfälle führen nicht zu einer
  unkontrollierten automatischen Belastungssteigerung.

## Noch zu entscheiden

- Preis, Mindestlaufzeit und Kündigungsfrist des individuellen Coachings,
- genaue über die Planbibliothek hinausgehende Inhalte des
  Gruppencoaching-Abos für 12,99 EUR,
- Verhalten, wenn der Samstagsbogen verspätet oder gar nicht ausgefüllt wird,
- Zeitpunkt und Zeitzone für Fragebogen, Planung und Veröffentlichung der neuen
  Woche,
- fachliche Belastungsgrenzen und Regeln für automatische Anpassungen,
- Fälle, in denen ein menschlicher Coach prüfen oder übernehmen muss,
- Umfang, Aufbewahrung und Löschung von Garmin- und Evaluationsdaten,
- Kommunikation, Support und Gruppenbestandteile zusätzlich zur Planbibliothek.

Der Einzelverkauf baut auf
[Statische Trainingspläne verkaufen](static-training-plan-sales.md) auf. Die
Integrationsgrundsätze für Garmin stehen in der
[Mobile-Roadmap](../architecture/mobile-roadmap.md).
