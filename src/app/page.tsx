import Image from "next/image";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bike,
  Check,
  HelpCircle,
  LineChart,
  PersonStanding,
  Timer,
  Triangle,
  Waves,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/button";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <AppHeader />
      <main>
        <Hero />
        <Stats />
        <Disciplines />
        <HowItWorks />
        <Method />
        <ValueProps />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}

function Hero() {
  return (
    <section className="hero-grid-lines relative overflow-hidden border-b border-[var(--line)]">
      <Image
        src="/swimmer-top.jpg"
        alt="Schwimmer im Training"
        fill
        priority
        className="object-cover opacity-15"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c0d] via-[#0b0c0d]/94 to-[#0b0c0d]/82" />
      <div className="relative mx-auto min-h-[760px] max-w-6xl px-5 pb-28 pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mono inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-black/25 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              <span className="size-2 rounded-full bg-[var(--accent)] shadow-[0_0_0_4px_rgba(94,227,211,0.14)]" />
              Endurance Coaching · Live für Schwimmen
            </p>
            <h1 className="display-serif mt-6 max-w-3xl text-6xl leading-[0.95] text-white sm:text-8xl">
              Deine Zeit. Dein <em className="text-[var(--muted)]">Hebel.</em>{" "}
              <em className="text-[var(--accent)]">Klar.</em>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Bewährte Testprotokolle, klare Diagnose, konkrete Maßnahmen. Ohne
              Labor, ohne Datenflut. Zwei Testzeiten und zwei Zugzahlen ergeben
              einen verdichteten Coaching-Report.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/analyse/new" variant="primary" className="h-12 px-6">
                Kostenlose Analyse starten <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink href="/login" className="h-12 px-6">
                Account erstellen
              </ButtonLink>
            </div>
            <p className="mono mt-4 text-xs tracking-[0.14em] text-[var(--subtle)]">
              Ø 2 Minuten · keine Kreditkarte
            </p>
          </div>
          <ReportPreview />
        </div>
        <Stats />
      </div>
      <WaveEdge />
    </section>
  );
}

function Stats() {
  return (
    <div className="mt-24 grid gap-8 border-y border-[var(--line)] py-9 sm:grid-cols-2 lg:grid-cols-4">
      <Stat value="2 Tests" label="200 m + 400 m" />
      <Stat value="8 Metriken" label="Pace · DPS · SR · CSS · ..." />
      <Stat value="1 Hebel" label="Priorisiertes Hauptproblem" />
      <Stat value="6-8 Wo." label="Trainingsplan + ReTest" />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="display-serif text-4xl leading-none text-white sm:text-5xl">{value}</p>
      <p className="mono mt-2 text-xs uppercase tracking-[0.16em] text-[var(--subtle)]">
        {label}
      </p>
    </div>
  );
}

