# Dependency Audit

Stand: 2026-04-26

`npm audit --audit-level=moderate` meldet zwei moderate Findings über `next -> postcss <8.5.10`.

Der von npm vorgeschlagene Fix ist `npm audit fix --force`, würde aber `next@9.3.3` installieren und damit die App Router App brechen. Der sichere Pfad ist, Next.js auf der aktuellen stabilen Linie zu halten und den Advisory erneut zu prüfen, sobald Vercel/Next eine gepatchte Version der transitiven PostCSS-Abhängigkeit ausliefert.
