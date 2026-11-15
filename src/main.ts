import './style.css';
import { BIN_HZ, N_BINS, FRAME_SEC } from './dsp/stft';
import { melFilterbank, melToMask, N_MELS } from './dsp/analysis';
import { CLASSES, MODEL_CLASSES, SOURCES, type ClassId, type SourceId } from './game/catalog';
import { LEVELS, decodeUpload, mixLevel, type Mixture } from './game/levels';
import { Session, stars, type Layer, type ClassScore } from './game/session';
import { applyComb, brush, echo, eraseAll, trackPitch, type PaintOpts } from './game/tools';
import { SpectroView, type Pick } from './view/scene';
import { Transport } from './audio/transport';
import { makeItem } from './ml/dataset';
import { predictClip, N_CLS } from './ml/model';
import { load, save, state } from './state';
import { openLab, renderLabIfOpen, setLabHooks } from './ui/lab';
import { toast } from './ui/toast';
import { openEco, ecoCount } from './ui/eco';
import { showIntro } from './ui/intro';
import { mountVizPanel } from './ui/vizpanel';
import { mountPuzzles } from './ui/puzzle';
import { Timeline } from './ui/timeline';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const fmt = (v: number, d = 1) => {
  const r = v.toFixed(d);
  return (r.startsWith('-') && +r !== 0 ? '' : '+') + (+r === 0 ? (0).toFixed(d) : r);
};

// ---------------- core objects ----------------
const view = new SpectroView($('#canvas-wrap'));
const vizPanel = mountVizPanel(view, $('#stage'));
const transport = new Transport();
const timeline = new Timeline($('#timeline'), transport);

type Tool = 'view' | 'brush' | 'echo' | 'fork' | 'eraser';
const opts = {
  tool: 'brush' as Tool,
  radius: 0.45,
  strength: 0.6,
  grip: 6,
  exclusive: true,
  forkSalience: 5,
  forkPersistence: 6,
  forkSteady: false,
  echoThreshold: 0.5,
};

let uploadName: string | null = null;
let contributedThisSession = false;

// ---------------- undo ----------------
const undoStack: { layers: Layer[]; active: number }[] = [];
function snapshot() {
  const s = state.session;
  if (!s) return;
  undoStack.push({ layers: s.layers.map((l) => ({ ...l, mask: l.mask.slice() })), active: s.activeLayer });
  if (undoStack.length > 12) undoStack.shift();
}
function undo() {
  const s = state.session;
  const snap = undoStack.pop();
  if (!s || !snap) return;
  s.layers = snap.layers;
  s.activeLayer = snap.active;
  afterEdit(true);
}

// ---------------- level loading ----------------
async function loadLevel(idx: number) {
  state.levelIdx = idx;
  uploadName = null;
  const level = LEVELS[idx];
  const mixture = await mixLevel(level);
  startSession(new Session(level, mixture));
}

function startSession(s: Session) {
  state.session = s;
  contributedThisSession = false;
  undoStack.length = 0;
  // a puzzle window comes back with its painting when the player switches windows
  if (!s.layers.length) s.addLayer(s.level?.targets[0] ?? 'unknown');
  view.setSession(s);
  transport.pause();
  refreshAudio(true);
  renderNodes();
  renderLayerFilter();
  renderScores();
  renderToolOptions();
}

// ---------------- header ----------------
function renderNodes() {
  const nav = $('#nodes');
  nav.innerHTML = '';
  LEVELS.forEach((l, i) => {
    const b = document.createElement('button');
    b.className = 'node-chip' + (i === state.levelIdx && !uploadName ? ' active' : '') + (state.completed.has(l.id) ? ' done' : '');
    b.innerHTML = `<span class="led"></span><span class="id">${l.node}</span>${l.title}<span class="diff">${'●'.repeat(l.difficulty)}</span>`;
    b.onclick = () => loadLevel(i);
    nav.appendChild(b);
  });
  $('#eco-count').textContent = ecoCount();
  $('#ds-count').textContent = String(state.dataset.length);
}

