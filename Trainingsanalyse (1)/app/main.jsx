// ========== Main app shell, canvas, tweaks ==========
const { useState, useEffect, useRef } = React;

const DISCIPLINES = [
  { id: 'swim', label: 'Schwimmen', short: 'Swim', status: 'live',
    icon: (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/><path d="M2 14c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/><circle cx="17" cy="7" r="2"/><path d="M7 13l3-4 4 1 2 3"/></svg>) },
  { id: 'run',  label: 'Laufen',     short: 'Run',  status: 'soon',
    icon: (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="15" cy="4" r="2"/><path d="M10 21l2-6 4 3v5"/><path d="M5 12l4-4 4 1 2 3 3 1"/><path d="M4 17l3-1"/></svg>) },
  { id: 'bike', label: 'Radfahren',  short: 'Bike', status: 'soon',
    icon: (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="17" r="3.5"/><circle cx="18" cy="17" r="3.5"/><path d="M6 17l5-8h5l2 8"/><path d="M11 9l-2-4h-2"/></svg>) },
  { id: 'tri',  label: 'Triathlon',  short: 'Tri',  status: 'soon',
    icon: (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l9 16H3z"/><path d="M12 8v7"/></svg>) },
];

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 14c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/><path d="M3 19c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/><path d="M6 9l6-5 6 5"/></svg>
      </div>
      <div>
        <div className="brand-name">Trainingsanalyse</div>
        <div className="brand-sub">Endurance Coaching</div>
      </div>
    </div>
  );
}

function DisciplineSwitcher({ active, onChange, compact }) {
  return (
    <div className="disc-switcher" style={compact ? {gap: 4} : {}}>
      {DISCIPLINES.map(d => {
        const on = d.id === active;
        const disabled = d.status === 'soon';
        return (
          <button key={d.id}
            className={`disc ${on ? 'on' : ''} ${disabled ? 'soon' : ''}`}
            onClick={() => !disabled && onChange(d.id)}
            title={disabled ? `${d.label} – kommt bald` : d.label}>
            <span className="disc-ico">{d.icon}</span>
            <span className="disc-lbl">{compact ? d.short : d.label}</span>
            {disabled && <span className="disc-soon">bald</span>}
          </button>
        );
      })}
    </div>
  );
}

function DesktopApp({ state, update, step, setStep, processing, setProcessing, tweaks }) {
  const railItems = [
    { k: 'Übersicht', num: '01', disabled: true },
    { k: 'Neue Analyse', num: '02', active: true },
    { k: 'Historie', num: '03', disabled: true },
    { k: 'Pläne', num: '04', disabled: true },
  ];

  return (
    <div className="app-inner">
      <aside className="rail">
        <Brand/>

        <div className="rail-section">Disziplin</div>
        <DisciplineSwitcher active={tweaks.discipline || 'swim'} onChange={d => {}} />

        <div className="rail-section">Workspace</div>
        {railItems.map(it => (
          <div key={it.k} className={`rail-item ${it.active ? 'active' : ''}`} style={{opacity: it.disabled ? 0.4 : 1}}>
            <div className="pin"/>
            <div>{it.k}</div>
            <div className="num">{it.num}</div>
          </div>
        ))}

        <div className="rail-section">Athlet</div>
        <div className="rail-item">
          <div style={{width: 22, height: 22, borderRadius: '50%', background: 'var(--panel-2)', border: '1px solid var(--line-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 10, fontWeight: 600}}>
            {(state.name || '?').split(' ').map(w => w[0]).join('').slice(0,2)}
          </div>
          <div style={{fontSize: 12.5}}>{state.name || 'Neu'}</div>
        </div>

        <div style={{marginTop: 'auto', padding: '16px 8px 0', borderTop: '1px solid var(--line)'}}>
          <div className="muted" style={{fontSize: 11, lineHeight: 1.5}}>
            Basiert auf Phase 1–3<br/>
            <span className="mono" style={{fontSize: 10, color:'var(--fg-3)'}}>v0.3 prototyp</span>
          </div>
        </div>
      </aside>

      <main className="content">
        <div className="topbar">
          <div className="crumbs">
            <span style={{display:'inline-flex', alignItems:'center', gap:6, padding:'3px 8px', border:'1px solid var(--line)', borderRadius: 20, marginRight: 10, color: 'var(--accent)'}}>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/><path d="M2 14c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/></svg>
              <span style={{fontFamily:'var(--font-sans)', fontSize: 11, color:'var(--fg)'}}>Schwimmen</span>
            </span>
            Workspace / Neue Analyse / <b>{['Kontext','Dateneingabe','Ergebnis'][step] || 'Ergebnis'}</b>
          </div>
          <div className="actions">
            <span className="chip">{state.poolLength} m Becken</span>
            <span className="chip ok">Pflichtfelder gefüllt</span>
            <span className="kbd">⌘K</span>
          </div>
        </div>

        <div className="pad-lg">
          {processing ? (
            <ProcessingScreen onDone={() => { setProcessing(false); setStep(2); }}/>
          ) : step === 0 ? (
            <ContextScreen state={state} update={update} next={() => setStep(1)} variant={tweaks.inputVariant}/>
          ) : step === 1 ? (
            <DataEntryScreen state={state} update={update} next={() => setProcessing(true)} back={() => setStep(0)} variant={tweaks.inputVariant}/>
          ) : (
            <ReportScreen state={state} back={() => setStep(1)} viz={tweaks.viz}/>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  // initial tweaks from defaults
  const [tweaks, setTweaks] = useState(() => ({ ...window.TWEAK_DEFAULTS }));
  const [tweakOpen, setTweakOpen] = useState(false);
  const [tweakAvail, setTweakAvail] = useState(false);

  // persistence
  const [step, setStep] = useState(() => {
    const s = parseInt(localStorage.getItem('ta_step') || '0', 10);
    return isNaN(s) ? 0 : s;
  });
  const [mobileStep, setMobileStep] = useState(() => {
    const s = parseInt(localStorage.getItem('ta_mstep') || '0', 10);
    return isNaN(s) ? 0 : s;
  });
  const [state, setState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ta_state') || 'null');
      return saved || { ...window.SwimLogic.DEFAULT_ATHLETE };
    } catch (e) {
      return { ...window.SwimLogic.DEFAULT_ATHLETE };
    }
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => { localStorage.setItem('ta_state', JSON.stringify(state)); }, [state]);
  useEffect(() => { localStorage.setItem('ta_step', String(step)); }, [step]);
  useEffect(() => { localStorage.setItem('ta_mstep', String(mobileStep)); }, [mobileStep]);

  // apply theme
  useEffect(() => {
    document.body.classList.remove('theme-ink','theme-bone','theme-aqua','theme-ember');
    document.body.classList.add('theme-' + tweaks.theme);
  }, [tweaks.theme]);

  // Tweaks host handshake
  useEffect(() => {
    const handler = (e) => {
      if (!e.data) return;
      if (e.data.type === '__activate_edit_mode') setTweakOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setTweakOpen(false);
    };
    window.addEventListener('message', handler);
    // announce
    try {
      window.parent.postMessage({type: '__edit_mode_available'}, '*');
    } catch (e) {}
    setTweakAvail(true);
    return () => window.removeEventListener('message', handler);
  }, []);

  const update = (patch) => setState(s => ({ ...s, ...patch }));
  const updateTweak = (patch) => {
    setTweaks(t => {
      const nt = { ...t, ...patch };
      try { window.parent.postMessage({type: '__edit_mode_set_keys', edits: patch}, '*'); } catch (e) {}
      return nt;
    });
  };

  const resetAll = () => {
    localStorage.removeItem('ta_state');
    localStorage.removeItem('ta_step');
    localStorage.removeItem('ta_mstep');
    setState({ ...window.SwimLogic.DEFAULT_ATHLETE });
    setStep(0);
    setMobileStep(0);
  };

  return (
    <div className="app-shell">
      <div className="canvas-top">
        <div>
          <div style={{fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color:'var(--fg-3)', marginBottom: 12}}>
            Endurance Coaching Platform · Hi-Fi Prototyp
          </div>
          <h1>Trainings<em>analyse.</em></h1>
          <div className="sub">
            Eine Plattform für <b style={{color:'var(--fg)'}}>Schwimmen, Laufen, Radfahren und Triathlon</b>. Start mit Schwimmen: Ein Athlet gibt Kontext, zwei Testzeiten und Zugzahlen ein — und bekommt einen verdichteten Coaching-Report.
          </div>
          <div style={{marginTop: 18}}>
            <DisciplineSwitcher active={tweaks.discipline || 'swim'} onChange={() => {}} />
          </div>
        </div>
        <div className="meta">
          <div><b>Stand:</b> {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div><b>Scope:</b> Schwimmen (Kraul)</div>
          <div><b>Ziel-User:</b> Athlet · Self-Service</div>
          <div style={{marginTop: 8}}>
            <button className="btn" onClick={resetAll} style={{padding: '6px 10px', fontSize: 11}}>Flow zurücksetzen</button>
          </div>
        </div>
      </div>

      <div className="frames">
        <div>
          <div className="frame-label">
            <div><span className="dot"/>Desktop · Web App</div>
            <div className="mono">1440 × 900</div>
          </div>
          <div className="desktop-frame">
            <div className="desktop-chrome">
              <div className="lights">
                <div className="light"/><div className="light"/><div className="light"/>
              </div>
              <div className="urlbar">trainingsanalyse.app / neue-analyse</div>
              <div style={{width: 36}}/>
            </div>
            <div className="desktop-body">
              <DesktopApp
                state={state} update={update}
                step={step} setStep={setStep}
                processing={processing} setProcessing={setProcessing}
                tweaks={tweaks}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="frame-label">
            <div><span className="dot"/>Mobile · iOS</div>
            <div className="mono">380 × 780</div>
          </div>
          <div className="phone-frame-wrap">
            <div className="phone-frame">
              <div className="phone-screen">
                <div className="phone-notch"/>
                <div className="phone-status">
                  <span>9:41</span>
                  <span className="icons">
                    <svg width="14" height="10" viewBox="0 0 14 10"><path d="M1 9h2V6H1v3zm4 0h2V4H5v5zm4 0h2V1H9v8z" fill="currentColor"/></svg>
                    <svg width="14" height="10" viewBox="0 0 14 10"><rect x="0" y="3" width="11" height="5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="0.8"/><rect x="11" y="4.5" width="1.5" height="2.5" rx="0.3" fill="currentColor"/><rect x="1" y="4" width="9" height="3" rx="0.6" fill="currentColor"/></svg>
                  </span>
                </div>
                <div className="phone-screen-body">
                  <MobileApp state={state} update={update} step={mobileStep} setStep={setMobileStep}/>
                </div>
              </div>
            </div>
            <div className="muted" style={{fontSize: 11, textAlign:'center', marginTop: 16, fontFamily:'var(--font-mono)', letterSpacing: '0.05em'}}>
              tippe um die mobile-variante durchzuspielen
            </div>
          </div>
        </div>
      </div>

      {/* Tweaks floating */}
      {tweakAvail && (
        <button className={`tweaks-btn ${!tweakOpen ? 'visible' : ''}`} onClick={() => setTweakOpen(true)}>
          Tweaks
        </button>
      )}

      <div className={`tweaks-panel ${tweakOpen ? 'open' : ''}`}>
        <div className="tweaks-title">
          <h3>Tweaks</h3>
          <button className="close" onClick={() => setTweakOpen(false)}>×</button>
        </div>

        <h4>Farbe + Typo</h4>
        <div className="pill-row" style={{marginBottom: 10}}>
          {[
            { k: 'ink',  lbl: 'Ink',  c: '#5ee3d3', bg: '#0b0c0d' },
            { k: 'bone', lbl: 'Bone', c: '#196e66', bg: '#ece8de' },
            { k: 'aqua', lbl: 'Aqua', c: '#6aa8ff', bg: '#0b0c0d' },
            { k: 'ember',lbl: 'Ember',c: '#ff8a5b', bg: '#0b0c0d' },
          ].map(t => (
            <button key={t.k} className={`pill ${tweaks.theme === t.k ? 'on' : ''}`}
              onClick={() => updateTweak({theme: t.k})}
              style={{display:'flex', alignItems:'center', gap: 8}}>
              <span className="swatch" style={{background: `linear-gradient(135deg, ${t.bg} 50%, ${t.c} 50%)`}}/>
              {t.lbl}
            </button>
          ))}
        </div>

        <h4>Analyse-Visualisierung</h4>
        <div className="seg" style={{marginBottom: 12}}>
          {[
            { k: 'triangle', lbl: 'Dreieck' },
            { k: 'radar',    lbl: '+ Radar' },
            { k: 'bars',     lbl: '+ Balken' },
          ].map(v => (
            <button key={v.k} className={tweaks.viz === v.k ? 'on' : ''}
              onClick={() => updateTweak({viz: v.k})}>{v.lbl}</button>
          ))}
        </div>

        <h4>Kontext-Flow</h4>
        <div className="seg" style={{marginBottom: 12}}>
          {[
            { k: 'sectioned', lbl: 'Sektioniert' },
            { k: 'condensed', lbl: 'Kompakt' },
          ].map(v => (
            <button key={v.k} className={tweaks.inputVariant === v.k ? 'on' : ''}
              onClick={() => updateTweak({inputVariant: v.k})}>{v.lbl}</button>
          ))}
        </div>

        <h4>Quick-Nav</h4>
        <div className="seg" style={{marginBottom: 4}}>
          {['Kontext','Daten','Report'].map((lbl, i) => (
            <button key={lbl} className={step === i ? 'on' : ''} onClick={() => { setStep(i); setProcessing(false); }}>{lbl}</button>
          ))}
        </div>
        <div className="muted" style={{fontSize: 11, marginTop: 10, lineHeight: 1.5}}>
          Tweaks schalten Farbschema, Visualisierung und Kontext-Flow live um. Werte werden persistiert.
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
