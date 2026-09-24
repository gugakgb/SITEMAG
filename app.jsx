// app.jsx — Mentoria MAG · v2
// Cursos no centro, mentor como faixa, fundo tático que evolui com o scroll.

const { useEffect, useRef, useState } = React;

// ── Tweak defaults ─────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "mag",
  "fonts": "mag"
} /*EDITMODE-END*/;

const PALETTE_OPTIONS = [
["#0a0a0a", "#B8985A", "#5a6a3a", "#efece4"],
["#1a1d14", "#c8a96a", "#7e8c4e", "#efebd9"],
["#ece4cf", "#8a6a2c", "#3d4a2a", "#1b1a14"],
["#070707", "#d4b06c", "#6c6238", "#f5efde"],
["#0a1a40", "#f2b705", "#1b55d9", "#f7fafe"]];

const PALETTE_KEYS = ["obsidian", "campo", "dossie", "ouro", "mag"];
const FONT_OPTIONS = [
{ value: "operacional", label: "Operacional" },
{ value: "editorial", label: "Editorial" },
{ value: "hibrido", label: "Híbrido" },
{ value: "mag", label: "MAG (Teko + Jakarta)" }];


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
      {/* Menu sempre visivel (inclusive no celular): o Blog nunca fica escondido. */}
      <nav className="hud-nav" aria-label="Navegação principal">
        <a href="#posto">Cursos</a>
        <a href="/blog" className="hud-blog">Blog</a>
        <a href="https://mag.tenentegustavo.com.br/auth" className="hud-entrar">Entrar</a>
      </nav>
    </header>);

}
function fmtTime(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} UTC-3`;
}

// ── HERO "QUAL É O SEU PRÓXIMO POSTO?" (variação B, aprovada em 23/09/2026) ─
function Hero() {
  return (
    <section className="hero-b page">
      <div className="hb-texto">
        <div className="eyebrow fade-up d1">Preparação PMMG · CFO · CFSD · CFS · CHO</div>
        <h1 className="fade-up d2">Qual é o seu <em>próximo posto?</em></h1>
        <p className="hb-sub fade-up d3">
          Do civil ao oficial: cada degrau da carreira na Polícia Militar de Minas Gerais
          tem um caminho. Diga onde você está e a gente mostra o seu.
        </p>
        <div className="hb-acts fade-up d4">
          <a className="btn btn-primary" href="#posto">Descobrir meu caminho <span className="arrow">↓</span></a>
          <a className="btn btn-ghost" href="/blog">Ler o blog <span className="arrow">→</span></a>
        </div>
      </div>
      <div className="hb-foto fade-up d3">
        <img src="/foto-gustavo-retrato.webp" alt="Professor Tenente Gustavo, mentor da Mentoria MAG" width="720" height="1279" fetchpriority="high" />
        <div className="hb-selo">
          <i>Professor</i>
          <b>Tenente Gustavo</b>
          <span>Mentor da Mentoria MAG · Oficial da PMMG · Neurocientista</span>
        </div>
      </div>
    </section>);
}

// Situação do visitante -> curso principal, cursos que também servem, degrau alvo
// e degraus já vencidos. "tambem" aceita siglas de missões e de cursos avulsos.
const PERFIS = [
{ id: "civil", label: "Sou civil", sub: "ensino superior", principal: "CFSD", tambem: ["CRS"], alvo: 1, passou: [] },
{ id: "bacharel", label: "Sou bacharel", sub: "em Direito", principal: "CFO", tambem: ["CFSD", "CRS"], alvo: 3, passou: [] },
{ id: "praca", label: "Sou Cabo ou Soldado", sub: "PMMG", principal: "CFS", tambem: ["EAP"], alvo: 2, passou: [1] },
{ id: "sgt", label: "Sou Sargento ou Subtenente", sub: "PMMG", principal: "CHO", tambem: [], alvo: 3, passou: [1, 2] }];

const DEGRAUS = [
{ n: 3, nome: "Oficial", sub: "Tenente → carreira de comando" },
{ n: 2, nome: "Sargento", sub: "graduação de liderança" },
{ n: 1, nome: "Soldado", sub: "porta de entrada na PMMG" }];

function Posto({ extras }) {
  const [perfilId, setPerfilId] = useState("civil");
  const perfil = PERFIS.find((p) => p.id === perfilId) || PERFIS[0];
  const principal = MISSIONS.find((m) => m.code === perfil.principal);
  const outras = MISSIONS.filter((m) => m.code !== perfil.principal);
  // cursos avulsos (do painel) que combinam com o perfil, pela sigla do card
  const extrasDoPerfil = extras.filter((c) =>
  perfil.tambem.includes(String(cardCode(c)).toUpperCase().split(/\s+/)[0])
  );

  return (
    <section className="posto page" id="posto">
      <div className="posto-head">
        <div className="eyebrow">Passo 1</div>
        <h2>Onde você está hoje?</h2>
        <div className="chips" role="group" aria-label="Sua situação hoje">
          {PERFIS.map((p) =>
          <button key={p.id} type="button" className="chip" aria-pressed={p.id === perfilId}
          onClick={() => setPerfilId(p.id)}>
              {p.label} <small>{p.sub}</small>
            </button>
          )}
        </div>
      </div>

      <div className="escada">
        <div className="trilho" aria-label="Carreira na PMMG">
          {DEGRAUS.map((d) =>
          <div key={d.n} data-degrau={d.n}
          className={`degrau${d.n === perfil.alvo ? " ativo" : ""}${perfil.passou.includes(d.n) ? " passou" : ""}`}>
              <span className="n">{d.n}</span>
              <div><b>{d.nome}</b><span>{d.sub}</span></div>
            </div>
          )}
        </div>

        <div className="pcursos">
          {principal &&
          <div className="pcurso destaque" key={principal.code}>
              <span className="tag">{principal.statusLabel}</span>
              <span className="cod">{principal.code}</span>
              <div className="corpo">
                <h3>{principal.title}</h3>
                <p>{principal.brief}</p>
                <span className="pre">Para <b>{principal.level}</b> · Duração <b>{principal.duration}</b> · Vagas <b>limitadas</b></span>
                {extrasDoPerfil.length > 0 &&
              <span className="tambem">Também para você:{" "}
                    {extrasDoPerfil.map((c) =>
                <a key={c.slug} href={`https://mag.tenentegustavo.com.br/${c.slug}`} target="_blank" rel="noopener">{c.product_name} →</a>
                )}
                  </span>
              }
              </div>
              <a className="btn btn-primary ir" href={principal.href} target="_blank" rel="noopener">
                Iniciar briefing <span className="arrow">→</span>
              </a>
            </div>
          }
          {outras.map((m) =>
          <a key={m.code} href={m.href} target="_blank" rel="noopener"
          className={`pcurso${perfil.tambem.includes(m.code) ? " ok" : ""}`}>
              <span className="tag">{m.statusLabel}</span>
              <span className="cod">{m.code}</span>
              <div className="corpo">
                <h3>{m.title}</h3>
                <p>{m.brief}</p>
                <span className="pre">Para <b>{m.level}</b></span>
              </div>
            </a>
          )}
        </div>
      </div>
    </section>);
}

