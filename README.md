# 9r4n4y — portfolio demo (`9r4n4y-podfolio-demo`)

A one-page personal portfolio for a fictional coder persona ("Pranay Singh",
handle `voidptr`), built as a demo. **Everything on the site is fake** — the
bio, jobs, repos and stars are invented placeholder data, and the footer says
so.

> **Live site:** https://9r4n4y.github.io/9r4n4y-podfolio-demo/
> *(deployed automatically by GitHub Actions on every push to `main`)*

---

## The full brief this site was built from

This section is the complete build prompt, kept verbatim-in-spirit so the demo
is reproducible. Every requirement is live on the site unless marked otherwise.

### Persona & content rules

- **Use fake data everywhere** — the man is a coder; invent the name, jobs,
  repos, stats. Name used on the site: **Pranay Singh**, handle **voidptr**.
- **No demo-template text**: remove helper/guide captions like
  "fig. 01 — …", file-path tags ("latent://…"), and "hover to do X" hints.
  The site must read as a finished portfolio, not a component showcase.
- A tiny translucent note under the profile photo:
  *"this is a fake photo used for privacy reasons"*.
- A small disclaimer at the very end of the site:
  *"this is just a fake demo site — nothing here is real."*
- Contact email used everywhere: **9r4n4yofficial@gmail.com**.

### Hero

- Full-viewport hero with the React Bits **Dither** background:
  <https://reactbits.dev/c/backgrounds/dither>
  (lime palette, calm wave, mouse erase + click ripple, unmounts offscreen).
- The name as a React Bits **TechText** wordmark:
  <https://reactbits.dev/text-animations/tech-text>
  — must match the site's own demo behavior (dashed vector paths under the
  cursor, selection box with px labels, drag physics; do not disable the
  component's defaults).
- Hero contains only the kicker line and the name; the bottom darkening must
  cover as little of the hero as possible and blend into the section below.

### Below the hero

- React Bits **TextLoop** scrolling word ribbons:
  <https://reactbits.dev/text-animations/text-loop>
  (wave ribbon after the hero, straight skills strip later; only the site's
  accent colors).
- All other headings/text use React Bits **VariableProximity**:
  <https://reactbits.dev/text-animations/variable-proximity>
  (Inter Variable wght 500→900 following the cursor, idle wave).
- Contact section: React Bits **ParticleText** —
  <https://reactbits.dev/text-animations/particle-text>
  ("LET'S TALK" as particles, lazy-mounted on first view, click burst).
- The portrait photo does **not** use an ASCII hover effect; instead it plays
  a **diffusion-type reveal**: it starts as a live ASCII portrait and
  denoises into the real photo as the noise σ counts 1.00 → 0.00, in clumpy
  fronts, smooth, with hover/click re-running the process on a fresh noise
  seed. (Custom component: `src/components/DiffusionPortrait.jsx`.)
- Portrait photo: free Unsplash image
  <https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d>
  (free to use under the Unsplash license).
- An **Asciify Swell** ground (ink `#8f8d86`, size 10, speed 1, opacity 0.6,
  dot marks) was integrated below the hero per
  <https://asciify.org/skill/SKILL.md> + <https://asciify.org/backgrounds>
  (`npm i asciify-engine`), then **removed** again in favor of the Galaxy
  background below. Keeping the note so the integration can be revived.
- React Bits **Galaxy** starfield as the background in all non-hero places:
  <https://reactbits.dev/c/backgrounds/galaxy>
  — pinned full-viewport layer behind the content, theme-aware star colors,
  non-interactive, mounted only once the hero is scrolled past.

### Globe strip

- A globe section after Experience and before Contact.
- The globe travels **left → right** with the scroll, **stops and fixes
  itself at the right edge**, and keeps rotating there.
- As the globe crosses, the text renders out **behind** it:
  "AVAILABLE IN" + a rolling country name.
- The rolling text is specifically React Bits **RotatingText** —
  <https://reactbits.dev/c/text-animations/rotating-text>
  — and **only the country name** rolls (USA, UK, INDIA, CHINA, JAPAN,
  GERMANY, DUBAI, BRAZIL). The component needs `motion`
  (<https://www.npmjs.com/package/motion>).

### Scroll & cursor rules

- Custom cursor: React Bits **TargetCursor**
  <https://reactbits.dev/animations/target-cursor> was integrated, trimmed to
  key targets, and finally **removed entirely** — the site now uses the
  normal OS cursor.
- Scroll must be **smooth with no dynamic time change**: no speed-up/slow-down,
  no "gravity" pull, no velocity skew/blur. Parallax drift is a strictly
  linear function of scroll offset. Section entrances are one-shot
  blur-to-sharp reveals only.
- The globe section keeps little empty space above and below itself.

### Background removals

- The after-hero animated ASCII ground (Asciify Swell) was removed — the
  background outside the hero is the Galaxy starfield only.

---

## Tech stack & structure

No build framework: plain JSX bundled with
[esbuild](https://esbuild.github.io/), served by a 40-line static server.
React 19 + the React Bits components copied from their registry.

```
├─ index.html                  entry (pre-paint theme script, no flash)
├─ serve.mjs                   static server → http://127.0.0.1:4613/
├─ src/
│  ├─ main.jsx                 React root + fonts (Inter/JetBrains Mono Variable)
│  ├─ App.jsx                  sections, galaxy ground gating
│  ├─ data.js                  ALL fake content (edit here)
│  ├─ hooks.js                 theme, parallax (linear), reveal, in-view
│  ├─ styles.css               design tokens (dark/light), layout
│  ├─ rb/                      React Bits components (registry copies)
│  │  ├─ Dither.jsx            hero background
│  │  ├─ TechText.jsx          hero name
│  │  ├─ TextLoop.jsx (+gsap)  ribbons
│  │  ├─ VariableProximity.jsx headings
│  │  ├─ ParticleText.jsx      contact
│  │  ├─ RotatingText.jsx(+motion) globe countries
│  │  └─ Galaxy.jsx            starfield ground
│  └─ components/
│     ├─ DiffusionPortrait.jsx ASCII → photo diffusion reveal
│     └─ GlobeStrip.jsx        scroll-driven globe section
└─ .github/workflows/deploy.yml  build + GitHub Pages deploy
```

Extra dependencies: [`gsap`](https://gsap.com) (TextLoop),
[`motion`](https://www.npmjs.com/package/motion) (RotatingText).

## Run it locally

```bash
npm install
npm run build      # esbuild → build/
npm run serve      # http://127.0.0.1:4613/
```

Edit `src/data.js` to change the persona, repos, jobs, countries and links.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds the bundle on every push to `main`,
copies `index.html` + `assets/` next to it, and deploys via the official
GitHub Pages actions. Pages is set to `build_type=workflow`.

## Verification

`shots.mjs` (kept out of the repo) drives a headless browser over CDP and
captures every section in both themes; console errors are echoed during the
run. On a software renderer some animation frames stretch — probe the DOM
before trusting a visual glitch.

## License & credits

- Demo content: fictional; contact address belongs to the demo owner.
- Components: [React Bits](https://reactbits.dev) (open-source components).
- Fonts: [Inter](https://rsms.me/inter/),
  [JetBrains Mono](https://www.jetbrains.com/lp/mono/) via Fontsource.
- Photo: [Unsplash](https://unsplash.com/photos/1507003211169-0a1dd7228f2d)
  (free to use).
