# Communities

Status: Umbau auf Chat-Kanäle umgesetzt
Stand: 20.08.2026

## Ziel

Die Plattform bietet Community-Chats. Der Einstieg unter `/community` ist eine
flache Linkliste; ein Klick öffnet direkt den Nachrichtenverlauf unter
`/community/[slug]`. Es gibt keine verschachtelte Themen- oder Thread-Navigation
mehr.

Es existieren zwei Arten von Communities:

- **Plattform-Community** (`kind = 'platform'`, Slug `plattform`): genau eine,
  offen für alle angemeldeten Nutzer.
- **Coach-Community** (`kind = 'coach'`): eine pro Coach, gekoppelt an dessen
  `coach_plan_libraries`-Bibliothek, für das Gruppencoaching.

## Scope

- ein fortlaufender Nachrichtenstrom pro Community,
- Cursor-Pagination über `?before=<timestamp>` in 50er-Seiten,
- bis zu vier Bildanhänge pro Nachricht,
- Moderation durch Coach und Admin per Soft-Delete,
- Entfernen eigener Nachrichten durch den Autor,
- Admin-Oberfläche für Gruppencoaching-Mitgliedschaften unter
  `/admin/communities`.

Kein Realtime. Der Verlauf aktualisiert sich über `revalidatePath` beim Senden,
nicht per Push. Direktnachrichten, Reactions, Ungelesen-Zähler und
Benachrichtigungen sind spätere Ausbaustufen.

## Rollen und Zugriff

Plattform-Community:

| Rolle | Lesen | Schreiben | Moderieren |
| --- | --- | --- | --- |
| Nicht angemeldet | nein | nein | nein |
| Angemeldeter Nutzer | ja | ja | nein |
| Admin | ja | ja | ja |

Coach-Community:

| Rolle | Lesen | Schreiben | Moderieren |
| --- | --- | --- | --- |
| Nicht angemeldet | nein | nein | nein |
| Nutzer ohne Bezug zum Coach | nein | nein | nein |
| Aktive Gruppencoaching-Membership | ja | ja | nein |
| Zugeordneter Athlet (`coach_athletes`) | ja | ja | nein |
| Coach der Bibliothek | ja | ja | ja |
| Fremder Coach | nein | nein | nein |
| Admin | ja | ja | ja |

Der Zugriff wird serverseitig über Supabase RLS geprüft
(`can_access_community`, `can_moderate_community`). Clients dürfen weder aus
UI-Zustand noch aus einem lokalen Abo-Flag Community-Zugriff ableiten.

Bildanhänge laufen über denselben Community-Zugriff und sind ohne Berechtigung
nicht als öffentliche Bucket-URL abrufbar.

## Datenmodell

Die Migration `20260820180000_community_channels.sql` führt ein:

- `communities` mit `kind`, `slug`, `name`, `description`, `coach_id`,
  `library_id`, `is_active`. Partielle Unique-Indizes erzwingen genau eine
  Plattform-Community und höchstens eine Community pro Coach.
- `community_messages` mit `community_id`, `author_id`, `content`, `status`
  (`published` / `removed`) und Moderationsfeldern.
- Trigger `coach_plan_libraries_sync_community`: legt die Coach-Community
  automatisch an und hält Slug, Beschreibung und Aktivstatus synchron.
- Backfill der Altdaten: `community_threads` (Titel als erste Zeile) und
  `community_replies` werden zu `community_messages`, wobei die alten IDs als
  Message-IDs übernommen werden.
- `community_attachments` hängt jetzt an `message_id`; `thread_id` und
  `reply_id` sind entfallen.

Die Alt-Tabellen `community_threads` und `community_replies` bleiben vorerst
lesbar, sind aber nicht mehr beschreibbar. Sie werden in einer Folgemigration
entfernt, sobald der Backfill produktiv verifiziert ist.

Erlaubt sind JPG, PNG und WebP bis 5 MB pro Datei, maximal vier Bilder pro
Nachricht. Der private Bucket `community-attachments` und die Signed URLs
stammen unverändert aus `20260820143000_community_attachments.sql`.

Entfernte Nachrichten werden nicht hart gelöscht. Sie bleiben als `removed`
markiert, speichern optional einen Moderationsgrund und erscheinen in der UI als
neutraler Platzhalter. Der Grund ist nur für Moderatoren sichtbar.

## Mitgliedschaften

`group_coaching_memberships` steuert den Zugang zur Coach-Community. Die Tabelle
wird unter `/admin/communities` gepflegt: freischalten, Status ändern
(`active`, `paused`, `cancelled`, `expired`), entfernen. Zusätzlich erhalten
Athleten aus `coach_athletes` automatisch Zugang zur Community ihres Coaches.

## Akzeptanzkriterien

- `/community` listet Communities als Links; ein Klick öffnet den Chat.
- Jeder angemeldete Nutzer sieht mindestens die Plattform-Community.
- Ein Nutzer ohne Bezug zu einem Coach sieht dessen Community nicht.
- Ein Coach sieht und moderiert die eigene Community; ein fremder Coach nicht.
- Nachrichten laufen über Server Actions mit Zod-Validierung, Rate Limit und
  Supabase RLS.
- Bildanhänge werden privat gespeichert und nur über berechtigte Signed URLs
  ausgeliefert.
- Entfernte Nachrichten bleiben auditierbar, werden aber nicht mehr als
  Nachrichtentext dargestellt.
- Alte Thread-URLs `/community/[slug]/threads/[threadId]` leiten dauerhaft auf
  den Chat um.
