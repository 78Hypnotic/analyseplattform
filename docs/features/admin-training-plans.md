# Admin-Rollen und Trainingsplan-Builder

## Rollenmodell

Die Plattform nutzt drei Rollen:

- `user`: normale Nutzer mit Zugriff auf eigene Analysen
- `coach`: Trainer mit Zugriff auf zugeordnete Athleten, eigene Planvorlagen und eigene Bibliothek
- `admin`: Zugriff auf Admin-Bereich sowie alle Planvorlagen und Bibliotheken

Rollen liegen in `public.user_roles`. Normale Nutzer dürfen ihre Rolle nur lesen,
aber nicht schreiben. Admin-Rechte werden DB-only vergeben:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'manuel.hohlwegler@gmx.de'
on conflict (user_id, role) do nothing;
```

Der RLS-Helfer `public.is_admin()` wird in Policies genutzt und verhindert, dass
ein Nutzer sich über Client-Zugriff selbst hochstuft.

Admin-Aktionen wie das serverseitige Anlegen bestätigter User benötigen in der
Deployment-Umgebung `SUPABASE_SECRET_KEY` oder alternativ den Legacy-Key
`SUPABASE_SERVICE_ROLE_KEY`. Diese Keys dürfen nicht mit `NEXT_PUBLIC_`
prefixt werden.

## Planvorlagen

Coaches und Admins verwalten Pläne unter `/trainingsplaene/verwalten`.
Coaches sehen und bearbeiten ausschließlich eigene Vorlagen. Admins sehen alle
Vorlagen. Der erste Builder-Meilenstein unterstützt bewusst nur Schwimmen.

Ein Datensatz in `training_plans` ist aktuell eine editierbare Planvorlage. Sie
besteht aus:

- Basisdaten: Slug, Titel, Fokus, Phase, Niveau, Zielstrecken, Wochen
- `summary`: interne und sichtbare Kurzbeschreibung
- `preview`: gesperrte Vorschau im Report
- `content`: strukturierter Builder mit Wochen, Einheiten, Blöcken/Sets und Drills
- `is_active`: Veröffentlichung für Report-Vorschauen

Aktive Pläne können von eingeloggten Nutzern als gesperrte Vorschau gelesen
werden. Vollständiges Anlegen, Bearbeiten, Aktivieren und Löschen ist Admins
vorbehalten.

Speichern verändert nur die Vorlage. Der getrennte Befehl „Veröffentlichen“
erzeugt eine unveränderliche `training_plan_versions`-Version. Eine spätere
Änderung der Vorlage verändert keine veröffentlichte Version; erneutes
Veröffentlichen erzeugt die nächste Versionsnummer.

## Report-Verknüpfung

Die Analyse berechnet einen empfohlenen Plan-Slug:

- `wasserlage-balance`
- `vo2max-builder`
- `vlamax-senker`
- `tempohaerte`

Der Report lädt die passende aktive Planvorlage und zeigt nur die gesperrte
Vorschau. Der CTA besitzt noch keine Kauf- oder Freischaltungslogik.

Für das beschlossene Zielmodell des fortgeschrittenen Schwimmreports erstellt
beziehungsweise prüft ein Coach für jedes Radar-Attribut einen eigenen, in der
Regel vierwöchigen Plan. Veröffentlichte Attributpläne benötigen Zielattribut,
Coach-Autorenschaft, fachliche Freigabe und eine begründete Zielveränderung für
die Radar-Prognose. Bis ein eigener Coach-Freigabeworkflow umgesetzt ist, bleibt
die technische Veröffentlichung eine Admin-Aktion.

Der vollständige fachliche Vertrag steht in
[Attributpläne im fortgeschrittenen Schwimmreport](advanced-swim-report-plans.md).

## Gruppenbibliothek

Veröffentlichte Planversionen werden einer vom jeweiligen Coach kuratierten
Gruppencoaching-Bibliothek zugeordnet. Die Bibliothek verweist auf
unveränderliche Versionen und enthält Sichtbarkeit, Eignung und Sortierung; sie
dupliziert keine Planinhalte. Coaches pflegen die fachliche Auswahl, während
Abonnements ausschließlich das zeitlich begrenzte Zugriffsrecht steuern.

Der Einstieg liegt unter `/trainingsplaene`. Nutzer ohne aktive Membership sehen
eine Sperrseite ohne Bibliotheksinhalt. Athleten mit aktiver Membership wählen
Bibliothekspläne selbst. Das Ende eines Abos entfernt keine
Trainingshistorie, sperrt aber den weiteren Zugriff auf die über das Abo
bereitgestellten Inhalte. Einzelkäufe bleiben davon unabhängig. Details stehen
in [Trainingspläne, Gruppencoaching und individuelles KI-Coaching](coaching-business-model.md).

## Nächster Meilenstein

Für den Verkauf wird die bestehende Vorlage nicht direkt an einen Käufer
gebunden. Stattdessen gilt:

1. Ein Admin pflegt die editierbare Planvorlage.
2. Eine Veröffentlichung erzeugt eine unveränderliche Planversion.
3. Ein Angebot verbindet diese Version mit Preis und Verfügbarkeit.
4. Ein verifizierter Zahlungsnachweis erzeugt eine provider-neutrale Freischaltung.
5. Der Kunde terminiert daraus seinen persönlichen Plan und seine Einheiten.

Damit bleiben frühere Käufe unverändert, wenn ein Admin die Vorlage später
bearbeitet. Der vollständige Vertrag steht in
[Statische Trainingspläne verkaufen](static-training-plan-sales.md).

## Spätere Planerstellung

KI kann später aus Diagnostik, Zielen und Verfügbarkeit einen Planentwurf
erstellen. Ein solcher Entwurf erhält vor Veröffentlichung eine nachvollziehbare
Coach-Freigabe. Modell-/Regelversion, Änderungen, prüfender Coach und
Freigabezeitpunkt werden protokolliert. Ungeprüfte KI-Entwürfe sind keine
veröffentlichten Planversionen.

Im späteren Pro-Modell können Coaches persönliche Pläne zugeordneter Athleten
anpassen. Diese Schreibrechte gehören nicht zum ersten Planverkaufsmeilenstein.

## Checks

Nach Schema- oder Policy-Änderungen ausführen:

```bash
npm test
npx tsc --noEmit
npm run build
npm audit --audit-level=moderate
```

Danach Supabase Advisors prüfen:

- Security Advisor
- Performance Advisor
