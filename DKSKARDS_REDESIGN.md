# DKsKards: Site Redesign Spec ("The Viewing Room")

> Drop this file into the repo root. It covers the whole redesign: the idea, design tokens, every page and section with wireframes, the best patterns borrowed from the industry (and how we changed them), drop-in CSS/JS for the key components, the new data model, and a step-by-step build and update guide.
>
> **Kept:** the logo only (the `DK` chip in chartreuse on ink, plus the "DKsKards" wordmark).
> **Replaced:** palette, type, layout, navigation, copy, motion, page structure.
> **Still works with:** the existing `dashboard.html` and the `dksKardsConfig` localStorage key. New fields are additive.

---

## 1. The idea in one paragraph

A high-ticket slab is bought the way jewellery is bought: under a light, turned in the hand, checked through a loupe, with the paperwork on the table. A typical listing just *talks* about condition. The new site lets buyers **handle the card**. Every listing sits in a dark viewing room under a single warm lamp. Moving the mouse (or tilting the phone) moves the lamp across the acrylic so the foil catches. Scrolling turns the slab over to the back label: cert number, population, the grade ladder and recent sales. The data is the reward for looking closer. That one interaction is the signature. Everything around it stays quiet, precise and readable.

**Audience:** Australian collectors spending A$500–A$20,000 per card, plus first-time buyers with a budget and no plan ("I have A$1,000, what should I buy?").
**Primary job of the site:** turn a visitor into (a) a buyer of a listed slab, (b) a Card Hunt / audit client, or (c) a paying member.
**Mode:** Persuade on Home and Shop, Operate on Market, Collection and Dashboard.

---

## 2. What we're taking from the industry (and what we're not)

| Site | What they do best | How DKsKards uses it | What we leave behind |
|---|---|---|---|
| **Courtyard.io** | Slabs rendered as physical objects that tilt and catch light | The lamp-and-tilt hero slab and listing cards (pointer + gyroscope) | Mystery packs, gacha mechanics, crypto framing |
| **Goldin / Heritage** | Lot pages: big imagery, zoom, provenance, bid history, condition notes | Card page with loupe zoom, front/back flip, provenance timeline, our condition notes | 20–22% buyer's premium. We show one all-in AUD price |
| **Alt** | Sales plotted as dots on a price chart; instant value estimate | Sales scatter + median line on every card page | Vault/cash-advance complexity |
| **Card Ladder / Market Movers** | Indexes, movers lists, 7/30/90-day change | The Market board (hot / cold) and sparklines on listings | US-only data, USD pricing, paywalling the basics |
| **PriceCharting** | The grade ladder: one card, prices for Raw through 10 in one row | Interactive grade ladder on card pages and on Home | Dense, ad-heavy tables |
| **PSA** | Cert verification as a trust ritual | "Check a cert" on every slab and in the footer | Membership perks we don't control |
| **Fanatics Collect** | Clean filterable grid, fee transparency, fast checkout | Shop grid with filters that collapse to a sheet on mobile, all-in price | — |
| **Collectr** | Portfolio value line, add-by-search, alerts | Members' "My collection" with value line and alerts | Cartoonish TCG styling |
| **Whatnot** | Scheduled live moments build habit | "Drops": scheduled releases of new stock with a calendar and reminders | Breaks, random pulls, urgency theatre |
| **Cardmarket / TCGplayer** | Variant and condition selectors that prevent wrong buys | Edition / language / grade chips that filter the comps on a card page | — |

**Rule we're adopting from the research:** nothing on the site is gamified. No timers that reset, no "only 1 left!" unless it's literally a one-of-one slab (which it usually is, so we say "This is the only copy we have" plainly).

---

## 3. Design tokens

### 3.1 Colour

The current site is near-black with acid green everywhere. The new palette moves the base to a cool blue-graphite (the inside of a display case), adds a warm lamp colour as the light source, and **demotes chartreuse to the logo and the "live" indicator only**. Green therefore always means "this number is live," which gives it meaning.

| Token | Dark (default) | Light ("daylight inspection") | Use |
|---|---|---|---|
| `--room` | `#0F1319` | `#ECEFF3` | Page background |
| `--case` | `#171C24` | `#FFFFFF` | Raised surfaces, cards, sheets |
| `--case-2` | `#1F2630` | `#F5F7F9` | Inputs, nested panels |
| `--edge` | `#2A3340` | `#D5DBE2` | Borders, dividers |
| `--acrylic` | `#E4E9EF` | `#121820` | Primary text |
| `--steel` | `#8E99A8` | `#566170` | Secondary text (≥ 4.5:1 on `--room` in both themes) |
| `--lamp` | `#F2CF8D` | `#B07A1E` | The light source: focus rings, primary buttons, "our price" |
| `--gain` | `#63CF95` | `#1D8A52` | Price up, Hot |
| `--loss` | `#EA6E62` | `#C2392C` | Price down, Cold |
| `--signal` | `#C8FF00` | `#C8FF00` (on ink chip only) | Logo + live dot only |
| `--ink` | `#06080B` | `#06080B` | Logo chip background, lamp-button text |

**Holographic foil** (used only on the slab surface, never on UI chrome):
`conic-gradient(from var(--foil-angle), #ff9ad5, #9ad8ff, #b7ffb0, #fff3a1, #ff9ad5)` at 18–30% opacity with `mix-blend-mode: color-dodge`.

### 3.2 Type

| Role | Family | Settings | Why |
|---|---|---|---|
| Display + UI | **Archivo** (variable, width + weight axes) | Headlines: `wdth 118`, weight 700, tight tracking `-0.015em`. UI: `wdth 100`, weight 450–600 | Slab labels are printed in wide grotesques. The expanded cut reads like a grading label without copying anyone's |
| Long reading (reports, card notes, membership copy) | **Source Serif 4** | 400 / 600, optical size auto, line-height 1.65 | Research is read, not skimmed. A serif signals "considered writing" |
| Numbers | Archivo with `font-variant-numeric: tabular-nums` | — | Prices line up in tables without needing a mono face |

