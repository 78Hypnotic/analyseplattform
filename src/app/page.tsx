import Image from "next/image";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bike,
  Check,
  Footprints,
  Gauge,
  HelpCircle,
  LineChart,
  Timer,
  Triangle,
  Waves,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/button";
import { HeroDisciplinePreview } from "@/components/hero-discipline-preview";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const isAuthenticated = await getIsAuthenticated();

  return (
    <>
      <AppHeader />
      <main>
        <Hero isAuthenticated={isAuthenticated} />
        <Disciplines />
        <HowItWorks />
        <VocabularyMarquee />
        <Method />
        <ValueProps />
        <Pricing isAuthenticated={isAuthenticated} />
        <Faq />
        <Cta />
      </main>
    </>
  );
}

async function getIsAuthenticated() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return Boolean(user);
  } catch {
    return false;
  }
}

function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="hero-grid-lines relative min-h-[calc(100svh-4.25rem)] overflow-hidden border-b border-[var(--line)]">
      <Image
        src="/swimmer-top.jpg"
        alt="Schwimmer im Training"
        fill
        priority
        className="object-cover opacity-15"
      />
      <div className="absolute inset-0 bg-[image:var(--hero-overlay)]" />
      <div className="relative mx-auto flex min-h-[calc(100svh-4.25rem)] max-w-6xl flex-col justify-center px-5 pb-24 pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mono inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--raised-bg)] px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              <span className="size-2 rounded-full bg-[var(--accent)] shadow-[0_0_0_4px_var(--accent-ring)]" />
              Endurance Coaching · Live für Schwimmen &amp; Laufen
            </p>
            <h1 className="display-serif mt-6 max-w-3xl text-6xl leading-[0.95] text-[var(--foreground)] sm:text-8xl">
              Deine Zeit. Dein <em className="text-[var(--muted)]">Hebel.</em>{" "}
              <em className="text-[var(--accent)]">Klar.</em>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Bewährte Feldtests, klare Diagnose, konkrete Maßnahmen. Ohne Labor,
              ohne Datenflut. Jetzt für Schwimmen und Laufen: zwei kurze Tests
              ergeben einen verdichteten Coaching-Report.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/analyse/new" variant="primary" className="h-12 px-6">
                <Waves size={16} /> Schwimm-Analyse
              </ButtonLink>
              <ButtonLink href="/lauf/new" variant="primary" className="h-12 px-6">
                <Footprints size={16} /> Lauf-Analyse
              </ButtonLink>
              <ButtonLink href="/rad/new" variant="primary" className="h-12 px-6">
                <Bike size={16} /> Rad-Analyse
              </ButtonLink>
            </div>
            <p className="mono mt-4 text-xs tracking-[0.14em] text-[var(--subtle)]">
              {isAuthenticated ? "Mit deinem Profil verknüpft" : "Ø 2 Minuten · keine Kreditkarte"}
            </p>
          </div>
          <HeroDisciplinePreview />
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
      <Stat value="3 Disziplinen" label="Schwimmen · Laufen · Rad" />
      <Stat value="2 Feldtests" label="pro Diagnostik" />
      <Stat value="Klare Diagnose" label="ohne Laborwerte" />
      <Stat value="Plan + ReTest" label="Trainingsgrundlage" />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="display-serif text-4xl leading-none text-[var(--foreground)] sm:text-5xl">{value}</p>
      <p className="mono mt-2 text-xs uppercase tracking-[0.16em] text-[var(--subtle)]">
        {label}
      </p>
    </div>
  );
}

