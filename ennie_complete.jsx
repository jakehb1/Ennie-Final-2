import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   ENNIE — Complete App v2.0
   Original 23 screens + Specialization Engine + Smart Queue
   ═══════════════════════════════════════════════════════════════ */

/* ─── Design Tokens ─── */
const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", card: "#FFFFFF", cardHover: "#FAFAFA",
  border: "#EBEBEB", borderLight: "#F0F0F0", text: "#0A0A0A", textMuted: "#6B6B6B",
  textDim: "#AAAAAA", accent: "#8B3FFF", accentDim: "rgba(139,63,255,0.08)",
  accentGlow: "rgba(139,63,255,0.18)", warm: "#E07830", warmDim: "rgba(224,120,48,0.08)",
  danger: "#A32D2D", dangerDim: "rgba(163,45,45,0.08)", blue: "#185FA5",
  blueDim: "rgba(24,95,165,0.08)", purple: "#8B3FFF", purpleDim: "rgba(139,63,255,0.08)",
  pink: "#E88FB0", pinkDim: "rgba(232,143,176,0.12)",
  green: "#2E9E68", greenDim: "rgba(46,158,104,0.10)",
  grad: "linear-gradient(135deg, #0A0A0A, #2A2A2A)",
  gradHero: "radial-gradient(ellipse 110% 65% at 50% -5%, #9747FF 0%, #C4A0FF 38%, #EDE0FF 60%, #FFFFFF 80%)",
  gradWarm: "linear-gradient(135deg, #E07830, #D63B3B)",
};

/* ── Queue Engine ── */
const computeWait = (tier, patients = 3, committed = 4) => {
  const base = Math.max(2, Math.round((patients / Math.max(committed, 1)) * 5));
  if (tier === "free") return Math.min(base * 2, 60);
  if (tier === "today") return Math.min(base, 90);
  if (tier === "week") return Math.min(base * 3, 7 * 24 * 60);
  return base;
};
const fmtWait = (m) => {
  if (m < 2) return "under 2 min";
  if (m < 60) return `~${m} min`;
  if (m < 24 * 60) return `~${Math.round(m / 60)} hr`;
  return `~${Math.round(m / (24 * 60))} days`;
};
const systemWindow = (patients = 3, committed = 4) =>
  Math.max(5, Math.min(20, Math.round(15 - (patients - committed) * 1.5)));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ─── Global Styles ─── */
const GlobalCSS = () => (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet" />
    <style>{`
      * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
      body { background: ${T.bg}; color: ${T.text}; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
      h1,h2,h3,h4 { font-family: 'Syne', sans-serif !important; letter-spacing: -0.025em; }
      @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      @keyframes slideDown { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:translateY(0) } }
      @keyframes pulse { 0%,100% { opacity:.3 } 50% { opacity:1 } }
      @keyframes breathe { 0%,100% { transform:scale(1) } 50% { transform:scale(1.04) } }
      @keyframes spin { to { transform:rotate(360deg) } }
      @keyframes shimmer { 0% { background-position:-200% 0 } 100% { background-position:200% 0 } }
      @keyframes ripple { 0% { transform:scale(.8);opacity:.6 } 100% { transform:scale(2.4);opacity:0 } }
      @keyframes orbFloat { 0%,100% { transform:scale(1) } 50% { transform:scale(1.06) } }
      @keyframes orbRing1 { 0%,100% { transform:scale(1);opacity:.2 } 50% { transform:scale(1.3);opacity:.06 } }
      @keyframes orbRing2 { 0%,100% { transform:scale(1.05);opacity:.12 } 50% { transform:scale(1.5);opacity:.02 } }
      @keyframes orbPulse { 0%,100% { transform:scale(1) } 25% { transform:scale(1.18) } 75% { transform:scale(.92) } }
      @keyframes orbRipple { 0% { transform:scale(1);opacity:.35 } 100% { transform:scale(2.2);opacity:0 } }
      @keyframes captionFade { from { opacity:0;transform:translateY(6px) } to { opacity:1;transform:translateY(0) } }
      ::-webkit-scrollbar { width:4px }
      ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:4px }
      input, textarea, select { font-family: inherit; }
      button { font-family: inherit; }
    `}</style>
  </>
);

/* ═══════════════ SHARED COMPONENTS ═══════════════ */

const Logo = ({ size = 20, full }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" stroke={T.accent} strokeWidth="1.5" opacity=".3" />
      <path d="M12 3C7 3 3 7 3 12s4 9 9 9" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M12 9c-1.7 0-3 1.3-3 3s1.3 3 3 3" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
    <div>
      <span style={{ fontSize: size, fontWeight: 800, letterSpacing: -0.5, color: T.text }}>Ennie</span>
      {full && <span style={{ fontSize: size * 0.45, color: T.textMuted, fontWeight: 400, display: "block", marginTop: -2 }}>by Charlie Goldsmith</span>}
    </div>
  </div>
);

const Header = ({ left, center, right }) => (
  <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.94)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 20, minHeight: 52 }}>
    <div style={{ flex: 1, display: "flex", alignItems: "center" }}>{left || <Logo />}</div>
    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>{center}</div>
    <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>{right}</div>
  </div>
);

const Badge = ({ children, color = T.accent, bg }) => (
  <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color, background: bg || (color + "18"), letterSpacing: 0.3 }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "primary", full, disabled, small, style: sx }) => {
  const base = { padding: small ? "9px 18px" : "14px 22px", borderRadius: 100, fontSize: small ? 13 : 15, fontWeight: 600, cursor: disabled ? "default" : "pointer", border: "none", width: full ? "100%" : "auto", opacity: disabled ? 0.4 : 1, transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };
  const variants = {
    primary: { ...base, background: T.grad, color: "#FFFFFF" },
    secondary: { ...base, background: T.card, color: T.text, border: `1px solid ${T.border}` },
    ghost: { ...base, background: "transparent", color: T.textMuted, border: `1px solid ${T.border}` },
    danger: { ...base, background: T.dangerDim, color: T.danger, border: `1px solid ${T.danger}30` },
    accent: { ...base, background: T.accentDim, color: T.accent, border: `1px solid ${T.accent}30` },
    warm: { ...base, background: T.warmDim, color: T.warm, border: `1px solid ${T.warm}30` },
    green: { ...base, background: T.greenDim, color: T.green, border: `1px solid ${T.green}30` },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...variants[variant], ...sx }}>{children}</button>;
};

const Card = ({ children, style: sx, onClick }) => (
  <div onClick={onClick} style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, padding: 18, ...(onClick ? { cursor: "pointer" } : {}), ...sx }}>{children}</div>
);

const ScreenWrap = ({ children, pad = true }) => (
  <div style={{ flex: 1, overflowY: "auto", padding: pad ? 16 : 0 }}>{children}</div>
);

const Divider = () => <div style={{ height: 1, background: T.border, margin: "16px 0" }} />;

const Label = ({ children }) => <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{children}</div>;

const Input = ({ value, onChange, placeholder, type = "text", style: sx }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 14, outline: "none", ...sx }} />
);

const Toggle = ({ on, onToggle, label }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} onClick={onToggle}>
    <span style={{ fontSize: 14, color: T.text }}>{label}</span>
    <div style={{ width: 48, height: 28, borderRadius: 14, background: on ? T.accent : "#D8D0EC", padding: 3, cursor: "pointer", transition: "background .2s" }}>
      <div style={{ width: 22, height: 22, borderRadius: 11, background: "#fff", transform: on ? "translateX(20px)" : "translateX(0)", transition: "transform .2s" }} />
    </div>
  </div>
);

const TypingDots = () => (
  <div style={{ display: "flex", gap: 4, padding: "10px 14px" }}>
    {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.textMuted, animation: `pulse 1.2s ease ${i * .2}s infinite` }} />)}
  </div>
);

const ChatBubble = ({ text, isAI }) => (
  <div style={{ display: "flex", justifyContent: isAI ? "flex-start" : "flex-end", marginBottom: 8, animation: "slideUp .3s ease" }}>
    {isAI && <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, marginTop: 2, fontSize: 10, fontWeight: 800, color: "#fff" }}>E</div>}
    <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: isAI ? "4px 16px 16px 16px" : "16px 4px 16px 16px", background: isAI ? T.bg : T.accentDim, border: `1px solid ${isAI ? T.border : T.accent + "30"}`, color: T.text, fontSize: 13.5, lineHeight: 1.55 }}>{text}</div>
  </div>
);

/* ─── Body Map ─── */
const BodyMap = ({ side = "front", pins = [], onAddPin, onSelectPin, selectedPin, small }) => {
  const svgRef = useRef(null);
  const w = small ? 140 : 200;
  const h = small ? 266 : 380;
  const handleClick = (e) => {
    if (!onAddPin) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    const x = +((svgP.x / w * 100).toFixed(1));
    const y = +((svgP.y / h * 100).toFixed(1));
    if (x > 15 && x < 85 && y > 3 && y < 95) onAddPin(x, y, side);
  };
  const bodyPath = `M100,30 C100,14 88,4 80,4 C72,4 68,10 68,18 C68,28 76,36 80,38 L80,42 C76,44 60,50 56,56 L42,100 C40,106 44,110 48,110 L60,108 L58,106 C56,104 56,100 58,96 L68,72 L68,130 C68,140 62,200 60,220 L56,280 C54,300 56,310 60,316 L64,340 C66,348 70,352 76,352 C82,352 84,348 82,340 L78,300 L80,260 L82,300 L78,340 C76,348 78,352 84,352 C90,352 94,348 96,340 L100,316 C104,310 106,300 104,280 L100,220 C98,200 92,140 92,130 L92,72 L102,96 C104,100 104,104 102,106 L100,108 L112,110 C116,110 120,106 118,100 L104,56 C100,50 84,44 80,42`;
  const sidePins = pins.filter(p => p.side === side);
  return (
    <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxWidth: small ? 140 : 200, cursor: onAddPin ? "crosshair" : "default" }} onClick={handleClick}>
      <defs>
        <radialGradient id={`bg${side}${small?'s':''}`} cx="50%" cy="30%"><stop offset="0%" stopColor="#D8D0EC" /><stop offset="100%" stopColor="#C8BEE0" /></radialGradient>
        <filter id="glow2"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {side === "back" && <line x1="80" y1="42" x2="80" y2="310" stroke={T.textDim} strokeWidth=".5" strokeDasharray="3,3" opacity=".3" />}
      <g transform={`scale(${w/200},${h/380})`}><path d={bodyPath} fill={`url(#bg${side}${small?'s':''})`} stroke={T.borderLight} strokeWidth="1.5" transform="translate(20,8)" /></g>
      <text x={w/2} y={h - 4} textAnchor="middle" fill={T.textDim} fontSize={small ? 10 : 12}>{side.toUpperCase()}</text>
      {sidePins.map(p => {
        const cx = p.x / 100 * w, cy = p.y / 100 * h;
        const sel = selectedPin === p.id;
        const c = p.severity > 6 ? T.danger : p.severity > 3 ? T.warm : T.accent;
        return (
          <g key={p.id} onClick={e => { e.stopPropagation(); onSelectPin?.(p.id); }} style={{ cursor: "pointer" }}>
            <circle cx={cx} cy={cy} r={small ? 10 : 14} fill={c} opacity=".15" />
            <circle cx={cx} cy={cy} r={sel ? 8 : 6} fill={c} opacity={sel ? .9 : .7} filter={sel ? "url(#glow2)" : ""} />
            <text x={cx} y={cy + 3} textAnchor="middle" fill="#fff" fontSize={small ? 6 : 8} fontWeight="700" style={{ pointerEvents: "none" }}>{p.severity}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ─── Severity Slider ─── */
const Slider = ({ value, onChange, min = 0, max = 10 }) => {
  const ref = useRef(null);
  const pct = ((value - min) / (max - min)) * 100;
  const color = value > 6 ? T.danger : value > 3 ? T.warm : T.accent;
  const handle = e => {
    const r = ref.current.getBoundingClientRect();
    const cx = e.pointerId !== undefined ? e.clientX : (e.touches ? e.touches[0].clientX : e.clientX);
    onChange(Math.round(clamp((cx - r.left) / r.width, 0, 1) * (max - min) + min));
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: T.textMuted }}>None</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}/{max}</span>
        <span style={{ fontSize: 12, color: T.textMuted }}>Severe</span>
      </div>
      <div ref={ref}
        onPointerDown={e => { e.target.setPointerCapture(e.pointerId); handle(e); }}
        onPointerMove={e => { if (e.pressure > 0) handle(e); }}
        onTouchStart={handle} onTouchMove={handle}
        style={{ position: "relative", height: 32, background: T.surface, borderRadius: 16, cursor: "pointer", overflow: "hidden", border: `1px solid ${T.border}`, touchAction: "none" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `linear-gradient(90deg, ${T.accent}, ${color})`, borderRadius: 16, transition: "width .05s" }} />
        <div style={{ position: "absolute", left: `calc(${pct}% - 16px)`, top: 0, width: 32, height: 32, borderRadius: "50%", background: "#fff", boxShadow: `0 0 12px ${color}60`, transition: "left .05s", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: color }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, padding: "0 4px" }}>
        {["Mild", "Moderate", "Severe"].map((l, i) => (
          <span key={l} style={{ fontSize: 12, color: T.textDim, textAlign: i === 0 ? "left" : i === 1 ? "center" : "right", flex: 1 }}>{l}</span>
        ))}
      </div>
    </div>
  );
};

/* ─── Timer Ring ─── */
const TimerRing = React.memo(({ seconds, total }) => {
  const pct = seconds / total;
  const r = 24, circ = 2 * Math.PI * r;
  const color = seconds < 60 ? T.danger : seconds < 150 ? T.warm : T.accent;
  const m = Math.floor(seconds / 60), s = seconds % 60;
  return (
    <div style={{ position: "relative", width: 58, height: 58 }}>
      <svg viewBox="0 0 58 58" style={{ width: 58, height: 58, transform: "rotate(-90deg)" }}>
        <circle cx="29" cy="29" r={r} fill="none" stroke={T.border} strokeWidth="3.5" />
        <circle cx="29" cy="29" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear, stroke .5s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{m}:{s.toString().padStart(2, "0")}</span>
      </div>
    </div>
  );
});

/* ─── Silhouette ─── */
const Silhouette = ({ active }) => (
  <svg viewBox="0 0 120 160" style={{ width: 90, height: 120 }}>
    <defs>
      <radialGradient id="aura2" cx="50%" cy="40%">
        <stop offset="0%" stopColor={T.accent} stopOpacity={active ? .15 : .03} />
        <stop offset="70%" stopColor={T.purple} stopOpacity={active ? .06 : 0} />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
    <ellipse cx="60" cy="80" rx="55" ry="75" fill="url(#aura2)">{active && <animate attributeName="rx" values="55;58;55" dur="3s" repeatCount="indefinite" />}</ellipse>
    <circle cx="60" cy="38" r="18" fill="#D8D0EC" />
    <ellipse cx="60" cy="95" rx="28" ry="45" fill="#D8D0EC" />
  </svg>
);

/* ─── Progress Bar ─── */
const ProgressBar = ({ value, max = 100, color = T.accent, height = 6 }) => (
  <div style={{ height, background: T.surface, borderRadius: 3, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${Math.min(100, (value / max) * 100)}%`, background: color, borderRadius: 3, transition: "width .4s" }} />
  </div>
);

/* ─── Stat Card ─── */
const StatCard = ({ label, value, sub, color = T.accent, icon }) => (
  <Card style={{ flex: "1 1 45%", minWidth: 120, animation: "slideUp .4s ease" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{sub}</div>}
      </div>
      {icon && <span style={{ fontSize: 22, opacity: .5 }}>{icon}</span>}
    </div>
  </Card>
);

/* ─── Tab Bar ─── */
const TabBar = ({ tabs, active, onTab }) => (
  <div style={{ borderTop: `1px solid ${T.border}`, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", position: "sticky", bottom: 0, zIndex: 20, padding: "10px 16px 14px" }}>
    <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTab(t.id)} style={{
          flexShrink: 0, padding: "8px 16px", borderRadius: 100,
          border: active === t.id ? "none" : `1px solid ${T.border}`,
          background: active === t.id ? T.text : "transparent",
          color: active === t.id ? "#FFFFFF" : T.textMuted,
          fontSize: 13, fontWeight: active === t.id ? 600 : 400,
          cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ fontSize: 14 }}>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  </div>
);

/* ─── Back Button ─── */
const BackBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>←</button>
);

/* ─── Results Data Panel — Three tiers: testing, verified, group ─── */
const RESULTS_DATA = {
  testing: {
    title: "Healer Testing Sessions (Free)",
    subtitle: "These are unverified healers being tested on the platform. Results are lower — your feedback helps us find the real ones.",
    badge: "Test healers",
    badgeColor: T.warm,
    conditions: [
      { label: "Chronic pain", pct: 38, placebo: 38, participants: 2100, icon: "🔧", avgDrop: "2.1 pts" },
      { label: "Migraine & headaches", pct: 42, placebo: 35, participants: 1600, icon: "🧠", avgDrop: "2.5 pts" },
      { label: "Arthritis", pct: 40, placebo: 40, participants: 1400, icon: "🦴", avgDrop: "2.3 pts" },
      { label: "Back & joint pain", pct: 35, placebo: 38, participants: 1800, icon: "💪", avgDrop: "1.9 pts" },
      { label: "Fibromyalgia", pct: 22, placebo: 25, participants: 600, icon: "💢", avgDrop: "1.1 pts" },
      { label: "Stress & anxiety", pct: 44, placebo: 30, participants: 1200, icon: "🌀", avgDrop: "2.7 pts" },
      { label: "Neuropathy", pct: 18, placebo: 22, participants: 400, icon: "⚡", avgDrop: "0.9 pts" },
      { label: "Emotional / trauma", pct: 36, placebo: 28, participants: 900, icon: "💜", avgDrop: "2.0 pts" },
    ],
  },
  verified: {
    title: "Super Sessions (Verified Healers)",
    subtitle: "These are healers who've passed our qualification threshold — 75%+ success rate validated by UCI research.",
    badge: "Verified healers",
    badgeColor: T.green,
    conditions: [
      { label: "Chronic pain", pct: 74, placebo: 38, participants: 3200, icon: "🔧", avgDrop: "4.8 pts" },
      { label: "Migraine & headaches", pct: 79, placebo: 35, participants: 2400, icon: "🧠", avgDrop: "5.2 pts" },
      { label: "Arthritis", pct: 82, placebo: 40, participants: 2100, icon: "🦴", avgDrop: "5.5 pts" },
      { label: "Back & joint pain", pct: 72, placebo: 38, participants: 2800, icon: "💪", avgDrop: "4.5 pts" },
      { label: "Fibromyalgia", pct: 52, placebo: 25, participants: 800, icon: "💢", avgDrop: "3.1 pts" },
      { label: "Stress & anxiety", pct: 81, placebo: 30, participants: 1800, icon: "🌀", avgDrop: "5.6 pts" },
      { label: "Neuropathy", pct: 46, placebo: 22, participants: 500, icon: "⚡", avgDrop: "2.6 pts" },
      { label: "Emotional / trauma", pct: 76, placebo: 28, participants: 1400, icon: "💜", avgDrop: "5.0 pts" },
    ],
  },
  group: {
    title: "Group Healing (1,000 Healers)",
    subtitle: "1,000 of our top healers working simultaneously. 30-minute sessions. Data from every participant.",
    badge: "1,000 healers",
    badgeColor: T.purple,
    conditions: [
      { label: "Chronic pain", pct: 68, placebo: 38, participants: 2400, icon: "🔧", avgDrop: "4.2 pts" },
      { label: "Migraine & headaches", pct: 71, placebo: 35, participants: 1800, icon: "🧠", avgDrop: "4.8 pts" },
      { label: "Arthritis", pct: 65, placebo: 40, participants: 1500, icon: "🦴", avgDrop: "3.9 pts" },
      { label: "Back & joint pain", pct: 64, placebo: 38, participants: 2100, icon: "💪", avgDrop: "4.0 pts" },
      { label: "Fibromyalgia", pct: 48, placebo: 25, participants: 900, icon: "💢", avgDrop: "2.8 pts" },
      { label: "Stress & anxiety", pct: 72, placebo: 30, participants: 1600, icon: "🌀", avgDrop: "5.1 pts" },
      { label: "Neuropathy", pct: 42, placebo: 22, participants: 600, icon: "⚡", avgDrop: "2.4 pts" },
      { label: "Emotional / trauma", pct: 66, placebo: 28, participants: 1100, icon: "💜", avgDrop: "4.5 pts" },
    ],
  },
};

const ResultsDataPanel = ({ type = "all", defaultOpen = false, compact = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState(type === "all" ? "verified" : type);
  const showTabs = type === "all";
  const data = RESULTS_DATA[activeTab] || RESULTS_DATA.verified;

  return (
    <div style={{ marginBottom: 14 }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: compact ? "8px 12px" : "10px 14px", borderRadius: 14, border: `1px solid ${T.green}25`, background: T.greenDim, color: T.green, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>📊 See the data — results by condition</span>
        <span>{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <Card style={{ marginTop: 8, padding: compact ? "12px" : "16px", animation: "slideUp .2s ease" }}>
          {/* Tabs if showing all types */}
          {showTabs && (
            <div style={{ display: "flex", gap: 3, padding: 2, borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 12 }}>
              {[
                { id: "testing", label: "Free / Testing", color: T.warm },
                { id: "verified", label: "Verified", color: T.green },
                { id: "group", label: "Group", color: T.purple },
              ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", background: activeTab === t.id ? T.card : "transparent", color: activeTab === t.id ? t.color : T.textMuted, transition: "all .15s" }}>{t.label}</button>
              ))}
            </div>
          )}

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: compact ? 12 : 13, fontWeight: 700 }}>{data.title}</span>
            <Badge color={data.badgeColor}>{data.badge}</Badge>
          </div>
          {!compact && <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5, marginBottom: 10 }}>{data.subtitle}</p>}

          {/* Conditions */}
          {data.conditions.map((c, i) => {
            const abovePlacebo = c.pct > c.placebo;
            const resultColor = c.pct >= 65 ? T.green : c.pct >= 40 ? T.accent : T.warm;
            return (
              <div key={i} style={{ padding: compact ? "5px 0" : "7px 0", borderBottom: i < data.conditions.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: compact ? 12 : 14 }}>{c.icon}</span>
                    <span style={{ fontSize: compact ? 11 : 12, fontWeight: 600 }}>{c.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: T.danger }}>P: {c.placebo}%</span>
                    <span style={{ fontSize: compact ? 12 : 13, fontWeight: 800, color: resultColor }}>{c.pct}%</span>
                  </div>
                </div>
                {/* Bar with placebo marker */}
                <div style={{ position: "relative", paddingLeft: compact ? 17 : 19 }}>
                  <div style={{ position: "relative", height: compact ? 6 : 8, background: T.border, borderRadius: 4, overflow: "visible" }}>
                    {/* Result bar */}
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${c.pct}%`, background: resultColor, borderRadius: 4, transition: "width .3s" }} />
                    {/* Placebo marker line */}
                    <div style={{ position: "absolute", left: `${c.placebo}%`, top: -2, bottom: -2, width: 2, background: T.danger, borderRadius: 1, transform: "translateX(-50%)" }} />
                  </div>
                </div>
                {!compact && (
                  <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 19, marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: T.textDim }}>{c.participants.toLocaleString()} participants</span>
                    <span style={{ fontSize: 10, color: abovePlacebo ? T.green : T.danger }}>{abovePlacebo ? `+${c.pct - c.placebo}% above placebo` : `${c.pct - c.placebo}% vs placebo`}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Legend */}
          <div style={{ padding: "8px 0 0", marginTop: 6, borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 2, height: 10, background: T.danger, borderRadius: 1 }} />
              <span style={{ fontSize: 9, color: T.textDim }}>Placebo baseline</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 12, height: 6, borderRadius: 3, background: T.accent }} />
              <span style={{ fontSize: 9, color: T.textDim }}>Success rate</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 20, height: 14, borderRadius: 3, background: T.blue + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: T.blue }}>UCI</div>
              <span style={{ fontSize: 9, color: T.textDim }}>Validated</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SPECIALIZATION DATA
   ═══════════════════════════════════════════════════════════════ */
const CONDITIONS_DATA = [
  { id: "arthritis",    label: "Arthritis",        icon: "🦴", sessions: 8,  avgDrop: 4.2, beatPlacebo: true,  pct: 92, successByTier: { free: 32, today: 82, week: 78, line: 76 } },
  { id: "migraine",     label: "Migraine",          icon: "🧠", sessions: 5,  avgDrop: 3.8, beatPlacebo: true,  pct: 84, successByTier: { free: 25, today: 79, week: 76, line: 76 } },
  { id: "chronic_back", label: "Chronic back pain", icon: "🔧", sessions: 6,  avgDrop: 2.9, beatPlacebo: true,  pct: 71, successByTier: { free: 22, today: 74, week: 70, line: 68 } },
  { id: "fibromyalgia", label: "Fibromyalgia",      icon: "💢", sessions: 3,  avgDrop: 1.1, beatPlacebo: false, pct: 38, successByTier: { free: 12, today: 45, week: 42, line: 40 } },
  { id: "neuropathy",   label: "Neuropathy",        icon: "⚡", sessions: 2,  avgDrop: 0.8, beatPlacebo: false, pct: 29, successByTier: { free: 9,  today: 35, week: 32, line: 30 } },
  { id: "anxiety",      label: "Anxiety / stress",  icon: "🌀", sessions: 4,  avgDrop: 2.1, beatPlacebo: false, pct: 52, successByTier: { free: 16, today: 58, week: 55, line: 52 } },
];
const OVERALL_STATS = { sessions: 20, beatPlacebo: 14, pct: 70, threshold: 75 };

/* ═══════════════════════════════════════════════════════════════
   SCREEN 1: Landing — Redesigned with social proof + how it works
   ═══════════════════════════════════════════════════════════════ */
const LandingScreen = ({ onGetStarted, onJoinHealer, onLogin }) => (
  <div style={{ flex: 1, overflowY: "auto", background: "#FFFFFF", display: "flex", flexDirection: "column" }}>
    {/* Gradient hero */}
    <div style={{ background: T.gradHero, minHeight: "50vh", display: "flex", flexDirection: "column", padding: "48px 24px 28px", animation: "fadeIn .8s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "auto" }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" stroke="#0A0A0A" strokeWidth="1.5" opacity=".25" />
          <path d="M12 3C7 3 3 7 3 12s4 9 9 9" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: -0.4, color: "#0A0A0A" }}>Ennie</span>
      </div>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(46px,12vw,60px)", fontWeight: 800, lineHeight: 0.92, letterSpacing: -3, color: "#0A0A0A", marginBottom: 16 }}>
        Energy<br />Healing.
      </h1>
      <p style={{ fontSize: 15, color: "rgba(10,10,10,.6)", lineHeight: 1.5, maxWidth: 300, marginBottom: 20 }}>
        Real healers. Real-time symptom tracking. Validated by UC Irvine research.
      </p>
    </div>

    {/* Social proof strip */}
    <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}` }}>
      {[
        { value: "72%", label: "report improvement" },
        { value: "UCI", label: "research-backed" },
        { value: "5 min", label: "per session" },
      ].map((s, i) => (
        <div key={i} style={{ flex: 1, textAlign: "center", padding: "14px 8px", borderRight: i < 2 ? `1px solid ${T.border}` : "none" }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: T.text }}>{s.value}</div>
          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>

    {/* How it works */}
    <div style={{ padding: "24px 24px 20px" }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: -0.5, marginBottom: 16 }}>How it works</h2>
      {[
        { num: "1", icon: "🗣️", title: "Tell us your symptoms", desc: "Our AI guides you through a quick intake — tap where it hurts, rate your severity." },
        { num: "2", icon: "✦", title: "A healer works remotely", desc: "You're matched anonymously with a tested energy healer. They work while you relax — no calls, no video." },
        { num: "3", icon: "📊", title: "Track your results", desc: "Report changes in real-time. Your data contributes to ongoing research with UC Irvine." },
      ].map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16, animation: `slideUp ${.3 + i * .1}s ease` }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{s.icon}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{s.title}</div>
            <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>{s.desc}</p>
          </div>
        </div>
      ))}
    </div>

    {/* What people experience */}
    <div style={{ padding: "0 24px 20px" }}>
      <div style={{ borderRadius: 16, background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`, border: `1px solid ${T.accent}20`, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.blue + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: T.blue }}>UCI</div>
          <span style={{ fontSize: 11, color: T.textMuted }}>Based on research with UC Irvine</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { pct: "72%", label: "report meaningful improvement", color: T.green },
            { pct: "3.7", label: "avg severity point drop per session", color: T.accent },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 6px", borderRadius: 12, background: "rgba(255,255,255,0.6)" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: s.color }}>{s.pct}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Important note */}
    <div style={{ padding: "0 24px 20px" }}>
      <div style={{ padding: "12px 14px", borderRadius: 12, background: T.surface, border: `1px solid ${T.border}` }}>
        <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>Energy healing is complementary — not a replacement for medical care. Results vary. We're transparent about success rates so you can make an informed choice.</p>
      </div>
    </div>

    {/* Deep data */}
    <div style={{ padding: "0 24px 16px" }}>
      <ResultsDataPanel compact />
    </div>

    {/* CTAs */}
    <div style={{ padding: "4px 24px 36px" }}>
      <Btn onClick={onGetStarted} full style={{ marginBottom: 10, fontSize: 16 }}>Try it free — start a session</Btn>
      <Btn onClick={onJoinHealer} variant="secondary" full style={{ marginBottom: 14 }}>Apply as a healer</Btn>
      <button onClick={onLogin} style={{ display: "block", margin: "0 auto", background: "none", border: "none", color: T.textMuted, fontSize: 14, cursor: "pointer" }}>Already have an account? Login</button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   SCREEN 2: Sign Up
   ═══════════════════════════════════════════════════════════════ */
