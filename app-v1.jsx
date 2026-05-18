// app.jsx — Mentoria MAG · Arsenal de Operações
// Long-scroll interactive prototype. Tweaks: paleta + tipografia.

const { useEffect, useState } = React;

// ── Tweak defaults (persisted via EDITMODE block) ──────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "obsidian",
  "fonts": "operacional"
}/*EDITMODE-END*/;

const PALETTE_OPTIONS = [
  // [hero, ...rest] — primeira cor é o "tom dominante" do tema
  ["#0a0a0a", "#B8985A", "#5a6a3a", "#efece4"],   // obsidian
  ["#1a1d14", "#c8a96a", "#7e8c4e", "#efebd9"],   // campo
  ["#f0e9d8", "#8a6a2c", "#3d4a2a", "#1b1a14"],   // dossie
  ["#070707", "#d4b06c", "#6c6238", "#f5efde"],   // ouro
];
const PALETTE_KEYS = ["obsidian", "campo", "dossie", "ouro"];

const FONT_OPTIONS = [
  { value: "operacional", label: "Operacional" },
  { value: "editorial",   label: "Editorial" },
  { value: "hibrido",     label: "Híbrido" },
];

// ── HUD topo ────────────────────────────────────────────────────────────────
function Hud() {
  const [time, setTime] = useState(() => fmtTime(new Date()));
  useEffect(() => {
    const id = setInterval(() => setTime(fmtTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <header className="hud">
      <div className="hud-l">
        <span className="dot" />
        <div className="brand">
          <img src="https://tenentegustavo.com.br/logo-mag.png" alt="Mentoria MAG" />
          <b>MENTORIA · MAG</b>
        </div>
        <span className="sep hide-sm">/</span>
        <span className="hide-sm">Arsenal de Operações</span>
      </div>
      <div className="hud-r">
        <span className="hide-sm">PMMG · MG-BR</span>
        <span className="sep hide-sm">/</span>
        <span>SIT: <span className="tick">OPERACIONAL</span></span>
        <span className="sep hide-sm">/</span>
        <span className="hide-sm" style={{fontVariantNumeric:"tabular-nums"}}>{time}</span>
      </div>
    </header>
  );
}
function fmtTime(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} UTC-3`;
}

// ── HERO ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="hero page">
      <div className="hero-grid">
        <div>
          <div className="eyebrow">Briefing · 2026 · PMMG</div>
          <h1>
            Não se prepara<br/>
            para um concurso.<br/>
            <em>Conduz-se uma operação.</em>
          </h1>
          <p className="hero-lead">
            Arsenal de Operações da Mentoria MAG: preparação cientificamente conduzida
            para CFO, CFSD e CHO da Polícia Militar de Minas Gerais. Doutrina, método e
            comando — sob a liderança do Tenente Gustavo.
          </p>
          <dl className="hero-meta">
            <div><dt>Frentes</dt><dd>03</dd></div>
            <div><dt>Doutrina</dt><dd>M·A·G</dd></div>
            <div><dt>Próx. turma</dt><dd>EM ABERTO</dd></div>
          </dl>
          <div className="hero-cta">
            <a href="#missoes" className="btn btn-primary">
              Selecionar missão <span className="arrow">→</span>
            </a>
            <a href="#comms" className="btn btn-ghost">
              Solicitar briefing <span className="arrow">→</span>
            </a>
          </div>
        </div>

        <IdCard />
      </div>
    </section>
  );
}

// ── ID CARD (Hero direito) ──────────────────────────────────────────────────
function IdCard() {
  return (
    <aside className="id-card" aria-label="Identificação do mentor">
      <span className="id-corner tl" />
      <span className="id-corner tr" />
      <span className="id-corner bl" />
      <span className="id-corner br" />

      <div className="id-card-head">
        <div className="left">
          <b>Ficha · 001</b>
          <span>Mentor — Comando</span>
        </div>
        <div className="right">
          <b>Classificação</b>
          <span>Operacional</span>
        </div>
      </div>

      <div className="id-photo">
        <img src="https://tenentegustavo.com.br/foto-gustavo.png" alt="Tenente Gustavo" />
        <span className="id-stamp">Autorizado</span>
      </div>

      <div className="id-card-body">
        <div>
          <div className="id-card-name">Ten. Gustavo</div>
          <div className="id-card-role">Oficial PMMG · Neurocientista · Direito Militar</div>
        </div>
        <dl className="id-card-stats">
          <div><dt>Posto</dt><dd>Tenente · PMMG</dd></div>
          <div><dt>Especialidade</dt><dd>Cognição & Direito</dd></div>
          <div><dt>Frente</dt><dd>CFO · CFSD · CHO</dd></div>
          <div><dt>Status</dt><dd className="gold">Ativo</dd></div>
        </dl>
      </div>
    </aside>
  );
}

// ── DOSSIÊ DO MENTOR ────────────────────────────────────────────────────────
const RECORDS = [
  {
    n: "01",
    tag: "AUTORIDADE",
    title: "Oficial da Polícia Militar de Minas Gerais",
    body: "Tenente em serviço ativo na PMMG, com vivência operacional de campo e formação militar concluída no CFO. Conhecimento prático e doutrinário sobre o concurso visto de dentro.",
  },
  {
    n: "02",
    tag: "MÉTODO",
    title: "Neurocientista — cognição e aprendizagem",
    body: "Formação acadêmica em Neurociências aplicada à preparação de candidatos. Cada plano de estudo é desenhado com base em evidências sobre memória, atenção e desempenho sob pressão.",
  },
  {
    n: "03",
    tag: "GARANTIA",
    title: "Especialista em Direito Militar",
    body: "Domínio técnico das matérias jurídicas centrais do concurso — Direito Penal Militar, Constitucional e Administrativo Disciplinar — abordadas com a precisão de quem vive a corporação.",
  },
];

function Dossier() {
  return (
    <section className="section page" id="mentor">
      <div className="section-head">
        <div>
          <div className="section-tag">FICHA-001 · MENTOR</div>
          <h2 className="section-title">Comando.<br/>Doutrina.<br/>Resultado.</h2>
        </div>
        <div className="section-sub">
          Três frentes de autoridade. Uma única missão: levar o candidato à aprovação.
        </div>
      </div>

      <div className="dossier">
        <div className="dossier-left">
          <div className="label">
            <span>DECLARAÇÃO · 001</span>
            <span>MG · 2026</span>
          </div>
          <blockquote className="dossier-quote">
            “Estudar sozinho não basta. Vencer concurso da PMMG exige sistema —
            e o sistema tem comando.”
            <span className="credit">— Ten. Gustavo · Mentor MAG</span>
          </blockquote>
        </div>
        <div className="dossier-records">
          {RECORDS.map((r) => (
            <article className="record" key={r.n}>
              <div className="record-tag"><span className="n">{r.n}</span>{r.tag}</div>
              <div className="record-content">
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── MISSÕES (3 cursos) ──────────────────────────────────────────────────────
const MISSIONS = [
  {
    code: "CFO",
    title: "Curso de Formação de Oficiais",
    status: "ativo",
    statusLabel: "Ativo · Recrutando",
    brief: "Preparação estratégica completa para o candidato que almeja a carreira de oficial da PMMG. Plano de estudos longo, conteúdo aprofundado e simulados sob pressão.",
    duration: "Anual",
    next: "Em aberto",
    level: "Avançado",
    occupancy: 0,
    href: "https://mag.tenentegustavo.com.br/cfo",
  },
  {
    code: "CFSD",
    title: "Curso de Formação de Soldados",
    status: "ativo",
    statusLabel: "Ativo · Recrutando",
    brief: "Base sólida, constância de estudo e evolução prática até o dia da prova. Para o operador que começa do zero e quer um plano que não falha.",
    duration: "6 a 12 meses",
    next: "Em aberto",
    level: "Iniciante → Pleno",
    occupancy: 0,
    href: "https://mag.tenentegustavo.com.br/cfsd",
  },
  {
    code: "CHO",
    title: "Curso de Habilitação de Oficiais",
    status: "missao",
    statusLabel: "Em missão",
    brief: "Profundidade teórica, precisão jurídica e preparação refinada para a habilitação de oficiais da reserva. Conteúdo de elite, ritmo cirúrgico.",
    duration: "Sob medida",
    next: "Consultar comando",
    level: "Especialista",
    occupancy: 0,
    href: "https://mag.tenentegustavo.com.br/cho",
  },
];

function Missions() {
  return (
    <section className="section page" id="missoes">
      <div className="section-head">
        <div>
          <div className="section-tag">MISSÕES · 03 FRENTES ATIVAS</div>
          <h2 className="section-title">Escolha sua frente.</h2>
        </div>
        <div className="section-sub">
          Cada operação tem doutrina, ritmo e alvo próprios. Selecione a sua.
        </div>
      </div>

      <div className="missions">
        {MISSIONS.map((m) => (
          <a key={m.code} href={m.href} target="_blank" rel="noopener">
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

              <div className="mission-progress">
                <div className="mission-progress-head">
                  <span>Ocupação da turma</span>
                  <b>{m.occupancy}%</b>
                </div>
                <div className="mission-progress-bar">
                  <i style={{ width: `${Math.max(2, m.occupancy)}%` }} />
                </div>
              </div>

              <div className="mission-cta">
                <span>Iniciar briefing</span>
                <span className="arrow">→</span>
              </div>
            </article>
          </a>
        ))}
      </div>
    </section>
  );
}

// ── COMMS / CTA ─────────────────────────────────────────────────────────────
const CHANNELS = [
  { name: "WhatsApp", handle: "wa.me/message/TY7LCCWSM73UN1",
    href: "https://wa.me/message/TY7LCCWSM73UN1", icon: "WA" },
  { name: "Instagram", handle: "@proftenentegustavo",
    href: "https://www.instagram.com/proftenentegustavo/", icon: "IG" },
  { name: "YouTube", handle: "@Prof.TenenteGustavoPMMG",
    href: "https://www.youtube.com/@Prof.TenenteGustavoPMMG", icon: "YT" },
];

function Comms() {
  return (
    <section className="section page" id="comms">
      <div className="comms">
        <div className="comms-head">
          <div className="eyebrow">Comunicação · canais ativos</div>
          <h2>
            Solicite seu<br/>
            <em>briefing inicial.</em>
          </h2>
          <p>
            Vagas limitadas por turma. Selecione a frente de interesse, envie uma mensagem
            pelo canal de sua preferência e nossa equipe abrirá seu dossiê em até 24h.
          </p>
          <div className="hero-cta">
            <a href="https://wa.me/message/TY7LCCWSM73UN1" target="_blank" rel="noopener"
               className="btn btn-primary">
              Falar com o comando <span className="arrow">→</span>
            </a>
          </div>
        </div>

        <nav className="comms-channels" aria-label="Canais de comunicação">
          {CHANNELS.map((c) => (
            <a key={c.name} href={c.href} target="_blank" rel="noopener" className="channel">
              <div className="channel-l">
                <span className="channel-icon">{c.icon}</span>
                <div>
                  <div className="channel-name">{c.name}</div>
                  <div className="channel-handle">{c.handle}</div>
                </div>
              </div>
              <span className="channel-arrow">→</span>
            </a>
          ))}
        </nav>
      </div>

      <footer className="foot">
        <div className="foot-brand">
          <img src="https://tenentegustavo.com.br/logo-mag.png" alt="" />
          <span>© 2026 · Mentoria MAG · Ten. Gustavo</span>
        </div>
        <div>PMMG · CFO · CFSD · CHO</div>
        <div>v.2.0 · Arsenal Operacional</div>
      </footer>
    </section>
  );
}

// ── APP ────────────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply tweaks via data attrs on <body>
  useEffect(() => {
    document.body.dataset.palette = t.palette;
    document.body.dataset.fonts = t.fonts;
  }, [t.palette, t.fonts]);

  return (
    <>
      <div className="bg-grid" />
      <div className="bg-noise" />

      <Hud />
      <main>
        <Hero />
        <Dossier />
        <Missions />
        <Comms />
      </main>

      <TweaksPanel title="Tweaks · MAG">
        <TweakSection label="Paleta">
          <TweakColor
            label="Tema"
            value={paletteValue(t.palette)}
            options={PALETTE_OPTIONS}
            onChange={(v) => setTweak("palette", paletteKey(v))}
          />
        </TweakSection>
        <TweakSection label="Tipografia">
          <TweakRadio
            label="Família"
            value={t.fonts}
            options={FONT_OPTIONS}
            onChange={(v) => setTweak("fonts", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

// Converte chave de paleta → array de cores (e vice-versa)
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