function ReportPreview() {
  return (
    <div className="surface rounded-[20px] bg-[color-mix(in_oklab,var(--panel)_92%,var(--accent)_8%)] p-7 shadow-2xl shadow-black/40">
      <div className="mb-6 flex items-center justify-between">
        <p className="mono text-[10px] uppercase tracking-[0.22em] text-[var(--subtle)]">
          Analyse-Ergebnis · Lena B.
        </p>
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-[#8fe388]">
          · Abgeschlossen
        </p>
      </div>
      <h2 className="display-serif text-3xl leading-tight">
        Du gewinnst auf <em>Frequenz</em> und verlierst <em>Länge</em>.
      </h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <PreviewMetric label="Pace 400" value="1:57" hint="/100 m" />
        <PreviewMetric label="CSS" value="1:55" hint="Schwelle" active />
        <PreviewMetric label="DPS 400" value="1.11" hint="m / Zug" />
      </div>
      <div className="mt-5 rounded-lg border border-[color-mix(in_oklab,var(--warn)_35%,var(--line))] bg-[rgba(245,194,107,0.06)] p-4">
        <p className="mono mb-2 inline-flex rounded bg-[rgba(245,194,107,0.12)] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[var(--warn)]">
          Hauptproblem
        </p>
        <h3 className="font-semibold">Wasserlage: die Hüfte liegt zu tief</h3>
        <p className="muted mt-2 text-sm leading-6">
          Beine sinken ab, Körper zieht nach unten. Jeder Zug kompensiert
          Bremseffekt statt Vortrieb zu erzeugen.
        </p>
      </div>
    </div>
  );
}

function PreviewMetric({
  label,
  value,
  hint,
  active,
}: {
  label: string;
  value: string;
  hint: string;
  active?: boolean;
}) {
  return (
    <div className={active ? "rounded-lg border border-[var(--accent)] bg-[rgba(94,227,211,0.08)] p-4" : "rounded-lg border border-[var(--line)] bg-black/20 p-4"}>
      <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">{label}</p>
      <p className={active ? "display-serif mt-3 text-3xl text-[var(--accent)]" : "display-serif mt-3 text-3xl"}>
        {value}
      </p>
      <p className="mono mt-1 text-[10px] text-[var(--subtle)]">{hint}</p>
    </div>
  );
}

function WaveEdge() {
  return (
    <div className="wave-edge" aria-hidden="true">
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path d="M0,58 C190,58 235,36 410,42 C590,48 645,72 820,64 C1010,56 1030,38 1200,48 L1200,80 L0,80 Z" fill="currentColor" />
        <path d="M1200,58 C1390,58 1435,36 1610,42 C1790,48 1845,72 2020,64 C2210,56 2230,38 2400,48 L2400,80 L1200,80 Z" fill="currentColor" />
      </svg>
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path d="M0,50 C160,42 250,44 400,58 C555,72 650,72 815,56 C1000,38 1070,42 1200,54 L1200,80 L0,80 Z" fill="currentColor" />
        <path d="M1200,50 C1360,42 1450,44 1600,58 C1755,72 1850,72 2015,56 C2200,38 2270,42 2400,54 L2400,80 L1200,80 Z" fill="currentColor" />
      </svg>
    </div>
  );
}

function Disciplines() {
  return (
    <Section id="disciplines" eyebrow="Disziplinen" title="Eine Plattform. Vier Ausdauerwelten.">
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DisciplineCard
          live
          icon={<Waves size={22} />}
          title="Schwimmen"
          meta="Live"
          text="Pace, DPS, SR, CSS, Technik-Kontext und Planempfehlung."
        />
        <DisciplineCard
          icon={<PersonStanding size={22} />}
          title="Laufen"
          meta="Roadmap"
          text="Pace, Laufstil, Belastungssteuerung und Wettkampfziel."
        />
        <DisciplineCard
          icon={<Bike size={22} />}
          title="Radfahren"
          meta="Geplant"
          text="FTP, Drehmoment, Kadenz und ökonomische Belastung."
        />
        <DisciplineCard
          icon={<Triangle size={22} />}
          title="Triathlon"
          meta="Geplant"
          text="Drei Disziplinen, eine integrierte Periodisierung."
        />
      </div>
    </Section>
  );
}

function DisciplineCard({
  icon,
  title,
  meta,
  text,
  live,
}: {
  icon: ReactNode;
  title: string;
  meta: string;
  text: string;
  live?: boolean;
}) {
  return (
    <div className={live ? "surface border-[var(--accent)] p-5" : "surface p-5"}>
      <div className={live ? "mb-5 flex size-11 items-center justify-center rounded-lg bg-[var(--accent)] text-black" : "mb-5 flex size-11 items-center justify-center rounded-lg bg-[var(--panel-2)] text-[var(--accent)]"}>
        {icon}
      </div>
      <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--subtle)]">{meta}</p>
      <h3 className="mt-2 text-xl font-semibold">{title}</h3>
      <p className="muted mt-3 text-sm leading-6">{text}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <Section
      id="ablauf"
      eyebrow="So funktioniert's"
      title="In vier Schritten zum Hebel."
      muted
    >
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Step number="01" title="Ziel & Niveau" text="Drei kurze Fragen ordnen deine Zahlen ein." />
        <Step number="02" title="200 m & 400 m" text="Zwei Zeiten und durchschnittliche Zugzahlen pro Bahn." />
        <Step number="03" title="Verdichtung" text="Pace, DPS, SR, CSS, VO2- und VLa-Proxy." />
        <Step number="04" title="Plan & ReTest" text="Hauptproblem, Cue, Drill und nächster Trainingsblock." />
      </div>
    </Section>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="border-t border-[var(--line)] pt-5">
      <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">{number}</p>
      <h3 className="mt-3 text-xl font-semibold">{title}</h3>
      <p className="muted mt-2 text-sm leading-6">{text}</p>
    </div>
  );
}

