import { N_BINS, BIN_HZ } from '../dsp/stft';
import type { Session } from '../game/session';
import { backendUrl } from '../game/backend';

/**
 * The community archive: every labelled landscape becomes a "sound stamp", an abstract
 * top view of its sound with a colour gradient of its own. Stamps go to the server, so
 * everyone sees everyone's stamps. A copy stays in this browser, which marks your own.
 */
export interface ArchiveEntry {
  id: string; // clip id (live) or level id (challenge)
  kind: 'live' | 'challenge';
  title: string;
  label: string;
  place: string;
  recorded: number; // ms since epoch
  labelled: number; // ms since epoch
  stamp: string; // data URL (JPEG)
  hue: number;
  levelIndex?: number;
  player?: string;
}

const KEY = 'ecco.archive.v1';

export function loadArchive(): ArchiveEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as ArchiveEntry[];
  } catch {
    return [];
  }
}

function saveArchive(list: ArchiveEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage full or blocked: drop the oldest half and try once more
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, Math.ceil(list.length / 2))));
    } catch {
      /* the archive stays in memory only */
    }
  }
}

/**
 * Add or update an entry (the same recording labelled again replaces its stamp).
 * `local: false` shares it with the community only, without marking it as yours.
 */
export function addToArchive(e: ArchiveEntry, opts: { local?: boolean } = {}): Promise<unknown> {
  if (opts.local !== false) {
    const list = loadArchive().filter((x) => x.id !== e.id);
    list.unshift(e);
    saveArchive(list.slice(0, 200));
    window.dispatchEvent(new Event('archive-changed'));
  }
  // share it with the community
  return fetch(`${backendUrl()}/archive`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) })
    .then(() => window.dispatchEvent(new Event('archive-changed')))
    .catch(() => undefined);
}

/** Everyone's stamps from the server. Falls back to this browser's own when the server is away. */
export async function loadCommunity(): Promise<{ list: ArchiveEntry[]; online: boolean }> {
  try {
    const r = await fetch(`${backendUrl()}/archive`);
    if (!r.ok) throw new Error(String(r.status));
    return { list: (await r.json()) as ArchiveEntry[], online: true };
  } catch {
    return { list: loadArchive(), online: false };
  }
}

export function removeFromArchive(id: string) {
  saveArchive(loadArchive().filter((x) => x.id !== id));
  window.dispatchEvent(new Event('archive-changed'));
}

/** A stable number from a string, so the same recording always gets the same colours. */
export function hueOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return Math.abs(h) % 360;
}

const hsl = (h: number, s: number, l: number): [number, number, number] => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [255 * f(0), 255 * f(8), 255 * f(4)];
};

/**
 * Draw the stamp: the landscape seen from above, coarse and soft, in a gradient of its
 * own. Quiet parts take a deep shade of the base hue, loud parts move towards a lighter,
 * neighbouring hue. Painted parts glow a little brighter.
 */