const SignUpScreen = ({ onContinue, onBack }) => {
  const [email, setEmail] = useState("");
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Sign up</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease", paddingTop: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Create your account</h2>
          <p style={{ fontSize: 14, color: T.textMuted, marginBottom: 28 }}>No password needed — we'll send a magic link.</p>
          <Label>EMAIL</Label>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
          <div style={{ height: 16 }} />
          <Btn onClick={() => onContinue(email)} full disabled={!email.includes("@")}>Continue with magic link</Btn>
          <Divider />
          <Btn variant="secondary" full style={{ marginBottom: 10 }} onClick={() => onContinue("apple")}><span style={{ fontSize: 18 }}></span> Sign in with Apple</Btn>
          <Btn variant="secondary" full onClick={() => onContinue("google")}><span style={{ fontSize: 16 }}>G</span> Sign in with Google</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 2b: Patient Onboarding — What to expect
   ═══════════════════════════════════════════════════════════════ */
const PatientOnboardScreen = ({ onContinue, onBack }) => {
  const [step, setStep] = useState(0);

  // Step 0: What is energy healing?
  if (step === 0) return (
    <>
      <Header left={<BackBtn onClick={onBack} />} right={<span style={{ fontSize: 11, color: T.textDim }}>1/3</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✦</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>What is energy healing?</h2>
            <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>A practitioner focuses their intention on your symptoms — remotely, without physical contact.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {[
              { icon: "🌍", title: "It's remote", desc: "Your healer could be anywhere in the world. No video, no calls — just focused intention." },
              { icon: "🤖", title: "AI-mediated", desc: "You never speak to the healer directly. Our AI handles all communication to keep things safe and anonymous." },
              { icon: "📊", title: "Measured in real-time", desc: "You rate your symptoms before, during, and after. Every data point is tracked as part of research with UC Irvine." },
              { icon: "🔬", title: "We're honest about it", desc: "Energy healing doesn't work for everyone. We show you real success rates so you can decide for yourself." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, animation: `slideUp ${.3 + i * .08}s ease` }}>
                <span style={{ fontSize: 20, marginTop: 1 }}>{item.icon}</span>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div><div style={{ fontSize: 12, color: T.textMuted, marginTop: 1, lineHeight: 1.45 }}>{item.desc}</div></div>
              </div>
            ))}
          </div>

          <Btn onClick={() => setStep(1)} full>What happens in a session? →</Btn>
        </div>
      </ScreenWrap>
    </>
  );

  // Step 1: What a session looks like
  if (step === 1) return (
    <>
      <Header left={<BackBtn onClick={() => setStep(0)} />} right={<span style={{ fontSize: 11, color: T.textDim }}>2/3</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>What a session looks like</h2>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20, lineHeight: 1.5 }}>The whole thing takes about 5 minutes. Here's what you'll do:</p>

          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{ position: "absolute", left: 12, top: 8, bottom: 8, width: 2, background: `linear-gradient(180deg, ${T.accent}, ${T.green})`, borderRadius: 1 }} />
            {[
              { icon: "🗣️", title: "Intake", desc: "Our AI asks about your symptoms. You mark them on a body map and rate severity.", time: "~2 min" },
              { icon: "⏳", title: "Queue", desc: "You join the queue. We notify you when a healer is ready — start whenever your symptoms are active.", time: "varies" },
              { icon: "✦", title: "Session", desc: "A healer works remotely while you relax. The AI checks in with you during the session — just report what you feel.", time: "~5 min" },
              { icon: "📋", title: "Results", desc: "See your before/after comparison. We follow up at 24 hours to track lasting changes.", time: "instant" },
            ].map((s, i) => (
              <div key={i} style={{ position: "relative", paddingBottom: i < 3 ? 20 : 0, animation: `slideUp ${.3 + i * .1}s ease` }}>
                <div style={{ position: "absolute", left: -22, top: 2, width: 22, height: 22, borderRadius: "50%", background: T.accentDim, border: `2px solid ${T.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{s.icon}</div>
                <div style={{ paddingLeft: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</span>
                    <span style={{ fontSize: 10, color: T.textDim, padding: "1px 6px", borderRadius: 6, background: T.surface, border: `1px solid ${T.border}` }}>{s.time}</span>
                  </div>
                  <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 16 }} />
          <Card style={{ background: T.accentDim, border: `1px solid ${T.accent}20`, textAlign: "center", padding: "12px 14px" }}>
            <p style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>You can use <strong>voice or text</strong> throughout. The AI does the talking — you just focus on how you feel.</p>
          </Card>
          <div style={{ height: 16 }} />
          <Btn onClick={() => setStep(2)} full>What are the success rates? →</Btn>
        </div>
      </ScreenWrap>
    </>
  );

  // Step 2: Success rates + expectation setting
  return (
    <>
      <Header left={<BackBtn onClick={() => setStep(1)} />} right={<span style={{ fontSize: 11, color: T.textDim }}>3/3</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>What to expect</h2>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16, lineHeight: 1.5 }}>We're transparent about results. Here's what our data shows across different conditions:</p>

          {/* Success rates by condition */}
          <Card style={{ marginBottom: 14 }}>
            {CONDITIONS_DATA.filter(c => c.beatPlacebo).map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < CONDITIONS_DATA.filter(x => x.beatPlacebo).length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{c.icon}</span>
                  <span style={{ fontSize: 13 }}>{c.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ProgressBar value={c.pct} color={c.pct >= 75 ? T.green : T.warm} style={{ width: 50 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: c.pct >= 75 ? T.green : T.warm, minWidth: 32, textAlign: "right" }}>{c.pct}%</span>
                </div>
              </div>
            ))}
          </Card>

          {/* Honest disclaimer */}
          <Card style={{ marginBottom: 14, background: T.warmDim, border: `1px solid ${T.warm}25` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.warm, marginBottom: 2 }}>It doesn't work for everyone</div>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>These are real results from real patients — but they also mean some people don't respond. We encourage you to try a free session first before committing to a paid one.</p>
              </div>
            </div>
          </Card>

          {/* Why honest feedback matters */}
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 18 }}>💜</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Your honest feedback matters</div>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>During and after your session, please report exactly what you feel — whether it's better, worse, or unchanged. Accurate feedback is how we validate healers and improve the platform for everyone.</p>
              </div>
            </div>
          </Card>

          {/* Deep data */}
          <ResultsDataPanel compact />

          <Btn onClick={onContinue} full>I understand — let's go →</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 3: Age Gate
   ═══════════════════════════════════════════════════════════════ */
const AgeGateScreen = ({ onContinue, onBack }) => {
  const [dob, setDob] = useState({ day: "", month: "", year: "" });
  const numOnly = (val, maxLen) => val.replace(/[^0-9]/g, "").slice(0, maxLen);
  const age = useMemo(() => {
    const d = parseInt(dob.day), m = parseInt(dob.month), y = parseInt(dob.year);
    if (!d || !m || !y || dob.year.length < 4 || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900) return null;
    const date = new Date(y, m - 1, d);
    if (date.getMonth() !== m - 1) return null;
    return Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }, [dob]);
  const valid = age !== null && age >= 13 && age < 150;
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Verify age</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease", paddingTop: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Date of birth</h2>
          <p style={{ fontSize: 14, color: T.textMuted, marginBottom: 24 }}>We need this to keep everyone safe.</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1 }}><Label>DAY</Label><Input value={dob.day} onChange={e => setDob({ ...dob, day: numOnly(e.target.value, 2) })} placeholder="DD" type="tel" /></div>
            <div style={{ flex: 1 }}><Label>MONTH</Label><Input value={dob.month} onChange={e => setDob({ ...dob, month: numOnly(e.target.value, 2) })} placeholder="MM" type="tel" /></div>
            <div style={{ flex: 1.5 }}><Label>YEAR</Label><Input value={dob.year} onChange={e => setDob({ ...dob, year: numOnly(e.target.value, 4) })} placeholder="YYYY" type="tel" /></div>
          </div>
          {age !== null && age < 13 && <Card style={{ background: T.dangerDim, border: `1px solid ${T.danger}30`, marginBottom: 16 }}><p style={{ fontSize: 13, color: T.danger }}>You must be at least 13 to use Ennie.</p></Card>}
          {age !== null && age >= 13 && age < 18 && <Card style={{ background: T.warmDim, border: `1px solid ${T.warm}30`, marginBottom: 16 }}><p style={{ fontSize: 13, color: T.warm }}>You can use Ennie as a case. Healer roles require 18+.</p></Card>}
          <div style={{ padding: "12px 14px", borderRadius: 12, background: T.blueDim, border: `1px solid ${T.blue}25`, marginBottom: 20, fontSize: 12, color: T.blue, lineHeight: 1.5 }}>ℹ️ Ennie is not a medical service. Energy healing is complementary — always consult your doctor.</div>
          <Btn onClick={() => onContinue(age)} full disabled={!valid}>Continue</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 3a: UCI Research Consent
   ═══════════════════════════════════════════════════════════════ */
const ConsentScreen = ({ onAccept, onBack }) => {
  const [checks, setChecks] = useState({ notMedical: false, dataUse: false, followUp: false, voluntary: false, notEmergency: false });
  const allChecked = Object.values(checks).every(Boolean);
  const toggle = (k) => setChecks(c => ({ ...c, [k]: !c[k] }));
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Research Consent</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.blueDim, border: `1px solid ${T.blue}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: T.blue }}>UCI</div>
            <div><div style={{ fontSize: 13, fontWeight: 700, color: T.blue }}>UC Irvine Research Study</div><div style={{ fontSize: 11, color: T.textMuted }}>IRB-approved protocol</div></div>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Informed Consent</h2>
          <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6, marginBottom: 16 }}>Ennie is part of ongoing academic research conducted in collaboration with the University of California, Irvine.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {[
              { key: "notMedical", label: "Not medical treatment", desc: "I understand energy healing is complementary and experimental, not a substitute for medical care." },
              { key: "dataUse", label: "Research data use", desc: "I agree my anonymised session data may be used for academic research overseen by UC Irvine." },
              { key: "followUp", label: "Follow-up measurements", desc: "I may be asked for optional follow-up symptom ratings at 24 hours, 1 week, and 1 month." },
              { key: "voluntary", label: "Voluntary participation", desc: "My participation is entirely voluntary. I can withdraw at any time without penalty." },
              { key: "notEmergency", label: "Not a medical emergency", desc: "I confirm I'm not currently experiencing a medical emergency." },
            ].map(item => (
              <div key={item.key} onClick={() => toggle(item.key)} style={{ padding: "14px", borderRadius: 14, cursor: "pointer", background: checks[item.key] ? T.accentDim : T.card, border: `1px solid ${checks[item.key] ? T.accent + "40" : T.border}`, transition: "all .15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, border: `2px solid ${checks[item.key] ? T.accent : T.border}`, background: checks[item.key] ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: T.bg, transition: "all .15s" }}>{checks[item.key] ? "✓" : ""}</div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: checks[item.key] ? T.accent : T.text }}>{item.label}</span>
                </div>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55, paddingLeft: 32 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <Btn onClick={onAccept} full disabled={!allChecked}>{allChecked ? "I Consent — Continue" : "Please acknowledge all items above"}</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 3c: Queue Hold Explainer
   ═══════════════════════════════════════════════════════════════ */
const QueueHoldScreen = ({ onContinue, onBack }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg, animation: "fadeIn .3s ease" }}>
    <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>How it works</span>} />
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ width: "100%", maxWidth: 360, borderRadius: 24, background: `linear-gradient(180deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}`, padding: "36px 24px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.blueDim, border: `2px solid ${T.blue}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: 26 }}>⏸️</div>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3, color: T.text, textAlign: "center", marginBottom: 16 }}>How sessions work on Ennie</h2>
        <div style={{ padding: "14px 16px", borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: T.accent, fontWeight: 700, marginBottom: 6 }}>Healer Testing Sessions</p>
          <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>Designed to test healers for ability. We need active symptoms so we can measure real-time changes.</p>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 14, background: T.surface, border: `1px solid ${T.blue}20`, marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: T.blue, fontWeight: 700, marginBottom: 6 }}>Super Sessions</p>
          <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>Use our best tested healers. You can join the queue and hold your spot until symptoms are active. Also available for conditions without active symptoms.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          {[
            { num: "1", icon: "🎫", text: "Sign up for a Super Session and enter the queue" },
            { num: "2", icon: "⏳", text: "When you reach the front, we'll hold your spot" },
            { num: "3", icon: "🔔", text: "We'll notify you — start whenever your symptoms are active" },
            { num: "4", icon: "✦", text: "Your session begins the moment you're ready" },
          ].map(s => (
            <div key={s.num} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{s.icon}</div>
              <p style={{ fontSize: 13, color: T.text, lineHeight: 1.5, paddingTop: 5 }}>{s.text}</p>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 12, background: T.accentDim, border: `1px solid ${T.accent}25`, marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: T.accent, lineHeight: 1.5, textAlign: "center" }}>Your spot is held for up to 90 days.</p>
        </div>
        <button onClick={onContinue} style={{ width: "100%", padding: "16px 24px", borderRadius: 16, background: T.grad, border: "none", color: T.bg, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 20px ${T.accentGlow}` }}>Got it — let's begin intake</button>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   SCREEN 4+5: Intake (AI conversation + body map)
   ═══════════════════════════════════════════════════════════════ */
const intakeScript = [
  { ai: "Hi there — I'm Ennie, your intake guide. I'll help us understand what you're experiencing so we can match you with the right healer.", delay: 700 },
  { ai: "Are you currently experiencing any pain or discomfort right now?", delay: 1000 },
  { wait: "user", options: ["Yes, I have pain right now", "It comes and goes", "It's more emotional"] },
  { ai: "Thanks for sharing. Tap the body map to mark where you feel it — you can place as many pins as you need.", delay: 900, action: "showMap" },
  { wait: "pin" },
  { ai: "Now rate the severity from 0 to 10 using the slider below.", delay: 700, action: "showSlider" },
  { wait: "severity" },
  { ai: "How long have you been dealing with this?", delay: 800 },
  { wait: "user", options: ["Less than a week", "A few weeks", "Months", "Years"] },
  { ai: "Has anything made it better or worse recently?", delay: 800 },
  { wait: "user", options: ["Stress makes it worse", "Rest helps", "Nothing helps", "Not sure"] },
  { ai: "Based on what you've described, this sounds like it falls under chronic pain. Does that feel right?", delay: 900, action: "showCategory" },
  { wait: "user", options: ["Yes, that's right", "Maybe more like tension", "I'm not sure"] },
  { ai: "Got it. You're eligible for a Healer Testing Session — a test healer will work with you anonymously. It typically takes about 5 minutes.", delay: 1000 },
  { ai: "Would you like to join the queue now?", delay: 600, action: "showQueue" },
];

const IntakeScreen = ({ onJoinQueue, onPaidSession, onIneligible, pins, setPins, onBack }) => {
  const [showMapTip, setShowMapTip] = useState(true);
  const [msgs, setMsgs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [typing, setTyping] = useState(false);
  const [waitFor, setWaitFor] = useState(null);
  const [opts, setOpts] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [showCat, setShowCat] = useState(false);
  const [showQ, setShowQ] = useState(false);
  const [side, setSide] = useState("front");
  const [selPin, setSelPin] = useState(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState("text");
  const [voiceActive, setVoiceActive] = useState(false);
  const [lastAI, setLastAI] = useState("");
  const endRef = useRef(null);
  const scroll = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  const runStep = useCallback(async (i) => {
    if (i >= intakeScript.length) return;
    const s = intakeScript[i];
    if (s.ai) {
      setTyping(true); await wait(s.delay || 800); setTyping(false);
      setMsgs(m => [...m, { text: s.ai, isAI: true }]);
      setLastAI(s.ai);
      if (s.action === "showMap") setShowMap(true);
      if (s.action === "showSlider") setShowSlider(true);
      if (s.action === "showCategory") setShowCat(true);
      if (s.action === "showQueue") setShowQ(true);
      const next = intakeScript[i + 1];
      if (next?.ai) setTimeout(() => runStep(i + 1), 350);
      else if (next?.wait) { setWaitFor(next.wait); if (next.options) setOpts(next.options); }
      setIdx(i + 1);
    }
  }, []);

  useEffect(() => { runStep(0); }, [runStep]);
  useEffect(scroll, [msgs, typing]);

  const reply = (t) => {
    setMsgs(m => [...m, { text: t, isAI: false }]);
    setWaitFor(null); setOpts([]);
    if (t === "It comes and goes") {
      setTimeout(async () => {
        setTyping(true); await wait(1000); setTyping(false);
        setMsgs(m => [...m, { text: "That's really common. Are you feeling any of those symptoms right now, even mildly?", isAI: true }]);
        setWaitFor("user"); setOpts(["Yes, I can feel it now", "No, not right now"]);
      }, 300);
      return;
    }
    if (t === "No, not right now") {
      setTimeout(async () => {
        setTyping(true); await wait(1000); setTyping(false);
        setMsgs(m => [...m, { text: "No worries at all. Healer Testing Sessions need active symptoms so we can measure changes in real time. You're welcome to come back whenever they flare up — or we can show you options with our Super Sessions.", isAI: true }]);
        setTimeout(() => onIneligible?.(), 2500);
      }, 300);
      return;
    }
    if (t === "Yes, I can feel it now") {
      // Continue the normal intake flow — they DO have symptoms
    }
    setTimeout(() => runStep(idx + 1), 300);
    setIdx(i => i + 1);
  };

  const addPin = (x, y, sd) => {
    const p = { id: Date.now(), x, y, side: sd, severity: 5 };
    setPins(prev => [...prev, p]); setSelPin(p.id);
    if (waitFor === "pin") {
      setMsgs(m => [...m, { text: `Marked a spot on ${sd} body`, isAI: false }]);
      setWaitFor(null);
      setTimeout(() => runStep(idx + 1), 300);
      setIdx(i => i + 1);
    }
  };

  const confirmSev = () => {
    const p = pins.find(x => x.id === selPin);
    setMsgs(m => [...m, { text: `Rated severity: ${p?.severity || 5}/10`, isAI: false }]);
    setWaitFor(null);
    setTimeout(() => runStep(idx + 1), 300); setIdx(i => i + 1);
  };

  /* ═══ VOICE MODE ═══ */
  if (mode === "voice") {
    return (
      <>
        <Header
          left={<BackBtn onClick={onBack} />}
          center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Intake</span>}
          right={<button onClick={() => setMode("text")} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>⌨️ Text</button>}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {showMap && (
            <div style={{ flex: "0 0 auto", padding: "8px 12px 0", animation: "slideUp .3s ease" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>
                {["front", "back"].map(s => <button key={s} onClick={() => setSide(s)} style={{ padding: "3px 14px", borderRadius: 16, fontSize: 10, fontWeight: 600, border: `1px solid ${side === s ? T.accent + "50" : T.border}`, background: side === s ? T.accentDim : "transparent", color: side === s ? T.accent : T.textMuted, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>{s}</button>)}
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <BodyMap side={side} pins={pins} onAddPin={addPin} onSelectPin={setSelPin} selectedPin={selPin} />
              </div>
              {showSlider && selPin && (
                <div style={{ padding: "6px 8px 2px" }}>
                  <Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} />
                  {waitFor === "severity" && <Btn onClick={confirmSev} variant="accent" full small style={{ marginTop: 8 }}>Confirm severity</Btn>}
                </div>
              )}
              {pins.length > 0 && <div style={{ display: "flex", gap: 4, padding: "4px 0 2px", flexWrap: "wrap", justifyContent: "center" }}>{pins.map((p, i) => <span key={p.id} onClick={() => setSelPin(p.id)} style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, cursor: "pointer", background: selPin === p.id ? T.accentDim : T.card, border: `1px solid ${selPin === p.id ? T.accent + "40" : T.border}`, color: selPin === p.id ? T.accent : T.textMuted }}>#{i + 1} · {p.severity}/10</span>)}</div>}
            </div>
          )}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 24px", minHeight: 80 }}>
            {(lastAI || typing) && (
              <p style={{ fontSize: 14, color: T.textMuted, textAlign: "center", lineHeight: 1.6, animation: "captionFade .4s ease", maxWidth: 300 }} key={lastAI}>
                {typing ? "Listening…" : lastAI}
              </p>
            )}
          </div>
          {waitFor === "user" && opts.length > 0 && (
            <div style={{ padding: "0 16px 8px", display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {opts.map((o, i) => <button key={i} onClick={() => reply(o)} style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${T.accent}35`, background: T.accentDim, color: T.accent, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{o}</button>)}
            </div>
          )}
          {showQ && (
            <div style={{ padding: "4px 16px 8px" }}>
              <Btn onClick={onJoinQueue} full>Start Healer Testing Session</Btn>
              <div style={{ height: 6 }} />
              <Btn onClick={onPaidSession} variant="ghost" full small>Or book a Super Session →</Btn>
            </div>
          )}
          <div style={{ padding: "12px 0 28px", display: "flex", flexDirection: "column", alignItems: "center", background: `linear-gradient(180deg, transparent, ${T.surface}80)` }}>
            <div
              onClick={() => {
                if (!voiceActive) {
                  setVoiceActive(true);
                  setTimeout(() => {
                    setVoiceActive(false);
                    if (waitFor === "user" && opts.length > 0) reply(opts[Math.floor(Math.random() * opts.length)]);
                    else if (waitFor === "pin") addPin(52, 55, side);
                    else if (waitFor === "severity") confirmSev();
                  }, 2500);
                }
              }}
              style={{ position: "relative", width: 140, height: 140, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <div style={{ position: "absolute", left: "50%", top: "50%", width: 140, height: 140, borderRadius: "50%", border: `2px solid ${T.accent}`, animation: voiceActive ? "orbRipple 1.5s ease-out infinite" : "orbRing1 3s ease-in-out infinite" }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", width: 120, height: 120, borderRadius: "50%", border: `1.5px solid ${T.accent}60`, animation: voiceActive ? "orbRipple 1.5s ease-out .3s infinite" : "orbRing2 3.5s ease-in-out .5s infinite" }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", width: 80, height: 80, borderRadius: "50%", transform: "translate(-50%,-50%)", background: voiceActive ? `radial-gradient(circle at 40% 35%, ${T.accent}, ${T.blue}80, ${T.purple}60)` : `radial-gradient(circle at 40% 35%, ${T.accent}90, ${T.blue}50, ${T.surface})`, boxShadow: voiceActive ? `0 0 40px ${T.accent}50` : `0 0 30px ${T.accent}25`, animation: voiceActive ? "orbPulse .8s ease-in-out infinite" : "orbFloat 3s ease-in-out infinite" }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", width: 40, height: 40, borderRadius: "50%", transform: "translate(-50%,-50%)", background: `radial-gradient(circle, rgba(255,255,255,${voiceActive ? 0.3 : 0.15}), transparent)`, animation: voiceActive ? "orbPulse .6s ease-in-out infinite" : "orbFloat 2s ease-in-out .5s infinite" }} />
            </div>
            <p style={{ fontSize: 12, color: voiceActive ? T.accent : T.textMuted, fontWeight: 500, marginTop: 8, transition: "color .2s" }}>
              {voiceActive ? "Listening… tap to send" : "Tap to speak"}
            </p>
          </div>
        </div>
      </>
    );
  }

  /* ═══ TEXT MODE ═══ */
  return (
    <>
      <Header
        left={<BackBtn onClick={onBack} />}
        center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Intake</span>}
        right={<button onClick={() => setMode("voice")} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🎙️ Voice</button>}
      />
      {showMap && (
        <div style={{ padding: "8px 12px", background: T.surface, borderBottom: `1px solid ${T.border}`, animation: "slideDown .3s ease" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>
            {["front", "back"].map(s => <button key={s} onClick={() => setSide(s)} style={{ padding: "3px 14px", borderRadius: 16, fontSize: 10, fontWeight: 600, border: `1px solid ${side === s ? T.accent + "50" : T.border}`, background: side === s ? T.accentDim : "transparent", color: side === s ? T.accent : T.textMuted, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>{s}</button>)}
          </div>
          <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
            <BodyMap side={side} pins={pins} onAddPin={(x, y, sd) => { setShowMapTip(false); addPin(x, y, sd); }} onSelectPin={setSelPin} selectedPin={selPin} />
            {showMapTip && pins.length === 0 && (
              <div onClick={() => setShowMapTip(false)} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", borderRadius: 8, cursor: "pointer", animation: "fadeIn .3s ease", zIndex: 5 }}>
                <div style={{ padding: "12px 18px", borderRadius: 12, background: T.card, border: `1px solid ${T.accent}40`, textAlign: "center", maxWidth: 200 }}>
                  <p style={{ fontSize: 13, color: T.accent, fontWeight: 600, marginBottom: 4 }}>👆 Tap anywhere</p>
                  <p style={{ fontSize: 12, color: T.textMuted }}>Tap on the body to mark where it hurts</p>
                </div>
              </div>
            )}
          </div>
          {showSlider && selPin && (
            <div style={{ padding: "6px 8px 2px", animation: "slideUp .2s ease" }}>
              <Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} />
              {waitFor === "severity" && <Btn onClick={confirmSev} variant="accent" full small style={{ marginTop: 8 }}>Confirm severity</Btn>}
            </div>
          )}
          {pins.length > 0 && <div style={{ display: "flex", gap: 4, padding: "4px 0", flexWrap: "wrap", justifyContent: "center" }}>{pins.map((p, i) => <span key={p.id} onClick={() => setSelPin(p.id)} style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, cursor: "pointer", background: selPin === p.id ? T.accentDim : T.card, border: `1px solid ${selPin === p.id ? T.accent + "40" : T.border}`, color: selPin === p.id ? T.accent : T.textMuted }}>#{i + 1} · {p.severity}/10</span>)}</div>}
        </div>
      )}
      {showCat && !showQ && (
        <div style={{ padding: "6px 12px", animation: "slideDown .2s ease" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {["Chronic Pain", "Acute Injury", "Tension", "Emotional", "Other"].map(c => <span key={c} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", background: c === "Chronic Pain" ? T.accentDim : T.card, border: `1px solid ${c === "Chronic Pain" ? T.accent + "40" : T.border}`, color: c === "Chronic Pain" ? T.accent : T.textMuted }}>{c}</span>)}
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px" }}>
        {msgs.length === 0 && <div style={{ padding: "10px 12px", borderRadius: 12, background: T.blueDim, border: `1px solid ${T.blue}25`, marginBottom: 10, fontSize: 12, color: T.blue, lineHeight: 1.5 }}>ℹ️ Ennie is not a medical service. Energy healing is complementary.</div>}
        {msgs.map((m, i) => <ChatBubble key={i} text={m.text} isAI={m.isAI} />)}
        {typing && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 26, height: 26, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.bg }}>E</div><div style={{ background: T.card, borderRadius: "4px 14px 14px 14px", border: `1px solid ${T.border}` }}><TypingDots /></div></div>}
        <div ref={endRef} />
      </div>
      {waitFor === "user" && opts.length > 0 && <div style={{ padding: "4px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>{opts.map((o, i) => <button key={i} onClick={() => reply(o)} style={{ padding: "7px 12px", borderRadius: 18, border: `1px solid ${T.accent}35`, background: T.accentDim, color: T.accent, fontSize: 12.5, fontWeight: 500, cursor: "pointer", animation: `slideUp ${.2 + i * .06}s ease` }}>{o}</button>)}</div>}
      {showQ && <div style={{ padding: "8px 16px" }}><Btn onClick={onJoinQueue} full>Start Healer Testing Session</Btn><div style={{ height: 6 }} /><Btn onClick={onPaidSession} variant="ghost" full small>Or book a Super Session →</Btn></div>}
      <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${T.border}`, background: `${T.surface}ee`, display: "flex", gap: 8 }}>
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message…" style={{ flex: 1 }} />
        <Btn onClick={() => { if (text.trim()) { reply(text.trim()); setText(""); } }} small style={{ width: 44, borderRadius: 12, padding: 0 }}>↑</Btn>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 5a: No Active Symptoms
   ═══════════════════════════════════════════════════════════════ */
const paidTiersData = [
  { name: "Line", price: "$50", urgency: "Queue", wait: "3–4 weeks", color: T.accent, desc: "Join the queue. Approx wait 3–4 weeks.", stat: "70% of users report over 90% pain reduction and 60% total pain relief after 3 sessions.", avgImprove: "72%" },
  { name: "Week", price: "$150", urgency: "This Week", wait: "1–7 days", color: T.blue, desc: "Scheduled session within the next 7 days.", stat: "70% of users report over 90% pain reduction and 60% total pain relief after 3 sessions.", avgImprove: "78%" },
  { name: "Today", price: "$350", urgency: "Today", wait: "< 2 hrs", color: T.warm, desc: "Priority session matched and completed today.", stat: "70% of users report over 90% pain reduction and 60% total pain relief after 3 sessions.", avgImprove: "82%" },
];

const IneligibleScreen = ({ onPaid, onGroup, onClose }) => (
  <>
    <Header left={<BackBtn onClick={onClose} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Session Options</span>} />
    <ScreenWrap>
      <div style={{ animation: "slideUp .4s ease" }}>
        <div style={{ borderRadius: 20, padding: "32px 24px", background: `linear-gradient(180deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}`, textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: T.warmDim, border: `2px solid ${T.warm}50`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 24 }}>🌿</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.25, color: T.text, marginBottom: 10 }}>Healer Testing Sessions need active symptoms</h2>
          <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6, marginBottom: 8 }}>To reliably test our healers, we need symptoms you can rate in real time.</p>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6, fontWeight: 500 }}>Please come back when your symptoms are active — we'd love to help you then.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><div style={{ flex: 1, height: 1, background: T.border }} /><span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>Or book a Super Session</span><div style={{ flex: 1, height: 1, background: T.border }} /></div>
        <ResultsDataPanel type="all" compact />
        {paidTiersData.map((t, i) => (
          <Card key={t.name} onClick={() => onPaid(t)} style={{ marginBottom: 10, cursor: "pointer", border: `1px solid ${t.color}25`, animation: `slideUp ${.3 + i * .08}s ease` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 16, fontWeight: 700, color: t.color }}>{t.name}</span><span style={{ fontSize: 18, fontWeight: 800, color: t.color }}>{t.price}</span></div>
            <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>{t.desc}</p>
            {t.stat && <p style={{ fontSize: 11, color: T.accent, marginBottom: 8, padding: "6px 8px", borderRadius: 8, background: T.accentDim, lineHeight: 1.45 }}>📊 {t.stat}</p>}
            <div style={{ display: "flex", gap: 8 }}><Badge color={t.color}>{t.urgency}</Badge><Badge color={T.textMuted}>~{t.wait}</Badge></div>
          </Card>
        ))}
        <Card onClick={onGroup} style={{ cursor: "pointer", border: `1px solid ${T.purple}30`, background: `${T.purple}08`, animation: "slideUp .6s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: T.purpleDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👥</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700, color: T.purple }}>Group Healing</div><div style={{ fontSize: 12, color: T.textMuted }}>From $19.99/mo · 8 sessions per month</div></div>
          </div>
        </Card>
        <div style={{ height: 8 }} />
        <Btn variant="ghost" full onClick={onClose}>Maybe later</Btn>
      </div>
    </ScreenWrap>
  </>
);

/* ═══════════════════════════════════════════════════════════════
   SCREEN 5: Routing / SKU selection
   ═══════════════════════════════════════════════════════════════ */
const allSkus = [
  { name: "Healer Testing Session", price: "FREE", urgency: "Test Pool", wait: "10–20 min", color: T.accent, desc: "Matched with a test healer anonymously. Active symptoms required.", stat: "Up to 50% of our users report a 50% or more pain reduction.", free: true },
  ...paidTiersData,
];
const RoutingScreen = ({ eligible, onFree, onPaid, onGroup, onBack }) => {
  const [showPaid, setShowPaid] = useState(false);
  return (
  <>
    <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Your session</span>} />
    <ScreenWrap>
      <div style={{ animation: "slideUp .4s ease" }}>
        {/* Eligibility confirmation */}
        {eligible && (
          <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.greenDim, border: `2px solid ${T.green}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>You're eligible</h2>
            <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>Active symptoms detected. You can start a free healer testing session right now.</p>
          </div>
        )}

        {/* Primary CTA — Free session */}
        <Card style={{ marginBottom: 14, border: `2px solid ${T.accent}40`, background: T.accentDim, cursor: "pointer" }} onClick={onFree}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: T.accent }}>Healer Testing Session</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.accent }}>FREE</span>
          </div>
          <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5, marginBottom: 8 }}>You'll be matched anonymously with a healer being tested on the platform. Your feedback helps validate their ability.</p>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <Badge color={T.accent}>~10–20 min wait</Badge>
            <Badge color={T.textMuted}>~5 min session</Badge>
          </div>
          <div style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: T.textMuted }}>Avg. improvement</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: T.accent }}>50%</span>
          </div>
        </Card>

        {/* Data panel — compare testing vs verified */}
        <ResultsDataPanel type="all" compact />

        {/* Secondary — Paid options */}
        <button onClick={() => setShowPaid(!showPaid)} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: `1px solid ${T.border}`, background: T.card, color: T.textMuted, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showPaid ? 12 : 0 }}>
          <span>Want faster access or a verified healer?</span>
          <span style={{ fontSize: 12 }}>{showPaid ? "▴" : "▾"}</span>
        </button>

        {showPaid && (
          <div style={{ animation: "slideUp .2s ease" }}>
            <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 12, lineHeight: 1.5 }}>Super Sessions use verified healers with proven track records. Shorter wait times and higher success rates.</p>
            {paidTiersData.map((t, i) => (
              <Card key={t.name} onClick={() => onPaid(t)} style={{ marginBottom: 8, cursor: "pointer", border: `1px solid ${t.color}25`, animation: `slideUp ${.2 + i * .06}s ease` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: t.color }}>{t.name}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: t.color }}>{t.price}</span>
                </div>
                <p style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>{t.desc}</p>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <Badge color={t.color}>{t.urgency}</Badge>
                  <Badge color={T.textMuted}>~{t.wait}</Badge>
                </div>
                <div style={{ padding: "6px 10px", borderRadius: 10, background: t.color + "10", border: `1px solid ${t.color}15`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}>Avg. improvement</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: t.color }}>{t.avgImprove}</span>
                </div>
              </Card>
            ))}
            <Card onClick={onGroup} style={{ cursor: "pointer", border: `1px solid ${T.purple}30`, background: `${T.purple}08` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.purpleDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👥</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.purple }}>Group Healing</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>From $19.99/mo · 8 sessions/month · avg. 45% improvement</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </ScreenWrap>
  </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   GROUP HEALING SCREENS — Full Redesigned Flow
   ═══════════════════════════════════════════════════════════════ */
const groupSessions = [
  { id: 1, day: "Monday", time: "7:00 PM", healer: "Ember", spots: 12, filled: 8, focus: "Chronic pain" },
  { id: 2, day: "Wednesday", time: "12:00 PM", healer: "Solace", spots: 15, filled: 11, focus: "Stress & anxiety" },
  { id: 3, day: "Thursday", time: "8:00 PM", healer: "Lumen", spots: 10, filled: 6, focus: "General wellness" },
  { id: 4, day: "Saturday", time: "10:00 AM", healer: "Horizon", spots: 20, filled: 14, focus: "Chronic pain" },
  { id: 5, day: "Sunday", time: "6:00 PM", healer: "Haven", spots: 15, filled: 9, focus: "Migraine & headaches" },
  { id: 6, day: "Tuesday", time: "9:00 PM", healer: "Aura", spots: 12, filled: 10, focus: "Back & joint pain" },
  { id: 7, day: "Friday", time: "1:00 PM", healer: "Zephyr", spots: 18, filled: 5, focus: "General wellness" },
  { id: 8, day: "Saturday", time: "4:00 PM", healer: "Sage", spots: 15, filled: 12, focus: "Emotional healing" },
];

