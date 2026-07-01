# Brief — Ottimizzazione finale pre-lancio

Audit del sito (index.html + date/ + repertorio/ + scrittura/ + config Netlify) su quattro assi: sicurezza, precisione del codice, velocità, mobile vs desktop.

**Stato generale: buono.** La base di sicurezza è già sopra la media (CSP, X-Frame-Options, nosniff, /admin bloccato, SRI su Lenis, `rel="noopener"` su tutti i 12 target=_blank, embed YouTube no-cookie, niente cookie di terze parti). I problemi trovati sono quasi tutti di peso asset e due bug mobile.

---

## 1. SICUREZZA

### 1a. `editor-date.html` è pubblico ⚠️ (priorità alta)
L'editor delle date è deployato alla radice del sito. Non ha credenziali di scrittura (salva in locale), ma espone la meccanica interna e non ha motivo di stare online. Stesso trattamento di /admin in `netlify.toml`:
```toml
[[redirects]]
  from = "/editor-date.html"
  to = "/"
  status = 404
  force = true
```

### 1b. File di lavoro deployati (priorità alta)
Questi file finiscono online e sono raggiungibili se qualcuno indovina l'URL:
- `brief-*.md` (i brief di lavorazione)
- `recensioni-chiaroscuro.txt` (48 KB di materiale di scrittura)
- `Spettacolo-Dormono.dc.html` (componente orfano alla radice)
- `Setlist` non c'è (ok, è su D:)

Soluzione: spostarli in una cartella `_lavorazione/` esclusa dal deploy, oppure aggiungerli a un file `.netlifyignore` / rimuoverli dal publish. In alternativa redirect 404 come sopra.

### 1c. Form contatti: anti-spam (priorità media)
Il form Formspree non ha honeypot: arriverà spam da bot. Aggiungere dentro il `<form>`:
```html
<input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
```

### 1d. Accettato e documentato (nessuna azione)
- CSP con `unsafe-inline`/`unsafe-eval`: richiesto dal runtime DC (`new Function` in support.js). Già commentato in netlify.toml. Ok.
- `img-src https:` ampio: tollerabile per un sito vetrina.

---

## 2. VELOCITÀ (l'intervento con più resa)

### 2a. Immagini fuori peso ⚠️ (priorità alta — 31 MB totali in /images)
Target: hero/piastre ≤ 250 KB, gallerie ≤ 200 KB, larghezza max 1600–1920px, tutto WebP q~80.

| File | Peso | Nota |
|---|---|---|
| `REPERTORIO/live-aid-tribute/hero.jpg` | 1.86 MB | JPG, da convertire |
| `REPERTORIO/sushi-cornucopia/hero.png` | 1.56 MB | PNG per una foto: sempre sbagliato |
| `REPERTORIO/malelingue/DSC01853.webp` | 1.44 MB | webp ma risoluzione piena |
| `REPERTORIO/malelingue/DSC01841.webp` | 1.19 MB | idem |
| `scrittura/image_30.jpg` | 1.01 MB | |
| `REPERTORIO/robin-hood/hero.webp` | 913 KB | |
| `scrittura/cc.png` | 839 KB | PNG fotografico |
| `REPERTORIO/dormono/locandina.jpg` | 780 KB | |
| `angeli-del-natale/locandina.jpg` | 675 KB | |
| `mauro-03.webp` (bio) | 663 KB | above-the-fold su mobile |

Più i secondi piani: WA00xx del live-aid (600–870 KB l'uno), locandine 300–460 KB.

### 2b. PDF da 8.4 MB (priorità media)
`FIVE AID proposta.pdf` è linkato dalle schede: chi lo tocca su mobile scarica 8.4 MB. Comprimerlo (target < 2 MB) o segnalare il peso nel link.

### 2c. Font Google render-blocking (priorità bassa)
Il CSS dei font blocca il primo render su tutte e 4 le pagine. `display=swap` c'è già (bene). Opzionale: self-hosting dei 3 font (woff2 in /fonts) → elimina 2 handshake DNS/TLS e il punto di dipendenza esterno. Da fare con calma post-lancio.

### 2d. Già a posto (nessuna azione)
- `tema.mp3` 2.7 MB ma `preload="none"`: non pesa finché non si attiva. Ok.
- `loading="lazy"` presente su piastre repertorio e cover singoli.
- Lenis da CDN con SRI. Prerender Netlify attivo per i crawler.

---

## 3. MOBILE vs DESKTOP (due bug reali)

### 3a. BUG — Il nome hero mobile ingrandito non ha effetto ⚠️
Esistono due regole in conflitto sullo stesso elemento:
- riga ~127: `#top h1 { font-size:clamp(56px,16vw,120px) !important; }` (blocco mobile storico)
- riga ~207: `#heroH1 { font-size:clamp(66px,20vw,150px); }` (aggiunta recente)

La prima vince (ha `!important`). L'ingrandimento chiesto **non è mai andato in produzione**. Rimedio: unificare — eliminare una delle due regole e tenere una sola fonte di verità (consiglio: aggiornare il blocco storico `#top h1` ai valori nuovi e cancellare la regola doppia).

### 3b. BUG — Piastre repertorio invisibili su touch ⚠️
Il nuovo comportamento "immagini fuse con lo sfondo, illuminate solo in hover" non ha fallback touch: su smartphone/tablet non esiste hover, quindi le immagini restano spente per sempre. Rimedio minimo:
```css
@media (hover:none){ .rep-plate-img { --lit:.6; } }
```
oppure ripristinare su mobile l'illuminazione guidata dallo scroll (comportamento precedente) solo dentro `@media (hover:none)`.

### 3c. Rifiniture mobile (priorità bassa)
- `#heroName { bottom:13vh }` era per non sovrapporre lo scroll-hint; ora l'hint sparisce quando entra il nome → il nome può tornare più in basso (più simile al desktop).
- `button, a { min-height:44px }` globale su mobile: giusto per i tap target, ma verificare che non deformi i link piccoli inline (es. "Progarchives →").

---

## 4. PRECISIONE / SEO

### 4a. Sitemap incompleta (priorità media)
`sitemap.xml` elenca /, /date/, /repertorio/ ma **manca /scrittura/**. E i `lastmod` sono fermi al 2026-06-26. Aggiornare.

### 4b. Al cambio dominio (promemoria)
Canonical, robots, sitemap e JSON-LD puntano a `mauroghilardini.netlify.app`. Quando arriva il dominio definitivo vanno aggiornati tutti (già tracciato in memoria di lavoro).

### 4c. Pulizia repo (priorità bassa)
- `Spettacolo-Dormono.dc.html` orfano alla radice (vedi 1b).
- In `data/spettacoli/` verificare che i link a PDF/scheda tecnica esistano tutti (nessun 404 interno).

---

## Ordine di esecuzione proposto
1. **3a + 3b** — due bug, cinque minuti, impatto visivo diretto.
2. **1a + 1b + 1c** — sicurezza/igiene: redirect editor, esclusione file di lavoro, honeypot.
3. **2a** — compressione immagini (il grosso del guadagno prestazionale; script batch con cwebp/sharp).
4. **4a** — sitemap.
5. **2b, 2c, 3c, 4c** — rifiniture post-lancio.
