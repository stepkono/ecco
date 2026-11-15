// Builds every ecco logo concept as plain SVG files plus the overview page.
// Run: node brand/logos/build.mjs
//
// All shapes are plain geometry (circles, arcs, lines, rects), so the files
// stay small and readable. The wordmark is drawn as strokes, not a font, so
// the SVGs look the same everywhere.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
const f = (n) => +n.toFixed(2);
const rad = (deg) => (deg * Math.PI) / 180;

// ---------------------------------------------------------------- palette

const TILE = '#0b1820';
const PAPER = '#f4f6f1';

const DARK = {
  mono: false,
  fg: '#e8f1ee',
  lime: '#b6f06a',
  mint: '#5fe0a8',
  sky: '#4cc9f0',
  peri: '#7b8cff',
  lilac: '#c58cff',
  pink: '#ff8fc7',
  apricot: '#ffc15e',
};

const LIGHT = {
  mono: false,
  fg: '#11242c',
  lime: '#4f9e22',
  mint: '#119a7a',
  sky: '#1786c9',
  peri: '#4b5ad8',
  lilac: '#8648db',
  pink: '#d6448e',
  apricot: '#d9820c',
};

const monoTheme = (c) => ({
  mono: true,
  fg: c, lime: c, mint: c, sky: c, peri: c, lilac: c, pink: c, apricot: c,
});

const THEMES = {
  dark: DARK,
  light: LIGHT,
  mono: monoTheme('#11242c'),
  'mono-white': monoTheme('#ffffff'),
};

