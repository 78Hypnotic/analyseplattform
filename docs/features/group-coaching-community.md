# Gruppencoaching-Community

Status: MVP in Umsetzung
Stand: 20.08.2026

## Ziel

Die Plattform bietet eine eigene Community für das Gruppencoaching. Sie ersetzt
im ersten Schritt die Kernfunktion einer externen Circle-Community: Athleten
können sich innerhalb ihrer aktiven Coach-Gruppe austauschen, Fragen stellen und
Erfahrungen aus dem Trainingsblock teilen.

Die Community gehört zu einer `coach_plan_libraries`-Bibliothek. Sie gehört
nicht zu einzelnen Planversionen und nicht zu separat gekauften statischen
Trainingsplänen.

## MVP-Scope

- eine Themenliste pro Coach-Bibliothek,
- ein Startbeitrag pro Thema,
- chronologische Antworten,
- Formular zum Erstellen neuer Themen und Antworten,
- Moderation durch Coach und Admin,
- vollständige Sperre ohne aktive Gruppencoaching-Membership.

Der MVP ist bewusst kein Chat. Echtzeitkommunikation, Direktnachrichten,
Reactions, Push- oder E-Mail-Benachrichtigungen, Challenges und Circle-Importe
sind spätere Ausbaustufen.

## Rollen und Zugriff

| Rolle | Lesen | Schreiben | Moderieren |
| --- | --- | --- | --- |
| Nicht angemeldet | nein | nein | nein |
| Nutzer ohne aktive Membership | nein | nein | nein |
| Nutzer mit abgelaufener Membership | nein | nein | nein |
| Aktives Mitglied | ja | ja | nein |
| Coach der Bibliothek | ja | ja | ja |
| Fremder Coach | nein | nein | nein |
| Admin | ja | ja | ja |

Der Zugriff wird serverseitig über Supabase RLS geprüft. Clients dürfen weder
aus UI-Zustand noch aus einem lokalen Abo-Flag Community-Zugriff ableiten.

## Datenmodell

Die Migration `20260820103000_group_coaching_community.sql` führt zwei Tabellen
ein:

- `community_threads` für Themen mit `library_id`, `author_id`, `title`,
  `content`, `status` und Moderationsfeldern,
- `community_replies` für Antworten mit `thread_id`, `author_id`, `content`,
  `status` und Moderationsfeldern.

Entfernte Inhalte werden nicht hart gelöscht. Sie bleiben als `removed`
markiert, speichern optional einen Moderationsgrund und werden in der UI als
neutraler Platzhalter angezeigt.

## Akzeptanzkriterien

- Ein aktives Mitglied sieht genau die Community seiner aktiven Bibliothek.
- Ein Mitglied ohne aktive Membership sieht keine alten Themen oder Antworten.
- Ein Coach sieht und moderiert die Community seiner eigenen Bibliothek.
- Ein fremder Coach erhält keinen Zugriff.
- Ein Admin kann Bibliotheken auswählen und deren Communities moderieren.
- Neue Themen und Antworten laufen über Server Actions mit Zod-Validierung,
  Rate Limit und Supabase RLS.
- Entfernte Inhalte bleiben auditierbar, werden aber nicht mehr als Beitragstext
  dargestellt.