// ── MISSÕES ────────────────────────────────────────────────────────────────
const MISSIONS = [
{
  code: "CFO",
  title: "Curso de Formação de Oficiais",
  status: "ativo",
  statusLabel: "Ativo · Recrutando",
  brief: "Preparação estratégica completa para quem almeja a carreira ser Oficial da PMMG.",
  duration: "ATÉ A APROVAÇÃO",
  next: "Em aberto",
  level: "Bacharel em Direito",
  href: "https://mag.tenentegustavo.com.br/cfo"
},
{
  code: "CFSD",
  title: "Curso de Formação de Soldados",
  status: "ativo",
  statusLabel: "Ativo · Recrutando",
  brief: "Base sólida, constância e evolução prática até o dia da prova. Para quem começa do zero.",
  duration: "ATÉ A APROVAÇÃO",
  next: "Em aberto",
  level: "Ensino Superior",
  href: "https://mag.tenentegustavo.com.br/cfsd"
},
{
  code: "CFS",
  title: "Curso de Formação de Sargentos",
  status: "ativo",
  statusLabel: "Ativo · Recrutando",
  brief: "Preparação técnica e tática para a progressão à graduação de Sargento da PMMG. Liderança operacional.",
  duration: "1 ANO",
  next: "Em aberto",
  level: "Cabos e Soldados PMMG",
  href: "https://mag.tenentegustavo.com.br/cfs"
},
{
  code: "CHO",
  title: "Curso de Habilitação de Oficiais",
  status: "missao",
  statusLabel: "Em missão",
  brief: "Profundidade teórica, precisão jurídica e preparação refinada para Sargentos e Subtenentes que desejam ser Oficiais da PMMG.",
  duration: "ATÉ A APROVAÇÃO",
  next: "Consultar",
  level: "Sargentos da PMMG",
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

// ── CURSOS AVULSOS (automático) ────────────────────────────────────────────
// Puxa da plataforma (Supabase) toda landing/campanha ATIVA criada no painel
// (aba Campanhas). O que não for uma das 4 missões fixas vira card aqui —
// ex.: "Por dentro do CRS da PMMG". Criou landing nova no painel, o card
// aparece sozinho; desativou a campanha, o card some. Sem mexer neste arquivo.
const MAG_SUPABASE_URL = "https://xckxgsbbitgbrlkoivgg.supabase.co";
const MAG_SUPABASE_ANON =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhja3hnc2JiaXRnYnJsa29pdmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTA4NDcsImV4cCI6MjA4MjY4Njg0N30.pkyNmOOR12BPBlXbA1H6YtboLO0nIL6MDZF4EfgzV44";
const MISSION_SLUGS = ["cfo", "cfsd", "cfs", "cho"];
const MISSION_CODES = MISSION_SLUGS.map((s) => s.toUpperCase());
// Palavras comuns que não servem de sigla ao garimpar o nome do produto
const CODE_STOPWORDS = ["POR", "DO", "DA", "DE", "DOS", "DAS", "NO", "NA", "EM", "COM", "PMMG", "MAG", "CURSO"];

// Sigla grande do card. Prioridade: campo "Sigla do card no site raiz"
// (card_code, preenchido no painel > Campanhas). Depois o apelido curto — a
// menos que ele repita o código de uma missão fixa (ex.: CRS veio cadastrado
// como "CFSD"). Por último, garimpa uma PALAVRA INTEIRA de 2–4 letras no nome
// do produto (ex.: "CRS" em "POR DENTRO DO CRS PMMG").
function cardCode(c) {
  const own = String(c.card_code || "").trim();
  if (own) return own;
  const short = String(c.display_short || "").trim();
  if (short && !MISSION_CODES.includes(short.toUpperCase())) return short;
  const words = String(c.product_name || "").toUpperCase().split(/[^A-ZÀ-Ú]+/);
  const mined = words.find((w) =>
  w.length >= 2 && w.length <= 4 &&
  !CODE_STOPWORDS.includes(w) && !MISSION_CODES.includes(w)
  );
  return mined || short || "Curso";
}

function useExtraCourses() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const url = `${MAG_SUPABASE_URL}/rest/v1/landing_campaigns` +
    `?select=slug,product_name,display_short,card_code,category,hero_subtitle,hero_eyebrow` +
    `&active=eq.true&order=product_name.asc`;
    fetch(url, {
      headers: {
        apikey: MAG_SUPABASE_ANON,
        Authorization: `Bearer ${MAG_SUPABASE_ANON}`
      }
    }).
    then((r) => r.ok ? r.json() : []).
    then((rows) => setCourses(
      (Array.isArray(rows) ? rows : []).filter(
        (c) => c.slug && !MISSION_SLUGS.includes(String(c.slug).toLowerCase())
      )
    )).
    catch(() => {});
  }, []);

  return courses;
}