function WaveEdge() {
  return (
    <div className="wave-edge" aria-hidden="true">
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path d="M0,54 C55,42 95,42 150,54 S245,66 300,54 S395,42 450,54 S545,66 600,54 S695,42 750,54 S845,66 900,54 S995,42 1050,54 S1145,66 1200,54 L1200,80 L0,80 Z" fill="currentColor" />
        <path d="M1200,54 C1255,42 1295,42 1350,54 S1445,66 1500,54 S1595,42 1650,54 S1745,66 1800,54 S1895,42 1950,54 S2045,66 2100,54 S2195,42 2250,54 S2345,66 2400,54 L2400,80 L1200,80 Z" fill="currentColor" />
      </svg>
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path d="M0,60 C45,50 105,50 150,60 S255,70 300,60 S405,50 450,60 S555,70 600,60 S705,50 750,60 S855,70 900,60 S1005,50 1050,60 S1155,70 1200,60 L1200,80 L0,80 Z" fill="currentColor" />
        <path d="M1200,60 C1245,50 1305,50 1350,60 S1455,70 1500,60 S1605,50 1650,60 S1755,70 1800,60 S1905,50 1950,60 S2055,70 2100,60 S2205,50 2250,60 S2355,70 2400,60 L2400,80 L1200,80 Z" fill="currentColor" />
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
          live
          icon={<Footprints size={22} />}
          title="Laufen"
          meta="Live"
          text="Critical Speed, API, ACI und CS-basierte Trainingszonen."
        />
        <DisciplineCard
          live
          icon={<Bike size={22} />}
          title="Radfahren"
          meta="Live"
          text="FTP, VO₂max, VLamax-Proxy, FatMax und Wattbereiche."
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
      <div className={live ? "mb-5 flex size-11 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]" : "mb-5 flex size-11 items-center justify-center rounded-lg bg-[var(--panel-2)] text-[var(--accent)]"}>
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
        <Step number="01" title="Ziel & Niveau" text="Wenige kurze Fragen ordnen deine Zahlen ein." />
        <Step number="02" title="Zwei Feldtests" text="Je Sportart zwei kurze Tests – Schwimmen, Laufen oder Rad." />
        <Step number="03" title="Verdichtung" text="Schwellenpace, Profilindizes und Trainingszonen." />
        <Step number="04" title="Plan & ReTest" text="Klares Ergebnis und ein belastbar vergleichbarer ReTest." />
      </div>
    </Section>
  );
}

function VocabularyMarquee() {
  const words = [
    "Atemrhythmus",
    "Critical Speed",
    "Hüftrotation",
    "Cooper-Test",
    "Pace Clock",
    "Wasserlage",
    "Catch",
    "Laktatschwelle",
    "Druckphase",
    "Kadenz",
    "Gleiten",
    "VO₂-Proxy",
  ];
  const track = [...words, ...words];

  return (
    <section className="overflow-hidden border-y border-[var(--line)] bg-[var(--panel)] py-14">
      <p className="mono mb-8 text-center text-[10px] uppercase tracking-[0.24em] text-[var(--subtle)]">
        Vokabular der Ausdauer
      </p>
      <div className="vocab-track">
        {track.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className={index % 4 === 1 ? "text-[var(--accent)]" : "text-[var(--muted)]"}
          >
            {word}
          </span>
        ))}
      </div>
    </section>
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
            Das System bewertet keine Einzelwerte isoliert. Beim Schwimmen zählt,
            wie Geschwindigkeit aus Zuglänge und Frequenz entsteht; beim Laufen,
            wie Dauerleistung und anaerobe Prägung zusammenspielen; beim Radfahren,
            wie aerobe Leistung und Glykolyse die Schwelle bestimmen – ganz ohne
            Laborwerte.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/analyse/new" variant="primary">
              Schwimmtest <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="/lauf/new" variant="primary">
              Lauftest <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="/rad/new" variant="primary">
              Radtest <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </div>
        <div className="space-y-8">
          <MetricGroup label="Schwimmen">
            <Metric icon={<Timer size={20} />} abbr="Pace" title="Tempo pro 100 m" text="Grundlage für 200 m, 400 m und CSS." />
            <Metric icon={<Waves size={20} />} abbr="DPS" title="Distance per Stroke" text="Wie viele Meter du aus einem Armzug holst." />
            <Metric icon={<BarChart3 size={20} />} abbr="SR" title="Stroke Rate" text="Züge pro Minute als Gegenspieler zur Zuglänge." />
            <Metric icon={<LineChart size={20} />} abbr="CSS" title="Critical Swim Speed" text="Schwellen-Pace aus der Relation von 200 m und 400 m." />
          </MetricGroup>
          <MetricGroup label="Laufen">
            <Metric icon={<Gauge size={20} />} abbr="CS" title="Critical Speed" text="Dauerleistungs-Pace aus 3- und 12-Minuten-Test." />
            <Metric icon={<BarChart3 size={20} />} abbr="API" title="Anaerobic Profile Index" text="Verhältnis von Kurzzeit- zu Dauerleistung (1–10)." />
            <Metric icon={<LineChart size={20} />} abbr="ACI" title="Aerobic Capacity Index" text="Größe des aeroben Motors als Profilindex (1–10)." />
          </MetricGroup>
          <MetricGroup label="Radfahren">
            <Metric icon={<Gauge size={20} />} abbr="FTP" title="Schwellenleistung" text="Maximal nachhaltige Leistung aus PVO₂ und Profilfaktor." />
            <Metric icon={<LineChart size={20} />} abbr="VO₂" title="Maximale aerobe Leistung" text="VO₂max-Proxy aus der 1-Minuten-Leistung (× 0,875 × 12)." />
            <Metric icon={<BarChart3 size={20} />} abbr="VLa" title="VLamax-Proxy" text="Anaerob-glykolytische Kapazität aus dem 20-s-Sprint." />
          </MetricGroup>
        </div>
      </div>
    </Section>
  );
}

function MetricGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mono mb-3 text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">{label}</p>
      <div className="space-y-4">{children}</div>
    </div>
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
        <Value title="Max. 1-2 Baustellen" label="Priorisierung" text="Du bekommst die eine Sache, die jetzt zählt, mit Begründung und konkretem Schritt." />
        <Value title="Profil statt Einzelwert" label="Kontext" text="API und ACI zeigen dein Leistungsmuster – ausdauerstark oder anaerob geprägt." />
        <Value title="Plan statt Report" label="Transfer" text="Jede Analyse führt zu Trainingsbereichen und einer ReTest-Logik." />
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

function Pricing({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Section id="preise" eyebrow="Preise" title="Fair. Transparent.">
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <Plan name="Free" price="0" hint="Für den Einstieg" items={["1 Analyse / Monat", "Basis-Report", "Schwimmen & Laufen", "Community-Zugang"]} href="/analyse/new" cta="Starten" />
        <Plan popular name="Athlet" price="9" hint="Unbegrenzte Analysen" items={["Unbegrenzt Analysen", "Schwimmen: CSS, VLa, VO2", "Laufen: CS, API, ACI + Zonen", "Historie & ReTest-Vergleich"]} href={isAuthenticated ? "/analyse" : "/login"} cta={isAuthenticated ? "Analysen öffnen" : "Account erstellen"} />
        <Plan name="Coach" price="39" hint="Für Trainer mit Gruppen" items={["Bis zu 25 Athleten", "Team-Übersicht geplant", "Custom Trainingspläne", "White-Label Reports geplant"]} href={isAuthenticated ? "/analyse" : "/login"} cta={isAuthenticated ? "Analysen öffnen" : "Kontakt vorbereiten"} />
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
        <p className="mb-4 inline-flex rounded bg-[var(--accent)] px-2 py-1 text-xs font-medium text-[var(--accent-foreground)]">
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
        <FaqItem question="Brauche ich spezielle Hardware?" answer="Nein. Eine Stoppuhr (oder Laufuhr) und beim Schwimmen jemand, der die Züge zählt, reichen für den ersten Report." />
        <FaqItem question="Wie lange dauert ein Test?" answer="Der Schwimmtest dauert etwa 12-15 Minuten inklusive Pause. Der Lauftest besteht aus einem 3- und einem 12-Minuten-All-Out. Die Eingabe dauert jeweils ca. 2 Minuten." />
        <FaqItem question="Ersetzt das einen Trainer?" answer="Nein. Es ist ein Werkzeug für Struktur, Priorisierung und bessere Trainingsentscheidungen." />
        <FaqItem question="Welche Disziplinen gibt es?" answer="Schwimmen, Laufen und Radfahren sind live. Triathlon folgt danach." />
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
          <h2 className="display-serif max-w-xl text-5xl leading-[0.98] text-[var(--foreground)]">
            Zwei Tests. Ein Hebel. <em>Dein nächster Block wird anders.</em>
          </h2>
          <p className="muted mt-4 max-w-2xl leading-7">
            Starte mit dem kostenfreien Schwimm-, Lauf- oder Rad-Report. Keine
            Kreditkarte, kein Download.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/analyse/new" variant="primary">
              <Waves size={16} /> Schwimm-Analyse
            </ButtonLink>
            <ButtonLink href="/lauf/new" variant="primary">
              <Footprints size={16} /> Lauf-Analyse
            </ButtonLink>
            <ButtonLink href="/rad/new" variant="primary">
              <Bike size={16} /> Rad-Analyse
            </ButtonLink>
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
    <section
      id={id}
      className={
        muted
          ? "reveal-section border-y border-[var(--line)] bg-[var(--panel)]"
          : "reveal-section"
      }
    >
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