Google Fonts link (replaces DM Mono, Instrument Serif, Inter):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" rel="stylesheet">
```

**Scale** (ratio 1.25, base 17px desktop / 16px mobile):

| Token | Size | Use |
|---|---|---|
| `--t-hero` | `clamp(2.6rem, 7vw, 5.2rem)` | Home headline only |
| `--t-h1` | `clamp(2rem, 4.5vw, 3.2rem)` | Page titles |
| `--t-h2` | `clamp(1.5rem, 3vw, 2.1rem)` | Section titles |
| `--t-h3` | `1.25rem` | Card names, panel titles |
| `--t-body` | `1rem` | Body |
| `--t-small` | `0.875rem` | Meta, captions |
| `--t-micro` | `0.75rem` | Chart axes only (never body copy) |

**Typographic rules for this site:** sentence case everywhere (no all-caps labels); no eyebrow labels above headings; headings carry the meaning on their own; no italic-one-word accents.

### 3.3 Space, shape, depth

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 72, 112 px (`--s-1` … `--s-9`).
- Radius encodes hierarchy, not decoration: **slab = 14px** (real slabs have rounded corners), sheets/panels = 10px, inputs/buttons = 8px, chips = 999px.
- Depth comes from light, not grey shadows: surfaces get a 1px top highlight (`inset 0 1px 0 rgba(255,255,255,.04)`) and the slab gets a lamp-coloured contact shadow beneath it.
- Max content width 1240px; reading width 68ch.

### 3.4 Motion

- **One orchestrated moment:** the lamp sweep on first load (900ms), then the lamp follows the pointer/gyro.
- Everything else moves only in response to the user: flip, open sheet, confirm, filter.
- Durations: 120ms (hover/press), 220ms (sheets, chips), 600ms (slab flip). Easing `cubic-bezier(.2,.7,.2,1)`.
- `prefers-reduced-motion: reduce`: no tilt, no sweep, flip becomes a crossfade, the ticker stops and becomes a static row you can swipe.

---

## 4. Site map

```
/                 Home: the viewing room
/shop             All listed slabs (grid + filters)
/card?id=…        Card page: the lot
/market           Market board: hot / cold, movers, indexes
/hunt             Card Hunt brief (the "I have A$___" form) + services
/membership       Free / Insider / Collector / Concierge
/collection       Members: My collection, alerts (Phase 2)
/verify           Check a cert
/dashboard.html   Admin (existing, extended)
```

For the "run it now" version everything except Card, Shop and Collection can live in `index.html` as sections; Card and Shop are one extra file each (`card.html`, `shop.html`). See section 9.

### Navigation

**Desktop:** a slim top bar. Left: the logo (unchanged). Centre: Shop, Market, Card Hunt, Membership. Right: search (opens a command-style search over all cards), theme switch (one icon button, not a pill), "Sign in" (Phase 2).

**Mobile:** the top bar shrinks to logo + search. Primary navigation moves to a **bottom tab bar** in the thumb zone: Shop, Market, Hunt, Membership, (Collection when signed in). On card pages the tab bar is replaced by the **sticky buy bar**.

```
Desktop                                              Mobile
┌───────────────────────────────────────────────┐    ┌──────────────────────┐
│ [DK] DKsKards     Shop Market Hunt Members  ⌕ ◐│    │ [DK] DKsKards      ⌕ │
├───────────────────────────────────────────────┤    ├──────────────────────┤
│ ● live  Charizard 1st Ed PSA 10  A$18,500 +4.2%│    │ ● Charizard … +4.2% ›│
└───────────────────────────────────────────────┘    │                      │
                                                     │        …page…        │
                                                     ├──────────────────────┤
                                                     │ Shop Market Hunt  Me │
                                                     └──────────────────────┘
```

The ticker stays (it's yours and it's useful), but it becomes a **live strip**: a green live dot, one item at a time on mobile (tap to see all), continuous scroll on desktop, paused on hover/focus.

---

## 5. Pages and sections

### 5.1 Home: the viewing room

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Researched before            ┌──────────────┐                    │
│  it's listed.                 │ ░░ LAMP ░░    │  ← slab tilts with  │
│                               │  ┌────────┐  │    pointer / gyro   │
│  Every slab here comes with   │  │  CARD  │  │                     │
│  the comps, the population    │  │  ART   │  │                     │
│  and our notes.               │  └────────┘  │                     │
│                               │ Charizard    │                     │
│  [ Browse the slabs ]         │ PSA 10 · ... │                     │
│  Start a Card Hunt            └──────────────┘                     │
│                               A$18,500   30d +4.2%   Pop 121       │
│                               Turn it over ↻                       │
└──────────────────────────────────────────────────────────────────┘
```

1. **Hero:** headline left (Archivo expanded), the featured slab right. On mobile the slab comes first, full width, headline under it. Scrolling past the hero flips the slab (scroll-linked, 0→180°) to show the back label: cert, pop, grade ladder mini, last 3 sales. Buttons: "Browse the slabs" (lamp fill) and "Start a Card Hunt" (text button).
2. **On the table:** the current listings as a horizontal rail of slabs (scroll-snap). Each shows image, name, grade, our price, 30-day change as a sparkline, and "Only copy we have" when true. Desktop shows 4 across with arrow buttons; mobile shows 1.2 across so the next one peeks.
3. **The grade ladder** (interactive explainer, PriceCharting-inspired): pick one of three example cards; a horizontal ladder shows Raw → PSA 8 → 9 → 10 prices with the multiplier between rungs. Copy underneath explains in two sentences why grading changes value. This replaces the old "Why we're different" pillars by *showing* the expertise.
4. **What's moving:** a compact Market board (top 3 hot, top 3 cold) with a link to the full Market page.
5. **"I have A$___ and I want to buy ___."** The old quote becomes the actual Card Hunt form: an inline sentence with two inputs (budget, card/set/character) and a "Send my brief" button. Expands to timeframe, raw/graded, risk on the Hunt page.
6. **Membership:** four tiers in a row (stacked on mobile), Collector highlighted with a lamp outline.
7. **Check a cert:** a single input. "Enter a PSA, CGC or BGS cert number." Builds trust and gets people interacting.
8. **Footer:** logo, links, ABN placeholder, the full disclaimer at readable size (14px, `--steel`).

