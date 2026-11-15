import { VIZ, VIZ_MODES, type SpectroView, type VizMode } from '../view/scene';
import { THEMES } from '../view/themes';

/**
 * View lab: mode menu, theme picker, amplitude and resolution sliders,
 * the isometric camera switch and a few per-mode look parameters.
 * The landscape stays a square tile. Fog, roundness and spacing keep their
 * tuned defaults (see VIZ in scene.ts).
 */
export function mountVizPanel(view: SpectroView, host: HTMLElement) {
  const box = document.createElement('div');
  box.className = 'viz-panel';
  host.appendChild(box);
  let open = true;

  const slider = (id: string, label: string, min: number, max: number, step: number, v: number, title: string) =>
    `<label title="${title}"><span class="lbl">${label}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"><span class="val" id="${id}-v">${v}</span></label>`;
  const check = (id: string, label: string, v: boolean, title: string) =>
    `<label class="chk" title="${title}"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}> ${label}</label>`;
  const seg = (attr: string, value: string, options: [string, string, string][]) =>
    `<div class="seg small">${options.map(([v, label, title]) => `<button data-${attr}="${v}" class="${v === value ? 'on' : ''}" title="${title}">${label}</button>`).join('')}</div>`;

  function extras(m: VizMode) {
    let html = '';
    if (m === 'drops')
      html +=
        slider('vd-fade', 'Line foot', 0, 0.6, 0.02, VIZ.drops.fade, 'Brightness at the bottom of each line') +
        check('vd-points', 'Dots on top', VIZ.drops.points, 'A dot at the top of each line') +
        check('vd-glow', 'Glow', VIZ.drops.glow, 'Additive light. Bright, but hides detail where lines overlap') +
        `<div class="seg small"><button id="vd-morph-vox" title="Sweep the drop lines into voxels, like the model being built">Build into voxels</button></div>`;
    if (m === 'spiral')
      html +=
        seg('sl', VIZ.spiral.layout, [
          ['wrap', 'Wrap', 'Frequency goes around the time axis, loudness pushes points outward'],
          ['ribbon', 'Ribbon', 'A twisted ribbon'],
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
    return html;
  }

  function render() {
    const m = view.mode;
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
        ${slider('va-a', 'Amplitude', 0.1, 4, 0.05, view.axis.a, 'Height of the landscape')}
        ${slider('va-res', 'Resolution', 0.1, 1, 0.05, VIZ.res[m], 'How much of the data is drawn. Lower = fewer, bigger cells. Picks still hit the exact frame and bin')}
        ${check('v-iso', 'Isometric camera', view.iso, 'A very narrow lens from far away, close to an isometric drawing')}
      </div>
      ${extras(m) ? `<div class="viz-group">${extras(m)}</div>` : ''}`
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
    segBind('sl', (v) => {
      VIZ.spiral.layout = v as 'wrap' | 'ribbon';
      VIZ.spiral.offset = v === 'wrap' ? 1.4 : 1.2;
      VIZ.spiral.turns = v === 'wrap' ? 0.6 : 1.25;
    });
    segBind('ss', (v) => (VIZ.spiral.style = v as 'dots' | 'rays' | 'surface'));
    q<HTMLSelectElement>('v-theme')!.onchange = (e) => {
      view.setTheme((e.target as HTMLSelectElement).value);
      render();
    };
    const amp = q<HTMLInputElement>('va-a')!;
    amp.oninput = () => {
      view.setAxis(view.axis.t, view.axis.f, parseFloat(amp.value));
      q('va-a-v')!.textContent = amp.value;
    };
    // sliders: [input id, object, key, needs a rebuild]
    const params: [string, Record<string, unknown>, string, boolean][] = [
      ['va-res', VIZ.res, view.mode, true],
      ['vd-fade', VIZ.drops, 'fade', true],
      ['vd-points', VIZ.drops, 'points', true],
      ['vd-glow', VIZ.drops, 'glow', true],
      ['vs-turns', VIZ.spiral, 'turns', true],
      ['vs-offset', VIZ.spiral, 'offset', true],
      ['vs-radius', VIZ.spiral, 'radius', true],
      ['vy-fade', VIZ.symmetry, 'fade', false],
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
    const mv = q('vd-morph-vox');
    if (mv)
      mv.onclick = () => {
        view.morphTo('voxel');
        render();
      };
    const iso = q<HTMLInputElement>('v-iso');
    if (iso) iso.onchange = () => view.setIso(iso.checked);
  }

  view.onThemeChange = () => render();

  // number keys 1-9 select layers, so modes use Alt+1..4
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