export function renderStamp(s: Session, hue: number, size = 168): string {
  const G = 14; // very coarse grid: the stamp shows the character of the sound, not its detail
  const grid = new Float32Array(G * G);
  const melOf = (hz: number) => 2595 * Math.log10(1 + hz / 700);
  const melMax = melOf((N_BINS - 1) * BIN_HZ);
  const painted = new Float32Array(s.frames * N_BINS);
  for (const l of s.layers) for (let i = 0; i < painted.length; i++) painted[i] = Math.max(painted[i], l.mask[i]);
  const cnt = new Float32Array(G * G);
  for (let t = 0; t < s.frames; t++) {
    const gx = Math.min(G - 1, Math.floor((t / s.frames) * G));
    for (let k = 1; k < N_BINS; k++) {
      const gy = G - 1 - Math.min(G - 1, Math.floor((melOf(k * BIN_HZ) / melMax) * G));
      const i = t * N_BINS + k;
      let v = (s.db[i] - s.floor[k] - 6) / 28; // the steady background stays dark
      v = v < 0 ? 0 : v > 1 ? 1 : v;
      v = Math.max(v, v * 0.6 + painted[i] * 0.4);
      const o = gy * G + gx;
      grid[o] += v;
      cnt[o]++;
    }
  }
  const small = document.createElement('canvas');
  small.width = small.height = G;
  const g = small.getContext('2d')!;
  const img = g.createImageData(G, G);
  const lo = hsl(hue, 50, 13);
  const mid = hsl((hue + 40) % 360, 70, 48);
  const hi = hsl((hue + 80) % 360, 90, 80);
  for (let i = 0; i < G * G; i++) {
    const v = Math.min(1, Math.pow(grid[i] / Math.max(1, cnt[i]), 0.85) * 2.2);
    const [a, b, f] = v < 0.5 ? [lo, mid, v / 0.5] : [mid, hi, (v - 0.5) / 0.5];
    img.data[i * 4] = a[0] + (b[0] - a[0]) * f;
    img.data[i * 4 + 1] = a[1] + (b[1] - a[1]) * f;
    img.data[i * 4 + 2] = a[2] + (b[2] - a[2]) * f;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // scale up with smoothing and a soft blur: an abstract stamp, not a chart
  const big = document.createElement('canvas');
  big.width = big.height = size;
  const b = big.getContext('2d')!;
  b.imageSmoothingEnabled = true;
  b.imageSmoothingQuality = 'high';
  b.filter = 'blur(9px)';
  b.drawImage(small, -14, -14, size + 28, size + 28);
  b.filter = 'none';
  return big.toDataURL('image/jpeg', 0.82);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const pretty = (l: string) => (l.startsWith('noise:') ? `${l.slice(6)} noise` : l.replace(/_/g, ' '));
const when = (ms: number) => new Date(ms).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export interface ArchiveHooks {
  open(e: ArchiveEntry): void;
  /** add the practice landscapes as example stamps */
  seed(): Promise<void>;
}

/** The archive page: a grid of stamps. */
export function mountArchive(root: HTMLElement, hooks: ArchiveHooks) {
  let shown: ArchiveEntry[] = [];
  async function render() {
    const { list, online } = await loadCommunity();
    shown = list;
    const mine = new Set(loadArchive().map((e) => e.id));
    const own = list.filter((e) => mine.has(e.id)).length;
    const labels = [...new Set(list.map((e) => e.label))];
    root.innerHTML = `<div class="sheet archive-sheet">
      <button class="btn ghost close" id="ar-close">Close ✕</button>
      <h2>Community archive</h2>
      <p class="lead">Every labelled landscape becomes a sound stamp with colours of its own. ${
        list.length
          ? `The community collected <b>${list.length}</b> stamp${list.length === 1 ? '' : 's'} of <b>${labels.length}</b> kind${labels.length === 1 ? '' : 's'} of sound${own ? `, <b>${own}</b> of them yours` : ''}.`
          : ''
      }${online ? '' : ' <span class="muted">The server is not reachable, so only your own stamps are shown.</span>'}</p>
      ${
        list.length
          ? `<div class="stamps">${list
              .map(
                (e) => `<button class="stamp" data-id="${esc(e.id)}" title="Open this landscape again">
            <img src="${e.stamp}" alt="Sound stamp of ${esc(e.title)}" width="168" height="168">
            <span class="st-label" style="--h:${e.hue}">${esc(pretty(e.label))}</span>
            <b>${esc(e.title)}</b>
            <small>${esc(e.place)} · ${when(e.recorded)}</small>
            <small class="st-kind">${mine.has(e.id) ? '<span class="st-mine">yours</span> · ' : ''}${e.kind === 'live' ? 'Live recording' : 'Challenge'} · labelled ${when(e.labelled)}</small>
          </button>`,
              )
              .join('')}</div>`
          : `<div class="ar-empty">No stamps yet. Label a recording with “Send label”, or contribute a challenge, and its landscape lands here.
              ${online ? '<br><button class="btn ghost" id="ar-seed">Add the practice landscapes as examples</button>' : ''}</div>`
      }
    </div>`;
    root.querySelector<HTMLButtonElement>('#ar-close')!.onclick = hide;
    const seed = root.querySelector<HTMLButtonElement>('#ar-seed');
    if (seed)
      seed.onclick = async () => {
        seed.disabled = true;
        seed.textContent = 'Drawing the stamps…';
        await hooks.seed();
        void render();
      };
    root.querySelectorAll<HTMLButtonElement>('.stamp').forEach((b) => {
      b.onclick = () => {
        const e = shown.find((x) => x.id === b.dataset.id);
        if (!e) return;
        hide();
        hooks.open(e);
      };
    });
  }
  function show() {
    root.innerHTML = '<div class="sheet archive-sheet"><h2>Community archive</h2><p class="lead">Loading the stamps…</p></div>';
    root.hidden = false;
    void render();
  }
  function hide() {
    root.hidden = true;
  }
  root.addEventListener('click', (e) => {
    if (e.target === root) hide();
  });
  return { show, hide, count: async () => (await loadCommunity()).list.length };
}