// Collects gradient defs for one SVG. In mono themes every paint is flat.
function makeCtx(t, prefix) {
  const defs = [];
  return {
    t,
    defs,
    prefix,
    grad(name, [x1, y1, x2, y2], stops) {
      if (t.mono) return t.fg;
      const id = `${prefix}-${name}`;
      const s = stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
      defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${s}</linearGradient>`);
      return `url(#${id})`;
    },
    op(v) {
      return t.mono ? 1 : v;
    },
  };
}

// ---------------------------------------------------------------- wordmark

// Lowercase geometric "ecco". Every letter is the same ring, cut open
// differently. d = x-height, w = stroke width.
function wordmark({ x, cy, d, w, colors, opacities = [1, 1, 1, 1] }) {
  const r = (d - w) / 2;
  const gap = d * 0.22;
  const tighten = d * 0.07; // the open side of a c needs less space
  const cx = [x + d / 2];
  cx.push(cx[0] + d + gap);
  cx.push(cx[1] + d + gap - tighten);
  cx.push(cx[2] + d + gap - tighten);

  const eTail = rad(38);
  const cOpen = rad(46);
  const e = `M${f(cx[0] - r)} ${f(cy)}H${f(cx[0] + r)}A${f(r)} ${f(r)} 0 1 0 ${f(cx[0] + r * Math.cos(eTail))} ${f(cy + r * Math.sin(eTail))}`;
  const c = (x0) =>
    `M${f(x0 + r * Math.cos(cOpen))} ${f(cy - r * Math.sin(cOpen))}A${f(r)} ${f(r)} 0 1 0 ${f(x0 + r * Math.cos(cOpen))} ${f(cy + r * Math.sin(cOpen))}`;
  const o = (i) => (opacities[i] === 1 ? '' : ` opacity="${opacities[i]}"`);

  const svg = [
    `<g fill="none" stroke-width="${f(w)}" stroke-linecap="round">`,
    `<path d="${e}" stroke="${colors[0]}"${o(0)}/>`,
    `<path d="${c(cx[1])}" stroke="${colors[1]}"${o(1)}/>`,
    `<path d="${c(cx[2])}" stroke="${colors[2]}"${o(2)}/>`,
    `<circle cx="${f(cx[3])}" cy="${f(cy)}" r="${f(r)}" stroke="${colors[3]}"${o(3)}/>`,
    `</g>`,
  ].join('\n  ');
  return { svg, width: cx[3] + d / 2 - x };
}

const WEIGHT = { light: 0.13, regular: 0.17, bold: 0.215 };

// ---------------------------------------------------------------- concepts
// Every mark is drawn in a 64 x 64 box. fav() is a simplified mark for
// 16 to 32 px, drawn in the same box and placed on a dark tile.

const CONCEPTS = [
  {
    id: 'echo',
    name: 'Echo',
    line: 'The two c’s become a call and the echo that comes back.',
    idea: 'Two nested arcs read as the “cc” in ecco and as rings of sound returning to a source. The dot is the animal call. Each ring is one hue step further, like a sorted color puzzle.',
    mood: 'Calm, precise, quietly technical.',
    best: 'App icon, favicon, the in-app Echo tool. Strong at every size.',
    weight: 'regular',
    words: (t) => [t.fg, t.sky, t.mint, t.fg],
    mark(c) {
      const { t } = c;
      const cx = 33, cy = 32;
      const arc = (r, deg) => {
        const a = rad(deg);
        return `M${f(cx + r * Math.cos(a))} ${f(cy - r * Math.sin(a))}A${r} ${r} 0 1 0 ${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`;
      };
      return `<g fill="none" stroke-width="7" stroke-linecap="round">
  <path d="${arc(24, 42)}" stroke="${t.sky}"/>
  <path d="${arc(12.5, 58)}" stroke="${t.mint}"/>
</g>
<circle cx="${cx}" cy="${cy}" r="4.5" fill="${t.lime}"/>`;
    },
    fav(c) {
      const { t } = c;
      const cx = 34, cy = 32;
      const arc = (r, deg) => {
        const a = rad(deg);
        return `M${f(cx + r * Math.cos(a))} ${f(cy - r * Math.sin(a))}A${r} ${r} 0 1 0 ${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`;
      };
      return `<g fill="none" stroke-width="9" stroke-linecap="round">
  <path d="${arc(25, 40)}" stroke="${t.sky}"/>
  <path d="${arc(11, 55)}" stroke="${t.mint}"/>
</g>`;
    },
  },

  {
    id: 'ridge',
    name: 'Voxel Ridge',
    line: 'A spectrogram that has grown into a mountain.',
    idea: 'Voxel columns from the 3D view stack into a ridge. Rows step from cool (quiet) to warm (loud) like a spectrogram color map. One voxel floats above: the unknown sound that waits for a label.',
    mood: 'Playful, game-like, a little retro.',
    best: 'Onboarding, game screens, stickers and merch. Most “fun” of the set.',
    weight: 'bold',
    words: (t) => [t.fg, t.fg, t.fg, t.fg],
    mark(c) {
      const { t } = c;
      const rows = [t.peri, t.sky, t.mint, t.lime, t.apricot];
      return voxels({ cols: [2, 4, 5, 3, 1], cell: 10, gap: 2.5, x0: 2, base: 62, rows, float: [4, 4, t.pink], rx: 2.5 });
    },
    fav(c) {
      const { t } = c;
      const rows = [t.sky, t.mint, t.lime, t.apricot];
      return voxels({ cols: [2, 4, 3, 1], cell: 13, gap: 3, x0: 1.5, base: 62.5, rows, float: [3, 3, t.pink], rx: 3 });
    },
  },

  {
    id: 'leaf',
    name: 'Waveleaf',
    line: 'A leaf whose vein is a sound wave.',
    idea: 'The midrib of the leaf is replaced by a bird call: a wave that swells and fades. From afar it is simply a leaf, up close it is sound. Nature carries the data.',
    mood: 'Organic, gentle, optimistic.',
    best: 'Nature and park partners, posters, field hardware labels.',
    weight: 'light',
    words: (t) => [t.fg, t.fg, t.fg, t.fg],
    mark(c) {
      const paint = c.grad('g', [12, 52, 56, 8], [[0, c.t.lime], [0.55, c.t.mint], [1, c.t.sky]]);
      return waveleaf(c, { paint, cut: 3.2, amps: [1, 2.3, 3.6, 3.8, 2.6, 1.3], stem: 4.5 });
    },
    fav(c) {
      const paint = c.grad('g', [12, 52, 56, 8], [[0, c.t.lime], [0.55, c.t.mint], [1, c.t.sky]]);
      return waveleaf(c, { paint, cut: 5.5, amps: [2.6, 5, 4], stem: 7 });
    },
  },

  {
    id: 'fern',
    name: 'Fiddlehead',
    line: 'A fern sprout that is also an ear and a spiral.',
    idea: 'A young fern curls like the inside of an ear, the part that listens. The curl is also the spiral view of ecco, where sound winds around a time axis. Its outline also hints at a map pin, the spot where a post listens.',
    mood: 'Warm, alive, hopeful.',
    best: 'Main brand mark. Works for the community side, the posts and the web app.',
    weight: 'regular',
    words: (t) => [t.fg, t.fg, t.fg, t.fg],
    mark(c) {
      const paint = c.grad('g', [22, 58, 40, 10], [[0, c.t.lime], [0.5, c.t.mint], [1, c.t.sky]]);
      return `<path d="M36 60C36 49 16 46 16 27A17 17 0 0 1 50 27A11 11 0 0 1 28 27A6 6 0 0 1 40 27" fill="none" stroke="${paint}" stroke-width="6.5" stroke-linecap="round"/>
<path d="M32 53.5C37 46 45 45.5 51 48C46 55 38 56 32 53.5Z" fill="${c.t.lime}"/>`;
    },
    fav(c) {
      const paint = c.grad('g', [22, 60, 40, 8], [[0, c.t.lime], [0.5, c.t.mint], [1, c.t.sky]]);
      return `<path d="M36 60C36 48 13 45 13 27A19 19 0 0 1 51 27A12 12 0 0 1 27 27" fill="none" stroke="${paint}" stroke-width="9" stroke-linecap="round"/>`;
    },
  },

  {
    id: 'decay',
    name: 'Decay',
    line: 'The word itself echoes and fades out.',
    idea: 'A wordmark-first concept. The letters of ecco step down in strength like an echo, and two trailing beats fade after the o. The mark is the e with that same fading rhythm.',
    mood: 'Editorial, rhythmic, understated.',
    best: 'Wordmark in headers, presentations, print. The mark is weaker alone.',
    weight: 'regular',
    words: (t) => [t.lilac, t.lilac, t.lilac, t.lilac],
    opacities: (t) => (t.mono ? [1, 1, 1, 1] : [1, 0.82, 0.66, 0.5]),
    mark(c) {
      const { t } = c;
      const e = eGlyph(21, 32, 40, 8.5);
      const paint = c.grad('g', [0, 12, 44, 52], [[0, t.lilac], [1, t.pink]]);
      return `<path d="${e}" fill="none" stroke="${paint}" stroke-width="8.5" stroke-linecap="round"/>
<circle cx="49.5" cy="32" r="4.3" fill="${t.pink}" opacity="${c.op(0.7)}"/>
<circle cx="59" cy="32" r="2.7" fill="${t.pink}" opacity="${c.op(0.4)}"/>`;
    },
    fav(c) {
      const { t } = c;
      const e = eGlyph(25, 32, 46, 10.5);
      const paint = c.grad('g', [2, 9, 48, 55], [[0, t.lilac], [1, t.pink]]);
      return `<path d="${e}" fill="none" stroke="${paint}" stroke-width="10.5" stroke-linecap="round"/>
<circle cx="56.5" cy="32" r="5" fill="${t.pink}" opacity="${c.op(0.6)}"/>`;
    },
    // Decay has its own lockup: the wordmark plus two fading beats.
    lockup(t, prefix) {
      const d = 34, w = d * WEIGHT.regular, cy = 32;
      const wm = wordmark({ x: 4, cy, d, w, colors: this.words(t), opacities: this.opacities(t) });
      const x = 4 + wm.width;
      const b1 = x + d * 0.36, b2 = x + d * 0.78;
      const beats = `<circle cx="${f(b1)}" cy="${cy}" r="${f(d * 0.14)}" fill="${t.pink}" opacity="${t.mono ? 1 : 0.6}"/>
<circle cx="${f(b2)}" cy="${cy}" r="${f(d * 0.095)}" fill="${t.pink}" opacity="${t.mono ? 1 : 0.35}"/>`;
      return { body: `${wm.svg}\n${beats}`, width: f(b2 + d * 0.095 + 4), defs: [] };
    },
  },

  {
    id: 'mirror',
    name: 'Still Water',
    line: 'A spruce and its reflection, the mirrored surface view.',
    idea: 'Above the water line stands the forest. Below it the reflection breaks into ripples that read as sound lines. It mirrors the app’s mirrored-surface view and the idea that the forest speaks back.',
    mood: 'Quiet, serene, Nordic.',
    best: 'National park partners, signage, the listening posts themselves.',
    weight: 'light',
    words: (t) => [t.fg, t.fg, t.fg, t.fg],
    mark(c) {
      const { t } = c;
      const tree = c.grad('g', [32, 5, 32, 35], [[0, t.lime], [1, t.mint]]);
      return `<path d="M32 5L43 20H38.5L50 35H14L25.5 20H21Z" fill="${tree}" stroke="${tree}" stroke-width="3.5" stroke-linejoin="round"/>
<g stroke-width="4.5" stroke-linecap="round" fill="none">
  <path d="M8 42.5H56" stroke="${t.sky}"/>
  <path d="M18 50.5H31M36.5 50.5H44" stroke="${t.peri}"/>
  <path d="M26 58.5H37" stroke="${t.lilac}"/>
</g>`;
    },
    fav(c) {
      const { t } = c;
      const tree = c.grad('g', [32, 4, 32, 38], [[0, t.lime], [1, t.mint]]);
      return `<path d="M32 4L45 21H40L53 38H11L24 21H19Z" fill="${tree}" stroke="${tree}" stroke-width="4" stroke-linejoin="round"/>
<g stroke-width="6.5" stroke-linecap="round">
  <path d="M6 47.5H58" stroke="${t.sky}"/>
  <path d="M20 58H40" stroke="${t.peri}"/>
</g>`;
    },
  },

  {
    id: 'grid',
    name: 'Hue Grid',
    line: 'A color puzzle with one tile left for you.',
    idea: 'Nine tiles in a smooth color field, like a sorted hue puzzle or a tiny spectrogram. One tile is open: the sound the post was unsure about. Your label completes the picture.',
    mood: 'Bright, social, game-first.',
    best: 'Community features, badges, social posts, the labeling game.',
    weight: 'bold',
    words: (t) => [t.fg, t.fg, t.fg, t.fg],
    mark(c) {
      return hueGrid(c, { cell: 17, gap: 4.5, x0: 2, rx: 4.5, ring: 3.5, dot: 3 });
    },
    fav(c) {
      return hueGrid(c, { cell: 18, gap: 5, x0: 0, rx: 5, ring: 4.5, dot: 0 });
    },
  },
];

// ---------------------------------------------------------------- shapes

function voxels({ cols, cell, gap, x0, base, rows, float, rx }) {
  const rects = [];
  const at = (col, row, fill) => {
    const x = x0 + col * (cell + gap);
    const y = base - (row + 1) * cell - row * gap;
    rects.push(`<rect x="${f(x)}" y="${f(y)}" width="${cell}" height="${cell}" rx="${rx}" fill="${fill}"/>`);
  };
  cols.forEach((h, col) => {
    for (let row = 0; row < h; row++) at(col, row, rows[row]);
  });
  if (float) at(float[0], float[1], float[2]);
  return rects.join('\n');
}

// Leaf from base (12,52) to tip (56,8), symmetric around that diagonal.
// The vein is a wave of half-periods with the given amplitudes, cut out
// of the leaf with a mask so it works in one color too.
function waveleaf(c, { paint, cut, amps, stem }) {
  const id = `${c.prefix}-cut`;
  const len = 44;
  const step = len / amps.length;
  let d = `M${f(-len / 2)} 0`;
  amps.forEach((a, i) => {
    const x = -len / 2 + i * step;
    const sign = i % 2 ? 1 : -1;
    d += `Q${f(x + step / 2)} ${f(sign * a * 2)} ${f(x + step)} 0`;
  });
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
  <rect width="64" height="64" fill="#fff"/>
  <path d="${d}" transform="translate(34 30) rotate(-45)" fill="none" stroke="#000" stroke-width="${cut}" stroke-linecap="round"/>
</mask>
<g mask="url(#${id})">
  <path d="M12 52C6 30 24 8 56 8C56 40 34 58 12 52Z" fill="${paint}"/>
  <path d="M13 51L6 58" stroke="${paint}" stroke-width="${stem}" stroke-linecap="round"/>
</g>`;
}

function eGlyph(cx, cy, d, w, tail = 46) {
  const r = (d - w) / 2;
  const a = rad(tail);
  return `M${f(cx - r)} ${f(cy)}H${f(cx + r)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`;
}

function hueGrid(c, { cell, gap, x0, rx, ring, dot }) {
  const { t } = c;
  const steps = [t.apricot, t.lime, t.mint, t.sky, t.peri]; // one hue per diagonal
  const open = [1, 2];
  const out = [];
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 3; col++) {
      const fill = steps[r + col];
      const x = x0 + col * (cell + gap), y = x0 + r * (cell + gap);
      if (r === open[0] && col === open[1]) {
        const i = ring / 2;
        out.push(`<rect x="${f(x + i)}" y="${f(y + i)}" width="${f(cell - ring)}" height="${f(cell - ring)}" rx="${f(rx - i)}" fill="none" stroke="${fill}" stroke-width="${ring}"/>`);
        if (dot) out.push(`<circle cx="${f(x + cell / 2)}" cy="${f(y + cell / 2)}" r="${dot}" fill="${fill}"/>`);
      } else {
        out.push(`<rect x="${f(x)}" y="${f(y)}" width="${cell}" height="${cell}" rx="${rx}" fill="${fill}"/>`);
      }
    }
  }
  return out.join('\n');
}

// ---------------------------------------------------------------- files

function svgFile({ w, h, title, defs, body }) {
  const d = defs.length ? `<defs>\n${defs.join('\n')}\n</defs>\n` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="ecco">
<title>${title}</title>
${d}${body}
</svg>
`;
}

function defaultLockup(concept, t, prefix) {
  const c = makeCtx(t, prefix);
  const mark = concept.mark(c);
  const d = 30;
  const gapX = 17;
  const wm = wordmark({
    x: 64 + gapX,
    cy: 32,
    d,
    w: d * WEIGHT[concept.weight],
    colors: concept.words(t),
    opacities: concept.opacities ? concept.opacities(t) : undefined,
  });
  return { body: `${mark}\n${wm.svg}`, width: f(64 + gapX + wm.width + 2), defs: c.defs };
}

const files = {};
for (const concept of CONCEPTS) {
  const dir = join(OUT, concept.id);
  mkdirSync(dir, { recursive: true });
  files[concept.id] = [];
  const write = (name, content) => {
    writeFileSync(join(dir, name), content);
    files[concept.id].push(name);
  };

  for (const [key, t] of Object.entries(THEMES)) {
    // mark
    const c = makeCtx(t, `${concept.id}-mark-${key}`);
    const body = concept.mark(c);
    write(`mark-${key}.svg`, svgFile({ w: 64, h: 64, title: `ecco, ${concept.name} mark (${key})`, defs: c.defs, body }));

    // lockup
    const prefix = `${concept.id}-lockup-${key}`;
    const lk = concept.lockup ? concept.lockup(t, prefix) : defaultLockup(concept, t, prefix);
    write(`lockup-${key}.svg`, svgFile({ w: lk.width, h: 64, title: `ecco, ${concept.name} lockup (${key})`, defs: lk.defs, body: lk.body }));
  }

  // favicon: simplified mark on a dark tile, readable on light and dark tabs
  const fc = makeCtx(DARK, `${concept.id}-fav`);
  const favBody = concept.fav(fc);
  write(
    'favicon.svg',
    svgFile({
      w: 64,
      h: 64,
      title: `ecco, ${concept.name} favicon`,
      defs: fc.defs,
      body: `<rect width="64" height="64" rx="15" fill="${TILE}"/>\n<g transform="translate(7 7) scale(0.78125)">\n${favBody}\n</g>`,
    }),
  );
}

// ---------------------------------------------------------------- overview

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const img = (src, h, alt) => `<img src="${src}" style="height:${h}px" alt="${esc(alt)}">`;

const glance = CONCEPTS.map(
  (k, i) => `<button class="glance-item" data-fav="${k.id}/favicon.svg" title="Use as this tab’s favicon">
        ${img(`${k.id}/mark-dark.svg`, 56, `${k.name} mark`)}
        <span class="glance-icons">
          ${img(`${k.id}/favicon.svg`, 32, `${k.name} favicon 32 px`)}
          ${img(`${k.id}/favicon.svg`, 16, `${k.name} favicon 16 px`)}
        </span>
        <span class="glance-name"><span class="num">${String(i + 1).padStart(2, '0')}</span> ${esc(k.name)}</span>
      </button>`,
).join('\n      ');

const pixels = CONCEPTS.map(
  (k) => `<div class="pix">
        <span class="glance-name">${esc(k.name)}</span>
        <span class="pix-row">
          <canvas data-src="${k.id}/favicon.svg" data-px="16"></canvas>
          <canvas data-src="${k.id}/mark-dark.svg" data-px="16" class="on-dark"></canvas>
          <canvas data-src="${k.id}/mark-light.svg" data-px="16" class="on-light"></canvas>
        </span>
        <span class="pix-row">
          <canvas data-src="${k.id}/favicon.svg" data-px="32"></canvas>
          <canvas data-src="${k.id}/mark-mono.svg" data-px="32" class="on-light"></canvas>
        </span>
      </div>`,
).join('\n      ');

const sizes = (id, theme) =>
  [64, 48, 32, 24, 16].map((s) => `<figure>${img(`${id}/mark-${theme}.svg`, s, `${s} px`)}<figcaption>${s}</figcaption></figure>`).join('') +
  `<span class="sep"></span>` +
  [32, 16].map((s) => `<figure>${img(`${id}/favicon.svg`, s, `favicon ${s} px`)}<figcaption>fav ${s}</figcaption></figure>`).join('');

const sections = CONCEPTS.map((k, i) => {
  const n = String(i + 1).padStart(2, '0');
  return `
  <section class="concept" id="${k.id}">
    <header class="concept-head">
      <span class="num">${n}</span>
      <div>
        <h2>${esc(k.name)}</h2>
        <p class="line">${esc(k.line)}</p>
      </div>
      <button class="try" data-fav="${k.id}/favicon.svg">Try as tab icon</button>
    </header>

    <dl class="why">
      <div><dt>Idea</dt><dd>${esc(k.idea)}</dd></div>
      <div><dt>Mood</dt><dd>${esc(k.mood)}</dd></div>
      <div><dt>Works best</dt><dd>${esc(k.best)}</dd></div>
    </dl>

    <div class="hero">
      <div class="panel dark big">${img(`${k.id}/mark-dark.svg`, 168, `${k.name} mark on dark`)}</div>
      <div class="panel light big">${img(`${k.id}/mark-light.svg`, 168, `${k.name} mark on light`)}</div>
    </div>

    <div class="lockups">
      <div class="panel dark">${img(`${k.id}/lockup-dark.svg`, 72, `${k.name} lockup on dark`)}</div>
      <div class="panel light">${img(`${k.id}/lockup-light.svg`, 72, `${k.name} lockup on light`)}</div>
      <div class="panel light">${img(`${k.id}/lockup-mono.svg`, 48, `${k.name} one color, dark ink`)}<span class="tag">one color</span></div>
      <div class="panel dark">${img(`${k.id}/lockup-mono-white.svg`, 48, `${k.name} one color, white`)}<span class="tag">one color</span></div>
    </div>

    <div class="small">
      <div class="panel dark sizes">${sizes(k.id, 'dark')}</div>
      <div class="panel light sizes">${sizes(k.id, 'light')}</div>
      <div class="panel light sizes mono">
        ${[48, 32, 16].map((s) => `<figure>${img(`${k.id}/mark-mono.svg`, s, `one color ${s} px`)}<figcaption>${s}</figcaption></figure>`).join('')}
      </div>
      <div class="panel dark sizes mono">
        ${[48, 32, 16].map((s) => `<figure>${img(`${k.id}/mark-mono-white.svg`, s, `one color white ${s} px`)}<figcaption>${s}</figcaption></figure>`).join('')}
      </div>
    </div>

    <div class="tabs">
      <div class="tab tab-light">${img(`${k.id}/favicon.svg`, 16, 'favicon')}<span>ecco · label a sound</span><i>×</i></div>
      <div class="tab tab-dark">${img(`${k.id}/favicon.svg`, 16, 'favicon')}<span>ecco · label a sound</span><i>×</i></div>
    </div>

    <p class="files">Files: ${files[k.id].map((n) => `<a href="${k.id}/${n}">${n}</a>`).join(' ')}</p>
  </section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ecco logo concepts</title>
<link id="favicon" rel="icon" type="image/svg+xml" href="${CONCEPTS[0].id}/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #071118;
    --surface: #0b1820;
    --line: #1c3340;
    --text: #e8f1ee;
    --muted: #8fa9ad;
    --accent: #5fe0a8;
    --paper: ${PAPER};
    --paper-line: #dde3dc;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font: 16px/1.5 "Space Grotesk", system-ui, sans-serif;
  }
  .wrap { max-width: 1180px; margin: 0 auto; padding: 48px 24px 96px; }
  .eyebrow, .num, figcaption, .tag, .files, dt, .glance-name {
    font-family: "JetBrains Mono", ui-monospace, monospace;
  }
  .eyebrow { color: var(--accent); font-size: 13px; letter-spacing: .08em; text-transform: uppercase; margin: 0 0 8px; }
  h1 { font-size: clamp(32px, 5vw, 52px); line-height: 1.05; margin: 0 0 16px; font-weight: 600; letter-spacing: -.02em; }
  .intro { color: var(--muted); max-width: 680px; margin: 0 0 40px; }
  .intro b { color: var(--text); font-weight: 500; }

  .glance {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 64px;
  }
  .glance-item {
    all: unset;
    cursor: pointer;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .glance-item:hover, .glance-item.active { border-color: var(--accent); }
  .glance-item:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .glance-item > img { width: 56px; }
  .glance-icons { display: flex; align-items: center; gap: 10px; }
  .glance-name { font-size: 12px; color: var(--text); }
  .num { color: var(--muted); font-size: 12px; }

  .sub { font-size: 20px; font-weight: 600; margin: 0 0 6px; }
  .small-intro { margin-bottom: 20px; font-size: 15px; }
  .pixels {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 12px;
    margin-bottom: 72px;
  }
  .pix { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
  .pix-row { display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap; }
  .pix canvas { width: 64px; height: 64px; image-rendering: pixelated; border-radius: 4px; }
  .pix canvas[data-px="16"] { width: 48px; height: 48px; }
  .pix canvas[data-px="32"] { width: 96px; height: 96px; }
  .pix canvas.on-dark { background: #000; }
  .pix canvas.on-light { background: var(--paper); }
  .concept { border-top: 1px solid var(--line); padding: 48px 0 24px; }
  .concept-head { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
  .concept-head .num { padding-top: 10px; }
  .concept-head > div { flex: 1; }
  h2 { font-size: 30px; margin: 0; font-weight: 600; letter-spacing: -.01em; }
  .line { margin: 2px 0 0; color: var(--muted); }
  .try {
    font: 500 13px "Space Grotesk", sans-serif;
    color: var(--text); background: transparent;
    border: 1px solid var(--line); border-radius: 999px;
    padding: 8px 14px; cursor: pointer; white-space: nowrap;
  }
  .try:hover { border-color: var(--accent); }

  .why { display: grid; grid-template-columns: 2fr 1fr 1.3fr; gap: 24px; margin: 0 0 24px; }
  .why div { margin: 0; }
  dt { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--accent); margin-bottom: 4px; }
  dd { margin: 0; font-size: 15px; color: #c5d6d6; }

  .panel {
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    position: relative;
    min-width: 0;
  }
  .panel img { max-width: 100%; width: auto; object-fit: contain; }
  .panel.dark { background: var(--surface); border: 1px solid var(--line); }
  .panel.light { background: var(--paper); border: 1px solid var(--paper-line); color: #11242c; }
  .hero { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .panel.big { height: 280px; }
  .lockups { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .lockups .panel { height: 150px; padding: 24px; }
  .tag {
    position: absolute; top: 10px; left: 12px;
    font-size: 10px; letter-spacing: .08em; text-transform: uppercase; opacity: .55;
  }
  .small { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .sizes { justify-content: flex-start; gap: 18px; padding: 18px 20px 12px; align-items: flex-end; flex-wrap: wrap; }
  .sizes figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; }
  figcaption { font-size: 10px; opacity: .55; }
  .sep { width: 1px; align-self: stretch; background: currentColor; opacity: .15; }
  .panel.dark .sep { background: var(--text); }

  .tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .tab {
    display: flex; align-items: center; gap: 8px;
    height: 36px; padding: 0 12px; border-radius: 10px 10px 0 0;
    font: 13px system-ui, sans-serif; max-width: 240px;
  }
  .tab span { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tab i { font-style: normal; opacity: .5; }
  .tab-light { background: #ffffff; color: #1f1f1f; box-shadow: 0 0 0 1px #dadce0; }
  .tab-dark { background: #35363a; color: #e8eaed; }
  .files { font-size: 11px; color: var(--muted); margin: 4px 0 0; line-height: 1.9; }
  .files a { color: var(--muted); margin-right: 10px; }
  .files a:hover { color: var(--accent); }

  @media (max-width: 760px) {
    .wrap { padding: 32px 16px 64px; }
    .glance { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .why { grid-template-columns: 1fr; gap: 12px; }
    .hero, .lockups, .small, .tabs { grid-template-columns: 1fr; }
    .panel.big { height: 220px; }
    .concept-head { flex-wrap: wrap; }
  }
</style>
</head>
<body>
<main class="wrap">
  <p class="eyebrow">ecco brand · round 1</p>
  <h1>Logo concepts</h1>
  <p class="intro">Seven directions for <b>ecco</b>, the community platform that listens to forests. Each concept has a mark, a lockup, one-color versions and a simplified favicon. All lettering is drawn as geometry, so no font is needed in the files. <b>Click any concept</b> to try its favicon in this browser tab.</p>

  <div class="glance">
      ${glance}
  </div>

  <h3 class="sub">Pixel check</h3>
  <p class="intro small-intro">Each favicon and mark rendered at a true 16 px and 32 px, like on a 1x screen, then enlarged 4 times. This is what a browser tab really shows.</p>
  <div class="pixels">
      ${pixels}
  </div>
${sections}
</main>
<script>
  // Draw each SVG at its true pixel size (no retina scaling), CSS enlarges it.
  document.querySelectorAll('canvas[data-src]').forEach((cv) => {
    const px = +cv.dataset.px;
    cv.width = px; cv.height = px;
    const im = new Image();
    im.onload = () => {
      const ctx = cv.getContext('2d');
      if (cv.classList.contains('on-light')) { ctx.fillStyle = '${PAPER}'; ctx.fillRect(0, 0, px, px); }
      if (cv.classList.contains('on-dark')) { ctx.fillStyle = '${TILE}'; ctx.fillRect(0, 0, px, px); }
      ctx.drawImage(im, 0, 0, px, px);
    };
    im.src = cv.dataset.src;
  });
  const link = document.getElementById('favicon');
  const items = document.querySelectorAll('[data-fav]');
  items.forEach((el) => el.addEventListener('click', () => {
    link.href = el.dataset.fav;
    document.querySelectorAll('.glance-item').forEach((g) => g.classList.toggle('active', g.dataset.fav === el.dataset.fav));
  }));
</script>
</body>
</html>
`;

writeFileSync(join(OUT, 'index.html'), html);
console.log(`Wrote ${CONCEPTS.length} concepts to ${OUT}`);
