// Babbl — mobile app screens
// Tendre & complice, lait & crème, Fraunces + Instrument Sans

const C = {
  lait: '#FAF5EC',
  creme: '#F2E9D8',
  coquille: '#FFFDF8',
  ivoire: '#EFE5D2',
  cafe: '#2B2320',
  cafeSoft: '#5A4D46',
  cafeMute: '#907F74',
  terracotta: '#C25230',
  terracottaLight: '#E2886A',
  ocre: '#D9B56A',
  sauge: '#A8B898',
  display: "'Fraunces', 'Cormorant Garamond', Georgia, serif",
  body: "'Instrument Sans', -apple-system, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

// ─────────────────────────────────────────────────────────────
// Shared chrome
// ─────────────────────────────────────────────────────────────
function AppStatusBar({ time = '3:17', dark = false }){
  const c = dark ? '#fff' : C.cafe;
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'18px 28px 0', fontFamily:'-apple-system, system-ui',
      fontWeight:600, fontSize:15, color:c, position:'relative', zIndex:20,
    }}>
      <span>{time}</span>
      <div style={{display:'flex', gap:6, alignItems:'center'}}>
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="6" width="3" height="5" rx="0.5" fill={c}/><rect x="4.5" y="4" width="3" height="7" rx="0.5" fill={c}/><rect x="9" y="2" width="3" height="9" rx="0.5" fill={c}/><rect x="13.5" y="0" width="3" height="11" rx="0.5" fill={c}/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke={c} strokeOpacity="0.4" fill="none"/><rect x="2" y="2" width="16" height="8" rx="1.5" fill={c}/></svg>
      </div>
    </div>
  );
}

function HomeIndicator({ dark }){
  return (
    <div style={{position:'absolute', bottom:8, left:0, right:0, display:'flex', justifyContent:'center', zIndex:60, pointerEvents:'none'}}>
      <div style={{width:134, height:5, borderRadius:99, background: dark ? 'rgba(255,255,255,.7)' : 'rgba(43,35,32,.25)'}}/>
    </div>
  );
}

function Logo({ size = 26, color = C.cafe, accent = C.terracotta }){
  return (
    <div style={{display:'flex', alignItems:'center', gap:8}}>
      <div style={{
        width: size*1.15, height: size*1.15, borderRadius:'50%',
        background: `radial-gradient(circle at 35% 35%, #fff 0%, ${accent} 60%, #9E3E22 100%)`,
        boxShadow:'inset 0 -3px 4px rgba(0,0,0,.08)',
      }}/>
      <span style={{fontFamily: C.display, fontWeight: 500, fontSize: size, letterSpacing:'-0.04em', color}}>
        babb<span style={{fontStyle:'italic', fontWeight: 300}}>l</span>
      </span>
    </div>
  );
}

