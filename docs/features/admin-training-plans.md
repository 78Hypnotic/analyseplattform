# Admin-Rollen und Trainingsplan-Builder

## Rollenmodell

Die Plattform nutzt drei Rollen:

- `user`: normale Nutzer mit Zugriff auf eigene Analysen
- `coach`: Trainer mit read-only Zugriff auf zugeordnete Athleten
- `admin`: Zugriff auf Admin-Bereich und Trainingsplan-Builder

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

Admins verwalten Pläne unter `/admin/plans`.

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

`is_active` veröffentlicht heute nur die Vorschau. Es ist noch keine verkaufbare,
unveränderliche Planversion und keine Freischaltung für einen einzelnen Nutzer.

## Report-Verknüpfung

Die Analyse berechnet einen empfohlenen Plan-Slug:

- `wasserlage-balance`
- `vo2max-builder`
- `vlamax-senker`
- `tempohaerte`

Der Report lädt die passende aktive Planvorlage und zeigt nur die gesperrte
Vorschau. Der CTA besitzt noch keine Kauf- oder Freischaltungslogik.

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
