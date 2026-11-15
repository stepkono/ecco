import { STATIC_DEMO, backendUrl } from '../game/backend';

/**
 * The community archive: every labelled landscape becomes a "sound stamp", a small
 * picture of its 3D landscape seen from above. Stamps go to the server, so
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
  if (opts.local !== false || STATIC_DEMO) {
    const list = loadArchive().filter((x) => x.id !== e.id);
    list.unshift(e);
    saveArchive(list.slice(0, 200));
    window.dispatchEvent(new Event('archive-changed'));
  }
  // share it with the community (the static demo has no server: the archive stays in this browser)
  if (STATIC_DEMO) return Promise.resolve(undefined);
  return fetch(`${backendUrl()}/archive`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) })
    .then(() => window.dispatchEvent(new Event('archive-changed')))
    .catch(() => undefined);
}

/** Everyone's stamps from the server. Falls back to this browser's own when the server is away. */
export async function loadCommunity(): Promise<{ list: ArchiveEntry[]; online: boolean }> {
  if (STATIC_DEMO) return { list: loadArchive(), online: true };
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

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const pretty = (l: string) => (l.startsWith('noise:') ? `${l.slice(6)} noise` : l.replace(/_/g, ' '));
const when = (ms: number) => new Date(ms).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export interface ArchiveHooks {
  open(e: ArchiveEntry): void;
  /** add the practice landscapes as example stamps */
  seed(): Promise<void>;
}

/** The archive page: a full-screen grid of stamps, filtered by kind of sound. */
export function mountArchive(root: HTMLElement, hooks: ArchiveHooks) {
  let shown: ArchiveEntry[] = [];
  let filter = 'all';
  root.classList.add('archive-page');
  async function render() {
    const { list, online } = await loadCommunity();
    shown = list;
    const mine = new Set(loadArchive().filter((e) => e.player !== 'ecco team').map((e) => e.id));
    const own = list.filter((e) => mine.has(e.id)).length;
    const labels = [...new Set(list.map((e) => e.label))];
    if (filter !== 'all' && filter !== 'mine' && !labels.includes(filter)) filter = 'all';
    const visible = list.filter((e) => (filter === 'all' ? true : filter === 'mine' ? mine.has(e.id) : e.label === filter));
    const chip = (id: string, text: string, n: number) =>
      `<button class="ar-chip" data-filter="${esc(id)}" aria-pressed="${filter === id}">${esc(text)} <span>${n}</span></button>`;
    root.innerHTML = `<header class="ar-top">
        <button class="btn ghost" id="ar-close">← Back</button>
        <div class="ar-title">
          <h1>Community archive</h1>
          <p>${
            list.length
              ? `<b>${list.length}</b> landscape${list.length === 1 ? '' : 's'} solved by the community, <b>${labels.length}</b> kind${labels.length === 1 ? '' : 's'} of sound${own ? `, <b>${own}</b> by you` : ''}. Every stamp is the landscape seen from above. Open one to explore it again.`
              : 'Every solved landscape lands here as a stamp, seen from above.'
          }${online ? '' : ' <span class="muted">The server is not reachable, so only your own stamps are shown.</span>'}</p>
        </div>
      </header>
      ${
        list.length
          ? `<nav class="ar-chips" aria-label="Filter stamps">${chip('all', 'All', list.length)}${own ? chip('mine', 'Yours', own) : ''}${labels
              .map((l) => chip(l, pretty(l), list.filter((e) => e.label === l).length))
              .join('')}</nav>
        <div class="stamps">${visible
          .map(
            (e, i) => `<button class="stamp" data-id="${esc(e.id)}" style="--i:${Math.min(i, 16)}" title="Open this landscape again">
            <span class="st-img"><img src="${e.stamp}" alt="Top view of ${esc(e.title)}" loading="lazy"></span>
            <span class="st-body">
              <span class="st-label" style="--h:${e.hue}">${esc(pretty(e.label))}</span>
              <b>${esc(e.title)}</b>
              <small>${esc(e.place)} · ${when(e.recorded)}</small>
              <small class="st-kind">${mine.has(e.id) ? '<span class="st-mine">yours</span> · ' : ''}${e.kind === 'live' ? 'Live recording' : 'Challenge'} · solved ${when(e.labelled)}</small>
            </span>
          </button>`,
          )
          .join('')}</div>`
          : `<div class="ar-empty">No stamps yet. Label a recording with “Send label”, or contribute a challenge, and its landscape lands here.
              ${online ? '<br><button class="btn ghost" id="ar-seed">Add the practice landscapes as examples</button>' : ''}</div>`
      }`;
    root.querySelector<HTMLButtonElement>('#ar-close')!.onclick = hide;
    const seed = root.querySelector<HTMLButtonElement>('#ar-seed');
    if (seed)
      seed.onclick = async () => {
        seed.disabled = true;
        seed.textContent = 'Drawing the stamps…';
        await hooks.seed();
        void render();
      };
    // the online demo has no community yet: fill it with the example stamps right away
    if (seed && STATIC_DEMO) seed.click();
    root.querySelectorAll<HTMLButtonElement>('.ar-chip').forEach((b) => {
      b.onclick = () => {
        filter = b.dataset.filter!;
        void render();
      };
    });
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
    root.innerHTML = '<header class="ar-top"><div class="ar-title"><h1>Community archive</h1><p>Loading the stamps…</p></div></header>';
    root.hidden = false;
    root.scrollTop = 0;
    void render();
  }
  function hide() {
    root.hidden = true;
  }
  window.addEventListener('archive-changed', () => {
    if (!root.hidden) void render();
  });
  return { show, hide, count: async () => (await loadCommunity()).list.length };
}