// ---------------- layer filter (top left) ----------------
function renderLayerFilter() {
  const s = state.session!;
  const box = $('#layer-filter');
  const classes: ClassId[] = s.level ? [...new Set([...s.level.targets, ...s.level.stems.map((st) => SOURCES[st.src].cls)])] : (Object.keys(CLASSES) as ClassId[]);
  const rows = s.layers
    .map((l, i) => {
      const ai = l.origin === 'ai' ? `<button class="icon-btn" data-a="adopt" title="Accept this layer from the model and correct it">✓</button>` : '';
      return `<li class="${i === s.activeLayer ? 'active' : ''}" data-i="${i}" title="Click to paint into this layer (${i + 1})">
        <span class="sw" style="background:${l.color};opacity:${l.visible ? 1 : 0.3}"></span>
        <span class="name">${l.name}${l.origin === 'ai' ? ' <small>model</small>' : ''}</span>
        ${ai}
        <button class="icon-btn" data-a="listen" title="Listen to this layer only">
          <svg viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></svg></button>
        <button class="icon-btn" data-a="vis" title="${l.visible ? 'Hide' : 'Show'}">${l.visible ? '◉' : '○'}</button>
        <button class="icon-btn" data-a="del" title="Delete layer">✕</button>
      </li>`;
    })
    .join('');
  box.innerHTML = `<div class="lf-head"><span>Layers</span>
      <select id="lf-add" title="Add a layer for another sound" aria-label="Add layer"><option value="">+ Add</option>
        ${classes.map((c) => `<option value="${c}">${CLASSES[c].label}</option>`).join('')}</select></div>
    <ul>${rows || '<li class="empty">No layers yet</li>'}</ul>`;
  const add = box.querySelector<HTMLSelectElement>('#lf-add')!;
  add.onchange = () => {
    if (!add.value) return;
    snapshot();
    s.addLayer(add.value as ClassId);
    afterEdit();
  };
  box.querySelectorAll<HTMLLIElement>('li[data-i]').forEach((li) => {
    li.onclick = (e) => {
      const i = +li.dataset.i!;
      const l = s.layers[i];
      const a = (e.target as HTMLElement).closest('[data-a]')?.getAttribute('data-a');
      if (a === 'listen') {
        s.activeLayer = i;
        setPlayMode('layer');
        void transport.play();
      } else if (a === 'vis') l.visible = !l.visible;
      else if (a === 'del') {
        snapshot();
        s.removeLayer(i);
      } else if (a === 'adopt') {
        l.origin = 'player';
        l.name = l.name + ' (from model)';
        toast('Layer accepted. Fix what the model got wrong. That correction is the most valuable label.', 'info');
      } else s.activeLayer = i;
      afterEdit(a === 'vis' || a === 'del' || a === 'adopt');
    };
  });
}

// ---------------- separation score ----------------
function scoreRow(sc: ClassScore, aiScore?: ClassScore) {
  const c = CLASSES[sc.cls];
  const st = stars(sc.progress);
  const starHtml = [0, 1, 2].map((i) => `<span class="${i < st ? '' : 'off'}">★</span>`).join('');
  const lo = Math.min(sc.baseline, sc.player ?? sc.baseline) - 2;
  const hi = sc.oracle + 2;
  const pos = (v: number) => `${(100 * (v - lo)) / (hi - lo)}%`;
  const you = sc.player ?? sc.baseline;
  const ai = aiScore?.player != null ? `<div class="score-nums" style="margin-top:3px"><span style="color:#56c8ff">model ${aiScore.player.toFixed(1)} dB (${fmt(aiScore.player - aiScore.baseline)} dB)</span></div>` : '';
  return `<div class="score">
    <div class="score-head"><span>${c.label}</span><span class="stars">${starHtml}</span></div>
    <div class="bar"><div class="fill" style="width:${pos(you)};background:${c.color}"></div>
      <div class="tick" style="left:${pos(sc.baseline)}" title="raw mixture"></div>
      <div class="tick" style="left:${pos(sc.oracle)};background:#ffe08a" title="ideal ratio mask ceiling"></div></div>
    <div class="score-nums"><span>mix ${sc.baseline.toFixed(1)}</span><span>you <b>${sc.player === null ? '–' : sc.player.toFixed(1)}</b> ${sc.player === null ? '' : `(${fmt(sc.player - sc.baseline)})`}</span><span>ceiling ${sc.oracle.toFixed(1)}</span></div>
    ${ai}
  </div>`;
}

