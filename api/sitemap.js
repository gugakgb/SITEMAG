// Gera o sitemap.xml: páginas fixas + artigos publicados do banco.
import { createClient } from '@supabase/supabase-js';

const ROOT = 'https://tenentegustavo.com.br';
const SUPA_URL = process.env.SUPABASE_URL || 'https://xckxgsbbitgbrlkoivgg.supabase.co';
const SUPA_KEY = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPA_URL, SUPA_KEY || 'anon-key-missing', { auth: { persistSession: false } });

const STATIC = [
  ['/', '1.0'], ['/concurso-pmmg', '0.95'], ['/concurso-soldado-pmmg', '0.9'],
  ['/concurso-oficial-pmmg', '0.9'], ['/concurso-sargento-pmmg', '0.9'], ['/cho-pmmg', '0.9'],
  ['/edital-pmmg', '0.9'], ['/curso-preparatorio-pmmg', '0.9'], ['/blog', '0.8'],
];

export default async function handler(req, res) {
  let posts = [];
  try {
    const { data } = await supabase.from('blog_posts').select('slug, updated_at, published_at').eq('status', 'published').order('published_at', { ascending: false });
    posts = data || [];
  } catch (_) { /* segue só com as estáticas */ }

  const today = new Date().toISOString().slice(0, 10);
  const url = (loc, prio, lastmod, freq = 'weekly') =>
    `  <url>\n    <loc>${ROOT}${loc}</loc>\n    <lastmod>${lastmod || today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`;

  const body = [
    ...STATIC.map(([loc, prio]) => url(loc, prio)),
    ...posts.map((p) => url(`/blog/${p.slug}`, '0.8', (p.updated_at || p.published_at || today).slice(0, 10), 'monthly')),
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
  res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
}