const GroupScheduleScreen = ({ onSingle, onSubscribe, onBack }) => {
  const [tab, setTab] = useState("single");
  const [selected, setSelected] = useState([]);
  const [showData, setShowData] = useState(false);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Group Healing</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>

          {/* Hero */}
          <div style={{ textAlign: "center", padding: "12px 0 16px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: T.purpleDim, border: `2px solid ${T.purple}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 26 }}>👥</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Group Healing</h2>
            <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>1,000 of our best healers working together on every session.</p>
          </div>

          {/* Key facts */}
          <div style={{ display: "flex", gap: 0, marginBottom: 14, borderRadius: 14, overflow: "hidden", border: `1px solid ${T.purple}20` }}>
            {[
              { value: "1,000", label: "healers per session", color: T.purple },
              { value: "30", label: "min sessions", color: T.blue },
              { value: "62%", label: "report 70%+ reduction", color: T.green },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "12px 6px", background: s.color + "08", borderRight: i < 2 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* How it works */}
          <Card style={{ marginBottom: 12, border: `1px solid ${T.purple}20` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "✦", text: "1,000 of our top-performing verified healers focus their combined intention on the group simultaneously." },
                { icon: "⏱️", text: "Sessions run for 30 minutes. You track your symptoms on the body map throughout — the AI checks in with you." },
                { icon: "📊", text: "We capture data from every participant in every session. This is how we measure real group healing effectiveness." },
                { icon: "🔒", text: "Fully anonymous. The healers can't see you. You can't see them or other participants. Just you and your symptoms." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 14, marginTop: 1 }}>{item.icon}</span>
                  <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Expandable data deep-dive */}
          <button onClick={() => setShowData(!showData)} style={{ width: "100%", padding: "10px 14px", borderRadius: 14, border: `1px solid ${T.green}25`, background: T.greenDim, color: T.green, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showData ? 10 : 14 }}>
            <span>📊 See the data — results by condition</span>
            <span>{showData ? "▴" : "▾"}</span>
          </button>
          {showData && (
            <Card style={{ marginBottom: 14, animation: "slideUp .2s ease" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Group healing results</div>
              <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5, marginBottom: 12 }}>Data captured from every participant across all group sessions. 62% of participants report at least a 70% reduction in their symptoms.</p>

              {[
                { label: "Chronic pain", pct: 68, sessions: 2400, icon: "🔧", avgDrop: "4.2 pts" },
                { label: "Migraine & headaches", pct: 71, sessions: 1800, icon: "🧠", avgDrop: "4.8 pts" },
                { label: "Arthritis", pct: 65, sessions: 1500, icon: "🦴", avgDrop: "3.9 pts" },
                { label: "Back & joint pain", pct: 64, sessions: 2100, icon: "💪", avgDrop: "4.0 pts" },
                { label: "Fibromyalgia", pct: 48, sessions: 900, icon: "💢", avgDrop: "2.8 pts" },
                { label: "Stress & anxiety", pct: 72, sessions: 1600, icon: "🌀", avgDrop: "5.1 pts" },
                { label: "Neuropathy", pct: 42, sessions: 600, icon: "⚡", avgDrop: "2.4 pts" },
                { label: "Emotional / trauma", pct: 66, sessions: 1100, icon: "💜", avgDrop: "4.5 pts" },
              ].map((c, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: i < 7 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{c.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: c.pct >= 65 ? T.green : c.pct >= 50 ? T.accent : T.warm }}>{c.pct}%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 20 }}>
                    <ProgressBar value={c.pct} color={c.pct >= 65 ? T.green : c.pct >= 50 ? T.accent : T.warm} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 20, marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: T.textDim }}>{c.sessions.toLocaleString()} participants measured</span>
                    <span style={{ fontSize: 10, color: T.textDim }}>Avg drop: {c.avgDrop}</span>
                  </div>
                </div>
              ))}

              <div style={{ padding: "10px 10px 0", marginTop: 8, borderTop: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>Data updated weekly. "% reporting 70%+ reduction" means the percentage of participants whose tracked symptoms decreased by 70% or more during the 30-minute session. All data anonymised and contributed to ongoing research with UC Irvine.</p>
              </div>
            </Card>
          )}

          {/* Tab selector */}
          <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 14 }}>
            {[{ id: "single", label: "Single — $29" }, { id: "subscribe", label: "Monthly — $19.99" }].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelected([]); }} style={{ flex: 1, padding: "10px 8px", borderRadius: 11, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: tab === t.id ? T.card : "transparent", color: tab === t.id ? (t.id === "subscribe" ? T.purple : T.accent) : T.textMuted, transition: "all .15s" }}>{t.label}</button>
            ))}
          </div>

          {tab === "subscribe" && (
            <Card style={{ marginBottom: 14, border: `1px solid ${T.purple}30`, background: `${T.purple}06` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: T.purple }}>$19.99<span style={{ fontSize: 12, fontWeight: 500 }}>/month</span></span>
                <Badge color={T.purple}>8 sessions/mo</Badge>
              </div>
              <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5, marginBottom: 4 }}>Pick any 8 sessions per month. Cancel anytime from Billing.</p>
              <div style={{ padding: "6px 10px", borderRadius: 8, background: T.purple + "10" }}>
                <span style={{ fontSize: 11, color: T.purple }}>That's $2.50 per session vs $29 single</span>
              </div>
            </Card>
          )}
          {tab === "single" && (
            <Card style={{ marginBottom: 14, border: `1px solid ${T.accent}25` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Single Group Session</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>Pick one session below</div>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: T.accent }}>$29</span>
              </div>
            </Card>
          )}

          <Label>UPCOMING SESSIONS</Label>
          {groupSessions.map((s, i) => {
            const isSel = selected.includes(s.id), spotsLeft = s.spots - s.filled;
            return (
              <Card key={s.id} onClick={() => { if (tab === "single") setSelected([s.id]); else if (selected.length < 8) toggle(s.id); else if (isSel) toggle(s.id); }} style={{ marginBottom: 8, cursor: "pointer", animation: `slideUp ${.2 + i * .04}s ease`, border: `1px solid ${isSel ? T.accent + "50" : T.border}`, background: isSel ? T.accentDim : T.card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSel ? T.accent : T.border}`, background: isSel ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: T.bg }}>{isSel ? "✓" : ""}</div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{s.day}</span>
                    <span style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>{s.time}</span>
                  </div>
                  <Badge color={spotsLeft < 5 ? T.warm : T.textMuted}>{spotsLeft} spots</Badge>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 28 }}>
                  <span style={{ fontSize: 11, color: T.textDim }}>{s.healer} · {s.filled}/{s.spots} joined</span>
                  <Badge color={T.purple} bg={T.purpleDim}>{s.focus}</Badge>
                </div>
              </Card>
            );
          })}
          <div style={{ height: 12 }} />
          {tab === "single" ? (
            <Btn onClick={() => onSingle(groupSessions.find(s => s.id === selected[0]))} full disabled={selected.length === 0}>{selected.length > 0 ? "Book session — $29" : "Select a session"}</Btn>
          ) : (
            <Btn onClick={() => onSubscribe(selected.map(id => groupSessions.find(s => s.id === id)))} full disabled={selected.length === 0} style={selected.length > 0 ? { background: `linear-gradient(135deg, ${T.purple}, ${T.blue})` } : {}}>{selected.length > 0 ? `Subscribe — $19.99/mo · ${selected.length} selected` : "Select sessions"}</Btn>
          )}
        </div>
      </ScreenWrap>
    </>
  );
};

const GroupConfirmScreen = ({ sessions, isSub, onIntake, onBack }) => {
  const [addCal, setAddCal] = useState(false);
  const [notif, setNotif] = useState(true);
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>{isSub ? "Subscribed" : "Booked"}</span>} />
      <ScreenWrap>
        <div style={{ textAlign: "center", marginBottom: 20, animation: "slideUp .4s ease" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.greenDim, border: `2px solid ${T.green}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24, animation: "breathe 2s ease-in-out infinite" }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{isSub ? "You're subscribed!" : "Session booked!"}</h2>
          <p style={{ fontSize: 13, color: T.textMuted }}>{isSub ? "$19.99/mo · Manage in Billing tab." : "Your group session is confirmed."}</p>
        </div>

        {(sessions || []).map((s, i) => s && (
          <Card key={i} style={{ marginBottom: 8, animation: `slideUp ${.3 + i * .06}s ease` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{s.day} · {s.time}</span>
              <Badge color={T.green}>Confirmed</Badge>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: T.textMuted }}>Healer: {s.healer}</span>
              <Badge color={T.purple} bg={T.purpleDim}>{s.focus}</Badge>
            </div>
          </Card>
        ))}

        <Divider />
        <Card style={{ marginBottom: 10 }}><Toggle on={addCal} onToggle={() => setAddCal(!addCal)} label="📅 Add to calendar" /></Card>
        <Card style={{ marginBottom: 10 }}><Toggle on={notif} onToggle={() => setNotif(!notif)} label="🔔 Remind me 15 min before" /></Card>

        <div style={{ padding: "10px 12px", borderRadius: 12, background: T.blueDim, border: `1px solid ${T.blue}20`, marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: T.blue, lineHeight: 1.5 }}>💡 Complete your symptom intake before the session starts. You can do it now or up to 30 minutes before.</p>
        </div>

        <Btn onClick={onIntake} full>Complete intake now</Btn>
        <div style={{ height: 8 }} />
        <Btn variant="ghost" full onClick={onBack}>I'll do it later</Btn>
      </ScreenWrap>
    </>
  );
};

const GroupIntakeScreen = ({ pins, setPins, onDone, onBack }) => {
  const [side, setSide] = useState("front");
  const [selPin, setSelPin] = useState(null);
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Group Intake</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Mark your symptoms</h2>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 14, lineHeight: 1.5 }}>Tap the body to place pins where you feel symptoms, then rate severity. The healer will see this during the group session.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>
            {["front", "back"].map(s => <button key={s} onClick={() => setSide(s)} style={{ padding: "3px 14px", borderRadius: 16, fontSize: 12, fontWeight: 600, border: `1px solid ${side === s ? T.accent + "50" : T.border}`, background: side === s ? T.accentDim : "transparent", color: side === s ? T.accent : T.textMuted, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>{s}</button>)}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <BodyMap side={side} pins={pins} onAddPin={(x, y, sd) => { const p = { id: Date.now(), x, y, side: sd, severity: 5 }; setPins(prev => [...prev, p]); setSelPin(p.id); }} onSelectPin={setSelPin} selectedPin={selPin} />
          </div>
          {pins.length > 0 && <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap", justifyContent: "center" }}>{pins.map((p, i) => <span key={p.id} onClick={() => setSelPin(p.id)} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, cursor: "pointer", background: selPin === p.id ? T.accentDim : T.card, border: `1px solid ${selPin === p.id ? T.accent + "40" : T.border}`, color: selPin === p.id ? T.accent : T.textMuted }}>#{i + 1} · {p.severity}/10</span>)}</div>}
          {selPin && <Card style={{ marginBottom: 14 }}><Label>SEVERITY</Label><Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} /></Card>}
          {pins.length === 0 && <div style={{ padding: "20px 16px", borderRadius: 14, border: `1px dashed ${T.border}`, textAlign: "center", marginBottom: 14 }}><p style={{ fontSize: 13, color: T.textDim }}>Tap the body map above to mark where you feel symptoms</p></div>}
          <Btn onClick={onDone} full disabled={pins.length === 0}>{pins.length > 0 ? "Ready for group session" : "Place at least one pin"}</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

const GroupSessionScreen = ({ pins, setPins, onEnd }) => {
  const [timer, setTimer] = useState(1800);
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(false);
  const [side, setSide] = useState("front");
  const [selPin, setSelPin] = useState(pins[0]?.id || null);
  const [text, setText] = useState("");
  const [participantCount] = useState(Math.floor(Math.random() * 200) + 400);
  const ref = useRef(null);

  useEffect(() => {
    const script = [
      { t: 1500, m: `Welcome to group healing. ${participantCount} participants are connected. 1,000 of our best healers are beginning now.` },
      { t: 8000, m: "Focus on the areas you've marked. The healers are working with the group's collective energy." },
      { t: 30000, m: "5 minutes in. How are your symptoms feeling? Update the body map — your real-time data helps us measure effectiveness." },
      { t: 60000, m: "Multiple participants are reporting changes. Keep tracking any shifts — even subtle ones." },
      { t: 120000, m: "Halfway point. The healers are intensifying focus. Some participants have reported 50%+ reduction already." },
      { t: 180000, m: "20 minutes. Keep noticing how your body feels. Update severity if anything has changed." },
      { t: 240000, m: "Final stretch. 5 minutes remaining. Take a moment to compare how you feel now versus the start." },
      { t: 270000, m: "Last minute. The session will wrap up automatically. Thank you for contributing your data." },
    ];
    script.forEach(({ t, m }) => setTimeout(async () => { setTyping(true); await wait(1200); setTyping(false); setMsgs(prev => [...prev, { text: m, isAI: true }]); }, t));
  }, [participantCount]);

  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);
  useEffect(() => { const i = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(i); onEnd(); return 0; } return t - 1; }), 1000); return () => clearInterval(i); }, [onEnd]);

  const send = (m) => {
    if (!m.trim()) return;
    setMsgs(prev => [...prev, { text: m, isAI: false }]); setText("");
    const lower = m.toLowerCase();
    if (/better|improv|less|easing|lighter|shifted|reduced/.test(lower) && pins.length) setPins(ps => ps.map(p => ({ ...p, severity: clamp(p.severity - 1, 0, 10) })));
    if (/worse|more|intense|stronger|sharp/.test(lower) && pins.length) setPins(ps => ps.map(p => ({ ...p, severity: clamp(p.severity + 1, 0, 10) })));
  };

  const mins = Math.floor(timer / 60), secs = timer % 60;

  return (
    <>
      <Header
        left={<div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 12 }}>👥</span><span style={{ fontSize: 11, color: T.purple, fontWeight: 600 }}>{participantCount}</span></div>}
        center={<span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: timer < 60 ? T.warm : T.text }}>{mins}:{String(secs).padStart(2, "0")}</span>}
        right={<Btn variant="danger" small onClick={onEnd} style={{ padding: "5px 12px" }}>End</Btn>}
      />

      {/* Group info bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "4px 12px 6px", background: T.purpleDim, borderBottom: `1px solid ${T.purple}20` }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.purple, animation: "pulse 2s infinite" }} />
        <span style={{ fontSize: 10, color: T.purple, fontWeight: 500 }}>Group session · {participantCount} participants · 1,000 healers · 30 min</span>
      </div>

      {/* Body map */}
      <div style={{ flex: "0 0 auto", maxHeight: "38vh", overflowY: "auto", background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "4px 12px 8px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 4 }}>
          {["front", "back"].map(s => <button key={s} onClick={() => setSide(s)} style={{ padding: "2px 12px", borderRadius: 14, fontSize: 10, fontWeight: 600, border: `1px solid ${side === s ? T.accent + "50" : T.border}`, background: side === s ? T.accentDim : "transparent", color: side === s ? T.accent : T.textMuted, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>{s}</button>)}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <BodyMap side={side} pins={pins} onAddPin={(x, y, sd) => { const p = { id: Date.now(), x, y, side: sd, severity: 5 }; setPins(prev => [...prev, p]); setSelPin(p.id); }} onSelectPin={setSelPin} selectedPin={selPin} small />
        </div>
        {selPin && <div style={{ padding: "4px 4px 0" }}><Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} /></div>}
        {pins.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", padding: "4px 0" }}>{pins.map((p, i) => <span key={p.id} onClick={() => setSelPin(p.id)} style={{ padding: "2px 8px", borderRadius: 8, fontSize: 10, cursor: "pointer", background: selPin === p.id ? T.accentDim : T.card, border: `1px solid ${selPin === p.id ? T.accent + "30" : T.border}`, color: selPin === p.id ? T.accent : T.textMuted }}>#{i + 1} · {p.severity}/10</span>)}</div>}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {msgs.map((m, i) => <ChatBubble key={i} text={m.text} isAI={m.isAI} />)}
        {typing && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${T.purple}, ${T.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.bg }}>E</div><div style={{ background: T.card, borderRadius: "4px 14px 14px 14px", border: `1px solid ${T.border}` }}><TypingDots /></div></div>}
        <div ref={ref} />
      </div>

      {/* Input */}
      <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 6, overflowX: "auto" }}>
          {["Feeling better", "No change yet", "Something shifted", "Pain increasing"].map((q, i) => (
            <button key={i} onClick={() => send(q)} style={{ padding: "5px 10px", borderRadius: 10, border: `1px solid ${T.purple}30`, background: T.purpleDim, color: T.purple, fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{q}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(text); }} placeholder="How are you feeling?" style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 13.5, outline: "none" }} />
          <button onClick={() => send(text)} style={{ width: 42, height: 42, borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${T.purple}, ${T.blue})`, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 6: Queue
   ═══════════════════════════════════════════════════════════════ */
const QueueScreen = ({ selectedTier = "free", userCondition = "migraine", atFront = false, onReady, onGoHome, onLeave, onUpgrade }) => {
  const [sel, setSel] = React.useState(selectedTier);
  const [progress, setProgress] = React.useState(atFront ? 100 : 0);

  const condition = CONDITIONS_DATA.find(c => c.id === userCondition) || CONDITIONS_DATA[1];

  // Simulate queue progress (demo only) — advances to front
  React.useEffect(() => {
    if (atFront) return;
    const i = setInterval(() => setProgress(p => {
      if (p >= 100) { clearInterval(i); return 100; }
      return p + 1;
    }), 180);
    return () => clearInterval(i);
  }, [atFront]);

  const isAtFront = atFront || progress >= 100;

  const tiers = [
    { id: "free", name: "Healer Testing Session", price: "Free", wait: "10–20 min", color: T.accent, desc: "Help us test a healer — active symptoms needed" },
    { id: "line", name: "Super Session — Line", price: "$50", wait: "3–4 weeks", color: T.accent, desc: "Join the paid queue. Verified healer matched to your condition." },
    { id: "week", name: "Super Session — This Week", price: "$150", wait: "1–7 days", color: T.blue, desc: "Scheduled session within the next 7 days with a verified healer." },
    { id: "today", name: "Super Session — Today", price: "$350", wait: "< 2 hrs", color: T.warm, desc: "Priority match. Verified healer. Session completed today." },
  ];

  const currentTier = tiers.find(t => t.id === sel) || tiers[0];
  const successRate = condition.successByTier?.[sel] || 0;
  const isUpgrade = sel !== selectedTier && sel !== "free";

  return (
    <>
      <Header center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Your Queue</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>

          {/* At front — ready state */}
          {isAtFront && (
            <Card style={{ marginBottom: 16, border: `2px solid ${T.green}50`, background: T.greenDim, animation: "slideUp .4s ease" }}>
              <div style={{ textAlign: "center", padding: "8px 0 12px" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.green + "25", border: `2px solid ${T.green}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 26, animation: "breathe 2s ease-in-out infinite" }}>✦</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: T.green, marginBottom: 4 }}>You're at the front!</h3>
                <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5, marginBottom: 14 }}>Start whenever your symptoms are active. Your spot is held.</p>
                <Btn onClick={onReady} full style={{ background: T.green, marginBottom: 6 }}>I'm ready — start session</Btn>
                <p style={{ fontSize: 11, color: T.textMuted }}>~15 min to connect with a healer</p>
              </div>
            </Card>
          )}

          {/* Condition + selected session header */}
          <div style={{ textAlign: "center", padding: isAtFront ? "4px 0 16px" : "16px 0 20px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: T.accentDim, border: `1px solid ${T.accent}30`, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>{condition.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>{condition.label}</span>
            </div>
            {!isAtFront && (
              <>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textDim, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Your estimated wait</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: 800, letterSpacing: -2, lineHeight: 1, color: T.text }}>{currentTier.wait}</div>
                <div style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>
                  for <strong style={{ color: currentTier.color }}>{currentTier.name}</strong>
                </div>
              </>
            )}
          </div>

          {!isAtFront && <ProgressBar value={progress} color={T.text} />}

          {/* Success rate for current selection */}
          <div style={{ textAlign: "center", padding: "16px 0 4px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 14, background: successRate >= 50 ? T.greenDim : T.warmDim, border: `1px solid ${successRate >= 50 ? T.green : T.warm}30` }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: successRate >= 50 ? T.green : T.warm }}>{successRate}%</span>
              <span style={{ fontSize: 12, color: T.textMuted }}>success rate for {condition.label}</span>
            </div>
          </div>

          {/* Session type selector */}
          <div style={{ marginTop: 20, marginBottom: 16 }}>
            <Label>Session type {isUpgrade ? "— upgrade available" : ""}</Label>
            {tiers.map((t, i) => {
              const isSel = sel === t.id;
              const rate = condition.successByTier?.[t.id] || 0;
              return (
                <div key={t.id} onClick={() => setSel(t.id)} style={{
                  padding: "14px 16px", borderRadius: 18, cursor: "pointer", marginBottom: 8, transition: "all .15s",
                  border: isSel ? `2px solid ${t.color}` : `1px solid ${T.border}`,
                  background: isSel ? `${t.color}08` : T.card,
                  animation: `slideUp ${.25 + i * .06}s ease`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isSel && <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />}
                      <span style={{ fontSize: 14, fontWeight: isSel ? 700 : 500, color: isSel ? t.color : T.text }}>{t.name}</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: isSel ? t.color : T.text }}>{t.price}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8, paddingLeft: isSel ? 16 : 0 }}>{t.desc}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: isSel ? 16 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Est. wait:</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: isSel ? t.color : T.text }}>{t.wait}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Success:</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: rate >= 50 ? T.green : rate >= 25 ? T.warm : T.danger }}>{rate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upgrade CTA if they selected a higher tier */}
          {isUpgrade && (
            <div style={{ animation: "slideUp .3s ease", marginBottom: 16 }}>
              <Btn onClick={() => onUpgrade(paidTiersData.find(p => p.name === (sel === "today" ? "Today" : sel === "week" ? "Week" : "Line")) || paidTiersData[0])} full style={{ background: `linear-gradient(135deg, ${currentTier.color}, ${T.purple})` }}>
                Upgrade to {currentTier.name} — {currentTier.price}
              </Btn>
            </div>
          )}

          {/* How it works info card */}
          <Card style={{ marginBottom: 16, background: T.surface, border: `1px solid ${T.blue}20` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: T.blueDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🔔</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>We'll notify you when it's your turn</p>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>Once you reach the front of the queue, you can take the session whenever you're ready. There's no rush — your spot is held.</p>
              </div>
            </div>
            <div style={{ height: 1, background: T.border, margin: "0 0 12px" }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: T.warmDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⚡</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.warm, marginBottom: 4 }}>Start with active symptoms</p>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>It is <strong style={{ color: T.text }}>strongly recommended</strong> that you only begin your session when you have active symptoms. This gives a significantly higher chance of success.</p>
              </div>
            </div>
          </Card>

          <Btn onClick={onGoHome} full>Go to Home →</Btn>
          <button onClick={onLeave} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: T.textMuted, fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>Leave queue</button>
        </div>
      </ScreenWrap>
    </>
  );
};


/* ═══════════════════════════════════════════════════════════════
   SCREEN 8: Symptom Confirmation
   ═══════════════════════════════════════════════════════════════ */
