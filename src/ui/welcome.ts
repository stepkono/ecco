import { CATEGORIES, DIFFICULTY, coords, partOfDay, sortChallenges, whenRecorded, type Category, type Challenge } from '../game/challenges';
import { FINLAND, LAKES, MAP_H, MAP_W, NEIGHBOURS, project } from './finland-map';

/**
 * Welcome screen: the mission, a three-step mental model of the task, and the
 * challenge picker. Cards and map pins are two views of the same list, so
 * hovering one highlights the other.
 */
export interface WelcomeHooks {
  pick(c: Challenge): void;
  /** start labeling live recordings from the listening posts */
  live(): void;
  /** number of live recordings waiting, or null when the posts are offline */
  liveCount(): Promise<number | null>;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const views = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export function mountWelcome(root: HTMLElement, hooks: WelcomeHooks) {
  let cat: Category = 'newest';
  let focus: string | null = null;

  root.innerHTML = `
    <div class="wl-inner">
      <section class="wl-hero">
        <div class="wl-brand">${brandMark()}<span>ecco</span></div>
        <p class="eyebrow">Community sound labeling</p>
        <h1>Help the forest listen.</h1>
        <p class="lead">Listening posts in Finnish forests hear sounds they cannot name yet. You explore each sound as a 3D landscape, paint what you hear and give it a name. Every label teaches a post in the field.</p>
        <ol class="wl-steps">
          <li><span class="n">1</span><div><b>Listen</b><small>Play the recording and find the sound</small></div></li>
          <li><span class="n">2</span><div><b>Paint</b><small>Brush over it in the landscape</small></div></li>
          <li><span class="n">3</span><div><b>Label</b><small>Name it and send it to the post</small></div></li>
        </ol>
        <div class="wl-cta">
          <button class="btn primary big" id="wl-start">Start the newest challenge</button>
          <button class="btn ghost big" id="wl-live" hidden></button>
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
        <p class="wl-help" id="wl-help"></p>
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
              <g class="m-scale" transform="translate(14 ${MAP_H - 14})"><line x1="0" x2="${100 / 111 * 40}" /><text x="0" y="-5">100 km</text></g>
            </svg>
            <figcaption id="wl-cap"></figcaption>
          </figure>
        </div>
      </section>
    </div>`;

  const list = root.querySelector<HTMLUListElement>('#wl-list')!;
  const pins = root.querySelector<SVGGElement>('#wl-pins')!;
  const cap = root.querySelector<HTMLElement>('#wl-cap')!;
  const help = root.querySelector<HTMLElement>('#wl-help')!;
  const segPill = root.querySelector<HTMLElement>('.seg-pill')!;

  const metric = (c: Challenge) =>
    cat === 'hottest' ? `${Math.round(c.disagreement * 100)}% disagree` : cat === 'newest' ? whenRecorded(c.recorded) : `${views(c.views)} views`;

  // one card and one pin per challenge, created once and reordered on category changes
  const items = sortChallenges(cat).map((c) => {
    const li = document.createElement('li');
    li.className = 'ch-card';
    li.dataset.id = c.level.id;
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `${c.level.title}, ${c.place}`);
    const [x, y] = project(c.lat, c.lon);
    const pin = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pin.setAttribute('class', 'm-pin');
    pin.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    pin.dataset.id = c.level.id;
    pin.innerHTML = `<circle class="halo" r="11" /><circle class="dot" r="4.5" /><text ${x > MAP_W * 0.6 ? 'x="-9" text-anchor="end"' : 'x="9"'} y="4">${esc(c.place.replace(' National Park', ''))}</text>`;
    pins.appendChild(pin);
    return { c, li, pin };
  });

  function card(c: Challenge) {
    const d = c.level.difficulty;
    const bars = [1, 2, 3, 4, 5].map((i) => `<i class="${i <= d ? 'on' : ''}"></i>`).join('');
    return `<div class="ch-main">
        <b class="ch-title">${esc(c.level.title)}</b>
        <span class="ch-place">${esc(c.place)} · ${esc(c.region)}</span>
      </div>
      <div class="ch-meta">
        <span class="ch-metric">${metric(c)}</span>
        <span class="ch-diff" title="Difficulty: ${DIFFICULTY[d]}"><span class="bars">${bars}</span>${DIFFICULTY[d]}</span>
      </div>
      <svg class="ch-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>`;
  }

  function setFocus(id: string | null) {
    focus = id;
    for (const it of items) {
      const on = it.c.level.id === id;
      it.li.classList.toggle('focus', on);
      it.pin.classList.toggle('focus', on);
    }
    const c = items.find((it) => it.c.level.id === id)?.c ?? sortChallenges(cat)[0];
    cap.innerHTML = `<b>${esc(c.place)}</b><span>${esc(c.region)}</span><span class="mono">${coords(c)}</span><span>${partOfDay(c.recorded)} · ${whenRecorded(c.recorded)}</span>`;
    // keep the focused pin on top
    const pin = items.find((it) => it.c.level.id === id)?.pin;
    if (pin) pins.appendChild(pin);
  }

  /** Reorder with a FLIP animation: cards glide to their new places. */
  function render(animate: boolean) {
    const before = new Map(items.map((it) => [it.li, it.li.getBoundingClientRect().top]));
    const order = sortChallenges(cat);
    order.forEach((c, i) => {
      const it = items.find((x) => x.c === c)!;
      it.li.innerHTML = card(c);
      it.li.style.setProperty('--i', String(i));
      list.appendChild(it.li);
    });
    if (animate)
      for (const it of items) {
        const dy = before.get(it.li)! - it.li.getBoundingClientRect().top;
        if (!dy) continue;
        it.li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    root.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((b) => {
      const on = b.dataset.cat === cat;
      b.setAttribute('aria-selected', String(on));
      if (on) {
        segPill.style.width = `${b.offsetWidth}px`;
        segPill.style.transform = `translateX(${b.offsetLeft - 3}px)`;
      }
    });
    help.textContent = CATEGORIES.find((x) => x.id === cat)!.help + '.';
    setFocus(focus ?? order[0].level.id);
  }

  for (const it of items) {
    const start = () => hooks.pick(it.c);
    it.li.onclick = start;
    it.li.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        start();
      }
    };
    it.li.onmouseenter = it.li.onfocus = () => setFocus(it.c.level.id);
    it.pin.addEventListener('mouseenter', () => setFocus(it.c.level.id));
    it.pin.addEventListener('click', start);
  }
  root.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((b) => {
    b.onclick = () => {
      cat = b.dataset.cat as Category;
      focus = null;
      render(true);
    };
  });
  root.querySelector<HTMLButtonElement>('#wl-start')!.onclick = () => hooks.pick(sortChallenges('newest')[0]);
  const liveBtn = root.querySelector<HTMLButtonElement>('#wl-live')!;
  liveBtn.onclick = () => hooks.live();

  async function refreshLive() {
    const n = await hooks.liveCount().catch(() => null);
    liveBtn.hidden = !n;
    if (n) liveBtn.innerHTML = `<span class="live-dot"></span>${n} live recording${n === 1 ? '' : 's'} need${n === 1 ? 's' : ''} help`;
  }

  function show() {
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

/** Temporary mark until the logo is chosen: two echoing arcs around a dot. */
export function brandMark() {
  return `<svg class="brand-mark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="2.4" /><path d="M12 7a6 6 0 0 1 0 10" /><path d="M15.5 4a10 10 0 0 1 0 16" /></svg>`;
}
