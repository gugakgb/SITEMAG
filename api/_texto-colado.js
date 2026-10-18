// Converte texto colado do ChatGPT/Word (sem Markdown) em Markdown: subtítulos, listas,
// passos, citações, rótulos e a seção de fontes. Usado por api/blog.js.
// GERADO a partir de mentoria-mag/utils/blogTextoColado.ts — não edite aqui; mude lá e rode:
//   npx esbuild utils/blogTextoColado.ts --format=esm > ../SITEMAG/api/_texto-colado.js

const PONTUACAO_FINAL = /[.:;!?,…]$/;
const COMECA_MAIUSCULA = /^[A-ZÀ-Þ0-9“"¿¡]/;
const MARCADOR_MD = /^\s*(#{1,6}\s|>\s|\|.*\||```)/m;
const DOMINIO_SOLTO = /([.!?)”"])\s+((?:[a-z0-9-]+\.)+(?:com|org|net|edu|gov|br|io|info|co)(?:\.[a-z]{2})?(?:\/\S*)?(?:\s+\+\d+)?)\s*$/i;
const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function pareceTextoSemMarkdown(texto) {
  const s = String(texto || "").replace(/\r\n?/g, "\n").trim();
  if (!s || MARCADOR_MD.test(s)) return false;
  const linhas = s.split("\n").filter((l) => l.trim()).length;
  return linhas >= 3;
}
function pareceCopiaDoChatGPT(texto) {
  const s = String(texto || "").replace(/\r\n?/g, "\n").trim();
  if (!pareceTextoSemMarkdown(s)) return false;
  const embranco = (s.match(/\n[ \t]*\n/g) || []).length;
  const simples = (s.match(/[^\n]\n(?=[ \t]*\S)/g) || []).length;
  return simples >= Math.max(3, embranco * 2);
}
const ehSubtitulo = (l) => l.length >= 3 && l.length <= 90 && !PONTUACAO_FINAL.test(l) && COMECA_MAIUSCULA.test(l) && !/^[“"]/.test(l);
const rotuloDe = (l) => {
  const m = l.match(/^([A-ZÀ-Þ][^:]{1,40}):\s+(\S[\s\S]*)$/);
  if (!m || m[1].split(/\s+/).length > 6 || /[.!?]/.test(m[1])) return null;
  return { rotulo: m[1], resto: m[2] };
};
function textoColadoParaMarkdown(texto, tituloAtual = "") {
  const fontesSoltas = [];
  let linhas = String(texto || "").replace(/\r\n?/g, "\n").split("\n").map((l) => l.replace(/\s+$/, "").trim()).filter(Boolean);
  let titulo = "";
  if (linhas.length > 1 && ehSubtitulo(linhas[0]) && !/^([-*•]|\d+[.)]|[A-H][.)])\s/.test(linhas[0])) {
    if (!tituloAtual.trim() || semAcento(tituloAtual) === semAcento(linhas[0])) {
      titulo = linhas[0];
      linhas = linhas.slice(1);
    }
  }
  const blocos = [];
  const add = (tipo, md2) => blocos.push({ tipo, md: md2 });
  for (let i = 0; i < linhas.length; i += 1) {
    let l = linhas[i];
    const dom = l.match(DOMINIO_SOLTO);
    if (dom && !/\]\(/.test(l.slice(-dom[2].length - 3))) {
      fontesSoltas.push(dom[2].replace(/\s+\+\d+$/, ""));
      l = l.slice(0, l.length - dom[0].length + dom[1].length).trim();
    }
    let m;
    if (m = l.match(/^[-*•]\s+(.+)$/)) {
      add("lista", `- ${m[1]}`);
      continue;
    }
    if (m = l.match(/^([A-E])\)\s+(.+)$/)) {
      add("lista", `- **${m[1]})** ${m[2]}`);
      continue;
    }
    if ((m = l.match(/^[A-H]\.\s+(.{3,80})$/)) && ehSubtitulo(m[1])) {
      add("texto", `## ${m[1]}`);
      continue;
    }
    if (m = l.match(/^(\d{1,2})[.)]\s+(.+)$/)) {
      if (ehSubtitulo(m[2])) add("texto", `### ${m[1]}. ${m[2]}`);
      else add("lista", `${m[1]}. ${m[2]}`);
      continue;
    }
    if (ehSubtitulo(l) && i < linhas.length - 1) {
      add("texto", `## ${l}`);
      continue;
    }
    if (/^[“"].+[”"][.!?]?$/.test(l)) {
      add("texto", `> ${l}`);
      continue;
    }
    const rot = rotuloDe(l);
    if (rot) {
      const vizinhoRotulo = (j) => j >= 0 && j < linhas.length && !!rotuloDe(linhas[j]);
      const md2 = `**${rot.rotulo}:** ${rot.resto}`;
      if (vizinhoRotulo(i - 1) || vizinhoRotulo(i + 1)) add("lista", `- ${md2}`);
      else add("texto", md2);
      continue;
    }
    add("texto", l);
  }
  let md = "";
  blocos.forEach((b, i) => {
    if (i === 0) {
      md = b.md;
      return;
    }
    const juntos = b.tipo === "lista" && blocos[i - 1].tipo === "lista";
    md += (juntos ? "\n" : "\n\n") + b.md;
  });
  return { md: md.trim(), titulo, fontesSoltas };
}
export {
  pareceCopiaDoChatGPT,
  pareceTextoSemMarkdown,
  textoColadoParaMarkdown
};