const SymptomConfirmScreen = ({ pins, setPins, onStart, onBack, onExpired }) => {
  const [mode, setMode] = useState("review"); // "review" | "update"
  const [selPin, setSelPin] = useState(pins[0]?.id || null);
  const [side, setSide] = useState("front");
  const [note, setNote] = useState("");
  const [countdown, setCountdown] = useState(200); // DEMO: start at 3:20 so warning hits fast
  const [confirmed, setConfirmed] = useState(false); // user pressed "I'm here and ready"
  const [updateOpen, setUpdateOpen] = useState(false);

  const isWarning = countdown <= 180 && countdown > 120; // 3 min mark: 60s confirmation window
  const isExpired = countdown <= 120 && !confirmed; // didn't confirm in time
  const confirmCountdown = isWarning ? countdown - 120 : 0; // seconds left to confirm

  // Countdown timer — DEMO: 3x speed
  useEffect(() => {
    const i = setInterval(() => setCountdown(t => {
      if (t <= 0) { clearInterval(i); return 0; }
      return t - 1;
    }), 333);
    return () => clearInterval(i);
  }, []);

  // Expired state is handled in render — no auto-redirect

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const pct = (countdown / (15 * 60)) * 100;
  const timerColor = isExpired ? T.danger : isWarning ? T.danger : countdown < 300 ? T.warm : T.accent;

  const addPin = (x, y, sd) => {
    const p = { id: Date.now(), x, y, side: sd, severity: 5 };
    setPins(prev => [...prev, p]);
    setSelPin(p.id);
  };

  const removePin = (id) => {
    setPins(ps => ps.filter(p => p.id !== id));
    setSelPin(pins.length > 1 ? pins.find(p => p.id !== id)?.id : null);
  };

  const handleConfirmReady = () => {
    setConfirmed(true);
    onStart();
  };

  // ── UPDATE MODE chat state (must be declared before any returns) ──
  const [msgs, setMsgs] = useState([]);
  const [chatIdx, setChatIdx] = useState(0);
  const [chatTyping, setChatTyping] = useState(false);
  const [chatWait, setChatWait] = useState(null);
  const [chatOpts, setChatOpts] = useState([]);
  const [showMap, setShowMap] = useState(pins.length > 0);
  const [showSlider, setShowSlider] = useState(pins.length > 0);
  const [chatText, setChatText] = useState("");
  const [chatDone, setChatDone] = useState(false);
  const chatEndRef = useRef(null);
  const chatScroll = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const updateScript = useMemo(() => {
    const hasExisting = pins.length > 0;
    if (hasExisting) return [
      { ai: `Welcome back. I can see you had ${pins.length} symptom${pins.length > 1 ? "s" : ""} from your last intake. Let's check if anything has changed.`, delay: 700 },
      { ai: "Are these symptoms still active right now?", delay: 800 },
      { wait: "user", options: ["Yes, same as before", "They've changed", "I have new symptoms too"] },
      { ai: "Got it. You can adjust the severity on any existing pin, or tap the body map to add new ones.", delay: 800, action: "showMap" },
      { ai: "Take a moment to update your ratings using the sliders.", delay: 600, action: "showSlider" },
      { wait: "severity" },
      { ai: "How would you describe the pain right now compared to your last session?", delay: 800 },
      { wait: "user", options: ["About the same", "Worse than before", "Better but still there", "Completely different"] },
      { ai: "Thanks for updating that. Your symptom map is looking good — head back to confirm when you're ready.", delay: 800, action: "done" },
    ];
    return [
      { ai: "Let's get your symptoms mapped out. Are you currently experiencing pain or discomfort?", delay: 700 },
      { wait: "user", options: ["Yes, I have pain right now", "It comes and goes", "It's more emotional"] },
      { ai: "Tap the body map to mark where you feel it — place as many pins as you need.", delay: 800, action: "showMap" },
      { wait: "pin" },
      { ai: "Now rate the severity from 0 to 10 using the slider.", delay: 700, action: "showSlider" },
      { wait: "severity" },
      { ai: "How long have you been dealing with this?", delay: 800 },
      { wait: "user", options: ["Less than a week", "A few weeks", "Months", "Years"] },
      { ai: "Has anything made it better or worse recently?", delay: 800 },
      { wait: "user", options: ["Stress makes it worse", "Rest helps", "Nothing helps", "Not sure"] },
      { ai: "Got it — your symptoms are mapped. Head back to confirm when you're ready.", delay: 800, action: "done" },
    ];
  }, []);

  const runChat = useCallback(async (i) => {
    if (i >= updateScript.length) return;
    const s = updateScript[i];
    if (s.ai) {
      setChatTyping(true); await wait(s.delay || 800); setChatTyping(false);
      setMsgs(m => [...m, { text: s.ai, isAI: true }]);
      if (s.action === "showMap") setShowMap(true);
      if (s.action === "showSlider") setShowSlider(true);
      if (s.action === "done") setChatDone(true);
      if (updateScript[i + 1]?.ai) { setChatIdx(i + 1); setTimeout(() => runChat(i + 1), 300); }
      else if (updateScript[i + 1]?.wait) { setChatIdx(i + 1); setChatWait(updateScript[i + 1].wait); if (updateScript[i + 1].options) setChatOpts(updateScript[i + 1].options); }
    }
  }, [updateScript]);

  useEffect(chatScroll, [msgs, chatTyping]);

  const chatReply = (text) => {
    setMsgs(m => [...m, { text, isAI: false }]);
    setChatWait(null); setChatOpts([]);
    const next = chatIdx + 1;
    if (next < updateScript.length) { setChatIdx(next); setTimeout(() => runChat(next), 300); }
  };

  const chatConfirmSev = () => {
    const p = pins.find(x => x.id === selPin);
    setMsgs(m => [...m, { text: `Severity updated: ${p?.severity || 5}/10`, isAI: false }]);
    setChatWait(null);
    const next = chatIdx + 1;
    if (next < updateScript.length) { setChatIdx(next); setTimeout(() => runChat(next), 300); }
  };

  // ── EXPIRED STATE ── Show message, let user go back to queue
  if (countdown <= 120 && !confirmed) {
    return (
      <>
        <Header center={<span style={{ fontSize: 13, color: T.warm, fontWeight: 600 }}>Session window missed</span>} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 24px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: T.warmDim, border: `2px solid ${T.warm}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: 32 }}>⏰</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>You missed your session window</h2>
          <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6, marginBottom: 8, maxWidth: 300 }}>
            Don't worry — we've held your spot at the front of the queue.
          </p>
          <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.55, marginBottom: 24, maxWidth: 300 }}>
            When you're ready, just come back and start your session. No need to re-queue — you're still first in line.
          </p>

          <Card style={{ width: "100%", maxWidth: 320, marginBottom: 20, background: T.greenDim, border: `1px solid ${T.green}25` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.green + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✅</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.green }}>Your spot is held</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>Front of queue · Ready when you are</div>
              </div>
            </div>
          </Card>

          <Btn onClick={() => onExpired?.()} full>Back to queue →</Btn>
          <div style={{ height: 8 }} />
          <Btn onClick={onBack} variant="ghost" full small>Leave queue</Btn>
        </div>
      </>
    );
  }

  // ── REVIEW MODE ──
  // ── SINGLE PAGE — body map + expandable update ──

  if (mode === "review") {
    return (
      <>
        <Header
          left={<BackBtn onClick={onBack} />}
          center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Pre-Session Check-in</span>}
        />
        <ScreenWrap>
          <div style={{ animation: "slideUp .4s ease" }}>

            {/* Countdown timer card */}
            <Card style={{ marginBottom: 16, background: isWarning ? T.dangerDim : T.surface, border: `1px solid ${timerColor}${isWarning ? "40" : "25"}`, padding: "14px 16px", transition: "all .3s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: timerColor, animation: isWarning ? "pulse 0.6s infinite" : "pulse 1.5s infinite" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: isWarning ? T.danger : T.text }}>
                    {isWarning ? "Session starting soon!" : "Healer matching in progress"}
                  </span>
                </div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: timerColor, letterSpacing: -0.5 }}>{mins}:{String(secs).padStart(2, "0")}</span>
              </div>
              <div style={{ height: 4, background: isWarning ? `${T.danger}25` : T.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: timerColor, borderRadius: 2, transition: "width 1s linear, background .3s" }} />
              </div>
              {isWarning ? (
                <p style={{ fontSize: 12, color: T.danger, marginTop: 6, fontWeight: 600, lineHeight: 1.4 }}>
                  🔔 You have <strong>{confirmCountdown}s</strong> to confirm you're ready or you'll be returned to the front of the queue.
                </p>
              ) : (
                <p style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>When you are 3 mins from the front of the queue, you'll have 60 seconds to confirm you're ready.</p>
              )}
            </Card>

            {/* Confirmation window banner */}
            {isWarning && (
              <Card style={{ marginBottom: 14, background: `linear-gradient(135deg, ${T.danger}12, ${T.warm}10)`, border: `2px solid ${T.danger}40`, animation: "slideUp .3s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.danger + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, animation: "breathe 1s ease-in-out infinite" }}>🔔</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.danger }}>Confirm you're ready — {confirmCountdown}s</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, lineHeight: 1.4 }}>You have 60 seconds to confirm or you'll be put back to the front of the queue.</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Your symptoms — single body map */}
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Your symptoms</h2>

            {/* Body map — always visible, interactive only when updating */}
            <div style={{ padding: "4px 0", marginBottom: 8 }}>
              {updateOpen && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>
                  {["front", "back"].map(s => (
                    <button key={s} onClick={() => setSide(s)} style={{
                      padding: "3px 14px", borderRadius: 16, fontSize: 10, fontWeight: 600,
                      border: `1px solid ${side === s ? T.accent + "50" : T.border}`,
                      background: side === s ? T.accentDim : "transparent",
                      color: side === s ? T.accent : T.textMuted,
                      cursor: "pointer", textTransform: "uppercase", letterSpacing: 1,
                    }}>{s}</button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "center" }}>
                {updateOpen ? (
                  <BodyMap side={side} pins={pins} onAddPin={(x, y, sd) => { addPin(x, y, sd); if (chatWait === "pin") chatReply("Placed a pin"); }} onSelectPin={setSelPin} selectedPin={selPin} />
                ) : (
                  <BodyMap side="front" pins={pins} selectedPin={null} small />
                )}
              </div>
              {updateOpen && selPin && (
                <div style={{ padding: "6px 8px 2px", animation: "slideUp .2s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <Label>SEVERITY — SYMPTOM #{pins.findIndex(p => p.id === selPin) + 1}</Label>
                    <button onClick={() => removePin(selPin)} style={{ background: T.dangerDim, border: `1px solid ${T.danger}30`, borderRadius: 8, padding: "2px 8px", fontSize: 10, color: T.danger, fontWeight: 600, cursor: "pointer" }}>Remove</button>
                  </div>
                  <Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} />
                  {chatWait === "severity" && <Btn onClick={chatConfirmSev} variant="accent" full small style={{ marginTop: 8 }}>Confirm severity</Btn>}
                </div>
              )}
            </div>

            {/* Symptom chips */}
            {pins.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
                {pins.map((p, i) => (
                  <span key={p.id} onClick={updateOpen ? () => setSelPin(p.id) : undefined} style={{
                    padding: "5px 12px", borderRadius: 12, fontSize: 12, color: T.text,
                    background: updateOpen && selPin === p.id ? T.accentDim : T.card,
                    border: `1px solid ${updateOpen && selPin === p.id ? T.accent + "40" : T.border}`,
                    cursor: updateOpen ? "pointer" : "default",
                  }}>
                    Symptom #{i + 1} · <strong>{p.severity}/10</strong>
                  </span>
                ))}
              </div>
            )}

            {/* Update toggle / conversational chat */}
            {!updateOpen ? (
              <button onClick={() => { setUpdateOpen(true); if (msgs.length === 0) runChat(0); }} style={{ width: "100%", padding: "10px 14px", borderRadius: 14, border: `1px solid ${T.accent}30`, background: T.accentDim, color: T.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16 }}>
                {pins.length > 0 ? "Update symptoms ▾" : "Add symptoms ▾"}
              </button>
            ) : (
              <div style={{ marginBottom: 16, borderRadius: 16, border: `1px solid ${T.accent}25`, overflow: "hidden", animation: "slideUp .3s ease" }}>
                {/* Chat area */}
                <div style={{ maxHeight: 220, overflowY: "auto", padding: "10px 14px", background: T.bg }}>
                  {msgs.map((m, i) => <ChatBubble key={i} text={m.text} isAI={m.isAI} />)}
                  {chatTyping && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.bg }}>E</div>
                      <div style={{ background: T.card, borderRadius: "4px 14px 14px 14px", border: `1px solid ${T.border}` }}><TypingDots /></div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Response options */}
                {chatWait === "user" && chatOpts.length > 0 && (
                  <div style={{ padding: "6px 14px 8px", display: "flex", flexWrap: "wrap", gap: 6, background: T.bg, borderTop: `1px solid ${T.border}` }}>
                    {chatOpts.map((o, i) => <button key={i} onClick={() => chatReply(o)} style={{ padding: "7px 12px", borderRadius: 18, border: `1px solid ${T.accent}35`, background: T.accentDim, color: T.accent, fontSize: 12, fontWeight: 500, cursor: "pointer", animation: `slideUp ${.2 + i * .06}s ease` }}>{o}</button>)}
                  </div>
                )}

                {/* Text input or done */}
                {chatDone ? (
                  <div style={{ padding: "8px 14px 10px", borderTop: `1px solid ${T.border}`, background: T.surface }}>
                    <Btn onClick={() => setUpdateOpen(false)} variant="accent" full small>Done updating ✓</Btn>
                  </div>
                ) : (
                  <div style={{ padding: "6px 14px 10px", borderTop: `1px solid ${T.border}`, background: T.surface, display: "flex", gap: 8 }}>
                    <Input value={chatText} onChange={e => setChatText(e.target.value)} placeholder="Type a message…" style={{ flex: 1, padding: "9px 12px", fontSize: 13 }} />
                    <Btn onClick={() => { if (chatText.trim()) { chatReply(chatText.trim()); setChatText(""); } }} small style={{ width: 40, borderRadius: 10, padding: 0 }}>↑</Btn>
                  </div>
                )}

                {/* Collapse */}
                <div onClick={() => setUpdateOpen(false)} style={{ padding: "8px 14px", background: T.surface, borderTop: `1px solid ${T.border}`, textAlign: "center", cursor: "pointer" }}>
                  <span style={{ fontSize: 12, color: T.textMuted }}>▴ Collapse</span>
                </div>
              </div>
            )}

            {pins.length === 0 && !updateOpen && (
              <Card style={{ marginBottom: 14, background: T.warmDim, border: `1px solid ${T.warm}30`, textAlign: "center", padding: 16 }}>
                <p style={{ fontSize: 12, color: T.warm }}>No symptoms yet — tap "Add symptoms" above</p>
              </Card>
            )}

            {/* Active symptoms reminder — only when not in warning */}
            {!isWarning && (
              <div style={{ padding: "10px 14px", borderRadius: 12, background: T.warmDim, border: `1px solid ${T.warm}25`, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: T.warm, lineHeight: 1.5 }}>⚡ <strong>Reminder:</strong> Starting with active symptoms gives a significantly higher chance of success.</p>
              </div>
            )}

            {/* CTA — only appears at 3 min mark */}
            {isWarning ? (
              <>
                <Btn onClick={handleConfirmReady} full disabled={pins.length === 0} style={{ background: T.green, animation: "breathe 1.5s ease-in-out infinite" }}>
                  I'm here and ready
                </Btn>
                <div style={{ height: 8 }} />
                <Btn onClick={() => onExpired?.()} variant="ghost" full small>
                  I'm not ready — keep my spot in queue
                </Btn>
              </>
            ) : (
              <>
                <Card style={{ background: T.surface, border: `1px solid ${T.border}`, textAlign: "center", padding: "16px 14px" }}>
                  <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>Your session will begin in approx. <strong style={{ color: T.text }}>{mins > 0 ? `${mins} min` : "less than 1 min"}</strong>. Review or update your symptoms while you wait.</p>
                  <p style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>At 3 mins out you'll have 60 seconds to confirm you're ready.</p>
                </Card>
                <div style={{ height: 8 }} />
                <Btn onClick={() => onExpired?.()} variant="ghost" full small>
                  I'm not ready — keep my spot in queue
                </Btn>
              </>
            )}
          </div>
        </ScreenWrap>
      </>
    );
  }

  // update mode is now handled inline via expandable section
  return null;
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 8b: Connecting
   ═══════════════════════════════════════════════════════════════ */
const ConnectingScreen = ({ onConnected, isGroup, onCancel }) => {
  const [step, setStep] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  useEffect(() => {
    if (cancelled) return;
    const timers = [setTimeout(() => setStep(1), 1500), setTimeout(() => setStep(2), 3500), setTimeout(() => setStep(3), 5500), setTimeout(() => onConnected(), 7000)];
    return () => timers.forEach(clearTimeout);
  }, [onConnected, cancelled]);
  return (
    <>
      <Header center={<Logo />} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 28px", textAlign: "center" }}>
        <div style={{ position: "relative", width: 90, height: 90, marginBottom: 28 }}>
          <svg viewBox="0 0 90 90" style={{ width: 90, height: 90, animation: "spin 3s linear infinite" }}>
            <circle cx="45" cy="45" r="38" fill="none" stroke={T.border} strokeWidth="3" />
            <circle cx="45" cy="45" r="38" fill="none" stroke={isGroup ? T.purple : T.accent} strokeWidth="3" strokeDasharray="60 180" strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>{isGroup ? "👥" : "✦"}</div>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{step < 2 ? "Connecting you with a healer…" : step < 3 ? "Healer found" : "Starting session…"}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, width: "100%" }}>
          {["Finding the best match…", "Sending your symptom data…", "Healer is preparing…"].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: step > i ? T.accentDim : T.surface, border: `1px solid ${step > i ? T.accent + "30" : T.border}`, transition: "all .4s", opacity: step >= i ? 1 : 0.3 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: step > i ? T.accent : "transparent", border: `2px solid ${step > i ? T.accent : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: T.bg, transition: "all .3s" }}>{step > i ? "✓" : ""}</div>
              <span style={{ fontSize: 13, color: step > i ? T.accent : T.textMuted, fontWeight: step > i ? 600 : 400 }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ borderRadius: 16, padding: "20px 18px", background: `linear-gradient(180deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}`, textAlign: "left", width: "100%" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>Before we begin</p>
          <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.65, marginBottom: 10 }}>Please give accurate feedback throughout the session. It is critical to getting the most out of the session.</p>
          <p style={{ fontSize: 13, color: T.text, lineHeight: 1.65, fontWeight: 600 }}>The truth — no matter what it is — is very important.</p>
        </div>
        <button onClick={() => { setCancelled(true); onCancel?.(); }} style={{ marginTop: 16, background: "none", border: "none", color: T.textDim, fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>Cancel</button>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 9: Live Session (Case)
   ═══════════════════════════════════════════════════════════════ */
const sessionScript = [
  { ai: "Your healer is connected and ready. They can see your symptom map. Take a moment to settle in.", delay: 1800 },
  { ai: "Your healer is beginning to work with you now. Relax and notice any changes.", delay: 3500 },
  { ai: "How are you feeling? Any changes — even subtle ones?", delay: 8000 },
  { ai: "Your healer is adjusting their focus. Keep noticing how your body feels.", delay: 12000 },
  { ai: "Take a slow breath. How's the area you marked earlier?", delay: 16000 },
  { ai: "Your healer will continue for the remaining time. Update your symptoms on the body map whenever you notice a change.", delay: 20000 },
];

const LiveSessionScreen = ({ pins, setPins, baselinePins, onEnd }) => {
  const [timer, setTimer] = useState(300);
  const [msgs, setMsgs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [typing, setTyping] = useState(false);
  const [active, setActive] = useState(true);
  const [mode, setMode] = useState("voice");
  const [text, setText] = useState("");
  const [side, setSide] = useState("front");
  const [selPin, setSelPin] = useState(pins[0]?.id || null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [lastAI, setLastAI] = useState("Your healer is connecting…");
  const ref = useRef(null);
  const scroll = () => ref.current?.scrollIntoView({ behavior: "smooth" });

  const run = useCallback(async (i) => {
    if (i >= sessionScript.length) return;
    const s = sessionScript[i];
    if (s.ai) {
      setTyping(true); await wait(s.delay || 2000); setTyping(false);
      setMsgs(m => [...m, { text: s.ai, isAI: true }]);
      setLastAI(s.ai); setIdx(i + 1);
      if (sessionScript[i + 1]?.ai) setTimeout(() => run(i + 1), 300);
    }
  }, []);

  useEffect(() => { run(0); }, [run]);
  useEffect(scroll, [msgs, typing]);
  useEffect(() => {
    if (!active) return;
    const i = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(i); onEnd(); return 0; } return t - 1; }), 1000);
    return () => clearInterval(i);
  }, [active, onEnd]);

  const parseAndAdjust = (input) => {
    const lower = input.toLowerCase();
    const improving = /better|improv|less pain|decreas|relief|easing|lighter|shifted|changed|reduced|gone/.test(lower);
    const worsening = /worse|more pain|increas|intense|stronger|sharp|throb/.test(lower);
    if ((improving || worsening) && pins.length > 0) {
      const delta = improving ? -1 : 1;
      setPins(ps => ps.map(p => ({ ...p, severity: clamp(p.severity + delta, 0, 10) })));
      setTimeout(async () => {
        setTyping(true); await wait(1200); setTyping(false);
        const newSev = clamp((pins[0]?.severity || 5) + delta, 0, 10);
        const msg = improving ? `Noted — your healer can see the improvement. Symptoms updated to ${newSev}/10.` : `Thanks for letting us know. Your healer is adjusting. Symptoms updated to ${newSev}/10.`;
        setMsgs(m => [...m, { text: msg, isAI: true }]);
        setLastAI(msg);
        if (improving) setTimer(t => Math.min(t + 60, 300));
      }, 400);
    }
  };

  const sendMessage = (msg) => {
    if (!msg.trim()) return;
    setMsgs(m => [...m, { text: msg, isAI: false }]);
    parseAndAdjust(msg); setText(""); setVoiceActive(false);
    if (idx < sessionScript.length) setTimeout(() => run(idx), 800);
  };

  const bodyMapPanel = (
    <div style={{ padding: "4px 12px 8px" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>
        {["front", "back"].map(s => <button key={s} onClick={() => setSide(s)} style={{ padding: "3px 14px", borderRadius: 16, fontSize: 10, fontWeight: 600, border: `1px solid ${side === s ? T.accent + "50" : T.border}`, background: side === s ? T.accentDim : "transparent", color: side === s ? T.accent : T.textMuted, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>{s}</button>)}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <BodyMap side={side} pins={pins} onAddPin={(x, y, sd) => { const p = { id: Date.now(), x, y, side: sd, severity: 5 }; setPins(prev => [...prev, p]); setSelPin(p.id); }} onSelectPin={setSelPin} selectedPin={selPin} small />
      </div>
      {selPin && (
        <div style={{ padding: "6px 4px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted }}>Symptom #{pins.findIndex(p => p.id === selPin) + 1}</span>
            {pins.length > 1 && <button onClick={() => { setPins(ps => ps.filter(p => p.id !== selPin)); setSelPin(pins.find(p => p.id !== selPin)?.id || null); }} style={{ background: "none", border: "none", color: T.danger, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Remove</button>}
          </div>
          <Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} />
        </div>
      )}
    </div>
  );

  if (mode === "voice") return (
    <>
      <Header left={<Logo />} center={<TimerRing seconds={timer} total={300} />} right={<Btn variant="danger" small onClick={onEnd} style={{ padding: "5px 12px" }}>End</Btn>} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0 4px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 500 }}>Healer connected · Anonymous</span>
        </div>
        <div style={{ flex: "0 0 auto", borderBottom: `1px solid ${T.border}`, background: T.surface }}>{bodyMapPanel}</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px 28px" }}>
          <p style={{ fontSize: 15, color: typing ? T.textDim : T.text, textAlign: "center", lineHeight: 1.65, animation: "captionFade .4s ease", maxWidth: 320, fontWeight: typing ? 400 : 500 }} key={lastAI + typing}>{typing ? "…" : lastAI}</p>
        </div>
        <div style={{ padding: "0 0 24px", display: "flex", flexDirection: "column", alignItems: "center", background: `linear-gradient(180deg, transparent, ${T.surface}60)` }}>
          <div onClick={() => { if (voiceActive) { const samples = ["I think the pain is easing", "Feeling warmth in that area", "About the same right now", "Definitely less tension"]; sendMessage(samples[Math.floor(Math.random() * samples.length)]); } else { setVoiceActive(true); } }} style={{ position: "relative", width: 130, height: 130, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${T.accent}`, animation: voiceActive ? "orbRipple 1.5s ease-out infinite" : "orbRing1 3s ease-in-out infinite" }} />
            <div style={{ position: "absolute", inset: 5, borderRadius: "50%", border: `1.5px solid ${T.accent}50`, animation: voiceActive ? "orbRipple 1.5s ease-out .3s infinite" : "orbRing2 3.5s ease-in-out .4s infinite" }} />
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: voiceActive ? `radial-gradient(circle at 38% 32%, #fff 0%, #9B8AFB 30%, #7C6AE8 65%, #6B5CE0 100%)` : `radial-gradient(circle at 38% 32%, #C4B5FD 0%, #9B8AFB 50%, #E8E2F4 100%)`, boxShadow: voiceActive ? `0 0 50px ${T.accent}50` : `0 0 30px ${T.accent}20`, animation: voiceActive ? "orbPulse .8s ease-in-out infinite" : "orbFloat 3s ease-in-out infinite" }} />
          </div>
          <p style={{ fontSize: 12, color: voiceActive ? T.accent : T.textMuted, fontWeight: 500, marginTop: 10, transition: "color .2s" }}>{voiceActive ? "Listening…" : "Tap to speak"}</p>
          <button onClick={() => setMode("text")} style={{ marginTop: 10, background: "none", border: "none", color: T.textDim, fontSize: 12, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>Switch to text</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Header left={<Logo />} center={<TimerRing seconds={timer} total={300} />} right={<Btn variant="danger" small onClick={onEnd} style={{ padding: "5px 12px" }}>End</Btn>} />
      <div style={{ flex: "0 0 auto", maxHeight: "48vh", overflowY: "auto", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 0" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, animation: "pulse 2s infinite" }} /><span style={{ fontSize: 10, color: T.textMuted }}>Healer connected · Anonymous</span></div>
        {bodyMapPanel}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {msgs.map((m, i) => <ChatBubble key={i} text={m.text} isAI={m.isAI} />)}
        {typing && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 26, height: 26, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.bg }}>E</div><div style={{ background: T.card, borderRadius: "4px 14px 14px 14px", border: `1px solid ${T.border}` }}><TypingDots /></div></div>}
        <div ref={ref} />
      </div>
      <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setMode("voice")} style={{ width: 42, height: 42, borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.accent, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🎙️</button>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendMessage(text); }} placeholder="Describe how you feel…" style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 13.5, outline: "none" }} />
          <button onClick={() => sendMessage(text)} style={{ width: 42, height: 42, borderRadius: 12, border: "none", background: T.grad, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 10: Session End
   ═══════════════════════════════════════════════════════════════ */
const SessionEndScreen = ({ baselinePins, finalPins, onHome, onThankYou, onNoResult }) => {
  const totalDrop = baselinePins.reduce((sum, bp, i) => {
    const fp = finalPins[i];
    return sum + (bp.severity - (fp?.severity || 0));
  }, 0);
  const improved = totalDrop >= 2;

  return (
  <>
    <Header center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Session Complete</span>} />
    <ScreenWrap>
      <div style={{ textAlign: "center", marginBottom: 20, animation: "slideUp .5s ease" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: improved ? T.greenDim : T.warmDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 24 }}>{improved ? "✨" : "🙏"}</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{improved ? "Session Complete" : "Session Complete"}</h2>
        <p style={{ fontSize: 13, color: T.textMuted }}>{improved ? "Here's how your symptoms changed" : "Let's look at your results"}</p>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 10, border: `1px solid ${T.border}` }}><div style={{ textAlign: "center", marginBottom: 6, fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1 }}>BEFORE</div><BodyMap side="front" pins={baselinePins} small /></div>
        <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 10, border: `1px solid ${improved ? T.accent + "25" : T.warm + "25"}` }}><div style={{ textAlign: "center", marginBottom: 6, fontSize: 10, fontWeight: 600, color: improved ? T.accent : T.warm, letterSpacing: 1 }}>AFTER</div><BodyMap side="front" pins={finalPins} small /></div>
      </div>
      {baselinePins.map((bp, i) => { const fp = finalPins[i]; const diff = bp.severity - (fp?.severity || 0); return (
        <Card key={i} style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", animation: `slideUp ${.4 + i * .1}s ease` }}>
          <div><div style={{ fontSize: 11, color: T.textMuted }}>Symptom {i + 1}</div><div style={{ fontSize: 13, marginTop: 2 }}><span style={{ color: T.danger }}>{bp.severity}</span><span style={{ color: T.textDim, margin: "0 6px" }}>→</span><span style={{ color: diff > 0 ? T.accent : T.warm }}>{fp?.severity || 0}</span></div></div>
          <Badge color={diff > 0 ? T.accent : T.warm}>{diff > 0 ? `−${diff}` : diff === 0 ? "no change" : `+${Math.abs(diff)}`}</Badge>
        </Card>
      ); })}

      {improved ? (
        <>
          <div style={{ padding: "10px 12px", borderRadius: 12, background: T.greenDim, border: `1px solid ${T.green}20`, marginBottom: 12, marginTop: 8 }}>
            <p style={{ fontSize: 12, color: T.green, lineHeight: 1.55 }}>🎉 A total drop of {totalDrop} points. This data is part of ongoing research with UCI.</p>
          </div>
          <Btn onClick={onThankYou} variant="accent" full>See your results & share 💚</Btn>
          <div style={{ height: 8 }} />
          <Btn onClick={onHome} variant="ghost" full>Back to home</Btn>
        </>
      ) : (
        <>
          <div style={{ padding: "10px 12px", borderRadius: 12, background: T.blueDim, border: `1px solid ${T.blue}20`, marginBottom: 12, marginTop: 8 }}>
            <p style={{ fontSize: 12, color: T.blue, lineHeight: 1.55 }}>Results can sometimes take up to 24 hours to appear. We'll check in with you tomorrow.</p>
          </div>
          <Btn onClick={onNoResult} full>Talk to us about your experience</Btn>
          <div style={{ height: 8 }} />
          <Btn onClick={onHome} variant="ghost" full>Back to home — wait for follow-up</Btn>
        </>
      )}
    </ScreenWrap>
  </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 10b: Share
   ═══════════════════════════════════════════════════════════════ */
const ShareScreen = ({ baselinePins = [], finalPins = [], userCondition = "migraine", onDone }) => {
  const [phase, setPhase] = useState("celebrate"); // celebrate → recap → share → interviewOffer → interview → permission → done
  const [showFireworks, setShowFireworks] = useState(true);
  const [interviewMsgs, setInterviewMsgs] = useState([]);
  const [interviewIdx, setInterviewIdx] = useState(0);
  const [interviewTyping, setInterviewTyping] = useState(false);
  const [interviewOpts, setInterviewOpts] = useState([]);
  const [interviewWait, setInterviewWait] = useState(null);
  const [interviewText, setInterviewText] = useState("");
  const [interviewDone, setInterviewDone] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [shareConsent, setShareConsent] = useState({ friends: false, ennie: false });
  const interviewRef = useRef(null);

  const condition = CONDITIONS_DATA.find(c => c.id === userCondition) || CONDITIONS_DATA[1];
  const beforeSev = baselinePins[0]?.severity || 7;
  const afterSev = finalPins[0]?.severity || 2;
  const drop = beforeSev - afterSev;
  const pctDrop = Math.round((drop / Math.max(beforeSev, 1)) * 100);

  // Auto-advance from celebrate to recap
  useEffect(() => {
    if (phase === "celebrate") {
      const t = setTimeout(() => setShowFireworks(false), 3000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Session recap journey data
  const recapSteps = [
    { label: "Intake", quote: `"I have a ${condition.label.toLowerCase()}"`, severity: beforeSev, icon: "🗣️" },
    { label: "Session start", quote: `Severity: ${beforeSev}/10`, severity: beforeSev, icon: "✦" },
    ...(beforeSev > afterSev + 2 ? [{ label: "Mid-session", quote: `"It's changing… maybe a ${Math.round((beforeSev + afterSev) / 2)}"`, severity: Math.round((beforeSev + afterSev) / 2), icon: "💫" }] : []),
    { label: "Session end", quote: afterSev === 0 ? `"Oh my God, my ${condition.label.toLowerCase()} is gone!"` : `"It's down to a ${afterSev}… that's incredible"`, severity: afterSev, icon: afterSev === 0 ? "🎉" : "✨" },
  ];

  // Interview script
  const interviewScript = useMemo(() => [
    { ai: `Hi! I'm Charlie. Congratulations on your result — a ${pctDrop}% reduction is incredible. I'd love to hear about your experience. Ready?`, delay: 1200 },
    { wait: "user", options: ["Yes, let's go!", "Sure"] },
    { ai: `So tell me — how long had you been dealing with ${condition.label.toLowerCase()} before today?`, delay: 1000 },
    { wait: "user", options: ["A few weeks", "Months", "Years", "As long as I can remember"] },
    { ai: "And before this session, what was the worst it would get? How did it affect your daily life?", delay: 1000 },
    { wait: "user", options: ["It stopped me from working", "I couldn't sleep", "It was constant", "I'd tried everything"] },
    { ai: "Walk me through what happened during the session. What did you notice?", delay: 1000 },
    { wait: "user", options: ["I felt warmth", "The pain just faded", "I was shocked", "It was subtle at first then dramatic"] },
    { ai: `So you went from a ${beforeSev} out of 10 to a ${afterSev}. What went through your mind in that moment?`, delay: 1000 },
    { wait: "user", options: ["I couldn't believe it", "I got emotional", "I was speechless", "I want to tell everyone"] },
    { ai: "If someone was skeptical about energy healing, what would you say to them?", delay: 1000 },
    { wait: "user", options: ["Just try it", "I was skeptical too", "The numbers speak for themselves", "You have nothing to lose"] },
    { ai: "That's wonderful. Thank you so much for sharing. This will help so many people understand what's possible.", delay: 1200, action: "done" },
  ], [condition, beforeSev, afterSev, pctDrop]);

  const runInterview = useCallback(async (i) => {
    if (i >= interviewScript.length) return;
    const s = interviewScript[i];
    if (s.ai) {
      setInterviewTyping(true); await wait(s.delay || 800); setInterviewTyping(false);
      setInterviewMsgs(m => [...m, { text: s.ai, isAI: true }]);
      if (s.action === "done") setInterviewDone(true);
      if (interviewScript[i + 1]?.ai) { setInterviewIdx(i + 1); setTimeout(() => runInterview(i + 1), 300); }
      else if (interviewScript[i + 1]?.wait) { setInterviewIdx(i + 1); setInterviewWait("user"); if (interviewScript[i + 1].options) setInterviewOpts(interviewScript[i + 1].options); }
    }
  }, [interviewScript]);

  useEffect(() => { interviewRef.current?.scrollIntoView({ behavior: "smooth" }); }, [interviewMsgs, interviewTyping]);

  const interviewReply = (text) => {
    setInterviewMsgs(m => [...m, { text, isAI: false }]);
    setInterviewWait(null); setInterviewOpts([]);
    const next = interviewIdx + 1;
    if (next < interviewScript.length) { setInterviewIdx(next); setTimeout(() => runInterview(next), 300); }
  };

  const sevColor = (s) => s <= 2 ? T.green : s <= 5 ? T.warm : T.danger;

  // ── CELEBRATE PHASE ──
  if (phase === "celebrate") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 24px", textAlign: "center", background: T.bg, position: "relative", overflow: "hidden" }}>
        {/* Fireworks */}
        {showFireworks && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                left: `${10 + Math.random() * 80}%`,
                top: `${5 + Math.random() * 60}%`,
                width: i % 3 === 0 ? 8 : 6,
                height: i % 3 === 0 ? 8 : 6,
                borderRadius: "50%",
                background: [T.accent, T.warm, T.purple, T.green, T.pink, "#FFD700"][i % 6],
                animation: `firework${i % 3} ${1.5 + Math.random() * 2}s ease-out ${Math.random() * 1.5}s infinite`,
                opacity: 0,
              }} />
            ))}
            <style>{`
              @keyframes firework0 { 0% { transform:translateY(0) scale(0); opacity:1 } 50% { opacity:1 } 100% { transform:translateY(-80px) scale(1.5); opacity:0 } }
              @keyframes firework1 { 0% { transform:translate(0,0) scale(0); opacity:1 } 50% { opacity:1 } 100% { transform:translate(30px,-60px) scale(1.3); opacity:0 } }
              @keyframes firework2 { 0% { transform:translate(0,0) scale(0); opacity:1 } 50% { opacity:1 } 100% { transform:translate(-25px,-70px) scale(1.4); opacity:0 } }
            `}</style>
          </div>
        )}

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 72, marginBottom: 16, animation: "breathe 1.5s ease-in-out infinite" }}>🎉</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: -1.5, marginBottom: 8, background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Amazing result!
          </h1>
          <p style={{ fontSize: 18, color: T.text, fontWeight: 700, marginBottom: 4 }}>
            {pctDrop}% reduction
          </p>
          <p style={{ fontSize: 15, color: T.textMuted, marginBottom: 28 }}>
            {condition.label}: {beforeSev}/10 → {afterSev}/10
          </p>
          <Btn onClick={() => setPhase("recap")} full>See your session recap →</Btn>
        </div>
      </div>
    );
  }

  // ── RECAP PHASE ──
  if (phase === "recap") {
    return (
      <>
        <Header center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Session Recap</span>} />
        <ScreenWrap>
          <div style={{ animation: "slideUp .4s ease" }}>
            {/* Big result */}
            <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`, border: `1px solid ${T.accent}25`, textAlign: "center", padding: "24px 18px" }}>
              <div style={{ fontSize: 42, marginBottom: 8 }}>🎉</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: -1.5, color: T.accent }}>{pctDrop}%</div>
              <p style={{ fontSize: 14, color: T.textMuted, marginTop: 4 }}>pain reduction in one session</p>
            </Card>

            {/* Journey timeline */}
            <Label>YOUR SESSION JOURNEY</Label>
            <div style={{ position: "relative", paddingLeft: 24, marginBottom: 20 }}>
              {/* Timeline line */}
              <div style={{ position: "absolute", left: 10, top: 8, bottom: 8, width: 2, background: `linear-gradient(180deg, ${T.danger}, ${T.warm}, ${T.green})`, borderRadius: 1 }} />

              {recapSteps.map((step, i) => (
                <div key={i} style={{ position: "relative", paddingBottom: i < recapSteps.length - 1 ? 20 : 0, animation: `slideUp ${.3 + i * .12}s ease` }}>
                  {/* Dot */}
                  <div style={{ position: "absolute", left: -20, top: 2, width: 22, height: 22, borderRadius: "50%", background: T.card, border: `2px solid ${sevColor(step.severity)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{step.icon}</div>

                  <div style={{ paddingLeft: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 }}>{step.label}</div>
                    <div style={{ padding: "8px 12px", borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, marginBottom: 4 }}>
                      <p style={{ fontSize: 13, color: T.text, fontStyle: "italic", lineHeight: 1.45 }}>{step.quote}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 40, height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(step.severity / 10) * 100}%`, background: sevColor(step.severity), borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: sevColor(step.severity) }}>{step.severity}/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Before/After body maps */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 10, border: `1px solid ${T.border}` }}><div style={{ textAlign: "center", marginBottom: 6, fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1 }}>BEFORE</div><BodyMap side="front" pins={baselinePins} small /></div>
              <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 10, border: `1px solid ${T.green}25` }}><div style={{ textAlign: "center", marginBottom: 6, fontSize: 10, fontWeight: 600, color: T.green, letterSpacing: 1 }}>AFTER</div><BodyMap side="front" pins={finalPins} small /></div>
            </div>

            <Btn onClick={() => setPhase("share")} full>Share this recap</Btn>
            <div style={{ height: 8 }} />
            <Btn onClick={() => setPhase("interviewOffer")} variant="secondary" full>Continue →</Btn>
          </div>
        </ScreenWrap>
      </>
    );
  }

  // ── SHARE RECAP PHASE ──
  if (phase === "share") {
    return (
      <>
        <Header left={<BackBtn onClick={() => setPhase("recap")} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Share</span>} />
        <ScreenWrap>
          <div style={{ animation: "slideUp .4s ease" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Share your result</h2>
            <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20, lineHeight: 1.5 }}>Let your friends know about your experience, or let us share it to help others discover healing.</p>

            <Card style={{ marginBottom: 12, background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`, border: `1px solid ${T.accent}20`, textAlign: "center", padding: "18px 14px" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🎉</div>
              <p style={{ fontSize: 15, fontWeight: 700 }}>{condition.label}: {beforeSev}/10 → {afterSev}/10</p>
              <p style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>{pctDrop}% reduction in one session on Ennie</p>
            </Card>

            <Label>SHARE WITH</Label>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[{ icon: "💬", label: "Message", color: T.accent }, { icon: "📱", label: "Social", color: T.blue }, { icon: "📋", label: "Copy link", color: T.textMuted }].map(s => <Card key={s.label} style={{ flex: 1, textAlign: "center", cursor: "pointer", padding: "14px 8px" }}><span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>{s.icon}</span><span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</span></Card>)}
            </div>

            <Card style={{ marginBottom: 12, padding: "14px 16px" }} onClick={() => setShareConsent(c => ({ ...c, ennie: !c.ennie }))}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${shareConsent.ennie ? T.accent : T.border}`, background: shareConsent.ennie ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: T.bg, transition: "all .15s" }}>{shareConsent.ennie ? "✓" : ""}</div>
                <div><span style={{ fontSize: 13, fontWeight: 600 }}>Let Ennie share my result</span><p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>We may feature your result anonymously to help others</p></div>
              </div>
            </Card>

            <Btn onClick={() => setPhase("interviewOffer")} full>Continue →</Btn>
          </div>
        </ScreenWrap>
      </>
    );
  }

  // ── INTERVIEW OFFER PHASE ──
  if (phase === "interviewOffer") {
    return (
      <>
        <Header center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Share your story</span>} />
        <ScreenWrap>
          <div style={{ animation: "slideUp .4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`, border: `2px solid ${T.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "12px auto 16px", fontSize: 34 }}>🎥</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Your story could help thousands</h2>
              <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>
                Record a short video about your experience. We'll turn it into an ad — and you'll earn from every person it brings in.
              </p>
            </div>

            {/* The deal */}
            <Card style={{ marginBottom: 14, background: `linear-gradient(135deg, ${T.greenDim}, ${T.accentDim})`, border: `1px solid ${T.green}25` }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: T.green }}>What you get</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: T.purple + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>👥</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>1 month free Group Healing</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Instant reward just for recording — that's 8 sessions worth $19.99</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: T.accent + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>💰</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Revenue share on your ad</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Every person your ad brings to Ennie earns you credit toward future sessions — Super Sessions, Group Healing, anything.</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: T.green + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>♾️</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>No cap on earnings</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>If your ad performs well, you could earn a free session, dozens of free sessions, or even a lifetime of healing.</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* How it works */}
            <Card style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>How it works</div>
              {[
                { num: "1", text: "Record a 2-minute video interview — Charlie guides you through it" },
                { num: "2", text: "You review the video and approve it before anything goes live" },
                { num: "3", text: "We create an ad from your testimonial and run it on social media" },
                { num: "4", text: "Every new user who signs up through your ad earns you session credit" },
                { num: "5", text: "Track your earnings and redeem anytime from your Billing tab" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0", borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: T.accent + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.accent, flexShrink: 0, marginTop: 1 }}>{s.num}</div>
                  <span style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.45 }}>{s.text}</span>
                </div>
              ))}
            </Card>

            {/* Trust signals */}
            <Card style={{ marginBottom: 16, background: T.surface }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: "✅", text: "Your results are verified — only people with measured improvement can record" },
                  { icon: "👀", text: "You review and approve everything before it's shared" },
                  { icon: "🔒", text: "You can withdraw consent at any time" },
                  { icon: "📊", text: "Track your ad's performance and earnings in real-time" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: T.textMuted }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Btn onClick={() => { setPhase("interview"); setCameraActive(true); runInterview(0); }} full style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.purple})` }}>
              Let's record — earn free healing 🎥
            </Btn>
            <div style={{ height: 8 }} />
            <Btn onClick={onDone} variant="ghost" full>Not right now</Btn>
          </div>
        </ScreenWrap>
      </>
    );
  }

  // ── INTERVIEW PHASE ──
  if (phase === "interview") {
    return (
      <>
        <Header
          left={<BackBtn onClick={() => setPhase("interviewOffer")} />}
          center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Interview with Charlie</span>}
          right={cameraActive && <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: T.danger, animation: "pulse 1s infinite" }} /><span style={{ fontSize: 11, color: T.danger, fontWeight: 600 }}>REC</span></div>}
        />

        {/* Camera preview */}
        {cameraActive && (
          <div style={{ height: 160, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>👤</div>
            <div style={{ position: "absolute", top: 8, left: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.danger, animation: "pulse 1s infinite" }} />
              <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>RECORDING</span>
            </div>
            <div style={{ position: "absolute", bottom: 8, right: 12, fontSize: 10, color: "#666" }}>Camera preview (demo)</div>
          </div>
        )}

        {/* Chat area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px" }}>
          {interviewMsgs.map((m, i) => <ChatBubble key={i} text={m.text} isAI={m.isAI} />)}
          {interviewTyping && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.bg }}>C</div>
              <div style={{ background: T.card, borderRadius: "4px 14px 14px 14px", border: `1px solid ${T.border}` }}><TypingDots /></div>
            </div>
          )}
          <div ref={interviewRef} />
        </div>

        {/* Response options */}
        {interviewWait === "user" && interviewOpts.length > 0 && (
          <div style={{ padding: "4px 16px 6px", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {interviewOpts.map((o, i) => <button key={i} onClick={() => interviewReply(o)} style={{ padding: "7px 12px", borderRadius: 18, border: `1px solid ${T.accent}35`, background: T.accentDim, color: T.accent, fontSize: 12.5, fontWeight: 500, cursor: "pointer", animation: `slideUp ${.2 + i * .06}s ease` }}>{o}</button>)}
          </div>
        )}

        {/* Input or done */}
        {interviewDone ? (
          <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${T.border}` }}>
            <Btn onClick={() => { setCameraActive(false); setPhase("permission"); }} full>Finish recording →</Btn>
          </div>
        ) : (
          <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${T.border}`, background: `${T.surface}ee`, display: "flex", gap: 8 }}>
            <Input value={interviewText} onChange={e => setInterviewText(e.target.value)} placeholder="Or speak freely…" style={{ flex: 1 }} />
            <Btn onClick={() => { if (interviewText.trim()) { interviewReply(interviewText.trim()); setInterviewText(""); } }} small style={{ width: 44, borderRadius: 12, padding: 0 }}>↑</Btn>
          </div>
        )}
      </>
    );
  }

  // ── PERMISSION PHASE ──
  if (phase === "permission") {
    return (
      <>
        <Header center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Your testimonial</span>} />
        <ScreenWrap>
          <div style={{ animation: "slideUp .4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Interview recorded!</h2>
              <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.55 }}>Thank you. Now choose how you'd like it used — and start earning.</p>
            </div>

            {/* Free month unlocked */}
            <Card style={{ marginBottom: 12, background: T.greenDim, border: `1px solid ${T.green}25`, textAlign: "center", padding: "16px" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🎁</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.green, marginBottom: 2 }}>1 month free Group Healing unlocked!</div>
              <p style={{ fontSize: 12, color: T.textMuted }}>8 sessions · Starts immediately · No card required</p>
            </Card>

            {/* Sharing options */}
            <Label>SHARING PERMISSIONS</Label>
            <Card style={{ marginBottom: 10, padding: "14px 16px" }} onClick={() => setShareConsent(c => ({ ...c, friends: !c.friends }))}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${shareConsent.friends ? T.accent : T.border}`, background: shareConsent.friends ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: T.bg, transition: "all .15s" }}>{shareConsent.friends ? "✓" : ""}</div>
                <div><span style={{ fontSize: 14, fontWeight: 600 }}>Share with my friends</span><p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Get a personal link to send to anyone you choose</p></div>
              </div>
            </Card>

            <Card style={{ marginBottom: 12, padding: "14px 16px", border: `1px solid ${shareConsent.ennie ? T.accent + "40" : T.border}` }} onClick={() => setShareConsent(c => ({ ...c, ennie: !c.ennie }))}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${shareConsent.ennie ? T.accent : T.border}`, background: shareConsent.ennie ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: T.bg, transition: "all .15s" }}>{shareConsent.ennie ? "✓" : ""}</div>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Let Ennie use it as an ad</span>
                  <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>We create an ad from your video and run it on social media</p>
                </div>
              </div>
            </Card>

            {/* Revenue share details — shown when they agree to ad use */}
            {shareConsent.ennie && (
              <Card style={{ marginBottom: 12, border: `1px solid ${T.accent}25`, background: `${T.accent}06`, animation: "slideUp .2s ease" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, marginBottom: 8 }}>Your revenue share deal</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12, color: T.textMuted }}>Your share</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>% of revenue from your ad</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12, color: T.textMuted }}>Earned as</span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>Credit toward any Ennie session</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12, color: T.textMuted }}>Earning cap</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.green }}>None — unlimited</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                    <span style={{ fontSize: 12, color: T.textMuted }}>Tracking</span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>Real-time in your Billing tab</span>
                  </div>
                </div>
                <div style={{ padding: "10px 12px", borderRadius: 10, background: T.accentDim, marginTop: 10 }}>
                  <p style={{ fontSize: 12, color: T.accent, lineHeight: 1.5 }}>💡 If your ad brings in 50 people, that could be $500+ in session credit. Some of our best testimonials have earned their creators a lifetime of free healing.</p>
                </div>
              </Card>
            )}

            <div style={{ height: 8 }} />
            <Btn onClick={onDone} full style={shareConsent.ennie ? { background: `linear-gradient(135deg, ${T.accent}, ${T.purple})` } : {}}>
              {shareConsent.ennie ? "Agree & start earning 💰" : shareConsent.friends ? "Share & finish" : "Finish"}
            </Btn>
            <div style={{ height: 6 }} />
            <Btn onClick={onDone} variant="ghost" full small>Skip — go home</Btn>
            {shareConsent.ennie && <p style={{ fontSize: 10, color: T.textDim, textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>You can withdraw consent at any time from Profile. Revenue share continues as long as your ad is active.</p>}
          </div>
        </ScreenWrap>
      </>
    );
  }

  return null;
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 11: Follow-up Check-in
   ═══════════════════════════════════════════════════════════════ */