function renderScores() {
  const s = state.session!;
  const box = $('#scores');
  if (!s.hasTruth) {
    box.innerHTML = `<p class="muted small">Real recordings have no clean reference, so they cannot be scored. They still make great training labels.</p>`;
    return;
  }
  const sc = s.scores();
  const hasAi = s.layers.some((l) => l.origin === 'ai');
  const ai = hasAi ? s.scores((l) => l.origin === 'ai') : [];
  box.innerHTML =
    sc.map((x, i) => scoreRow(x, ai[i])).join('') +
    `<p class="muted small" style="margin:8px 0 0">Ceiling = ideal ratio mask: the best any mask can do on this clip.</p>`;
  checkUnlocks(sc);
}

function unlockKey(src: SourceId): SourceId {
  return src.startsWith('chainsaw') ? 'chainsaw_b' : src;
}

function checkUnlocks(sc: ClassScore[]) {
  const s = state.session!;
  if (!s.level) return;
  let changed = false;
  for (const x of sc) {
    if (stars(x.progress) < 1) continue;
    for (const st of s.level.stems) {
      if (SOURCES[st.src].cls !== x.cls) continue;
      const key = unlockKey(st.src);
      if (!state.unlocked.has(key)) {
        state.unlocked.add(key);
        changed = true;
        const info = SOURCES[key];
        toast(`<b>${info.cls === 'chainsaw' ? 'Threat identified' : 'Species unlocked'}:</b> ${info.common}${info.species ? ` <i>(${info.species})</i>` : ''}`);
      }
    }
  }
  if (sc.length && sc.every((x) => stars(x.progress) >= 1) && !state.completed.has(s.level.id)) {
    state.completed.add(s.level.id);
    changed = true;
    toast(`Node ${s.level.node} untangled. Contribute it to the training set to teach the sensor.`, 'info', 6000);
  }
  if (changed) {
    save();
    renderNodes();
  }
}

// ---------------- after edits ----------------
let scoreTimer = 0;
let audioTimer = 0;
function afterEdit(heights = false) {
  if (heights || view.unfold > 0) view.markHeightsDirty();
  view.refresh();
  renderLayerFilter();
  clearTimeout(scoreTimer);
  scoreTimer = window.setTimeout(renderScores, 180);
  // layer and rest playback follow the painting
  if (playMode !== 'mix') {
    clearTimeout(audioTimer);
    audioTimer = window.setTimeout(() => refreshAudio(), 250);
  }
}

function ensureLayer(): number {
  const s = state.session!;
  if (s.activeLayer < 0 || !s.layers.length) s.addLayer(s.level?.targets[0] ?? 'unknown');
  return s.activeLayer;
}

const paintOpts = (erase = false): PaintOpts => ({ strength: opts.strength, grip: opts.grip, erase, exclusive: opts.exclusive });

/** Bring the cells under the eraser back to the untouched recording, in every layer. */
function eraseAt(p: Pick) {
  eraseAll(state.session!, view.map, p.x, p.z, opts.radius);
}

