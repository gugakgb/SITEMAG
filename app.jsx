// app.jsx — Mentoria MAG · v2
// Cursos no centro, mentor como faixa, fundo tático que evolui com o scroll.

const { useEffect, useRef, useState } = React;

// ── Tweak defaults ─────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "dossie",
  "fonts": "operacional"
} /*EDITMODE-END*/;

const PALETTE_OPTIONS = [
["#0a0a0a", "#B8985A", "#5a6a3a", "#efece4"],
["#1a1d14", "#c8a96a", "#7e8c4e", "#efebd9"],
["#ece4cf", "#8a6a2c", "#3d4a2a", "#1b1a14"],
["#070707", "#d4b06c", "#6c6238", "#f5efde"]];

const PALETTE_KEYS = ["obsidian", "campo", "dossie", "ouro"];
const FONT_OPTIONS = [
{ value: "operacional", label: "Operacional" },
{ value: "editorial", label: "Editorial" },
{ value: "hibrido", label: "Híbrido" }];


// ── Hook: scroll progress (0..1) + scrollY ─────────────────────────────────
function useScrollProgress() {
  const ref = useRef({ s: 0, y: 0 });
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      ref.current.s = max > 0 ? window.scrollY / max : 0;
      ref.current.y = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return ref;
}

// ── Fundo tático em canvas ─────────────────────────────────────────────────
function TacticalBackdrop({ scrollRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let mounted = true,frame;
    const t0 = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth,h = window.innerHeight;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const readPalette = () => {
      const css = getComputedStyle(document.body);
      const gold = css.getPropertyValue("--gold").trim() || "#B8985A";
      const ink = css.getPropertyValue("--ink").trim() || "#efece4";
      const bg = css.getPropertyValue("--bg").trim() || "#0a0a0a";
      const isDossie = document.body.dataset.palette === "dossie";
      return { gold, ink, bg, isDossie };
    };

    const draw = () => {
      if (!mounted) return;
      const w = window.innerWidth,h = window.innerHeight;
      const t = (performance.now() - t0) / 1000;
      const s = scrollRef.current.s;
      const sy = scrollRef.current.y;
      const { gold, ink, isDossie } = readPalette();

      ctx.clearRect(0, 0, w, h);

      // alpha base muda com paleta (dossie é claro, precisa de menos opacidade)
      const aGrid = isDossie ? "18" : "12";
      const aTopo = isDossie ? "28" : "1c";
      const aRadar = isDossie ? "22" : "1a";
      const aScan = isDossie ? "26" : "22";

      // 1) GRID com pan
      const gridSize = 80;
      const ox = (Math.sin(t * 0.05) * 8 + 1000) % gridSize;
      const oy = (sy * 0.18 + 1000) % gridSize;
      ctx.strokeStyle = ink + aGrid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = -gridSize + oy; y < h + gridSize; y += gridSize) {
        ctx.moveTo(0, y);ctx.lineTo(w, y);
      }
      for (let x = -gridSize + ox; x < w + gridSize; x += gridSize) {
        ctx.moveTo(x, 0);ctx.lineTo(x, h);
      }
      ctx.stroke();

      // 2) Major grid (a cada 4 cells) mais visível
      const major = gridSize * 4;
      const mox = (Math.sin(t * 0.05) * 8 + 4000) % major;
      const moy = (sy * 0.18 + 4000) % major;
      ctx.strokeStyle = gold + "1f";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = -major + moy; y < h + major; y += major) {
        ctx.moveTo(0, y);ctx.lineTo(w, y);
      }
      for (let x = -major + mox; x < w + major; x += major) {
        ctx.moveTo(x, 0);ctx.lineTo(x, h);
      }
      ctx.stroke();

      // 3) TOPO LINES (faixas senoidais)
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        const phase = i * 0.7 + t * 0.18;
        const baseY = (i + 0.5) * h / 7 + Math.sin(t * 0.1 + i) * 8 - s * 80;
        ctx.strokeStyle = gold + aTopo;
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += 12) {
          const y =
          baseY +
          Math.sin(x / 90 + phase) * 14 +
          Math.cos(x / 230 - phase * 0.6) * 22 +
          Math.sin(x / 50 + t * 0.4) * 3;
          if (x === -20) ctx.moveTo(x, y);else
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 4) RADAR / CONCENTRIC — centro que se move com scroll
      const cx = w * (0.72 + Math.sin(t * 0.12) * 0.04);
      const cy = h * (0.30 + s * 0.55);
      const ringSpan = 90;
      ctx.strokeStyle = gold + aRadar;
      for (let i = 1; i <= 9; i++) {
        const r = i * ringSpan + t * 16 % ringSpan;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // crosshair
      ctx.strokeStyle = gold + "55";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy);ctx.lineTo(cx + 16, cy);
      ctx.moveTo(cx, cy - 16);ctx.lineTo(cx, cy + 16);
      ctx.stroke();
      ctx.fillStyle = gold;
      ctx.beginPath();ctx.arc(cx, cy, 2, 0, Math.PI * 2);ctx.fill();

      // 5) SCAN LINE — orientado pelo scroll
      const scanY = (s * h * 1.4 + t * 12 % h + 2000) % h;
      const gradH = 80;
      const g = ctx.createLinearGradient(0, scanY - gradH, 0, scanY + gradH);
      g.addColorStop(0, gold + "00");
      g.addColorStop(0.5, gold + aScan);
      g.addColorStop(1, gold + "00");
      ctx.fillStyle = g;
      ctx.fillRect(0, scanY - gradH, w, gradH * 2);
      ctx.fillStyle = gold + "aa";
      ctx.fillRect(0, scanY, w, 1);

      // 6) WAYPOINTS
      const pts = [
      [0.10, 0.22, 0], [0.92, 0.18, 1.4], [0.18, 0.78, 2.1],
      [0.55, 0.12, 3.0], [0.34, 0.58, 1.8], [0.86, 0.74, 0.6],
      [0.08, 0.46, 2.6], [0.66, 0.86, 1.1]];

      pts.forEach(([px, py, ph]) => {
        const pulse = (Math.sin(t * 1.8 + ph) + 1) / 2;
        const x = px * w + Math.sin(t * 0.1 + ph) * 6;
        const y = py * h - s * 60 + Math.cos(t * 0.08 + ph) * 6;
        ctx.globalAlpha = 0.55 + pulse * 0.4;
        ctx.fillStyle = gold;
        ctx.beginPath();ctx.arc(x, y, 2, 0, Math.PI * 2);ctx.fill();
        ctx.globalAlpha = 0.2 * (1 - pulse);
        ctx.strokeStyle = gold;
        ctx.lineWidth = 1;
        ctx.beginPath();ctx.arc(x, y, 4 + pulse * 18, 0, Math.PI * 2);ctx.stroke();
      });
      ctx.globalAlpha = 1;

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      mounted = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [scrollRef]);

  return (
    <div className="bg-stack" aria-hidden="true">
      <canvas ref={canvasRef} className="bg-canvas" />
      <div className="bg-scanlines" />
      <div className="bg-vignette" />
    </div>);

}