const FollowUpScreen = ({ onPositive, onNeutral, pins, setPins }) => {
  const [selPin, setSelPin] = useState(pins[0]?.id || null);
  const [side, setSide] = useState("front");
  return (
    <>
      <Header left={<Logo />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Follow-up</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <Card style={{ marginBottom: 14, background: T.blueDim, border: `1px solid ${T.blue}25` }}>
            <p style={{ fontSize: 13, color: T.blue, fontWeight: 600, marginBottom: 4 }}>24-hour check-in</p>
            <p style={{ fontSize: 13, color: T.text }}>These are your results from your last session. Adjust the sliders to reflect how you feel now.</p>
          </Card>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>{["front", "back"].map(s => <button key={s} onClick={() => setSide(s)} style={{ padding: "3px 14px", borderRadius: 16, fontSize: 10, fontWeight: 600, border: `1px solid ${side === s ? T.accent + "50" : T.border}`, background: side === s ? T.accentDim : "transparent", color: side === s ? T.accent : T.textMuted, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>{s}</button>)}</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><BodyMap side={side} pins={pins} onAddPin={(x, y, sd) => { const p = { id: Date.now(), x, y, side: sd, severity: 5 }; setPins(prev => [...prev, p]); setSelPin(p.id); }} onSelectPin={setSelPin} selectedPin={selPin} /></div>
          {selPin && <Card style={{ marginBottom: 14 }}><Label>HOW IS SYMPTOM #{pins.findIndex(p => p.id === selPin) + 1} NOW?</Label><Slider value={pins.find(p => p.id === selPin)?.severity || 5} onChange={v => setPins(ps => ps.map(p => p.id === selPin ? { ...p, severity: v } : p))} /></Card>}
          <Divider />
          <Label>OR QUICK RESPONSE</Label>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[{ label: "100% better", icon: "✅", v: "accent", fn: "pos" }, { label: "It didn't help", icon: "✕", v: "secondary", fn: "neut" }].map(r => <Btn key={r.label} variant={r.v} small onClick={r.fn === "pos" ? onPositive : onNeutral} style={{ flex: 1 }}>{r.icon} {r.label}</Btn>)}
          </div>
          <Btn onClick={onPositive} full>Submit check-in</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 11b: No Result — Immediate Support
   ═══════════════════════════════════════════════════════════════ */
const NoResultScreen = ({ baselinePins = [], finalPins = [], userCondition = "migraine", wasPaid = false, onHome, onHuman }) => {
  const [msgs, setMsgs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [typing, setTyping] = useState(false);
  const [waitFor, setWaitFor] = useState(null);
  const [opts, setOpts] = useState([]);
  const [text, setText] = useState("");
  const [resolved, setResolved] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const endRef = useRef(null);
  const scroll = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  const condition = CONDITIONS_DATA.find(c => c.id === userCondition) || CONDITIONS_DATA[1];
  const beforeSev = baselinePins[0]?.severity || 7;
  const afterSev = finalPins[0]?.severity || 7;
  const successRate = condition.successByTier?.[wasPaid ? "today" : "free"] || 25;

  const supportScript = useMemo(() => {
    const paid = wasPaid;
    return [
      { ai: "I'm really sorry to hear the session didn't give you the result you were hoping for. I want you to know we hear you, and I'm here to help.", delay: 1200 },
      { ai: "Can you tell me a bit about how you're feeling right now?", delay: 800 },
      { wait: "user", options: [
        paid ? "I'm frustrated I paid and got nothing" : "I'm disappointed it didn't work",
        "I don't think energy healing works",
        "I want to try again",
        "I just want to talk to someone",
      ]},
      ...(paid ? [
        { ai: "I completely understand. Paying for something and not seeing a result is frustrating. Here's what I want you to know:", delay: 1000 },
        { ai: `For ${condition.label.toLowerCase()}, ${successRate}% of patients report meaningful improvement — that's real, user-reported data validated by UC Irvine researchers. But that also means it doesn't work for everyone, and we're upfront about that.`, delay: 1200 },
        { ai: "Like any health practitioner — a physiotherapist, chiropractor, or doctor — we charge for the service regardless of outcome. We show you the success rates before you book so you can make an informed choice.", delay: 1200 },
        { ai: "That said, energy healing results can sometimes take up to 24 hours to fully manifest. Many patients who initially reported no change found improvement at their follow-up check-in.", delay: 1000 },
      ] : [
        { ai: "I hear you. Not every session produces a noticeable result, and that can be disappointing — especially when you're dealing with real symptoms.", delay: 1000 },
        { ai: `For ${condition.label.toLowerCase()}, about ${successRate}% of healer testing sessions show measurable improvement. That's based on real patient feedback, validated by UC Irvine. It's encouraging, but it means not everyone will respond — especially in a single session.`, delay: 1200 },
        { ai: "Energy healing results can also take up to 24 hours to fully show. We'll check in with you tomorrow, and you might be surprised.", delay: 1000 },
      ]),
      { ai: "How are you feeling about all of that? What would help right now?", delay: 800 },
      { wait: "user", options: [
        "That makes sense, I'll wait and see",
        "I'd like to try another session",
        "I want a refund",
        "I want to speak to a real person",
      ]},
    ];
  }, [wasPaid, condition, successRate]);

  const responseMap = {
    "That makes sense, I'll wait and see": [
      { ai: "That's a great attitude. We'll send you a follow-up check-in in 24 hours so you can report any changes. Many people are pleasantly surprised.", delay: 1000 },
      { ai: "In the meantime, try to rest, stay hydrated, and pay attention to even subtle shifts in how your body feels. Sometimes the change is gradual rather than instant.", delay: 1000 },
      { ai: "Thank you for giving it a chance. We're rooting for you. 💜", delay: 800, action: "resolve" },
    ],
    "I'd like to try another session": [
      { ai: "Absolutely. Multiple sessions often produce better results — in fact, most of our strongest outcomes come after 2–3 sessions.", delay: 1000 },
      { ai: `For ${condition.label.toLowerCase()}, patients who did 3+ sessions saw an average pain drop of ${condition.avgDrop.toFixed(1)} points per session.`, delay: 1000 },
      { ai: wasPaid
        ? "You can book another Super Session from the home screen, or try a free Healer Testing Session to work with a different healer."
        : "You can start another free Healer Testing Session anytime from the home screen — different healers may work differently for you.", delay: 1000 },
      { ai: "We'd love for you to try again. 💜", delay: 600, action: "resolve" },
    ],
    "I want a refund": [
      { ai: "I understand. Here's our approach to refunds:", delay: 800 },
      { ai: "We show success rates for every condition before you book, and we're transparent that energy healing doesn't work for everyone. Like seeing any practitioner, the fee covers the session itself.", delay: 1200 },
      { ai: "That said, we want you to feel supported. If you believe something went wrong with the session itself — technical issues, a healer who wasn't responsive, or anything that wasn't right — we absolutely want to make it right.", delay: 1200 },
      { ai: "Would you like me to connect you with a team member who can review your case personally?", delay: 800 },
      { wait: "user", options: ["Yes, connect me", "No, I understand", "I'll wait for the follow-up first"] },
    ],
    "I want to speak to a real person": [
      { ai: "Of course. Let me connect you with someone from our support team right away. A real person will be with you shortly.", delay: 1000, action: "escalate" },
    ],
    "Yes, connect me": [
      { ai: "I'm connecting you with a support team member now. They'll have your session details ready. You should hear from someone within a few minutes.", delay: 1000, action: "escalate" },
    ],
    "No, I understand": [
      { ai: "Thank you for understanding. We'll check in with you in 24 hours — sometimes results appear gradually. We really appreciate your patience. 💜", delay: 1000, action: "resolve" },
    ],
    "I'll wait for the follow-up first": [
      { ai: "Smart call. We'll send you a check-in in 24 hours. If you still haven't seen improvement, you can reach our support team anytime. We're here for you. 💜", delay: 1000, action: "resolve" },
    ],
  };

  const runStep = useCallback(async (i) => {
    if (i >= supportScript.length) return;
    const s = supportScript[i];
    if (s.ai) {
      setTyping(true); await wait(s.delay || 800); setTyping(false);
      setMsgs(m => [...m, { text: s.ai, isAI: true }]);
      if (s.action === "resolve") setResolved(true);
      if (s.action === "escalate") { setEscalated(true); setResolved(true); }
      if (supportScript[i + 1]?.ai) { setIdx(i + 1); setTimeout(() => runStep(i + 1), 300); }
      else if (supportScript[i + 1]?.wait) { setIdx(i + 1); setWaitFor("user"); if (supportScript[i + 1].options) setOpts(supportScript[i + 1].options); }
    }
  }, [supportScript]);

  useEffect(() => { runStep(0); }, []);
  useEffect(scroll, [msgs, typing]);

  const reply = async (text) => {
    setMsgs(m => [...m, { text, isAI: false }]);
    setWaitFor(null); setOpts([]);

    // Check for follow-up responses
    const responses = responseMap[text];
    if (responses) {
      for (const r of responses) {
        if (r.ai) {
          setTyping(true); await wait(r.delay || 800); setTyping(false);
          setMsgs(m => [...m, { text: r.ai, isAI: true }]);
          if (r.action === "resolve") setResolved(true);
          if (r.action === "escalate") { setEscalated(true); setResolved(true); }
        }
        if (r.wait) { setWaitFor("user"); if (r.options) setOpts(r.options); return; }
      }
    } else {
      // Continue main script
      const next = idx + 1;
      if (next < supportScript.length) { setIdx(next); setTimeout(() => runStep(next), 300); }
    }
  };

  return (
    <>
      <Header
        left={<BackBtn onClick={onHome} />}
        center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>We're here for you</span>}
      />

      {/* Session summary strip */}
      <div style={{ padding: "10px 16px", background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{condition.icon}</span>
          <span style={{ fontSize: 12, color: T.textMuted }}>{condition.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12, color: T.danger }}>{beforeSev}/10</span>
          <span style={{ fontSize: 10, color: T.textDim }}>→</span>
          <span style={{ fontSize: 12, color: afterSev < beforeSev ? T.warm : T.danger }}>{afterSev}/10</span>
          {wasPaid && <Badge color={T.purple} bg={T.purpleDim}>Paid</Badge>}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px" }}>
        {msgs.map((m, i) => <ChatBubble key={i} text={m.text} isAI={m.isAI} />)}
        {typing && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.bg }}>E</div>
            <div style={{ background: T.card, borderRadius: "4px 14px 14px 14px", border: `1px solid ${T.border}` }}><TypingDots /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Response options */}
      {waitFor === "user" && opts.length > 0 && (
        <div style={{ padding: "6px 16px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {opts.map((o, i) => <button key={i} onClick={() => reply(o)} style={{ padding: "8px 14px", borderRadius: 18, border: `1px solid ${T.accent}35`, background: T.accentDim, color: T.accent, fontSize: 12.5, fontWeight: 500, cursor: "pointer", animation: `slideUp ${.2 + i * .06}s ease` }}>{o}</button>)}
        </div>
      )}

      {/* Resolved / escalated states */}
      {resolved && !escalated && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, background: T.surface }}>
          <Btn onClick={onHome} full>Back to home</Btn>
        </div>
      )}

      {escalated && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, background: T.greenDim }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: T.green }}>Connecting you with support…</span>
          </div>
          <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 10 }}>A team member will be with you shortly. They'll have your full session details.</p>
          <Btn onClick={onHome} variant="ghost" full small>Return to home while you wait</Btn>
        </div>
      )}

      {/* Free text input */}
      {!resolved && (
        <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${T.border}`, background: `${T.surface}ee`, display: "flex", gap: 8 }}>
          <Input value={text} onChange={e => setText(e.target.value)} placeholder="Tell us how you feel…" style={{ flex: 1 }} />
          <Btn onClick={() => { if (text.trim()) { reply(text.trim()); setText(""); } }} small style={{ width: 44, borderRadius: 12, padding: 0 }}>↑</Btn>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 12: Healer Onboarding — 6-Step Journey
   ═══════════════════════════════════════════════════════════════ */
const HealerOnboardScreen = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ language: "English", modality: "", tz: "", exp: "" });
  const [showTraining, setShowTraining] = useState(false);
  const [simPhase, setSimPhase] = useState(0);
  const [agreements, setAgreements] = useState({ mediated: false, anonymous: false, noRecording: false, tracked: false });
  const allAgreed = Object.values(agreements).every(Boolean);
  const totalSteps = 7;

  // Simulation auto-advance (must be top-level hook)
  useEffect(() => {
    if (step !== 5) return;
    if (simPhase >= 5) return;
    const delays = [1500, 2500, 2000, 2500, 2000];
    const t = setTimeout(() => setSimPhase(p => p + 1), delays[simPhase] || 2000);
    return () => clearTimeout(t);
  }, [step, simPhase]);

  // Progress bar
  const ProgressDots = () => (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "12px 0 4px" }}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i <= step ? T.accent : T.border, transition: "all .3s" }} />
      ))}
    </div>
  );

  // ── STEP 0: Welcome ──
  if (step === 0) return (
    <>
      <Header left={<BackBtn onClick={onBack} />} right={<span style={{ fontSize: 11, color: T.textDim }}>1/{totalSteps}</span>} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px", animation: "fadeIn .6s ease" }}>
        <ProgressDots />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32, color: "#fff" }}>✦</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 12 }}>You're joining<br />something different.</h1>
          <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.65, maxWidth: 320, margin: "0 auto 8px" }}>
            Ennie is the world's first outcomes-measured energy healing platform. Every session is tracked, every result is real.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20, textAlign: "left" }}>
            {[
              { icon: "🤖", title: "AI-mediated", desc: "You never speak to the patient directly. Our AI handles all communication." },
              { icon: "🔬", title: "Research-backed", desc: "Sessions are part of ongoing research with UC Irvine. Your results matter." },
              { icon: "📊", title: "Outcomes-measured", desc: "Patient symptoms are tracked before, during, and after every session." },
              { icon: "🌍", title: "Anonymous & remote", desc: "Both sides are anonymous. You heal from wherever you are." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, animation: `slideUp ${.3 + i * .08}s ease` }}>
                <span style={{ fontSize: 20, marginTop: 1 }}>{item.icon}</span>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div><div style={{ fontSize: 12, color: T.textMuted, marginTop: 1 }}>{item.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 0 24px" }}>
          <Btn onClick={() => setStep(1)} full>I'm in — let's go →</Btn>
        </div>
      </div>
    </>
  );

  // ── STEP 1: About You ──
  if (step === 1) return (
    <>
      <Header left={<BackBtn onClick={() => setStep(0)} />} center={<span style={{ fontSize: 13, color: T.textMuted }}>About you</span>} right={<span style={{ fontSize: 11, color: T.textDim }}>2/{totalSteps}</span>} />
      <ScreenWrap>
        <ProgressDots />
        <div style={{ animation: "slideUp .4s ease", paddingTop: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Tell us about yourself</h2>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>This helps us match you with the right patients.</p>

          <Label>LANGUAGE</Label>
          <Input value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} placeholder="English" />
          <div style={{ height: 12 }} />

          <Label>HEALING MODALITY</Label>
          <Input value={form.modality} onChange={e => setForm({ ...form, modality: e.target.value })} placeholder="e.g. Reiki, energy healing, pranic…" />
          <div style={{ height: 12 }} />

          <Label>TIMEZONE</Label>
          <Input value={form.tz} onChange={e => setForm({ ...form, tz: e.target.value })} placeholder="e.g. America/Los_Angeles" />
          <div style={{ height: 16 }} />

          <Label>EXPERIENCE LEVEL</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {[
              { id: "No experience", label: "New to energy healing", desc: "I haven't practiced before but I'm drawn to it", icon: "🌱" },
              { id: "Some experience", label: "Some experience", desc: "I've practiced informally or am still learning", icon: "🌿" },
              { id: "Professional", label: "Professional practitioner", desc: "I have an established practice or formal training", icon: "🌳" },
            ].map(opt => (
              <div key={opt.id} onClick={() => setForm({ ...form, exp: opt.id })} style={{
                padding: "12px 14px", borderRadius: 14, cursor: "pointer",
                background: form.exp === opt.id ? T.accentDim : T.card,
                border: `1.5px solid ${form.exp === opt.id ? T.accent : T.border}`,
                transition: "all .15s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: form.exp === opt.id ? T.accent : T.text }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{opt.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Training route for no experience */}
          {form.exp === "No experience" && !showTraining && (
            <Card style={{ background: T.warmDim, border: `1px solid ${T.warm}30`, marginBottom: 16, animation: "slideUp .3s ease" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 20 }}>📚</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.warm, marginBottom: 4 }}>Training recommended</p>
                  <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5, marginBottom: 10 }}>We recommend learning the Human Medicine method before your first session. It will significantly improve your results.</p>
                  <Btn onClick={() => setShowTraining(true)} variant="warm" small>Learn about Human Medicine →</Btn>
                </div>
              </div>
            </Card>
          )}

          {/* Training page inline */}
          {showTraining && (
            <Card style={{ border: `1px solid ${T.warm}30`, marginBottom: 16, animation: "slideUp .3s ease" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>📚</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Human Medicine</span>
                </div>
                <button onClick={() => setShowTraining(false)} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 12, cursor: "pointer" }}>✕ Close</button>
              </div>
              <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6, marginBottom: 12 }}>
                Human Medicine is Charlie Goldsmith's approach to energy healing — a method focused on intention, connection, and measurable outcomes. It's designed for anyone, regardless of background.
              </p>
              <div style={{ borderRadius: 12, overflow: "hidden", background: "#1a1a1a", height: 160, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 20 }}>▶</div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Introduction to Human Medicine (12 min)</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "You don't need to believe — you need to try",
                  "Energy healing is intention + focus + connection",
                  "The AI measures everything — just do your best",
                  "Results often surprise both the healer and the patient",
                ].map((point, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.warm, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: T.textMuted }}>{point}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: T.blueDim, border: `1px solid ${T.blue}20` }}>
                <p style={{ fontSize: 11, color: T.blue, lineHeight: 1.5 }}>💡 You can also access the full Human Medicine course from your dashboard after sign-up.</p>
              </div>
            </Card>
          )}

          {/* Optional training for experienced healers */}
          {(form.exp === "Some experience" || form.exp === "Professional") && (
            <div style={{ padding: "10px 14px", borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setShowTraining(!showTraining)}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>📚</span>
                <span style={{ fontSize: 12, color: T.textMuted }}>Explore the Human Medicine method (optional)</span>
              </div>
              <span style={{ fontSize: 12, color: T.accent }}>{showTraining ? "▴" : "▾"}</span>
            </div>
          )}

          <Btn onClick={() => setStep(2)} full disabled={!form.modality || !form.exp}>Continue →</Btn>
        </div>
      </ScreenWrap>
    </>
  );

  // ── STEP 2: How Sessions Work ──
  if (step === 2) return (
    <>
      <Header left={<BackBtn onClick={() => setStep(1)} />} center={<span style={{ fontSize: 13, color: T.textMuted }}>How it works</span>} right={<span style={{ fontSize: 11, color: T.textDim }}>3/{totalSteps}</span>} />
      <ScreenWrap>
        <ProgressDots />
        <div style={{ animation: "slideUp .4s ease", paddingTop: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>What a session looks like</h2>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>Here's what happens from your side, step by step.</p>

          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{ position: "absolute", left: 12, top: 8, bottom: 8, width: 2, background: `linear-gradient(180deg, ${T.accent}, ${T.purple})`, borderRadius: 1 }} />

            {[
              { num: "1", icon: "🔔", title: "You get a case notification", desc: "When a patient matches your specialization, you'll get a 5-second window to claim the session.", color: T.accent },
              { num: "2", icon: "📋", title: "You see their symptom map", desc: "The patient's body map, severity ratings, condition category, and duration are shown — all anonymous.", color: T.blue },
              { num: "3", icon: "✦", title: "You begin healing remotely", desc: "Focus your energy and intention. You work from wherever you are — the patient could be anywhere in the world.", color: T.purple },
              { num: "4", icon: "💬", title: "AI mediates feedback", desc: "The patient reports changes in real-time through our AI. You'll see severity updates and messages — but never speak directly.", color: T.warm },
              { num: "5", icon: "📊", title: "Results are measured", desc: "Before/after severity scores are compared. This data feeds your qualification progress and the research with UCI.", color: T.green },
            ].map((s, i) => (
              <div key={i} style={{ position: "relative", paddingBottom: i < 4 ? 20 : 0, animation: `slideUp ${.3 + i * .1}s ease` }}>
                <div style={{ position: "absolute", left: -22, top: 2, width: 22, height: 22, borderRadius: "50%", background: s.color + "20", border: `2px solid ${s.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{s.icon}</div>
                <div style={{ paddingLeft: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{s.title}</div>
                  <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 20 }} />
          <Card style={{ background: T.accentDim, border: `1px solid ${T.accent}20`, textAlign: "center", padding: "14px 16px" }}>
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>Each session is about <strong>5 minutes</strong>. You can do as many or as few as you want in a sitting.</p>
          </Card>
          <div style={{ height: 16 }} />
          <Btn onClick={() => setStep(3)} full>Got it — how am I evaluated? →</Btn>
        </div>
      </ScreenWrap>
    </>
  );

  // ── STEP 3: How You're Evaluated ──
  if (step === 3) return (
    <>
      <Header left={<BackBtn onClick={() => setStep(2)} />} center={<span style={{ fontSize: 13, color: T.textMuted }}>Evaluation</span>} right={<span style={{ fontSize: 11, color: T.textDim }}>4/{totalSteps}</span>} />
      <ScreenWrap>
        <ProgressDots />
        <div style={{ animation: "slideUp .4s ease", paddingTop: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>How you're evaluated</h2>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20, lineHeight: 1.5 }}>We're fully transparent about how this works. You'll always know where you stand.</p>

          <Card style={{ marginBottom: 12, border: `1px solid ${T.accent}25` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📊</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Beat placebo threshold</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>75% of your sessions need to show measurable improvement</div>
              </div>
            </div>
            <ProgressBar value={75} color={T.accent} />
            <p style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>This threshold is set by UC Irvine researchers to distinguish real ability from chance.</p>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <Label>TWO PATHS TO QUALIFICATION</Label>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, padding: "12px 10px", borderRadius: 12, background: T.greenDim, border: `1px solid ${T.green}25`, textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>🌳</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.green }}>General</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>75% across all conditions · 20+ sessions</div>
              </div>
              <div style={{ flex: 1, padding: "12px 10px", borderRadius: 12, background: T.accentDim, border: `1px solid ${T.accent}25`, textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>🎯</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>Specialist</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>75% in a specific condition · 8+ sessions</div>
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <Label>YOUR JOURNEY</Label>
            {[
              { stage: "Applicant", desc: "Your first 20 sessions. Free healer testing sessions only.", color: T.warm, icon: "🔬" },
              { stage: "Specialist", desc: "Qualified for specific conditions. Access to paid sessions.", color: T.accent, icon: "🎯" },
              { stage: "Verified Healer", desc: "75%+ across the board. Full access to all session types.", color: T.green, icon: "✅" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.stage}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </Card>

          <div style={{ padding: "10px 14px", borderRadius: 12, background: T.blueDim, border: `1px solid ${T.blue}20`, marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: T.blue, lineHeight: 1.5 }}>💡 Don't stress about numbers early on. Focus on your intention and the process. Many healers who start below threshold improve dramatically with practice.</p>
          </div>

          <Btn onClick={() => setStep(4)} full>Continue →</Btn>
        </div>
      </ScreenWrap>
    </>
  );

  // ── STEP 4: How You Get Paid ──
  if (step === 4) return (
    <>
      <Header left={<BackBtn onClick={() => setStep(3)} />} center={<span style={{ fontSize: 13, color: T.textMuted }}>Earnings</span>} right={<span style={{ fontSize: 11, color: T.textDim }}>5/{totalSteps}</span>} />
      <ScreenWrap>
        <ProgressDots />
        <div style={{ animation: "slideUp .4s ease", paddingTop: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>How you get paid</h2>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20, lineHeight: 1.5 }}>We pay based on results — not volume. The better you perform above placebo, the more you earn.</p>

          {/* When you start earning */}
          <Card style={{ marginBottom: 14, border: `1px solid ${T.accent}25` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🔓</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Earnings unlock after qualification</div>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>You start earning once you qualify as a Specialist (75%+ in a condition) or Verified Healer (75%+ overall). During the applicant phase, sessions are unpaid — you're building your track record.</p>
              </div>
            </div>
          </Card>

          {/* 10-session blocks */}
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.blueDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📊</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Calculated every 10 sessions</div>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>Every 10 sessions, we calculate your average improvement across all patients — adjusted for condition difficulty. Each condition has its own placebo baseline.</p>
              </div>
            </div>

            {/* Condition baselines */}
            <div style={{ padding: "10px 12px", borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textDim, letterSpacing: 1, marginBottom: 6 }}>PLACEBO BASELINES BY CONDITION</div>
              {[
                { label: "Migraine", baseline: "35%", icon: "🧠" },
                { label: "Arthritis", baseline: "40%", icon: "🦴" },
                { label: "Chronic back pain", baseline: "38%", icon: "🔧" },
                { label: "Fibromyalgia", baseline: "25%", icon: "💢" },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{c.icon}</span>
                    <span style={{ fontSize: 12 }}>{c.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>{c.baseline} avg change</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>Your performance is measured as how far above the placebo baseline you score, weighted across the conditions you treated in that block.</p>
          </Card>

          {/* Pay tiers */}
          <Card style={{ marginBottom: 14, background: `linear-gradient(135deg, ${T.greenDim}, ${T.accentDim})`, border: `1px solid ${T.green}20` }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Pay scale per 10-session block</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { above: "Below placebo", pay: "$0", color: T.danger, desc: "Rest recommended" },
                { above: "50% avg improvement", pay: "$300", color: T.warm, desc: "Above placebo" },
                { above: "60% avg improvement", pay: "$450", color: T.accent, desc: "Strong performance" },
                { above: "70% avg improvement", pay: "$600", color: T.blue, desc: "Excellent" },
                { above: "90%+ avg improvement", pay: "$900", color: T.green, desc: "Elite healer" },
              ].map((tier, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10, background: tier.color + "10", border: `1px solid ${tier.color}20` }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: tier.color }}>{tier.above}</span>
                    <span style={{ fontSize: 10, color: T.textMuted, marginLeft: 6 }}>{tier.desc}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: tier.color }}>{tier.pay}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Below placebo warning */}
          <Card style={{ marginBottom: 16, background: T.warmDim, border: `1px solid ${T.warm}25` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.warm, marginBottom: 2 }}>Below placebo?</div>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>If a 10-session block scores below placebo, you won't be paid for that block and we'll recommend taking a rest. This isn't a penalty — it's a signal to recharge. Your qualification status isn't affected by a single block.</p>
              </div>
            </div>
          </Card>

          <div style={{ padding: "10px 14px", borderRadius: 12, background: T.blueDim, border: `1px solid ${T.blue}20`, marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: T.blue, lineHeight: 1.5 }}>💡 Top healers on the platform earn $2,000–$4,000/month. Your earnings grow as you qualify for more conditions and maintain high performance.</p>
          </div>

          <Btn onClick={() => setStep(5)} full>Continue →</Btn>
        </div>
      </ScreenWrap>
    </>
  );

  // ── STEP 5: Your First Session (Simulated) ──
  if (step === 5) {
    return (
      <>
        <Header left={<BackBtn onClick={() => { setStep(4); setSimPhase(0); }} />} center={<span style={{ fontSize: 13, color: T.textMuted }}>Preview</span>} right={<span style={{ fontSize: 11, color: T.textDim }}>6/{totalSteps}</span>} />
        <ScreenWrap>
          <ProgressDots />
          <div style={{ animation: "slideUp .4s ease", paddingTop: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Your first session will look like this</h2>
            <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>Here's a quick preview of the healer session room.</p>

            {/* Simulated session room */}
            <Card style={{ border: `1px solid ${T.accent}25`, overflow: "hidden", padding: 0, marginBottom: 16 }}>
              {/* Header bar */}
              <div style={{ padding: "10px 14px", background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600, letterSpacing: .5 }}>HEALER VIEW · PREVIEW</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.accent }}>4:32</span>
              </div>

              {/* Body map + info */}
              <div style={{ display: "flex", gap: 8, padding: "8px 14px", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ flex: 1 }}>
                  <BodyMap side="front" pins={[{ id: 1, x: 52, y: 25, side: "front", severity: 7 }]} small />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.textDim, letterSpacing: .5, marginBottom: 4 }}>CASE INFO</div>
                  <div style={{ fontSize: 11, color: T.text, lineHeight: 1.7 }}>
                    Condition: Migraine<br />
                    Severity: <span style={{ color: T.danger, fontWeight: 700 }}>7/10</span><br />
                    Duration: Months
                  </div>
                </div>
              </div>

              {/* Simulated chat messages */}
              <div style={{ padding: "10px 14px", minHeight: 120 }}>
                {simPhase >= 0 && <div style={{ animation: "slideUp .3s ease", marginBottom: 8 }}><ChatBubble text="Case is connected. You can see their symptom map. Begin when ready." isAI={true} /></div>}
                {simPhase >= 1 && <div style={{ animation: "slideUp .3s ease", marginBottom: 8 }}><ChatBubble text="Case reports: chronic migraine, severity 7/10." isAI={true} /></div>}
                {simPhase >= 2 && <div style={{ animation: "slideUp .3s ease", marginBottom: 8, padding: "6px 10px", borderRadius: 10, background: T.accentDim, border: `1px solid ${T.accent}20`, fontSize: 11, color: T.accent, textAlign: "center" }}>💫 You would focus your healing intention here…</div>}
                {simPhase >= 3 && <div style={{ animation: "slideUp .3s ease", marginBottom: 8 }}><ChatBubble text="Case says: I think something is shifting… the pain is less sharp." isAI={true} /></div>}
                {simPhase >= 4 && <div style={{ animation: "slideUp .3s ease", marginBottom: 8 }}><ChatBubble text="Case update: severity moved from 7 to 4. Body map updated." isAI={true} /></div>}
                {simPhase < 5 && <TypingDots />}
              </div>

              {simPhase >= 5 && (
                <div style={{ padding: "10px 14px", background: T.greenDim, borderTop: `1px solid ${T.green}25`, textAlign: "center", animation: "slideUp .3s ease" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.green }}>✨ Session complete — severity 7 → 4 (−3 points)</p>
                </div>
              )}
            </Card>

            <Card style={{ background: T.surface, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>That's it. You see the patient's symptoms, you focus your healing, and the AI reports their real-time feedback. No calls, no video — just you and your intention.</p>
            </Card>

            <Btn onClick={() => setStep(6)} full>{simPhase >= 5 ? "I'm ready — final step →" : "Skip preview →"}</Btn>
          </div>
        </ScreenWrap>
      </>
    );
  }

  // ── STEP 5: Agreements ──
  // ── STEP 6: Agreements ──
  if (step === 6) return (
    <>
      <Header left={<BackBtn onClick={() => { setStep(5); setSimPhase(0); }} />} center={<span style={{ fontSize: 13, color: T.textMuted }}>Agreements</span>} right={<span style={{ fontSize: 11, color: T.textDim }}>7/{totalSteps}</span>} />
      <ScreenWrap>
        <ProgressDots />
        <div style={{ animation: "slideUp .4s ease", paddingTop: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Platform agreements</h2>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20, lineHeight: 1.5 }}>Please acknowledge each item to continue.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {[
              { key: "mediated", icon: "🤖", title: "AI-mediated sessions", desc: "All communication with patients goes through our AI. You cannot speak to or contact patients directly — ever." },
              { key: "anonymous", icon: "🔒", title: "Full anonymity", desc: "Sessions are anonymous on both sides. You won't know who the patient is, and they won't know who you are." },
              { key: "noRecording", icon: "🚫", title: "No recording", desc: "You may not record, screenshot, or share any session data outside the platform." },
              { key: "tracked", icon: "📈", title: "Performance tracking", desc: "Your session outcomes are tracked and contribute to your qualification. This data is shared with UC Irvine researchers (anonymised)." },
            ].map(item => (
              <div key={item.key} onClick={() => setAgreements(a => ({ ...a, [item.key]: !a[item.key] }))} style={{
                padding: "14px", borderRadius: 14, cursor: "pointer",
                background: agreements[item.key] ? T.accentDim : T.card,
                border: `1.5px solid ${agreements[item.key] ? T.accent + "50" : T.border}`,
                transition: "all .15s",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1, border: `2px solid ${agreements[item.key] ? T.accent : T.border}`, background: agreements[item.key] ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: T.bg, transition: "all .15s" }}>{agreements[item.key] ? "✓" : ""}</div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 14 }}>{item.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: agreements[item.key] ? T.accent : T.text }}>{item.title}</span>
                    </div>
                    <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Btn onClick={onComplete} full disabled={!allAgreed} style={allAgreed ? { background: `linear-gradient(135deg, ${T.accent}, ${T.purple})` } : {}}>
            {allAgreed ? "I agree — let's start healing ✦" : "Please acknowledge all items"}
          </Btn>
        </div>
      </ScreenWrap>
    </>
  );

  return null;
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 13: Healer Home — Refined Dashboard
   ═══════════════════════════════════════════════════════════════ */
const HealerHomeScreen = ({ onGoOnline, onSpecializations }) => {
  const specialists = CONDITIONS_DATA.filter(c => c.beatPlacebo && c.pct >= 75);
  const developing = CONDITIONS_DATA.filter(c => !c.beatPlacebo || c.pct < 75);
  const bestDeveloping = developing.sort((a, b) => b.pct - a.pct)[0];

  // Stage calculation
  const stage = OVERALL_STATS.pct >= OVERALL_STATS.threshold ? "verified" : specialists.length > 0 ? "specialist" : "applicant";
  const stageColor = { applicant: T.warm, specialist: T.accent, verified: T.green };
  const stageLabel = { applicant: "Applicant", specialist: "Specialist", verified: "Verified Healer" };
  const stageIcon = { applicant: "🔬", specialist: "🎯", verified: "✅" };

  // Next action logic
  const sessionsToQualify = Math.max(0, 20 - OVERALL_STATS.sessions);
  const nextAction = stage === "applicant"
    ? sessionsToQualify > 0
      ? { text: `${sessionsToQualify} more sessions to qualify`, sub: `${OVERALL_STATS.sessions}/20 completed · ${OVERALL_STATS.pct}% success rate` }
      : { text: "Hit 75% to qualify", sub: `Currently at ${OVERALL_STATS.pct}% · need ${OVERALL_STATS.threshold}%` }
    : stage === "specialist" && bestDeveloping
      ? { text: `Grow your range — try ${bestDeveloping.label}`, sub: `${bestDeveloping.pct}% success · ${Math.max(0, 8 - bestDeveloping.sessions)} more sessions to specialist` }
      : { text: "You're fully qualified", sub: "All session types available to you" };

  // Recent session data (mock)
  const recentSessions = [
    { condition: "Arthritis", icon: "🦴", before: 7, after: 3, effect: "Arthritis rate → 92%", time: "2 hrs ago" },
    { condition: "Migraine", icon: "🧠", before: 8, after: 5, effect: "Migraine rate → 84%", time: "Yesterday" },
    { condition: "Fibromyalgia", icon: "💢", before: 6, after: 5, effect: "No significant change", time: "Yesterday" },
  ];

  return (
    <ScreenWrap>
      <div style={{ animation: "slideUp .4s ease" }}>

        {/* Status header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Welcome back</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>{stageIcon[stage]}</span>
              <Badge color={stageColor[stage]}>{stageLabel[stage]}</Badge>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.textDim }}>Queue</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>3 waiting</div>
          </div>
        </div>

        {/* Go Online — primary CTA */}
        <Card style={{ marginBottom: 14, border: `2px solid ${T.green}40`, background: T.greenDim, cursor: "pointer", padding: "16px 18px" }} onClick={onGoOnline}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.green + "25", border: `2px solid ${T.green}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, animation: "breathe 2s ease-in-out infinite" }}>🟢</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.green }}>Go online</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>First case in ~{systemWindow()} min · patients are waiting</div>
            </div>
            <span style={{ color: T.green, fontSize: 20 }}>→</span>
          </div>
        </Card>

        {/* What's next — contextual nudge */}
        <Card style={{ marginBottom: 14, background: `linear-gradient(135deg, ${stageColor[stage]}08, ${T.purpleDim})`, border: `1px solid ${stageColor[stage]}20` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: stageColor[stage] + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎯</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{nextAction.text}</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>{nextAction.sub}</div>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <ProgressBar value={stage === "applicant" ? (OVERALL_STATS.sessions / 20) * 100 : OVERALL_STATS.pct} color={stageColor[stage]} />
          </div>
        </Card>

        {/* Journey stage tracker */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, padding: "0 4px" }}>
          {[
            { id: "applicant", label: "Applicant", icon: "🔬" },
            { id: "specialist", label: "Specialist", icon: "🎯" },
            { id: "verified", label: "Verified", icon: "✅" },
          ].map((s, i) => {
            const isActive = s.id === stage;
            const isPast = (stage === "specialist" && s.id === "applicant") || (stage === "verified" && s.id !== "verified");
            return (
              <div key={s.id} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 4, borderRadius: 2, background: isPast || isActive ? stageColor[stage] : T.border, marginBottom: 6, transition: "all .3s" }} />
                <div style={{ fontSize: 14, marginBottom: 2, opacity: isActive ? 1 : isPast ? 0.6 : 0.3 }}>{s.icon}</div>
                <div style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? stageColor[stage] : T.textMuted }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Recent sessions feed */}
        <Label>RECENT SESSIONS</Label>
        {recentSessions.map((s, i) => {
          const drop = s.before - s.after;
          const isGood = drop >= 2;
          return (
            <Card key={i} style={{ marginBottom: 8, padding: "12px 14px", animation: `slideUp ${.3 + i * .06}s ease` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s.condition}</span>
                    <Badge color={isGood ? T.green : T.textMuted}>{drop > 0 ? `−${drop}` : "—"}</Badge>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: T.textMuted }}>{s.before}/10 → {s.after}/10 · {s.time}</span>
                  </div>
                  <div style={{ fontSize: 11, color: isGood ? T.green : T.textDim, marginTop: 2, fontWeight: isGood ? 500 : 400 }}>{s.effect}</div>
                </div>
              </div>
            </Card>
          );
        })}

        <Divider />

        {/* Specializations snapshot */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <Label>SPECIALIZATIONS</Label>
          <button onClick={onSpecializations} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View all →</button>
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 8, paddingBottom: 4 }}>
          {CONDITIONS_DATA.map(c => {
            const isSpec = c.beatPlacebo && c.pct >= 75;
            const color = isSpec ? T.green : c.pct >= 45 ? T.warm : T.textDim;
            return (
              <div key={c.id} onClick={onSpecializations} style={{ minWidth: 100, padding: "10px 12px", borderRadius: 14, background: isSpec ? T.greenDim : T.card, border: `1px solid ${isSpec ? T.green + "30" : T.border}`, cursor: "pointer", textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color }}>{c.pct}%</div>
                <div style={{ fontSize: 9, color: T.textMuted, marginTop: 1 }}>{c.sessions} sessions</div>
              </div>
            );
          })}
        </div>

        <Divider />

        {/* Impact + Earnings combined */}
        <Label>YOUR IMPACT</Label>
        <Card style={{ marginBottom: 12, background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`, border: `1px solid ${T.accent}20`, padding: "18px 16px" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: T.accent }}>38.4</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>severity points lifted</div>
            </div>
            <div style={{ width: 1, background: T.border }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: T.purple }}>$462</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>earned this week</div>
            </div>
            <div style={{ width: 1, background: T.border }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: T.green }}>{OVERALL_STATS.sessions}</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>sessions total</div>
            </div>
          </div>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <p style={{ fontSize: 12, color: T.textMuted }}>That's real pain, lifted from real people. 💜</p>
          </div>
        </Card>

        {/* Platform performance — 4-way comparison */}
        <Label>PLATFORM PERFORMANCE</Label>
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>How you compare</span>
            <Badge color={OVERALL_STATS.pct >= 75 ? T.green : T.warm}>You: {OVERALL_STATS.pct}%</Badge>
          </div>
          <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5, marginBottom: 12 }}>Your success rate vs placebo, the platform average, and the best healer — by condition.</p>

          {[
            { label: "Arthritis", icon: "🦴", placebo: 40, appAvg: 74, best: 97, yourId: "arthritis" },
            { label: "Migraine", icon: "🧠", placebo: 35, appAvg: 79, best: 95, yourId: "migraine" },
            { label: "Chronic back pain", icon: "🔧", placebo: 38, appAvg: 72, best: 94, yourId: "chronic_back" },
            { label: "Fibromyalgia", icon: "💢", placebo: 25, appAvg: 52, best: 78, yourId: "fibromyalgia" },
            { label: "Stress & anxiety", icon: "🌀", placebo: 30, appAvg: 81, best: 96, yourId: "anxiety" },
            { label: "Neuropathy", icon: "⚡", placebo: 22, appAvg: 46, best: 72, yourId: "neuropathy" },
          ].map((c, i) => {
            const yourData = CONDITIONS_DATA.find(cd => cd.id === c.yourId);
            const yourPct = yourData?.sessions > 0 ? yourData.pct : null;
            const bars = [
              { value: c.placebo, color: T.danger + "50", label: "Placebo" },
              { value: c.appAvg, color: T.blue + "60", label: "App avg" },
              ...(yourPct !== null ? [{ value: yourPct, color: yourPct >= c.appAvg ? T.green : T.accent, label: "You" }] : []),
              { value: c.best, color: T.purple + "40", label: "Best" },
            ];
            return (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < 5 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>{c.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</span>
                </div>
                {/* Multi-bar comparison */}
                <div style={{ position: "relative", height: 22, background: T.surface, borderRadius: 6, overflow: "hidden", border: `1px solid ${T.border}` }}>
                  {/* Placebo zone */}
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${c.placebo}%`, background: T.danger + "12", borderRight: `1.5px dashed ${T.danger}40` }} />
                  {/* Bars */}
                  {bars.map((b, j) => (
                    <div key={j} style={{ position: "absolute", left: `${b.value}%`, top: 2, bottom: 2, width: 3, borderRadius: 2, background: b.color, transform: "translateX(-50%)" }} />
                  ))}
                  {/* Your marker — bigger */}
                  {yourPct !== null && (
                    <div style={{ position: "absolute", left: `${yourPct}%`, top: 0, bottom: 0, width: 5, borderRadius: 3, background: yourPct >= c.appAvg ? T.green : T.accent, transform: "translateX(-50%)", boxShadow: `0 0 4px ${yourPct >= c.appAvg ? T.green : T.accent}50` }} />
                  )}
                </div>
                {/* Labels row */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingRight: 4 }}>
                  <span style={{ fontSize: 9, color: T.danger }}>Placebo {c.placebo}%</span>
                  <span style={{ fontSize: 9, color: T.blue }}>Avg {c.appAvg}%</span>
                  {yourPct !== null && <span style={{ fontSize: 9, fontWeight: 700, color: yourPct >= c.appAvg ? T.green : T.accent }}>You {yourPct}%</span>}
                  <span style={{ fontSize: 9, color: T.purple }}>Best {c.best}%</span>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div style={{ padding: "10px 0 0", marginTop: 8, borderTop: `1px solid ${T.border}`, display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              { color: T.danger + "50", label: "Placebo baseline", dashed: true },
              { color: T.blue + "60", label: "App average" },
              { color: T.green, label: "Your rate" },
              { color: T.purple + "40", label: "Best healer" },
            ].map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 10, height: 4, borderRadius: 2, background: l.color, border: l.dashed ? `1px dashed ${T.danger}40` : "none" }} />
                <span style={{ fontSize: 9, color: T.textDim }}>{l.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Btn onClick={onSpecializations} variant="secondary" full small style={{ marginBottom: 14 }}>View all specializations & skill-build →</Btn>

        {/* Learning prompt — contextual */}
        <Card style={{ marginBottom: 12, border: `1px solid ${T.blue}20`, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.blueDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📚</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {OVERALL_STATS.pct < 60 ? "Improve your technique" : "Explore advanced methods"}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted }}>
                {OVERALL_STATS.pct < 60
                  ? "Revisit the Human Medicine fundamentals — small shifts in focus can dramatically improve your results."
                  : "Learn advanced techniques from top-performing healers on the platform."}
              </div>
            </div>
            <span style={{ color: T.blue, fontSize: 14 }}>→</span>
          </div>
        </Card>

        <div style={{ height: 16 }} />
      </div>
    </ScreenWrap>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 13b: Specialization Engine
   ═══════════════════════════════════════════════════════════════ */
const SpecializationScreen = ({ onBack, onStartSkillBuild }) => {
  const [expanded, setExpanded] = useState(null);
  const colorFor = (pct) => pct >= 80 ? T.green : pct >= 65 ? T.accent : pct >= 45 ? T.warm : T.danger;
  const specialists = CONDITIONS_DATA.filter(c => c.beatPlacebo && c.pct >= 75);
  const developing = CONDITIONS_DATA.filter(c => !c.beatPlacebo || c.pct < 75);
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, fontWeight: 600, color: T.textMuted }}>Your specializations</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .35s ease" }}>
          <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`, border: `1px solid ${T.accent}25` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 2 }}>Overall qualification</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{OVERALL_STATS.beatPlacebo}/{OVERALL_STATS.sessions}</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>sessions beat placebo threshold</div>
              </div>
              <Badge color={T.warm} bg={T.warmDim}>Below 75% threshold</Badge>
            </div>
            <ProgressBar value={OVERALL_STATS.pct} color={T.accent} height={8} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 11, color: T.textMuted }}>{OVERALL_STATS.pct}% success rate</span>
              <span style={{ fontSize: 11, color: T.textMuted }}>Need {OVERALL_STATS.threshold}% to qualify broadly</span>
            </div>
            <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(155,138,251,0.12)", border: `1px solid ${T.accent}20` }}>
              <p style={{ fontSize: 12, color: T.text, lineHeight: 1.55 }}>
                You haven't qualified as a general healer yet — but you're showing <strong>strong results in specific conditions</strong>. We're routing specialist sessions your way to help you qualify condition-by-condition.
              </p>
            </div>
          </Card>

          {/* 4-way comparison — same as healer dashboard */}
          <Label>HOW YOU COMPARE</Label>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>By condition</span>
              <Badge color={OVERALL_STATS.pct >= 75 ? T.green : T.warm}>You: {OVERALL_STATS.pct}%</Badge>
            </div>
            <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5, marginBottom: 10 }}>Your success rate vs placebo, the platform average, and the best healer.</p>

            {[
              { label: "Arthritis", icon: "🦴", placebo: 40, appAvg: 74, best: 97, yourId: "arthritis" },
              { label: "Migraine", icon: "🧠", placebo: 35, appAvg: 79, best: 95, yourId: "migraine" },
              { label: "Chronic back pain", icon: "🔧", placebo: 38, appAvg: 72, best: 94, yourId: "chronic_back" },
              { label: "Fibromyalgia", icon: "💢", placebo: 25, appAvg: 52, best: 78, yourId: "fibromyalgia" },
              { label: "Stress & anxiety", icon: "🌀", placebo: 30, appAvg: 81, best: 96, yourId: "anxiety" },
              { label: "Neuropathy", icon: "⚡", placebo: 22, appAvg: 46, best: 72, yourId: "neuropathy" },
            ].map((c, i) => {
              const yourData = CONDITIONS_DATA.find(cd => cd.id === c.yourId);
              const yourPct = yourData?.sessions > 0 ? yourData.pct : null;
              return (
                <div key={i} style={{ padding: "10px 0", borderBottom: i < 5 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                    <span style={{ fontSize: 13 }}>{c.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</span>
                  </div>
                  <div style={{ position: "relative", height: 22, background: T.surface, borderRadius: 6, overflow: "visible", border: `1px solid ${T.border}` }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${c.placebo}%`, background: T.danger + "12", borderRight: `1.5px dashed ${T.danger}40` }} />
                    <div style={{ position: "absolute", left: `${c.appAvg}%`, top: 2, bottom: 2, width: 3, borderRadius: 2, background: T.blue + "60", transform: "translateX(-50%)" }} />
                    {yourPct !== null && <div style={{ position: "absolute", left: `${yourPct}%`, top: 0, bottom: 0, width: 5, borderRadius: 3, background: yourPct >= c.appAvg ? T.green : T.accent, transform: "translateX(-50%)", boxShadow: `0 0 4px ${yourPct >= c.appAvg ? T.green : T.accent}50` }} />}
                    <div style={{ position: "absolute", left: `${c.best}%`, top: 2, bottom: 2, width: 3, borderRadius: 2, background: T.purple + "40", transform: "translateX(-50%)" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: T.danger }}>Placebo {c.placebo}%</span>
                    <span style={{ fontSize: 9, color: T.blue }}>Avg {c.appAvg}%</span>
                    {yourPct !== null && <span style={{ fontSize: 9, fontWeight: 700, color: yourPct >= c.appAvg ? T.green : T.accent }}>You {yourPct}%</span>}
                    <span style={{ fontSize: 9, color: T.purple }}>Best {c.best}%</span>
                  </div>
                </div>
              );
            })}

            <div style={{ padding: "10px 0 0", marginTop: 8, borderTop: `1px solid ${T.border}`, display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                { color: T.danger + "50", label: "Placebo baseline" },
                { color: T.blue + "60", label: "App average" },
                { color: T.green, label: "Your rate" },
                { color: T.purple + "40", label: "Best healer" },
              ].map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 10, height: 4, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 9, color: T.textDim }}>{l.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {specialists.length > 0 && <>
            <Label>CONFIRMED SPECIALIZATIONS ✓</Label>
            {specialists.map(c => (
              <Card key={c.id} style={{ marginBottom: 10, border: `1px solid ${T.green}30`, background: T.greenDim }} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: T.green + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{c.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}><span style={{ fontSize: 14, fontWeight: 700 }}>{c.label}</span><Badge color={T.green} bg={T.greenDim}>Specialist ✓</Badge></div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>{c.sessions} sessions · avg {c.avgDrop.toFixed(1)} pt drop · top {100 - c.pct}%</div>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: T.green }}>{c.pct}%</span>
                </div>
                {expanded === c.id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.green}25`, animation: "fadeIn .2s ease" }}>
                    {/* 4-way comparison bar */}
                    {(() => {
                      const verifiedData = RESULTS_DATA.verified.conditions.find(v => v.label.toLowerCase().includes(c.label.toLowerCase().split(" ")[0]));
                      const placebo = verifiedData?.placebo || 35;
                      const appAvg = verifiedData?.pct || 70;
                      const best = { "Arthritis": 97, "Migraine": 95, "Chronic back pain": 94, "Fibromyalgia": 78, "Neuropathy": 72, "Anxiety / stress": 96 }[c.label] || 90;
                      return (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ position: "relative", height: 24, background: T.surface, borderRadius: 6, overflow: "visible", border: `1px solid ${T.border}`, marginBottom: 6 }}>
                            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${placebo}%`, background: T.danger + "10", borderRight: `2px dashed ${T.danger}40` }} />
                            <div style={{ position: "absolute", left: `${appAvg}%`, top: 2, bottom: 2, width: 3, borderRadius: 2, background: T.blue + "60", transform: "translateX(-50%)" }} />
                            <div style={{ position: "absolute", left: `${c.pct}%`, top: 0, bottom: 0, width: 5, borderRadius: 3, background: T.green, transform: "translateX(-50%)", boxShadow: `0 0 4px ${T.green}50` }} />
                            <div style={{ position: "absolute", left: `${best}%`, top: 2, bottom: 2, width: 3, borderRadius: 2, background: T.purple + "40", transform: "translateX(-50%)" }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }}>
                            <span style={{ color: T.danger }}>Placebo {placebo}%</span>
                            <span style={{ color: T.blue }}>Avg {appAvg}%</span>
                            <span style={{ color: T.green, fontWeight: 700 }}>You {c.pct}%</span>
                            <span style={{ color: T.purple }}>Best {best}%</span>
                          </div>
                        </div>
                      );
                    })()}
                    <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>You're a <strong>paid specialist</strong> for {c.label}. {c.pct > 85 ? "You're among the top healers on the platform for this condition." : "Patients with this condition are matched to you first."}</p>
                  </div>
                )}
              </Card>
            ))}
          </>}

          <Divider />
          <Label>CONDITIONS TO DEVELOP</Label>
          <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55, marginBottom: 12 }}>Choose one to enter skill-build mode — we'll queue you only these cases so you can practise specifically.</p>
          {developing.map(c => (
            <Card key={c.id} style={{ marginBottom: 10 }} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.bg, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{c.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{c.label}</span><Badge color={T.warm} bg={T.warmDim}>Developing</Badge></div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{c.sessions} sessions · avg {c.avgDrop.toFixed(1)} pt drop</div>
                </div>
                <div style={{ textAlign: "right" }}><span style={{ fontSize: 18, fontWeight: 700, color: colorFor(c.pct) }}>{c.pct}%</span><div style={{ fontSize: 10, color: T.textMuted }}>vs 75%</div></div>
              </div>
              {expanded === c.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, animation: "fadeIn .2s ease" }}>
                  {/* 4-way comparison bar */}
                  {(() => {
                    const verifiedData = RESULTS_DATA.verified.conditions.find(v => v.label.toLowerCase().includes(c.label.toLowerCase().split(" ")[0]));
                    const placebo = verifiedData?.placebo || 30;
                    const appAvg = verifiedData?.pct || 65;
                    const best = { "Arthritis": 97, "Migraine": 95, "Chronic back pain": 94, "Fibromyalgia": 78, "Neuropathy": 72, "Anxiety / stress": 96 }[c.label] || 85;
                    return (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ position: "relative", height: 24, background: T.surface, borderRadius: 6, overflow: "visible", border: `1px solid ${T.border}`, marginBottom: 6 }}>
                          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${placebo}%`, background: T.danger + "10", borderRight: `2px dashed ${T.danger}40` }} />
                          <div style={{ position: "absolute", left: `${appAvg}%`, top: 2, bottom: 2, width: 3, borderRadius: 2, background: T.blue + "60", transform: "translateX(-50%)" }} />
                          <div style={{ position: "absolute", left: `${c.pct}%`, top: 0, bottom: 0, width: 5, borderRadius: 3, background: c.pct >= appAvg ? T.green : c.pct > placebo ? T.accent : T.warm, transform: "translateX(-50%)", boxShadow: `0 0 4px ${c.pct > placebo ? T.accent : T.warm}50` }} />
                          <div style={{ position: "absolute", left: `${best}%`, top: 2, bottom: 2, width: 3, borderRadius: 2, background: T.purple + "40", transform: "translateX(-50%)" }} />
                          {/* 75% qualification line */}
                          <div style={{ position: "absolute", left: "75%", top: -4, bottom: -4, width: 1.5, background: T.green + "60", transform: "translateX(-50%)" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }}>
                          <span style={{ color: T.danger }}>Placebo {placebo}%</span>
                          <span style={{ color: T.blue }}>Avg {appAvg}%</span>
                          <span style={{ color: c.pct > placebo ? T.accent : T.warm, fontWeight: 700 }}>You {c.pct}%</span>
                          <span style={{ color: T.purple }}>Best {best}%</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <div style={{ width: 1.5, height: 8, background: T.green + "60" }} />
                          <span style={{ fontSize: 9, color: T.green }}>75% qualification threshold</span>
                        </div>
                      </div>
                    );
                  })()}
                  <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55, marginBottom: 12 }}>In skill-build mode, we'll queue you <em>only</em> {c.label} cases. {c.pct > 50 ? `You're ${75 - c.pct}% away from qualifying.` : "Focus on building consistency to reach the 75% threshold."}</p>
                  <Btn variant="accent" full small onClick={() => onStartSkillBuild(c)}>Start skill-build: {c.label} →</Btn>
                </div>
              )}
            </Card>
          ))}
          <div style={{ height: 24 }} />
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 13c: Skill-Build Confirm
   ═══════════════════════════════════════════════════════════════ */
const SkillBuildConfirmScreen = ({ condition, onConfirm, onBack }) => (
  <>
    <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, fontWeight: 600, color: T.textMuted }}>Skill-build mode</span>} />
    <ScreenWrap>
      <div style={{ animation: "slideUp .35s ease" }}>
        <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{condition.icon}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Skill-build: {condition.label}</h2>
          <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>While in skill-build mode, we'll only queue you <strong>{condition.label}</strong> cases. This helps you develop targeted ability faster.</p>
        </div>
        <Card style={{ marginBottom: 12, background: T.accentDim, border: `1px solid ${T.accent}25` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, marginBottom: 8 }}>What changes in skill-build mode</div>
          {[["Sessions queued", `Only ${condition.label} cases`], ["Goal", "Reach 75% success rate"], ["Current rate", `${condition.pct}% (${condition.sessions} sessions)`], ["Sessions needed", "~8–12 more at this pace"], ["Reward", "Paid specialist for this condition"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.accent}15` }}>
              <span style={{ fontSize: 12, color: T.textMuted }}>{k}</span><span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{v}</span>
            </div>
          ))}
        </Card>
        <Card style={{ marginBottom: 20, background: T.warmDim, border: `1px solid ${T.warm}25` }}>
          <p style={{ fontSize: 12, color: T.text, lineHeight: 1.55 }}><strong>Note:</strong> You can exit skill-build mode at any time from your dashboard. Your confirmed specializations (Arthritis, Migraine) remain active — you'll still receive those as a paid specialist in parallel.</p>
        </Card>
        <Btn full onClick={onConfirm}>Enter skill-build mode →</Btn>
        <div style={{ height: 8 }} />
        <Btn variant="ghost" full onClick={onBack}>Not now</Btn>
      </div>
    </ScreenWrap>
  </>
);

