// Avisa o Bing (e Yandex, Seznam, Naver...) na hora que um artigo é publicado ou
// editado, pelo protocolo IndexNow. O Google não usa IndexNow: para ele vale o
// sitemap.xml (com a data de atualização de cada artigo).
// Chamado pelo painel (mag.tenentegustavo.com.br) ao salvar artigo publicado.
// A chave é pública por desenho do protocolo: o arquivo /<chave>.txt prova que o site é nosso.
import { createClient } from '@supabase/supabase-js';

const ROOT = 'https://tenentegustavo.com.br';
const KEY = 'ea0cbd48bfcb66e0b495c9c790b7a732';
const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://xckxgsbbitgbrlkoivgg.supabase.co';
const SUPA_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPA_URL, SUPA_KEY || 'anon-key-missing', { auth: { persistSession: false } });
const ORIGENS = new Set(['https://mag.tenentegustavo.com.br', 'http://localhost:3000', 'http://localhost:5173']);

export default async function handler(req, res) {
  const origem = req.headers.origin || '';
  if (ORIGENS.has(origem)) res.setHeader('Access-Control-Allow-Origin', origem);
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

  const slug = String((req.query && req.query.slug) || '').toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,90}$/.test(slug)) { res.statusCode = 400; return res.end('{"ok":false,"erro":"slug"}'); }

  // Só avisa artigo que existe e está publicado (ninguém consegue usar isto para outra coisa).
  const { data } = await supabase.from('blog_posts').select('slug').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (!data) { res.statusCode = 404; return res.end('{"ok":false,"erro":"nao publicado"}'); }

  try {
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'tenentegustavo.com.br',
        key: KEY,
        keyLocation: `${ROOT}/${KEY}.txt`,
        urlList: [`${ROOT}/blog/${slug}`, `${ROOT}/blog`],
      }),
    });
    return res.end(JSON.stringify({ ok: r.status === 200 || r.status === 202, status: r.status }));
  } catch (e) {
    res.statusCode = 502;
    return res.end('{"ok":false,"erro":"indexnow"}');
  }
}