function ExtraCourses({ courses }) {
  if (!courses.length) return null;

  return (
    <section className="page courses">
      <div className="courses-head">
        <div className="eyebrow fade-up d1">Cursos Avulsos · Acesso Imediato</div>
        <p className="courses-lead fade-up d2">
          Operações pontuais da Mentoria MAG — adquira um curso específico,
          sem assinar a mentoria completa.
        </p>
      </div>
      <div className="missions">
        {courses.map((c, i) =>
        <a key={c.slug}
        href={`https://mag.tenentegustavo.com.br/${c.slug}`}
        target="_blank" rel="noopener"
        className={`fade-up d${Math.min(3 + i, 7)}`}>
            <article className="mission" data-status="ativo">
              <div className="mission-head">
                <div className="mission-code">{cardCode(c)}</div>
                <div className="mission-status">Ativo · Venda avulsa</div>
              </div>

              <div className="mission-title">{c.product_name}</div>
              <p className="mission-brief">
                {c.hero_subtitle || c.hero_eyebrow ||
              "Curso avulso da Mentoria MAG com acesso imediato após a compra."}
              </p>

              <dl className="mission-meta">
                <div><dt>Formato</dt><dd>100% online</dd></div>
                <div><dt>Acesso</dt><dd>Imediato</dd></div>
                <div><dt>Tipo</dt><dd>Curso avulso</dd></div>
                <div><dt>Vagas</dt><dd>Abertas</dd></div>
              </dl>

              <div className="mission-cta">
                <span>Iniciar briefing</span>
                <span className="arrow">→</span>
              </div>
            </article>
          </a>
        )}
      </div>
    </section>);

}

