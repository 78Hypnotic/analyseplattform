// ========== Desktop screens ==========
const { useState, useEffect, useMemo, useRef } = React;

const L = window.SwimLogic;

// ---------- Shared bits ----------
function Stepper({ step, steps }) {
  return (
    <div className="stack-12" style={{marginBottom: 28}}>
      <div className="steps">
        {steps.map((s, i) => (
          <div key={i} className={`dot ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`} />
        ))}
      </div>
      <div className="row-b">
        <div className="lbl mono" style={{fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-3)'}}>
          Schritt {step + 1} / {steps.length}
        </div>
        <div className="lbl mono" style={{fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg)'}}>
          {steps[step]}
        </div>
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, suffix, placeholder, type = 'text' }) {
  return (
    <div className="field with-suf">
      <label>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>
      {suffix && <span className="suf" style={{top: 'calc(50% + 10px)'}}>{suffix}</span>}
    </div>
  );
}

// ---------- Screen: Context (Phase 3) ----------
function ContextScreen({ state, update, next, variant }) {
  const sectioned = variant === 'sectioned';

  return (
    <div className="screen">
      <Stepper step={0} steps={['Kontext','Daten','Analyse']}/>
      <div className="h-eyebrow">Phase 3 · Kontext-Modul</div>
      <h1 className="h-display">Bevor wir die Zahlen <em>einordnen</em>.</h1>
      <p className="muted" style={{maxWidth: 640, fontSize: 14.5, lineHeight: 1.55, marginTop: 0, marginBottom: 36}}>
        Drei Fragen, die deine Analyse <i>individuell interpretierbar</i> machen. Keine Bewertung, nur der nötige Kontext.
      </p>

      {sectioned ? (
        <div className="stack-28">
          {/* Goal */}
          <section>
            <div className="h-eyebrow">01 · Ziel</div>
            <h2 className="h-title" style={{marginBottom: 18}}>Was ist dein aktuelles Ziel im Schwimmen?</h2>
            <div className="choice-grid">
              {L.GOALS.map(g => (
                <button key={g.id} className={`choice ${state.goal === g.id ? 'on' : ''}`} onClick={() => update({goal: g.id})}>
                  <div className="i">{g.id === state.goal ? 'Gewählt' : 'Option'}</div>
                  <div className="t">{g.label}</div>
                  <div className="d">{g.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Level */}
          <section>
            <div className="h-eyebrow">02 · Status</div>
            <h2 className="h-title" style={{marginBottom: 18}}>Wie schätzt du dein Schwimmniveau ein?</h2>
            <div className="choice-grid" style={{gridTemplateColumns: 'repeat(4, 1fr)'}}>
              {L.LEVELS.map(lv => (
                <button key={lv.id} className={`choice ${state.level === lv.id ? 'on' : ''}`} onClick={() => update({level: lv.id})}>
                  <div className="i">{lv.id === state.level ? 'Gewählt' : 'Option'}</div>
                  <div className="t">{lv.label}</div>
                  <div className="d">{lv.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Challenges */}
          <section>
            <div className="h-eyebrow">03 · Herausforderungen</div>
            <h2 className="h-title" style={{marginBottom: 6}}>Wo fühlst du aktuell die größten Herausforderungen?</h2>
            <div className="muted" style={{fontSize: 13, marginBottom: 20}}>Mehrfach-Auswahl — wähle alles, was zutrifft.</div>

            <div className="stack-20">
              {L.CHALLENGES.map(cg => (
                <div key={cg.group}>
                  <div className="h-eyebrow" style={{marginBottom: 8}}>{cg.group}</div>
                  <div style={{display:'flex', flexWrap:'wrap', gap: 8}}>
                    {cg.items.map(item => {
                      const on = (state.challenges || []).includes(item);
                      return (
                        <button key={item} className="pill" style={{
                          fontSize: 12.5, padding: '8px 14px', borderRadius: 20,
                          border: `1px solid ${on ? 'var(--fg)' : 'var(--line)'}`,
                          background: on ? 'var(--panel-2)' : 'transparent',
                          color: on ? 'var(--fg)' : 'var(--fg-2)',
                          cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        }} onClick={() => {
                          const cur = state.challenges || [];
                          update({challenges: on ? cur.filter(x => x !== item) : [...cur, item]});
                        }}>{item}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        // Condensed variant — single page form
        <div className="card" style={{padding: 28}}>
          <div className="stack-20">
            <div className="field">
              <label>Ziel im Schwimmen</label>
              <select value={state.goal} onChange={e => update({goal: e.target.value})}>
                {L.GOALS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Niveau</label>
              <div className="seg-lg">
                {L.LEVELS.map(lv => (
                  <button key={lv.id} className={state.level === lv.id ? 'on' : ''} onClick={() => update({level: lv.id})}>{lv.label}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Top-Herausforderungen (bis zu 3)</label>
              <div style={{display:'flex',flexWrap:'wrap',gap: 6, marginTop: 4}}>
                {L.CHALLENGES.flatMap(cg => cg.items).map(item => {
                  const on = (state.challenges || []).includes(item);
                  return (
                    <button key={item} className="pill" style={{
                      fontSize: 11.5, padding: '5px 9px', borderRadius: 16,
                      border: `1px solid ${on ? 'var(--fg)' : 'var(--line)'}`,
                      background: on ? 'var(--panel-2)' : 'transparent',
                      color: on ? 'var(--fg)' : 'var(--fg-2)',
                      cursor: 'pointer',
                    }} onClick={() => {
                      const cur = state.challenges || [];
                      update({challenges: on ? cur.filter(x => x !== item) : [...cur, item]});
                    }}>{item}</button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row-b" style={{marginTop: 40}}>
        <button className="btn ghost">Später</button>
        <button className="btn primary" onClick={next} disabled={!state.goal || !state.level}>
          Weiter zur Testeingabe <span className="arr">→</span>
        </button>
      </div>
    </div>
  );
}

// ---------- Screen: Data Entry ----------
function DataEntryScreen({ state, update, next, back, variant }) {
  const guided = variant === 'guided';

  return (
    <div className="screen">
      <Stepper step={1} steps={['Kontext','Daten','Analyse']}/>
      <div className="h-eyebrow">Phase 1 · Dateneingabe</div>
      <h1 className="h-display">Zwei Tests, <em>drei</em> Zeiten.</h1>
      <p className="muted" style={{maxWidth: 640, fontSize: 14.5, lineHeight: 1.55, marginTop: 0, marginBottom: 36}}>
        Der 200 m- und 400 m-Test bilden das Fundament. Optional: eine 50 m-Sprintzeit für die VLa-Abschätzung.
      </p>

      {/* Athlete + pool */}
      <div className="card" style={{padding: 24, marginBottom: 20}}>
        <div className="h-eyebrow">Athleten&shy;profil</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr) 0.8fr 0.8fr', gap: 14, marginTop: 8}}>
          <FieldInput label="Name" value={state.name} onChange={v => update({name: v})}/>
          <FieldInput label="Alter" value={state.age} onChange={v => update({age: v})} suffix="Jahre" type="number"/>
          <div className="field">
            <label>Geschlecht</label>
            <select value={state.gender} onChange={e => update({gender: e.target.value})}>
              <option>weiblich</option><option>männlich</option><option>divers</option>
            </select>
          </div>
          <FieldInput label="Körpergröße" value={state.height} onChange={v => update({height: v})} suffix="cm" type="number"/>
          <FieldInput label="Gewicht" value={state.weight} onChange={v => update({weight: v})} suffix="kg" type="number"/>
          <div className="field">
            <label>Becken</label>
            <div className="seg-lg">
              <button className={state.poolLength === 25 ? 'on' : ''} onClick={() => update({poolLength: 25})}>25m</button>
              <button className={state.poolLength === 50 ? 'on' : ''} onClick={() => update({poolLength: 50})}>50m</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tests */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20, marginBottom: 20}}>
        <TestCard distance={200} tKey="t200" sKey="s200" state={state} update={update} emphasis/>
        <TestCard distance={400} tKey="t400" sKey="s400" state={state} update={update} emphasis/>
      </div>

      <div className="card" style={{padding: 20, background: 'var(--bg-2)'}}>
        <div className="row-b" style={{marginBottom: 12}}>
          <div>
            <div className="h-eyebrow" style={{marginBottom: 6}}>Optional · 50 m Sprint</div>
            <div className="muted" style={{fontSize: 13}}>Erlaubt die Abschätzung deiner <i>Sprint-Reserve</i> und VLamax.</div>
          </div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap: 14}}>
          <FieldInput label="50 m Zeit" value={state.t50} onChange={v => update({t50: v})} placeholder="38.2"/>
          <div className="stack-4" style={{justifyContent:'center'}}>
            <div className="muted mono" style={{fontSize: 11, letterSpacing: '0.05em'}}>
              Format: Sekunden (z.B. 38.2) oder mm:ss (z.B. 0:38.2)
            </div>
          </div>
        </div>
      </div>

      <div className="row-b" style={{marginTop: 40}}>
        <button className="btn ghost" onClick={back}>← Zurück</button>
        <button className="btn accent" onClick={next}>
          Analyse starten <span className="arr">→</span>
        </button>
      </div>
    </div>
  );
}

function TestCard({ distance, tKey, sKey, state, update, emphasis }) {
  const test = useMemo(() => {
    const t = L.parseTime(state[tKey]);
    return L.computeTest(distance, t, parseFloat(state[sKey]), state.poolLength);
  }, [state[tKey], state[sKey], state.poolLength]);

  return (
    <div className="card" style={{padding: 22, position:'relative', overflow:'hidden'}}>
      {emphasis && (
        <div style={{
          position:'absolute', top: 22, right: 22,
          fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize: 54,
          color: 'color-mix(in oklab, var(--accent) 30%, transparent)',
          lineHeight: 1, pointerEvents:'none',
        }}>{distance}</div>
      )}
      <div className="h-eyebrow">{distance} m Test</div>
      <h3 style={{margin: '4px 0 18px', fontSize: 18, fontWeight: 500}}>Zeit & Züge pro Bahn</h3>
      <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap: 14}}>
        <FieldInput label="Zeit" value={state[tKey]} onChange={v => update({[tKey]: v})} placeholder="3:45"/>
        <FieldInput label="Ø Züge / Bahn" value={state[sKey]} onChange={v => update({[sKey]: v})} placeholder="21" type="number"/>
      </div>
      {test && (
        <div style={{marginTop: 18, paddingTop: 16, borderTop: '1px dashed var(--line)', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 10}}>
          <div>
            <div className="h-eyebrow" style={{marginBottom: 4}}>Pace</div>
            <div className="mono" style={{fontSize: 18, letterSpacing: '-0.01em'}}>{L.formatPace(test.pace)}<span style={{fontSize: 11, color:'var(--fg-3)'}}> /100m</span></div>
          </div>
          <div>
            <div className="h-eyebrow" style={{marginBottom: 4}}>DPS</div>
            <div className="mono" style={{fontSize: 18}}>{test.dps.toFixed(2)}<span style={{fontSize: 11, color:'var(--fg-3)'}}> m</span></div>
          </div>
          <div>
            <div className="h-eyebrow" style={{marginBottom: 4}}>SR</div>
            <div className="mono" style={{fontSize: 18}}>{test.sr.toFixed(1)}<span style={{fontSize: 11, color:'var(--fg-3)'}}> spm</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Screen: Processing ----------
function ProcessingScreen({ onDone }) {
  const steps = [
    'Lese Testdaten ein',
    'Berechne Pace · DPS · SR',
    'Vergleiche 200 m vs 400 m',
    'Leite CSS, VLa-Proxy und VO2-Schätzung ab',
    'Verdichte zu Stärken, Hauptproblem und Maßnahmen',
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i < steps.length) {
      const t = setTimeout(() => setI(i + 1), 420);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(onDone, 300);
      return () => clearTimeout(t);
    }
  }, [i]);
  return (
    <div className="screen" style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight: 700}}>
      <div style={{maxWidth: 540, width:'100%'}}>
        <div className="h-eyebrow" style={{textAlign:'center'}}>Analyse läuft</div>
        <h1 className="h-display" style={{textAlign:'center', fontSize: 38}}>Verdichten.</h1>
        <div className="stack-12" style={{marginTop: 38}}>
          {steps.map((s, idx) => (
            <div key={idx} className="row" style={{opacity: idx <= i ? 1 : 0.35, transition: 'opacity .3s'}}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: `1.5px solid ${idx < i ? 'var(--accent)' : 'var(--line-2)'}`,
                background: idx < i ? 'var(--accent)' : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                color: '#0b1f1c', fontSize: 10,
              }}>{idx < i ? '✓' : (idx === i ? <span style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)',animation:'pulse 1s infinite'}}/> : '')}</div>
              <div style={{fontSize: 14}}>{s}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>
    </div>
  );
}

// ---------- Screen: Report ----------
function ReportScreen({ state, back, viz }) {
  const r = useMemo(() => L.runAnalysis(state), [state]);
  if (!r) return <div className="screen"><p className="muted">Unvollständige Daten.</p></div>;

  return (
    <div className="screen">
      <Stepper step={2} steps={['Kontext','Daten','Analyse']}/>

      {/* HERO */}
      <div className="report-hero">
        <div>
          <div className="h-eyebrow">Analyse-Ergebnis · {new Date().toLocaleDateString('de-DE')}</div>
          <h1 className="h-display" style={{fontSize: 46, marginTop: 10}}>
            Du schwimmst <em>{r.test400.dps.toFixed(2)} m</em> pro Zug —<br/>
            und gewinnst auf 200 m an <em>Frequenz</em>.
          </h1>
          <p className="muted" style={{fontSize: 14.5, lineHeight: 1.55, maxWidth: 520, marginTop: 12}}>
            Dein Profil als <b style={{color: 'var(--fg)'}}>{state.level}</b> mit Zielbild <b style={{color: 'var(--fg)'}}>"{r.style}"</b>.
            Eine klare Baustelle, stabile Stärken — und ein konkreter nächster Schritt.
          </p>
          <div className="row" style={{marginTop: 18, gap: 10}}>
            <span className="chip ok">Analyse abgeschlossen</span>
            <span className="chip">CSS {L.formatPace(r.cssP)}/100m</span>
            <span className="chip">VLa {r.vla.level}</span>
            <span className="chip">VO₂ {r.vo2.level}</span>
          </div>
        </div>
        <TriangleViz r={r}/>
      </div>

      {/* Top metrics */}
      <div className="metric-row" style={{marginBottom: 28}}>
        <Metric k="Pace 200 m" v={L.formatPace(r.test200.pace)} u="sek / 100 m" d={`Zieltempo gut erreicht`}/>
        <Metric k="Pace 400 m" v={L.formatPace(r.test400.pace)} u="sek / 100 m" d={`Δ +${(r.comp.pace_diff).toFixed(1)} s vs 200 m`}/>
        <Metric k="DPS 400 m" v={r.test400.dps.toFixed(2)} u="Meter pro Zug" d={`Δ ${r.comp.dps_diff >= 0 ? '+' : ''}${r.comp.dps_diff.toFixed(2)} m`}/>
        <Metric k="CSS" v={L.formatPace(r.cssP)} u="Schwellen-Pace" d={`~ ${(r.cssMs).toFixed(2)} m/s`} accent/>
      </div>

      {/* Strengths & Main issue */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1.2fr', gap: 20, marginBottom: 28}}>
        <div className="card" style={{padding: 24}}>
          <div className="h-eyebrow">01 · Stärken</div>
          <h3 className="h-title" style={{marginBottom: 18}}>Worauf du aufbaust</h3>
          <div className="stack-16">
            {r.strengths.map((s, i) => (
              <div key={i} style={{display:'grid', gridTemplateColumns:'24px 1fr', gap: 14, alignItems:'start'}}>
                <div className="mono" style={{fontSize: 11, color:'var(--accent)', paddingTop: 2}}>{String(i+1).padStart(2,'0')}</div>
                <div>
                  <div style={{fontSize: 14.5, fontWeight: 500, marginBottom: 4}}>{s.title}</div>
                  <div className="muted" style={{fontSize: 13, lineHeight: 1.5}}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stack-16">
          {r.issues.map((iss, idx) => (
            <div key={idx} className={`finding ${idx === 0 ? '' : 'issue'}`} style={{borderColor: idx === 0 ? 'color-mix(in oklab, var(--warn) 40%, var(--line))' : 'var(--line)'}}>
              <div className="row" style={{gap: 8}}>
                <span className="tag" style={idx === 0 ? {
                  background: 'color-mix(in oklab, var(--warn) 18%, var(--panel-2))',
                  color: 'var(--warn)',
                  borderColor: 'color-mix(in oklab, var(--warn) 35%, var(--line))',
                } : {}}>{iss.tag}</span>
                <span className="mono" style={{fontSize: 10.5, color:'var(--fg-3)', letterSpacing: '0.08em'}}>0{idx + 2} · {idx === 0 ? 'PRIORITÄT' : 'NEBENBAUSTELLE'}</span>
              </div>
              <h3>{iss.title}</h3>
              <p>{iss.cause}</p>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12, marginTop: 4}}>
                <div style={{padding: 12, background: 'var(--bg-2)', borderRadius: 10, border:'1px solid var(--line)'}}>
                  <div className="h-eyebrow" style={{marginBottom: 6}}>Cue</div>
                  <div style={{fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize: 15.5}}>{iss.cue}</div>
                </div>
                <div style={{padding: 12, background: 'var(--bg-2)', borderRadius: 10, border:'1px solid var(--line)'}}>
                  <div className="h-eyebrow" style={{marginBottom: 6}}>Drill</div>
                  <div style={{fontSize: 13.5, lineHeight: 1.4}}>{iss.drill}</div>
                </div>
              </div>
              {iss.note && <div className="muted" style={{fontSize: 12.5, marginTop: 4}}>↳ {iss.note}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Alt visualizations */}
      {viz === 'radar' && <RadarViz r={r}/>}
      {viz === 'bars' && <BarsViz r={r}/>}

      {/* Potential + plan */}
      <div style={{display:'grid', gridTemplateColumns:'1.3fr 1fr', gap: 20, marginBottom: 28}}>
        <div className="card" style={{padding: 28, background: 'color-mix(in oklab, var(--accent) 6%, var(--panel))', borderColor: 'color-mix(in oklab, var(--accent) 25%, var(--line))'}}>
          <div className="h-eyebrow">04 · Potenzial­abschätzung</div>
          <h2 className="h-display" style={{fontSize: 36, marginTop: 6}}>{r.potential.paceGain}</h2>
          <p className="muted" style={{fontSize: 14, lineHeight: 1.55, maxWidth: 460}}>
            {r.potential.desc}
          </p>
        </div>
        <div className="card" style={{padding: 24}}>
          <div className="h-eyebrow">Empfohlener Plan</div>
          <h3 className="h-title" style={{marginBottom: 4}}>{r.plan.name}</h3>
          <div className="muted" style={{fontSize: 13, marginBottom: 18}}>{r.plan.phase} · {r.plan.weeks} Wochen · ReTest am Ende</div>
          <div className="stack-8" style={{marginBottom: 16}}>
            <div className="row-b"><span className="muted" style={{fontSize: 12.5}}>Fokus</span><span className="mono" style={{fontSize: 11.5}}>{state.level}</span></div>
            <div className="row-b"><span className="muted" style={{fontSize: 12.5}}>Zielbild</span><span className="mono" style={{fontSize: 11.5}}>{r.style}</span></div>
            <div className="row-b"><span className="muted" style={{fontSize: 12.5}}>ReTest</span><span className="mono" style={{fontSize: 11.5}}>Woche {r.plan.weeks}</span></div>
          </div>
          <button className="btn primary" style={{width: '100%', justifyContent:'center'}}>Plan ansehen <span className="arr">→</span></button>
        </div>
      </div>

      {/* Raw data footer */}
      <details className="card" style={{padding: 20}}>
        <summary style={{cursor:'pointer', fontSize: 13, fontWeight: 500, color:'var(--fg-2)'}}>
          Rohdaten & Berechnungen anzeigen
        </summary>
        <div style={{marginTop: 16}}>
          <div className="attribute"><span className="k">Zeit 200 m</span><span className="v mono">{L.formatTime(r.test200.time)}</span></div>
          <div className="attribute"><span className="k">Zeit 400 m</span><span className="v mono">{L.formatTime(r.test400.time)}</span></div>
          <div className="attribute"><span className="k">Pace-Diff</span><span className="v mono">+{r.comp.pace_diff.toFixed(2)} s/100m</span></div>
          <div className="attribute"><span className="k">DPS-Diff</span><span className="v mono">{r.comp.dps_diff.toFixed(2)} m</span></div>
          <div className="attribute"><span className="k">SR-Diff</span><span className="v mono">{r.comp.sr_diff.toFixed(2)} spm</span></div>
          <div className="attribute"><span className="k">CSS</span><span className="v mono">{r.cssMs.toFixed(3)} m/s · {L.formatPace(r.cssP)} / 100m</span></div>
          <div className="attribute"><span className="k">VLa (Proxy)</span><span className="v mono">{r.vla.level} · Drop {(r.vla.drop*100).toFixed(1)} %</span></div>
          <div className="attribute"><span className="k">Sprint-Reserve</span><span className="v mono">{isFinite(r.sprRes) ? (r.sprRes*100).toFixed(1) + ' %' : '–'}</span></div>
          <div className="attribute"><span className="k">VO₂ (Schätzung)</span><span className="v mono">{r.vo2.level}</span></div>
        </div>
      </details>

      <div className="row-b" style={{marginTop: 40}}>
        <button className="btn ghost" onClick={back}>← Daten anpassen</button>
        <div className="row">
          <button className="btn">Als PDF exportieren</button>
          <button className="btn accent">Plan kaufen <span className="arr">→</span></button>
        </div>
      </div>
    </div>
  );
}

function Metric({ k, v, u, d, accent }) {
  return (
    <div className={`metric ${accent ? 'accent' : ''}`}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      <div className="u">{u}</div>
      {d && <div className="d">{d}</div>}
    </div>
  );
}

// ---------- Triangle visualization (VO2 / VLa / CSS) ----------
function TriangleViz({ r }) {
  const vo2 = r.vo2.score;
  const vla = r.vla.score;
  const css = Math.min(1, 8 / (r.cssMs * 6)); // normalize-ish
  const cssNorm = Math.min(1, Math.max(0.2, 1 - (L.cssPace(r.cssMs) - 85) / 80));

  // triangle vertices
  const cx = 160, cy = 160, R = 110;
  const pts = [
    { label: 'VO₂max', val: r.vo2.level, score: vo2, angle: -Math.PI/2 },
    { label: 'VLamax', val: r.vla.level, score: vla, angle: Math.PI/2 - 2*Math.PI/3 },
    { label: 'CSS',    val: L.formatPace(r.cssP), score: cssNorm, angle: Math.PI/2 + 2*Math.PI/3 },
  ];
  const outer = pts.map(p => [cx + R * Math.cos(p.angle), cy + R * Math.sin(p.angle)]);
  const inner = pts.map(p => [cx + R * p.score * Math.cos(p.angle), cy + R * p.score * Math.sin(p.angle)]);

  const grid = [0.33, 0.66, 1].map(f =>
    pts.map(p => `${cx + R * f * Math.cos(p.angle)},${cy + R * f * Math.sin(p.angle)}`).join(' ')
  );

  return (
    <div className="triangle-wrap">
      <div className="h-eyebrow" style={{marginBottom: 10}}>Physiologie-Dreieck</div>
      <svg viewBox="0 0 320 340" className="triangle">
        {grid.map((g, i) => (
          <polygon key={i} points={g} fill="none" stroke="var(--line)" strokeWidth="1" opacity={0.5 - i*0.1}/>
        ))}
        {pts.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={outer[i][0]} y2={outer[i][1]} stroke="var(--line)" strokeWidth="1" opacity="0.5"/>
        ))}
        <polygon
          points={inner.map(p => p.join(',')).join(' ')}
          fill="color-mix(in oklab, var(--accent) 25%, transparent)"
          stroke="var(--accent)" strokeWidth="1.5"
        />
        {inner.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="var(--accent)"/>
        ))}
        {pts.map((p, i) => {
          const [lx, ly] = [cx + (R + 26) * Math.cos(p.angle), cy + (R + 26) * Math.sin(p.angle)];
          return (
            <g key={i}>
              <text x={lx} y={ly} textAnchor="middle" className="tri-label">{p.label}</text>
              <text x={lx} y={ly + 16} textAnchor="middle" className="tri-val">{p.val}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function RadarViz({ r }) {
  // Radar of: DPS200, DPS400, SR200, SR400, CSS, SprintReserve
  const axes = [
    { k: 'DPS 200', v: Math.min(1, r.test200.dps / 2.5) },
    { k: 'DPS 400', v: Math.min(1, r.test400.dps / 2.5) },
    { k: 'SR 200',  v: Math.min(1, r.test200.sr / 60) },
    { k: 'SR 400',  v: Math.min(1, r.test400.sr / 60) },
    { k: 'CSS',     v: Math.min(1, r.cssMs / 1.7) },
    { k: 'Sprint',  v: Math.min(1, Math.max(0, r.sprRes || 0) + 0.4) },
  ];
  const cx = 180, cy = 180, R = 130;
  const N = axes.length;
  const pts = axes.map((a, i) => {
    const angle = -Math.PI/2 + i * (2*Math.PI / N);
    return {
      ...a, angle,
      x: cx + R * a.v * Math.cos(angle),
      y: cy + R * a.v * Math.sin(angle),
      lx: cx + (R + 20) * Math.cos(angle),
      ly: cy + (R + 20) * Math.sin(angle),
      ox: cx + R * Math.cos(angle),
      oy: cy + R * Math.sin(angle),
    };
  });
  return (
    <div className="card" style={{padding: 28, marginBottom: 28}}>
      <div className="h-eyebrow">Alternative Visualisierung · Radar</div>
      <h3 className="h-title" style={{marginBottom: 18}}>Technik- & Leistungsprofil</h3>
      <svg viewBox="0 0 360 360" style={{width: 420, height: 420, display:'block', margin: '0 auto'}}>
        {[0.25, 0.5, 0.75, 1].map((f, i) => (
          <polygon key={i} points={pts.map(p => `${cx + R*f*Math.cos(p.angle)},${cy + R*f*Math.sin(p.angle)}`).join(' ')}
            fill="none" stroke="var(--line)" opacity={0.6 - i*0.08}/>
        ))}
        {pts.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.ox} y2={p.oy} stroke="var(--line)" opacity="0.5"/>
        ))}
        <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')}
          fill="color-mix(in oklab, var(--accent) 20%, transparent)"
          stroke="var(--accent)" strokeWidth="1.5"/>
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--accent)"/>)}
        {pts.map((p, i) => (
          <text key={i} x={p.lx} y={p.ly} textAnchor="middle" className="tri-label">{p.k}</text>
        ))}
      </svg>
    </div>
  );
}

function BarsViz({ r }) {
  const rows = [
    { k: 'Pace 200', v: L.formatPace(r.test200.pace), bar: 0.85 },
    { k: 'Pace 400', v: L.formatPace(r.test400.pace), bar: 0.78 },
    { k: 'CSS',      v: L.formatPace(r.cssP), bar: 0.72 },
    { k: 'DPS 200',  v: r.test200.dps.toFixed(2) + ' m', bar: Math.min(1, r.test200.dps / 2.5) },
    { k: 'DPS 400',  v: r.test400.dps.toFixed(2) + ' m', bar: Math.min(1, r.test400.dps / 2.5) },
    { k: 'SR 200',   v: r.test200.sr.toFixed(1), bar: Math.min(1, r.test200.sr / 60) },
    { k: 'SR 400',   v: r.test400.sr.toFixed(1), bar: Math.min(1, r.test400.sr / 60) },
  ];
  return (
    <div className="card" style={{padding: 28, marginBottom: 28}}>
      <div className="h-eyebrow">Alternative Visualisierung · Balken</div>
      <h3 className="h-title" style={{marginBottom: 22}}>Kernmetriken im Überblick</h3>
      <div className="stack-12">
        {rows.map(row => (
          <div key={row.k} style={{display:'grid', gridTemplateColumns:'90px 1fr 80px', gap: 14, alignItems:'center'}}>
            <div className="mono" style={{fontSize: 11.5, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--fg-3)'}}>{row.k}</div>
            <div className="bar"><span style={{width: `${row.bar*100}%`}}/></div>
            <div className="mono" style={{fontSize: 13, textAlign:'right'}}>{row.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ContextScreen, DataEntryScreen, ProcessingScreen, ReportScreen, TriangleViz, RadarViz, BarsViz, Metric });
