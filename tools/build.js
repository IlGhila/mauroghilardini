#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   BUILD SEO — genera i file derivati del sito. Eseguire dopo ogni
   modifica a index.html, repertorio/index.html, data/spettacoli/*.json
   o date.js:

       node tools/build.js

   Produce:
     · repertorio/<slug>/index.html — una pagina statica per ogni
       spettacolo (title/description/canonical/OG propri), basata sul
       visualizzatore repertorio/index.html con lo slug "cotto" dentro,
       più i link alle altre schede
     · en/index.html — homepage inglese (stesso contenuto di index.html,
       meta in inglese, lingua iniziale EN)
     · date/index.html — l'elenco date scritto anche in HTML statico
       (il file è insieme sorgente e destinazione: si riscrive in place
       fra i marcatori "date:*")
     · sitemap.xml — con tutte le pagine, incluse le schede
   ════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://mauroghilardini.netlify.app'; // ← aggiornare al cambio dominio

// Sostituzione obbligatoria: se l'ancora non c'è più il build fallisce,
// così una modifica al template non produce mai pagine silenziosamente rotte.
function mustReplace(str, find, repl, label) {
  if (!str.includes(find)) throw new Error('Ancora non trovata (' + label + '): ' + find);
  return str.split(find).join(repl);
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Description da lead + primo paragrafo della sinossi, tagliata a misura di SERP
function buildDescription(show) {
  const lead = (show.sinossi_lead_it || '').trim();
  const first = ((show.sinossi_it || [])[0] || '').trim();
  let d = (lead + ' ' + first).trim();
  if (!d) d = show.titolo + ' — uno spettacolo di Mauro Ghilardini.';
  if (d.length > 158) {
    d = d.slice(0, 155);
    d = d.slice(0, d.lastIndexOf(' ')) + '…';
  }
  return d;
}

const GEN_NOTE = '\n<!-- GENERATO da tools/build.js — non modificare a mano: rigenera con `node tools/build.js` -->';

/* ── 1 · SCHEDE SPETTACOLO ─────────────────────────────────────── */

