import { VIZ, VIZ_MODES, type SpectroView, type VizMode } from '../view/scene';

/**
 * Visualization playground: mode menu, three axis-spacing sliders and a few
 * per-mode look parameters. Everything writes into VIZ / view.axis, so new
 * knobs are one line each in `extras()`.
 */
export function mountVizPanel(view: SpectroView, host: HTMLElement) {
  const box = document.createElement('div');
  box.className = 'viz-panel';
  host.appendChild(box);
  let open = true;

  const slider = (id: string, label: string, min: number, max: number, step: number, v: number, title = '') =>
    `<label title="${title}"><span class="lbl">${label}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"><span class="val" id="${id}-v">${v}</span></label>`;
  const check = (id: string, label: string, v: boolean) => `<label class="chk"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}> ${label}</label>`;

  function extras(m: VizMode) {
    if (m === 'voxel')
      return (
        slider('vz-cell', 'Cell', 0.08, 0.4, 0.01, VIZ.voxel.cell, 'Voxel cell size in world units') +
        slider('vz-step', 'Step', 0, 0.4, 0.02, VIZ.voxel.step, 'Height quantisation. 0 = smooth columns') +
        slider('vz-gap', 'Gap', 0, 0.6, 0.02, VIZ.voxel.gap) +
        check('vz-stack', 'Stacked cubes', VIZ.voxel.stack)
      );
    if (m === 'drops')
      return (
        slider('vd-stride', 'Density', 1, 6, 1, VIZ.drops.stride, 'Take every n-th frame and bin') +
        slider('vd-fade', 'Base', 0, 0.6, 0.02, VIZ.drops.fade, 'Brightness at the foot of each line') +
        check('vd-points', 'Dots on top', VIZ.drops.points) +
        check('vd-glow', 'Glow', VIZ.drops.glow)
      );
    if (m === 'spiral')
      return (
        slider('vs-turns', 'Turns', 0, 4, 0.05, VIZ.spiral.turns) +
        slider('vs-offset', 'Offset', 0, 4, 0.05, VIZ.spiral.offset, 'Distance of the ribbon from the time axis') +
        slider('vs-radius', 'Dot size', 0.015, 0.12, 0.005, VIZ.spiral.radius) +
        slider('vs-tstride', 'Frames', 1, 6, 1, VIZ.spiral.tStride, 'Take every n-th frame') +
        slider('vs-kstride', 'Bins', 1, 8, 1, VIZ.spiral.kStride, 'Take every n-th bin')
      );
    if (m === 'symmetry')
      return `<div class="seg small">
        <button data-sym="amp" class="${VIZ.symmetry.variant === 'amp' ? 'on' : ''}" title="Mirror image below the zero-amplitude plane, over the full time axis">Below zero</button>
        <button data-sym="time" class="${VIZ.symmetry.variant === 'time' ? 'on' : ''}" title="Clip and its reflection side by side, mirrored at the time midpoint">Time mirror</button>
      </div>`;
    return '';
  }

  function render() {
    const m = view.mode;
    const note = VIZ_MODES.find((x) => x.id === m)!.note;
    box.innerHTML = `
      <div class="viz-head"><b>View lab</b><button class="btn ghost tiny" id="viz-toggle">${open ? '–' : '+'}</button></div>
      ${
        open
          ? `<div class="seg">${VIZ_MODES.map((x, i) => `<button data-mode="${x.id}" class="${x.id === m ? 'on' : ''}" title="${x.label}">${i + 1} ${x.label}</button>`).join('')}</div>
      <div class="viz-group">
        ${slider('va-t', 'Time', 0.25, 3, 0.05, view.axis.t, 'Spacing between points along the time axis')}
        ${slider('va-f', 'Frequency', 0.25, 3, 0.05, view.axis.f, 'Spacing between points along the frequency axis')}
        ${slider('va-a', 'Amplitude', 0.1, 4, 0.05, view.axis.a, 'Spacing between points along the amplitude axis')}
        <button class="btn ghost tiny" id="va-reset">Reset axes</button>
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
    box.querySelectorAll<HTMLButtonElement>('[data-sym]').forEach((b) => {
      b.onclick = () => {
        VIZ.symmetry.variant = b.dataset.sym as 'amp' | 'time';
        view.rebuildViz();
        view.resetCamera('perspective');
        render();
      };
    });
    const axis = () => {
      const v = (id: string) => parseFloat(q<HTMLInputElement>(id)!.value);
      view.setAxis(v('va-t'), v('va-f'), v('va-a'));
      for (const id of ['va-t', 'va-f', 'va-a']) q(id + '-v')!.textContent = q<HTMLInputElement>(id)!.value;
    };
    for (const id of ['va-t', 'va-f', 'va-a']) q<HTMLInputElement>(id)!.oninput = axis;
    q('va-reset')!.onclick = () => {
      view.setAxis(1, 1, 1);
      view.resetCamera('perspective');
      render();
    };
    // per-mode parameters: [input id, object, key, needs rebuild]
    const params: [string, Record<string, unknown>, string][] = [
      ['vz-cell', VIZ.voxel, 'cell'],
      ['vz-step', VIZ.voxel, 'step'],
      ['vz-gap', VIZ.voxel, 'gap'],
      ['vz-stack', VIZ.voxel, 'stack'],
      ['vd-stride', VIZ.drops, 'stride'],
      ['vd-fade', VIZ.drops, 'fade'],
      ['vd-points', VIZ.drops, 'points'],
      ['vd-glow', VIZ.drops, 'glow'],
      ['vs-turns', VIZ.spiral, 'turns'],
      ['vs-offset', VIZ.spiral, 'offset'],
      ['vs-radius', VIZ.spiral, 'radius'],
      ['vs-tstride', VIZ.spiral, 'tStride'],
      ['vs-kstride', VIZ.spiral, 'kStride'],
    ];
    for (const [id, obj, key] of params) {
      const inp = q<HTMLInputElement>(id);
      if (!inp) continue;
      inp.oninput = () => {
        obj[key] = inp.type === 'checkbox' ? inp.checked : parseFloat(inp.value);
        const v = q(id + '-v');
        if (v) v.textContent = inp.value;
        view.rebuildViz();
      };
    }
  }

  // number keys 1-9 select layers in the game, so modes use Alt+1..5
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
}