/* ═══════════════════════════════════════════════════════════════
   SCREEN 13d: Availability Commitment — replaces simple toggle
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   HEALER STEP 1: Availability Ping — System asks, healer responds
   ═══════════════════════════════════════════════════════════════ */
const HealerPingScreen = ({ skillBuildCondition, onYes, onNo }) => {
  const firstWindow = systemWindow();
  const [totalHours, setTotalHours] = useState(1);
  const totalMins = totalHours * 60;
  const sessionTime = 8; // ~8 min per session cycle (5 min session + matching + buffer)
  const estMin = Math.max(1, Math.floor(totalMins / (sessionTime + 2)));
  const estMax = Math.floor(totalMins / (sessionTime - 1));

  return (
    <>
      <Header left={<BackBtn onClick={onNo} />} center={<span style={{ fontSize: 13, color: T.textMuted }}>Go online</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .3s ease" }}>

          {/* First session ETA — hero */}
          <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: T.greenDim, border: `2px solid ${T.green}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 26 }}>⏱️</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Approx. time to first session</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800, letterSpacing: -2, lineHeight: 1, color: T.green }}>~{firstWindow} min</div>
            <p style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>
              Based on <strong style={{ color: T.text }}>3 patients</strong> waiting in queue
            </p>
          </div>

          {skillBuildCondition && (
            <div style={{ background: T.accentDim, borderRadius: 14, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{skillBuildCondition.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>Skill-build: {skillBuildCondition.label}</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>Only {skillBuildCondition.label} cases will be sent to you</div>
              </div>
            </div>
          )}

          <Divider />

          {/* Time selection */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>How much time do you have?</div>
            <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 14, lineHeight: 1.5 }}>Choose how long you'd like to be available. We'll keep matching you with patients until your time is up.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[{ h: 0.5, label: "30 min" }, { h: 1, label: "1 hr" }, { h: 2, label: "2 hr" }, { h: 4, label: "4 hr" }, { h: 8, label: "All day" }].map(opt => (
                <button key={opt.h} onClick={() => setTotalHours(opt.h)} style={{ padding: "10px 18px", borderRadius: 100, border: `1.5px solid ${totalHours === opt.h ? T.text : T.border}`, background: totalHours === opt.h ? T.text : "transparent", color: totalHours === opt.h ? "#fff" : T.textMuted, fontSize: 14, fontWeight: totalHours === opt.h ? 600 : 400, cursor: "pointer", transition: "all .15s", fontFamily: "inherit" }}>{opt.label}</button>
              ))}
            </div>
          </div>

          {/* Session estimate */}
          <Card style={{ background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`, border: `1px solid ${T.accent}20`, marginBottom: 16, padding: "18px 16px" }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: -1, color: T.text }}>{estMin}–{estMax}</div>
              <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>estimated sessions in {totalHours < 1 ? "30 min" : totalHours === 1 ? "1 hour" : totalHours === 8 ? "all day" : `${totalHours} hours`}</div>
            </div>
            <div style={{ height: 1, background: T.border, margin: "0 0 12px" }} />
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.accent }}>~{sessionTime} min</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>per session</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.blue }}>~{firstWindow} min</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>till first case</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.purple }}>{totalMins} min</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>total time</div>
              </div>
            </div>
          </Card>

          {/* How it works */}
          <Card style={{ background: T.surface, marginBottom: 20 }}>
            <Label>HOW IT WORKS</Label>
            {[
              { icon: "⏱️", text: `First case arrives within ~${firstWindow} min` },
              { icon: "🔁", text: "After each session, you're automatically re-queued" },
              { icon: "🛑", text: "Go offline anytime — no penalty" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: T.text }}>{item.text}</span>
              </div>
            ))}
          </Card>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => onYes(totalHours)} full style={{ flex: 2 }}>Go online — {totalHours < 1 ? "30 min" : totalHours === 1 ? "1 hr" : totalHours === 8 ? "all day" : `${totalHours} hr`}</Btn>
            <Btn onClick={onNo} variant="ghost" style={{ flex: 1 }}>Not now</Btn>
          </div>
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HEALER STEP 2: Committed — waiting for case notification
   ═══════════════════════════════════════════════════════════════ */
const HealerCommittedScreen = ({ skillBuildCondition, totalHours = 1, onMatch, onBack }) => {
  const firstWindow = systemWindow();
  const [countdown, setCountdown] = useState(firstWindow * 60);
  const [phase, setPhase] = useState("waiting"); // "waiting" | "getReady" | "incoming"
  const totalMins = totalHours * 60;
  const estSessions = Math.floor(totalMins / 8);

  useEffect(() => {
    const interval = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(interval); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate: get-ready alert fires 8s in (represents ~60s before real case)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("getReady"), 8000);
    // Then case arrives 4s after get-ready
    const t2 = setTimeout(() => { setPhase("incoming"); setTimeout(onMatch, 1500); }, 12000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onMatch]);

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const pct = (countdown / (firstWindow * 60)) * 100;
  const totalLabel = totalHours < 1 ? "30 min" : totalHours === 1 ? "1 hr" : totalHours === 8 ? "all day" : `${totalHours} hr`;

  // ── GET READY STATE ──
  if (phase === "getReady" || phase === "incoming") {
    const isIncoming = phase === "incoming";
    return <>
      <Header center={<Logo />} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 24px", textAlign: "center" }}>

        {/* Pulsing alert ring */}
        <div style={{ position: "relative", width: 100, height: 100, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: isIncoming ? T.greenDim : T.warmDim, animation: "breathe 1s ease-in-out infinite" }} />
          <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: `2px solid ${isIncoming ? T.green : T.warm}`, opacity: 0.4, animation: "orbRipple 1.2s ease-out infinite" }} />
          <span style={{ fontSize: 40, position: "relative", zIndex: 1 }}>{isIncoming ? "🟢" : "⚡"}</span>
        </div>

        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, marginBottom: 10, color: isIncoming ? T.green : T.warm }}>
          {isIncoming ? "Case arriving now" : "Get ready."}
        </div>
        <p style={{ fontSize: 15, color: T.textMuted, lineHeight: 1.65, marginBottom: 28, maxWidth: 280 }}>
          {isIncoming
            ? "You're about to receive the 5-second claim notification. Stay on this screen."
            : "You're next in the healer queue. A case is about to be sent to you — put your phone where you can see it."}
        </p>

        {/* What's coming */}
        <Card style={{ width: "100%", marginBottom: 20, background: isIncoming ? T.greenDim : T.warmDim, border: `1px solid ${isIncoming ? T.green : T.warm}25` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.textMuted }}>Condition</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{skillBuildCondition?.label || "Arthritis"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.textMuted }}>Baseline severity</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>7/10</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
            <span style={{ fontSize: 13, color: T.textMuted }}>You have</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: isIncoming ? T.green : T.warm }}>5 seconds to claim</span>
          </div>
        </Card>

        {!isIncoming && (
          <p style={{ fontSize: 12, color: T.textDim, lineHeight: 1.6 }}>
            If you miss it, the case goes to the next healer in queue.
          </p>
        )}
        {isIncoming && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, animation: `pulse 0.8s ease ${i * 0.2}s infinite` }} />)}
          </div>
        )}
      </div>
    </>;
  }

  // ── WAITING STATE ──
  return (
    <>
      <Header center={<Logo />} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 24px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: T.greenDim, border: `2px solid ${T.green}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, animation: "breathe 2s ease-in-out infinite", fontSize: 32 }}>🟢</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, letterSpacing: -1.2, marginBottom: 8 }}>You're live</div>
        <p style={{ fontSize: 14, color: T.textMuted, marginBottom: 24, lineHeight: 1.65 }}>
          Available for <strong style={{ color: T.text }}>{totalLabel}</strong> · est. <strong style={{ color: T.text }}>{estSessions} sessions</strong><br />
          First case arrives within <strong style={{ color: T.text }}>{firstWindow} min</strong>
        </p>

        <Card style={{ width: "100%", marginBottom: 16, background: "#FAFAFA" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: T.textMuted }}>First case arriving in</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: T.green }}>{mins}:{String(secs).padStart(2, "0")}</span>
          </div>
          <ProgressBar value={pct} color={T.text} height={4} />
          <p style={{ fontSize: 11, color: T.textDim, marginTop: 8, textAlign: "center" }}>You'll get a heads-up before the case notification arrives</p>
        </Card>

        <Card style={{ width: "100%", marginBottom: 20, background: "#FAFAFA" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: T.textMuted }}>Total availability</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{totalLabel}</span>
          </div>
          <ProgressBar value={100} color="#EBEBEB" height={4} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: T.textDim }}>Now</span>
            <span style={{ fontSize: 11, color: T.textDim }}>~{estSessions} sessions possible</span>
            <span style={{ fontSize: 11, color: T.textDim }}>{totalLabel}</span>
          </div>
        </Card>

        <div style={{ width: "100%", textAlign: "left", marginBottom: 24 }}>
          {[
            { n: "1", done: true, title: "Availability confirmed", sub: `${totalLabel} total · first case in ~${firstWindow} min` },
            { n: "2", done: false, title: "Get-ready alert", sub: "~60s warning before case notification" },
            { n: "3", done: false, title: "5-second claim", sub: "First healer to respond gets the case" },
          ].map(s => (
            <div key={s.n} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: s.done ? T.text : "#F5F5F5", border: s.done ? "none" : `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: s.done ? "#fff" : T.textMuted, flexShrink: 0, marginTop: 1 }}>{s.done ? "✓" : s.n}</div>
              <div><div style={{ fontSize: 14, fontWeight: 500 }}>{s.title}</div><div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{s.sub}</div></div>
            </div>
          ))}
        </div>
        <Btn variant="danger" small onClick={onBack}>Go offline</Btn>
      </div>
    </>
  );
};


/* ═══════════════════════════════════════════════════════════════
   SCREEN 14: Smart Match Notification — replaces MatchScreen
   ═══════════════════════════════════════════════════════════════ */
