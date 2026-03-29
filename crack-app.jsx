const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ========== WEB AUDIO SOUND ENGINE ==========
let actx = null;
const getAudioCtx = () => {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    actx = new AC();
  }
  if (actx.state === "suspended") actx.resume();
  return actx;
};

const tone = (freq, dur, type = "square", vol = 0.15) => {
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch (e) {}
};

const SFX = {
  tap: (mult) => tone(300 + Math.min(mult * 80, 2400), 0.06, "square", 0.12),
  combo: (mult) => tone(200 + Math.min(mult * 50, 2000), 0.08, "sawtooth", 0.08),
  notification: () => { tone(880, 0.05, "sine", 0.08); setTimeout(() => tone(1320, 0.08, "sine", 0.08), 50); },
  slotTick: () => tone([523,659,784,1047][Math.floor(Math.random()*4)], 0.03, "triangle", 0.06),
  jackpot: () => [523,659,784,1047,1319].forEach((f,i) => setTimeout(() => tone(f, 0.25, "sawtooth", 0.1), i*100)),
  reward: () => [659,784,988,1319].forEach((f,i) => setTimeout(() => tone(f, 0.15, "sine", 0.1), i*80)),
};

const bgRef = { started: false };
const startBgMusic = () => {
  if (bgRef.started) return;
  bgRef.started = true;
  const notes = [131,165,196,247,262,247,196,165,131,147,175,220,262,220,175,147];
  let idx = 0;
  setInterval(() => { tone(notes[idx++ % notes.length], 0.2, "sine", 0.03); }, 60000/140);
};

// ========== CONSTANTS ==========
const EMOJIS = ["🔥","💎","⚡","🎰","💰","🚀","✨","💥","🎯","👑","💸","🎪","🌈","💊","🍕","😱","🤑","💀","🎵","❤️‍🔥"];
const SLOT_SYMBOLS = ["🍒","🍋","💎","7️⃣","🔔","⭐","🍀","👑"];
const NOTIFICATIONS = [
  "🔥 Brad just passed your streak!","💰 CLAIM YOUR FREE GEMS NOW","⚡ 47 friends are online!",
  "🎰 SPIN THE WHEEL — 1 FREE SPIN!","📸 Someone screenshot your story!","💎 You're in the TOP 3%!",
  "🚨 Your streak expires in 2m!","👑 NEW ACHIEVEMENT UNLOCKED","🎁 Open your mystery box!",
  "💸 FlashSale: 90% OFF (3 left!)","❤️ 12 new likes on your post!","🏆 DAILY REWARD WAITING",
  "😱 You won't BELIEVE this","🔔 Don't miss out — limited time!","⭐ Rate us 5 stars for 100 gems!",
  "🎯 Complete 1 more task for BONUS",
];
const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const neonColors = ["#ff0055","#00ff88","#ff6600","#00ccff","#ff00ff","#ffff00","#00ffff","#ff3366","#66ff33","#ff9900"];

// ========== COMPONENTS ==========

const Particle = ({ index }) => {
  const config = useMemo(() => ({
    emoji: EMOJIS[Math.floor(Math.random()*EMOJIS.length)],
    left: Math.random()*100,
    dur: 2+Math.random()*4,
    size: 12+Math.random()*24,
  }), []);
  return <div style={{
    position:"absolute", left:`${config.left}%`, bottom:"-30px", fontSize:config.size,
    animation:`floatUp ${config.dur}s ease-out ${index*0.4}s infinite`, pointerEvents:"none", zIndex:2,
  }}>{config.emoji}</div>;
};