function buildSchede() {
  const template = fs.readFileSync(path.join(ROOT, 'repertorio', 'index.html'), 'utf8');
  const dir = path.join(ROOT, 'data', 'spettacoli');
  const slugs = [];

  // Tutti gli spettacoli in memoria prima di generare: ogni scheda deve poter
  // linkare le altre (vedi blocco "Altri spettacoli" più sotto).
  const shows = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((file) => {
    const show = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (!show.slug || !show.titolo) throw new Error('JSON senza slug o titolo: ' + file);
    return show;
  });

  for (const show of shows) {
    const slug = show.slug;
    const url = BASE + '/repertorio/' + slug + '/';
    const title = show.titolo + ' — Mauro Ghilardini';
    const desc = buildDescription(show);
    const ogImg = show.hero_img ? BASE + '/' + encodeURI(show.hero_img) : BASE + '/images/og-cover.jpg';

    let out = template;
    out = mustReplace(out, '<!DOCTYPE html>', '<!DOCTYPE html>' + GEN_NOTE, 'nota generazione');

    // Head: meta propri della scheda
    out = mustReplace(out, '<title>Repertorio — Mauro Ghilardini</title>', '<title>' + esc(title) + '</title>', 'title');
    out = mustReplace(out,
      '<meta name="description" content="Il repertorio di Mauro Ghilardini: teatro, letture musicali, concerti acustici e con band. Schede degli spettacoli con foto, video e materiali per gli organizzatori.">',
      '<meta name="description" content="' + esc(desc) + '">', 'description');
    out = mustReplace(out,
      '<link rel="canonical" href="' + BASE + '/repertorio/">',
      '<link rel="canonical" href="' + url + '">', 'canonical');
    out = mustReplace(out, '<meta property="og:title" content="Repertorio — Mauro Ghilardini">', '<meta property="og:title" content="' + esc(title) + '">', 'og:title');
    out = mustReplace(out,
      '<meta property="og:description" content="Il repertorio di Mauro Ghilardini: teatro, letture musicali, concerti acustici e con band.">',
      '<meta property="og:description" content="' + esc(desc) + '">', 'og:description');
    out = mustReplace(out, '<meta property="og:url" content="' + BASE + '/repertorio/">', '<meta property="og:url" content="' + url + '">', 'og:url');
    out = mustReplace(out, '<meta property="og:image" content="' + BASE + '/images/og-cover.jpg">', '<meta property="og:image" content="' + esc(ogImg) + '">', 'og:image');
    // L'hero non è la og-cover 1200×630: via tipo e dimensioni, resta solo l'alt
    out = mustReplace(out, '<meta property="og:image:type" content="image/jpeg">', '', 'og:image:type');
    out = mustReplace(out, '<meta property="og:image:width" content="1200">', '', 'og:image:width');
    out = mustReplace(out, '<meta property="og:image:height" content="630">', '', 'og:image:height');
    out = mustReplace(out, '<meta property="og:image:alt" content="Mauro Ghilardini">', '<meta property="og:image:alt" content="' + esc(show.titolo) + '">', 'og:image:alt');
    out = mustReplace(out, '<meta name="twitter:title" content="Repertorio — Mauro Ghilardini">', '<meta name="twitter:title" content="' + esc(title) + '">', 'twitter:title');
    out = mustReplace(out,
      '<meta name="twitter:description" content="Il repertorio di Mauro Ghilardini: teatro, letture musicali, concerti acustici e con band.">',
      '<meta name="twitter:description" content="' + esc(desc) + '">', 'twitter:description');
    out = mustReplace(out, '<meta name="twitter:image" content="' + BASE + '/images/og-cover.jpg">', '<meta name="twitter:image" content="' + esc(ogImg) + '">', 'twitter:image');

    // Dati strutturati
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: show.titolo,
      description: desc,
      image: ogImg,
      url: url,
      inLanguage: 'it',
      creator: { '@type': 'Person', name: 'Mauro Ghilardini', url: BASE + '/' },
    };
    out = mustReplace(out, '</head>',
      '<script type="application/ld+json">\n' + JSON.stringify(ld, null, 2) + '\n</script>\n</head>', 'json-ld');

    // Percorsi: la pagina vive a /repertorio/<slug>/, tutto diventa assoluto
    out = mustReplace(out, '<script src="../date.js"></script>', '<script src="/date.js"></script>', 'date.js');
    out = mustReplace(out, "const ROOT = '../';", "const ROOT = '/';", 'ROOT');
    out = mustReplace(out, "const slug = params.get('slug') || '';", 'const slug = ' + JSON.stringify(slug) + ';', 'slug');
    out = mustReplace(out, "fetch('../data/spettacoli/'", "fetch('/data/spettacoli/'", 'fetch scheda');
    out = mustReplace(out, "fetch('../data/spettacoli.json')", "fetch('/data/spettacoli.json')", 'fetch elenco');
    out = mustReplace(out, 'href="../index.html#repertorio"', 'href="/#repertorio"', 'link home');
    out = mustReplace(out, "location.href='../index.html?t='", "location.href='/?t='", 'link home js');

    // Contenuto statico per i crawler senza JS: il rendering lo sostituisce.
    // #page parte con opacity:0, quindi non è mai visibile prima del render;
    // se il JS non parte, il timer di sicurezza lo rivela comunque.
    const sotto = [show['forma_it'], show.durata, show['organico_it']].filter(Boolean).join(' · ');
    const staticHtml = [
      '<section style="padding:140px clamp(16px,4vw,56px) 40px;display:flex;flex-direction:column;gap:14px;">',
      show['eyebrow_it'] ? '  <span style="font-size:11px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:#d9a06a;">' + esc(show['eyebrow_it']) + '</span>' : '',
      '  <h1 style="font-family:\'Anton\',sans-serif;text-transform:uppercase;font-size:clamp(44px,9vw,140px);line-height:.9;color:#e7e3d8;">' + esc(show.titolo) + '</h1>',
      sotto ? '  <p style="font-family:\'EB Garamond\',serif;font-size:clamp(15px,1.6vw,20px);color:rgba(231,227,216,.86);">' + esc(sotto) + '</p>' : '',
      '</section>',
      '<section style="padding:0 clamp(16px,4vw,56px) 80px;max-width:860px;display:flex;flex-direction:column;gap:18px;">',
      show['sinossi_lead_it'] ? '  <h2 style="font-family:\'Anton\',sans-serif;text-transform:uppercase;font-size:clamp(24px,3vw,44px);line-height:1;color:#e7e3d8;">' + esc(show['sinossi_lead_it']) + '</h2>' : '',
      ...((show.sinossi_it || []).map((p) => '  <p style="font-family:\'EB Garamond\',serif;font-size:17px;line-height:1.6;color:rgba(231,227,216,.86);">' + esc(p) + '</p>')),
      show['progetto_it'] ? '  <p style="font-family:\'EB Garamond\',serif;font-size:17px;line-height:1.6;color:rgba(231,227,216,.86);">' + esc(show['progetto_it']) + '</p>' : '',
      '</section>',
    ].filter(Boolean).join('\n');
    out = mustReplace(out, '<div id="page"></div>', '<div id="page">\n' + staticHtml + '\n</div>', 'contenuto statico');

    // Altri spettacoli: link veri, in HTML, verso le altre 13 schede. La home
    // costruisce il rail via JS, quindi senza questo blocco le schede non hanno
    // nessun link in entrata nell'HTML servito e Google le lascia in
    // "Rilevata, ma attualmente non indicizzata".
    const altriHtml = [
      '<nav id="altri" aria-label="Altri spettacoli">',
      '  <span class="lbl" id="altriLabel">Altri spettacoli</span>',
      '  <div class="grid">',
      ...shows.filter((o) => o.slug !== slug).map(
        (o) => '    <a href="/repertorio/' + o.slug + '/">' + esc(o.titolo) + '</a>'),
      '  </div>',
      '</nav>',
    ].join('\n');
    out = mustReplace(out, '<!-- ALTRI-SPETTACOLI -->', altriHtml, 'altri spettacoli');

    const outDir = path.join(ROOT, 'repertorio', slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), out);
    slugs.push(slug);
  }
  return slugs;
}