// Big circular record button
function RecordButton({ listening, onClick }){
  return (
    <button onClick={onClick} style={{
      width: 200, height: 200, borderRadius:'50%',
      border:'none', cursor:'pointer', position:'relative',
      background: listening
        ? `radial-gradient(circle at 35% 35%, ${C.terracottaLight}, ${C.terracotta} 60%, #9E3E22 100%)`
        : `radial-gradient(circle at 35% 35%, #fff, ${C.creme} 60%, ${C.ocre} 100%)`,
      boxShadow: listening
        ? `0 20px 60px -10px rgba(194,82,48,.5), inset 0 -8px 16px rgba(0,0,0,.15)`
        : `0 20px 60px -10px rgba(43,35,32,.2), inset 0 -8px 16px rgba(0,0,0,.08)`,
      transition:'all .3s ease',
    }}>
      {listening && (
        <span style={{
          position:'absolute', inset:-20, borderRadius:'50%',
          border:`2px solid ${C.terracotta}`, opacity:.3,
          animation:'ripple 2s ease-out infinite',
        }}/>
      )}
      <div style={{
        fontFamily: C.display, fontSize: listening? 22 : 28,
        fontStyle:'italic', fontWeight: 300,
        color: listening? '#fff' : C.cafe, lineHeight:1.1,
        letterSpacing:'-0.02em',
      }}>
        {listening ? (<>j'écoute<br/>votre bébé…</>) : (<>Appuyer<br/>pour<br/>écouter</>)}
      </div>
    </button>
  );
}

// Waveform rendered with divs
function Waveform({ listening, color = C.cafe, count = 28 }){
  return (
    <div style={{display:'flex', gap:3, alignItems:'center', height:60, justifyContent:'center'}}>
      {Array.from({length: count}).map((_,i)=>(
        <span key={i} style={{
          width: 4, flex: 'none', background: color, borderRadius:4,
          height: listening ? `${20+Math.random()*80}%` : '30%',
          animation: listening ? `wave ${1.2+Math.random()*.6}s ease-in-out ${Math.random()*1}s infinite` : 'none',
          opacity: listening ? 0.85 : 0.3,
        }}/>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 01 — Home / Listen
// ─────────────────────────────────────────────────────────────
function ScreenHome({ go, listening, setListening }){
  return (
    <div style={{
      width:'100%', height:'100%',
      background: `linear-gradient(180deg, ${C.lait} 0%, ${C.creme} 100%)`,
      display:'flex', flexDirection:'column', position:'relative',
    }}>
      <AppStatusBar/>
      <div style={{padding:'14px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <Logo size={22}/>
        <div style={{
          width:38, height:38, borderRadius:'50%', background: C.coquille,
          display:'flex', alignItems:'center', justifyContent:'center',
          border: `1px solid ${C.ivoire}`,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="3" stroke={C.cafeSoft} strokeWidth="1.5"/><path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke={C.cafeSoft} strokeWidth="1.5"/></svg>
        </div>
      </div>

      <div style={{padding:'32px 28px 0'}}>
        <div style={{fontFamily: C.mono, fontSize:10, letterSpacing:'.18em', textTransform:'uppercase', color: C.cafeMute, marginBottom: 10}}>
          — Bonsoir, il est 3h17
        </div>
        <div style={{fontFamily: C.display, fontSize: 38, lineHeight: .95, letterSpacing:'-0.03em', color: C.cafe}}>
          Il pleure.<br/>
          <span style={{fontStyle:'italic', fontWeight:300, color: C.terracotta}}>On est là.</span>
        </div>
        <div style={{fontSize: 14, color: C.cafeSoft, marginTop: 14, lineHeight:1.5, maxWidth: 280}}>
          Posez le téléphone à 50 cm du bébé. Babbl écoute 8 à 12 secondes.
        </div>
      </div>

      <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 28}}>
        <RecordButton listening={listening} onClick={()=>{
          if(!listening){
            setListening(true);
            setTimeout(()=>{ setListening(false); go('analyzing'); }, 2800);
          }
        }}/>
        <Waveform listening={listening}/>
      </div>

      <div style={{padding:'0 20px 24px'}}>
        <div style={{
          background: C.coquille, borderRadius: 20, padding: '16px 18px',
          border: `1px solid ${C.ivoire}`,
          display:'flex', alignItems:'center', gap: 14,
        }}>
          <div style={{fontFamily: C.mono, fontSize:10, color: C.cafeMute, letterSpacing:'.15em', textTransform:'uppercase'}}>
            aujourd'hui
          </div>
          <div style={{flex:1, display:'flex', gap:4, alignItems:'flex-end', height: 28}}>
            {[14,22,18,8,26,12,6,20,16,10,24,18].map((h,i)=>(
              <span key={i} style={{flex:1, height:h, background: i===9? C.terracotta : C.ocre, borderRadius: 2}}/>
            ))}
          </div>
          <div style={{fontFamily: C.display, fontSize: 22, letterSpacing:'-0.02em'}}>3<span style={{fontSize:13, color: C.cafeMute}}>/5</span></div>
        </div>
      </div>

      <HomeIndicator/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 02 — Analyzing
// ─────────────────────────────────────────────────────────────
function ScreenAnalyzing({ go }){
  React.useEffect(()=>{
    const t = setTimeout(()=> go('result'), 2600);
    return ()=> clearTimeout(t);
  },[]);
  return (
    <div style={{
      width:'100%', height:'100%', background: C.lait,
      display:'flex', flexDirection:'column', position:'relative',
    }}>
      <AppStatusBar/>
      <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 32, padding: 28}}>
        <div style={{
          width: 140, height: 140, borderRadius:'50%', position:'relative',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <svg width="140" height="140" viewBox="0 0 140 140" style={{position:'absolute', animation:'spin 2s linear infinite'}}>
            <circle cx="70" cy="70" r="64" fill="none" stroke={C.ivoire} strokeWidth="2"/>
            <circle cx="70" cy="70" r="64" fill="none" stroke={C.terracotta} strokeWidth="2" strokeDasharray="100 402" strokeLinecap="round"/>
          </svg>
          <div style={{width:40, height:40, borderRadius:'50%', background: C.terracotta, animation:'pulse 1.2s ease-in-out infinite'}}/>
        </div>

        <div style={{textAlign:'center'}}>
          <div style={{fontFamily: C.display, fontSize: 36, fontStyle:'italic', fontWeight:300, color: C.cafe, letterSpacing:'-0.02em'}}>
            on écoute…
          </div>
          <div style={{fontSize: 14, color: C.cafeSoft, marginTop: 12, maxWidth: 260, lineHeight: 1.5}}>
            D'abord : est-ce un pleur ? L'enregistrement est supprimé juste après.
          </div>
        </div>

        <div style={{
          display:'flex', flexDirection:'column', gap: 8, width: '100%', maxWidth: 280,
          fontFamily: C.mono, fontSize: 11, color: C.cafeMute, letterSpacing:'.05em',
        }}>
          <div style={{display:'flex', justifyContent:'space-between', opacity: .8}}><span>✓ Capture · 10 s</span><span>micro brut</span></div>
          <div style={{display:'flex', justifyContent:'space-between', opacity: .8}}><span>✓ Pleur net</span><span>oui</span></div>
          <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color: C.terracotta}}>▸ Lecture de vos saisies…</span><span>…</span></div>
          <div style={{display:'flex', justifyContent:'space-between', opacity:.4}}><span>  Repères de sécurité</span><span>—</span></div>
        </div>
      </div>
      <HomeIndicator/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 03 — Result + Paywall trigger
// ─────────────────────────────────────────────────────────────
function ScreenResult({ go }){
  return (
    <div style={{
      width:'100%', height:'100%', background: C.lait,
      display:'flex', flexDirection:'column', position:'relative', overflow:'auto',
    }}>
      <AppStatusBar/>
      <div style={{padding:'16px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <button onClick={()=>go('home')} style={{
          background: C.coquille, border: `1px solid ${C.ivoire}`,
          width:40, height: 40, borderRadius:'50%', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 2L4 8l6 6" stroke={C.cafe} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{fontFamily: C.mono, fontSize:10, color: C.cafeMute, letterSpacing:'.15em', textTransform:'uppercase'}}>
          analyse · 02:47
        </div>
        <div style={{width:40}}/>
      </div>

      <div style={{padding:'24px 28px 0'}}>
        <div style={{fontFamily: C.mono, fontSize:10, letterSpacing:'.18em', textTransform:'uppercase', color: C.cafeMute, marginBottom: 8}}>
          ce que babbl a entendu
        </div>
        <div style={{fontFamily: C.display, fontSize: 44, lineHeight: .95, letterSpacing:'-0.03em', color: C.terracotta, fontWeight: 400}}>
          Un pleur presque continu.
        </div>
        <div style={{fontSize: 13, color: C.cafeSoft, marginTop: 10, lineHeight:1.5}}>
          Le son ne dit pas pourquoi il pleure. <span style={{fontStyle:'italic'}}>Piste d'après votre saisie : dernière tétée il y a 4 h.</span>
        </div>
      </div>

      <div style={{padding:'28px 20px 0'}}>
        <div style={{
          background: C.coquille, borderRadius: 24, border: `1px solid ${C.ivoire}`,
          padding: 22, marginBottom: 14,
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16}}>
            <div style={{fontFamily: C.mono, fontSize:10, letterSpacing:'.15em', textTransform:'uppercase', color: C.cafeMute}}>
              le geste à poser
            </div>
            <div style={{fontFamily: C.mono, fontSize:10, color: C.cafeMute}}>1 / 3</div>
          </div>
          <div style={{fontFamily: C.display, fontSize: 34, letterSpacing:'-0.02em', lineHeight:.95}}>
            Proposez-lui<br/><span style={{fontStyle:'italic', color: C.terracotta}}>le biberon.</span>
          </div>
          <div style={{fontSize: 14, color: C.cafeSoft, marginTop: 12, lineHeight:1.5}}>
            Si ça ne l'apaise pas, Babbl vous propose l'étape suivante. En cas de doute, appelez le 15.
          </div>
          <button style={{
            marginTop: 18, padding:'14px 20px', borderRadius: 99,
            background: C.cafe, color: C.lait, border:'none', cursor:'pointer',
            fontFamily: C.body, fontSize: 14, fontWeight: 500, width:'100%',
          }}>J'ai commencé — démarrer un minuteur de 2 min</button>
        </div>

        {/* PAYWALL LOCKED CARDS */}
        <div onClick={()=>go('paywall')} style={{
          background: `linear-gradient(135deg, ${C.creme}, #EAD9BA)`,
          borderRadius: 24, padding: 22, marginBottom: 12,
          cursor:'pointer', position:'relative', overflow:'hidden',
        }}>
          <div style={{
            position:'absolute', inset:0,
            backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)',
            pointerEvents:'none',
          }}/>
          <div style={{position:'relative'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom: 12}}>
              <div style={{fontFamily: C.mono, fontSize:10, letterSpacing:'.15em', textTransform:'uppercase', color: C.cafeMute}}>
                ↳ résumé lu à voix haute
              </div>
              <div style={{
                display:'flex', gap:4, alignItems:'center',
                fontFamily: C.mono, fontSize:9, letterSpacing:'.1em', textTransform:'uppercase',
                background: C.cafe, color: C.ocre, padding:'4px 10px', borderRadius: 99,
              }}>
                <svg width="9" height="9" viewBox="0 0 16 16" fill="none"><path d="M4 7V5a4 4 0 018 0v2m-9 0h10a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8"/></svg>
                Babbl+
              </div>
            </div>
            <div style={{fontFamily: C.display, fontSize: 22, letterSpacing:'-0.02em', filter:'blur(4px)', opacity:.6}}>
              « Il est 3 h, vous avez noté une tétée à 23 h… »
            </div>
            <div style={{fontSize: 13, color: C.cafeSoft, marginTop: 8}}>
              Un résumé calme, <span style={{fontStyle:'italic'}}>et votre voix</span> pour l'apaiser.
            </div>
          </div>
        </div>

        <div onClick={()=>go('paywall')} style={{
          background: C.cafe, color: C.lait, borderRadius: 24, padding: 22,
          cursor:'pointer', marginBottom: 24,
        }}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom: 12}}>
            <div style={{fontFamily: C.mono, fontSize:10, letterSpacing:'.15em', textTransform:'uppercase', color:'rgba(243,234,218,.5)'}}>
              ↳ réconforter avec votre voix
            </div>
            <div style={{
              fontFamily: C.mono, fontSize:9, letterSpacing:'.1em', textTransform:'uppercase',
              background: C.ocre, color: C.cafe, padding:'4px 10px', borderRadius: 99,
            }}>
              Babbl Voice
            </div>
          </div>
          <div style={{fontFamily: C.display, fontSize: 28, letterSpacing:'-0.02em', lineHeight:1.05}}>
            Laissez-le entendre<br/><span style={{fontStyle:'italic', color: C.ocre}}>votre voix.</span>
          </div>
          <div style={{fontSize: 13, color:'rgba(243,234,218,.7)', marginTop: 10}}>
            Même si vous n'êtes pas dans la pièce.
          </div>
          <div style={{marginTop: 16, padding:'10px 14px', borderRadius: 12, background:'rgba(255,255,255,.08)', display:'flex', gap: 10, alignItems:'center'}}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L10 6H13v4H10l-4 3V3z" fill={C.ocre}/></svg>
            <div style={{flex:1, height: 3, borderRadius: 99, background:'rgba(255,255,255,.1)', overflow:'hidden'}}>
              <div style={{width:'34%', height:'100%', background: C.ocre}}/>
            </div>
            <span style={{fontFamily: C.mono, fontSize:10, color: C.ocre}}>0:12</span>
          </div>
        </div>
      </div>

      <HomeIndicator/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 04 — Paywall
// ─────────────────────────────────────────────────────────────
function ScreenPaywall({ go }){
  const [tier, setTier] = React.useState('voice');
  const [annual, setAnnual] = React.useState(true);

  const tiers = {
    plus: {
      name:'Babbl +',
      sub:'comprendre & agir',
      monthly: 6.99, annual: 49.99,
      bullets:['Analyses illimitées','Résumé lu à voix haute','Tous les gestes','Historique complet','Mode Nuit','Sans publicité'],
    },
    voice: {
      name:'Babbl Voice',
      sub:'pour l\'apaiser, même à distance',
      monthly: 9.99, annual: 69.99,
      bullets:['Tout Babbl+ inclus','Voix clonée (maman & papa)','Babbl Lullaby — berceuse IA','Message de réconfort à chaque analyse','« Ce qui l\'a calmé »'],
    }
  };
  const t = tiers[tier];
  const price = annual ? t.annual : t.monthly;

  return (
    <div style={{
      width:'100%', height:'100%',
      background: `linear-gradient(180deg, ${C.cafe} 0%, #1C1613 100%)`,
      color: C.lait, display:'flex', flexDirection:'column', position:'relative', overflow:'auto',
    }}>
      <AppStatusBar dark/>
      <div style={{padding:'14px 24px 0', display:'flex', justifyContent:'space-between'}}>
        <button onClick={()=>go('result')} style={{
          background:'rgba(255,255,255,.08)', border:'none',
          width:40, height:40, borderRadius:'50%', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke={C.lait} strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
        <Logo size={20} color={C.lait} accent={C.terracottaLight}/>
        <div style={{width:40}}/>
      </div>

      <div style={{padding:'32px 28px 0'}}>
        <div style={{fontFamily: C.mono, fontSize:10, letterSpacing:'.18em', textTransform:'uppercase', color: C.ocre, marginBottom: 14}}>
          — offre de bienvenue
        </div>
        <div style={{fontFamily: C.display, fontSize: 46, lineHeight:.95, letterSpacing:'-0.035em'}}>
          7 jours<br/><span style={{fontStyle:'italic', fontWeight:300, color: C.ocre}}>pour l'essayer.</span>
        </div>
        <div style={{fontSize: 14, color:'rgba(243,234,218,.7)', marginTop: 14, lineHeight: 1.5}}>
          Sans carte bancaire. Résiliable en un clic. On vous prévient 2 jours avant la fin.
        </div>
      </div>

      {/* Tier switch */}
      <div style={{padding:'28px 20px 0'}}>
        <div style={{
          display:'flex', gap:6, padding: 6, borderRadius: 99,
          background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)',
        }}>
          {['plus','voice'].map(k=>(
            <button key={k} onClick={()=>setTier(k)} style={{
              flex:1, padding:'11px 12px', borderRadius: 99, border:'none', cursor:'pointer',
              background: tier===k ? C.lait : 'transparent',
              color: tier===k ? C.cafe : C.lait,
              fontFamily: C.body, fontSize: 13, fontWeight: 500,
              textTransform:'capitalize',
            }}>{tiers[k].name}</button>
          ))}
        </div>
      </div>

      <div style={{padding:'24px 20px 0'}}>
        <div style={{
          background: tier==='voice' ? `linear-gradient(135deg, ${C.terracotta} 0%, #9E3E22 100%)` : 'rgba(255,255,255,.06)',
          border: tier==='voice' ? 'none' : '1px solid rgba(255,255,255,.1)',
          borderRadius: 24, padding: 24,
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
            <div>
              <div style={{fontFamily: C.display, fontSize: 32, letterSpacing:'-0.02em'}}>{t.name}</div>
              <div style={{fontSize: 13, color:'rgba(243,234,218,.7)', marginTop: 2, fontStyle:'italic'}}>{t.sub}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily: C.display, fontSize: 42, letterSpacing:'-0.03em', lineHeight:1}}>
                {price.toString().replace('.',',')}<span style={{fontSize:18}}>€</span>
              </div>
              <div style={{fontSize:10, fontFamily: C.mono, color:'rgba(243,234,218,.6)', marginTop:4, textTransform:'uppercase', letterSpacing:'.12em'}}>
                {annual ? '/an · −40%' : '/mois'}
              </div>
            </div>
          </div>

          <div style={{
            display:'flex', gap:4, padding: 4, borderRadius: 99,
            background: 'rgba(0,0,0,.15)', marginTop: 18,
          }}>
            <button onClick={()=>setAnnual(false)} style={{
              flex:1, padding:'8px 12px', borderRadius: 99, border:'none', cursor:'pointer',
              background: !annual ? C.lait : 'transparent',
              color: !annual ? C.cafe : C.lait,
              fontFamily: C.body, fontSize: 12, fontWeight: 500,
            }}>Mensuel</button>
            <button onClick={()=>setAnnual(true)} style={{
              flex:1, padding:'8px 12px', borderRadius: 99, border:'none', cursor:'pointer',
              background: annual ? C.lait : 'transparent',
              color: annual ? C.cafe : C.lait,
              fontFamily: C.body, fontSize: 12, fontWeight: 500,
            }}>Annuel <span style={{fontSize:9, opacity:.7}}>−40%</span></button>
          </div>

          <div style={{marginTop: 20, display:'grid', gap: 10}}>
            {t.bullets.map((b,i)=>(
              <div key={i} style={{display:'flex', gap:10, alignItems:'flex-start', fontSize: 14}}>
                <span style={{
                  width:16, height:16, borderRadius:'50%',
                  background: tier==='voice' ? C.ocre : C.terracottaLight,
                  flexShrink:0, marginTop:3,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke={C.cafe} strokeWidth="1.5" strokeLinecap="round"/></svg>
                </span>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{padding:'24px 20px'}}>
        <button onClick={()=>go('voice')} style={{
          width:'100%', padding:'18px', borderRadius: 99, border:'none', cursor:'pointer',
          background: C.lait, color: C.cafe,
          fontFamily: C.body, fontSize: 15, fontWeight: 500,
          marginBottom: 12,
        }}>Commencer 7 jours gratuits</button>
        <div style={{textAlign:'center', fontSize: 11, color:'rgba(243,234,218,.5)', fontFamily: C.mono, letterSpacing:'.08em'}}>
          ensuite {price.toString().replace('.',',')}€{annual?'/an':'/mois'} · résiliable en un clic
        </div>
      </div>

      <HomeIndicator dark/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 05 — Voice / Lullaby (after "paywall")
// ─────────────────────────────────────────────────────────────
function ScreenVoice({ go }){
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(()=>{
    if(!playing) return;
    const iv = setInterval(()=>{
      setProgress(p => p >= 100 ? (clearInterval(iv), 0) : p + 0.8);
    }, 60);
    return ()=> clearInterval(iv);
  },[playing]);

  return (
    <div style={{
      width:'100%', height:'100%',
      background: `linear-gradient(180deg, #191624 0%, #2A1E2E 55%, #4A2C30 100%)`,
      color: C.lait, display:'flex', flexDirection:'column', position:'relative', overflow:'hidden',
    }}>
      {/* ambient glow */}
      <div style={{
        position:'absolute', top:'35%', left:'50%', transform:'translate(-50%,-50%)',
        width: 380, height: 380, borderRadius:'50%',
        background: `radial-gradient(circle, ${C.terracotta}44 0%, transparent 70%)`,
        filter:'blur(30px)',
      }}/>

      <AppStatusBar dark/>
      <div style={{padding:'14px 24px 0', display:'flex', justifyContent:'space-between', position:'relative', zIndex:2}}>
        <button onClick={()=>go('home')} style={{
          background:'rgba(255,255,255,.08)', border:'none',
          width:40, height:40, borderRadius:'50%', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L3 7l6 5" stroke={C.lait} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{fontFamily: C.mono, fontSize:10, color:'rgba(243,234,218,.5)', letterSpacing:'.15em', textTransform:'uppercase', alignSelf:'center'}}>
          babbl · lullaby
        </div>
        <div style={{width:40}}/>
      </div>

      <div style={{padding:'28px 28px 0', position:'relative', zIndex:2}}>
        <div style={{fontFamily: C.mono, fontSize:10, letterSpacing:'.18em', textTransform:'uppercase', color: C.ocre, marginBottom: 10}}>
          — berceuse · semaine 07
        </div>
        <div style={{fontFamily: C.display, fontSize: 44, lineHeight: .95, letterSpacing:'-0.035em'}}>
          Dors, petite<br/><span style={{fontStyle:'italic', fontWeight:300, color: C.ocre}}>Lila.</span>
        </div>
        <div style={{fontSize: 14, color:'rgba(243,234,218,.7)', marginTop: 12, lineHeight:1.5, fontStyle:'italic'}}>
          Composée ce matin, chantée dans la voix de maman.
        </div>
      </div>

      {/* Album / visualizer */}
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:2, padding:'20px 0'}}>
        <div style={{
          width: 240, height: 240, borderRadius:'50%', position:'relative',
          background: `radial-gradient(circle at 30% 30%, #F3D8B2, ${C.terracotta} 70%, #5A1F12 100%)`,
          boxShadow: `0 30px 80px -20px rgba(194,82,48,.5), inset 0 -12px 24px rgba(0,0,0,.3)`,
          animation: playing ? 'spin 20s linear infinite' : 'none',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius:'50%',
            background: '#1c1613', border: '4px solid rgba(255,255,255,.2)',
          }}/>
          <div style={{position:'absolute', top: 24, right: 36, fontFamily: C.display, fontStyle:'italic', fontSize: 22, color:'rgba(255,253,248,.9)'}}>♪</div>
          <div style={{position:'absolute', bottom: 36, left: 30, fontFamily: C.display, fontStyle:'italic', fontSize: 18, color:'rgba(255,253,248,.7)'}}>♩</div>
        </div>
      </div>

      {/* Waveform + scrubber */}
      <div style={{padding:'0 28px', position:'relative', zIndex:2}}>
        <Waveform listening={playing} color={C.ocre} count={40}/>
        <div style={{display:'flex', justifyContent:'space-between', fontFamily: C.mono, fontSize: 11, color:'rgba(243,234,218,.5)', marginTop: 8}}>
          <span>0:{String(Math.floor(progress*2.4/100*60)).padStart(2,'0')}</span>
          <span>2:24</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{padding:'28px 28px', display:'flex', alignItems:'center', justifyContent:'center', gap: 28, position:'relative', zIndex:2}}>
        <button style={{
          width:48, height:48, borderRadius:'50%', border:'1px solid rgba(255,255,255,.15)',
          background: 'rgba(255,255,255,.05)', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M14 3L6 9l8 6V3zM4 3v12" stroke={C.lait} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button onClick={()=>setPlaying(!playing)} style={{
          width: 76, height: 76, borderRadius:'50%', border:'none', cursor:'pointer',
          background: C.ocre, color: C.cafe,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 10px 30px -5px rgba(217,181,106,.6)`,
        }}>
          {playing ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill={C.cafe}><rect x="4" y="3" width="5" height="16" rx="1"/><rect x="13" y="3" width="5" height="16" rx="1"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill={C.cafe}><path d="M5 3l14 8-14 8V3z"/></svg>
          )}
        </button>
        <button style={{
          width:48, height:48, borderRadius:'50%', border:'1px solid rgba(255,255,255,.15)',
          background: 'rgba(255,255,255,.05)', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 3l8 6-8 6V3zM14 3v12" stroke={C.lait} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Bottom info */}
      <div style={{padding:'0 20px 24px', position:'relative', zIndex:2}}>
        <div style={{
          padding:'14px 18px', borderRadius: 16,
          background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)',
          display:'flex', gap: 12, alignItems:'center',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius:'50%',
            background: `linear-gradient(135deg, ${C.ocre}, ${C.terracotta})`,
          }}/>
          <div style={{flex:1}}>
            <div style={{fontSize: 13, fontWeight: 500}}>Voix de maman</div>
            <div style={{fontSize:10, fontFamily: C.mono, color:'rgba(243,234,218,.5)', letterSpacing:'.08em', textTransform:'uppercase'}}>clonée · 1 min d'enregistrement</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius:'50%',
            background: 'rgba(255,255,255,.08)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2v12" stroke={C.lait} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
        </div>
      </div>

      <HomeIndicator dark/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────
Object.assign(window, {
  BabblApp_Home: ScreenHome,
  BabblApp_Analyzing: ScreenAnalyzing,
  BabblApp_Result: ScreenResult,
  BabblApp_Paywall: ScreenPaywall,
  BabblApp_Voice: ScreenVoice,
  BabblC: C,
});
