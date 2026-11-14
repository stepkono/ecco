import { CLASSES, ECOSYSTEM, SOURCES } from '../game/catalog';
import { state } from '../state';

const ROLE_COLOR = { native: '#9be15d', invasive: '#ffb020', threat: '#ff5a5a', rare: '#56c8ff' };

export const ecoCount = () => `${ECOSYSTEM.filter((e) => state.unlocked.has(e.src)).length}/${ECOSYSTEM.length}`;

function wave(color: string, seed: number) {
  let d = 'M0 40';
  for (let x = 0; x <= 160; x += 8) d += ` L${x} ${40 - Math.abs(Math.sin(x * 0.11 + seed) * 18 * Math.sin(x * 0.02 + seed * 2))}`;
  return `<svg class="wave" width="160" height="50" viewBox="0 0 160 50"><path d="${d}" fill="none" stroke="${color}" stroke-width="2"/></svg>`;
}

export function openEco() {
  const box = document.getElementById('eco')!;
  const cards = ECOSYSTEM.map((e, i) => {
    const info = SOURCES[e.src];
    const open = state.unlocked.has(e.src);
    const color = ROLE_COLOR[e.role];
    const name = info.cls === 'chainsaw' ? 'Illegal logging' : info.common;
    return `<div class="species ${open ? '' : 'locked'}">
      <span class="role" style="color:${color}">${e.role}</span>
      <h4>${open ? name : '???'}</h4>
      <i>${open ? info.species ?? CLASSES[info.cls].label : 'Untangle its call to reveal it'}</i>
      ${open ? `<div class="credit">Recording: ${info.credit} · ${info.license}${info.url ? ` · <a href="${info.url}" target="_blank" rel="noopener">source</a>` : ''}</div>` : ''}
      ${wave(color, i * 1.7 + 1)}
    </div>`;
  }).join('');
  box.innerHTML = `<div class="sheet">
    <button class="btn ghost close" id="eco-close">Close ✕</button>
    <h2>Your ecosystem</h2>
    <p class="lead">Each species you isolate cleanly (one star or more) appears here. Threats count too: a chainsaw separated from a frog chorus is an illegal-logging alert the sensor can learn to raise on its own.</p>
    <div class="eco-grid">${cards}</div>
  </div>`;
  box.hidden = false;
  document.getElementById('eco-close')!.onclick = () => (box.hidden = true);
  box.onclick = (ev) => {
    if (ev.target === box) box.hidden = true;
  };
}