### 5.2 Shop

```
Desktop                                         Mobile
┌─────────┬────────────────────────────────┐    ┌──────────────────────┐
│ Filters │  42 slabs   Sort: Newest ▾     │    │ [Filters (3)] Sort ▾ │
│ Grader  │ ┌─────┐┌─────┐┌─────┐┌─────┐   │    │ ┌──────────────────┐ │
│ Grade   │ │slab ││slab ││slab ││slab │   │    │ │      slab        │ │
│ Era/set │ └─────┘└─────┘└─────┘└─────┘   │    │ └──────────────────┘ │
│ Price   │ ┌─────┐┌─────┐ …               │    │ ┌────────┐┌────────┐ │
│ Lang    │                                │    │ │ slab   ││ slab   │ │
│ Movers  │                                │    │ └────────┘└────────┘ │
└─────────┴────────────────────────────────┘    └──────────────────────┘
```

- Filters: grader, grade, set/era, language, price range, "rising in 30 days". On mobile they open as a bottom sheet with a sticky "Show 12 slabs" button (count updates live).
- Sorting: newest, price, 30-day change, population (rarest first).
- Each tile is a mini slab with the tilt effect (pointer only on desktop; no gyro on grid tiles to save battery).
- Empty state: "No slabs match these filters. Clear filters, or ask us to hunt one down." with both actions.

### 5.3 Card page: the lot

```
┌───────────────────────────────┬──────────────────────────────┐
│                               │ Charizard · Base Set 1st Ed   │
│      [ SLAB, large ]          │ PSA 10 · cert 12345678 ✓      │
│   loupe on hover / pinch      │                              │
│   Front | Back | Slab edge    │ A$18,500                     │
│                               │ Market median A$17,900        │
│                               │ 30d +4.2%   Pop 121 (of 3,982)│
│                               │ [ Buy this slab ]            │
│                               │ Ask a question               │
│                               │ All-in price. Insured AU ship.│
├───────────────────────────────┴──────────────────────────────┤
│ Recent sales  ● ● ●  ● ●●   ─── median        [30d 90d 1y]   │
├──────────────────────────────────────────────────────────────┤
│ Grade ladder   Raw A$900 → 8 A$2.1k → 9 A$4.8k → 10 A$18.5k  │
├──────────────────────────────────────────────────────────────┤
│ Our notes (serif)        │ Provenance timeline              │
├──────────────────────────────────────────────────────────────┤
│ Similar slabs rail                                           │
└──────────────────────────────────────────────────────────────┘
Mobile: gallery → price block → sticky buy bar at bottom → sales → ladder → notes
```

- **Gallery:** large slab with lamp-tilt. Desktop: a circular loupe follows the cursor at 2.5× (Goldin-style zoom, but round, like a real loupe). Mobile: pinch-zoom on a full-screen viewer; double-tap toggles 2×. Tabs: Front, Back, Edge.
- **Price block:** our price (lamp colour), the market median from your tracked comps, 30-day change, population. A verified tick next to the cert links to the grader's cert page.
- **Buy:** "Buy this slab" opens an enquiry/checkout sheet (Phase 0: prefilled email or Stripe Payment Link per listing). "Ask a question" opens the same sheet in question mode.
- **Recent sales:** Alt-style scatter (each dot one sale, colour by grader) with a median line. Toggle 30d / 90d / 1y. Tap a dot to see date, venue and price.
- **Our notes:** centring, surface, corners, eye appeal, written in Source Serif. This is how DKsKards checks every card, shown on every listing.
- **Provenance:** where it came from, when graded, previous public sales if known.

### 5.4 Market board

```
┌──────────────────────────────────────────────────────────────┐
│ Market   Pokémon slabs we track · updated 2 hours ago  ● live│
│ [7d] [30d] [90d]      Hot ▾ / Cold / Most traded             │
├──────────────────────────────────────────────────────────────┤
│ Card                 Grade   Median   7d    30d   Sales  Heat │
│ Umbreon VMAX Alt     PSA 10  A$1,650  +3.1  +9.4  14     ▲▲▲  │
│ Lugia 1st Ed         PSA 9   A$4,200  −1.8  −4.0   3     ▼▼   │
│ …                                                            │
├──────────────────────────────────────────────────────────────┤
│ Heat map: set × grade (tiles shaded gain → loss)              │
└──────────────────────────────────────────────────────────────┘
```

- Built from the `inventory.history` and `comps` data described in the pricing-agent guide.
- Heat uses the formula from that guide (momentum 30d, velocity, momentum 7d). The column shows arrows **plus** a word on hover/tap ("Hot", "Cold") so meaning never relies on colour.
- On mobile the table becomes a list: name + grade on the first line, median and 30d change on the second, a sparkline on the right. Tapping expands 7d / 90d / sales.
- Free visitors see the top 5 hot and cold; members see everything (gate with a soft blur + "Members see all 120 tracked cards").

### 5.5 Card Hunt

A conversational brief instead of a contact form:

> I have **[ A$1,000 ]** to spend on **[ Charizard / any / a set ]**.
> I want it **[ raw / graded / either ]** and plan to hold it for **[ under a year / 1–3 years / longer ]**.
> Reach me at **[ email ]**.
> **[ Send my brief ]** A$99, report in 48–72 hours.

