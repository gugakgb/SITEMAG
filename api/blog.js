// Renderiza o blog a partir do Supabase, devolvendo HTML completo (SEO server-side).
// Rotas (via vercel.json): /blog -> índice ; /blog/<slug> -> artigo.
import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';
import { CARTOES_BLOG } from './_blog-cards.js';

const ROOT = 'https://tenentegustavo.com.br';
const MAG = 'https://mag.tenentegustavo.com.br';
const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://xckxgsbbitgbrlkoivgg.supabase.co';
const SUPA_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
// Cartao padrao (rebranding 2026-09): banner do Prof. Tenente Gustavo. Artigo com cartao proprio continua com o dele.
const DEFAULT_OG = `${ROOT}/og-mag-azul.jpg`;

const supabase = createClient(SUPA_URL, SUPA_KEY || 'anon-key-missing', { auth: { persistSession: false } });

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
};

// Regra institucional (23/09/2026): o nome sempre com "Professor" na frente.
// Vale também para artigos antigos que gravaram só "Tenente Gustavo" no banco.
const nomeDoAutor = (n) => {
  const nome = String(n || '').trim() || 'Tenente Gustavo';
  return /^(prof\.?|professor)\s/i.test(nome) ? nome.replace(/^prof\.?\s/i, 'Professor ')
    : /^(ten\.?|tenente)\s+gustavo/i.test(nome) ? `Professor ${nome.replace(/^ten\.?\s/i, 'Tenente ')}` : nome;
};

// Mesmo cuidado dentro dos textos escritos no painel (título, descrição, resumo e
// corpo): "Tenente Gustavo" solto vira "Professor Tenente Gustavo". Não mexe onde
// já existe "Prof." ou "Professor" antes.
const comProfessor = (t) => String(t || '').replace(/(?<!Prof\.\s?|Professor\s)\b(Ten\.|Tenente)\s+Gustavo/g, 'Professor Tenente Gustavo');

const readingOf = (p) => p.reading_minutes || Math.max(1, Math.round((p.content_md || '').trim().split(/\s+/).filter(Boolean).length / 200));

