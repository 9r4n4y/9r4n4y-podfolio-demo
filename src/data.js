// All data below is fictional placeholder content for the demo persona.

export const person = {
  name: 'Pranay Singh',
  handle: 'voidptr',
  role: 'full-stack engineer · systems tinkerer',
  location: 'bengaluru, in — utc+5:30',
  email: '9r4n4yofficial@gmail.com',
  status: 'open to weird problems',
};

export const roles =
  'FULL-STACK DEV ✦ RUST & GO ✦ WEBGPU TINKERER ✦ OPEN SOURCE ✦ COMPILER NERD ✦ SHIPS ON FRIDAYS';

export const skillsLoop =
  'TYPESCRIPT ✦ RUST ✦ GO ✦ REACT ✦ NODE.JS ✦ WEBGPU ✦ POSTGRES ✦ WASM ✦ K8S ✦ SQLITE ✦ FFI ✦ GLSL';

export const bio = [
  'I write code that has to survive contact with reality: renderers that hold 120fps on integrated GPUs, pipelines that swallow terabytes without blinking, and CLIs people actually keep installed.',
  'Eight years in, my core skill is still "read the spec twice, then read the source once more". I care about p99 latency, honest error messages, and deleting more code than I write.',
  'Off the clock I maintain a shader playground, contribute to Rust async runtimes, and lose arguments with the borrow checker about once a week.',
];

export const facts = [
  ['os', 'arch, btw'],
  ['editor', 'neovim (.config publicly shamed)'],
  ['shell', 'fish + 400 aliases'],
  ['uptime', '8y shipping to prod'],
];

export const stats = [
  ['08', 'years shipping'],
  ['63', 'public repos'],
  ['12.4k', 'commits / yr'],
  ['∞', 'coffee consumed'],
];

export const projects = [
  {
    name: 'ferrocache',
    desc: 'Embeddable zero-copy KV store in Rust. mmap-backed LSM tree, 4M ops/s on a laptop, zero unsafe outside the arena.',
    tags: ['rust', 'mmap', 'lsmt'],
    stars: '4.2k',
    lang: 'Rust',
    dot: '#dea584',
    href: '#',
  },
  {
    name: 'glslpunk',
    desc: 'Live-coding shader environment for the browser. Hot-swappable uniforms, built-in dither lab, exports a single HTML file.',
    tags: ['webgl2', 'shaders', 'vite'],
    stars: '2.8k',
    lang: 'GLSL',
    dot: '#5ccfe6',
    href: '#',
  },
  {
    name: 'wgpu-tiles',
    desc: 'Tiled map renderer at 120fps on integrated GPUs via WebGPU compute. Graceful WebGL2 fallback, 90 kB gzipped.',
    tags: ['webgpu', 'wgpu', 'compute'],
    stars: '1.9k',
    lang: 'Rust',
    dot: '#dea584',
    href: '#',
  },
  {
    name: 'tokamak',
    desc: 'Actor runtime for Go with structured concurrency and backpressure. Zero per-message allocations, panic-cancels subtrees.',
    tags: ['go', 'actors', 'runtime'],
    stars: '1.4k',
    lang: 'Go',
    dot: '#00add8',
    href: '#',
  },
  {
    name: 'hexdump.ink',
    desc: 'Static-site generator that renders markdown as a terminal session, complete with fake command history. You are soaking in it.',
    tags: ['ssg', 'markdown', 'cli'],
    stars: '980',
    lang: 'TS',
    dot: '#3178c6',
    href: '#',
  },
  {
    name: 'nullstack',
    desc: 'A 4 kB React-compatible runtime that streams components over WebSocket. No, you cannot use it in prod. Yes, people tried.',
    tags: ['react', 'ssr', 'websocket'],
    stars: '760',
    lang: 'JS',
    dot: '#f1e05a',
    href: '#',
  },
];

export const experience = [
  {
    role: 'Staff Engineer',
    org: 'Parallax Labs',
    period: '2023 — now',
    note: 'Leading the edge-compute platform team. Cut p99 by 60%, broke prod twice, wrote a postmortem zine about it.',
  },
  {
    role: 'Senior Systems Engineer',
    org: 'Kite & Anchor',
    period: '2020 — 2023',
    note: 'Built the realtime collab engine — CRDTs, not vibes. Scaled to 2M concurrent sessions and one memorable DNS outage.',
  },
  {
    role: 'Backend Engineer',
    org: 'Ferrofluid IO',
    period: '2018 — 2020',
    note: 'Owned the ingestion pipeline: 40 TB/day, exactly-once semantics, and a Kafka cluster I still have dreams about.',
  },
  {
    role: 'Indie Hacker',
    org: 'self-employed',
    period: '2016 — 2018',
    note: 'Shipped 14 apps. Three made money. One taught me EU VAT compliance in the most expensive way possible.',
  },
];

export const socials = [
  ['github', 'github.com/voidptr', '#'],
  ['mastodon', '@voidptr@hachyderm.io', '#'],
  ['linkedin', 'in/pranaysingh', '#'],
  ['rss', 'pranaysingh.dev/feed.xml', '#'],
];
