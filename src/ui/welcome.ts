import { CATEGORIES, DIFFICULTY, PRACTICE, coords, partOfDay, sortChallenges, whenRecorded, type Category, type Challenge } from '../game/challenges';
import { brandLogo } from './brand';
import { FINLAND, LAKES, MAP_H, MAP_W, NEIGHBOURS, project } from './finland-map';

/**
 * Welcome screen: the mission, a three-step mental model of the task, and the
 * challenge list. "Newest" lists the live recordings the listening posts could
 * not recognize (real, from the backend) on top, and the challenges below them,
 * so it is never empty. The other categories list the challenges. What you click is exactly what opens, and "Next" in the workspace
 * follows the list on screen.
 * Cards and map pins are two views of the same list, so hovering one highlights the other.
 */
export interface WelcomeHooks {
  /** open this challenge; `list` is the list it came from, in the order shown */
  pick(c: Challenge, list: Challenge[]): void;
  /** live recordings waiting at the backend, or null when it cannot be reached */
  live(): Promise<Challenge[] | null>;
  /** delete these recordings from the server for good (null = every waiting recording) */
  remove(ids: string[] | null): Promise<void>;
  /** call back whenever the server gets a new recording or loses one */
  subscribe(changed: () => void): void;
  /** open the archive of sound stamps, and how many it holds */
  archive(): void;
  archiveCount(): Promise<number>;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const views = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export function mountWelcome(root: HTMLElement, hooks: WelcomeHooks) {
  let cat: Category = 'newest';
  let live: Challenge[] | null = null;
  let focus: string | null = null;
  /** ids already shown once, so a recording that just arrived can be highlighted */
  let known: Set<string> | null = null;

  root.innerHTML = `
    <div class="wl-inner">
      <section class="wl-hero">
        <div class="wl-brand">${brandLogo()}</div>
        <p class="eyebrow">Community sound labeling</p>
        <h1>Help the forest listen.</h1>
        <p class="lead">Listening posts in Finnish forests hear sounds they cannot name yet. You explore each sound as a 3D landscape, paint what you hear and give it a name. Every label teaches a post in the field.</p>
        <ol class="wl-steps">
          <li><span class="n">1</span><div><b>Listen</b><small>Play the recording and find the sound</small></div></li>
          <li><span class="n">2</span><div><b>Paint</b><small>Brush over it in the landscape</small></div></li>
          <li><span class="n">3</span><div><b>Label</b><small>Name it and send it to the post</small></div></li>
        </ol>
        <div class="wl-cta">
          <button class="btn primary big" id="wl-start">Start the first challenge</button>
          <button class="btn ghost big" id="wl-archive">Community archive</button>
          <p class="wl-status" id="wl-status"></p>
        </div>
      </section>
      <section class="wl-board glass" aria-labelledby="wl-h">
        <header class="wl-head">
          <h2 id="wl-h">Challenges</h2>
          <div class="seg cats" role="tablist" aria-label="Sort challenges">
            ${CATEGORIES.map((c) => `<button role="tab" data-cat="${c.id}" title="${c.help}" aria-selected="${c.id === cat}">${c.label}</button>`).join('')}
            <span class="seg-pill" aria-hidden="true"></span>
          </div>
        </header>
        <div class="wl-helprow"><p class="wl-help" id="wl-help"></p><button class="btn ghost tiny" id="wl-del-all" hidden title="Delete every waiting recording from the server">Delete all</button></div>
        <div class="wl-body">
          <ul class="wl-list" id="wl-list"></ul>
          <figure class="wl-map">
            <svg viewBox="-6 -6 ${MAP_W + 12} ${MAP_H + 12}" role="img" aria-label="Map of Finland with the recording places">
              <defs>
                <clipPath id="wl-clip"><rect x="-6" y="-6" width="${MAP_W + 12}" height="${MAP_H + 12}" rx="6" /></clipPath>
              </defs>
              <g clip-path="url(#wl-clip)">
                ${graticule()}
                <path class="m-nb" d="${NEIGHBOURS}" />
                <path class="m-fi" d="${FINLAND}" />
                <path class="m-lake" d="${LAKES}" />
                <g id="wl-pins"></g>
              </g>
              <g class="m-north" transform="translate(${MAP_W - 18} 22)"><path d="M0 -10 L5 4 L0 1 L-5 4 Z" /><text y="17" text-anchor="middle">N</text></g>
              <g class="m-scale" transform="translate(14 ${MAP_H - 14})"><line x1="0" x2="${(100 / 111) * 40}" /><text x="0" y="-5">100 km</text></g>
            </svg>
            <figcaption id="wl-cap"></figcaption>
          </figure>
        </div>
      </section>
    </div>`;

  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const list = q<HTMLUListElement>('#wl-list');
  const pinLayer = q<SVGGElement>('#wl-pins');
  const cap = q<HTMLElement>('#wl-cap');
  const help = q<HTMLElement>('#wl-help');
  const segPill = q<HTMLElement>('.seg-pill');
  const status = q<HTMLElement>('#wl-status');
  const startBtn = q<HTMLButtonElement>('#wl-start');
  /** one card element per challenge id, reused so cards can glide to new places */
  const cards = new Map<string, HTMLLIElement>();
  let shown: Challenge[] = [];

  // Newest: the live recordings from the listening posts on top, then the challenges.
  // The other categories: the challenges.
  const current = () => (cat === 'newest' ? [...(live ?? []), ...PRACTICE] : PRACTICE);
  const placeKey = (c: Challenge) => `${c.lat.toFixed(3)},${c.lon.toFixed(3)}`;

  const metric = (c: Challenge) => {
    if (cat === 'hottest') return c.labels ? `${Math.round(c.disagreement * 100)}% disagree` : 'No answers yet';
    if (cat === 'newest') return whenRecorded(c.recorded);
    return `${views(c.views)} view${c.views === 1 ? '' : 's'}`;
  };

  function cardHtml(c: Challenge) {
    const right =
      c.kind === 'practice'
        ? `<span class="ch-diff" title="Difficulty: ${DIFFICULTY[c.difficulty!]}"><span class="bars">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= c.difficulty! ? 'on' : ''}"></i>`).join('')}</span>${DIFFICULTY[c.difficulty!]}</span>`
        : `<span class="ch-diff">${Math.round(c.durationS)} s</span>`;
    return `<div class="ch-main">
        <b class="ch-title">${c.kind === 'live' ? '<span class="live-dot" title="Live recording"></span>' : ''}${esc(c.title)}</b>
        <span class="ch-place">${esc(c.place)}${c.region ? ` · ${esc(c.region)}` : ''}</span>
        ${c.guess ? `<span class="ch-guess">${esc(c.guess)}</span>` : ''}
      </div>
      <div class="ch-meta"><span class="ch-metric">${metric(c)}</span>${right}</div>
      ${c.kind === 'live' ? `<button class="ch-del" data-del="${c.id}" title="Delete this recording from the server" aria-label="Delete this recording"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg></button>` : ''}
      <svg class="ch-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>`;
  }

  function card(c: Challenge) {
    let li = cards.get(c.id);
    if (!li) {
      li = document.createElement('li');
      li.className = 'ch-card';
      li.tabIndex = 0;
      li.setAttribute('role', 'button');
      li.onclick = (e) => {
        const del = (e.target as Element).closest<HTMLElement>('[data-del]');
        if (del) return void removeLive([del.dataset.del!]);
        open(li!.dataset.id!);
      };
      li.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(li!.dataset.id!);
        }
      };
      li.onmouseenter = li.onfocus = () => setFocus(li!.dataset.id!);
      cards.set(c.id, li);
    }
    li.dataset.id = c.id;
    li.setAttribute('aria-label', `${c.title}, ${c.place}, ${whenRecorded(c.recorded)}`);
    li.innerHTML = cardHtml(c);
    return li;
  }

  /** Permanent: asks first, then deletes on the server and takes the cards away. */
  async function removeLive(ids: string[] | null) {
    const n = ids ? ids.length : live?.length ?? 0;
    if (!n) return;
    const what = ids ? 'this recording' : `all ${n} waiting recordings`;
    if (!confirm(`Delete ${what} from the server? This cannot be undone.`)) return;
    try {
      await hooks.remove(ids);
      const gone = new Set(ids ?? live!.map((c) => c.id));
      live = (live ?? []).filter((c) => !gone.has(c.id));
      for (const id of gone) {
        cards.get(id)?.remove();
        cards.delete(id);
      }
      updateStatus();
      render(true);
    } catch (e) {
      console.warn('delete failed', e);
      alert('The recording could not be deleted. Is the server running?');
    }
  }

  function open(id: string) {
    const c = shown.find((x) => x.id === id);
    if (c) hooks.pick(c, shown);
  }

  /** Pins: one per place, with the number of recordings there. */
  function renderPins() {
    pinLayer.innerHTML = '';
    const groups = new Map<string, Challenge[]>();
    for (const c of shown) groups.set(placeKey(c), [...(groups.get(placeKey(c)) ?? []), c]);
    for (const [key, items] of groups) {
      const c = items[0];
      const [x, y] = project(c.lat, c.lon);
      const pin = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      pin.setAttribute('class', 'm-pin');
      pin.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      pin.dataset.key = key;
      const name = esc(c.place.replace(' National Park', '')) + (items.length > 1 ? ` · ${items.length}` : '');
      pin.innerHTML = `<circle class="halo" r="11" /><circle class="dot" r="${items.length > 1 ? 6 : 4.5}" />${items.length > 1 ? `<text class="count" text-anchor="middle" y="3">${items.length}</text>` : ''}<text class="name" ${x > MAP_W * 0.6 ? 'x="-10" text-anchor="end"' : 'x="10"'} y="4">${name}</text>`;
      pin.addEventListener('mouseenter', () => setFocus(items[0].id));
      pin.addEventListener('click', () => open(items[0].id));
      pinLayer.appendChild(pin);
    }
  }

  function setFocus(id: string | null) {
    focus = id;
    const c = shown.find((x) => x.id === id) ?? shown[0];
    for (const [cid, li] of cards) li.classList.toggle('focus', cid === c?.id);
    pinLayer.querySelectorAll<SVGGElement>('.m-pin').forEach((p) => {
      const on = !!c && p.dataset.key === placeKey(c);
      p.classList.toggle('focus', on);
      if (on) pinLayer.appendChild(p); // keep the focused pin on top
    });
    cap.innerHTML = c
      ? `<b>${esc(c.place)}</b>${c.region ? `<span>${esc(c.region)}</span>` : ''}<span class="mono">${coords(c)}</span><span>${partOfDay(c.recorded)} · ${whenRecorded(c.recorded)}</span>`
      : '';
  }

  /** Reorder with a FLIP animation: cards glide to their new places. */
  function render(animate: boolean) {
    const before = new Map([...cards.values()].map((li) => [li, li.isConnected ? li.getBoundingClientRect().top : NaN]));
    shown = sortChallenges(current(), cat);
    const keep = new Set(shown.map((c) => c.id));
    for (const [id, li] of cards) if (!keep.has(id)) li.remove();
    shown.forEach((c, i) => {
      const li = card(c);
      li.style.setProperty('--i', String(i));
      list.appendChild(li);
    });
    list.querySelector('.ch-empty')?.remove();
    if (animate)
      for (const c of shown) {
        const li = cards.get(c.id)!;
        const y0 = before.get(li);
        if (y0 === undefined || Number.isNaN(y0)) continue;
        const dy = y0 - li.getBoundingClientRect().top;
        if (dy) li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    root.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((b) => {
      const on = b.dataset.cat === cat;
      b.setAttribute('aria-selected', String(on));
      if (on) {
        segPill.style.width = `${b.offsetWidth}px`;
        segPill.style.transform = `translateX(${b.offsetLeft - 3}px)`;
      }
    });
    help.textContent =
      cat === 'newest'
        ? live === null
          ? 'The listening posts cannot be reached right now. The most recent challenges.'
          : live.length
            ? 'Live recordings from the listening posts first, then the most recent challenges.'
            : 'No live recordings are waiting right now. The most recent challenges.'
        : CATEGORIES.find((x) => x.id === cat)!.help + '.';
    q<HTMLButtonElement>('#wl-del-all').hidden = !(cat === 'newest' && live && live.length);
    startBtn.disabled = !shown.length;
    startBtn.textContent = shown.length ? `Start: ${shown[0].title}` : 'Nothing to start';
    renderPins();
    setFocus(shown.some((c) => c.id === focus) ? focus : shown[0]?.id ?? null);
  }

  root.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((b) => {
    b.onclick = () => {
      cat = b.dataset.cat as Category;
      focus = null;
      render(true);
    };
  });
  startBtn.onclick = () => shown[0] && hooks.pick(shown[0], shown);

  function updateStatus() {
    const n = live?.length ?? 0;
    status.innerHTML =
      live === null
        ? 'The listening posts cannot be reached right now.'
        : `<span class="live-dot"></span>${n} live recording${n === 1 ? '' : 's'} need${n === 1 ? 's' : ''} your ears`;
  }

  async function refreshLive() {
    live = await hooks.live().catch(() => null);
    const fresh = known && live ? live.filter((c) => !known!.has(c.id)).map((c) => c.id) : [];
    if (live) known = new Set(live.map((c) => c.id));
    updateStatus();
    render(true);
    // a recording that just arrived glows briefly
    for (const id of fresh) {
      const li = cards.get(id);
      if (!li) continue;
      li.classList.remove('fresh');
      void li.offsetWidth;
      li.classList.add('fresh');
    }
  }
  // the list follows the server live: new recordings appear without reloading
  let refreshTimer = 0;
  hooks.subscribe(() => {
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => void refreshLive(), 300);
  });
  q<HTMLButtonElement>('#wl-del-all').onclick = () => void removeLive(null);

  const archiveBtn = q<HTMLButtonElement>('#wl-archive');
  archiveBtn.onclick = () => hooks.archive();
  const updateArchive = async () => {
    const n = await hooks.archiveCount();
    archiveBtn.textContent = n ? `Community archive · ${n} stamp${n === 1 ? '' : 's'}` : 'Community archive';
  };
  window.addEventListener('archive-changed', updateArchive);

  function show() {
    void updateArchive();
    root.hidden = false;
    document.body.classList.add('welcoming');
    render(false);
    requestAnimationFrame(() => {
      root.classList.add('open');
      render(false); // the category pill needs the final layout
    });
    void refreshLive();
  }
  function hide() {
    root.classList.remove('open');
    document.body.classList.remove('welcoming');
    setTimeout(() => {
      if (!root.classList.contains('open')) root.hidden = true;
    }, 450);
  }
  window.addEventListener('resize', () => !root.hidden && render(false));
  return { show, hide, get visible() { return !root.hidden && root.classList.contains('open'); } };
}

function graticule() {
  let g = '';
  for (let lat = 60; lat <= 70; lat += 2) {
    const [, y] = project(lat, 25);
    g += `<line class="m-grid" x1="-6" x2="${MAP_W + 6}" y1="${y}" y2="${y}" /><text class="m-gl" x="2" y="${y - 3}">${lat}°</text>`;
  }
  for (let lon = 20; lon <= 32; lon += 4) {
    const [x] = project(65, lon);
    g += `<line class="m-grid" y1="-6" y2="${MAP_H + 6}" x1="${x}" x2="${x}" />`;
  }
  return g;
}
