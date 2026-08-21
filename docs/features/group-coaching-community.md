# Communities

Status: Kanäle je Community umgesetzt
Stand: 21.08.2026

## Ziel

Die Plattform bietet Community-Chats mit Themenkanälen. Der Einstieg unter
`/community` ist eine flache Linkliste der Communities; ein Klick öffnet den
Standardkanal. Innerhalb einer Community navigiert eine Sidebar zwischen den
Kanälen (`/community/[slug]/[channelSlug]`).

Es existieren zwei Arten von Communities:

- **Plattform-Community** (`kind = 'platform'`, Slug `plattform`): genau eine,
  offen für alle angemeldeten Nutzer.
- **Coach-Community** (`kind = 'coach'`): eine pro Coach, gekoppelt an dessen
  `coach_plan_libraries`-Bibliothek, für das Gruppencoaching.

Jede Community startet mit vier Kanälen: `news`, `allgemein` (Standard),
`vorstellungsrunde` und `links`.

## Kanaltypen

| Typ | Zweck | Schreibrecht |
| --- | --- | --- |
| `chat` | offener Nachrichtenstrom | alle Mitglieder |
| `announcement` | News und Ankündigungen | nur Coach der Community und Admin |
| `intro` | Vorstellungsrunde als Karten-Grid | alle Mitglieder, ein veröffentlichter Beitrag pro Person (bearbeitbar) |
| `links` | kuratierte Linksammlung | alle Mitglieder, Einträge in `community_links` statt Nachrichten |

Die Regeln liegen in der Datenbank (`can_post_in_channel`,
`can_contribute_link`) und gelten damit auch für direkte API-Zugriffe, nicht nur
für die UI.

## Scope

- ein fortlaufender Beitragsstrom pro Kanal,
- Cursor-Pagination über `?before=<timestamp>` in 50er-Seiten,
- bis zu vier Bildanhänge pro Nachricht,
- Moderation durch Coach und Admin per Soft-Delete,
- Entfernen eigener Beiträge durch den Autor,
- Kanalverwaltung für Moderatoren unter `/community/[slug]/einstellungen`
  (anlegen, umbenennen, sortieren, deaktivieren),
- Dashboard-Kachel „Neues aus der Community“ mit den letzten Beiträgen aus allen
  zugänglichen Kanälen,
- Admin-Oberfläche für Gruppencoaching-Mitgliedschaften unter
  `/admin/communities`.

Kein Realtime. Der Verlauf aktualisiert sich über `revalidatePath` beim Senden,
nicht per Push. Direktnachrichten, Reactions, Ungelesen-Zähler und
Benachrichtigungen sind spätere Ausbaustufen. Eine Community-Karte ist bewusst
nicht Teil des Scopes.

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

Die Migration `20260821120000_community_channel_topics.sql` ergänzt die
Kanalebene:

- `community_channels` mit `community_id`, `slug`, `name`, `description`, `type`,
  `sort_order`, `is_default`, `is_active`. Der Slug wird per Trigger aus dem
  Namen abgeleitet (`resolve_community_channel_slug`) und ist je Community
  eindeutig; `threads` und `einstellungen` sind als Routennamen gesperrt.
- `community_messages.channel_id` mit Verbundschlüssel auf `(id, community_id)`,
  damit eine Nachricht nie in einen fremden Kanal zeigt. Bestandsnachrichten
  wandern in den Standardkanal `allgemein`.
- `community_links` für die Linksammlung, inklusive Soft-Delete und einem
  `^https?://`-Check auf der URL.
- View `community_channel_activity` (security invoker) für Beitragszahl und
  letzte Aktivität je Kanal.
- `ensure_default_community_channels` legt die vier Startkanäle an und wird auch
  vom Trigger `coach_plan_libraries_sync_community` für neue Coach-Communities
  aufgerufen.
- Trigger `community_channels_protect_update` friert Community, Typ und
  Standardflag eines Kanals ein und verhindert das Deaktivieren des
  Standardkanals.

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

- `/community` listet Communities als Links; ein Klick öffnet den Standardkanal.
- Jeder angemeldete Nutzer sieht mindestens die Plattform-Community.
- Ein Nutzer ohne Bezug zu einem Coach sieht dessen Community nicht.
- Ein Coach sieht und moderiert die eigene Community; ein fremder Coach nicht.
- Kanäle legen nur Moderatoren an: Admins in jeder Community, Coaches nur in
  ihrer eigenen.
- In `announcement`-Kanälen scheitert ein Insert normaler Mitglieder an der RLS,
  nicht erst an der UI.
- In `intro`-Kanälen ist genau ein veröffentlichter Beitrag pro Person möglich;
  der eigene Beitrag bleibt bearbeitbar.
- Links werden nur mit `http`- oder `https`-Schema akzeptiert und mit
  `rel="noopener noreferrer nofollow"` gerendert.
- Beiträge laufen über Server Actions mit Zod-Validierung, Rate Limit und
  Supabase RLS.
- Bildanhänge werden privat gespeichert und nur über berechtigte Signed URLs
  ausgeliefert.
- Entfernte Beiträge bleiben auditierbar, werden aber nicht mehr als Text
  dargestellt.
- Alte Thread-URLs `/community/[slug]/threads/[threadId]` leiten dauerhaft auf
  den Standardkanal um.
- Die Dashboard-Kachel zeigt nur Beiträge aus Kanälen, auf die der Nutzer
  Zugriff hat.
