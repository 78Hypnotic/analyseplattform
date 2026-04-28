import { Waves } from "lucide-react";
import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--header-bg)] print:hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--brand-bg)] text-[var(--brand-fg)]">
              <Waves size={18} />
            </span>
            <div>
              <p className="font-semibold">Trainingsanalyse</p>
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
                Endurance Coaching
              </p>
            </div>
          </div>
          <p className="muted mt-4 max-w-sm text-sm leading-6">
            Datenbasiertes Coaching für Schwimmen, Laufen, Radfahren und Triathlon.
          </p>
        </div>
        <FooterCol
          title="Produkt"
          links={[
            { label: "Disziplinen", href: "/#disciplines" },
            { label: "Preise", href: "/#preise" },
            { label: "Roadmap", href: "/#faq" },
          ]}
        />
        <FooterCol
          title="Ressourcen"
          links={[
            { label: "Methodik", href: "/#methodik" },
            { label: "FAQ", href: "/#faq" },
            { label: "Cookies", href: "/cookies" },
          ]}
        />
        <FooterCol
          title="Unternehmen"
          links={[
            { label: "Kontakt", href: "mailto:manuel.hohlwegler@gmx.de" },
            { label: "Impressum", href: "/impressum" },
            { label: "Datenschutz", href: "/datenschutz" },
          ]}
        />
      </div>
      <div className="mx-auto flex max-w-6xl justify-between border-t border-[var(--line)] px-5 py-5 text-xs text-[var(--subtle)]">
        <span>2026 Trainingsanalyse</span>
        <span>v0.4 beta</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <p className="mono mb-3 text-xs uppercase tracking-[0.16em] text-[var(--subtle)]">{title}</p>
      <ul className="space-y-2 text-sm text-[var(--muted)]">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="hover:text-[var(--foreground)]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