// ── DO BLOG (3 artigos mais recentes, puxados do painel) ──────────────────
// Regra institucional: "Tenente Gustavo" solto vira "Professor Tenente Gustavo".
const comProfessor = (t) => String(t || "").replace(/(?<!Prof\.\s?|Professor\s)\b(Ten\.|Tenente)\s+Gustavo/g, "Professor Tenente Gustavo");

function BlogRecente() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    const url = `${MAG_SUPABASE_URL}/rest/v1/blog_posts` +
    `?select=slug,title,category,excerpt,reading_minutes,published_at` +
    `&status=eq.published&order=published_at.desc&limit=3`;
    fetch(url, { headers: { apikey: MAG_SUPABASE_ANON, Authorization: `Bearer ${MAG_SUPABASE_ANON}` } }).
    then((r) => r.ok ? r.json() : []).
    then((rows) => setPosts(Array.isArray(rows) ? rows : [])).
    catch(() => {});
  }, []);

  return (
    <section className="page blogb" id="blog">
      <div className="blogb-head">
        <div>
          <div className="eyebrow">Do blog</div>
          <h2>Estudo, edital e estratégia</h2>
        </div>
        <a className="btn btn-ghost" href="/blog">Ver todos os artigos <span className="arrow">→</span></a>
      </div>
      <div className="blogb-grid">
        {posts.length === 0 &&
        <a className="blogb-card" href="/blog">
            <span className="cat">Blog</span>
            <h3>Artigos sobre concursos da PMMG</h3>
            <p>Método de estudo, análise de editais e neurociência da aprendizagem.</p>
            <span className="mais">Ler o blog →</span>
          </a>
        }
        {posts.map((p) =>
        <a key={p.slug} className="blogb-card" href={`/blog/${p.slug}`}>
            <span className="cat">{p.category || "Artigo"}{p.reading_minutes ? ` · ${p.reading_minutes} min de leitura` : ""}</span>
            <h3>{comProfessor(p.title)}</h3>
            {p.excerpt && <p>{comProfessor(p.excerpt)}</p>}
            <span className="mais">Ler artigo →</span>
          </a>
        )}
      </div>
    </section>);
}

// ── MENTOR STRIP ───────────────────────────────────────────────────────────
function MentorStrip() {
  return (
    <section className="page mentor" id="mentor">
      <div className="mentor-row">
        <div className="mentor-photo">
          <span className="corner tl" />
          <span className="corner br" />
          <img src="/foto-gustavo-mentor.webp" alt="Professor Tenente Gustavo" width="480" height="480" loading="lazy" />
        </div>
        <div className="mentor-info">
          <div className="mentor-tag">Mentor · Mentoria MAG</div>
          <div className="mentor-name"><small className="mentor-prof">Professor</small>Tenente Gustavo</div>
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
          <a className="btn btn-ghost" href="/blog">
            Blog <span className="arrow">→</span>
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
        <span>© 2026 · Mentoria MAG · Professor Tenente Gustavo</span>
      </div>
      <div><a href="/blog" style={{ color: "var(--gold)" }}>Blog</a> · PMMG · CFO · CFSD · CFS · CHO</div>
      <div>v.2.0 · Arsenal Operacional</div>
    </footer>);

}

// ── APP ────────────────────────────────────────────────────────────────────
function App() {
  const t = TWEAK_DEFAULTS;
  const scrollRef = useScrollProgress();
  const extras = useExtraCourses();

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
        <Posto extras={extras} />
        <ExtraCourses courses={extras} />
        <BlogRecente />
        <MentorStrip />
      </main>
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);