const SmartMatchScreen = ({ skillBuildCondition, onClaim, onDecline }) => {
  const [countdown, setCountdown] = useState(5);
  const [claimed, setClaimed] = useState(false);
  const matchedCase = skillBuildCondition || CONDITIONS_DATA.find(c => c.id === "arthritis");

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); onDecline(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = () => { setClaimed(true); setTimeout(onClaim, 800); };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg }}>
      <Header center={<span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Case incoming</span>} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div style={{ width: "100%", maxWidth: 360, animation: claimed ? "fadeIn .2s" : "slideUp .4s ease" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", border: `2px solid ${T.accent}`, animation: "ripple 1.5s ease-out infinite" }} />
            <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", border: `2px solid ${T.accent}`, animation: "ripple 1.5s ease-out .5s infinite" }} />
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>{matchedCase?.icon || "🙌"}</div>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 6 }}>Match found!</h2>
          <p style={{ fontSize: 14, color: T.textMuted, textAlign: "center", marginBottom: 20 }}>A case matching your specialization is waiting.</p>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: T.textMuted }}>Condition</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{matchedCase?.label}</span>
                <Badge color={skillBuildCondition ? T.accent : T.green}>{skillBuildCondition ? "Skill-build match" : "Specialist match"}</Badge>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, color: T.textMuted }}>Baseline severity</span><span style={{ fontSize: 13, fontWeight: 600, color: T.warm }}>7/10</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, color: T.textMuted }}>Duration</span><span style={{ fontSize: 13 }}>6+ months</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: T.textMuted }}>Session type</span><span style={{ fontSize: 13 }}>Remote · 5 min</span></div>
          </Card>
          <Card style={{ marginBottom: 20, background: T.accentDim, border: `1px solid ${T.accent}25` }}>
            <div style={{ fontSize: 12, color: T.accent, fontWeight: 700, marginBottom: 4 }}>Why you were matched</div>
            <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>
              {skillBuildCondition
                ? `You're in skill-build mode for ${matchedCase?.label}. This case was reserved for you.`
                : `Your ${matchedCase?.label} success rate (${matchedCase?.pct}%) puts you in the top ${100 - (matchedCase?.pct || 80)}% of healers for this condition.`}
            </p>
          </Card>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: T.textMuted }}>Claim within</span><span style={{ fontSize: 14, fontWeight: 700, color: countdown <= 2 ? T.danger : T.accent }}>{countdown}s</span></div>
            <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(countdown / 5) * 100}%`, background: countdown <= 2 ? T.danger : T.accent, borderRadius: 2, transition: "width 1s linear, background .3s" }} />
            </div>
          </div>
          <Btn full onClick={handleClaim} disabled={claimed}>{claimed ? "Claimed! Starting session…" : "Claim this session →"}</Btn>
          <div style={{ height: 8 }} />
          <Btn variant="ghost" full small onClick={onDecline}>Pass — let another healer take it</Btn>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 15: Healer Session Room — Voice/Text + AI Mediated
   ═══════════════════════════════════════════════════════════════ */
const HealerSessionScreen = ({ onEnd }) => {
  const [timer, setTimer] = useState(300);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [caseSev, setCaseSev] = useState(7);
  const [checkIns, setCheckIns] = useState([{ time: 300, sev: 7 }]);
  const [phase, setPhase] = useState("connect");
  const [prevSev, setPrevSev] = useState(7);
  const [technique, setTechnique] = useState(null);
  const [mode, setMode] = useState("text"); // text | voice
  const [voiceActive, setVoiceActive] = useState(false);
  const ref = useRef(null);

  // Demo pins on both sides
  const casePins = [
    { id: 1, x: 52, y: 55, side: "front", severity: caseSev },
    { id: 2, x: 48, y: 40, side: "back", severity: Math.max(0, caseSev - 1) },
  ];
  const elapsed = 300 - timer;
  const sevColor = caseSev <= 2 ? T.green : caseSev <= 4 ? T.accent : caseSev <= 6 ? T.warm : T.danger;
  const mins = Math.floor(timer / 60);
  const secs = timer % 60;

  // Timer
  useEffect(() => {
    const i = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(i); onEnd(); return 0; } return t - 1; }), 1000);
    return () => clearInterval(i);
  }, [onEnd]);

  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // Phase progression with AI coaching
  useEffect(() => {
    const addAI = (text) => setMsgs(m => [...m, { text, isAI: true }]);

    if (elapsed === 0) {
      addAI("Case is connected. You can see their symptom map below.");
      setTimeout(() => addAI("Case reports: chronic pain, lower back and upper back. Severity 7/10. Duration: months."), 1500);
      setTimeout(() => { addAI("Take a moment to centre yourself. When you're ready, select your approach and begin."); setPhase("focus"); }, 3500);
    }
    if (elapsed === 60 && phase === "focus") {
      addAI("Checking in with the patient…");
      setPhase("check1");
      setTimeout(() => {
        const newSev = Math.max(1, caseSev - Math.floor(Math.random() * 3 + 1));
        const drop = caseSev - newSev;
        setPrevSev(caseSev);
        setCaseSev(newSev);
        setCheckIns(c => [...c, { time: timer, sev: newSev }]);
        addAI(drop > 0
          ? `Patient: severity moved from ${caseSev} to ${newSev}. "${drop >= 3 ? "Something is definitely shifting" : "I think it's changing a little"}."`
          : `Patient: severity unchanged at ${newSev}. "I'm not sure I feel anything yet."`
        );
        if (drop > 0) { setTimer(300); addAI("⏱️ Improvement detected — clock reset to 5:00."); }
        setPhase("adjust");
      }, 3000);
    }
    if (elapsed === 180 && phase === "adjust") {
      addAI("Checking with the patient again…");
      setPhase("check2");
      setTimeout(() => {
        const newSev = Math.max(0, caseSev - Math.floor(Math.random() * 2 + 1));
        const totalDrop = 7 - newSev;
        const drop = caseSev - newSev;
        setPrevSev(caseSev);
        setCaseSev(newSev);
        setCheckIns(c => [...c, { time: timer, sev: newSev }]);
        addAI(`Patient: severity now ${newSev}/10. ${totalDrop >= 4 ? '"Oh my God, this is amazing."' : totalDrop >= 2 ? '"It\'s definitely better than when we started."' : '"A small shift maybe."'}`);
        if (drop > 0) { setTimer(300); addAI("⏱️ Improvement detected — clock reset to 5:00."); }
        setPhase("wrapup");
      }, 3000);
    }
    if (elapsed === 240 && phase === "wrapup") {
      addAI("1 minute remaining. Session wraps up automatically.");
    }
  }, [elapsed]);

  // AI mediation — filters healer messages before relaying to patient
  const sendMessage = (msg) => {
    if (!msg.trim()) return;
    setMsgs(m => [...m, { text: msg, isAI: false }]);
    setText(""); setVoiceActive(false);

    setTimeout(async () => {
      await wait(800);

      // AI decides if the message is appropriate to relay
      const lower = msg.toLowerCase();
      const isQuestion = /\?|ask|how|what|where|can you|do you|are you/.test(lower);
      const isInappropriate = /name|who are you|contact|phone|email|meet|address|personal/.test(lower);
      const isInstruction = /breathe|relax|focus|close your eyes|let go|open|notice/.test(lower);

      if (isInappropriate) {
        setMsgs(m => [...m, { text: "⚠️ Mediator: That message wasn't relayed. Sessions are anonymous — questions about identity or contact info aren't permitted.", isAI: true }]);
      } else if (isQuestion) {
        await wait(1500);
        const answers = [
          "Patient says: I think I feel something shifting in that area.",
          "Patient says: There's a warmth building where the pain was.",
          "Patient says: It's subtle but something is different.",
          "Patient says: The sharpness is less. More of a dull ache now.",
          "Patient says: I'm not sure yet. Maybe a little different.",
        ];
        setMsgs(m => [...m, { text: answers[Math.floor(Math.random() * answers.length)], isAI: true }]);
      } else if (isInstruction) {
        setMsgs(m => [...m, { text: `Mediator: Relayed to patient — "${msg}"`, isAI: true }]);
        await wait(2000);
        setMsgs(m => [...m, { text: "Patient is following your guidance.", isAI: true }]);
      } else {
        setMsgs(m => [...m, { text: `Mediator: "${msg}" — relayed to patient.`, isAI: true }]);
      }
    }, 400);
  };

  const quickMessages = [
    "Ask them to breathe deeply",
    "How is the pain area feeling?",
    "Ask them to focus on the spot",
    "Any changes at all?",
  ];


  // Auto-listen loop for voice mode (must be top-level hook)
  useEffect(() => {
    if (mode !== "voice") return;
    if (voiceActive) return;
    const t = setTimeout(() => {
      setVoiceActive(true);
      const listenTime = 4000 + Math.random() * 3000;
      const t2 = setTimeout(() => {
        setVoiceActive(false);
        const samples = ["How is the pain feeling now?", "Focus on the lower back", "Ask them to take a deep breath", "Is there any change?"];
        sendMessage(samples[Math.floor(Math.random() * samples.length)]);
      }, listenTime);
      return () => clearTimeout(t2);
    }, 1500);
    return () => clearTimeout(t);
  }, [mode, voiceActive]);

  // Expanded symptom list — supports many symptoms
  const symptomList = [
    { id: 1, label: "Lower back", side: "front", severity: caseSev },
    { id: 2, label: "Upper back", side: "back", severity: Math.max(0, caseSev - 1) },
    { id: 3, label: "Right shoulder", side: "front", severity: Math.max(0, caseSev - 2) },
    { id: 4, label: "Left hip", side: "front", severity: Math.max(0, caseSev - 3) },
    { id: 5, label: "Neck", side: "back", severity: Math.max(1, caseSev - 2) },
  ];

  // Last 3 messages for voice mode transcript
  const recentMsgs = msgs.slice(-3);

  // ── VOICE MODE — full screen body maps, always listening, mini transcript ──
  if (mode === "voice") {
    return (
      <>
        <Header
          left={<button onClick={() => setMode("text")} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>⌨️ Text</button>}
          center={<div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: timer < 60 ? T.warm : T.text }}>{mins}:{String(secs).padStart(2, "0")}</span>
            <div style={{ fontSize: 9, color: T.textDim, marginTop: -1 }}>resets on improvement</div>
          </div>}
          right={<Btn variant="danger" small onClick={onEnd} style={{ padding: "5px 12px" }}>End</Btn>}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Body maps — large, side by side */}
          <div style={{ flex: "1 1 auto", display: "flex", gap: 4, padding: "4px 8px 0", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <BodyMap side="front" pins={casePins} />
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <BodyMap side="back" pins={casePins} />
            </div>
          </div>

          {/* Symptom list — scrollable horizontal for many symptoms */}
          <div style={{ padding: "6px 8px 4px", background: T.surface, borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
              {symptomList.map(s => {
                const c = s.severity <= 2 ? T.green : s.severity <= 5 ? T.warm : T.danger;
                return (
                  <div key={s.id} style={{ padding: "3px 8px", borderRadius: 8, background: c + "15", border: `1px solid ${c}25`, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: T.text, whiteSpace: "nowrap" }}>{s.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{s.severity}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini chat transcript — last 3 messages */}
          <div style={{ flex: "0 0 auto", maxHeight: 100, overflowY: "auto", padding: "4px 12px 2px", background: T.bg, borderTop: `1px solid ${T.border}` }}>
            {recentMsgs.length === 0 ? (
              <p style={{ fontSize: 11, color: T.textDim, textAlign: "center", padding: "6px 0" }}>Conversation will appear here…</p>
            ) : (
              recentMsgs.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4, animation: "fadeIn .3s ease" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: m.isAI ? T.grad : T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: m.isAI ? "#fff" : T.accent, flexShrink: 0, marginTop: 1 }}>{m.isAI ? "E" : "You"}</div>
                  <p style={{ fontSize: 11, color: m.isAI ? T.textMuted : T.text, lineHeight: 1.35, margin: 0 }}>{m.text.length > 80 ? m.text.slice(0, 80) + "…" : m.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Voice indicator + severity */}
          <div style={{ padding: "6px 12px 10px", background: T.surface, borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: voiceActive ? T.danger : T.accent, animation: voiceActive ? "pulse .5s infinite" : "pulse 2s infinite" }} />
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: voiceActive ? T.accent : T.textMuted }}>{voiceActive ? "Listening…" : "Ready"}</span>
                <div style={{ fontSize: 9, color: T.textDim }}>Always on · speak naturally</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: sevColor }}>{caseSev}/10</span>
              {prevSev !== caseSev && <span style={{ fontSize: 10, fontWeight: 600, color: T.green }}>↓{prevSev - caseSev}</span>}
              {checkIns.length > 1 && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 16, width: 40 }}>
                  {checkIns.map((c, i) => <div key={i} style={{ flex: 1, height: `${(c.sev / 10) * 100}%`, background: i === checkIns.length - 1 ? sevColor : T.border, borderRadius: 1, minHeight: 2 }} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── TEXT MODE — compact body maps + symptom list + chat ──
  return (
    <>
      <Header
        left={<button onClick={() => setMode("voice")} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 10px", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🎙️ Voice</button>}
        center={<div style={{ textAlign: "center" }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: timer < 60 ? T.warm : T.text }}>{mins}:{String(secs).padStart(2, "0")}</span>
        </div>}
        right={<Btn variant="danger" small onClick={onEnd} style={{ padding: "5px 12px" }}>End</Btn>}
      />

      {/* Clock reset note */}
      <div style={{ textAlign: "center", padding: "3px 16px 4px", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 10, color: T.textDim }}>⏱️ Clock resets each time symptoms improve</span>
      </div>

      {/* Body maps — both sides, compact */}
      <div style={{ padding: "6px 10px 4px", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <BodyMap side="front" pins={casePins} small />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.textDim, letterSpacing: 1, marginBottom: 2 }}>SEVERITY</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, color: sevColor, lineHeight: 1 }}>{caseSev}<span style={{ fontSize: 13, color: T.textMuted }}>/10</span></div>
            {prevSev !== caseSev && <div style={{ fontSize: 11, fontWeight: 600, color: T.green, animation: "slideUp .3s ease", marginTop: 2 }}>↓ {prevSev - caseSev}</div>}
            {checkIns.length > 1 && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 18, width: "80%", marginTop: 4 }}>
                {checkIns.map((c, i) => <div key={i} style={{ flex: 1, height: `${(c.sev / 10) * 100}%`, background: i === checkIns.length - 1 ? sevColor : T.border, borderRadius: 2, minHeight: 2 }} />)}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 9, color: T.textMuted }}>Connected</span>
            </div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <BodyMap side="back" pins={casePins} small />
          </div>
        </div>

        {/* Symptom list — scrollable for many symptoms */}
        <div style={{ display: "flex", gap: 5, overflowX: "auto", padding: "6px 4px 2px" }}>
          {symptomList.map(s => {
            const c = s.severity <= 2 ? T.green : s.severity <= 5 ? T.warm : T.danger;
            return (
              <div key={s.id} style={{ padding: "3px 8px", borderRadius: 8, background: c + "15", border: `1px solid ${c}25`, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: T.text, whiteSpace: "nowrap" }}>{s.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{s.severity}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {msgs.map((m, i) => <ChatBubble key={i} text={m.text} isAI={m.isAI} />)}
        <div ref={ref} />
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 6, padding: "6px 16px", overflowX: "auto", borderTop: `1px solid ${T.border}`, background: T.surface }}>
        {quickMessages.map((q, i) => (
          <button key={i} onClick={() => sendMessage(q)} style={{ padding: "5px 10px", borderRadius: 10, border: `1px solid ${T.accent}30`, background: T.accentDim, color: T.accent, fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{q}</button>
        ))}
      </div>

      {/* Text input */}
      <div style={{ padding: "6px 16px 12px", background: T.surface }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendMessage(text); }} placeholder="Message AI mediator…" style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 13.5, outline: "none" }} />
          <button onClick={() => sendMessage(text)} style={{ width: 42, height: 42, borderRadius: 12, border: "none", background: T.grad, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: T.textDim }}>Messages reviewed by AI before relaying to patient</span>
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HEALER EARNINGS TAB — Full earnings view + block history
   ═══════════════════════════════════════════════════════════════ */
const HealerEarningsScreen = () => {
  const [expandedBlock, setExpandedBlock] = useState(null);
  const [showPayInfo, setShowPayInfo] = useState(false);

  // Mock earnings data — 10-session blocks
  const blocks = [
    { id: 1, sessions: 10, avgImprove: 68, conditions: [{ label: "Arthritis", icon: "🦴", count: 4 }, { label: "Migraine", icon: "🧠", count: 6 }], placeboBaseline: 38, payout: 600, status: "paid", date: "Mar 18 – Mar 22", tier: "Excellent" },
    { id: 2, sessions: 10, avgImprove: 52, conditions: [{ label: "Migraine", icon: "🧠", count: 5 }, { label: "Back pain", icon: "🔧", count: 3 }, { label: "Anxiety", icon: "🌀", count: 2 }], placeboBaseline: 35, payout: 300, status: "paid", date: "Mar 12 – Mar 17", tier: "Above placebo" },
    { id: 3, sessions: 10, avgImprove: 91, conditions: [{ label: "Arthritis", icon: "🦴", count: 7 }, { label: "Migraine", icon: "🧠", count: 3 }], placeboBaseline: 39, payout: 900, status: "paid", date: "Mar 5 – Mar 11", tier: "Elite" },
    { id: 4, sessions: 10, avgImprove: 31, conditions: [{ label: "Fibromyalgia", icon: "💢", count: 6 }, { label: "Neuropathy", icon: "⚡", count: 4 }], placeboBaseline: 27, payout: 0, status: "below", date: "Feb 26 – Mar 4", tier: "Below placebo" },
    { id: 5, sessions: 10, avgImprove: 58, conditions: [{ label: "Arthritis", icon: "🦴", count: 8 }, { label: "Migraine", icon: "🧠", count: 2 }], placeboBaseline: 39, payout: 450, status: "paid", date: "Feb 18 – Feb 25", tier: "Strong" },
  ];

  // Current in-progress block
  const currentBlock = { sessions: 6, avgImprove: 62, conditions: [{ label: "Arthritis", icon: "🦴", count: 3 }, { label: "Migraine", icon: "🧠", count: 3 }] };

  const totalEarned = blocks.filter(b => b.status === "paid").reduce((s, b) => s + b.payout, 0);
  const thisMonth = blocks.filter(b => b.date.includes("Mar")).reduce((s, b) => s + b.payout, 0);
  const avgPer10 = Math.round(totalEarned / blocks.filter(b => b.status === "paid").length);

  const payColor = (payout) => payout >= 900 ? T.green : payout >= 600 ? T.blue : payout >= 300 ? T.accent : payout > 0 ? T.warm : T.danger;
  const tierColor = (tier) => tier === "Elite" ? T.green : tier === "Excellent" ? T.blue : tier === "Strong" ? T.accent : tier === "Above placebo" ? T.warm : T.danger;

  return (
    <ScreenWrap>
      <div style={{ animation: "slideUp .4s ease" }}>

        {/* Earnings hero */}
        <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>TOTAL EARNINGS</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 40, fontWeight: 800, letterSpacing: -2, color: T.text }}>${totalEarned.toLocaleString()}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.accent }}>${thisMonth.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>This month</div>
            </div>
            <div style={{ width: 1, background: T.border }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.blue }}>${avgPer10}</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>Avg per block</div>
            </div>
            <div style={{ width: 1, background: T.border }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.purple }}>{blocks.length * 10}</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>Total sessions</div>
            </div>
          </div>
        </div>

        {/* Current block in progress */}
        <Card style={{ marginBottom: 14, border: `2px solid ${T.accent}30`, background: `${T.accent}06` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Current block</span>
            </div>
            <span style={{ fontSize: 12, color: T.textMuted }}>{currentBlock.sessions}/10 sessions</span>
          </div>
          <ProgressBar value={(currentBlock.sessions / 10) * 100} color={T.accent} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: T.textMuted }}>{10 - currentBlock.sessions} more to complete block</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: currentBlock.avgImprove >= 50 ? T.green : T.warm }}>Avg: {currentBlock.avgImprove}%</span>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            {currentBlock.conditions.map((c, i) => (
              <span key={i} style={{ padding: "2px 8px", borderRadius: 8, background: T.card, border: `1px solid ${T.border}`, fontSize: 10, color: T.textMuted }}>{c.icon} {c.count}</span>
            ))}
          </div>
          {currentBlock.avgImprove >= 60 && (
            <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 8, background: T.greenDim, border: `1px solid ${T.green}20` }}>
              <p style={{ fontSize: 11, color: T.green }}>📈 Tracking toward ~${currentBlock.avgImprove >= 90 ? "900" : currentBlock.avgImprove >= 70 ? "600" : currentBlock.avgImprove >= 60 ? "450" : "300"} if you maintain this rate</p>
            </div>
          )}
        </Card>

        {/* How pay works — expandable */}
        <button onClick={() => setShowPayInfo(!showPayInfo)} style={{ width: "100%", padding: "10px 14px", borderRadius: 14, border: `1px solid ${T.blue}25`, background: T.blueDim, color: T.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span>💡 How earnings are calculated</span>
          <span>{showPayInfo ? "▴" : "▾"}</span>
        </button>
        {showPayInfo && (
          <Card style={{ marginBottom: 14, animation: "slideUp .2s ease" }}>
            <p style={{ fontSize: 12, color: T.text, lineHeight: 1.6, marginBottom: 10 }}>Every 10 sessions, we calculate your average symptom improvement across all patients — adjusted for each condition's placebo baseline. The further above placebo you score, the more you earn.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {[
                { above: "Below placebo", pay: "$0", color: T.danger },
                { above: "~50% improvement", pay: "$300", color: T.warm },
                { above: "~60% improvement", pay: "$450", color: T.accent },
                { above: "~70% improvement", pay: "$600", color: T.blue },
                { above: "~90%+ improvement", pay: "$900", color: T.green },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderRadius: 8, background: t.color + "10" }}>
                  <span style={{ fontSize: 11, color: t.color }}>{t.above}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.pay}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>Placebo baselines vary by condition (e.g. arthritis ~40%, migraine ~35%). Your weighted average accounts for the mix of conditions you treated in each block.</p>
          </Card>
        )}

        {/* Block history */}
        <Label>BLOCK HISTORY</Label>
        {blocks.map((b, i) => {
          const isExpanded = expandedBlock === b.id;
          const tc = tierColor(b.tier);
          return (
            <Card key={b.id} onClick={() => setExpandedBlock(isExpanded ? null : b.id)} style={{ marginBottom: 8, cursor: "pointer", border: `1px solid ${b.status === "below" ? T.danger + "25" : T.border}`, background: b.status === "below" ? T.dangerDim : T.card, animation: `slideUp ${.25 + i * .05}s ease` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Block #{blocks.length - i}</span>
                    <Badge color={tc} bg={tc + "18"}>{b.tier}</Badge>
                  </div>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{b.date} · {b.sessions} sessions</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: b.payout > 0 ? payColor(b.payout) : T.danger }}>
                    {b.payout > 0 ? `$${b.payout}` : "$0"}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{b.avgImprove}% avg</div>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, animation: "fadeIn .2s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: T.textMuted }}>Avg improvement</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: tc }}>{b.avgImprove}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: T.textMuted }}>Weighted placebo baseline</span>
                    <span style={{ fontSize: 12 }}>{b.placeboBaseline}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: T.textMuted }}>Above placebo</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: b.avgImprove > b.placeboBaseline ? T.green : T.danger }}>{b.avgImprove > b.placeboBaseline ? "+" : ""}{b.avgImprove - b.placeboBaseline}%</span>
                  </div>
                  <Divider />
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, marginBottom: 6 }}>CONDITIONS TREATED</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {b.conditions.map((c, j) => (
                      <span key={j} style={{ padding: "3px 10px", borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, fontSize: 11 }}>{c.icon} {c.label} × {c.count}</span>
                    ))}
                  </div>
                  {b.status === "below" && (
                    <div style={{ padding: "8px 10px", borderRadius: 10, background: T.danger + "12", border: `1px solid ${T.danger}20` }}>
                      <p style={{ fontSize: 11, color: T.danger, lineHeight: 1.45 }}>⚠️ This block scored below placebo. We recommend taking a rest and revisiting your approach before your next sessions.</p>
                    </div>
                  )}
                  {b.status === "paid" && (
                    <div style={{ padding: "6px 10px", borderRadius: 10, background: T.greenDim, border: `1px solid ${T.green}20` }}>
                      <p style={{ fontSize: 11, color: T.green }}>✓ Paid on {b.date.split("–")[1]?.trim() || b.date}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {/* Lifetime summary */}
        <Card style={{ marginTop: 8, marginBottom: 16, background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`, border: `1px solid ${T.accent}20`, textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>💜</div>
          <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>You've earned ${totalEarned.toLocaleString()} across {blocks.length} blocks — while helping real people with real pain.</p>
          <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>That's what healing as a profession looks like.</p>
        </Card>

        <Divider />

        {/* Next payout */}
        <Label>PAYOUTS</Label>
        <Card style={{ marginBottom: 12, border: `1px solid ${T.green}25`, background: T.greenDim }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.green }}>Next payout</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Friday, April 4, 2026</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: T.green }}>$600</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>pending</div>
            </div>
          </div>
          <div style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.5)", border: `1px solid ${T.green}15` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted }}>
              <span>Block #6 (current: 6/10)</span>
              <span>In progress — not yet included</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4 }}>
              <span style={{ color: T.text, fontWeight: 500 }}>Block #5 completed</span>
              <span style={{ color: T.green, fontWeight: 600 }}>$600 → pending</span>
            </div>
          </div>
          <p style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>Payouts are processed every Friday to your linked bank account.</p>
        </Card>

        {/* Payout schedule */}
        <Card style={{ marginBottom: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Payout schedule</span>
            <Badge color={T.blue}>Weekly · Fridays</Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { label: "Block completed", desc: "When you finish 10 sessions, the block is calculated" },
              { label: "Review period", desc: "1–2 business days for verification" },
              { label: "Payout queued", desc: "Added to the next Friday payout batch" },
              { label: "Funds arrive", desc: "1–3 business days after payout" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: T.accent + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: T.accent, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Payout history */}
        <Label>PAYOUT HISTORY</Label>
        {[
          { date: "Mar 28, 2026", amount: 900, blocks: "Block #3", method: "Bank •••• 4821", status: "completed" },
          { date: "Mar 21, 2026", amount: 750, blocks: "Blocks #1–2", method: "Bank •••• 4821", status: "completed" },
          { date: "Mar 14, 2026", amount: 450, blocks: "Block #5", method: "Bank •••• 4821", status: "completed" },
        ].map((p, i) => (
          <Card key={i} style={{ marginBottom: 8, padding: "12px 14px", animation: `slideUp ${.25 + i * .05}s ease` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{p.date}</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: T.green }}>${p.amount}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: T.textMuted }}>{p.blocks} · {p.method}</span>
              <Badge color={T.green}>✓ {p.status}</Badge>
            </div>
          </Card>
        ))}

        {/* Banking link */}
        <Card style={{ marginTop: 8, marginBottom: 16, border: `1px solid ${T.blue}25`, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.blueDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Bank account linked</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>•••• 4821 · Update in Profile → Banking</div>
            </div>
            <span style={{ color: T.blue, fontSize: 14 }}>→</span>
          </div>
        </Card>
      </div>
    </ScreenWrap>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 16: Healer Post-Session — Full Feedback Loop
   ═══════════════════════════════════════════════════════════════ */
const HealerPostScreen = ({ onReady, onHome }) => {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [milestone, setMilestone] = useState(null);

  // Mock session data
  const sessionData = {
    condition: "Arthritis", icon: "🦴",
    beforeSev: 7, afterSev: 3, duration: "4:32",
    symptoms: [
      { label: "Lower back", before: 7, after: 3 },
      { label: "Upper back", before: 6, after: 2 },
    ],
    patientQuotes: [
      { time: "1:02", text: "I think it's changing a little." },
      { time: "2:45", text: "Oh my God, the sharpness is gone." },
      { time: "4:10", text: "It's definitely better than when we started." },
    ],
    severityCurve: [7, 7, 5, 4, 3, 3],
  };

  const totalDrop = sessionData.beforeSev - sessionData.afterSev;
  const beatPlacebo = totalDrop >= 2;
  const pctDrop = Math.round((totalDrop / Math.max(sessionData.beforeSev, 1)) * 100);

  // Updated stats after this session
  const newSessions = OVERALL_STATS.sessions + 1;
  const newBeat = OVERALL_STATS.beatPlacebo + (beatPlacebo ? 1 : 0);
  const newPct = Math.round((newBeat / newSessions) * 100);
  const arthritisSessions = 9; // mock: was 8, now 9
  const arthritisPct = 92; // mock

  // Check for milestones
  useEffect(() => {
    if (arthritisSessions === 8 && arthritisPct >= 75) setMilestone({ type: "specialist", condition: "Arthritis", icon: "🦴" });
    else if (newSessions === 20) setMilestone({ type: "twentySessions", condition: null, icon: "🎉" });
    else if (newPct >= 75 && OVERALL_STATS.pct < 75) setMilestone({ type: "qualified", condition: null, icon: "✅" });
  }, []);

  const resultColor = beatPlacebo ? T.green : T.warm;
  const sevColor = (s) => s <= 2 ? T.green : s <= 5 ? T.warm : T.danger;

  return (
    <>
      <Header center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Session Complete</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>

          {/* Result hero */}
          <div style={{ textAlign: "center", padding: "12px 0 16px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: resultColor + "20", border: `2px solid ${resultColor}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28, animation: "breathe 2s ease-in-out infinite" }}>{beatPlacebo ? "✨" : "🙏"}</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: resultColor }}>{beatPlacebo ? "Great result!" : "Session complete"}</h2>
            <p style={{ fontSize: 14, color: T.textMuted }}>
              {beatPlacebo
                ? `${pctDrop}% reduction — this session beat placebo threshold`
                : "Not every session produces dramatic change. That's part of the process."}
            </p>
          </div>

          {/* Before / After body maps */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 10, border: `1px solid ${T.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 1, marginBottom: 4 }}>BEFORE</div>
              <BodyMap side="front" pins={[{ id: 1, x: 52, y: 55, side: "front", severity: sessionData.beforeSev }]} small />
            </div>
            <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 10, border: `1px solid ${resultColor}25`, textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: resultColor, letterSpacing: 1, marginBottom: 4 }}>AFTER</div>
              <BodyMap side="front" pins={[{ id: 1, x: 52, y: 55, side: "front", severity: sessionData.afterSev }]} small />
            </div>
          </div>

          {/* Symptom breakdown */}
          <Card style={{ marginBottom: 14, padding: "14px 16px" }}>
            <Label>SYMPTOM RESULTS</Label>
            {sessionData.symptoms.map((s, i) => {
              const drop = s.before - s.after;
              const good = drop >= 2;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < sessionData.symptoms.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <span style={{ fontSize: 13 }}>{s.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: T.danger }}>{s.before}</span>
                    <span style={{ fontSize: 10, color: T.textDim }}>→</span>
                    <span style={{ fontSize: 12, color: sevColor(s.after), fontWeight: 700 }}>{s.after}</span>
                    <Badge color={good ? T.green : T.textMuted}>{drop > 0 ? `−${drop}` : "—"}</Badge>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Severity curve */}
          <Card style={{ marginBottom: 14, padding: "14px 16px" }}>
            <Label>SESSION CURVE</Label>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 50, marginBottom: 6 }}>
              {sessionData.severityCurve.map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${(v / 10) * 100}%`, background: `linear-gradient(180deg, ${sevColor(v)}, ${sevColor(v)}40)`, borderRadius: 4, minHeight: 4, transition: "all .3s" }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: T.textDim }}>Start</span>
              <span style={{ fontSize: 10, color: T.textDim }}>{sessionData.duration}</span>
            </div>
          </Card>

          {/* Patient quotes */}
          <Card style={{ marginBottom: 14, padding: "14px 16px" }}>
            <Label>WHAT THE PATIENT SAID</Label>
            {sessionData.patientQuotes.map((q, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < sessionData.patientQuotes.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600, flexShrink: 0, marginTop: 2 }}>{q.time}</span>
                <p style={{ fontSize: 12, color: T.text, fontStyle: "italic", lineHeight: 1.45, margin: 0 }}>"{q.text}"</p>
              </div>
            ))}
          </Card>

          {/* Qualification impact */}
          <Card style={{ marginBottom: 14, background: `linear-gradient(135deg, ${resultColor}08, ${T.purpleDim})`, border: `1px solid ${resultColor}20`, padding: "16px" }}>
            <Label>QUALIFICATION IMPACT</Label>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>Overall success rate</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>{OVERALL_STATS.pct}%</span>
                <span style={{ fontSize: 10, color: T.textDim }}>→</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: newPct >= 75 ? T.green : T.warm }}>{newPct}%</span>
              </div>
            </div>
            <ProgressBar value={newPct} color={newPct >= 75 ? T.green : T.accent} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: T.textMuted }}>{newBeat}/{newSessions} beat placebo</span>
              <span style={{ fontSize: 10, color: T.textMuted }}>Need 75%</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🦴</span>
                <span style={{ fontSize: 13 }}>Arthritis specialist</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{arthritisPct}%</span>
                <span style={{ fontSize: 11, color: T.textMuted }}>· {arthritisSessions} sessions</span>
              </div>
            </div>
            {beatPlacebo && (
              <div style={{ padding: "8px 10px", borderRadius: 10, background: resultColor + "15", border: `1px solid ${resultColor}20`, marginTop: 8 }}>
                <p style={{ fontSize: 12, color: resultColor, fontWeight: 600 }}>✓ This session counted toward your qualification</p>
              </div>
            )}
          </Card>

          {/* Milestone celebration */}
          {milestone && (
            <Card style={{ marginBottom: 14, background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`, border: `2px solid ${T.accent}40`, textAlign: "center", padding: 20, animation: "slideUp .5s ease" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{milestone.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                {milestone.type === "specialist" && `${milestone.condition} Specialist unlocked!`}
                {milestone.type === "twentySessions" && "20 sessions completed!"}
                {milestone.type === "qualified" && "You're now a Verified Healer!"}
              </h3>
              <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>
                {milestone.type === "specialist" && `You now qualify as a paid specialist for ${milestone.condition}. Patients with this condition will be matched to you first.`}
                {milestone.type === "twentySessions" && "You've completed the minimum sessions for general qualification assessment."}
                {milestone.type === "qualified" && "You've hit 75%+ success rate. Full access to all session types is now unlocked."}
              </p>
            </Card>
          )}

          {/* Session journal */}
          <div style={{ marginBottom: 14 }}>
            <button onClick={() => setShowNotes(!showNotes)} style={{ width: "100%", padding: "10px 14px", borderRadius: 14, border: `1px solid ${T.border}`, background: T.card, color: T.textMuted, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>📝 Session journal (private)</span>
              <span style={{ fontSize: 12 }}>{showNotes ? "▴" : "▾"}</span>
            </button>
            {showNotes && (
              <div style={{ marginTop: 8, animation: "slideUp .2s ease" }}>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="What did you notice? What technique felt right? What would you try differently?"
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, height: 100, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.5 }}
                />
                <p style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>Only visible to you. These notes help you improve over time.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <Btn onClick={onReady} full>Ready for another session →</Btn>
          <div style={{ height: 8 }} />
          <Btn onClick={onHome} variant="secondary" full>Back to dashboard</Btn>
          <div style={{ height: 16 }} />
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCREEN 17–18b: Tiers + Payment
   ═══════════════════════════════════════════════════════════════ */
const TierScreen = ({ onSelect, onGroup, onBack }) => (
  <>
    <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Super Sessions</span>} />
    <ScreenWrap>
      <div style={{ animation: "slideUp .4s ease" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Choose your session tier</h2>
        <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>All tiers are Super Sessions with a verified healer.</p>
        {paidTiersData.map((t, i) => <Card key={t.name} onClick={() => onSelect(t)} style={{ marginBottom: 10, cursor: "pointer", border: `1px solid ${t.color}25`, animation: `slideUp ${.3 + i * .08}s ease` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 16, fontWeight: 700, color: t.color }}>{t.name}</span><span style={{ fontSize: 18, fontWeight: 800, color: t.color }}>{t.price}</span></div><p style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>{t.desc}</p>{t.stat && <p style={{ fontSize: 11, color: T.accent, marginBottom: 8, padding: "6px 8px", borderRadius: 8, background: T.accentDim, lineHeight: 1.45 }}>📊 {t.stat}</p>}<div style={{ display: "flex", gap: 8 }}><Badge color={t.color}>{t.urgency}</Badge><Badge color={T.textMuted}>~{t.wait}</Badge></div></Card>)}
        <Card onClick={onGroup} style={{ cursor: "pointer", border: `1px solid ${T.purple}30`, background: `${T.purple}08` }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: T.purpleDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👥</div><div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700, color: T.purple }}>Group Healing</div><div style={{ fontSize: 12, color: T.textMuted }}>From $19.99/mo · 8 sessions per month</div></div></div></Card>
      </div>
    </ScreenWrap>
  </>
);

const PaymentScreen = ({ tier, onPay, onBack }) => {
  const [method, setMethod] = useState("saved"); // saved | new | apple | google
  const [save, setSave] = useState(true);
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Payment</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          {/* Order summary */}
          <Card style={{ marginBottom: 16, border: `1px solid ${tier?.color || T.accent}30` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{tier?.name || "Super Session"}</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: tier?.color || T.accent }}>{tier?.price}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Badge color={tier?.color || T.accent}>{tier?.urgency || "Priority"}</Badge>
              <Badge color={T.textMuted}>~{tier?.wait || "5 min"} wait</Badge>
            </div>
          </Card>

          {/* Payment methods */}
          <Label>PAYMENT METHOD</Label>

          {/* Saved card */}
          <div onClick={() => setMethod("saved")} style={{ padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${method === "saved" ? T.accent : T.border}`, background: method === "saved" ? T.accentDim : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 24, borderRadius: 4, background: T.blue + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.blue }}>VISA</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>•••• 4242</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>Expires 08/27</div>
              </div>
            </div>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${method === "saved" ? T.accent : T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {method === "saved" && <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.accent }} />}
            </div>
          </div>

          {/* Apple Pay */}
          <div onClick={() => setMethod("apple")} style={{ padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${method === "apple" ? T.accent : T.border}`, background: method === "apple" ? T.accentDim : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}></span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Apple Pay</span>
            </div>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${method === "apple" ? T.accent : T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {method === "apple" && <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.accent }} />}
            </div>
          </div>

          {/* Google Pay */}
          <div onClick={() => setMethod("google")} style={{ padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${method === "google" ? T.accent : T.border}`, background: method === "google" ? T.accentDim : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>G</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Google Pay</span>
            </div>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${method === "google" ? T.accent : T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {method === "google" && <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.accent }} />}
            </div>
          </div>

          {/* New card */}
          <div onClick={() => setMethod("new")} style={{ padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${method === "new" ? T.accent : T.border}`, background: method === "new" ? T.accentDim : T.card, marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>+ Add new card</span>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${method === "new" ? T.accent : T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {method === "new" && <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.accent }} />}
            </div>
          </div>

          {method === "new" && (
            <div style={{ animation: "slideUp .2s ease", marginBottom: 12 }}>
              <Label>CARD NUMBER</Label><Input placeholder="4242 4242 4242 4242" /><div style={{ height: 8 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}><Label>EXPIRY</Label><Input placeholder="MM/YY" /></div>
                <div style={{ flex: 1 }}><Label>CVC</Label><Input placeholder="123" /></div>
              </div>
              <div style={{ height: 8 }} />
              <Toggle on={save} onToggle={() => setSave(!save)} label="Save for future sessions" />
            </div>
          )}

          <Divider />
          <div style={{ padding: "8px 0", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: T.textMuted }}>Session</span>
              <span style={{ fontSize: 13 }}>{tier?.price}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: tier?.color || T.accent }}>{tier?.price}</span>
            </div>
          </div>
          <p style={{ fontSize: 11, color: T.textDim, lineHeight: 1.5, marginBottom: 12 }}>Full refund if no healer is matched, session fails, or safety stop is triggered.</p>
          <Btn onClick={onPay} full>Pay {tier?.price}</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

const PaymentConfirmScreen = ({ tier, onContinue }) => (
  <>
    <Header center={<span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>Confirmed</span>} />
    <ScreenWrap>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", animation: "slideUp .4s ease" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.greenDim, border: `2px solid ${T.green}40`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 20, marginBottom: 16, fontSize: 28, animation: "breathe 2s ease-in-out infinite" }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Payment confirmed</h2>
        <p style={{ fontSize: 14, color: T.textMuted, marginBottom: 20 }}>You're booked for a <span style={{ color: tier?.color || T.accent, fontWeight: 700 }}>{tier?.name}</span>.</p>

        {/* Receipt card */}
        <Card style={{ width: "100%", marginBottom: 20, border: `1px solid ${T.border}`, textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: 1, marginBottom: 10 }}>RECEIPT</div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>Session type</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: tier?.color || T.accent }}>{tier?.name}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>Amount</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{tier?.price}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>Payment method</span>
            <span style={{ fontSize: 12 }}>Visa •••• 4242</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>Date</span>
            <span style={{ fontSize: 12 }}>Mar 30, 2026</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>Est. wait</span>
            <span style={{ fontSize: 12 }}>~{tier?.wait}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>Ref #</span>
            <span style={{ fontSize: 12, fontFamily: "monospace" }}>EN-2026-{Math.floor(Math.random() * 90000 + 10000)}</span>
          </div>
        </Card>

        <div style={{ padding: "8px 12px", borderRadius: 10, background: T.blueDim, border: `1px solid ${T.blue}20`, width: "100%", marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: T.blue, lineHeight: 1.5, textAlign: "center" }}>A receipt has been sent to your email. You can also find it in Profile → Billing.</p>
        </div>

        <Btn onClick={onContinue} full>Join Queue →</Btn>
      </div>
    </ScreenWrap>
  </>
);

/* ═══════════════════════════════════════════════════════════════
   SCREEN 19: Charlie Reveal (modal)
   ═══════════════════════════════════════════════════════════════ */
const CharlieReveal = ({ onAccept, onDecline }) => (
  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn .3s ease" }}>
    <Card style={{ width: "100%", maxWidth: 340, textAlign: "center", padding: 24, border: `1px solid ${T.accent}30` }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, fontWeight: 800, color: T.bg }}>CG</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Your healer is Charlie Goldsmith</h3>
      <p style={{ fontSize: 14, color: T.textMuted, marginBottom: 20 }}>He'd like to continue on video — do you agree?</p>
      <Btn onClick={onAccept} full>Yes, switch to video</Btn>
      <div style={{ height: 8 }} />
      <Btn onClick={onDecline} variant="ghost" full>No thanks — stay anonymous</Btn>
      <p style={{ fontSize: 10, color: T.textDim, marginTop: 12 }}>No recording. 18+ only.</p>
    </Card>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   SHARED SCREENS: History, Support, Profile, Delete, Admin
   ═══════════════════════════════════════════════════════════════ */
const sessionHistory = [
  { date: "Mar 15, 2026", issue: "Chronic Pain", before: 7, after: 3, dur: "4:32", alias: "Ember" },
  { date: "Mar 10, 2026", issue: "Tension", before: 5, after: 2, dur: "5:00", alias: "Solace" },
  { date: "Feb 28, 2026", issue: "Emotional", before: 6, after: 4, dur: "4:58", alias: "Lumen" },
];

const HistoryScreen = () => {
  const [detail, setDetail] = useState(null);
  if (detail !== null) {
    const s = sessionHistory[detail];
    return (
      <ScreenWrap>
        <div style={{ animation: "slideUp .3s ease" }}>
          <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 16, cursor: "pointer", marginBottom: 12 }}>← Back to history</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{s.issue}</h2>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>{s.date} · {s.dur} · {s.alias}</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 10, border: `1px solid ${T.border}` }}><div style={{ textAlign: "center", marginBottom: 6, fontSize: 12, fontWeight: 600, color: T.textMuted, letterSpacing: 1 }}>BEFORE</div><BodyMap side="front" pins={[{ id: 1, x: 52, y: 55, side: "front", severity: s.before }]} small /></div>
            <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: 10, border: `1px solid ${T.accent}25` }}><div style={{ textAlign: "center", marginBottom: 6, fontSize: 12, fontWeight: 600, color: T.accent, letterSpacing: 1 }}>AFTER</div><BodyMap side="front" pins={[{ id: 1, x: 52, y: 55, side: "front", severity: s.after }]} small /></div>
          </div>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: T.textMuted }}>Severity change</span><span style={{ fontSize: 16, fontWeight: 700, color: T.accent }}>−{s.before - s.after} points</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: T.textMuted }}>Duration</span><span style={{ fontSize: 14 }}>{s.dur}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, color: T.textMuted }}>Healer</span><span style={{ fontSize: 14 }}>{s.alias}</span></div>
          </Card>
        </div>
      </ScreenWrap>
    );
  }
  return (
    <ScreenWrap>
      <div style={{ animation: "slideUp .4s ease" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Session History</h2>
        <Card style={{ marginBottom: 16, padding: "12px 14px" }}>
          <Label>SYMPTOM TREND</Label>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
            {[7, 5, 6, 3, 2, 4].map((v, i) => <div key={i} style={{ flex: 1, height: `${v * 10}%`, background: `linear-gradient(180deg, ${T.accent}, ${T.accent}40)`, borderRadius: 4, minHeight: 4 }} />)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}><span style={{ fontSize: 12, color: T.textDim }}>Feb</span><span style={{ fontSize: 12, color: T.textDim }}>Mar</span></div>
        </Card>
        {sessionHistory.map((s, i) => (
          <Card key={i} onClick={() => setDetail(i)} style={{ marginBottom: 8, cursor: "pointer", animation: `slideUp ${.3 + i * .08}s ease` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>{s.issue}</div><div style={{ fontSize: 12, color: T.textMuted }}>{s.date} · {s.dur}</div></div>
              <Badge color={T.accent}>−{s.before - s.after}</Badge>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: T.danger }}>Before: {s.before}</span>
              <span style={{ fontSize: 12, color: T.accent }}>After: {s.after}</span>
              <span style={{ fontSize: 12, color: T.textDim, marginLeft: "auto" }}>{s.alias}</span>
            </div>
          </Card>
        ))}
      </div>
    </ScreenWrap>
  );
};

const SupportScreen = () => {
  const types = [
    { icon: "🚨", label: "Safety issue", color: T.danger },
    { icon: "⚠️", label: "Inappropriate behaviour", color: T.warm },
    { icon: "🔧", label: "Technical problem", color: T.blue },
    { icon: "💳", label: "Payment issue", color: T.purple },
    { icon: "💬", label: "Session feedback", color: T.accent },
    { icon: "📋", label: "Request account data", color: T.textMuted },
  ];
  return (
    <ScreenWrap>
      <div style={{ animation: "slideUp .4s ease" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Support</h2>
        <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>AI handles common issues. Complex ones go to a human.</p>
        {types.map((t, i) => <Card key={t.label} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", animation: `slideUp ${.2 + i * .05}s ease` }}><span style={{ fontSize: 22 }}>{t.icon}</span><span style={{ fontSize: 14, fontWeight: 500, color: t.color }}>{t.label}</span></Card>)}
        <Divider />
        <p style={{ fontSize: 12, color: T.textDim }}>Urgent safety: call +1-800-ENNIE<br />Email: support@ennie.app<br />Response SLA: within 24 hours</p>
      </div>
    </ScreenWrap>
  );
};

const ProfileScreen = ({ role, setRole }) => (
  <ScreenWrap>
    <div style={{ animation: "slideUp .4s ease" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Profile & Settings</h2>
      <Label>ROLE</Label>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["Case", "Healer"].map(r => <Btn key={r} variant={role === r.toLowerCase() ? "accent" : "secondary"} small onClick={() => setRole(r.toLowerCase())} style={{ flex: 1 }}>{r}</Btn>)}
      </div>
      <Label>DISPLAY NAME</Label><Input placeholder="Your name" style={{ marginBottom: 10 }} />
      <Label>EMAIL</Label><Input placeholder="you@example.com" style={{ marginBottom: 10 }} />
      <Label>LANGUAGE</Label><Input placeholder="English" style={{ marginBottom: 10 }} />
      <Divider />
      <Label>NOTIFICATIONS</Label>
      <Card style={{ marginBottom: 10 }}><Toggle on={true} onToggle={() => {}} label="Session reminders" /></Card>
      <Card style={{ marginBottom: 10 }}><Toggle on={true} onToggle={() => {}} label="Follow-up check-ins" /></Card>
      <Card style={{ marginBottom: 10 }}><Toggle on={false} onToggle={() => {}} label="Marketing updates" /></Card>
      <Divider />
      <Label>BILLING & PAYMENTS</Label>
      <Card style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: 1, marginBottom: 8 }}>SAVED PAYMENT METHODS</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 24, borderRadius: 4, background: T.blue + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: T.blue }}>VISA</div>
            <div><div style={{ fontSize: 12, fontWeight: 500 }}>•••• 4242</div><div style={{ fontSize: 10, color: T.textMuted }}>Expires 08/27</div></div>
          </div>
          <Badge color={T.green}>Default</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}></span>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Apple Pay</span>
          </div>
          <span style={{ fontSize: 11, color: T.textMuted }}>Connected</span>
        </div>
      </Card>
      <Btn variant="ghost" small full style={{ marginBottom: 12 }}>Add payment method</Btn>

      {role === "case" && (
        <>
          <Card style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: 1, marginBottom: 8 }}>RECENT RECEIPTS</div>
            {[
              { date: "Mar 28, 2026", type: "Super — Today", amount: "$350", ref: "EN-2026-48291", status: "completed" },
              { date: "Mar 20, 2026", type: "Super — Line", amount: "$50", ref: "EN-2026-37124", status: "completed" },
              { date: "Mar 10, 2026", type: "Group Healing", amount: "$29", ref: "EN-2026-28490", status: "completed" },
            ].map((r, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{r.type}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{r.amount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: T.textMuted }}>{r.date} · {r.ref}</span>
                  <Badge color={T.green}>✓ {r.status}</Badge>
                </div>
              </div>
            ))}
          </Card>
          <Card style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: 1, marginBottom: 8 }}>SPENDING SUMMARY</div>
            <div style={{ display: "flex", gap: 0 }}>
              <div style={{ flex: 1, textAlign: "center", borderRight: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.accent }}>$429</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>This month</div>
              </div>
              <div style={{ flex: 1, textAlign: "center", borderRight: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.purple }}>$1,240</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>All time</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.blue }}>8</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>Paid sessions</div>
              </div>
            </div>
          </Card>
          <div style={{ padding: "8px 12px", borderRadius: 10, background: T.blueDim, border: `1px solid ${T.blue}20`, marginBottom: 10 }}>
            <p style={{ fontSize: 11, color: T.blue, lineHeight: 1.5 }}>💡 All receipts are emailed automatically. Need a refund? Contact Support.</p>
          </div>
        </>
      )}
      {role === "healer" && (
        <>
          <Divider />
          <Label>BANKING DETAILS (FOR PAYOUTS)</Label>
          <Card style={{ marginBottom: 10, border: `1px solid ${T.green}25` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.greenDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🏦</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Payout account linked</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>Payouts processed every Friday</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>Account holder</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>J. Smith</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>Bank</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>Commonwealth Bank</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>BSB</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>062-000</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>Account number</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>•••• 4821</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>Status</span>
                <Badge color={T.green}>Verified ✓</Badge>
              </div>
            </div>
          </Card>
          <Btn variant="secondary" small full style={{ marginBottom: 8 }}>Update bank details</Btn>
          <Card style={{ marginBottom: 10, padding: "12px 14px" }}>
            <Label>TAX INFORMATION</Label>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.textMuted }}>Tax ID / ABN</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>•••• •••• 431</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.textMuted }}>Tax residency</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>Australia</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontSize: 12, color: T.textMuted }}>W-8BEN / W-9</span>
              <Badge color={T.green}>On file ✓</Badge>
            </div>
          </Card>
          <Btn variant="secondary" small full>Update tax information</Btn>
          <div style={{ padding: "10px 12px", borderRadius: 12, background: T.blueDim, border: `1px solid ${T.blue}20`, marginTop: 10 }}>
            <p style={{ fontSize: 11, color: T.blue, lineHeight: 1.5 }}>💡 Need help with tax or banking setup? Contact support — we'll walk you through it.</p>
          </div>
        </>
      )}
      <Divider />
      <Label>CONSENT HISTORY</Label>
      <Card><p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>Terms accepted: March 16, 2026<br />Privacy policy: March 16, 2026<br />AI mediation agreement: March 16, 2026</p></Card>
    </div>
  </ScreenWrap>
);

const DeleteScreen = ({ onBack }) => {
  const [confirm, setConfirm] = useState("");
  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 13, color: T.textMuted }}>Delete Account</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .4s ease" }}>
          <Card style={{ background: T.dangerDim, border: `1px solid ${T.danger}30`, marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.danger, marginBottom: 6 }}>This is permanent</h3>
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>Your account will be deleted immediately. Personal data removed or anonymised. Financial/legal records retained as required by law.</p>
          </Card>
          <Label>TYPE "DELETE" TO CONFIRM</Label>
          <Input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="DELETE" />
          <div style={{ height: 16 }} />
          <Btn variant="danger" full disabled={confirm !== "DELETE"}>Delete my account</Btn>
        </div>
      </ScreenWrap>
    </>
  );
};

const AdminDashboard = () => (
  <ScreenWrap>
    <div style={{ animation: "slideUp .4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Admin</h2>
        <Badge color={T.purple}>Super Admin</Badge>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard label="Live Queue" value="24" color={T.accent} icon="📊" sub="by tier ↗" />
        <StatCard label="Avg Wait" value="14m" color={T.blue} icon="⏱️" sub="by tier ↗" />
        <StatCard label="Active Sessions" value="8" color={T.warm} icon="🔴" sub="drillable ↗" />
        <StatCard label="Healers Online" value="31" color={T.accent} icon="👤" sub="by status ↗" />
        <StatCard label="Failed Matches" value="2" color={T.danger} icon="❌" sub="last hour ↗" />
        <StatCard label="Safety Incidents" value="0" color={T.accent} icon="🛡️" sub="none pending" />
        <StatCard label="Revenue Today" value="$4,280" color={T.accent} icon="💰" sub="free: 45 · paid: 18" />
        <StatCard label="Success Rate" value="72%" color={T.accent} icon="📈" sub="meaningful change" />
      </div>
      <Label>SPECIALIST ROUTING — TODAY</Label>
      <Card style={{ marginBottom: 12 }}>
        {CONDITIONS_DATA.filter(c => c.beatPlacebo).map((c, i) => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < CONDITIONS_DATA.filter(x => x.beatPlacebo).length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>{c.icon}</span><span style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 12, color: T.textMuted }}>{Math.floor(Math.random() * 5 + 1)} specialists online</span><Badge color={T.green}>Active</Badge></div>
          </div>
        ))}
      </Card>
      <Label>QUALIFICATION THRESHOLDS</Label>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: T.textMuted }}>Min sessions for general qualification</span><span style={{ fontSize: 13, fontWeight: 600 }}>20</span></div><ProgressBar value={20} max={20} color={T.blue} /></div>
        <div style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: T.textMuted }}>Threshold to beat placebo</span><span style={{ fontSize: 13, fontWeight: 600 }}>75%</span></div><ProgressBar value={75} color={T.accent} /></div>
        <div style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: T.textMuted }}>Min sessions for specialty path</span><span style={{ fontSize: 13, fontWeight: 600 }}>8 per condition</span></div><ProgressBar value={8} max={20} color={T.warm} /></div>
        <div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: T.textMuted }}>Session timeout (seconds)</span><span style={{ fontSize: 13, fontWeight: 600 }}>300</span></div><ProgressBar value={300} max={600} color={T.textDim} /></div>
      </Card>
      <Label>QUICK ACTIONS</Label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["Queue Config", "Healer Ops", "Specialist Routing", "Pricing", "Payouts", "Refunds", "Safety Queue", "Charlie Pool", "Emergency"].map(a => <Btn key={a} variant="secondary" small style={{ flex: "1 1 45%" }}>{a}</Btn>)}
      </div>
      <Divider />
      <p style={{ fontSize: 10, color: T.textDim }}>All threshold changes logged with admin ID + timestamp.</p>
    </div>
  </ScreenWrap>
);

/* ═══════════════════════════════════════════════════════════════
   ADMIN: Live Queue Dashboard
   ═══════════════════════════════════════════════════════════════ */
const AdminScreen = ({ onBack }) => {
  const [patients, setPatients] = React.useState(3);
  const [committed, setCommitted] = React.useState(4);
  const w = systemWindow(patients, committed);
  const freeW = computeWait("free", patients, committed);
  const todayW = computeWait("today", patients, committed);
  const weekW = computeWait("week", patients, committed);
  const util = Math.min(100, Math.round((patients / Math.max(committed, 1)) * 50));
  const status = patients > committed * 2 ? "high_demand" : committed > patients * 2 ? "oversupply" : "balanced";
  const statusColor = { high_demand: T.danger, oversupply: T.blue, balanced: T.green };
  const statusBg = { high_demand: T.dangerDim, oversupply: T.blueDim, balanced: T.greenDim };

  const waitBadge = (mins) => {
    const s = mins < 15 ? "good" : mins < 45 ? "warn" : "bad";
    const colors = { good: T.green, warn: T.warm, bad: T.danger };
    const bgs = { good: T.greenDim, warn: T.warmDim, bad: T.dangerDim };
    return <span style={{ fontSize: 13, fontWeight: 500, padding: "3px 12px", borderRadius: 100, background: bgs[s], color: colors[s] }}>{fmtWait(mins)}</span>;
  };

  return (
    <>
      <Header left={<BackBtn onClick={onBack} />} center={<span style={{ fontSize: 14, fontWeight: 600 }}>Admin — live queue</span>} />
      <ScreenWrap>
        <div style={{ animation: "slideUp .3s ease" }}>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            {[{ l: "Patients", v: patients, s: "in queue" }, { l: "Committed", v: committed, s: "healers" }, { l: "Utilisation", v: util + "%", s: "supply/demand" }].map(x => (
              <div key={x.l} style={{ background: "#FAFAFA", border: `1px solid ${T.border}`, borderRadius: 16, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4 }}>{x.l}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800 }}>{x.v}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{x.s}</div>
              </div>
            ))}
          </div>

          {/* Wait times */}
          <Card style={{ background: "#FAFAFA", marginBottom: 14 }}>
            <Label>Live wait times</Label>
            {[{ label: "Free tier", w: freeW }, { label: "Super — Today", w: todayW }, { label: "Super — Week", w: weekW }].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.textMuted }}>{r.label}</span>
                {waitBadge(r.w)}
              </div>
            ))}
          </Card>

          {/* System decisions */}
          <Card style={{ background: "#FAFAFA", marginBottom: 14 }}>
            <Label>System decisions right now</Label>
            <p style={{ fontSize: 13, color: T.text, marginBottom: 6 }}>Asking healers: <strong>"Available in next {w} min?"</strong></p>
            <p style={{ fontSize: 13, color: T.textMuted }}>Pinging ~{Math.min(committed * 4, 60)} healers per new patient · {committed} have said yes</p>
          </Card>

          {/* Sliders */}
          <Card style={{ background: "#FAFAFA", marginBottom: 14 }}>
            <Label>Simulate conditions</Label>
            {[{ label: "Patients in queue", val: patients, set: setPatients }, { label: "Committed healers", val: committed, set: setCommitted }].map((s, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: T.textMuted }}>{s.label}</span>
                  <span style={{ fontWeight: 500 }}>{s.val}</span>
                </div>
                <input type="range" min="1" max="15" value={s.val} step="1" onChange={e => s.set(+e.target.value)} style={{ width: "100%" }} />
              </div>
            ))}
          </Card>

          {/* Health callout */}
          <div style={{ borderLeft: `3px solid ${statusColor[status]}`, borderRadius: "0 14px 14px 0", padding: "12px 16px", background: statusBg[status] }}>
            <p style={{ fontSize: 13, color: statusColor[status], lineHeight: 1.6 }}>
              {status === "high_demand" && <><strong>High demand.</strong> Wait times rising. Increasing ping volume and shortening commitment window to {w} min.</>}
              {status === "oversupply" && <><strong>Oversupply.</strong> Healers are waiting. Extend commitment windows — less urgency.</>}
              {status === "balanced" && <><strong>Balanced.</strong> Supply and demand are well matched. Wait times are healthy.</>}
            </p>
          </div>
          <div style={{ height: 20 }} />
        </div>
      </ScreenWrap>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   QUEUE STATUS CARD — Collapsible mini-queue for caseHome
   ═══════════════════════════════════════════════════════════════ */
const QueueStatusCard = ({ tier = "free", userCondition = "migraine", atFront, onExpand, onReady, onUpgrade, onLeave }) => {
  const [expanded, setExpanded] = React.useState(false);
  const condition = CONDITIONS_DATA.find(c => c.id === userCondition) || CONDITIONS_DATA[1];
  const successRate = condition.successByTier?.[tier] || 0;

  const tiers = [
    { id: "free", name: "Healer Testing", price: "Free", wait: "10–20 min", color: T.accent },
    { id: "line", name: "Super — Line", price: "$50", wait: "3–4 weeks", color: T.accent },
    { id: "week", name: "Super — This Week", price: "$150", wait: "1–7 days", color: T.blue },
    { id: "today", name: "Super — Today", price: "$350", wait: "< 2 hrs", color: T.warm },
  ];
  const currentTier = tiers.find(t => t.id === tier) || tiers[0];

  if (atFront) {
    return (
      <Card style={{ marginBottom: 14, border: `2px solid ${T.green}50`, background: T.greenDim, animation: "slideUp .4s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.green + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, border: `2px solid ${T.green}40`, animation: "breathe 2s ease-in-out infinite" }}>✦</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.green }}>You're at the front of the queue!</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Start when your symptoms are active</div>
          </div>
        </div>
        <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.6)", border: `1px solid ${T.green}20`, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12 }}>{condition.icon}</span>
              <span style={{ fontSize: 12, color: T.textMuted }}>{condition.label} · {currentTier.name}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: successRate >= 50 ? T.green : T.warm }}>{successRate}% success</span>
          </div>
        </div>
        <Btn onClick={onReady} full style={{ background: T.green }}> I'm ready — start session</Btn>
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <span style={{ fontSize: 11, color: T.textMuted }}>~15 min to connect with a healer</span>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 14, border: `1px solid ${currentTier.color}30`, background: `${currentTier.color}06`, animation: "slideUp .4s ease" }}>
      <div onClick={() => setExpanded(e => !e)} style={{ cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: currentTier.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={currentTier.color} strokeWidth="1.5" strokeDasharray="4 2" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>In queue — {currentTier.name}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>Est. wait: {currentTier.wait} · {condition.label}</div>
            </div>
          </div>
          <span style={{ fontSize: 16, color: T.textMuted, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, animation: "fadeIn .2s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>Session type</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: currentTier.color }}>{currentTier.name} · {currentTier.price}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>Success rate for {condition.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: successRate >= 50 ? T.green : T.warm }}>{successRate}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>Estimated wait</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{currentTier.wait}</span>
          </div>

          <div style={{ padding: "8px 10px", borderRadius: 10, background: T.warmDim, border: `1px solid ${T.warm}25`, marginBottom: 10 }}>
            <p style={{ fontSize: 11, color: T.warm, lineHeight: 1.5 }}>⚡ Start with active symptoms for a significantly higher chance of success.</p>
          </div>

          {tier !== "today" && (
            <div style={{ marginBottom: 8 }}>
              <button onClick={onUpgrade} style={{ width: "100%", padding: "9px 14px", borderRadius: 12, border: `1px solid ${T.accent}30`, background: T.accentDim, color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Upgrade for a faster session →</button>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" small onClick={onExpand} style={{ flex: 1 }}>View full queue</Btn>
            <button onClick={onLeave} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${T.danger}25`, background: T.dangerDim, color: T.danger, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Leave</button>
          </div>
        </div>
      )}
    </Card>
  );
};