// ── HUD topo ───────────────────────────────────────────────────────────────
function Hud({ scrollRef }) {
  const [tick, setTick] = useState({ time: fmtTime(new Date()), frame: 0 });
  useEffect(() => {
    const id = setInterval(() => {
      const f = Math.round(scrollRef.current.s * 9999);
      setTick({ time: fmtTime(new Date()), frame: f });
    }, 1000);
    return () => clearInterval(id);
  }, [scrollRef]);
  return (
    <header className="hud">
      <div className="hud-l">
        <span className="dot" />
        <div className="brand">
          <img src="https://tenentegustavo.com.br/logo-mag.png" alt="Mentoria MAG" />
          <b>MENTORIA · MAG</b>
        </div>
        <span className="sep hide-sm">/</span>
        <span className="hide-sm">Arsenal · PMMG</span>
      </div>
      <div className="hud-r">
        <span className="hide-sm">FR <b style={{ color: "var(--gold)" }}>{String(tick.frame).padStart(4, "0")}</b></span>
        <span className="sep hide-sm">/</span>
        <span>SIT: <span className="tick">OPERACIONAL</span></span>
        <span className="sep hide-sm">/</span>
        <span className="hide-sm" style={{ fontVariantNumeric: "tabular-nums" }}>{tick.time}</span>
      </div>
    </header>);

}
function fmtTime(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} UTC-3`;
}

// ── HERO (cursos como protagonista) ────────────────────────────────────────
function Hero() {
  return (
    <section className="hero page">
      <div className="hero-head">
        <div>
          <div className="eyebrow fade-up d1">Missões · 04 Frentes Ativas · PMMG</div>
          <h1 className="fade-up d2">
            Selecione<br />
            sua <em style={{ padding: "0px 18px 0px 0px" }}>missão.</em>
          </h1>
        </div>
        <div className="hero-aside">
          <p className="hero-lead fade-up d3">
            Quatro operações de preparação para a Polícia Militar de Minas Gerais —
            CFO, CFSD, CFS e CHO. Doutrina, método e comando, sob a Mentoria MAG.
          </p>
          <div className="hero-coords fade-up d4">
            <span>LAT <b>−19.9167</b></span>
            <span>LON <b>−43.9345</b></span>
            <span>OP <b>MAG·26</b></span>
          </div>
        </div>
      </div>

      <Missions />
    </section>);

}

// ── MISSÕES ────────────────────────────────────────────────────────────────
const MISSIONS = [
{
  code: "CFO",
  title: "Curso de Formação de Oficiais",
  status: "ativo",
  statusLabel: "Ativo · Recrutando",
  brief: "Preparação estratégica completa para quem almeja a carreira de oficial da PMMG.",
  duration: "Anual",
  next: "Em aberto",
  level: "Avançado",
  href: "https://mag.tenentegustavo.com.br/cfo"
},
{
  code: "CFSD",
  title: "Curso de Formação de Soldados",
  status: "ativo",
  statusLabel: "Ativo · Recrutando",
  brief: "Base sólida, constância e evolução prática até o dia da prova. Para quem começa do zero.",
  duration: "6–12 meses",
  next: "Em aberto",
  level: "Iniciante → Pleno",
  href: "https://mag.tenentegustavo.com.br/cfsd"
},
{
  code: "CFS",
  title: "Curso de Formação de Sargentos",
  status: "ativo",
  statusLabel: "Ativo · Recrutando",
  brief: "Preparação técnica e tática para a progressão à graduação de sargento da PMMG. Liderança operacional.",
  duration: "8–10 meses",
  next: "Em aberto",
  level: "Intermediário",
  href: "https://mag.tenentegustavo.com.br/cfs"
},
{
  code: "CHO",
  title: "Curso de Habilitação de Oficiais",
  status: "missao",
  statusLabel: "Em missão",
  brief: "Profundidade teórica, precisão jurídica e preparação refinada para oficiais da reserva.",
  duration: "Sob medida",
  next: "Consultar",
  level: "Especialista",
  href: "https://mag.tenentegustavo.com.br/cho"
}];


function Missions() {
  return (
    <div className="missions">
      {MISSIONS.map((m, i) =>
      <a key={m.code} href={m.href} target="_blank" rel="noopener"
      className={`fade-up d${4 + i}`}>
          <article className="mission" data-status={m.status}>
            <div className="mission-head">
              <div className="mission-code">{m.code}</div>
              <div className="mission-status">{m.statusLabel}</div>
            </div>

            <div className="mission-title">{m.title}</div>
            <p className="mission-brief">{m.brief}</p>

            <dl className="mission-meta">
              <div><dt>Duração</dt><dd>{m.duration}</dd></div>
              <div><dt>Próx. turma</dt><dd>{m.next}</dd></div>
              <div><dt>Nível</dt><dd>{m.level}</dd></div>
              <div><dt>Vagas</dt><dd>Limitadas</dd></div>
            </dl>

            <div className="mission-cta">
              <span>Iniciar briefing</span>
              <span className="arrow">→</span>
            </div>
          </article>
        </a>
      )}
    </div>);

}

// ── MENTOR STRIP ───────────────────────────────────────────────────────────
function MentorStrip() {
  return (
    <section className="page mentor" id="mentor">
      <div className="mentor-row">
        <div className="mentor-photo">
          <span className="corner tl" />
          <span className="corner br" />
          <img src="https://tenentegustavo.com.br/foto-gustavo.png" alt="Tenente Gustavo" />
        </div>
        <div className="mentor-info">
          <div className="mentor-tag">Mentor · Comando MAG</div>
          <div className="mentor-name">Tenente Gustavo</div>
          <div className="mentor-creds">
            <span className="cred">Oficial PMMG</span>
            <span className="cred">Neurocientista</span>
            <span className="cred">Direito Militar</span>
          </div>
        </div>
        <div className="mentor-cta">
          <a className="btn btn-primary"
          href="https://wa.me/message/TY7LCCWSM73UN1"
          target="_blank" rel="noopener">
            Falar com o comando <span className="arrow">→</span>
          </a>
          <a className="btn-icon" href="https://www.instagram.com/proftenentegustavo/"
          target="_blank" rel="noopener" aria-label="Instagram">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a className="btn-icon" href="https://www.youtube.com/@Prof.TenenteGustavoPMMG"
          target="_blank" rel="noopener" aria-label="YouTube">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.6 7.2c-.2-1-.9-1.7-1.9-1.9C17.9 5 12 5 12 5s-5.9 0-7.7.3c-1 .2-1.7.9-1.9 1.9C2 9 2 12 2 12s0 3 .4 4.8c.2 1 .9 1.7 1.9 1.9C6.1 19 12 19 12 19s5.9 0 7.7-.3c1-.2 1.7-.9 1.9-1.9.4-1.8.4-4.8.4-4.8s0-3-.4-4.8zM10 15V9l5 3-5 3z" />
            </svg>
          </a>
        </div>
      </div>
    </section>);

}

// ── FOOTER ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="page foot">
      <div className="foot-brand">
        <img src="https://tenentegustavo.com.br/logo-mag.png" alt="" />
        <span>© 2026 · Mentoria MAG · Ten. Gustavo</span>
      </div>
      <div>PMMG · CFO · CFSD · CFS · CHO</div>
      <div>v.2.0 · Arsenal Operacional</div>
    </footer>);

}

// ── APP ────────────────────────────────────────────────────────────────────
function App() {
  const [t] = React.useState(TWEAK_DEFAULTS);
  const scrollRef = useScrollProgress();

  useEffect(() => {
    document.body.dataset.palette = t.palette;
    document.body.dataset.fonts = t.fonts;
  }, [t.palette, t.fonts]);

  return (
    <>
      <TacticalBackdrop scrollRef={scrollRef} />

      <Hud scrollRef={scrollRef} />
      <main>
        <Hero />
        <MentorStrip />
      </main>
      <Footer />
      {false && (
      <TweaksPanel title="Tweaks · MAG">
        <TweakSection label="Paleta">
          <TweakColor
            label="Tema"
            value={paletteValue(t.palette)}
            options={PALETTE_OPTIONS}
            onChange={(v) => setTweak("palette", paletteKey(v))} />
          
        </TweakSection>
        <TweakSection label="Tipografia">
          <TweakRadio
            label="Família"
            value={t.fonts}
            options={FONT_OPTIONS}
            onChange={(v) => setTweak("fonts", v)} />
          
        </TweakSection>
      </TweaksPanel>
      )}
    </>);

}

function paletteValue(key) {
  const i = PALETTE_KEYS.indexOf(key);
  return PALETTE_OPTIONS[i >= 0 ? i : 0];
}
function paletteKey(arr) {
  const i = PALETTE_OPTIONS.findIndex(
    (p) => JSON.stringify(p).toLowerCase() === JSON.stringify(arr).toLowerCase()
  );
  return PALETTE_KEYS[i >= 0 ? i : 0];
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);