const Toast = ({ text, bg, onDismiss }) => (
  <div onClick={onDismiss} style={{
    background:`linear-gradient(135deg,${bg},${bg}99)`, backdropFilter:"blur(10px)",
    color:"#fff", padding:"10px 16px", borderRadius:14, marginBottom:6, fontSize:13, fontWeight:700,
    cursor:"pointer", animation:"slideInRight .3s cubic-bezier(.17,.67,.21,1.2)",
    boxShadow:`0 4px 20px ${bg}66`, border:"1px solid rgba(255,255,255,.2)",
    display:"flex", alignItems:"center", gap:8,
  }}>
    <span style={{flex:1}}>{text}</span>
    <span style={{background:"rgba(255,255,255,.3)",borderRadius:8,padding:"2px 8px",fontSize:10,fontWeight:800}}>TAP</span>
  </div>
);

const SlotMachine = () => {
  const [reels, setReels] = useState([0,0,0]);
  const [spinning, setSpinning] = useState(false);
  const [wins, setWins] = useState(0);
  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    let count = 0;
    const iv = setInterval(() => {
      SFX.slotTick();
      setReels([rand(0,7), rand(0,7), rand(0,7)]);
      if (++count > 15) {
        clearInterval(iv);
        setSpinning(false);
        if (Math.random() < 0.4) {
          const sym = rand(0,7);
          setReels([sym,sym,sym]);
          setWins(w => w+1);
          SFX.jackpot();
        }
      }
    }, 80);
  }, [spinning]);
  return (
    <div onClick={spin} style={{
      background:"linear-gradient(135deg,#1a0033,#330066,#1a0033)", border:"2px solid #ff00ff",
      borderRadius:16, padding:12, cursor:"pointer",
      boxShadow: spinning ? "0 0 30px #ff00ff,0 0 60px #ff00ff44" : "0 0 15px #ff00ff44",
    }}>
      <div style={{textAlign:"center",fontSize:10,fontWeight:800,color:"#ff00ff",letterSpacing:3,marginBottom:6}}>🎰 MEGA SLOTS 🎰</div>
      <div style={{display:"flex",justifyContent:"center",gap:6}}>
        {reels.map((r,i) => <div key={i} style={{
          width:50,height:50,background:"linear-gradient(180deg,#000,#110022)",borderRadius:10,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,
          border:"2px solid #ff00ff55", animation: spinning ? "shake .1s infinite" : undefined,
        }}>{SLOT_SYMBOLS[r]}</div>)}
      </div>
      <div style={{textAlign:"center",marginTop:6}}>
        <span style={{color:"#ffff00",fontSize:11,fontWeight:800}}>{spinning?"✨ SPINNING ✨":"TAP TO SPIN — FREE!"}</span>
        {wins > 0 && <div style={{color:"#00ff88",fontSize:10,fontWeight:700}}>🏆 {wins} JACKPOTS WON</div>}
      </div>
    </div>
  );
};