Under it: the four-step process (this is a real sequence, so numbering is right here), the sample report table (your existing `reportCards`), the Portfolio audit (A$249) and Sourcing (fee calculator with a live slider: "Card value A$2,600 → fee A$130").

### 5.6 Membership

| | Free | Insider | Collector | Concierge |
|---|---|---|---|---|
| Price | A$0 | A$15/mo or A$150/yr | A$39/mo or A$390/yr | from A$199/mo |
| Weekly AU movers email | ✓ | ✓ | ✓ | ✓ |
| Full Market board | Top 5 | ✓ | ✓ | ✓ |
| Monthly AU market report | | ✓ | ✓ | ✓ |
| Price alerts | | 5 | 25 | Unlimited |
| Tracked collection | | | 50 cards, monthly calls | Unlimited + quarterly audit |
| Card Hunt reports | | | 1 per quarter | Up to 2 per month |
| Sourcing fee | 5% | 5% | 3.5% | 2.5% |
| First look at new slabs | | | 48 hours | 48 hours + direct line |

Desktop: four columns, Collector raised with a lamp outline and the label "Most chosen" only once you have data to back it (until then: no label). Mobile: a segmented control switches between tiers so each tier is one readable card, with a "Compare all" link that opens the full table horizontally scrollable.

Footnote on the page: "General information only. Not financial advice. Cancel any time from your account."

### 5.7 My collection (members, Phase 2)

Collectr-style: total value line at the top (with the 30d change), a list of their cards with your KEEP / GRADE / UPGRADE / SELL tag, alerts per card, "Add a card" with search-as-you-type over the pokemontcg.io catalogue.

---

## 6. Components (drop-in code)

All snippets assume the tokens in 6.1 are loaded once in a shared `styles.css`.

### 6.1 Tokens and base

```css
/* styles.css */
:root{
  --room:#0F1319; --case:#171C24; --case-2:#1F2630; --edge:#2A3340;
  --acrylic:#E4E9EF; --steel:#8E99A8; --lamp:#F2CF8D;
  --gain:#63CF95; --loss:#EA6E62; --signal:#C8FF00; --ink:#06080B;
  --display:'Archivo',system-ui,sans-serif;
  --read:'Source Serif 4',Georgia,serif;
  --t-hero:clamp(2.6rem,7vw,5.2rem); --t-h1:clamp(2rem,4.5vw,3.2rem);
  --t-h2:clamp(1.5rem,3vw,2.1rem); --t-h3:1.25rem; --t-small:.875rem;
  --r-slab:14px; --r-panel:10px; --r-ctl:8px;
  --ease:cubic-bezier(.2,.7,.2,1);
  --gutter:clamp(16px,4vw,40px);
  color-scheme:dark;
}
:root[data-theme="light"]{
  --room:#ECEFF3; --case:#FFFFFF; --case-2:#F5F7F9; --edge:#D5DBE2;
  --acrylic:#121820; --steel:#566170; --lamp:#B07A1E;
  --gain:#1D8A52; --loss:#C2392C; color-scheme:light;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{
  background:var(--room); color:var(--acrylic);
  font:450 1rem/1.55 var(--display); font-variation-settings:"wdth" 100;
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3{font-weight:700;font-variation-settings:"wdth" 118;letter-spacing:-.015em;line-height:1.05;text-wrap:balance}
.read{font-family:var(--read);font-size:1.0625rem;line-height:1.65;max-width:68ch}
.num{font-variant-numeric:tabular-nums}
.wrap{max-width:1240px;margin-inline:auto;padding-inline:var(--gutter)}
:focus-visible{outline:2px solid var(--lamp);outline-offset:3px;border-radius:4px}
.btn{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 22px;
  border-radius:var(--r-ctl);font:600 1rem var(--display);cursor:pointer;border:0;
  transition:transform .12s var(--ease),background .12s}
.btn:active{transform:scale(.98)}
.btn-lamp{background:var(--lamp);color:var(--ink)}
.btn-text{background:none;color:var(--acrylic);text-decoration:underline;text-underline-offset:4px}
.up{color:var(--gain)} .down{color:var(--loss)}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
```

### 6.2 Logo (unchanged, moved into a component)

```html
<a class="logo" href="/" aria-label="DKsKards home">
  <span class="logo-chip" id="navLogoAbbr">DK</span><span id="navLogoName">DKsKards</span>
</a>
```
```css
/* DKsKards logo treatment (DK chip + wordmark) */
.logo{font-family:'DM Mono',monospace;font-size:.82rem;letter-spacing:.08em;font-weight:500;white-space:nowrap;color:var(--acrylic);text-decoration:none}
.logo-chip{display:inline-block;background:var(--ink);color:var(--signal);padding:2px 6px;margin-right:6px}
```
DM Mono stays loaded **only** for the logo: `family=DM+Mono:wght@500&text=DKsard%20` (the `text=` parameter downloads just those glyphs, about 2 KB).

### 6.3 The slab (signature component)

Tilt follows the pointer on desktop and the gyroscope on phones. The lamp highlight and foil angle follow the same input. Front/back flip via a button or scroll.

