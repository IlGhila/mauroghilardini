# Brief — Navbar: controlli adattivi + rimozione fascia hover

## Contesto
Home page single-file `index.html` (Design Component `.dc.html`: `<x-dc>` + `<helmet>` + classe `Component extends DCLogic`).
La navbar `#navBar` è una barra fissa in alto, alta 64px, `pointer-events:none`, con tre controlli che galleggiano sopra la pagina: **equalizzatore musica** (sinistra), **IT / EN** (centro), **menu** (destra). Tutti color crema `#e7e3d8`.

⚠️ **Prerequisito:** applicare PRIMA il brief "equalizzatore musica" (sostituisce il disco in vinile con `.eq .bar`). Questo brief presuppone che il controllo musica sia già l'equalizzatore.

## Due problemi da risolvere insieme
1. **Fascia in hover sproporzionata.** Sfiorando musica o IT/EN, l'intera barra diventa un pannello nero al 70% + `blur(8px)` edge-to-edge. Sproporzionato, pesante, e asimmetrico (il menu è escluso).
2. **Controlli illeggibili a riposo sulle sezioni chiare.** I controlli crema spariscono su tutte le sezioni `#d9d6cc` (Manifesto, Dischi intro, Altre incisioni, Video, Bio, Contatti) — metà pagina.

## Soluzione unica
Rendere i controlli **adattivi**: invertono colore in base alla sezione che hanno sotto (crema su scuro, slate scuro su chiaro). Così sono sempre leggibili → **il backdrop in hover non serve più e va eliminato del tutto**. L'hover si limita a intensificare (opacità piena + rivelazione label musica). Zero pannelli, zero blur. Pura tipografia che galleggia e cambia colore.

- Colore su scuro: crema `#e7e3d8`
- Colore su chiaro: slate `#1c1b18`
- Transizione colore: 0.4s ease (flip pulito al passaggio tra sezioni)

---

## 1. Taggare le sezioni con `data-navtheme`
Aggiungere l'attributo `data-navtheme="dark"` o `"light"` a ciascun blocco elencato. Regola: sfondi scuri/medi (slate, olive, verde, foto) = **dark** (i controlli restano crema); sfondi `#d9d6cc` = **light** (i controlli diventano scuri).

| Elemento (àncora) | Valore |
|---|---|
| `<section id="top" data-screen-label="Hero"` | `dark` |
| `<section id="chi" data-screen-label="Manifesto"` | `light` |
| `<section id="dalvivo" data-screen-label="Prossima data"` | `dark` |
| `<div id="repHeader"` | `dark` |
| `<section id="repertorio" data-screen-label="Repertorio"` | `dark` |
| `<section id="dischi" data-screen-label="Dischi intro"` | `light` |
| `<section data-screen-label="Disco"` (nel `sc-for`, 1 sola occorrenza template) | `dark` |
| `<section id="singoli" data-screen-label="Singoli"` | `dark` |
| `<section data-screen-label="Altre incisioni"` | `light` |
| `<section id="scrittura"` | `dark` |
| `<section id="insegnamento"` | `dark` |
| `<section id="video"` | `light` |
| `<section id="bio" data-screen-label="Bio"` | `light` |
| `<section data-screen-label="Firma"` | `dark` |
| `<footer id="contatti" data-screen-label="Contatti"` | `light` |

Esempio (Hero):
```html
<section id="top" data-screen-label="Hero" data-navtheme="dark" style="position:sticky; top:0; height:100vh; background:transparent;">
```
Esempio (Manifesto):
```html
<section id="chi" data-screen-label="Manifesto" data-navtheme="light" style="...">
```
Il watcher cammina dagli elementi verso l'alto cercando l'antenato con `data-navtheme`, quindi basta taggare la sezione (non i figli). Default = `dark`, così il menu overlay aperto (fondo scuro) è già corretto senza tag.

---

## 2. CSS — rimuovere le regole fascia, definire la variabile colore

**TROVARE e RIMUOVERE:**
```css
  #navBar { background:rgba(20,19,17,0); backdrop-filter:blur(0px); -webkit-backdrop-filter:blur(0px); transition:background .3s ease, backdrop-filter .3s ease, -webkit-backdrop-filter .3s ease; }
  #navBar:has(.music-ctl:hover), #navBar:has(.lang-ctl:hover) { background:rgba(20,19,17,.70); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }
```

**SOSTITUIRE CON:**
```css
  /* Navbar adattiva: --nav-ink guida il colore di tutti i controlli */
  #navBar { --nav-ink:#e7e3d8; }
  #navBar.on-light { --nav-ink:#1c1b18; }
```
La navbar resta senza sfondo e senza blur in ogni stato.

---

## 3. HTML/CSS — collegare i controlli alla variabile

Tutti i controlli devono usare `var(--nav-ink)` (o `currentColor`, che eredita la stessa variabile).