/* ── 2 · HOMEPAGE INGLESE /en/ ─────────────────────────────────── */

function buildEn() {
  let out = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  out = mustReplace(out, '<!DOCTYPE html>', '<!DOCTYPE html>' + GEN_NOTE, 'nota generazione');
  out = mustReplace(out, '<html lang="it">', '<html lang="en">', 'lang');

  // Title (compare identico in <title>, og:title e twitter:title)
  out = mustReplace(out,
    'Mauro Ghilardini — Cantante, compositore e interprete',
    'Mauro Ghilardini — Singer, composer and performer', 'title');

  out = mustReplace(out,
    '<meta name="description" content="Mauro Ghilardini, cantante e compositore a Bergamo: canto moderno e lirico, spettacoli dal vivo, repertorio, scrittura e lezioni di canto. Date, video e contatti.">',
    '<meta name="description" content="Mauro Ghilardini, singer and composer from Bergamo, Italy: modern and classical voice, live shows, repertoire and writing. Dates, videos and contact.">', 'description');
  out = mustReplace(out,
    '<meta property="og:description" content="Mauro Ghilardini, cantante e compositore a Bergamo: canto moderno e lirico, spettacoli dal vivo, repertorio, scrittura e lezioni di canto.">',
    '<meta property="og:description" content="Mauro Ghilardini, singer and composer from Bergamo, Italy: modern and classical voice, live shows, repertoire and writing.">', 'og:description');
  out = mustReplace(out,
    '<meta name="twitter:description" content="Mauro Ghilardini, cantante e compositore a Bergamo: canto moderno e lirico, spettacoli dal vivo, repertorio e lezioni di canto.">',
    '<meta name="twitter:description" content="Mauro Ghilardini, singer and composer from Bergamo, Italy: modern and classical voice, live shows and repertoire.">', 'twitter:description');

  out = mustReplace(out,
    '<link rel="canonical" href="' + BASE + '/">',
    '<link rel="canonical" href="' + BASE + '/en/">', 'canonical');
  out = mustReplace(out,
    '<meta property="og:url" content="' + BASE + '/">',
    '<meta property="og:url" content="' + BASE + '/en/">', 'og:url');
  out = mustReplace(out,
    '<meta property="og:locale" content="it_IT">',
    '<meta property="og:locale" content="en_US">', 'og:locale');

  // Dati strutturati in inglese
  out = mustReplace(out,
    '"jobTitle": ["Cantante", "Compositore", "Musicista", "Insegnante di canto"],',
    '"jobTitle": ["Singer", "Composer", "Musician", "Voice teacher"],', 'jobTitle');
  out = mustReplace(out,
    '"description": "Cantante e compositore. Canto moderno e lirico, spettacoli dal vivo, composizione e didattica musicale.",',
    '"description": "Singer and composer. Modern and classical voice, live shows, composition and music teaching.",', 'ld description');

  // Lingua iniziale: inglese (il toggle IT/EN resta disponibile)
  out = mustReplace(out,
    "state = { lang: detectLang(), menuOpen: false, datesOpen: false };",
    "state = { lang: 'en', menuOpen: false, datesOpen: false };", 'stato lingua');

  const outDir = path.join(ROOT, 'en');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), out);
}

/* ── 3 · ELENCO DATE STATICO in /date/ ─────────────────────────── */

// /date/ costruisce le righe via JS: nell'HTML servito restavano due <div>
// vuoti, cioè una pagina di due righe di testo. Google l'ha classificata
// "Rilevata, ma attualmente non indicizzata" senza mai scansionarla. Qui le
// date finiscono anche in HTML statico; il JS le rimpiazza al load, quindi per
// chi naviga non cambia nulla.
//
// La pagina è sia sorgente sia destinazione, quindi si scrive fra marcatori
// (non con mustReplace, che al secondo giro non troverebbe più l'ancora).
function fillBetween(str, start, end, content, label) {
  const i = str.indexOf(start);
  const j = i === -1 ? -1 : str.indexOf(end, i);
  if (i === -1 || j === -1) throw new Error('Marcatori non trovati (' + label + '): ' + start);
  return str.slice(0, i + start.length) + '\n' + content + '\n' + str.slice(j);
}