/* ═══════════════════════════════════════════════════════════════
   MAIN APP — Navigation State Machine
   ═══════════════════════════════════════════════════════════════ */
export default function EnnieApp() {
  const [screen, setScreen] = useState("landing");
  const [role, setRole] = useState("case");
  const [tab, setTab] = useState("home");
  const [pins, setPins] = useState([]);
  const [baselinePins, setBaselinePins] = useState([]);
  const [finalPins, setFinalPins] = useState([]);
  const [age, setAge] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [showCharlie, setShowCharlie] = useState(false);
  const [atQueueFront, setAtQueueFront] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [queueTier, setQueueTier] = useState("free");
  const [skillBuildCondition, setSkillBuildCondition] = useState(null);
  const [healerTotalHours, setHealerTotalHours] = useState(1);
  const [mapOpen, setMapOpen] = useState(true);
  const [userCondition, setUserCondition] = useState("migraine");
  const [isHealerOnboarded, setIsHealerOnboarded] = useState(false);

  const go = (s) => setScreen(s);

  const caseTabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "billing", icon: "💳", label: "Billing" },
    { id: "history", icon: "📋", label: "History" },
    { id: "support", icon: "💬", label: "Support" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];
  const healerTabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "earnings", icon: "💰", label: "Earnings" },
    { id: "history", icon: "📋", label: "History" },
    { id: "support", icon: "💬", label: "Support" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];
  const adminTabs = [
    { id: "home", icon: "📊", label: "Dashboard" },
    { id: "profile", icon: "⚙️", label: "Settings" },
  ];

  const startFreeSession = () => { setBaselinePins(pins.map(p => ({ ...p }))); setInQueue(true); setQueueTier("free"); go("queue"); };
  const endSession = () => { setFinalPins(pins.map(p => ({ ...p, severity: Math.max(0, p.severity - Math.floor(Math.random() * 4 + 2)) }))); go("sessionEnd"); };

  const screenMap = [
    { group: "Case Journey", color: T.accent, items: [
      { id: "landing", num: 1, label: "Landing" },
      { id: "signup", num: 2, label: "Sign Up" },
      { id: "patientOnboard", num: "2b", label: "Patient Onboarding", star: true },
      { id: "ageGate", num: 3, label: "Age Gate" },
      { id: "consent", num: "3a", label: "UCI Research Consent" },
      { id: "queueHold", num: "3c", label: "Queue Hold Explainer" },
      { id: "intake", num: 4, label: "Intake — AI + Body Map", star: true },
      { id: "ineligible", num: "5a", label: "No Active Symptoms" },
      { id: "routing", num: 5, label: "Eligibility & SKUs" },
      { id: "queue", num: 6, label: "Queue + Tips" },
      { id: "symptomConfirm", num: 8, label: "Symptom Confirmation" },
      { id: "connecting", num: "8b", label: "Connecting to Healer" },
      { id: "liveSession", num: 9, label: "Live Session Room", star: true },
      { id: "sessionEnd", num: 10, label: "Session End — Before/After" },
      { id: "share", num: "10b", label: "Rate & Share" },
      { id: "followUp", num: 11, label: "Follow-Up Check-in" },
      { id: "noResult", num: "11b", label: "No Result — Support", star: true },
      { id: "caseHome", num: "—", label: "Case Home" },
    ]},
    { group: "Healer Journey", color: T.warm, items: [
      { id: "healerOnboard", num: 12, label: "Healer Onboarding" },
      { id: "healerHome", num: 13, label: "Healer Dashboard" },
      { id: "specializations", num: "13b", label: "Specialization Engine", star: true },
      { id: "skillBuildConfirm", num: "13c", label: "Skill-Build Confirm" },
      { id: "healerPing", num: "13c", label: "Step 1 — availability ping ★", star: true },
      { id: "healerCommitted", num: "13d", label: "Step 2 — committed, waiting" },
      { id: "matchNotif", num: 14, label: "Smart Match (5s claim)" },
      { id: "healerSession", num: 15, label: "Healer Session + Tools Log", star: true },
      { id: "healerPost", num: 16, label: "Healer Post-Session" },
    ]},
    { group: "Paid Flow", color: T.purple, items: [
      { id: "tiers", num: 17, label: "Tier Selection" },
      { id: "payment", num: 18, label: "Payment" },
      { id: "payConfirm", num: "18b", label: "Payment Confirmed" },
    ]},
    { group: "Group Healing", color: T.purple, items: [
      { id: "groupSchedule", num: "G1", label: "Schedule & Pricing" },
      { id: "groupConfirm", num: "G2", label: "Booking Confirmed" },
      { id: "groupIntake", num: "G3", label: "Group Intake" },
      { id: "groupConnecting", num: "G3b", label: "Group Connecting" },
      { id: "groupSession", num: "G4", label: "Group Live Session", star: true },
    ]},
    { group: "Charlie Featured", color: T.blue, items: [
      { id: "charlieReveal", num: 19, label: "Charlie Reveal (Modal)" },
    ]},
    { group: "Shared / Account", color: T.textMuted, items: [
      { id: "caseHome_profile", num: 20, label: "Profile & Settings" },
      { id: "caseHome_history", num: 21, label: "Session History" },
      { id: "caseHome_support", num: 22, label: "Support & Reporting" },
      { id: "deleteAccount", num: 23, label: "Account Deletion" },
    ]},
    { group: "Admin", color: T.purple, items: [
      { id: "adminHome", num: "A", label: "Admin — live queue engine ★", star: true },
    ]},
  ];

  const handleMapNav = (id) => {
    if (id === "caseHome_profile") { setRole("case"); setTab("profile"); go("caseHome"); }
    else if (id === "caseHome_history") { setRole("case"); setTab("history"); go("caseHome"); }
    else if (id === "caseHome_support") { setRole("case"); setTab("support"); go("caseHome"); }
    else if (id === "charlieReveal") { setShowCharlie(true); }
    else if (id === "healerHome") { setRole("healer"); setTab("home"); setIsHealerOnboarded(true); go("healerHome"); }
    else if (id === "adminHome") { setRole("admin"); setTab("home"); go("adminHome"); }
    else if (id === "caseHome") { setRole("case"); setTab("home"); go("caseHome"); }
    else if (id === "specializations") { setRole("healer"); go("specializations"); }
    else if (id === "skillBuildConfirm") { setSkillBuildCondition(CONDITIONS_DATA.find(c => c.id === "fibromyalgia")); go("skillBuildConfirm"); }
    else if (id === "availability") { go("healerPing"); }
    else if (id === "healerPing") { go("healerPing"); }
    else if (id === "healerCommitted") { go("healerCommitted"); }
    else if (id === "matchNotif") { go("matchNotif"); }
    else if (id === "intake") { setPins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }, { id: 2, x: 60, y: 35, side: "front", severity: 4 }]); go(id); }
    else if (id === "routing") { setPins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }]); go(id); }
    else if (id === "liveSession") { setPins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }]); setBaselinePins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }]); go(id); }
    else if (id === "sessionEnd") { setBaselinePins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }]); setFinalPins([{ id: 1, x: 52, y: 55, side: "front", severity: 3 }]); go(id); }
    else if (id === "symptomConfirm") { setPins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }]); go(id); }
    else if (id === "followUp") { setFinalPins([{ id: 1, x: 52, y: 55, side: "front", severity: 3 }]); go(id); }
    else if (id === "groupSession") { setPins([{ id: 1, x: 52, y: 55, side: "front", severity: 6 }]); go(id); }
    else if (id === "noResult") { setBaselinePins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }]); setFinalPins([{ id: 1, x: 52, y: 55, side: "front", severity: 7 }]); go(id); }
    else if (id === "groupIntake") { setPins([]); go(id); }
    else { go(id); }
    setMapOpen(false);
  };

  const containerStyle = {
    width: "100%", maxWidth: 420, margin: "0 auto", height: "100dvh", display: "flex",
    flexDirection: "column", background: T.bg, color: T.text, position: "relative",
    fontFamily: "'DM Sans', -apple-system, sans-serif", fontSize: 14, overflow: "hidden",
  };

  const renderScreen = () => {
    switch (screen) {
      case "landing": return <LandingScreen onGetStarted={() => go("signup")} onJoinHealer={() => { setRole("healer"); go("signup"); }} onLogin={() => go("signup")} />;
      case "signup": return <SignUpScreen onContinue={() => go("patientOnboard")} onBack={() => go("landing")} />;
      case "patientOnboard": return <PatientOnboardScreen onContinue={() => go("ageGate")} onBack={() => go("signup")} />;
      case "ageGate": return <AgeGateScreen onContinue={(a) => { setAge(a); if (role === "healer") go("healerOnboard"); else go("consent"); }} onBack={() => go("patientOnboard")} />;
      case "consent": return <ConsentScreen onAccept={() => go("intake")} onBack={() => go("ageGate")} />;
      case "queueHold": return <QueueHoldScreen onContinue={() => go("tiers")} onBack={() => go("caseHome")} />;
      case "intake": return <IntakeScreen pins={pins} setPins={setPins} onJoinQueue={() => go("routing")} onPaidSession={() => go("routing")} onIneligible={() => go("ineligible")} onBack={() => go("consent")} />;
      case "ineligible": return <IneligibleScreen onPaid={(t) => { setSelectedTier(t); go("payment"); }} onGroup={() => go("groupSchedule")} onClose={() => go("caseHome")} />;
      case "routing": return <RoutingScreen eligible={true} onFree={startFreeSession} onPaid={(t) => { setSelectedTier(t); go("payment"); }} onGroup={() => go("groupSchedule")} onBack={() => go("intake")} />;
      case "queue": return <QueueScreen selectedTier={selectedTier?.name === "Today" ? "today" : selectedTier?.name === "Week" ? "week" : selectedTier?.name === "Line" ? "line" : "free"} userCondition={userCondition} atFront={atQueueFront} onReady={() => go("symptomConfirm")} onGoHome={() => { setInQueue(true); setQueueTier(selectedTier?.name === "Today" ? "today" : selectedTier?.name === "Week" ? "week" : selectedTier?.name === "Line" ? "line" : "free"); go("caseHome"); }} onLeave={() => { setInQueue(false); setAtQueueFront(false); go("caseHome"); }} onUpgrade={(t) => { setSelectedTier(t); go("payment"); }} />;
      case "symptomConfirm": return <SymptomConfirmScreen pins={pins} setPins={setPins} onStart={() => go("connecting")} onBack={() => go("queue")} onExpired={() => { setAtQueueFront(true); setInQueue(true); go("queue"); }} />;
      case "connecting": return <ConnectingScreen onConnected={() => go("liveSession")} onCancel={() => go("symptomConfirm")} />;
      case "liveSession": return <LiveSessionScreen pins={pins} setPins={setPins} baselinePins={baselinePins} onEnd={endSession} />;
      case "sessionEnd": return <SessionEndScreen baselinePins={baselinePins} finalPins={finalPins} onHome={() => go("caseHome")} onThankYou={() => go("share")} onNoResult={() => go("noResult")} />;
      case "share": return <ShareScreen baselinePins={baselinePins} finalPins={finalPins.length > 0 ? finalPins : [{ id: 1, x: 52, y: 55, side: "front", severity: 2 }]} userCondition={userCondition} onDone={() => go("caseHome")} />;
      case "followUp": return <FollowUpScreen onPositive={() => go("share")} onNeutral={() => go("noResult")} pins={finalPins.length > 0 ? finalPins : [{ id: 1, x: 52, y: 55, side: "front", severity: 3 }]} setPins={setFinalPins} />;
      case "noResult": return <NoResultScreen baselinePins={baselinePins} finalPins={finalPins.length > 0 ? finalPins : [{ id: 1, x: 52, y: 55, side: "front", severity: 7 }]} userCondition={userCondition} wasPaid={!!selectedTier} onHome={() => go("caseHome")} onHuman={() => go("caseHome")} />;
      case "healerOnboard": return <HealerOnboardScreen onComplete={() => { setIsHealerOnboarded(true); go("healerHome"); }} onBack={() => go("ageGate")} />;
      case "specializations": return <SpecializationScreen onBack={() => go("healerHome")} onStartSkillBuild={(c) => { setSkillBuildCondition(c); go("skillBuildConfirm"); }} />;
      case "skillBuildConfirm": return <SkillBuildConfirmScreen condition={skillBuildCondition || CONDITIONS_DATA[3]} onConfirm={() => go("healerPing")} onBack={() => go("specializations")} />;
      case "healerPing": return <HealerPingScreen skillBuildCondition={skillBuildCondition} onYes={(h) => { setHealerTotalHours(h); go("healerCommitted"); }} onNo={() => go("healerHome")} />;
      case "healerCommitted": return <HealerCommittedScreen skillBuildCondition={skillBuildCondition} totalHours={healerTotalHours} onMatch={() => go("matchNotif")} onBack={() => go("healerHome")} />;
      case "availability": return <HealerPingScreen skillBuildCondition={skillBuildCondition} onYes={(h) => { setHealerTotalHours(h); go("healerCommitted"); }} onNo={() => go("healerHome")} />;
      case "matchNotif": return <SmartMatchScreen skillBuildCondition={skillBuildCondition} onClaim={() => go("healerSession")} onDecline={() => go("availability")} />;
      case "healerSession": return <HealerSessionScreen onEnd={() => go("healerPost")} />;
      case "healerPost": return <HealerPostScreen onReady={() => go("healerPing")} onHome={() => go("healerHome")} />;
      case "adminHome": return <AdminScreen onBack={() => go("landing")} />;
      case "tiers": return <TierScreen onSelect={(t) => { setSelectedTier(t); go("payment"); }} onGroup={() => go("groupSchedule")} onBack={() => go("intake")} />;
      case "groupSchedule": return <GroupScheduleScreen onSingle={() => go("groupConfirm")} onSubscribe={() => go("groupConfirm")} onBack={() => go("routing")} />;
      case "groupConfirm": return <GroupConfirmScreen sessions={[groupSessions[0], groupSessions[2]]} isSub={false} onIntake={() => { setPins([]); go("groupIntake"); }} onBack={() => go("groupSchedule")} />;
      case "groupIntake": return <GroupIntakeScreen pins={pins} setPins={setPins} onDone={() => go("groupConnecting")} onBack={() => go("groupConfirm")} />;
      case "groupConnecting": return <ConnectingScreen isGroup onConnected={() => go("groupSession")} onCancel={() => go("groupConfirm")} />;
      case "groupSession": return <GroupSessionScreen pins={pins.length > 0 ? pins : [{ id: 1, x: 52, y: 55, side: "front", severity: 6 }]} setPins={setPins} onEnd={() => { setFinalPins(pins.map(p => ({ ...p, severity: Math.max(0, p.severity - Math.floor(Math.random() * 3 + 1)) }))); go("sessionEnd"); }} />;
      case "payment": return <PaymentScreen tier={selectedTier} onPay={() => go("payConfirm")} onBack={() => go("tiers")} />;
      case "payConfirm": return <PaymentConfirmScreen tier={selectedTier} onContinue={() => go("queue")} />;
      case "deleteAccount": return <DeleteScreen onBack={() => go(role === "healer" ? "healerHome" : "caseHome")} />;

      case "healerHome":
        return (
          <>
            <Header
              left={<Logo />}
              right={<button onClick={() => { setRole("case"); setTab("home"); go("caseHome"); }} style={{ padding: "5px 12px", borderRadius: 10, border: `1px solid ${T.accent}30`, background: T.accentDim, color: T.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 12 }}>👤</span> User Section
              </button>}
            />
            {tab === "home" && <HealerHomeScreen onGoOnline={() => go("healerPing")} onSpecializations={() => go("specializations")} />}
            {tab === "earnings" && <HealerEarningsScreen />}
            {tab === "history" && <HistoryScreen />}
            {tab === "support" && <SupportScreen />}
            {tab === "profile" && <><ProfileScreen role={role} setRole={(r) => { setRole(r); if (r === "case") go("caseHome"); else if (r === "admin") go("adminHome"); }} /><div style={{ padding: "0 16px 8px" }}><Btn variant="danger" small full onClick={() => go("deleteAccount")}>Delete account</Btn></div></>}
            <TabBar tabs={healerTabs} active={tab} onTab={setTab} />
          </>
        );

      case "adminHome":
        return (
          <>
            <Header left={<Logo />} right={<Badge color={T.purple}>Admin</Badge>} />
            {tab === "home" && <AdminDashboard />}
            {tab === "profile" && <ProfileScreen role={role} setRole={(r) => { setRole(r); if (r === "case") go("caseHome"); else if (r === "healer") go("healerHome"); }} />}
            <TabBar tabs={adminTabs} active={tab} onTab={setTab} />
          </>
        );

      case "caseHome":
        return (
          <>
            <Header
              left={<Logo />}
              right={<button onClick={() => {
                if (isHealerOnboarded) { setRole("healer"); setTab("home"); go("healerHome"); }
                else { setRole("healer"); go("healerOnboard"); }
              }} style={{ padding: "5px 12px", borderRadius: 10, border: `1px solid ${T.warm}30`, background: T.warmDim, color: T.warm, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 12 }}>✦</span> {isHealerOnboarded ? "Healer" : "Healer Testing"}
              </button>}
            />
            {tab === "home" && (
              <ScreenWrap>
                <div style={{ animation: "slideUp .4s ease" }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>Welcome back</h2>

                  {/* Priority 1: Queue status if in queue */}
                  {inQueue && (
                    <QueueStatusCard
                      tier={queueTier}
                      userCondition={userCondition}
                      atFront={atQueueFront}
                      onExpand={() => go("queue")}
                      onReady={() => { go("symptomConfirm"); }}
                      onUpgrade={() => go("tiers")}
                      onLeave={() => { setInQueue(false); setAtQueueFront(false); }}
                    />
                  )}

                  {/* Priority 2: Primary CTA — start a session */}
                  {!inQueue && (
                    <Card style={{ marginBottom: 14, border: `2px solid ${T.accent}30`, background: T.accentDim, cursor: "pointer" }} onClick={() => { setPins([]); go("intake"); }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 52, height: 52, borderRadius: "50%", background: T.accent + "25", border: `2px solid ${T.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✦</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: T.accent }}>Start a session</div>
                          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Free healer testing · ~5 minutes</div>
                        </div>
                        <span style={{ color: T.accent, fontSize: 20 }}>→</span>
                      </div>
                    </Card>
                  )}

                  {/* Progress snapshot */}
                  <Card style={{ marginBottom: 14, padding: "16px" }}>
                    <div style={{ display: "flex", gap: 0 }}>
                      <div style={{ flex: 1, textAlign: "center", borderRight: `1px solid ${T.border}` }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: T.accent }}>3</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>sessions</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "center", borderRight: `1px solid ${T.border}` }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: T.green }}>−11</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>points reduced</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: T.purple }}>67%</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>improved</div>
                      </div>
                    </div>
                  </Card>

                  {/* Symptom trend */}
                  <Card style={{ marginBottom: 14, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Symptom trend</span>
                      <Badge color={T.green}>↓ Improving</Badge>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 50 }}>
                      {[7, 5, 6, 3, 2, 4].map((v, i) => <div key={i} style={{ flex: 1, height: `${v * 8}%`, background: `linear-gradient(180deg, ${v <= 3 ? T.green : T.accent}80, ${v <= 3 ? T.green : T.accent}20)`, borderRadius: 4, minHeight: 4 }} />)}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: T.textDim }}>Session 1</span>
                      <span style={{ fontSize: 10, color: T.textDim }}>Latest</span>
                    </div>
                  </Card>

                  {/* Research data */}
                  <ResultsDataPanel compact />

                  {/* Recent sessions — compact */}
                  <Label>RECENT SESSIONS</Label>
                  {sessionHistory.slice(0, 3).map((s, i) => (
                    <Card key={i} onClick={() => setTab("history")} style={{ marginBottom: 8, padding: "10px 14px", cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{s.issue}</span>
                          <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 8 }}>{s.date}</span>
                        </div>
                        <Badge color={s.before - s.after >= 2 ? T.green : T.textMuted}>−{s.before - s.after}</Badge>
                      </div>
                    </Card>
                  ))}

                  <Divider />

                  {/* Session options */}
                  <Label>MORE OPTIONS</Label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <Card style={{ flex: 1, cursor: "pointer", textAlign: "center", padding: "14px 8px" }} onClick={() => go("tiers")}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>⭐</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>Super Session</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>Verified healers</div>
                    </Card>
                    <Card style={{ flex: 1, cursor: "pointer", textAlign: "center", padding: "14px 8px" }} onClick={() => go("groupSchedule")}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>👥</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>Group Healing</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>From $19.99/mo</div>
                    </Card>
                    <Card style={{ flex: 1, cursor: "pointer", textAlign: "center", padding: "14px 8px" }} onClick={() => go("followUp")}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>📋</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>Check-in</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>24hr follow-up</div>
                    </Card>
                  </div>

                  <Divider />

                  {/* Testimonial Ad Dashboard */}
                  <Label>YOUR TESTIMONIALS</Label>
                  <Card style={{ marginBottom: 12, border: `1px solid ${T.accent}25`, background: `${T.accent}04` }}>
                    {/* Active ad */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`, border: `1px solid ${T.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🎥</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>Migraine testimonial</span>
                          <Badge color={T.green}>Live</Badge>
                        </div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>Recorded Mar 20 · Running on Meta & YouTube</div>
                      </div>
                    </div>

                    {/* Performance stats */}
                    <div style={{ display: "flex", gap: 0, padding: "10px 0", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ flex: 1, textAlign: "center", borderRight: `1px solid ${T.border}` }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: T.accent }}>12.4K</div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>Views</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "center", borderRight: `1px solid ${T.border}` }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: T.blue }}>847</div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>Clicks</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "center", borderRight: `1px solid ${T.border}` }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: T.purple }}>63</div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>Sign-ups</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: T.green }}>$189</div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>Earned</div>
                      </div>
                    </div>

                    {/* Earnings breakdown */}
                    <div style={{ padding: "10px 0 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: T.textMuted }}>Session credit balance</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.green }}>$189.00</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: T.textMuted }}>Used so far</span>
                        <span style={{ fontSize: 12 }}>$50.00 (1 Super Session)</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: T.textMuted }}>Remaining</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.accent }}>$139.00</span>
                      </div>
                    </div>
                  </Card>

                  {/* Free month from recording */}
                  <Card style={{ marginBottom: 12, background: T.greenDim, border: `1px solid ${T.green}25` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>🎁</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.green }}>Free Group Healing month</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>3 of 8 sessions used · Expires April 20</div>
                      </div>
                      <Badge color={T.green}>Active</Badge>
                    </div>
                  </Card>

                  {/* Weekly performance chart */}
                  <Card style={{ marginBottom: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Weekly ad performance</span>
                      <Badge color={T.accent}>↑ Growing</Badge>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 40 }}>
                      {[8, 12, 15, 22, 31, 42, 58].map((v, i) => (
                        <div key={i} style={{ flex: 1, height: `${(v / 60) * 100}%`, background: `linear-gradient(180deg, ${T.accent}90, ${T.accent}30)`, borderRadius: 3, minHeight: 3 }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 9, color: T.textDim }}>4 weeks ago</span>
                      <span style={{ fontSize: 9, color: T.textDim }}>This week</span>
                    </div>
                    <p style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>58 sign-ups from your ad this week — your best week yet</p>
                  </Card>

                  {/* Record another */}
                  <Card style={{ marginBottom: 12, cursor: "pointer", border: `1px solid ${T.purple}25` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: T.purpleDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>➕</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Record another testimonial</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>Had a great session recently? A new video could earn even more.</div>
                      </div>
                      <span style={{ color: T.purple, fontSize: 14 }}>→</span>
                    </div>
                  </Card>

                  <div style={{ height: 8 }} />
                </div>
              </ScreenWrap>
            )}
            {tab === "billing" && (
              <ScreenWrap>
                <div style={{ animation: "slideUp .4s ease" }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Billing</h2>

                  {/* Spending summary */}
                  <Card style={{ marginBottom: 14, padding: "18px 16px" }}>
                    <div style={{ textAlign: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: 1.2 }}>TOTAL SPENT</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: -2, color: T.text }}>$1,240</div>
                    </div>
                    <div style={{ display: "flex", gap: 0 }}>
                      <div style={{ flex: 1, textAlign: "center", borderRight: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.accent }}>$429</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>This month</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "center", borderRight: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.purple }}>8</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>Paid sessions</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.blue }}>3</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>Free sessions</div>
                      </div>
                    </div>
                  </Card>

                  {/* Active subscription */}
                  <Label>SUBSCRIPTION</Label>
                  <Card style={{ marginBottom: 14, border: `1px solid ${T.purple}25`, background: `${T.purple}06` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.purpleDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👥</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.purple }}>Group Healing</div>
                          <div style={{ fontSize: 12, color: T.textMuted }}>Monthly subscription</div>
                        </div>
                      </div>
                      <Badge color={T.green}>Active</Badge>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Plan</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>8 sessions/month</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Price</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.purple }}>$19.99/mo</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Sessions used</span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>5 of 8 this month</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Next billing</span>
                      <span style={{ fontSize: 12 }}>April 10, 2026</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Payment method</span>
                      <span style={{ fontSize: 12 }}>Visa •••• 4242</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <Btn variant="secondary" small style={{ flex: 1 }}>Change plan</Btn>
                      <Btn variant="danger" small style={{ flex: 1 }}>Cancel subscription</Btn>
                    </div>
                    <p style={{ fontSize: 10, color: T.textDim, marginTop: 8, lineHeight: 1.5 }}>Cancellation takes effect at end of billing period. Remaining sessions can still be used.</p>
                  </Card>

                  {/* Payment history */}
                  <Label>PAYMENT HISTORY</Label>
                  {[
                    { date: "Mar 28", desc: "Super — Today", amount: "$350", method: "Visa •••• 4242", ref: "EN-48291", status: "paid" },
                    { date: "Mar 20", desc: "Super — Line", amount: "$50", method: "Visa •••• 4242", ref: "EN-37124", status: "paid" },
                    { date: "Mar 10", desc: "Group Healing (monthly)", amount: "$19.99", method: "Visa •••• 4242", ref: "EN-28490", status: "paid" },
                    { date: "Feb 28", desc: "Super — Week", amount: "$150", method: "Apple Pay", ref: "EN-19283", status: "paid" },
                    { date: "Feb 10", desc: "Group Healing (monthly)", amount: "$19.99", method: "Visa •••• 4242", ref: "EN-14720", status: "paid" },
                    { date: "Jan 15", desc: "Super — Today", amount: "$350", method: "Visa •••• 4242", ref: "EN-09371", status: "refunded" },
                  ].map((p, i) => (
                    <Card key={i} style={{ marginBottom: 8, padding: "10px 14px", animation: `slideUp ${.25 + i * .04}s ease` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{p.desc}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: p.status === "refunded" ? T.warm : T.text }}>{p.status === "refunded" ? `−${p.amount}` : p.amount}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: T.textMuted }}>{p.date} · {p.method}</span>
                        <Badge color={p.status === "refunded" ? T.warm : T.green}>{p.status === "refunded" ? "Refunded" : "✓ Paid"}</Badge>
                      </div>
                    </Card>
                  ))}

                  <Divider />

                  {/* Payment methods */}
                  <Label>PAYMENT METHODS</Label>
                  <Card style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 36, height: 24, borderRadius: 4, background: T.blue + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: T.blue }}>VISA</div>
                        <div><div style={{ fontSize: 12, fontWeight: 500 }}>•••• 4242</div><div style={{ fontSize: 10, color: T.textMuted }}>Expires 08/27</div></div>
                      </div>
                      <Badge color={T.green}>Default</Badge>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16 }}></span>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>Apple Pay</span>
                      </div>
                      <span style={{ fontSize: 11, color: T.textMuted }}>Connected</span>
                    </div>
                  </Card>
                  <Btn variant="ghost" small full>+ Add payment method</Btn>

                  <div style={{ padding: "10px 12px", borderRadius: 10, background: T.blueDim, border: `1px solid ${T.blue}20`, marginTop: 12, marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color: T.blue, lineHeight: 1.5 }}>💡 All receipts are emailed automatically. Need a refund? Contact Support.</p>
                  </div>
                </div>
              </ScreenWrap>
            )}
            {tab === "history" && <HistoryScreen />}
            {tab === "support" && <SupportScreen />}
            {tab === "profile" && <><ProfileScreen role={role} setRole={(r) => { setRole(r); if (r === "healer") go("healerHome"); else if (r === "admin") go("adminHome"); }} /><div style={{ padding: "0 16px 8px" }}><Btn variant="danger" small full onClick={() => go("deleteAccount")}>Delete account</Btn></div></>}
            <TabBar tabs={caseTabs} active={tab} onTab={setTab} />
          </>
        );

      default: return <LandingScreen onGetStarted={() => go("signup")} onJoinHealer={() => { setRole("healer"); go("signup"); }} onLogin={() => go("signup")} />;
    }
  };

  return (
    <div style={containerStyle}>
      <GlobalCSS />
      {renderScreen()}
      {showCharlie && <CharlieReveal onAccept={() => setShowCharlie(false)} onDecline={() => setShowCharlie(false)} />}

      {/* Floating Map Button */}
      {!mapOpen && (
        <button onClick={() => setMapOpen(true)} style={{ position: "absolute", bottom: 80, right: 14, zIndex: 40, width: 48, height: 48, borderRadius: 14, background: T.grad, border: "none", color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(155,138,251,0.35), 0 0 0 2px #fff", display: "flex", alignItems: "center", justifyContent: "center" }} title="Screen Map">☰</button>
      )}

      {/* Screen Map Overlay */}
      {mapOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, background: `${T.bg}f8`, backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", animation: "fadeIn .2s ease" }}>
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ENNIE v2.0</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Screen Map — tap any screen to jump</div>
            </div>
            <button onClick={() => setMapOpen(false)} style={{ width: 36, height: 36, borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
            {screenMap.map((group) => (
              <div key={group.group} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: group.color, marginBottom: 8, paddingLeft: 2 }}>{group.group}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {group.items.map((item) => {
                    const isCurrent = screen === item.id ||
                      (item.id === "caseHome_profile" && screen === "caseHome" && tab === "profile") ||
                      (item.id === "caseHome_history" && screen === "caseHome" && tab === "history") ||
                      (item.id === "caseHome_support" && screen === "caseHome" && tab === "support");
                    return (
                      <button key={item.id} onClick={() => handleMapNav(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: isCurrent ? `${group.color}18` : T.card, border: `1px solid ${isCurrent ? group.color + "40" : T.border}`, cursor: "pointer", textAlign: "left", width: "100%", transition: "all .12s" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: isCurrent ? group.color : T.surface, border: `1px solid ${isCurrent ? group.color : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: isCurrent ? T.bg : T.textDim }}>{item.num}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? group.color : T.text }}>
                            {item.label}
                            {item.star && <span style={{ marginLeft: 6, fontSize: 10, color: T.warm }}>★</span>}
                          </div>
                        </div>
                        {isCurrent && <div style={{ width: 8, height: 8, borderRadius: "50%", background: group.color, flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ height: 20 }} />
          </div>
        </div>
      )}
    </div>
  );
}