const Counter = ({ label, icon, baseVal }) => {
  const [val, setVal] = useState(baseVal);
  const intervalRef = useRef(null);
  useEffect(() => {
    intervalRef.current = setInterval(() => setVal(v => v + rand(1,7)), rand(300,1500));
    return () => clearInterval(intervalRef.current);
  }, []);
  return (
    <div style={{
      background:"linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.02))",
      borderRadius:12, padding:"8px 6px", textAlign:"center", border:"1px solid rgba(255,255,255,.1)", flex:1,
    }}>
      <div style={{fontSize:20}}>{icon}</div>
      <div style={{fontSize:18,fontWeight:900,fontFamily:"'Orbitron',monospace",textShadow:"0 0 10px rgba(255,255,255,.5)"}}>{val.toLocaleString()}</div>
      <div style={{fontSize:8,color:"rgba(255,255,255,.5)",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{label}</div>
    </div>
  );
};

const ProgressBar = ({ label, pct, color }) => (
  <div style={{marginBottom:8}}>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"rgba(255,255,255,.7)",fontWeight:700,marginBottom:3}}>
      <span>{label}</span><span style={{color}}>{pct}%</span>
    </div>
    <div style={{height:8,background:"rgba(255,255,255,.1)",borderRadius:10,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${color},${color}cc)`,borderRadius:10,boxShadow:`0 0 10px ${color}66`,animation:"pulse 1.5s infinite"}}/>
    </div>
  </div>
);

const FeedItem = ({ index }) => {
  const data = useMemo(() => ({
    likes: rand(100,99999), comments: rand(10,5000), shares: rand(50,9999),
    height: rand(60,120), user: rand(100,9999), time: rand(1,59),
  }), []);
  const gradients = ["linear-gradient(135deg,#ff0055,#ff6600)","linear-gradient(135deg,#7700ff,#00ccff)","linear-gradient(135deg,#00cc44,#00ffcc)","linear-gradient(135deg,#ff00aa,#ffaa00)","linear-gradient(135deg,#0066ff,#00ff88)"];
  const g = gradients[index%5];
  return (
    <div style={{background:"rgba(255,255,255,.05)",borderRadius:14,padding:12,marginBottom:10,border:"1px solid rgba(255,255,255,.08)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:g,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{EMOJIS[index%EMOJIS.length]}</div>
        <div><div style={{fontSize:12,fontWeight:800}}>user_{data.user}</div><div style={{fontSize:9,color:"rgba(255,255,255,.4)"}}>{data.time}m ago</div></div>
        <div style={{marginLeft:"auto",background:"linear-gradient(135deg,#ff0055,#ff6600)",color:"#fff",fontSize:9,fontWeight:800,padding:"3px 10px",borderRadius:20}}>FOLLOW</div>
      </div>
      <div style={{height:data.height,background:g,borderRadius:10,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,opacity:.8}}>{EMOJIS[(index*3)%EMOJIS.length]}</div>
      <div style={{display:"flex",gap:16,fontSize:11,color:"rgba(255,255,255,.6)"}}>
        <span>❤️ {data.likes.toLocaleString()}</span><span>💬 {data.comments.toLocaleString()}</span><span>🔄 {data.shares.toLocaleString()}</span><span style={{marginLeft:"auto"}}>🔖</span>
      </div>
    </div>
  );
};

// ========== MAIN APP ==========
function CrackApp() {
  const [started, setStarted] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [gems, setGems] = useState(12847);
  const [xp, setXp] = useState(89);
  const [taps, setTaps] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [showReward, setShowReward] = useState(false);
  const [pulseColor, setPulseColor] = useState("#ff0055");
  const [countdown, setCountdown] = useState(127);
  const [comboText, setComboText] = useState(null);
  const comboTimer = useRef(null);
  const comboFadeTimer = useRef(null);
  const toastIdRef = useRef(0);
  const feedItems = useMemo(() => Array.from({length:20},(_,i) => i), []);

  const handleStart = useCallback(() => {
    getAudioCtx();
    startBgMusic();
    setStarted(true);
  }, []);

  // Notifications — recursive setTimeout so each has a unique random delay
  useEffect(() => {
    if (!started) return;
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        const note = NOTIFICATIONS[Math.floor(Math.random()*NOTIFICATIONS.length)];
        const id = ++toastIdRef.current;
        setToasts(prev => [...prev.slice(-4), { text: note, id }]);
        SFX.notification();
        schedule();
      }, 1800 + Math.random() * 1700);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [started]);

  // Auto-dismiss oldest toast after 5s
  useEffect(() => {
    if (toasts.length === 0) return;
    const oldest = toasts[0];
    const t = setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== oldest.id));
    }, 5000);
    return () => clearTimeout(t);
  }, [toasts]);

  // Gems ticker
  useEffect(() => {
    if (!started) return;
    const iv = setInterval(() => setGems(g => g + rand(1,13)), 1000);
    return () => clearInterval(iv);
  }, [started]);

  // XP creep
  useEffect(() => {
    if (!started) return;
    const iv = setInterval(() => setXp(x => Math.min(99, x+1)), 3000);
    return () => clearInterval(iv);
  }, [started]);

  // Countdown
  useEffect(() => {
    if (!started) return;
    const iv = setInterval(() => setCountdown(c => c > 0 ? c-1 : 127), 1000);
    return () => clearInterval(iv);
  }, [started]);

  // Pulse color
  useEffect(() => {
    if (!started) return;
    const iv = setInterval(() => setPulseColor(neonColors[Math.floor(Math.random()*neonColors.length)]), 2000);
    return () => clearInterval(iv);
  }, [started]);

  // Reward popup — show and auto-hide as separate effects
  useEffect(() => {
    if (!started) return;
    const iv = setInterval(() => {
      setShowReward(true);
      SFX.reward();
    }, 8000);
    return () => clearInterval(iv);
  }, [started]);

  useEffect(() => {
    if (!showReward) return;
    const t = setTimeout(() => setShowReward(false), 2500);
    return () => clearTimeout(t);
  }, [showReward]);

  // Tap handler
  const handleTap = useCallback((e) => {
    setTaps(t => t+1);
    setGems(g => g + multiplier);
    SFX.tap(multiplier);
    if (multiplier > 1) SFX.combo(multiplier);
    const x = e.clientX || 200;
    const y = e.clientY || 300;
    setComboText({ x, y, val: multiplier, id: Date.now() });
    setMultiplier(m => Math.min(m+1, 99));
    clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => setMultiplier(1), 2000);
    clearTimeout(comboFadeTimer.current);
    comboFadeTimer.current = setTimeout(() => setComboText(null), 600);
  }, [multiplier]);

  const dismissToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  const toastColors = ["#ff0055","#7700ff","#ff6600","#00cc44","#0088ff","#ff00aa"];

  if (!started) {
    return (
      <div onClick={handleStart} style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,cursor:"pointer"}}>
        <style>{CSS}</style>
        <div style={{fontSize:80,animation:"pulse 1s infinite"}}>💎</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:28,background:"linear-gradient(135deg,#ff0055,#ff6600,#ffff00,#00ff88,#00ccff,#ff00ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CrackApp</div>
        <div style={{background:"linear-gradient(135deg,#ff0055,#ff6600)",color:"#fff",fontWeight:800,fontSize:16,padding:"14px 40px",borderRadius:30,boxShadow:"0 4px 30px #ff005566",animation:"glow 2s infinite"}}>TAP TO BEGIN 🚀</div>
        <div style={{fontSize:10,color:"rgba(255,255,255,.3)",marginTop:10}}>Add to Home Screen for fullscreen</div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#000",color:"#fff",fontFamily:"'Segoe UI',system-ui,sans-serif",position:"relative",overflow:"hidden",maxWidth:480,margin:"0 auto"}}>
      <style>{CSS}</style>

      <div style={{position:"fixed",inset:0,background:`radial-gradient(circle at 30% 20%,${pulseColor}33,transparent 50%),radial-gradient(circle at 70% 80%,#7700ff22,transparent 50%)`,animation:"bgPulse 2s infinite",pointerEvents:"none",zIndex:0}}/>

      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1}}>
        {Array.from({length:15},(_,i) => <Particle key={i} index={i}/>)}
      </div>

      <div style={{position:"relative",zIndex:3,padding:"0 12px 100px"}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,.1)"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#ff0055,#ff6600)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,animation:"glow 2s infinite"}}>😈</div>
            <div><div style={{fontSize:11,fontWeight:800}}>Lvl 47</div><div style={{fontSize:8,color:"#ff6600"}}>ELITE STATUS</div></div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{background:"linear-gradient(135deg,#ff990033,#ff660033)",padding:"4px 10px",borderRadius:20,fontSize:12,fontWeight:800,color:"#ffaa00",border:"1px solid #ff660044"}}>🔥 47</div>
            <div style={{background:"linear-gradient(135deg,#00ccff22,#0066ff22)",padding:"4px 10px",borderRadius:20,fontSize:12,fontWeight:800,color:"#00ccff",border:"1px solid #00ccff44",fontFamily:"'Orbitron',monospace"}}>💎 {gems.toLocaleString()}</div>
          </div>
        </div>

        <div style={{overflow:"hidden",marginTop:6,height:18,background:"rgba(255,255,255,.03)",borderRadius:4}}>
          <div style={{whiteSpace:"nowrap",animation:"marquee 12s linear infinite",fontSize:10,fontWeight:700,color:"#ff6600",lineHeight:"18px"}}>
            🚨 BREAKING: user_8392 just hit 1M gems 💎💎💎 &nbsp;&nbsp; 🔥 MEGA EVENT STARTING SOON 🔥 &nbsp;&nbsp; ⚡ 2,847 users online NOW &nbsp;&nbsp; 🎰 JACKPOT POOL: 500,000 GEMS &nbsp;&nbsp; 👑 NEW LEADERBOARD SEASON
          </div>
        </div>

        <div style={{background:"linear-gradient(90deg,#ff0055,#ff6600,#ff0055)",backgroundSize:"200% 100%",animation:"pulse 1s infinite",padding:8,borderRadius:10,marginTop:10,textAlign:"center"}}>
          <div style={{fontSize:9,fontWeight:800,letterSpacing:2,opacity:.8}}>⚠️ LIMITED TIME OFFER EXPIRES IN</div>
          <div style={{fontSize:28,fontWeight:900,fontFamily:"'Orbitron',monospace",textShadow:"0 0 20px rgba(255,255,255,.5)"}}>{formatTime(countdown)}</div>
          <div style={{fontSize:10,fontWeight:700}}>🎁 CLAIM 10,000 FREE GEMS 🎁</div>
        </div>

        <div style={{display:"flex",gap:6,marginTop:10}}>
          <Counter label="Views" icon="👁️" baseVal={284910}/>
          <Counter label="Likes" icon="❤️" baseVal={47832}/>
          <Counter label="Shares" icon="🔄" baseVal={12094}/>
          <Counter label="Gems" icon="💎" baseVal={gems}/>
        </div>

        <div style={{marginTop:12}}>
          <ProgressBar label="🏆 XP to Next Level" pct={xp} color="#00ff88"/>
          <ProgressBar label="🔥 Daily Streak Goal" pct={94} color="#ff6600"/>
          <ProgressBar label="💎 Gem Vault Capacity" pct={87} color="#00ccff"/>
        </div>

        <div onClick={handleTap} style={{
          background:"linear-gradient(135deg,#1a0033,#0a0020)",border:"2px solid",
          animation:"rainbowBorder 3s linear infinite,glow 2s infinite",
          borderRadius:20,padding:20,marginTop:12,textAlign:"center",cursor:"pointer",
        }}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:3,color:"rgba(255,255,255,.5)",marginBottom:4}}>TAP FOR GEMS</div>
          <div style={{fontSize:48,lineHeight:1}}>💎</div>
          <div style={{fontSize:36,fontWeight:900,fontFamily:"'Orbitron',monospace",background:"linear-gradient(135deg,#00ccff,#ff00ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{taps}</div>
          <div style={{fontSize:12,fontWeight:800,color:"#ffff00",marginTop:4}}>
            {multiplier}x COMBO {multiplier>=10?"🔥🔥🔥":multiplier>=5?"🔥🔥":"🔥"}
          </div>
        </div>

        {comboText && <div key={comboText.id} style={{
          position:"fixed",left:comboText.x-30,top:comboText.y-20,fontSize:24,fontWeight:900,
          fontFamily:"'Fredoka One',cursive",color:"#ffff00",textShadow:"0 0 10px #ff6600",
          animation:"comboFloat .6s ease-out forwards",pointerEvents:"none",zIndex:100,
        }}>+{comboText.val}💎</div>}

        <div style={{marginTop:12}}><SlotMachine/></div>

        <div style={{marginTop:16}}>
          <div style={{fontSize:12,fontWeight:800,letterSpacing:2,color:"rgba(255,255,255,.4)",textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:"#ff0055",animation:"pulse 1s infinite",display:"inline-block"}}/> Live Feed — For You
          </div>
          {feedItems.map(i => <FeedItem key={i} index={i}/>)}
        </div>
      </div>

      <div style={{position:"fixed",top:40,right:12,width:260,zIndex:50}}>
        {toasts.map((t,i) => <Toast key={t.id} text={t.text} bg={toastColors[i%toastColors.length]} onDismiss={() => dismissToast(t.id)}/>)}
      </div>

      {showReward && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={() => setShowReward(false)}>
        <div style={{background:"linear-gradient(135deg,#1a0033,#330066)",border:"3px solid #ff00ff",borderRadius:24,padding:"30px 24px",textAlign:"center",animation:"rewardPop .4s cubic-bezier(.17,.67,.21,1.2)",boxShadow:"0 0 60px #ff00ff44,0 0 120px #ff00ff22",maxWidth:280}}>
          <div style={{fontSize:48}}>🎁</div>
          <div style={{fontSize:22,fontWeight:900,fontFamily:"'Fredoka One',cursive",background:"linear-gradient(135deg,#ffff00,#ff6600)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginTop:8}}>REWARD UNLOCKED!</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginTop:6}}>You earned <span style={{color:"#00ff88",fontWeight:800}}>500 GEMS</span></div>
          <div style={{background:"linear-gradient(135deg,#ff0055,#ff6600)",color:"#fff",fontWeight:800,fontSize:14,padding:"10px 24px",borderRadius:30,marginTop:14,boxShadow:"0 4px 20px #ff005566"}}>CLAIM NOW</div>
          <div style={{fontSize:9,color:"rgba(255,255,255,.3)",marginTop:8}}>Tap anywhere to dismiss (but why would you?)</div>
        </div>
      </div>}

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"linear-gradient(180deg,transparent,rgba(0,0,0,.9) 30%)",padding:"20px 16px 16px",zIndex:40}}>
        <div style={{display:"flex",justifyContent:"space-around",background:"rgba(255,255,255,.05)",borderRadius:20,padding:"8px 0",border:"1px solid rgba(255,255,255,.1)",backdropFilter:"blur(10px)"}}>
          {[{icon:"🏠",label:"Feed",badge:47},{icon:"🔍",label:"Explore"},{icon:"➕",label:"Create",special:true},{icon:"🎰",label:"Games",badge:3},{icon:"👤",label:"Profile",badge:12}].map((tab,i) => (
            <div key={i} style={{textAlign:"center",cursor:"pointer",position:"relative",flex:1}}>
              {tab.special
                ? <div style={{width:40,height:40,borderRadius:14,background:"linear-gradient(135deg,#ff0055,#ff6600)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,margin:"-12px auto 0",boxShadow:"0 4px 15px #ff005566"}}>{tab.icon}</div>
                : <div style={{fontSize:20}}>{tab.icon}</div>}
              <div style={{fontSize:9,color:"rgba(255,255,255,.5)",fontWeight:600,marginTop:2}}>{tab.label}</div>
              {tab.badge && <div style={{position:"absolute",top:-4,right:"20%",background:"#ff0055",color:"#fff",fontSize:8,fontWeight:800,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #000"}}>{tab.badge}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Fredoka+One&display=swap');
@keyframes floatUp{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(-100vh) rotate(360deg);opacity:0}}
@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px) rotate(-2deg)}75%{transform:translateX(3px) rotate(2deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}
@keyframes rainbowBorder{0%{border-color:#ff0055}16%{border-color:#ff6600}33%{border-color:#ffff00}50%{border-color:#00ff88}66%{border-color:#00ccff}83%{border-color:#ff00ff}100%{border-color:#ff0055}}
@keyframes glow{0%,100%{box-shadow:0 0 20px #ff005566,0 0 40px #ff005533}50%{box-shadow:0 0 40px #ff005599,0 0 80px #ff005555}}
@keyframes comboFloat{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-80px) scale(2);opacity:0}}
@keyframes rewardPop{0%{transform:scale(0) rotate(-10deg);opacity:0}50%{transform:scale(1.1) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes bgPulse{0%,100%{opacity:.15}50%{opacity:.3}}
@keyframes marquee{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
*{-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
`;
