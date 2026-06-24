# Brief per Claude Code — Sito Mauro Ghilardini

## Cos'è questo progetto
Sito personale di Mauro Ghilardini (cantante, compositore, autore — Bergamo).
Due file HTML già approvati come **design definitivo**, da portare in produzione:

- `Home.dc.html` — home single-page, scroll cinematografico (riferimento: jeffreymartin.webflow.io).
- `Spettacolo-Dormono.dc.html` — **scheda spettacolo PILOTA**. Questo è il modello da cui derivano TUTTE le altre schede spettacolo.

> Nota tecnica: i file `.dc.html` usano un piccolo runtime di anteprima (`support.js`).
> In produzione NON serve replicarlo: ricostruisci la stessa UI in HTML/CSS (+ il framework che preferisci, es. Next/Astro). Il valore è il **design e lo schema-dati**, non il formato del file. Tipografia, palette, spaziature, animazioni e struttura delle sezioni vanno riprodotti fedelmente.

## Stack visivo (da rispettare)
- Font display: **Anton** (titoli condensati maiuscoli). Serif testo: **EB Garamond**. UI/etichette: **Archivo**.
  - In futuro si potranno sostituire con i font commerciali di riferimento (Magnosans / Ten Oldstyle) senza toccare il layout.
- Palette terrosa: panna `#d9d6cc`, inchiostro `#1c1b18` / `#2b2823`, crema testo `#e7e3d8`, accento terracotta `#c2543a`, ambra `#d9a06a`, blu ardesia `#454e5b`.
- Scroll fluido inerziale (libreria **Lenis**). Sezioni hero in `position:sticky` che si impilano. Reveal progressivi allo scroll. Nessuna di queste animazioni dipende da Webflow.
- Bilingue **IT/EN** (switch già previsto: ogni stringa ha la coppia it/en).
- Mobile-first: breakpoint a 860px/680px (vedi le classi `.two`, `.gal`, `.credits` nel file pilota).

## La scheda spettacolo è una PAGINA-TEMPLATE guidata da dati
Ogni spettacolo = un record con questo schema. Tutte le sezioni si mostrano/nascondono in base ai dati presenti.

```ts
type Spettacolo = {
  slug: string;                 // es. "dormono-sulla-collina" → URL /repertorio/{slug}
  titolo: string;               // "Dormono sulla Collina"
  eyebrow_it: string;           // "Teatro Minimo · Reading musicale"
  eyebrow_en: string;
  // meta riga hero
  forma_it: string; forma_en: string;     // "Reading teatrale"
  durata: string;                          // "circa 80'"
  organico_it: string; organico_en: string;// "Trio · voce, chitarra, tastiere"
  hero_img: string;             // foto di scena a tutto schermo

  sinossi_lead_it/en: string;   // titolo grande sezione sinossi
  sinossi_it: string[];         // paragrafi (array)
  sinossi_en: string[];

  progetto_lead_it/en: string;  // frase forte note di regia
  progetto_it/en: string;       // testo libero

  locandina?: string;           // immagine locandina (sezione dedicata + download). Opzionale.
  locandina_nota_it/en?: string;

  foto: string[];               // galleria (la prima va a tutta larghezza)

  video: string[];              // ID YouTube (es. "pfDiz1cL9jM"). Click → embed autoplay.
                                // thumbnail automatica: https://i.ytimg.com/vi/{id}/hqdefault.jpg

  cast: { nome: string; ruolo_it/en: string; strumenti: string }[];
  crew: { ruolo_it/en: string; nome: string }[];

  budget_it/en?: string;        // se assente → "Su richiesta" / "On request"
  budget_nota_it/en?: string;

  scheda_tecnica_pdf?: string;  // se presente → bottone download. Se assente → riquadro "gestita da..." (vedi hasRider/noRider nel pilota)
  scheda_tecnica_nota_it/en?: string;

  cta_email: string;            // default info@mauroghilardini.it; oggetto = titolo spettacolo
};
```

### Regole di visibilità (importanti)
- **Locandina**: sezione mostrata solo se `locandina` esiste.
- **Scheda tecnica**: bottone PDF solo se `scheda_tecnica_pdf` esiste; altrimenti mostra il riquadro-nota. (Nel pilota: flag `hasRider`/`noRider`.)
- **Budget**: se vuoto → "Su richiesta".
- **Video**: 1, 2 o 3+ in griglia responsive auto-fit. Click-to-load (privacy, niente autoplay multipli).

## Dati del pilota già pronti (Dormono sulla Collina)
Sono dentro `Spettacolo-Dormono.dc.html`, nel metodo `renderVals()`. Video: `pfDiz1cL9jM`, `X81DjZye78w`, `ylw0anD2u6o`. Budget: "Su richiesta". Scheda tecnica: assente (gestita da Teatro Minimo). Cast e crew presi dalla locandina.

## La home linka alle schede
In `Home.dc.html`, sezione **Repertorio**: ogni titolo deve linkare a `/repertorio/{slug}`. Oggi i link sono `#` placeholder.

## L'editor (CMS) — requisito
Mauro deve poter creare/editare spettacoli **senza toccare codice**.
Raccomandazione: **CMS headless** con un form che espone esattamente lo schema sopra.
Opzioni: Sanity, Storyblok, o Decap/Netlify CMS (gratuito, basato su git).
Campi: testi IT/EN, upload immagini (hero/locandina/galleria), lista ID YouTube, ripetitori cast/crew, upload PDF scheda tecnica (opzionale), budget. Tutto il resto (animazioni, layout) resta nel tema, non editabile, così non si rompe nulla.

## Da fare lato responsive sulla HOME (già segnalato)
Sezioni Bio e Firma: sotto 900px passare a 1 colonna, foto sopra il testo, togliere `sticky`/`height:100vh`.