```html
<figure class="slab" data-slab tabindex="0" aria-label="Charizard Base Set 1st Edition, PSA 10. Use the button to turn it over.">
  <div class="slab-body">
    <div class="slab-face slab-front">
      <div class="slab-label"><b>Charizard</b><span>Base Set 1st Ed #4</span><span class="grade">PSA 10</span></div>
      <img src="img/charizard-front.webp" alt="" loading="eager" decoding="async">
      <i class="slab-foil"></i><i class="slab-lamp"></i>
    </div>
    <div class="slab-face slab-back">
      <dl class="num">
        <div><dt>Cert</dt><dd>12345678</dd></div>
        <div><dt>Population</dt><dd>121</dd></div>
        <div><dt>Median, 30 days</dt><dd>A$17,900</dd></div>
      </dl>
    </div>
  </div>
  <button class="btn btn-text slab-flip" type="button">Turn it over</button>
</figure>
```
```css
.slab{--rx:0deg;--ry:0deg;--lx:50%;--ly:30%;--foil-angle:0deg;perspective:1100px;width:min(360px,80vw);margin:auto}
.slab-body{position:relative;aspect-ratio:3/5.1;transform-style:preserve-3d;
  transform:rotateX(var(--rx)) rotateY(calc(var(--ry) + var(--flip,0deg)));
  transition:transform .6s var(--ease)}
.slab[data-moving] .slab-body{transition:transform .08s linear}
.slab-face{position:absolute;inset:0;border-radius:var(--r-slab);backface-visibility:hidden;overflow:hidden;
  background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,.03) 40%,rgba(255,255,255,.08));
  border:1px solid rgba(255,255,255,.18);
  box-shadow:inset 0 0 0 6px rgba(255,255,255,.04),0 40px 60px -30px color-mix(in srgb,var(--lamp) 35%,transparent)}
.slab-back{transform:rotateY(180deg);display:grid;place-items:center;background:var(--case)}
.slab-label{display:grid;grid-template-columns:1fr auto;gap:2px 12px;margin:10px;padding:10px 12px;
  border-radius:6px;background:#f4f4f2;color:#111;font-size:.8rem}
.slab-label .grade{grid-row:span 2;align-self:center;font-weight:800;font-size:1.1rem}
.slab-front img{display:block;width:calc(100% - 36px);margin:4px auto 0;border-radius:6px}
.slab-foil{position:absolute;inset:0;mix-blend-mode:color-dodge;opacity:.22;pointer-events:none;
  background:conic-gradient(from var(--foil-angle) at var(--lx) var(--ly),#ff9ad5,#9ad8ff,#b7ffb0,#fff3a1,#ff9ad5)}
.slab-lamp{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;
  background:radial-gradient(circle at var(--lx) var(--ly),color-mix(in srgb,var(--lamp) 55%,transparent),transparent 45%)}
.slab.is-flipped{--flip:180deg}
@media (prefers-reduced-motion:reduce){.slab-foil,.slab-lamp{display:none}.slab-body{transition:opacity .2s}}
```
```js
// slab.js
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export function setTilt(slab, x, y) {   // x,y in -1..1
  slab.style.setProperty('--ry', `${x * 12}deg`);
  slab.style.setProperty('--rx', `${-y * 10}deg`);
  slab.style.setProperty('--lx', `${50 + x * 40}%`);
  slab.style.setProperty('--ly', `${40 + y * 40}%`);
  slab.style.setProperty('--foil-angle', `${x * 120}deg`);
}
document.querySelectorAll('[data-slab]').forEach(slab => {
  const set = (x, y) => setTilt(slab, x, y);
  slab.querySelector('.slab-flip').addEventListener('click', () => slab.classList.toggle('is-flipped'));
  if (reduce) return;
  slab.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = slab.getBoundingClientRect();
    slab.dataset.moving = '';
    set((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1);
  });
  slab.addEventListener('pointerleave', () => { delete slab.dataset.moving; set(0, 0); });
});

// Gyroscope for the hero slab on phones. iOS needs a tap to grant permission.
export async function enableTilt(slab) {
  if (reduce || !window.DeviceOrientationEvent) return;
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    if (await DeviceOrientationEvent.requestPermission() !== 'granted') return;
  }
  let queued = false;
  addEventListener('deviceorientation', e => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      const x = Math.max(-1, Math.min(1, (e.gamma || 0) / 25));
      const y = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 25));
      slab.dataset.moving = '';
      setTilt(slab, x, y);
      queued = false;
    });
  });
}
```
On iOS show a small "Tilt your phone to light the card" text button under the hero slab that calls `enableTilt`. Android starts automatically.

Lamp sweep on load (the one orchestrated moment):

```js
if (!reduce) {
  const hero = document.querySelector('.hero [data-slab]');
  hero.animate([{'--lx':'-10%'},{'--lx':'110%'}], {duration:900, easing:'cubic-bezier(.2,.7,.2,1)'});
}
```
(Register `--lx` with `CSS.registerProperty({name:'--lx',syntax:'<percentage>',inherits:true,initialValue:'50%'})` so it animates.)

### 6.4 Loupe zoom (card page, desktop)

```js
// loupe.js — round magnifier that follows the cursor over the slab image
export function loupe(img, zoom = 2.5, size = 180) {
  const lens = Object.assign(document.createElement('div'), { className: 'loupe', ariaHidden: true });
  img.parentElement.append(lens);
  img.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = img.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    Object.assign(lens.style, {
      display: 'block', left: `${x - size / 2}px`, top: `${y - size / 2}px`,
      backgroundImage: `url(${img.currentSrc})`,
      backgroundSize: `${r.width * zoom}px ${r.height * zoom}px`,
      backgroundPosition: `${-x * zoom + size / 2}px ${-y * zoom + size / 2}px`
    });
  });
  img.addEventListener('pointerleave', () => lens.style.display = 'none');
}
```
```css
.loupe{position:absolute;display:none;width:180px;height:180px;border-radius:50%;pointer-events:none;
  border:2px solid var(--lamp);box-shadow:0 12px 40px rgba(0,0,0,.5);background-repeat:no-repeat}
```

### 6.5 Grade ladder