// ---------------- tool options ----------------
function renderToolOptions() {
  const box = $('#tool-options');
  const slider = (id: string, label: string, min: number, max: number, step: number, v: number, unit = '', title = label) =>
    `<label title="${title}">${label} <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"><span class="val" id="${id}-v">${v}${unit}</span></label>`;
  const grip = slider('o-grip', 'Grip', -10, 25, 1, opts.grip, ' dB', 'How far above the quiet background a cell must be to get painted');
  let html = '';
  if (opts.tool === 'brush') html = slider('o-radius', 'Size', 0.1, 1.5, 0.05, opts.radius) + slider('o-strength', 'Flow', 0.1, 1, 0.05, opts.strength) + grip;
  else if (opts.tool === 'eraser') html = slider('o-radius', 'Size', 0.1, 1.5, 0.05, opts.radius);
  else if (opts.tool === 'fork')
    html =
      slider('o-sal', 'Salience', 1, 15, 0.5, opts.forkSalience, ' dB', 'How much the line must stand out to be followed') +
      slider('o-pers', 'Persistence', 0, 30, 1, opts.forkPersistence, '', 'How many quiet frames the fork bridges') +
      grip +
      `<label title="Select the same pitch across the whole clip"><input type="checkbox" id="o-steady" ${opts.forkSteady ? 'checked' : ''}> Steady</label>`;
  else if (opts.tool === 'echo') html = slider('o-thr', 'Match', 0.2, 0.9, 0.05, opts.echoThreshold, '', 'How similar a repeat must be') + grip;
  if (opts.tool === 'brush' || opts.tool === 'echo' || opts.tool === 'fork')
    html += `<label title="Painting a cell into one layer removes it from the others"><input type="checkbox" id="o-excl" ${opts.exclusive ? 'checked' : ''}> Exclusive</label>`;
  box.innerHTML = html;
  box.hidden = !html;
  const bind = (id: string, key: keyof typeof opts) => {
    const inp = document.getElementById(id) as HTMLInputElement | null;
    if (!inp) return;
    inp.oninput = () => {
      (opts as Record<string, unknown>)[key] = inp.type === 'checkbox' ? inp.checked : parseFloat(inp.value);
      const v = document.getElementById(id + '-v');
      if (v) v.textContent = inp.value + (id === 'o-grip' || id === 'o-sal' ? ' dB' : '');
    };
  };
  bind('o-radius', 'radius');
  bind('o-strength', 'strength');
  bind('o-grip', 'grip');
  bind('o-sal', 'forkSalience');
  bind('o-pers', 'forkPersistence');
  bind('o-steady', 'forkSteady');
  bind('o-thr', 'echoThreshold');
  bind('o-excl', 'exclusive');
  document.querySelectorAll('.tool[data-tool]').forEach((b) => b.classList.toggle('active', b.getAttribute('data-tool') === opts.tool));
  view.setViewMode(opts.tool === 'view');
  $('#canvas-wrap').classList.toggle('cursor-tool', opts.tool !== 'view');
  view.clearOverlays();
}

function setTool(t: Tool) {
  opts.tool = t;
  renderToolOptions();
  const hints: Record<Tool, string> = {
    view: 'Drag to rotate. Shift+drag slides, W A S D moves.',
    brush: 'Paint the sound into the active layer. Grip ignores the quiet background.',
    echo: 'Drag a box around one call. Echo finds its repeats.',
    fork: 'Click the lowest line of a call. Fork selects it together with its harmonics.',
    eraser: 'Paint over cells to bring them back to the untouched recording.',
  };
  setHint(hints[t]);
}

let hintTimer = 0;
function setHint(text: string, sticky = false) {
  $('#hint').textContent = text;
  clearTimeout(hintTimer);
  if (!sticky) hintTimer = window.setTimeout(() => ($('#hint').textContent = ''), 5000);
}

// ---------------- navigation that works with every tool ----------------
// Shift+drag slides over the ground, Shift+Cmd (or Ctrl)+drag moves up and down,
// Alt+drag orbits. These run before the tools see the pointer.
let nav: { kind: 'ground' | 'vertical' | 'orbit'; x: number; y: number } | null = null;
$('#canvas-wrap').addEventListener(
  'pointerdown',
  (e) => {
    if (e.button !== 0 || !(e.shiftKey || e.altKey)) return;
    e.stopPropagation();
    e.preventDefault();
    nav = { kind: e.altKey ? 'orbit' : e.metaKey || e.ctrlKey ? 'vertical' : 'ground', x: e.clientX, y: e.clientY };
    view.controls.enabled = false;
    $('#canvas-wrap').classList.add('navigating');
  },
  true,
);
window.addEventListener('pointermove', (e) => {
  if (!nav) return;
  const dx = e.clientX - nav.x;
  const dy = e.clientY - nav.y;
  nav.x = e.clientX;
  nav.y = e.clientY;
  if (nav.kind === 'ground') view.panGround(dx, dy);
  else if (nav.kind === 'vertical') view.panVertical(dy);
  else view.orbitBy(dx * 0.008, dy * 0.006);
});
window.addEventListener('pointerup', () => {
  if (!nav) return;
  nav = null;
  view.controls.enabled = true;
  $('#canvas-wrap').classList.remove('navigating');
});

// ---------------- pointer interaction (tools) ----------------
const canvas = view.renderer.domElement;
let dragging = false;
let dragStart: Pick | null = null;
let lastPick: Pick | null = null;
let rafPending = false;
let pendingEvent: PointerEvent | null = null;