function Method() {
  return (
    <Section id="methodik" eyebrow="Methodik" title="Wissenschaft, verdichtet.">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="muted max-w-xl leading-7">
            Das System bewertet keine Einzelwerte isoliert. Es analysiert, wie
            Geschwindigkeit entsteht: über Zuglänge, Frequenz oder ein
            ineffizientes Verhältnis aus Aufwand und Output.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/analyse/new" variant="primary">
              Test starten <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </div>
        <div className="space-y-4">
          <Metric icon={<Timer size={20} />} abbr="Pace" title="Tempo pro 100 m" text="Grundlage für 200 m, 400 m und CSS." />
          <Metric icon={<Waves size={20} />} abbr="DPS" title="Distance per Stroke" text="Wie viele Meter du aus einem Armzug holst." />
          <Metric icon={<BarChart3 size={20} />} abbr="SR" title="Stroke Rate" text="Züge pro Minute als Gegenspieler zur Zuglänge." />
          <Metric icon={<LineChart size={20} />} abbr="CSS" title="Critical Swim Speed" text="Schwellen-Pace aus der Relation von 200 m und 400 m." />
        </div>
      </div>
    </Section>
  );
}

function Metric({
  icon,
  abbr,
  title,
  text,
}: {
  icon: ReactNode;
  abbr: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[52px_72px_1fr] items-start gap-4 border-t border-[var(--line)] pt-4">
      <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--panel-2)] text-[var(--accent)]">
        {icon}
      </div>
      <p className="text-2xl font-semibold">{abbr}</p>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="muted mt-1 text-sm leading-6">{text}</p>
      </div>
    </div>
  );
}

function ValueProps() {
  return (
    <Section eyebrow="Wofür" title="Weniger Zahlen. Mehr Hebel." muted>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <Value title="Max. 1-2 Baustellen" label="Priorisierung" text="Du bekommst die eine Sache, die jetzt zählt, mit Begründung und konkretem Drill." />
        <Value title="Tempoabhängige Analyse" label="Kontext" text="Eine hohe Frequenz im Sprint ist normal. Bei 400 m kann sie ein Symptom sein." />
        <Value title="Plan statt Report" label="Transfer" text="Jede Analyse führt zu einem nächsten 6-8-Wochen-Block mit ReTest-Logik." />
      </div>
    </Section>
  );
}

function Value({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <div className="surface p-5">
      <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">{label}</p>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="muted mt-3 text-sm leading-6">{text}</p>
    </div>
  );
}

function Pricing() {
  return (
    <Section id="preise" eyebrow="Preise" title="Fair. Transparent.">
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <Plan name="Free" price="0" hint="Für den Einstieg" items={["1 Analyse / Monat", "Basis-Report", "Stärken + Hauptproblem", "Community-Zugang"]} href="/analyse/new" cta="Starten" />
        <Plan popular name="Athlet" price="9" hint="Unlimited analyses" items={["Unbegrenzt Analysen", "Voller Report + CSS, VLa, VO2", "Historie & ReTest-Vergleich", "PDF-Export geplant"]} href="/login" cta="Account erstellen" />
        <Plan name="Coach" price="39" hint="Für Trainer mit Gruppen" items={["Bis zu 25 Athleten", "Team-Dashboard geplant", "Custom Trainingspläne", "White-Label Reports geplant"]} href="/login" cta="Kontakt vorbereiten" />
      </div>
    </Section>
  );
}

function Plan({
  name,
  price,
  hint,
  items,
  href,
  cta,
  popular,
}: {
  name: string;
  price: string;
  hint: string;
  items: string[];
  href: string;
  cta: string;
  popular?: boolean;
}) {
  return (
    <div className={popular ? "surface border-[var(--accent)] p-6" : "surface p-6"}>
      {popular ? (
        <p className="mb-4 inline-flex rounded bg-[var(--accent)] px-2 py-1 text-xs font-medium text-black">
          Beliebt
        </p>
      ) : null}
      <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--subtle)]">{name}</p>
      <p className="mt-4 text-5xl font-semibold tracking-tight">
        {price}<span className="ml-1 text-base text-[var(--subtle)]">EUR</span>
      </p>
      <p className="muted mt-2 text-sm">{hint}</p>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-[var(--muted)]">
            <Check size={16} className="mt-0.5 shrink-0 text-[var(--accent)]" />
            {item}
          </li>
        ))}
      </ul>
      <ButtonLink href={href} variant={popular ? "primary" : "secondary"} className="mt-6 w-full">
        {cta}
      </ButtonLink>
    </div>
  );
}

