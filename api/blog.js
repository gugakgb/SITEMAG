// Renderiza o blog a partir do Supabase, devolvendo HTML completo (SEO server-side).
// Rotas (via vercel.json): /blog -> índice ; /blog/<slug> -> artigo.
import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';

const ROOT = 'https://tenentegustavo.com.br';
const MAG = 'https://mag.tenentegustavo.com.br';
const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://xckxgsbbitgbrlkoivgg.supabase.co';
const SUPA_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const DEFAULT_OG = `${ROOT}/blog-og-default.png`;

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

const readingOf = (p) => p.reading_minutes || Math.max(1, Math.round((p.content_md || '').trim().split(/\s+/).filter(Boolean).length / 200));

const NAV = `
  <header class="topbar">
    <nav class="nav" aria-label="Navegação principal">
      <a class="brand" href="/"><img src="/logo-mag.png" alt="Mentoria MAG" /><span>Mentoria MAG</span></a>
      <div class="navlinks"><a href="/concurso-pmmg">Concurso PMMG</a><a href="/blog">Blog</a><a href="${MAG}/auth">Entrar</a></div>
    </nav>
  </header>`;

const SHARE_SCRIPT = `<script>function magShare(b){var t=(document.querySelector('meta[property="og:title"]')||{}).content||document.title;var u=location.href.split("?")[0];if(navigator.share){navigator.share({title:t,url:u}).catch(function(){});}else{navigator.clipboard&&navigator.clipboard.writeText(u);window.open("https://wa.me/?text="+encodeURIComponent(t+" "+u),"_blank","noopener");}}</script>`;

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

const FOOTER = `<footer class="footer"><div class="shell"><p>© 2026 Mentoria MAG · Tenente Gustavo. Conteúdo informativo e independente sobre concursos da PMMG.</p></div></footer>`;

function renderArticle(p) {
  const url = `${ROOT}/blog/${p.slug}`;
  const title = p.title || '';
  const seoTitle = p.seo_title || title;
  const desc = p.seo_description || p.excerpt || '';
  const og = p.og_image_url || DEFAULT_OG;
  const cat = p.category || 'Artigo';
  const mins = readingOf(p);
  const date = fmtDate(p.published_at);
  const bodyHtml = marked.parse(p.content_md || '', { mangle: false, headerIds: false });
  const ld = {
    '@context': 'https://schema.org',
    '@type': p.schema_type === 'NewsArticle' ? 'NewsArticle' : 'BlogPosting',
    headline: title,
    description: desc,
    author: { '@type': 'Person', name: p.author_name || 'Tenente Gustavo' },
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
${NAV}
  <main>
    <section class="hero">
      <div class="hero-inner">
        <div>
          <span class="kicker">${esc(cat)}</span>
          <h1>${esc(title)}</h1>
          <div class="breadcrumbs"><a href="/">Mentoria MAG</a> / <a href="/blog">Blog</a> / ${esc(cat)}</div>
          <div class="post-meta">Por ${esc(p.author_name || 'Tenente Gustavo')} <span class="dot"></span> ${esc(date)} <span class="dot"></span> ${mins} min de leitura</div>
          <div class="share-row"><button class="share-btn" type="button" onclick="magShare(this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>Compartilhar</button></div>
        </div>
      </div>
    </section>
    <article class="prose">
${bodyHtml}
    </article>
${CTA}
  </main>
${FOOTER}
${SHARE_SCRIPT}
</body>
</html>`;
}

function renderIndex(posts) {
  const cards = posts.map((p) => `
          <a class="post-card" href="/blog/${esc(p.slug)}">
            <span class="tag">${esc(p.category || 'Artigo')}</span>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.excerpt || '')}</p>
            <span class="more">Ler artigo →</span>
          </a>`).join('\n');
  const empty = `<p class="section-intro">Em breve, novos artigos por aqui.</p>`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog da Mentoria MAG | Estudos e Concursos da PMMG (Tenente Gustavo)</title>
  <meta name="description" content="Artigos sobre como estudar e passar nos concursos da PMMG — Soldado, Sargento, Oficial e CHO — com método científico, pelo Prof. Tenente Gustavo." />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${ROOT}/blog" />
  <link rel="stylesheet" href="/seo-pages.css" />
  <link rel="icon" type="image/png" href="/logo-mag.png" />
  <meta property="og:title" content="Blog da Mentoria MAG | Estudos e Concursos da PMMG" />
  <meta property="og:description" content="Como estudar e passar nos concursos da PMMG, com método científico do Prof. Tenente Gustavo." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${ROOT}/blog" />
  <meta property="og:image" content="${ROOT}/blog/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${ROOT}/blog/og.png" />
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Blog', name: 'Blog da Mentoria MAG', url: `${ROOT}/blog`, publisher: { '@type': 'Organization', name: 'Mentoria MAG', logo: { '@type': 'ImageObject', url: `${ROOT}/logo-mag.png` } } })}</script>
</head>
<body>
${NAV}
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
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');

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

