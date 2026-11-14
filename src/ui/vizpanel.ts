import { VIZ, VIZ_MODES, WORLD_D, WORLD_W, type SpectroView, type VizMode } from '../view/scene';
import { THEMES } from '../view/themes';
import { DISC } from '../view/disc';

/**
 * Visualization playground: mode menu, theme picker, axis spacing and
 * resolution sliders, atmosphere and per-mode look parameters. Everything
 * writes into VIZ / view.axis, so a new knob is one line in `extras()`.
 */
export function mountVizPanel(view: SpectroView, host: HTMLElement) {
  const box = document.createElement('div');
  box.className = 'viz-panel';
  host.appendChild(box);
  const cross = document.createElement('div');
  cross.className = 'walk-cross';
  cross.hidden = true;
  host.appendChild(cross);
  let open = true;

  const slider = (id: string, label: string, min: number, max: number, step: number, v: number, title: string) =>
    `<label title="${title}"><span class="lbl">${label}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"><span class="val" id="${id}-v">${v}</span></label>`;
  const check = (id: string, label: string, v: boolean, title: string) =>
    `<label class="chk" title="${title}"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}> ${label}</label>`;
  const seg = (attr: string, value: string, options: [string, string, string][]) =>
    `<div class="seg small">${options.map(([v, label, title]) => `<button data-${attr}="${v}" class="${v === value ? 'on' : ''}" title="${title}">${label}</button>`).join('')}</div>`;

  function extras(m: VizMode) {
    let html = '';
    if (m === 'surface' || m === 'rounded' || m === 'symmetry')
      html += seg('mat', VIZ.material, [
        ['matte', 'Matte', 'Soft clay-like surface'],
        ['water', 'Water', 'Moving waves with caustic light (experiment)'],
      ]);
    if (m === 'rounded')
      html +=
        slider('vr-soft', 'Softness', 0, 4, 1, VIZ.rounded.softness, 'How much the hills are smoothed before the curves. 0 = closest to the data') +
        slider('vr-base', 'Base', 0, 1.2, 0.05, VIZ.rounded.base, 'Thickness of the solid below the zero level');
    if (m === 'voxel')
      html +=
        slider('vz-round', 'Roundness', 0, 1, 0.05, VIZ.voxel.round, 'How round the column tops are. 0 = flat boxes') +
        slider('vz-gap', 'Spacing', 0, 0.5, 0.02, VIZ.voxel.gap, 'Empty space between columns. 0 = columns touch and form one volume') +
        slider('vz-step', 'Terraces', 0, 0.4, 0.02, VIZ.voxel.step, 'Rounds heights to steps of this size. 0 = exact heights');
    if (m === 'skyline')
      html +=
        slider('vk-depth', 'Hang depth', 0, 2, 0.05, VIZ.skyline.depth, 'How far the blocks hang below the zero level before they dissolve in the fog') +
        slider('vk-merge', 'Merge', 0, 0.6, 0.02, VIZ.skyline.merge, 'Neighbours closer than this in height merge into one bigger block') +
        slider('vk-gap', 'Spacing', 0, 0.5, 0.02, VIZ.skyline.gap, 'Empty space between blocks');
    if (m === 'disc')
      html +=
        seg('ds', DISC.style, [
          ['rings', 'Rings', 'Concentric contour rings, one per time step'],
          ['sheets', 'Sheets', 'Thin layered walls, like sliced terrain'],
          ['dots', 'Dots', 'A polar grid of points'],
          ['ridges', 'Ridges', 'Parallel lines, one per time step, inside a disc'],
        ]) +
        slider('vc-bowl', 'Bowl', 0, 1, 0.05, DISC.bowl, 'Lifts the rim, so the disc becomes a bowl');
    if (m === 'drops')
      html +=
        slider('vd-fade', 'Line foot', 0, 0.6, 0.02, VIZ.drops.fade, 'Brightness at the bottom of each line') +
        check('vd-points', 'Dots on top', VIZ.drops.points, 'A dot at the top of each line') +
        check('vd-glow', 'Glow', VIZ.drops.glow, 'Additive light. Bright, but hides detail where lines overlap') +
        `<div class="seg small"><button id="vd-morph-vox" title="Sweep the drop lines into voxels, like the model being built">Build into voxels</button><button id="vd-morph-rnd" title="Sweep the drop lines into the rounded solid">Build into solid</button></div>`;
    if (m === 'spiral')
      html +=
        seg('sl', VIZ.spiral.layout, [
          ['wrap', 'Wrap', 'Frequency goes around the time axis, loudness pushes points outward'],
          ['ribbon', 'Ribbon', 'A twisted ribbon (round 1 layout)'],
        ]) +
        seg('ss', VIZ.spiral.style, [
          ['rays', 'Rays', 'A line from the time axis to every point'],
          ['surface', 'Surface', 'A surface through all points'],
          ['dots', 'Dots', 'Points only'],
        ]) +
        slider('vs-turns', 'Turns', 0, 3, 0.05, VIZ.spiral.turns, 'Full rotations over the clip') +
        slider('vs-offset', 'Inner radius', 0, 4, 0.05, VIZ.spiral.offset, 'Distance between the time axis and the quietest points') +
        (VIZ.spiral.style === 'dots' ? slider('vs-radius', 'Dot size', 0.015, 0.12, 0.005, VIZ.spiral.radius, 'Radius of every dot') : '');
    if (m === 'symmetry')
      html +=
        slider('vy-fade', 'Fade depth', 0.2, 2, 0.05, VIZ.symmetry.fade, 'How deep the reflection reaches before it is gone') +
        check('vy-lines', 'Break into lines', VIZ.symmetry.lines, 'Thin lines take over where the reflection fades');
    if (VIZ_MODES.find((x) => x.id === m)!.walk)
      html += `<button class="btn ghost tiny" id="v-walk" title="First person: WASD to walk, mouse to look, hold click to paint, Esc to leave">${view.walker.active ? 'Leave walk mode' : 'Walk inside (experiment)'}</button>`;
    return html;
  }

  function render() {
    const m = view.mode;
    const note = VIZ_MODES.find((x) => x.id === m)!.note;
    box.innerHTML = `
      <div class="viz-head"><b>View lab</b><button class="btn ghost tiny" id="viz-toggle" title="${open ? 'Collapse' : 'Expand'}">${open ? '–' : '+'}</button></div>
      ${
        open
          ? `<div class="seg">${VIZ_MODES.map((x, i) => `<button data-mode="${x.id}" class="${x.id === m ? 'on' : ''}" title="${x.label} (Alt+${i + 1})">${i + 1} ${x.label}</button>`).join('')}</div>
      <label class="theme-row" title="Colour theme. Auto gives every level its own"><span class="lbl">Theme</span><select id="v-theme">
        <option value="auto" ${view.themeChoice === 'auto' ? 'selected' : ''}>Auto (${view.theme.name})</option>
        ${THEMES.map((t) => `<option value="${t.id}" ${view.themeChoice === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
      </select></label>
      <div class="viz-group">
        ${slider('va-t', 'Time', 0.25, 3, 0.05, view.axis.t, 'Spacing between points along the time axis')}
        ${slider('va-f', 'Frequency', 0.25, 3, 0.05, view.axis.f, 'Spacing between points along the frequency axis')}
        ${slider('va-a', 'Amplitude', 0.1, 4, 0.05, view.axis.a, 'Spacing between points along the amplitude axis')}
        ${slider('va-res', 'Resolution', 0.1, 1, 0.05, VIZ.res[m], 'How much of the data is drawn. Lower = fewer, bigger cells. Picks still hit the exact frame and bin')}
        <div class="row-btns">
          <button class="btn ghost tiny" id="va-reset" title="Back to the default square tile">Reset axes</button>
          <button class="btn ghost tiny" id="va-square" title="Give time and frequency the same length, so the field is a square tile">Square tile</button>
        </div>
        ${check('v-iso', 'Isometric camera', view.iso, 'A very narrow lens from far away, close to an isometric drawing')}
      </div>
      <div class="viz-group">
        ${slider('vf-fog', 'Fog', 0, 1, 0.05, VIZ.atmosphere.fog, 'Density of the coloured ground fog. 0 = off')}
        ${slider('vf-h', 'Fog height', 0.05, 1, 0.05, VIZ.atmosphere.height, 'How high the fog reaches, as a share of the amplitude axis')}
      </div>
      ${extras(m) ? `<div class="viz-group">${extras(m)}</div>` : ''}
      <p class="viz-note">${note}</p>`
          : ''
      }`;
    bind();
  }

  function bind() {
    const q = <T extends HTMLElement>(id: string) => box.querySelector<T>('#' + id);
    q('viz-toggle')!.onclick = () => {
      open = !open;
      render();
    };
    if (!open) return;
    box.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => {
      b.onclick = () => {
        view.setMode(b.dataset.mode as VizMode);
        render();
      };
    });
    const segBind = (attr: string, apply: (v: string) => void) =>
      box.querySelectorAll<HTMLButtonElement>(`[data-${attr}]`).forEach((b) => {
        b.onclick = () => {
          apply(b.dataset[attr]!);
          view.rebuildViz();
          render();
        };
      });
    segBind('mat', (v) => (VIZ.material = v as 'matte' | 'water'));
    segBind('sl', (v) => {
      VIZ.spiral.layout = v as 'wrap' | 'ribbon';
      VIZ.spiral.offset = v === 'wrap' ? 1.4 : 1.2;
      VIZ.spiral.turns = v === 'wrap' ? 0.6 : 1.25;
    });
    segBind('ss', (v) => (VIZ.spiral.style = v as 'dots' | 'rays' | 'surface'));
    segBind('ds', (v) => (DISC.style = v as typeof DISC.style));
    q<HTMLSelectElement>('v-theme')!.onchange = (e) => {
      view.setTheme((e.target as HTMLSelectElement).value);
      render();
    };
    const axis = () => {
      const v = (id: string) => parseFloat(q<HTMLInputElement>(id)!.value);
      view.setAxis(v('va-t'), v('va-f'), v('va-a'));
      for (const id of ['va-t', 'va-f', 'va-a']) q(id + '-v')!.textContent = q<HTMLInputElement>(id)!.value;
    };
    for (const id of ['va-t', 'va-f', 'va-a']) q<HTMLInputElement>(id)!.oninput = axis;
    q('va-reset')!.onclick = () => {
      view.setAxis(1, WORLD_W / WORLD_D, 1);
      view.resetCamera('perspective');
      render();
    };
    q('va-square')!.onclick = () => {
      view.setAxis(view.axis.t, +((WORLD_W * view.axis.t) / WORLD_D).toFixed(2), view.axis.a);
      view.resetCamera('perspective');
      render();
    };
    // sliders: [input id, object, key, needs a rebuild]
    const params: [string, Record<string, unknown>, string, boolean][] = [
      ['va-res', VIZ.res, view.mode, true],
      ['vf-fog', VIZ.atmosphere, 'fog', false],
      ['vf-h', VIZ.atmosphere, 'height', false],
      ['vr-soft', VIZ.rounded, 'softness', true],
      ['vr-base', VIZ.rounded, 'base', true],
      ['vz-round', VIZ.voxel, 'round', true],
      ['vz-gap', VIZ.voxel, 'gap', true],
      ['vz-step', VIZ.voxel, 'step', true],
      ['vd-fade', VIZ.drops, 'fade', true],
      ['vd-points', VIZ.drops, 'points', true],
      ['vd-glow', VIZ.drops, 'glow', true],
      ['vs-turns', VIZ.spiral, 'turns', true],
      ['vs-offset', VIZ.spiral, 'offset', true],
      ['vs-radius', VIZ.spiral, 'radius', true],
      ['vy-fade', VIZ.symmetry, 'fade', false],
      ['vk-depth', VIZ.skyline, 'depth', true],
      ['vk-merge', VIZ.skyline, 'merge', true],
      ['vk-gap', VIZ.skyline, 'gap', true],
      ['vc-bowl', DISC as unknown as Record<string, unknown>, 'bowl', true],
      ['vy-lines', VIZ.symmetry, 'lines', true],
    ];
    for (const [id, obj, key, rebuild] of params) {
      const inp = q<HTMLInputElement>(id);
      if (!inp) continue;
      inp.oninput = () => {
        obj[key] = inp.type === 'checkbox' ? inp.checked : parseFloat(inp.value);
        const v = q(id + '-v');
        if (v) v.textContent = inp.value;
        if (rebuild) view.rebuildViz();
        else view.setAxis(view.axis.t, view.axis.f, view.axis.a);
      };
    }
    const morph = (to: 'voxel' | 'rounded') => {
      view.morphTo(to);
      render();
    };
    const mv = q('vd-morph-vox');
    if (mv) mv.onclick = () => morph('voxel');
    const mr = q('vd-morph-rnd');
    if (mr) mr.onclick = () => morph('rounded');
    const iso = q<HTMLInputElement>('v-iso');
    if (iso) iso.onchange = () => view.setIso(iso.checked);
    const walk = q('v-walk');
    if (walk) walk.onclick = () => (view.walker.active ? view.walker.exit() : view.walker.enter());
  }

  view.onThemeChange = () => render();
  view.walker.onChange = (active) => {
    cross.hidden = !active;
    host.classList.toggle('walking', active);
    render();
  };

  // number keys 1-9 select layers in the game, so modes use Alt+1..8
  window.addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    const i = parseInt(e.code.replace('Digit', ''), 10) - 1;
    if (i >= 0 && i < VIZ_MODES.length) {
      e.preventDefault();
      view.setMode(VIZ_MODES[i].id);
      render();
    }
  });

  render();
  return { render };
}
