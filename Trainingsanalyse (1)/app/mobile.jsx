// ========== Mobile screens (phone frame) ==========
const L2 = window.SwimLogic;

function MobileApp({ state, update, step, setStep }) {
  const [processing, setProcessing] = React.useState(false);

  if (processing) {
    return <MProcessing onDone={() => { setProcessing(false); setStep(3); }}/>;
  }

  return (
    <>
      <div className="m-topbar">
        <div className="m-back" onClick={() => step > 0 && setStep(Math.max(0, step - 1))}>{step > 0 ? '‹' : '☰'}</div>
        <div className="m-title">
          {['Ziel','Niveau','Daten','Analyse'][step]}
        </div>
        <div className="mono" style={{fontSize: 11, color: 'var(--fg-3)'}}>{step + 1}/4</div>
      </div>
      <div className="m-body">
        {step === 0 && <MGoal state={state} update={update} next={() => setStep(1)}/>}
        {step === 1 && <MLevel state={state} update={update} next={() => setStep(2)}/>}
        {step === 2 && <MData state={state} update={update} next={() => setProcessing(true)}/>}
        {step === 3 && <MReport state={state}/>}
      </div>
    </>
  );
}

function MGoal({ state, update, next }) {
  return (
    <div className="screen stack-16">
      <div>
        <div className="h-eyebrow" style={{marginBottom: 8}}>Schritt 01</div>
        <h2 style={{fontFamily:'var(--font-serif)', fontSize: 30, lineHeight: 1.05, margin:0, fontWeight: 400, letterSpacing:'-0.01em'}}>Was ist dein <em style={{color:'var(--fg-2)'}}>Ziel</em>?</h2>
      </div>
      <div className="stack-8">
        {L2.GOALS.map(g => (
          <button key={g.id} className={`choice ${state.goal === g.id ? 'on' : ''}`}
            onClick={() => update({goal: g.id})}
            style={{padding: 14, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{textAlign:'left'}}>
              <div className="t" style={{fontSize: 14}}>{g.label}</div>
              <div className="d" style={{fontSize: 11.5}}>{g.desc}</div>
            </div>
            <div className="mono" style={{fontSize: 14, color: state.goal === g.id ? 'var(--accent)' : 'var(--fg-3)'}}>{state.goal === g.id ? '●' : '○'}</div>
          </button>
        ))}
      </div>
      <button className="btn primary" style={{justifyContent:'center', marginTop: 8}} disabled={!state.goal} onClick={next}>Weiter <span className="arr">→</span></button>
    </div>
  );
}

function MLevel({ state, update, next }) {
  return (
    <div className="screen stack-16">
      <div>
        <div className="h-eyebrow" style={{marginBottom: 8}}>Schritt 02</div>
        <h2 style={{fontFamily:'var(--font-serif)', fontSize: 30, lineHeight: 1.05, margin:0, fontWeight: 400}}>Dein <em style={{color:'var(--fg-2)'}}>Niveau</em>.</h2>
      </div>
      <div className="stack-8">
        {L2.LEVELS.map(lv => (
          <button key={lv.id} className={`choice ${state.level === lv.id ? 'on' : ''}`}
            onClick={() => update({level: lv.id})}
            style={{padding: 14}}>
            <div className="t" style={{fontSize: 14}}>{lv.label}</div>
            <div className="d" style={{fontSize: 11.5}}>{lv.desc}</div>
          </button>
        ))}
      </div>
      <div>
        <div className="h-eyebrow" style={{marginBottom: 8, marginTop: 6}}>Herausforderungen (optional)</div>
        <div style={{display:'flex', flexWrap:'wrap', gap: 6}}>
          {L2.CHALLENGES.slice(0,4).flatMap(cg => cg.items).slice(0, 10).map(item => {
            const on = (state.challenges || []).includes(item);
            return (
              <button key={item} style={{
                fontSize: 11, padding: '5px 9px', borderRadius: 14,
                border: `1px solid ${on ? 'var(--fg)' : 'var(--line)'}`,
                background: on ? 'var(--panel-2)' : 'transparent',
                color: on ? 'var(--fg)' : 'var(--fg-2)',
                cursor: 'pointer',
              }} onClick={() => {
                const cur = state.challenges || [];
                update({challenges: on ? cur.filter(x => x !== item) : [...cur, item]});
              }}>{item.length > 30 ? item.slice(0,28) + '…' : item}</button>
            );
          })}
        </div>
      </div>
      <button className="btn primary" style={{justifyContent:'center'}} disabled={!state.level} onClick={next}>Zur Testeingabe <span className="arr">→</span></button>
    </div>
  );
}

function MData({ state, update, next }) {
  const [active, setActive] = React.useState('200');
  const t = L2.parseTime(state[active === '200' ? 't200' : 't400']);
  const s = parseFloat(state[active === '200' ? 's200' : 's400']);
  const test = L2.computeTest(active === '200' ? 200 : 400, t, s, state.poolLength);

  return (
    <div className="screen stack-16">
      <div>
        <div className="h-eyebrow" style={{marginBottom: 8}}>Schritt 03</div>
        <h2 style={{fontFamily:'var(--font-serif)', fontSize: 30, lineHeight: 1.05, margin:0, fontWeight: 400}}>Deine <em style={{color:'var(--fg-2)'}}>Tests</em>.</h2>
      </div>

      <div className="seg-lg">
        <button className={active === '200' ? 'on' : ''} onClick={() => setActive('200')}>200 m</button>
        <button className={active === '400' ? 'on' : ''} onClick={() => setActive('400')}>400 m</button>
      </div>

      <div className="stack-12">
        <div className="field">
          <label>Zeit</label>
          <input value={state[active === '200' ? 't200' : 't400']} onChange={e => update({[active === '200' ? 't200' : 't400']: e.target.value})} placeholder="3:45" style={{fontFamily:'var(--font-mono)', fontSize: 20, textAlign:'center', padding: 16}}/>
        </div>
        <div className="field">
          <label>Ø Züge pro Bahn</label>
          <input value={state[active === '200' ? 's200' : 's400']} type="number" onChange={e => update({[active === '200' ? 's200' : 's400']: e.target.value})} placeholder="21" style={{fontFamily:'var(--font-mono)', fontSize: 20, textAlign:'center', padding: 16}}/>
        </div>
        <div className="field">
          <label>Becken</label>
          <div className="seg-lg">
            <button className={state.poolLength === 25 ? 'on' : ''} onClick={() => update({poolLength: 25})}>25 m</button>
            <button className={state.poolLength === 50 ? 'on' : ''} onClick={() => update({poolLength: 50})}>50 m</button>
          </div>
        </div>
      </div>

      {test && (
        <div className="card" style={{padding: 14, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 8}}>
          <div><div className="h-eyebrow" style={{marginBottom: 4}}>Pace</div><div className="mono" style={{fontSize: 15}}>{L2.formatPace(test.pace)}</div></div>
          <div><div className="h-eyebrow" style={{marginBottom: 4}}>DPS</div><div className="mono" style={{fontSize: 15}}>{test.dps.toFixed(2)}</div></div>
          <div><div className="h-eyebrow" style={{marginBottom: 4}}>SR</div><div className="mono" style={{fontSize: 15}}>{test.sr.toFixed(1)}</div></div>
        </div>
      )}

      <button className="btn accent" style={{justifyContent:'center'}} onClick={next}>Analyse starten <span className="arr">→</span></button>
    </div>
  );
}

function MProcessing({ onDone }) {
  const [i, setI] = React.useState(0);
  const steps = ['Daten einlesen','Metriken berechnen','Diagnose verdichten'];
  React.useEffect(() => {
    if (i < steps.length) {
      const t = setTimeout(() => setI(i + 1), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(onDone, 300);
    return () => clearTimeout(t);
  }, [i]);
  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height: '100%', padding: '40px 24px'}}>
      <div style={{textAlign:'center', width:'100%'}}>
        <div className="h-eyebrow" style={{marginBottom: 12}}>Analyse läuft</div>
        <div style={{fontFamily:'var(--font-serif)', fontSize: 32, fontStyle:'italic', color:'var(--fg-2)', marginBottom: 40}}>verdichten…</div>
        <div className="stack-12">
          {steps.map((s, idx) => (
            <div key={idx} style={{fontSize: 13, opacity: idx <= i ? 1 : 0.3, color: idx < i ? 'var(--accent)' : 'var(--fg)'}}>{idx < i ? '✓ ' : '· '}{s}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MReport({ state }) {
  const r = React.useMemo(() => L2.runAnalysis(state), [state]);
  if (!r) return <div className="muted">Keine Daten</div>;
  const issue = r.issues[0];
  return (
    <div className="screen stack-16">
      <div>
        <div className="h-eyebrow" style={{marginBottom: 6}}>Analyse · {new Date().toLocaleDateString('de-DE')}</div>
        <h2 style={{fontFamily:'var(--font-serif)', fontSize: 26, lineHeight: 1.1, margin:0, fontWeight: 400, letterSpacing:'-0.01em'}}>
          Du gewinnst auf <em style={{color:'var(--accent)'}}>Frequenz</em> —<br/>und verlierst <em style={{color:'var(--fg-2)'}}>Länge</em>.
        </h2>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 8}}>
        <div className="metric" style={{padding: 12}}>
          <div className="k" style={{fontSize: 9.5}}>Pace 400</div>
          <div className="v" style={{fontSize: 22, marginTop: 6}}>{L2.formatPace(r.test400.pace)}</div>
          <div className="u" style={{fontSize: 10}}>/100m</div>
        </div>
        <div className="metric accent" style={{padding: 12}}>
          <div className="k" style={{fontSize: 9.5}}>CSS</div>
          <div className="v" style={{fontSize: 22, marginTop: 6}}>{L2.formatPace(r.cssP)}</div>
          <div className="u" style={{fontSize: 10}}>/100m</div>
        </div>
        <div className="metric" style={{padding: 12}}>
          <div className="k" style={{fontSize: 9.5}}>DPS 400</div>
          <div className="v" style={{fontSize: 22, marginTop: 6}}>{r.test400.dps.toFixed(2)}</div>
          <div className="u" style={{fontSize: 10}}>m / Zug</div>
        </div>
        <div className="metric" style={{padding: 12}}>
          <div className="k" style={{fontSize: 9.5}}>SR 400</div>
          <div className="v" style={{fontSize: 22, marginTop: 6}}>{r.test400.sr.toFixed(0)}</div>
          <div className="u" style={{fontSize: 10}}>spm</div>
        </div>
      </div>

      <div>
        <div className="h-eyebrow" style={{marginBottom: 8}}>Stärken</div>
        <div className="stack-8">
          {r.strengths.slice(0,2).map((s, i) => (
            <div key={i} className="card" style={{padding: 12}}>
              <div style={{fontSize: 13, fontWeight: 500}}>{s.title}</div>
              <div className="muted" style={{fontSize: 11.5, lineHeight: 1.45, marginTop: 3}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {issue && (
        <div className="finding" style={{padding: 14}}>
          <div className="row" style={{gap: 6}}>
            <span className="tag" style={{
              background: 'color-mix(in oklab, var(--warn) 18%, var(--panel-2))',
              color: 'var(--warn)', borderColor: 'color-mix(in oklab, var(--warn) 35%, var(--line))',
              fontSize: 9.5, padding: '3px 7px',
            }}>Hauptproblem</span>
          </div>
          <h3 style={{fontSize: 15, margin: '2px 0'}}>{issue.title}</h3>
          <p style={{fontSize: 12, lineHeight: 1.45}}>{issue.cause}</p>
          <div style={{padding: 10, background:'var(--bg-2)', borderRadius: 8, border:'1px solid var(--line)'}}>
            <div className="h-eyebrow" style={{fontSize: 9.5, marginBottom: 4}}>Cue</div>
            <div style={{fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize: 13}}>{issue.cue}</div>
          </div>
        </div>
      )}

      <button className="btn accent" style={{justifyContent:'center'}}>Plan ansehen →</button>
    </div>
  );
}

Object.assign(window, { MobileApp });
