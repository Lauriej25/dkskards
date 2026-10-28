# DKsKards — The Viewing Room

Static site, no build step. The full design spec is in `DKSKARDS_REDESIGN.md`.

## Run it locally

ES modules and `config.json` need a web server (opening the files directly won't work):

    cd ~/Downloads/dkskards
    python3 -m http.server 8080

Then open http://localhost:8080 (site) and http://localhost:8080/dashboard.html (admin).

## Files

| File | What it is |
|---|---|
| `index.html` + `home.js` | Home: hero slab, On the table, grade ladder, What's moving, Card Hunt, membership, cert check |
| `shop.html` + `shop.js` | All slabs, filters (bottom sheet on mobile), sorting |
| `card.html` + `card.js` | The lot: gallery + loupe, price block, sales scatter, ladder, notes, provenance, buy sheet |
| `market.html` + `market.js` | Market board, heat map, recently sold |
| `dashboard.html` | Admin: listings, tracked cards + price checks, live strip, drops, membership, copy, brand, export |
| `config.js` | Defaults (sample data), load/save, shared helpers |
| `app.js` | Shared chrome: nav, live strip, tab bar, search, footer, theme, tiles |
| `slab.js`, `loupe.js` | The slab component (tilt, lamp, flip) and the loupe |
| `styles.css` | Tokens and every component |
| `config.json` | The published config. Replace with the dashboard's export, then redeploy |

## Publishing changes

Dashboard → Export config.json → replace `config.json` here → redeploy (Netlify / Vercel / Cloudflare Pages drag-and-drop).

The sample listings are marked "Sample". Replace them (and the placeholder contact email in Copy & settings) before launch.