function Faq() {
  return (
    <Section id="faq" eyebrow="FAQ" title="Häufige Fragen." muted>
      <div className="mt-8 max-w-3xl space-y-3">
        <FaqItem question="Brauche ich spezielle Hardware?" answer="Nein. Eine Stoppuhr oder ein Schwimmpartner, der zählt, reicht für den ersten Report." />
        <FaqItem question="Wie lange dauert ein Test?" answer="Der Swim-Test dauert etwa 12-15 Minuten inklusive Pause. Die Eingabe dauert ca. 2 Minuten." />
        <FaqItem question="Ersetzt das einen Trainer?" answer="Nein. Es ist ein Werkzeug für Struktur, Priorisierung und bessere Trainingsentscheidungen." />
        <FaqItem question="Wann kommen Laufen und Rad?" answer="Laufen ist als nächste Disziplin geplant, Rad und Triathlon folgen danach." />
      </div>
    </Section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="surface group p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
        <span>{question}</span>
        <HelpCircle size={18} className="text-[var(--subtle)]" />
      </summary>
      <p className="muted mt-3 leading-7">{answer}</p>
    </details>
  );
}

function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="surface cta-stripes relative grid overflow-hidden rounded-[18px] border-[color-mix(in_oklab,var(--accent)_45%,var(--line))] bg-[color-mix(in_oklab,var(--panel)_72%,var(--accent)_18%)] p-8 pb-16 lg:grid-cols-[1fr_0.55fr] lg:items-center lg:p-12">
        <div className="relative z-10">
          <p className="mono mb-4 inline-flex rounded-full border border-[var(--line)] px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Bereit?
          </p>
          <h2 className="display-serif max-w-xl text-5xl leading-[0.98] text-white">
            Zwei Tests. Ein Hebel. <em>Dein nächster Block wird anders.</em>
          </h2>
          <p className="muted mt-4 max-w-2xl leading-7">
            Starte mit dem kostenfreien Schwimm-Report. Keine Kreditkarte, kein
            Download.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/analyse/new" variant="primary">
              Analyse starten <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="/login">Account erstellen</ButtonLink>
          </div>
        </div>
        <div className="relative z-10 text-left lg:text-right">
          <p className="display-serif text-8xl leading-none tracking-tight text-[color-mix(in_oklab,var(--accent)_65%,transparent)] sm:text-9xl">2:00</p>
          <p className="mono mt-2 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
            Minuten bis zum Report
          </p>
        </div>
      </div>
    </section>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
  muted,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <section id={id} className={muted ? "border-y border-[var(--line)] bg-[var(--panel)]" : ""}>
      <div className="mx-auto max-w-6xl px-5 py-16">
        <p className="mono inline-flex rounded-full border border-[var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--subtle)]">
          {eyebrow}
        </p>
        <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-black/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white text-black">
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
        <FooterCol title="Produkt" links={["Disziplinen", "Preise", "Roadmap"]} />
        <FooterCol title="Ressourcen" links={["Methodik", "FAQ", "Whitepaper"]} />
        <FooterCol title="Unternehmen" links={["Kontakt", "Impressum", "Datenschutz"]} />
      </div>
      <div className="mx-auto flex max-w-6xl justify-between border-t border-[var(--line)] px-5 py-5 text-xs text-[var(--subtle)]">
        <span>2026 Trainingsanalyse</span>
        <span>v0.4 beta</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="mono mb-3 text-xs uppercase tracking-[0.16em] text-[var(--subtle)]">{title}</p>
      <ul className="space-y-2 text-sm text-[var(--muted)]">
        {links.map((link) => (
          <li key={link}>{link}</li>
        ))}
      </ul>
    </div>
  );
}
