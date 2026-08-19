# Schwimmplattform: Roadmap

Dieses Diagramm visualisiert die nächsten Produktmeilensteine. Es kann in VS Code mit einer Mermaid-Erweiterung oder in der Markdown-Vorschau angezeigt werden.

```mermaid
flowchart TD
    start(["Aktueller Stand: Diagnostik zu 75% fertig"])
    finishDiag["Diagnostik auf 100% bringen"]
    profile["Technikprofil mit priorisiertem Verbesserungsattribut"]
    catalog["Statische Schwimmplan-Bibliothek"]
    beginner(["Anfängerplan: Technik-Fundament"])
    advanced["Fortgeschrittenen-Attributpläne"]
    breathing["Atmung verbessern"]
    bodyLine["Wasserlage verbessern"]
    catchPlan["Catch und Zugphase verbessern"]
    legs["Beintechnik verbessern"]
    recommendation["Empfehlung und Vorschau im Report"]
    pricing["Einzelkauf: 4,99 EUR"]
    subscription["Später: Monatsabo 12,99 EUR"]
    decision{"Plan ausgewählt?"}
    sales["Stripe-Kauf und sichere Freischaltung"]
    scheduling["Startdatum und Trainingstage"]
    training["Persönlicher Trainingsplan"]
    athleteView["Athletenansicht: Plan, Workouts und Fortschritt"]
    complete["Workout abhaken und serverseitig speichern"]
    retest["Abschluss und Re-Diagnostik"]
    beta["Betatest mit Anfängern und Fortgeschrittenen"]
    release{"Recht, Datenschutz und Technik freigegeben?"}
    blocked["Release-Blocker beheben"]
    early(["Begrenzter Early Access"])
    garmin(["Später: Garmin-Synchronisation"])
    cycle["Trainingszyklus validiert"]
    community(["Nächster Schritt: Community"])

    start ==> finishDiag
    finishDiag ==> profile
    profile ==> catalog
    catalog --> beginner
    catalog --> advanced
    advanced --> breathing
    advanced --> bodyLine
    advanced --> catchPlan
    advanced --> legs
    beginner --> recommendation
    breathing --> recommendation
    bodyLine --> recommendation
    catchPlan --> recommendation
    legs --> recommendation
    recommendation --> pricing
    pricing --> decision
    subscription -.-> pricing
    decision -->|"Ja"| sales
    decision -.->|"Nein"| profile
    sales ==> scheduling
    scheduling ==> training
    training ==> athleteView
    athleteView ==> complete
    complete ==> retest
    retest -.->|"Nächster Zyklus"| profile
    beta -.->|"Parallel"| recommendation
    beta -.->|"Feedback"| finishDiag
    training --> release
    release -->|"Ja"| early
    release -->|"Nein"| blocked
    blocked -.-> finishDiag
    early -.->|"Nach stabiler Nutzung"| garmin
    early ==> cycle
    cycle ==> community

    style finishDiag fill:#FFE7B3,stroke:#C78A00,stroke-width:2px
    style catalog fill:#DDEBFF,stroke:#4D7DB8,stroke-width:2px
    style beginner fill:#DDF4E4,stroke:#4C956C,stroke-width:2px
    style advanced fill:#E9DDF7,stroke:#8157A6,stroke-width:2px
    style pricing fill:#DDEBFF,stroke:#4D7DB8,stroke-width:2px
    style sales fill:#DDEBFF,stroke:#4D7DB8,stroke-width:2px
    style release fill:#FFE7B3,stroke:#C78A00,stroke-width:2px
    style early fill:#DDF4E4,stroke:#4C956C,stroke-width:2px
```

## Produktlogik

- Der Anfängerplan ist der Einstieg ohne komplexe Diagnostik-Auswahl.
- Fortgeschrittene erhalten einen Plan für das priorisierte Technik-Attribut.
- Der Einzelkauf ist der erste Verkaufsmeilenstein.
- Das Monatsabo bleibt ein späterer Ausbau und ist kein Bestandteil des ersten Kauf-Slices.
- Betatest und Verkaufsentwicklung laufen parallel.
- Der Athlet kann den persönlichen Plan in der Plattform ansehen, Einheiten öffnen und Workouts abhaken.
- Garmin folgt erst nach stabiler manueller Nutzung; die Synchronisation braucht OAuth, Einwilligung, externe Aktivitäts-IDs, Idempotenz und eine nachvollziehbare Zuordnung zu Planeinheiten.
- Community startet erst nach einem validierten Zyklus aus Diagnostik, Empfehlung, Training und Re-Diagnostik mit echten Nutzern.
- Garmin ist dafür keine Voraussetzung und bleibt ein separater Integrationspfad.