```html
<ol class="ladder num" aria-label="Prices by grade">
  <li><span>Raw</span><b>A$900</b></li>
  <li><span>PSA 8</span><b>A$2,100</b><em>×2.3</em></li>
  <li><span>PSA 9</span><b>A$4,800</b><em>×2.3</em></li>
  <li aria-current="true"><span>PSA 10</span><b>A$18,500</b><em>×3.9</em></li>
</ol>
```
```css
.ladder{list-style:none;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:4px;align-items:end}
.ladder li{background:var(--case);border:1px solid var(--edge);border-radius:var(--r-ctl);padding:12px;display:grid;gap:2px}
.ladder li:nth-child(1){height:72px}.ladder li:nth-child(2){height:92px}
.ladder li:nth-child(3){height:116px}.ladder li:nth-child(4){height:148px}
.ladder span{color:var(--steel);font-size:var(--t-small)}
.ladder em{font-style:normal;color:var(--gain);font-size:var(--t-small)}
.ladder [aria-current]{border-color:var(--lamp)}
@media (max-width:560px){.ladder{grid-auto-flow:row;grid-auto-columns:auto}.ladder li{height:auto!important;grid-template-columns:1fr auto auto;align-items:center;gap:12px}}
```

### 6.6 Bottom tab bar + sticky buy bar (mobile)

```html
<nav class="tabbar" aria-label="Main">
  <a href="/shop" aria-current="page"><svg aria-hidden="true">…</svg>Shop</a>
  <a href="/market"><svg aria-hidden="true">…</svg>Market</a>
  <a href="/hunt"><svg aria-hidden="true">…</svg>Hunt</a>
  <a href="/membership"><svg aria-hidden="true">…</svg>Members</a>
</nav>

<div class="buybar" role="region" aria-label="Buy">
  <div class="num"><b>A$18,500</b><small>All-in, insured shipping</small></div>
  <button class="btn btn-lamp">Buy this slab</button>
</div>
```
```css
.tabbar,.buybar{position:fixed;inset:auto 0 0;z-index:50;display:none;
  padding:8px var(--gutter) calc(8px + env(safe-area-inset-bottom));
  background:color-mix(in srgb,var(--case) 88%,transparent);backdrop-filter:blur(14px);
  border-top:1px solid var(--edge)}
.tabbar a{flex:1;display:grid;justify-items:center;gap:2px;min-height:48px;padding-top:6px;
  color:var(--steel);text-decoration:none;font-size:.75rem}
.tabbar a[aria-current]{color:var(--acrylic)}
.tabbar svg{width:22px;height:22px}
.buybar{justify-content:space-between;align-items:center;gap:12px}
.buybar small{display:block;color:var(--steel);font-size:.75rem}
@media (max-width:760px){
  .tabbar{display:flex} body{padding-bottom:calc(72px + env(safe-area-inset-bottom))}
  body.is-lot .tabbar{display:none} body.is-lot .buybar{display:flex}
  .topnav-links{display:none}
}
```
Add `viewport-fit=cover` to the viewport meta so `env(safe-area-inset-bottom)` works on iPhones.

### 6.7 Live strip (replaces the ticker)

```js
// Uses your existing tickerItems. One item at a time on mobile, scrolling on desktop.
function renderLiveStrip(items) {
  const el = document.getElementById('liveStrip');
  const fmt = n => n ? 'A$' + Number(n).toLocaleString('en-AU') : '';
  const row = items.map(i => {
    const pct = i.price && i.prevPrice ? ((i.price - i.prevPrice) / i.prevPrice * 100).toFixed(1) : null;
    const cls = i.dir === 'down' ? 'down' : 'up';
    return `<li><span>${escapeHtml(i.text)}</span> <b class="num">${fmt(i.price)}</b>
            ${pct ? `<b class="num ${cls}">${pct > 0 ? '+' : ''}${pct}%</b>` : ''}</li>`;
  }).join('');
  el.innerHTML = `<span class="live-dot" aria-hidden="true"></span><ul>${row}${row}</ul>`;
}
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
```
```css
.live{display:flex;align-items:center;gap:12px;height:36px;overflow:hidden;border-bottom:1px solid var(--edge);font-size:var(--t-small)}
.live-dot{width:7px;height:7px;border-radius:50%;background:var(--signal);flex:none;margin-left:var(--gutter);animation:pulse 2s infinite}
.live ul{display:flex;gap:40px;list-style:none;white-space:nowrap;animation:slide var(--ticker-speed,40s) linear infinite}
.live:hover ul,.live:focus-within ul{animation-play-state:paused}
@keyframes slide{to{transform:translateX(-50%)}} @keyframes pulse{50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.live ul{animation:none;overflow-x:auto}}
```
Note: the old ticker injected text with `innerHTML` without escaping. `escapeHtml` fixes that.

### 6.8 Sales scatter (card page)