function buildDate() {
  // date.js è uno script da browser: si esegue dandogli un finto `window`.
  const win = {};
  new Function('window', fs.readFileSync(path.join(ROOT, 'date.js'), 'utf8'))(win);
  const dates = win.MG_DATE;
  if (!Array.isArray(dates) || !dates.length) throw new Error('date.js non espone window.MG_DATE');

  // Etichette allineate a quelle del JS della pagina (versione italiana:
  // è la lingua di default, e il toggle EN ridisegna comunque tutto).
  const tipoIt = { sushi: 'Sushi Cornucopia', lydian: 'Lydian', teatro: 'Teatro', acustico: 'Acustico', festa: 'Evento privato', concerto: 'Concerto', incontro: 'Incontro' };
  const mesiIt = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  const mesiFullIt = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  const today = new Date().toISOString().slice(0, 10);
  const all = dates.filter((d) => !d.nascosta).slice().sort((a, b) => (a.data < b.data ? -1 : 1));
  const future = all.filter((d) => d.data >= today);
  const past = all.filter((d) => d.data < today).reverse();

  // Niente locandine né link a Maps in statico: sono elementi interattivi che
  // il JS ricostruisce comunque. Qui serve il testo, non i comandi.
  const row = (d) => {
    const [, m, g] = d.data.split('-').map(Number);
    return [
      '  <div class="date-row">',
      '    <div class="date-col">' + g + ' ' + mesiIt[m - 1] + (d.ora ? '<span class="ora">' + esc(d.ora) + '</span>' : '') + '</div>',
      '    <div class="info-col">',
      '      <div class="titolo">' + esc(d.titolo) + '</div>',
      d.luogo ? '      <div class="luogo"><span>' + esc(d.luogo) + '</span></div>' : '',
      '      <div class="tipo">' + esc(tipoIt[d.tipo] || d.tipo) + '</div>',
      '    </div>',
      '    <div class="thumb-col"><div class="thumb-placeholder"></div></div>',
      '  </div>',
    ].filter(Boolean).join('\n');
  };

  const grouped = (list, vuoto) => {
    if (!list.length) return '  <div class="empty">' + vuoto + '</div>';
    let key = '';
    const out = [];
    for (const d of list) {
      const [y, m] = d.data.split('-').map(Number);
      if (y + '-' + m !== key) {
        key = y + '-' + m;
        out.push('  <div class="month-head">' + mesiFullIt[m - 1] + ' ' + y + '</div>');
      }
      out.push(row(d));
    }
    return out.join('\n');
  };

  const file = path.join(ROOT, 'date', 'index.html');
  let out = fs.readFileSync(file, 'utf8');
  out = fillBetween(out, '<!-- date:prossime -->', '<!-- /date -->',
    grouped(future, 'Nessuna data in programma al momento.'), 'prossime date');
  out = fillBetween(out, '<!-- date:passate -->', '<!-- /date -->',
    grouped(past, ''), 'date passate');
  fs.writeFileSync(file, out);
  return { future: future.length, past: past.length };
}

/* ── 4 · SITEMAP ───────────────────────────────────────────────── */

function buildSitemap(slugs) {
  const today = new Date().toISOString().slice(0, 10);
  const alt =
    '    <xhtml:link rel="alternate" hreflang="it" href="' + BASE + '/"/>\n' +
    '    <xhtml:link rel="alternate" hreflang="en" href="' + BASE + '/en/"/>\n' +
    '    <xhtml:link rel="alternate" hreflang="x-default" href="' + BASE + '/"/>\n';

  const urls = [];
  const add = (loc, priority, extra) => {
    urls.push('  <url>\n    <loc>' + loc + '</loc>\n' + (extra || '') + '    <lastmod>' + today + '</lastmod>\n    <priority>' + priority + '</priority>\n  </url>');
  };
  add(BASE + '/', '1.0', alt);
  add(BASE + '/en/', '0.8', alt);
  add(BASE + '/date/', '0.8');
  add(BASE + '/insegnamento/', '0.7');
  add(BASE + '/scrittura/', '0.7');
  add(BASE + '/press.html', '0.6');
  for (const slug of slugs) add(BASE + '/repertorio/' + slug + '/', '0.6');

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.join('\n') + '\n</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
}

const slugs = buildSchede();
buildEn();
const date = buildDate();
buildSitemap(slugs);
console.log('OK — generati: ' + slugs.length + ' schede spettacolo, en/index.html, '
  + 'elenco date (' + date.future + ' future, ' + date.past + ' passate), sitemap.xml');