function describe(p: Pick) {
  const s = state.session!;
  const t = Math.round(p.t);
  const k = Math.round(p.k);
  const i = t * N_BINS + k;
  const hz = p.k * BIN_HZ;
  const above = s.db[i] - s.floor[k];
  return `${(t * FRAME_SEC).toFixed(2)} s · ${hz >= 1000 ? (hz / 1000).toFixed(2) + ' kHz' : hz.toFixed(0) + ' Hz'} · ${above >= 0 ? '+' : ''}${above.toFixed(0)} dB over background`;
}

function handleMove(e: PointerEvent) {
  const s = state.session;
  if (!s || nav) return;
  const p = view.pick(e.clientX, e.clientY);
  lastPick = p;
  if (!p) {
    view.showCursor(null, 0);
    if (opts.tool === 'fork') view.showFork(null, 0);
    return;
  }
  setHint(describe(p), true);
  if (opts.tool === 'brush' || opts.tool === 'eraser') {
    view.showCursor(p, opts.radius);
    if (dragging) {
      if (opts.tool === 'brush') brush(s, view.map, ensureLayer(), p.x, p.z, opts.radius, paintOpts());
      else eraseAt(p);
      view.refresh();
    }
  } else if (opts.tool === 'fork') {
    view.showFork(p, p.k * BIN_HZ);
  } else if (opts.tool === 'echo' && dragging && dragStart) {
    view.showBox(dragStart, p, 0xff7ac8);
  }
}

canvas.addEventListener('pointermove', (e) => {
  pendingEvent = e;
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    if (pendingEvent) handleMove(pendingEvent);
  });
});

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || opts.tool === 'view' || !state.session) return;
  const s = state.session;
  const p = view.pick(e.clientX, e.clientY);
  if (!p) return;
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {
    /* synthetic pointers (tests) cannot be captured */
  }
  snapshot();
  if (opts.tool === 'brush') {
    dragging = true;
    brush(s, view.map, ensureLayer(), p.x, p.z, opts.radius, paintOpts());
    view.refresh();
  } else if (opts.tool === 'eraser') {
    dragging = true;
    eraseAt(p);
    view.refresh();
  } else if (opts.tool === 'fork') {
    const li = ensureLayer();
    const track = trackPitch(s, p.t, p.k * BIN_HZ, {
      minSalience: opts.forkSalience,
      persistence: opts.forkPersistence,
      tolerance: 0.04,
      steady: opts.forkSteady,
    });
    if (track.size < 3) {
      toast('The fork found no clear line here. Lower the salience or click the lowest bright line of a call.', 'warn');
      undoStack.pop();
      return;
    }
    applyComb(s, li, track, paintOpts());
    view.showFork(p, p.k * BIN_HZ, track);
    const fs = [...track.values()];
    const mean = fs.reduce((a, b) => a + b, 0) / fs.length;
    setHint(`Fork: ${(track.size * FRAME_SEC).toFixed(2)} s of a call at ${mean.toFixed(0)} Hz and its harmonics`);
    afterEdit();
  } else {
    dragging = true;
    dragStart = p;
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (!dragging) return;
  dragging = false;
  const s = state.session!;
  const end = view.pick(e.clientX, e.clientY) ?? lastPick;
  if (opts.tool === 'echo' && dragStart && end) {
    const li = ensureLayer();
    const r = echo(s, li, dragStart.t, end.t, dragStart.k, end.k, opts.grip, opts.echoThreshold);
    view.showMarkers(r.matches.map((m) => m.t), Math.min(dragStart.k, end.k), Math.max(dragStart.k, end.k));
    if (r.matches.length <= 1) toast('No repeats found. Box exactly one call, or lower the match value.', 'warn');
    else toast(`Echo found <b>${r.matches.length}</b> repeats${r.periodSec ? `, one every <b>${r.periodSec.toFixed(2)} s</b>` : ''}`, 'info');
    setTimeout(() => view.showBox(null, null), 600);
  }
  dragStart = null;
  afterEdit(opts.tool === 'eraser');
});