**3a. Barra navbar** — cambia il colore inline così l'ereditarietà propaga la variabile.
TROVA:
```html
<div id="navBar" style="position:fixed; top:0; left:0; right:0; z-index:9100; pointer-events:none; height:64px; color:#e7e3d8;">
```
SOSTITUISCI `color:#e7e3d8;` → `color:var(--nav-ink);`

**3b. Equalizzatore** — nel CSS `.eq .bar` (dal brief equalizzatore) sostituire il fondo con `currentColor`:
`background:#e7e3d8;` → `background:currentColor;`
(Lo stato in play `.eq.is-playing .bar { background:#d9a06a; }` resta oro, invariato.)
Opzionale per contrasto dell'oro sulle sezioni chiare, aggiungere:
```css
#navBar.on-light .eq.is-playing .bar { background:#a8632f; }
```

**3c. Label musica** — nel CSS `.music-cap` sostituire `color:#e7e3d8;` → `color:var(--nav-ink);` e aggiungere `color .4s ease` alla sua `transition`.

**3d. IT / EN** — nei due bottoni:
TROVA `color:#e7e3d8;` (in entrambi `onClick="{{ setIt }}"` e `onClick="{{ setEn }}"`) → `color:var(--nav-ink);`
Nel CSS aggiungere la transizione colore:
```css
.lang-ctl button, .lang-sep { transition:opacity .3s ease, color .4s ease; }
```
(Il separatore `.lang-sep` eredita già il colore dalla navbar → flippa da solo.)

**3e. Menu** — nel bottone menu:
TROVA `color:#e7e3d8;` (nello style del `<button ... aria-label="Menu" ...>`) → `color:var(--nav-ink);`
Le linee dell'hamburger usano già `background:currentColor` → flippano da sole. Aggiungere la transizione:
TROVA:
```css
  #mgMenuLines span { transition: transform .3s ease, opacity .3s ease; }
```
SOSTITUISCI:
```css
  #mgMenuLines span { transition: transform .3s ease, opacity .3s ease, background-color .4s ease; }
```

---

## 4. JS — watcher che rileva la sezione sotto la barra

Dentro `componentDidMount`, aggiungere questo blocco (es. subito dopo il blocco `this._heroAnim`):
```js
    // Navbar adattiva: colore controlli in base al tema della sezione sotto la barra.
    // elementsFromPoint rispetta lo stacking degli sticky → robusto anche con sezioni sovrapposte.
    const _navBarEl = document.getElementById('navBar');
    this._navTheme = () => {
      if (!_navBarEl) return;
      const x = Math.round(window.innerWidth * 0.32); // colonna senza controlli
      let theme = 'dark';
      const els = document.elementsFromPoint(x, 12);
      for (const el of els) {
        const s = el.closest && el.closest('[data-navtheme]');
        if (s) { theme = s.dataset.navtheme; break; }
      }
      _navBarEl.classList.toggle('on-light', theme === 'light');
    };
    window.addEventListener('scroll', this._navTheme, { passive: true });
    window.addEventListener('resize', this._navTheme);
    this._navTheme();
```

In `componentWillUnmount`, aggiungere:
```js
    window.removeEventListener('scroll', this._navTheme);
    window.removeEventListener('resize', this._navTheme);
```

Note sul watcher:
- Campiona a x = 32% della larghezza (nessun controllo lì). Se per caso colpisce un controllo, il loop prosegue fino alla sezione sotto → nessun problema.
- `pointer-events:none` sulla navbar fa "passare" il campionamento alla sezione.
- Default `dark`: copre il menu overlay aperto (fondo scuro) e qualunque caso non taggato.

---

## 5. Comportamento hover (nessuna nuova regola, solo verifica)
Con la fascia rimossa, l'hover deve limitarsi a intensificare — comportamenti già presenti, da confermare funzionanti:
- **Musica:** barre a opacità piena + label `MUSICA OFF/ON` che si rivela di fianco.
- **IT/EN:** le lettere passano da opacità .38 a 1 (`.lang-ctl:not(:hover) button`).
- **Menu:** l'icona passa da opacità .42 a 1.
Nessun pannello, nessun blur, su nessuno dei tre. Simmetrico.

---

## 6. Verifica finale
1. Scroll dall'hero (scuro) → Manifesto (chiaro): i tre controlli passano da crema a slate scuro con transizione ~0.4s, restano leggibili.
2. Prosegui su tutte le sezioni: mai un controllo invisibile (né su `#d9d6cc`, né su slate/olive/verde, né sulle foto).
3. Hover su musica / IT-EN / menu: **nessuna fascia nera, nessun blur**; solo il controllo si intensifica. Comportamento identico sui tre.
4. Musica in play: barre oro e animate su entrambi i temi (con l'opzionale 3b, oro più profondo sulle sezioni chiare).
5. Menu aperto (overlay scuro): controlli crema (default dark).
6. Toggle IT/EN e apertura menu continuano a funzionare come prima.
7. Nessun residuo di `backdrop-filter` / `:has()` collegato alla navbar.
