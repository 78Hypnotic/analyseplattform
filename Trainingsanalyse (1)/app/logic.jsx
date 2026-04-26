// ========== Calculation logic for swim coaching system ==========
// Follows Phase 1 & 2 briefing exactly.

// Parse mm:ss or seconds to seconds
function parseTime(input) {
  if (input == null || input === '') return NaN;
  if (typeof input === 'number') return input;
  const s = String(input).trim();
  if (s.includes(':')) {
    const [m, sec] = s.split(':');
    return parseInt(m, 10) * 60 + parseFloat(sec);
  }
  return parseFloat(s);
}

function formatTime(sec) {
  if (!isFinite(sec)) return '–';
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

function formatPace(sec) {
  if (!isFinite(sec)) return '–';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec - m * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Compute per-distance metrics
function computeTest(distance, timeSec, strokesPerLength, poolLength) {
  if (!isFinite(timeSec) || !isFinite(strokesPerLength) || timeSec <= 0 || strokesPerLength <= 0) {
    return null;
  }
  const pace = (timeSec / distance) * 100;                  // sec per 100m
  const dps = poolLength / strokesPerLength;                 // meters per stroke
  const lengths = distance / poolLength;
  const timePerLength = timeSec / lengths;
  const sr = (strokesPerLength / timePerLength) * 60;        // strokes per minute
  return { distance, time: timeSec, strokesPerLength, pace, dps, sr, timePerLength };
}

// Critical Swim Speed (CSS) in m/s from 200 and 400 times
function computeCSS(t200, t400) {
  if (!isFinite(t200) || !isFinite(t400) || t400 <= t200) return NaN;
  return (400 - 200) / (t400 - t200); // m/s
}
// CSS as sec/100m pace
function cssPace(cssMs) {
  if (!isFinite(cssMs) || cssMs <= 0) return NaN;
  return 100 / cssMs;
}

// Simple VLa proxy from drop between 200 & 400
// drop = (pace400 - pace200) / pace200
function vlaProxy(p200, p400) {
  const drop = (p400 - p200) / p200;
  // rough mapping: small drop = low VLa, large drop = high VLa
  if (drop < 0.03) return { level: 'niedrig', score: 0.25, drop };
  if (drop < 0.06) return { level: 'mittel', score: 0.55, drop };
  return { level: 'hoch', score: 0.85, drop };
}

// Sprint reserve = 50m pace delta vs CSS
function sprintReserve(p50, cssMs) {
  if (!isFinite(p50) || !isFinite(cssMs)) return NaN;
  const p50ms = 50 / p50;      // m/s
  return (p50ms - cssMs) / cssMs; // fraction
}

// VO2 proxy from 200m relative to CSS
function vo2Proxy(p200, cssPaceSec) {
  // how close 200m pace is to CSS pace — high aerobic = 200 close to CSS
  const ratio = p200 / cssPaceSec;
  if (ratio > 1.04) return { level: 'hoch', score: 0.80 };
  if (ratio > 1.00) return { level: 'mittel', score: 0.55 };
  return { level: 'niedrig', score: 0.35 };
}

// Mock defaults
const DEFAULT_ATHLETE = {
  name: 'Lena Bergmann',
  age: 34,
  gender: 'weiblich',
  height: 172,
  weight: 63,
  poolLength: 25,
  t200: '3:38',
  s200: 21,
  t400: '7:48',
  s400: 22.5,
  t50: '38.2',
  // Context
  goal: 'Triathlon',
  level: 'Fortgeschritten',
  challenges: ['Meine Beine sinken ab', 'Ich habe Probleme mit dem frühen Wasserfassen', 'Ich hebe den Kopf zu stark'],
};

// Goals & Levels
const GOALS = [
  { id: 'Kraulen lernen', label: 'Kraulen lernen', desc: 'Technikfokus, Einstieg ins Kraulen' },
  { id: 'Beckenschwimmen', label: 'Beckenschwimmen', desc: 'Training und Wettkampf im Becken' },
  { id: 'Freiwasserschwimmen', label: 'Freiwasser', desc: 'Lange Strecken, offenes Wasser' },
  { id: 'Triathlon', label: 'Triathlon', desc: 'Schwimmen als Teildisziplin' },
];

const LEVELS = [
  { id: 'Einsteiger', label: 'Einsteiger', desc: '< 2 Jahre regelmäßig' },
  { id: 'Fortgeschritten', label: 'Fortgeschritten', desc: 'Saubere Technik, solide Zeiten' },
  { id: 'Ambitioniert', label: 'Ambitioniert', desc: 'Regelmäßiges Training, Wettkämpfe' },
  { id: 'Leistungsschwimmer', label: 'Leistungsschwimmer', desc: 'Strukturiertes Training > 5×/Woche' },
];

const CHALLENGES = [
  { group: 'Wasserlage', items: ['Ich komme gut ins Gleiten', 'Meine Beine sinken ab', 'Ich gleite kaum'] },
  { group: 'Armzug', items: ['Ich habe einen guten Armzug', 'Ich habe Probleme mit dem frühen Wasserfassen', 'Ich habe einen kurzen Armzug'] },
  { group: 'Rückführung', items: ['Ich kann meine Arme locker nach vorne schwingen', 'Ich schwimme mit hohem Ellenbogen', 'Ich führe meine Arme gestreckt nach vorne', 'Ich bekomme die Arme kaum aus dem Wasser'] },
  { group: 'Rotation', items: ['Ich liege flach und rotiere kaum', 'Ich rotiere ausreichend', 'Ich rotiere zu viel und verliere die Balance'] },
  { group: 'Atmung', items: ['Keine Probleme mit der Atmung', 'Ich japse schnell nach Luft', 'Ich hebe den Kopf zu stark', 'Ich verliere den Rhythmus beim Atmen'] },
  { group: 'Beinarbeit', items: ['Mein Beinschlag klappt gut', 'Beinarbeit macht mich müde', 'Meine Beine erzeugen kaum Vortrieb', 'Ich mache kaum Beinschlag'] },
  { group: 'Wassergefühl', items: ['Ich habe ein gutes Wassergefühl', 'Ich spüre kaum Druck beim Armzug', 'Ich ziehe schnell, habe aber kaum Vortrieb', 'Ich ziehe ruhig und gleichmäßig'] },
];

// Main analysis pipeline
function runAnalysis(state) {
  const pool = state.poolLength;
  const t200 = parseTime(state.t200);
  const t400 = parseTime(state.t400);
  const t50  = parseTime(state.t50);

  const test200 = computeTest(200, t200, state.s200, pool);
  const test400 = computeTest(400, t400, state.s400, pool);

  if (!test200 || !test400) return null;

  const comp = {
    pace_diff: test400.pace - test200.pace,
    dps_diff: test400.dps - test200.dps,
    sr_diff: test400.sr - test200.sr,
  };

  const cssMs = computeCSS(t200, t400);
  const cssP = cssPace(cssMs);
  const vla = vlaProxy(test200.pace, test400.pace);
  const sprRes = sprintReserve(t50, cssMs);
  const vo2 = vo2Proxy(test200.pace, cssP);

  // Findings logic (simplified, rule-based per briefing)
  const strengths = [];
  const issues = [];

  // strengths
  if (comp.dps_diff > -0.05 && comp.dps_diff < 0.05) {
    strengths.push({ title: 'Stabile Zuglänge unter Belastung', desc: `Deine DPS fällt zwischen 200 m und 400 m nur um ${comp.dps_diff.toFixed(2)} m — du verlierst Technik nicht, wenn es länger wird.` });
  }
  if (test200.dps > 1.8) {
    strengths.push({ title: 'Gute Gleiteigenschaft', desc: `Mit ${test200.dps.toFixed(2)} m pro Zug auf 200 m holst du viel Strecke aus jedem Armzug.` });
  }
  if (sprRes > 0.18) {
    strengths.push({ title: 'Ausgeprägte Sprint-Reserve', desc: `Deine Sprintfähigkeit liegt deutlich über CSS — du kannst beschleunigen, wenn du willst.` });
  }
  if (strengths.length < 2) {
    strengths.push({ title: 'Konstanter Rhythmus', desc: `Deine Frequenz bleibt zwischen 200 m und 400 m stabil (Δ ${comp.sr_diff.toFixed(1)} spm).` });
  }
  if (strengths.length < 3) {
    strengths.push({ title: 'Gute Ausdauerbasis', desc: `Eine 400 m Pace von ${formatPace(test400.pace)} /100m im gewählten Niveau ist ein solides Fundament.` });
  }

  // main problem — prioritize 1–2
  const overstride = test200.dps > 2.0 && test200.sr < 40;
  const weakCatch = (state.challenges||[]).includes('Ich habe Probleme mit dem frühen Wasserfassen');
  const legSink = (state.challenges||[]).includes('Meine Beine sinken ab');

  if (legSink || weakCatch) {
    issues.push({
      tag: 'Hauptproblem',
      title: legSink ? 'Wasserlage — die Hüfte liegt zu tief' : 'Zugphase — dein Catch kommt zu spät',
      cause: legSink
        ? 'Wenn die Beine absinken, entsteht ein breiter Widerstandsschatten. Die Hüfte „zieht" den Körper nach unten — jeder Zug muss diesen Bremseffekt kompensieren.'
        : 'Der Arm „rutscht" zu lang im Wasser, bevor Druck aufgebaut wird. Ergebnis: lange Kontaktzeit ohne Vortrieb, was deine DPS limitiert.',
      cue: legSink ? '„Kopf in der Verlängerung der Wirbelsäule, Blick nach unten."' : '„Ellenbogen oben halten, früh Druck aufs Wasser geben."',
      drill: legSink ? '3 × 50 m Superman-Glide mit 6er-Beinschlag' : '4 × 50 m Catch-up mit Fingertip-Dragging',
      note: 'Priorität auf Wasserlage — ohne Balance arbeitet jeder andere Fix gegen dich.',
    });
  }

  if ((comp.dps_diff < -0.1) && issues.length < 2) {
    issues.push({
      tag: 'Nebenbaustelle',
      title: 'DPS-Verlust unter Belastung',
      cause: `Deine Zuglänge bricht um ${Math.abs(comp.dps_diff).toFixed(2)} m ein, wenn es länger wird. Das deutet auf Kraftdefizit im Wasser bzw. auf fehlendes Wassergefühl unter Müdigkeit.`,
      cue: '„Lange bleiben — Zug nicht abkürzen."',
      drill: '5 × 100 m mit Zugzahl-Ziel: max. +1 Zug vs. 200 m Test',
      note: 'Sekundär — nach Wasserlage fokussieren.',
    });
  }

  if (issues.length === 0) {
    issues.push({
      tag: 'Hauptproblem',
      title: 'Technikverlust unter Belastung',
      cause: `Frequenz steigt (+${comp.sr_diff.toFixed(1)} spm), Zuglänge fällt (${comp.dps_diff.toFixed(2)} m). Klassisches Zeichen: du rettest dich unter Last in Frequenz, statt lang zu bleiben.`,
      cue: '„Lang bleiben, nicht schneller werden."',
      drill: '8 × 50 m progressiv mit fester Zugzahl-Vorgabe',
      note: '',
    });
  }

  // potential
  const potential = {
    paceGain: Math.abs(comp.pace_diff) > 5 ? '4–8 sek/100m über 400 m' : '2–5 sek/100m über 400 m',
    desc: 'Mehr Effizienz bei gleichem Aufwand, geringere Ermüdung im zweiten Streckenteil, stabilere Technik unter Wettkampfstress.',
  };

  // Swim style recommendation
  let style;
  if (state.level === 'Einsteiger') style = 'Der Mühelose';
  else if (state.level === 'Ambitioniert' && test200.sr > 48) style = 'Die Windmühle';
  else if (state.level === 'Ambitioniert') style = 'Der Gleiter';
  else if (state.level === 'Leistungsschwimmer') style = 'Der Galopper';
  else style = 'Der Gleiter';

  // Plan recommendation
  let plan;
  if (legSink || state.level === 'Einsteiger') plan = { name: 'Wasserlage & Balance', phase: 'Technik-Fundament', weeks: 6 };
  else if (vo2.level === 'niedrig') plan = { name: 'VO2max-Builder', phase: 'Basephase', weeks: 8 };
  else if (vla.level === 'hoch') plan = { name: 'VLamax Senker', phase: 'Buildphase', weeks: 6 };
  else plan = { name: 'Tempohärte', phase: 'Peakphase', weeks: 6 };

  return {
    test200, test400, comp,
    cssMs, cssP,
    vla, vo2, sprRes,
    strengths: strengths.slice(0, 3),
    issues: issues.slice(0, 2),
    potential, style, plan,
  };
}

// expose
window.SwimLogic = {
  parseTime, formatTime, formatPace,
  computeTest, computeCSS, cssPace, vlaProxy, sprintReserve, vo2Proxy,
  runAnalysis,
  GOALS, LEVELS, CHALLENGES, DEFAULT_ATHLETE,
};