canvas.addEventListener('pointerleave', () => {
  view.showCursor(null, 0);
  $('#hint').textContent = '';
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------------- player ----------------
type PlayMode = 'mix' | 'layer' | 'res';
let playMode: PlayMode = 'mix';

function currentAudio(): Float32Array {
  const s = state.session!;
  if (playMode === 'layer' && s.active) return s.layerAudio(s.active);
  if (playMode === 'res') return s.residualAudio();
  return s.mixture.mix;
}

function refreshAudio(resetPosition = false) {
  if (!state.session) return;
  const x = currentAudio();
  transport.setBuffer(x, resetPosition);
  timeline.setAudio(x);
}

function setPlayMode(m: PlayMode) {
  if (m === 'layer' && !state.session?.active) return toast('Pick a layer first.', 'warn');
  playMode = m;
  document.querySelectorAll<HTMLElement>('[data-pm]').forEach((b) => b.classList.toggle('on', b.dataset.pm === m));
  refreshAudio();
}

transport.onChange = () => $('#play').classList.toggle('playing', transport.playing);
$('#play').onclick = () => transport.toggle();
$('#to-start').onclick = () => transport.seek(0);
document.querySelectorAll<HTMLElement>('[data-pm]').forEach((b) => (b.onclick = () => setPlayMode(b.dataset.pm as PlayMode)));

// playhead in the 3D view and the time readout
(function tick() {
  const pos = transport.position;
  const show = transport.playing || transport.holding || pos > 0.005;
  view.setPlayhead(show ? pos : null);
  $('#time').textContent = `${pos.toFixed(2)} s`;
  requestAnimationFrame(tick);
})();

// ---------------- view bar ----------------
($('#whiten') as HTMLInputElement).onchange = (e) => {
  view.whiten = (e.target as HTMLInputElement).checked;
  view.markHeightsDirty();
  view.refresh();
};
($('#unfold') as HTMLInputElement).oninput = (e) => {
  view.unfold = parseFloat((e.target as HTMLInputElement).value);
  view.markHeightsDirty();
  view.refresh();
};
document.querySelectorAll<HTMLElement>('[data-cam]').forEach((b) => (b.onclick = () => view.resetCamera(b.dataset.cam as 'top')));
document.querySelectorAll<HTMLElement>('.tool[data-tool]').forEach((b) => (b.onclick = () => setTool(b.dataset.tool as Tool)));
$('#btn-undo').onclick = undo;

// ---------------- contribute ----------------
$('#btn-contribute').onclick = () => {
  const s = state.session!;
  const masks = s.classMasks((l) => l.origin !== 'ai');
  const useful = MODEL_CLASSES.filter((c) => masks[c]?.some((v) => v > 0.3));
  if (!useful.length) return toast('Nothing to contribute yet: paint at least one frog, hornet, chainsaw or cicada layer.', 'warn');
  const label = s.level ? `${s.level.node} · ${s.level.title}` : `Field · ${uploadName}`;
  if (contributedThisSession) {
    const idx = state.dataset.findIndex((d) => d.origin === 'player' && d.label === label);
    if (idx >= 0) state.dataset.splice(idx, 1);
  }
  state.dataset.push(makeItem(s.spec.mag, s.frames, masks, 'player', label));
  contributedThisSession = true;
  save();
  renderNodes();
  renderLabIfOpen();
  toast(`Contributed <b>${useful.map((c) => CLASSES[c].label).join(', ')}</b>. Open the Edge AI Lab to retrain.`);
};

// ---------------- edge AI deployment on current clip ----------------
function deployToCurrent() {
  const s = state.session;
  if (!s || !state.model) return;
  snapshot();
  s.layers = s.layers.filter((l) => l.origin !== 'ai');
  const fb = melFilterbank();
  const feat = makeItem(s.spec.mag, s.frames, {}, 'player', '').feat;
  const out = predictClip(feat, s.frames, { q: state.model.q });
  let totalE = 0;
  for (let i = 0; i < s.spec.mag.length; i++) totalE += s.spec.mag[i] * s.spec.mag[i];
  for (let c = 0; c < N_CLS; c++) {
    const cls = MODEL_CLASSES[c];
    const mel = out.subarray(c * s.frames * N_MELS, (c + 1) * s.frames * N_MELS);
    const mask = melToMask(mel, s.frames, fb);
    let energy = 0;
    for (let i = 0; i < mask.length; i++) energy += mask[i] * s.spec.mag[i] * s.spec.mag[i];
    // the node only raises a detection when the class claims a meaningful share of the clip energy
    if (energy / totalE < 0.04) continue;
    const prev = s.activeLayer;
    const L = s.addLayer(cls, 'ai', CLASSES[cls].label);
    L.mask.set(mask);
    s.activeLayer = prev >= 0 ? prev : s.layers.length - 1;
  }
  afterEdit(true);
  toast('The model now listens to this clip. Layers marked "model" show what it hears. Accept and correct them.', 'info', 6000);
}

// ---------------- upload ----------------
($('#upload') as HTMLInputElement).onchange = async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  try {
    const x = await decodeUpload(f);
    uploadName = f.name;
    const mixture: Mixture = { mix: x, stems: [], refs: {} };
    startSession(new Session(null, mixture));
    toast(`Loaded ${f.name}: the first 5 s.`, 'info');
  } catch (err) {
    toast('Could not decode that file: ' + String(err), 'warn');
  }
  (e.target as HTMLInputElement).value = '';
};

setLabHooks({ deploy: deployToCurrent, refresh: () => renderNodes() });
$('#btn-lab').onclick = () => openLab();
$('#btn-eco').onclick = () => openEco();
// recordings from the listening posts (Python backend on port 8000)
mountPuzzles($('#labeling'), {
  start: (s, name) => {
    uploadName = name;
    startSession(s);
  },
});

// the 3D view changed theme, so layer colours may have changed
function themeTimeline() {
  timeline.setColors({ wave: view.theme.accent2, played: view.theme.accent, needle: '#ffffff' });
}
window.addEventListener('viz-theme', () => {
  themeTimeline();
  if (!state.session) return;
  renderLayerFilter();
  renderScores();
});

// ---------------- keyboard ----------------
const NAV_KEYS = new Set(['w', 'a', 's', 'd', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown']);
function typing(e: KeyboardEvent) {
  const t = e.target as HTMLElement;
  return t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && !['range', 'checkbox'].includes((t as HTMLInputElement).type));
}
window.addEventListener('keydown', (e) => {
  if (typing(e)) return;
  if (!$('#lab').hidden || !$('#eco').hidden || !$('#intro').hidden) {
    if (e.key === 'Escape') ['#lab', '#eco', '#intro'].forEach((s) => ($(s).hidden = true));
    return;
  }
  const s = state.session;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    return undo();
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (NAV_KEYS.has(k)) {
    e.preventDefault();
    view.keys.add(k);
    return;
  }
  if (k === 'v') setTool('view');
  else if (k === 'b') setTool('brush');
  else if (k === 'e') setTool('echo');
  else if (k === 'f') setTool('fork');
  else if (k === 'x') setTool('eraser');
  else if (k === ' ') {
    e.preventDefault();
    transport.toggle();
  } else if (k === 'home') transport.seek(0);
  else if (k === 'l') setPlayMode(playMode === 'layer' ? 'mix' : 'layer');
  else if (k === 'r') setPlayMode(playMode === 'res' ? 'mix' : 'res');
  else if (k === '[') {
    opts.radius = Math.max(0.1, opts.radius - 0.05);
    renderToolOptions();
  } else if (k === ']') {
    opts.radius = Math.min(1.5, opts.radius + 0.05);
    renderToolOptions();
  } else if (s && /^[1-9]$/.test(k) && +k <= s.layers.length) {
    s.activeLayer = +k - 1;
    renderLayerFilter();
    if (playMode === 'layer') refreshAudio();
  }
});
window.addEventListener('keyup', (e) => view.keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => view.keys.clear());

// dev only: lets browser tests inspect the app
if (import.meta.env.DEV) Object.assign(window, { __bs: { state, view, transport } });

// ---------------- boot ----------------
async function boot() {
  const returning = load();
  await loadLevel(0);
  setTool('brush');
  view.setIso(true);
  vizPanel.render();
  themeTimeline();
  if (!returning) showIntro();
}
boot().catch((err) => {
  console.error(err);
  toast('Failed to start: ' + String(err), 'warn', 10000);
});