// Alguns artigos antigos foram salvos com as quebras de linha REMOVIDAS (um bug no
// pipeline de IA apagava os \n). Como os espaços entre palavras sobreviveram, os limites
// de bloco (títulos, listas, parágrafos) ficaram grudados e o marked mostrava ## ** - crus.
// Aqui restauramos esses limites — mas SÓ quando o texto parece corrompido, para não mexer
// em artigos já bem formatados.
function normalizeMarkdown(md) {
  let s = String(md || '').replace(/\r\n?/g, '\n');
  const headingGlued = /[^\n#](#{1,4})\s/.test(s);                // marcador ## no meio de uma linha (não no início)
  const listGlued = /\S(- )/.test(s);
  const almostNoBreaks = s.length > 800 && (s.match(/\n/g) || []).length < 4;
  if (!headingGlued && !listGlued && !almostNoBreaks) return s; // já está bom
  s = s.replace(/([^\n#])(#{1,4}\s)/g, '$1\n\n$2');               // título grudado no texto (sem partir ## bem formatado)
  s = s.replace(/([^\n])(> )/g, '$1\n\n$2');                       // citação grudada
  s = s.replace(/([^\n\s])(- )/g, '$1\n$2');                       // item de lista grudado
  s = s.replace(/([.!?:])(\*\*(?=[0-9A-Za-zÀ-ÿ]))/g, '$1\n\n$2'); // parágrafo que ABRE em **negrito** (só após fim de frase + seguido de letra; não toca o ** de fechamento)
  s = s.replace(/([a-zà-ÿ0-9.,:;!?)»"”])([A-ZÀ-Þ])/g, '$1\n\n$2'); // parágrafo perdido (minúscula→Maiúscula sem espaço)
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

// ===================================================================
// LEITURA MELHOR (23/09/2026) — ver PMAG/docs/MARCA-MAG.md
// ===================================================================

// Texto colado do Word/ChatGPT chega sem Markdown: subtitulos viram paragrafo
// comum e listas viram "item;\nitem;". Esta funcao reconstroi a estrutura, mas
// SO age em artigos sem nenhum subtitulo (#). Artigos ja formatados ficam intactos.
const MARCADOR_MD = /^\s*(#|[-*+] |\d+[.)] |>|\||```)/;
function estruturarTextoCorrido(md) {
  if (/^#{1,6}\s/m.test(md)) return md;               // ja tem subtitulos: nao mexe
  const blocos = md.split(/\n{2,}/);
  return blocos.map((bloco, i) => {
    const b = bloco.trim();
    if (!b || MARCADOR_MD.test(b)) return bloco;
    const linhas = b.split('\n').map((l) => l.trim()).filter(Boolean);
    // Lista: 2+ linhas, todas terminando em ";" ou "."
    if (linhas.length >= 2 && linhas.every((l) => /[;.]$/.test(l) && !MARCADOR_MD.test(l))) {
      return linhas.map((l) => `- ${l.replace(/[;.]$/, '')}`).join('\n');
    }
    // Subtitulo: uma linha curta, sem pontuacao final, comecando com maiuscula
    if (i > 0 && linhas.length === 1 && b.length <= 90 && !/[.:;!?,]$/.test(b) && /^[A-ZÀ-Þ0-9]/.test(b)) {
      return `## ${b}`;
    }
    // Rotulo: "Competencia 1: texto" -> negrito no rotulo
    const rot = b.match(/^([A-ZÀ-Þ][\wÀ-ÿ ]{2,30}\s\d+):\s+([\s\S]+)$/);
    if (rot && linhas.length === 1) return `**${rot[1]}:** ${rot[2]}`;
    return bloco;
  }).join('\n\n');
}

const slugAncora = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'secao';

// Depois do Markdown: ancoras nos subtitulos (para o sumario), rotulos e caixas
// de Atencao/Dica.
function realcarHtml(html) {
  const toc = [];
  const usados = new Set();
  let out = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner) => {
    let id = slugAncora(inner); let n = 2;
    while (usados.has(id)) id = `${slugAncora(inner)}-${n++}`;
    usados.add(id);
    toc.push({ id, text: inner.replace(/<[^>]+>/g, '') });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  // "Competencia 1:" em negrito no inicio do paragrafo -> cartao de rotulo
  out = out.replace(/<p><strong>([^<]{3,40}?\d+):<\/strong>/g, '<p class="rotulo"><strong>$1:</strong>');
  // Caixas: citacao (ou paragrafo) que comeca com "Atencao:" / "Dica:" / "Importante:"
  const caixa = (tipo, rotulo, resto) => {
    const cls = /dica/i.test(tipo) ? 'dica' : 'atencao';
    const icone = cls === 'dica' ? '✓' : '!';
    return `<div class="callout ${cls}"><span class="ci" aria-hidden="true">${icone}</span><div><b>${rotulo}</b><p>${resto}</p></div></div>`;
  };
  out = out.replace(/<blockquote>\s*<p>(?:<strong>)?(Aten[çc][ãa]o|Dica|Importante)\s*:?\s*(?:<\/strong>)?\s*:?\s*([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
    (_, tipo, resto) => caixa(tipo, tipo, resto));
  out = out.replace(/<p>(?:<strong>)?(Aten[çc][ãa]o|Dica|Importante):(?:<\/strong>)?\s*([\s\S]*?)<\/p>/g,
    (_, tipo, resto) => caixa(tipo, tipo, resto));
  return { html: out, toc };
}

// Chamada para a plataforma no meio do artigo (antes do 3o subtitulo).
const CTA_MEIO = `<aside class="cta-meio" aria-label="Treine na plataforma">
      <span class="k">Treino na plataforma</span>
      <b>Leu? Agora transforme em acerto de prova.</b>
      <p>Na Mentoria MAG você treina com trilha guiada, flashcards e simulados no formato da banca da PMMG.</p>
      <a class="btn-ouro" href="${MAG}/auth">Começar grátis</a>
    </aside>`;
function inserirCtaMeio(html, toc) {
  if (toc.length < 4) return html;                    // artigo curto: fica so a chamada do fim
  const alvo = `<h2 id="${toc[2].id}">`;
  return html.replace(alvo, `${CTA_MEIO}\n${alvo}`);
}

// Sumario: marca o topico que esta na tela; no celular comeca fechado.
const TOC_SCRIPT = `<script>(function(){var t=document.querySelector('.post-toc');if(!t)return;if(window.innerWidth<1000)t.removeAttribute('open');var ls=[].slice.call(t.querySelectorAll('a'));var hs=ls.map(function(a){return document.getElementById(a.getAttribute('href').slice(1));});function u(){var y=window.scrollY+140,at=0;hs.forEach(function(h,i){if(h&&h.offsetTop<=y)at=i;});ls.forEach(function(a,i){a.classList.toggle('ativo',i===at);});}window.addEventListener('scroll',u,{passive:true});u();})();</script>`;

// Banner fixo do blog (rebranding 2026-09): foto oficial do Prof. Tenente Gustavo.
// Aparece no topo da lista de artigos e de cada artigo. Versao leve no celular.
const BANNER = `  <a class="blog-banner" href="/" aria-label="Professor Tenente Gustavo — Mentor de concursos da PMMG">
    <img src="/banner-tenente-gustavo.webp" srcset="/banner-tenente-gustavo-1200.webp 1200w, /banner-tenente-gustavo.webp 2000w" sizes="(max-width: 1100px) 100vw, 1080px" width="2000" height="667" alt="Professor Tenente Gustavo — Mentor de concursos da PMMG: CFO, CHO, Soldados, Sargentos e Polícia Penal" fetchpriority="high" decoding="async" />
  </a>`;

const NAV = `
  <header class="topbar">
    <nav class="nav" aria-label="Navegação principal">
      <a class="brand" href="/"><img src="/logo-mag.png" alt="Mentoria MAG" /><span>Mentoria MAG</span></a>
      <div class="navlinks"><a href="/concurso-pmmg">Concurso PMMG</a><a href="/blog">Blog</a><a href="${MAG}/auth">Entrar</a></div>
    </nav>
  </header>`;

const SHARE_SCRIPT = `<script>function magShare(b){var t=(document.querySelector('meta[property="og:title"]')||{}).content||document.title;var u=location.href.split("?")[0];if(navigator.share){navigator.share({title:t,url:u}).catch(function(){});}else{navigator.clipboard&&navigator.clipboard.writeText(u);window.open("https://wa.me/?text="+encodeURIComponent(t+" "+u),"_blank","noopener");}}</script>`;

// Barra de progresso de leitura: acompanha o quanto o leitor já rolou do artigo.
const PROGRESS_SCRIPT = `<script>(function(){var b=document.getElementById('read-progress');if(!b)return;var a=document.querySelector('.prose');function u(){var el=a||document.body;var start=el.offsetTop||0;var total=(el.offsetHeight||document.body.scrollHeight)- window.innerHeight;var y=window.scrollY-start;var p=total>0?Math.max(0,Math.min(1,y/total)):0;b.style.width=(p*100).toFixed(1)+'%';}window.addEventListener('scroll',u,{passive:true});window.addEventListener('resize',u);u();})();</script>`;

const CTA = `
    <section class="section">
      <div class="shell">
        <div class="cta-band">
          <h2>Estude para a PMMG com método</h2>
          <p>Trilha guiada, simulados, flashcards e acompanhamento do Prof. Tenente Gustavo — para Soldado, Sargento, Oficial e CHO.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="${MAG}/auth">Entrar na plataforma</a>
            <a class="btn btn-secondary" href="/blog">Ver mais artigos</a>
          </div>
        </div>
      </div>
    </section>`;

const FOOTER = `<footer class="footer"><div class="shell"><p>© 2026 Mentoria MAG · Professor Tenente Gustavo. Conteúdo informativo e independente sobre concursos da PMMG.</p></div></footer>`;

function renderArticle(p) {
  const url = `${ROOT}/blog/${p.slug}`;
  const title = comProfessor(p.title || '');
  const seoTitle = comProfessor(p.seo_title) || title;
  const desc = comProfessor(p.seo_description || p.excerpt || '');
  // Artigos que ja existiam em 23/09/2026 guardam no banco um cartao no estilo antigo
  // (verde-oliva); para eles usamos o cartao novo com o banner (/blog-cards). O "?v=2"
  // forca o WhatsApp/Facebook a buscar a imagem de novo.
  const og = CARTOES_BLOG.has(p.slug)
    ? `${ROOT}/blog-cards/${p.slug}.jpg?v=2`
    : (p.og_image_url || DEFAULT_OG);
  const cat = p.category || 'Artigo';
  const mins = readingOf(p);
  const date = fmtDate(p.published_at);
  const md = comProfessor(estruturarTextoCorrido(normalizeMarkdown(p.content_md)));
  const realce = realcarHtml(marked.parse(md, { mangle: false, headerIds: false }));
  const toc = realce.toc;
  const bodyHtml = inserirCtaMeio(realce.html, toc);
  const resumoHtml = p.excerpt ? `<div class="resumo"><span class="k">Em 30 segundos</span><p>${esc(comProfessor(p.excerpt))}</p></div>` : '';
  const tocHtml = toc.length >= 3
    ? `<details class="post-toc" open><summary>Neste artigo <span>${toc.length} tópicos</span></summary><ol>${toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol></details>`
    : '';
  const ld = {
    '@context': 'https://schema.org',
    '@type': p.schema_type === 'NewsArticle' ? 'NewsArticle' : 'BlogPosting',
    headline: title,
    description: desc,
    author: { '@type': 'Person', name: nomeDoAutor(p.author_name) },
    publisher: { '@type': 'Organization', name: 'Mentoria MAG', logo: { '@type': 'ImageObject', url: `${ROOT}/logo-mag.png` } },
    datePublished: (p.published_at || '').slice(0, 10),
    dateModified: (p.updated_at || p.published_at || '').slice(0, 10),
    image: og,
    mainEntityOfPage: url,
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(seoTitle)}</title>
  <meta name="description" content="${esc(desc)}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${url}" />
  <link rel="stylesheet" href="/seo-pages.css" />
  <link rel="icon" type="image/png" href="/logo-mag.png" />
  <style>.hero-inner{min-height:auto;padding:60px 0 40px}.hero h1{max-width:24ch;font-size:clamp(38px,4.4vw,60px);margin-bottom:14px}.post-meta{margin-top:14px}</style>
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${esc(og)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${esc(og)}" />
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
  <div class="read-progress" id="read-progress"></div>
${NAV}
${BANNER}
  <main>
    <section class="hero">
      <div class="hero-inner">
        <div>
          <span class="kicker">${esc(cat)}</span>
          <h1>${esc(title)}</h1>
          <div class="breadcrumbs"><a href="/">Mentoria MAG</a> / <a href="/blog">Blog</a> / ${esc(cat)}</div>
          <div class="post-meta">Por ${esc(nomeDoAutor(p.author_name))} <span class="dot"></span> ${esc(date)} <span class="dot"></span> ${mins} min de leitura</div>
          <div class="share-row"><button class="share-btn" type="button" onclick="magShare(this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>Compartilhar</button></div>
        </div>
      </div>
    </section>
    <div class="post-layout${tocHtml ? ' com-toc' : ''}">
${tocHtml}
      <article class="prose">
${resumoHtml}
${bodyHtml}
      </article>
    </div>
${CTA}
  </main>
${FOOTER}
${SHARE_SCRIPT}
${PROGRESS_SCRIPT}
${TOC_SCRIPT}
  <script>(function(){try{var K='mag_vid',v=localStorage.getItem(K);if(!v){v=(window.crypto&&crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(36).slice(2));localStorage.setItem(K,v);}fetch('${SUPA_URL}/rest/v1/blog_views',{method:'POST',headers:{apikey:'${SUPA_KEY}',Authorization:'Bearer ${SUPA_KEY}','Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({post_slug:'${p.slug}',visitor_id:v})}).catch(function(){});}catch(e){}})();</script>
</body>
</html>`;
}

function renderIndex(posts) {
  const cards = posts.map((p) => `
          <a class="post-card" href="/blog/${esc(p.slug)}">
            <span class="tag">${esc(p.category || 'Artigo')}</span>
            <h3>${esc(comProfessor(p.title))}</h3>
            <p>${esc(comProfessor(p.excerpt || ''))}</p>
            <span class="more">Ler artigo →</span>
          </a>`).join('\n');
  const empty = `<p class="section-intro">Em breve, novos artigos por aqui.</p>`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog da Mentoria MAG | Estudos e Concursos da PMMG (Professor Tenente Gustavo)</title>
  <meta name="description" content="Artigos sobre como estudar e passar nos concursos da PMMG — Soldado, Sargento, Oficial e CHO — com método científico, pelo Prof. Tenente Gustavo." />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${ROOT}/blog" />
  <link rel="stylesheet" href="/seo-pages.css" />
  <link rel="icon" type="image/png" href="/logo-mag.png" />
  <meta property="og:title" content="Blog da Mentoria MAG | Estudos e Concursos da PMMG" />
  <meta property="og:description" content="Como estudar e passar nos concursos da PMMG, com método científico do Prof. Tenente Gustavo." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${ROOT}/blog" />
  <meta property="og:image" content="${ROOT}/og-mag-azul.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${ROOT}/og-mag-azul.jpg" />
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Blog', name: 'Blog da Mentoria MAG', url: `${ROOT}/blog`, publisher: { '@type': 'Organization', name: 'Mentoria MAG', logo: { '@type': 'ImageObject', url: `${ROOT}/logo-mag.png` } } })}</script>
</head>
<body>
${NAV}
${BANNER}
  <main>
    <section class="hero">
      <div class="hero-inner">
        <div>
          <span class="kicker">Artigos · PMMG</span>
          <h1>Blog da <em>Mentoria MAG</em></h1>
          <p class="lead">Estratégia, rotina e a ciência da aprendizagem aplicadas aos concursos da Polícia Militar de Minas Gerais — escritas por quem viveu por dentro a carreira.</p>
          <div class="breadcrumbs"><a href="/">Mentoria MAG</a> / Blog</div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="shell">
        <h2 class="section-title">Últimos artigos</h2>
        ${posts.length ? `<div class="post-grid">${cards}\n        </div>` : empty}
      </div>
    </section>
${CTA}
  </main>
${FOOTER}
</body>
</html>`;
}

function notFound() {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Artigo não encontrado | Mentoria MAG</title><meta name="robots" content="noindex"/><link rel="stylesheet" href="/seo-pages.css"/><link rel="icon" type="image/png" href="/logo-mag.png"/></head><body>${NAV}<main><section class="hero"><div class="hero-inner"><div><span class="kicker">Blog</span><h1>Artigo não encontrado</h1><p class="lead">Esse endereço não existe ou o artigo saiu do ar. <a href="/blog">Voltar ao blog</a>.</p></div></div></section></main>${FOOTER}</body></html>`;
}

export default async function handler(req, res) {
  try {
    const slug = (req.query && req.query.slug) ? String(req.query.slug) : '';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Cache curto: o mentor edita/publica e espera ver a mudança quase na hora.
    // s-maxage baixo = a maioria das visitas já pega o conteúdo fresco; o
    // stale-while-revalidate cobre só o instante entre uma edição e a próxima
    // visita, sem deixar o artigo "preso" com a versão antiga por minutos.
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');

    if (slug) {
      const { data } = await supabase.from('blog_posts').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
      if (!data) { res.statusCode = 404; return res.end(notFound()); }
      return res.end(renderArticle(data));
    }
    const { data } = await supabase.from('blog_posts').select('*').eq('status', 'published').order('published_at', { ascending: false });
    return res.end(renderIndex(data || []));
  } catch (err) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.statusCode = 500;
    return res.end(`<!DOCTYPE html><meta charset="utf-8"><p>Erro ao carregar o blog.</p>`);
  }
}

