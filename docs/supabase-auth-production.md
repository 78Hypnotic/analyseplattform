# Supabase Auth Production Setup

## Custom SMTP einrichten

Supabase Built-in E-Mail ist nur für Tests gedacht und aktuell auf sehr wenige Auth-E-Mails begrenzt. Für Produktion:

1. E-Mail-Anbieter wählen, zum Beispiel Resend, Postmark, Mailgun oder AWS SES.
2. Versanddomain beim Anbieter verifizieren.
3. DNS setzen: SPF, DKIM und optional DMARC.
4. SMTP-Zugangsdaten im Anbieter erzeugen.
5. Supabase öffnen: `Authentication > Settings > SMTP Settings`.
6. Custom SMTP aktivieren.
7. Werte eintragen:
   - Sender email: `no-reply@deine-domain.de`
   - Sender name: `Trainingsanalyse`
   - Host: vom Anbieter
   - Port: meist `587`
   - Username: vom Anbieter
   - Password: vom Anbieter
8. Testmail senden.
9. Supabase öffnen: `Authentication > Rate Limits`.
10. `Email sent` passend erhöhen, zum Beispiel für MVP `50-100/hour`.

## Leaked Password Protection

1. Supabase öffnen: `Authentication > Security` oder `Authentication > Password Security`.
2. Mindestlänge mindestens `8`, besser `10-12` Zeichen setzen.
3. `Leaked Password Protection` aktivieren.
4. Hinweis: Diese Funktion ist laut Supabase auf Pro Plan und höher verfügbar.

## Auth URLs

In Supabase `Authentication > URL Configuration` prüfen:

- Site URL: `https://analyseplattform.vercel.app`
- Redirect URLs:
  - `https://analyseplattform.vercel.app/auth/callback`
  - `https://analyseplattform.vercel.app/reset-password/update`
  - lokale Dev-URL nur bei Bedarf: `http://localhost:3000/auth/callback`

## Cookie- und Tracking-Entscheidung

Aktuell keine Analytics-/Marketing-Cookies. Kein Cookie-Banner nötig, solange nur technisch notwendige Auth-Cookies verwendet werden. Bei späterem Analytics zuerst Consent-Management und Datenschutzerklärung aktualisieren.