Use Chart.js (one CDN tag) as in the pricing-agent guide:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<canvas id="sales" aria-label="Recent sales for this card and grade" role="img"></canvas>
```
```js
function renderSales(item) {
  const css = getComputedStyle(document.documentElement);
  const sales = (item.comps || []).map(c => ({ x: Date.parse(c.date), y: c.aud }));
  const median = (item.history || []).map(p => ({ x: Date.parse(p.t), y: p.aud }));
  new Chart(document.getElementById('sales'), {
    data: { datasets: [
      { type: 'scatter', label: 'Sales', data: sales, pointRadius: 5, backgroundColor: css.getPropertyValue('--acrylic') },
      { type: 'line', label: 'Median', data: median, borderColor: css.getPropertyValue('--lamp'), pointRadius: 0, tension: .3 }
    ]},
    options: {
      parsing: false, maintainAspectRatio: false,
      scales: {
        x: { type: 'linear', ticks: { callback: v => new Date(v).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) } },
        y: { ticks: { callback: v => 'A$' + v.toLocaleString('en-AU') } }
      },
      plugins: { tooltip: { callbacks: { label: c => `A$${c.parsed.y.toLocaleString('en-AU')}` } } }
    }
  });
}
```
Give the canvas wrapper a fixed height (`height:260px` mobile, `320px` desktop) so the chart doesn't jump.

---

## 7. Data model additions

New keys sit alongside your current ones in `dksKardsConfig`. Nothing existing is renamed, so the current dashboard keeps working.

```js
{
  // existing: tickerItems, reportCards, portCards, hero*, s1*, s2*, sourcing*, brand*, contact*, cta*
  // existing and reused from the pricing guide: inventory[], settings{}

  "listings": [                       // what appears in Shop and On the table
    {
      "id": "lst_001",
      "inventoryId": "inv_001",         // links to inventory for price history + comps
      "title": "Charizard",
      "subtitle": "Base Set 1st Edition #4",
      "grader": "PSA", "grade": "10", "cert": "12345678",
      "priceAUD": 18500,
      "status": "available",            // available | on_hold | sold
      "onlyCopy": true,
      "images": { "front": "img/charizard-front.webp", "back": "img/charizard-back.webp", "edge": "" },
      "notes": "Centring 55/45 left-right. Clean corners under the loupe. Light print line on the reverse, visible at an angle.",
      "provenance": [ { "date": "2021-03", "event": "Graded PSA 10" }, { "date": "2024-11", "event": "Sold, Goldin, US$11,200" } ],
      "ladder": [ ["Raw", 900], ["PSA 8", 2100], ["PSA 9", 4800], ["PSA 10", 18500] ],
      "featured": true,                 // the hero slab (only one should be true)
      "buyLink": "https://buy.stripe.com/…",   // optional Payment Link; otherwise email enquiry
      "listedAt": "2026-10-27"
    }
  ],
  "drops": [ { "date": "2026-11-07T19:00:00+11:00", "title": "Vintage holo drop", "listingIds": ["lst_004","lst_005"] } ],
  "membership": {
    "tiers": [
      { "id": "free", "name": "Free", "priceMonthly": 0 },
      { "id": "insider", "name": "Insider", "priceMonthly": 15, "priceYearly": 150, "link": "" },
      { "id": "collector", "name": "Collector", "priceMonthly": 39, "priceYearly": 390, "link": "" },
      { "id": "concierge", "name": "Concierge", "priceMonthly": 199, "link": "" }
    ]
  },
  "theme": "dark"
}
```

**Images:** shoot every slab on a matte black or dark-grey card, front and back, daylight-balanced light at about 45°, phone at 1:1 distance, 1600px tall. Export WebP at quality 80 (≈120–200 KB). Name files `<card>-<grade>-front.webp`. Never use stock images or other sellers' photos.

---

## 8. Quality floor (both web and mobile)

**Layout and touch**
- Breakpoints: 380 (small phones), 560, 760 (tab bar ↔ top nav), 1024, 1240.
- Every tap target is at least 44×44px; primary buttons 48px tall.
- No horizontal page scroll at 320px. Tables become lists below 760px.
- Bottom bars respect `env(safe-area-inset-bottom)`.
- Rails use `scroll-snap-type:x mandatory` with visible arrow buttons on desktop and a partial next card on mobile.

**Accessibility**
- Text contrast ≥ 4.5:1 (all token pairs in 3.1 pass in both themes; re-check if you change `--lamp` from the dashboard).
- Gain/loss always paired with a sign (+/−) and, for heat, a word. Colour never carries meaning alone.
- The slab is a `figure` with a full text description; flip is a real `button`; the tilt is decorative.
- Visible focus ring (lamp colour) on everything; skip link to main content; logical heading order.
- Charts have an accessible summary sentence above them ("12 sales in 90 days, median A$17,900, up 4.2%").

**Performance**
- Total JS on Home under 40 KB before Chart.js; load Chart.js only on Card and Market pages.
- Hero image `loading="eager"` + `fetchpriority="high"`; everything else `loading="lazy"`.
- Fonts: two families, `display=swap`, logo font subset with `text=`.
- Tilt work runs in `requestAnimationFrame`; gyroscope listener removed when the hero leaves the viewport (`IntersectionObserver`).
- Target: LCP under 2.5s on a mid-range Android over 4G.

**Trust and compliance**
- Disclaimer in the footer of every page and under every price chart.
- No "investment", "returns" or "guaranteed" language anywhere. Use "market median", "recent sales", "our notes".
- Show all-in AUD prices including GST where applicable, plus insured shipping terms, on every listing.

---

## 9. Build guide: running it live now

Phase 0 keeps everything static with localStorage, exactly like today.

1. **Back up.** Copy `index.html` and `dashboard.html` to `/legacy/`. In the browser console run `copy(localStorage.getItem('dksKardsConfig'))` and save it as `config.backup.json`.
2. **Create the shared files:**
   - `styles.css`: section 6.1 + components 6.2–6.7.
   - `config.js`: move the `DEFAULTS` object out of `index.html` into here (`export const DEFAULTS = {…}`), add the `listings`, `drops` and `membership` keys from section 7, plus `load()` / `save()`. Both the site and the dashboard import it, so defaults live in one place instead of two.
   - `slab.js`, `loupe.js`: sections 6.3 and 6.4.
3. **Rebuild `index.html`** in this order: top nav (logo unchanged), live strip, hero with the featured slab, On the table rail, grade ladder, What's moving, the Card Hunt sentence form, membership, check a cert, footer. Keep your existing element IDs where the content is the same (`heroH1a`, `heroSub`, `heroCta`, `reportCardBody`, `sourcingNote`, `brandDisclaimer`, etc.) so `applyConfig()` keeps filling them. Remove the stats bar and the "Why we're different" pillars; the ladder and live data replace them.
4. **Add `shop.html` and `card.html`.** `card.html` reads `?id=` from the URL, finds the listing in `dksKardsConfig.listings`, renders the gallery, price block, sales chart (6.8) and ladder, and sets `document.body.classList.add('is-lot')` for the mobile buy bar.
5. **Extend the dashboard** with three new panels using the same patterns you already have:
   - **Listings:** add/edit a listing (all fields in section 7), image paths, "Featured" toggle (setting one clears the others), status dropdown. On save, call `checkPrices([inventoryId])` from the pricing guide so the market median updates with a confirm prompt.
   - **Drops:** date/time and which listings.
   - **Membership:** prices and Stripe Payment Link per tier.
   - In **Brand**, replace the accent colour picker with a lamp colour picker (the logo's chartreuse is fixed). Add a contrast check under it: if the chosen colour falls below 4.5:1 against `--room`, show "This colour is hard to read on the dark background. Pick a lighter one."
6. **Payments:** create Stripe Payment Links for each listing (one-off) and each membership tier (recurring). Paste them into the dashboard. No backend needed.
7. **Test** at 375×812 (iPhone), 412×915 (Android), 768×1024 (tablet) and 1440×900 (desktop), in both themes, with reduced motion on, keyboard only, and with VoiceOver/TalkBack on the card page.
8. **Deploy** as a static site (Netlify, Vercel or Cloudflare Pages drag-and-drop). Remember localStorage is per browser: content you edit in the dashboard only appears for visitors once you **Export config** and commit it as `config.json`, which the site loads first (see 10.3).

## 10. Update guide

### 10.1 Add a new slab for sale
1. Photograph front and back (section 7), save to `/img/`.
2. Dashboard → Inventory → Add card (name, set, number, grader, grade, cert, your price). Paste 3–10 recent comps for graded cards.
3. Confirm the suggested market median when prompted.
4. Dashboard → Listings → New listing: pick the inventory card, add title, images, notes, provenance, ladder prices, Payment Link. Status "available".
5. Tick "Featured" if it should be the hero slab.
6. Save, then Export config and publish (10.3).

### 10.2 Mark a slab sold
Listings → change status to "sold". It leaves Shop and the rail automatically and moves to a "Recently sold" strip on the Market page (social proof without hype). Keep it there 30 days.

### 10.3 Publish changes to visitors
1. Dashboard → **Export config** (downloads `config.json`).
2. Replace `config.json` in the repo and redeploy.
3. The site loads `config.json` first, then overlays localStorage only when you're signed in to the dashboard on that browser:
```js
const remote = await fetch('/config.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : {}).catch(() => ({}));
const local = localStorage.getItem('dksKardsAdmin') ? JSON.parse(localStorage.getItem('dksKardsConfig') || '{}') : {};
const cfg = { ...DEFAULTS, ...remote, ...local };
```

### 10.4 Weekly routine (30 minutes)
Check all prices (confirm/reject) → review the Market board → update the live strip picks → swap the featured slab if it sold → export and publish.

### 10.5 Change copy, prices or colours
Everything visible is in the dashboard panels. Copy changes don't need code. Changing tokens (section 3) is a `styles.css` edit; change the dark and light values together.

---

## 11. Upgrade path

| When | Change |
|---|---|
| First paying members | Supabase Auth for sign-in; move `listings`, `inventory`, `comps` to Supabase tables (schema in the pricing guide); `config.json` becomes a build step |
| More than 50 tracked cards | Cloudflare Worker cron for price checks; the dashboard gets a "Price updates ready" review queue; Telegram alerts to you |
| Members using alerts | Per-member watchlists, email digests via Resend, Discord webhook for the Insider channel |
| Real sales volume | Replace Payment Links with Stripe Checkout per listing and automatic "sold" status via webhook |
| Video | 6-second turntable clips of top slabs (muted, autoplay only when in view and motion is allowed) |

---

## 12. Copy deck (starting point, editable in the dashboard)

| Place | Copy |
|---|---|
| Hero headline | Researched before it's listed. |
| Hero sub | Every slab here comes with the recent sales, the population and our notes from under the loupe. |
| Hero buttons | Browse the slabs / Start a Card Hunt |
| Tilt prompt (iOS) | Tilt your phone to light the card |
| Rail title | On the table |
| Only copy | This is the only copy we have |
| Ladder title | What a grade is worth |
| Ladder caption | The same card, priced by grade. The jump from 9 to 10 is where most of the value sits, and where our notes matter most. |
| Market title | What's moving |
| Hunt form | I have [A$___] to spend on [___]. |
| Hunt button | Send my brief |
| Hunt confirm | Brief sent. We'll reply within one business day with questions or a start date. |
| Membership title | Stay a step ahead of the AU market |
| Cert check | Check a cert / Enter a PSA, CGC or BGS cert number |
| Cert error | We couldn't find that cert. Check the number on the label and try again. |
| Empty shop | No slabs match these filters. Clear filters, or ask us to hunt one down. |
| Buy bar note | All-in price. Insured shipping in Australia. |
| Disclaimer | General information only. Nothing on this site is financial advice. Prices are in AUD and reflect recent sales, not future values. |

---

## 13. Checklist before launch

- [ ] Logo shows the DK chip + "DKsKards" wordmark (DM Mono, chartreuse on ink)
- [ ] Both themes pass contrast; theme choice persists
- [ ] Hero slab tilts with mouse; gyroscope works on Android and after the iOS prompt; nothing moves with reduced motion
- [ ] Flip works by button and keyboard
- [ ] Shop filters work as a bottom sheet on mobile
- [ ] Card page: loupe (desktop), pinch-zoom (mobile), sticky buy bar, chart with summary sentence
- [ ] Live strip pauses on hover/focus; text is escaped
- [ ] All prices show A$ with tabular numbers
- [ ] Disclaimer on every page
- [ ] `config.json` published; dashboard edits appear after export + deploy
- [ ] Tested at 320, 375, 412, 768, 1024, 1440 widths
