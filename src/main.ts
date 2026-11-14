import './style.css';
import { BIN_HZ, CLIP_LEN, N_BINS, FRAME_SEC, istft } from './dsp/stft';
import { basisCentroidHz, hpss, melFilterbank, melToMask, N_MELS, nmfComponentMask, type NmfResult } from './dsp/analysis';
import { CLASSES, MODEL_CLASSES, SOURCES, type ClassId, type SourceId } from './game/catalog';
import { LEVELS, classSnr, decodeUpload, mixLevel, type Mixture } from './game/levels';
import { Session, stars, type Layer, type ClassScore } from './game/session';
import { applyComb, brush, echo, knife, trackPitch, type PaintOpts } from './game/tools';
import { SpectroView, type Pick } from './view/scene';
import { Player } from './audio/player';
import { runWorker } from './ml/client';
import { makeItem } from './ml/dataset';
import { predictClip, N_CLS } from './ml/model';
import { load, save, state } from './state';
import { openLab, renderLabIfOpen, setLabHooks } from './ui/lab';
import { toast } from './ui/toast';
import { openEco, ecoCount } from './ui/eco';
import { showIntro } from './ui/intro';
import { mountVizPanel } from './ui/vizpanel';
import { mountPuzzles } from './ui/puzzle';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const fmt = (v: number, d = 1) => {
  const r = v.toFixed(d);
  return (r.startsWith('-') && +r !== 0 ? '' : '+') + (+r === 0 ? (0).toFixed(d) : r);
};

// ---------------- core objects ----------------
const view = new SpectroView($('#canvas-wrap'));
const player = new Player();
player.onTime = (t) => view.setPlayhead(t);
mountVizPanel(view, $('#stage'));
player.onStop = () => document.querySelectorAll('.btn.play').forEach((b) => b.classList.remove('on'));

type Tool = 'view' | 'brush' | 'fork' | 'knife' | 'echo';
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
let fromDevice = false; // the clip is a puzzle from the forest listening post
let nmfResult: NmfResult | null = null;
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
  player.stop();
  state.levelIdx = idx;
  uploadName = null;
  fromDevice = false;
  const level = LEVELS[idx];
  const mixture = await mixLevel(level);
  startSession(new Session(level, mixture));
}

function startSession(s: Session) {
  state.session = s;
  nmfResult = null;
  contributedThisSession = false;
  undoStack.length = 0;
  const first = s.level?.targets[0] ?? 'unknown';
  // a puzzle window comes back with its painting when the player switches windows
  if (!s.layers.length) s.addLayer(first);
  view.setSession(s);
  $('#strands').innerHTML = '';
  renderNodes();
  renderNodeCard();
  renderBrief();
  renderLayers();
  renderScores();
  renderToolOptions();
}

// ---------------- rendering: header & cards ----------------
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

function renderNodeCard() {
  const s = state.session!;
  const card = $('#node-card');
  if (!s.level) {
    card.innerHTML = `<div class="site"><span class="blink"></span>${fromDevice ? 'Forest listening post · needs help' : 'Field upload'}</div>
      <h2>${uploadName}</h2>
      <div class="muted small">${fromDevice ? 'The post could not recognize this sound. Your carving and label teach it.' : 'No ground truth exists for this clip. Your separation <b>is</b> the label.'}</div>
      <div class="chips"><span class="chip">16 kHz mono</span><span class="chip">5.0 s</span></div>`;
    return;
  }
  const l = s.level;
  const snrs = l.targets
    .map((c) => {
      const v = classSnr(s.mixture, c);
      return `<span class="chip ${v < 0 ? 'bad' : ''}">SNR ${CLASSES[c].label.toLowerCase()} ${fmt(v)} dB</span>`;
    })
    .join('');
  card.innerHTML = `<div class="site"><span class="blink"></span>Node ${l.node} · ${l.site}</div>
    <h2>${l.title}</h2>
    <div class="muted small">Beamed from Arduino Nano 33 BLE Sense · PDM mic · 16 kHz · 5.0 s</div>
    <div class="chips">${snrs}</div>`;
}

function renderBrief() {
  const s = state.session!;
  const box = $('#brief');
  if (!s.level) {
    box.innerHTML = fromDevice
      ? `<h3>Device puzzle</h3><p>Paint the unknown sound with the brush, fork or knife. Switch windows to see the whole event. Then pick a label and press <b>Send label</b> in the puzzle card.</p>`
      : `<h3>Field clip</h3><p>Untangle what you hear. Pick a class for each layer, then contribute. Field labels are exactly the edge cases the node needs.</p>`;
    return;
  }
  const t = s.level.targets
    .map((c) => `<div class="target"><span class="dot" style="background:${CLASSES[c].color}"></span><div><b>${CLASSES[c].label}</b><span class="muted">${CLASSES[c].hint}</span></div></div>`)
    .join('');
  const noise = [...new Set(s.level.stems.map((st) => SOURCES[st.src].cls))].filter((c) => !s.level!.targets.includes(c));
  const n = noise.map((c) => `<span class="chip">${CLASSES[c].label}</span>`).join(' ');
  box.innerHTML = `<h3>Mission</h3><p>${s.level.brief}</p>${t}<div class="target"><span class="dot" style="background:#2c4550"></span><div><b>Interference</b>${n}</div></div>`;
}

function renderLayers() {
  const s = state.session!;
  const add = $('#add-layer');
  const classes: ClassId[] = s.level ? [...new Set([...s.level.targets, ...s.level.stems.map((st) => SOURCES[st.src].cls)])] : (Object.keys(CLASSES) as ClassId[]);
  add.innerHTML = '';
  for (const c of classes) {
    const b = document.createElement('button');
    b.title = `New ${CLASSES[c].label} layer`;
    b.innerHTML = `<span class="sw" style="background:${CLASSES[c].color}"></span>+ ${CLASSES[c].label.split(' ')[0]}`;
    b.onclick = () => {
      snapshot();
      s.addLayer(c);
      afterEdit();
    };
    add.appendChild(b);
  }
  const ul = $('#layers');
  ul.innerHTML = '';
  if (!s.layers.length) {
    ul.innerHTML = '<li class="empty">No layers yet. Add one above.</li>';
    return;
  }
  s.layers.forEach((l, i) => {
    let cover = 0;
    let energy = 0;
    let total = 0;
    for (let j = 0; j < l.mask.length; j++) {
      const e = s.spec.mag[j] * s.spec.mag[j];
      total += e;
      energy += e * l.mask[j];
      if (l.mask[j] > 0.5) cover++;
    }
    const li = document.createElement('li');
    li.className = i === s.activeLayer ? 'active' : '';
    const badge = l.origin === 'ai' ? `<span class="badge" style="color:#56c8ff">edge AI</span>` : l.origin === 'assist' ? `<span class="badge" style="color:#8fa7bf">DSP</span>` : '';
    li.innerHTML = `<span class="sw" style="background:${l.color};opacity:${l.visible ? 1 : 0.3}"></span>
      <div class="name"><span>${l.name}${badge}</span><small>${((100 * energy) / (total || 1)).toFixed(1)}% energy · ${cover} cells</small></div>
      <div class="acts">
        ${l.origin === 'ai' ? '<button class="icon-btn" data-a="adopt" title="Adopt: accept this AI layer as your own and correct it">✓</button>' : ''}
        <button class="icon-btn" data-a="play" title="Listen">▶</button>
        <button class="icon-btn" data-a="vis" title="Show/hide">${l.visible ? '◉' : '○'}</button>
        <button class="icon-btn" data-a="clear" title="Clear mask">⌫</button>
        <button class="icon-btn" data-a="del" title="Delete layer">✕</button>
      </div>`;
    li.onclick = (e) => {
      const a = (e.target as HTMLElement).closest('[data-a]')?.getAttribute('data-a');
      if (a === 'play') return playBuffer(s.layerAudio(l), 'layer-' + l.id, '#play-layer');
      if (a === 'vis') l.visible = !l.visible;
      else if (a === 'clear') {
        snapshot();
        l.mask.fill(0);
      } else if (a === 'del') {
        snapshot();
        s.removeLayer(i);
      } else if (a === 'adopt') {
        l.origin = 'player';
        l.name = l.name + ' (from AI)';
        toast('Layer adopted. Fix what the model got wrong, then contribute: that correction is the most valuable label.', 'info');
      } else s.activeLayer = i;
      afterEdit(a === 'vis' || a === 'del' || a === 'clear' || a === 'adopt');
    };
    ul.appendChild(li);
  });
}

function scoreRow(sc: ClassScore, aiScore?: ClassScore) {
  const c = CLASSES[sc.cls];
  const st = stars(sc.progress);
  const starHtml = [0, 1, 2].map((i) => `<span class="${i < st ? '' : 'off'}">★</span>`).join('');
  const lo = Math.min(sc.baseline, sc.player ?? sc.baseline) - 2;
  const hi = sc.oracle + 2;
  const pos = (v: number) => `${(100 * (v - lo)) / (hi - lo)}%`;
  const you = sc.player ?? sc.baseline;
  const ai = aiScore?.player != null ? `<div class="score-nums" style="margin-top:3px"><span style="color:#56c8ff">edge AI ${aiScore.player.toFixed(1)} dB (${fmt(aiScore.player - aiScore.baseline)} dB)</span></div>` : '';
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
    box.innerHTML = `<p class="muted small">Field clips have no clean reference, so they cannot be scored. They still make great training labels.</p>`;
    return;
  }
  const sc = s.scores();
  const hasAi = s.layers.some((l) => l.origin === 'ai');
  const ai = hasAi ? s.scores((l) => l.origin === 'ai') : [];
  box.innerHTML =
    sc.map((x, i) => scoreRow(x, ai[i])).join('') +
    `<p class="muted small" style="margin:8px 0 0">Ceiling = ideal ratio mask: the best any STFT mask can do on this clip.</p>`;
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
function afterEdit(heights = false) {
  if (heights || view.unfold > 0) view.markHeightsDirty();
  view.refresh();
  renderLayers();
  clearTimeout(scoreTimer);
  scoreTimer = window.setTimeout(renderScores, 180);
}

function ensureLayer(): number {
  const s = state.session!;
  if (s.activeLayer < 0 || !s.layers.length) s.addLayer(s.level?.targets[0] ?? 'unknown');
  return s.activeLayer;
}

const paintOpts = (erase: boolean): PaintOpts => ({ strength: opts.strength, grip: opts.grip, erase, exclusive: opts.exclusive });

// ---------------- tool options ----------------
function renderToolOptions() {
  const box = $('#tool-options');
  const slider = (id: string, label: string, min: number, max: number, step: number, v: number, unit = '') =>
    `<label title="${label}">${label} <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"><span class="val" id="${id}-v">${v}${unit}</span></label>`;
  let html = '';
  if (opts.tool === 'brush') {
    html = slider('o-radius', 'Size', 0.1, 1.5, 0.05, opts.radius) + slider('o-strength', 'Flow', 0.1, 1, 0.05, opts.strength) + slider('o-grip', 'Grip', -10, 25, 1, opts.grip, ' dB');
  } else if (opts.tool === 'fork') {
    html =
      slider('o-sal', 'Salience', 1, 15, 0.5, opts.forkSalience, ' dB') +
      slider('o-pers', 'Persistence', 0, 30, 1, opts.forkPersistence) +
      slider('o-grip', 'Grip', -10, 25, 1, opts.grip, ' dB') +
      `<label><input type="checkbox" id="o-steady" ${opts.forkSteady ? 'checked' : ''}> Steady comb</label>`;
  } else if (opts.tool === 'knife') {
    html = slider('o-grip', 'Grip', -10, 25, 1, opts.grip, ' dB') + slider('o-strength', 'Flow', 0.1, 1, 0.05, opts.strength);
  } else if (opts.tool === 'echo') {
    html = slider('o-thr', 'Match', 0.2, 0.9, 0.05, opts.echoThreshold) + slider('o-grip', 'Grip', -10, 25, 1, opts.grip, ' dB');
  } else {
    html = '<span class="muted">Left-drag orbit · right-drag orbit · middle-drag pan · wheel zoom</span>';
  }
  if (opts.tool !== 'view') html += `<label title="Painting a cell into one layer removes it from the others"><input type="checkbox" id="o-excl" ${opts.exclusive ? 'checked' : ''}> Exclusive</label>`;
  box.innerHTML = html;
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
    view: 'Orbit around the sound sculpture',
    brush: 'Paint energy into the active layer. Shift = erase. Grip ignores cells near the noise floor.',
    fork: 'Hover a harmonic strand at its lowest line, click to track it. Shift-click = steady comb.',
    knife: 'Drag a box to claim a time-frequency band. Shift = erase.',
    echo: 'Drag a box around one call. Echo finds its rhythm and copies the mask to every repeat.',
  };
  setHint(hints[t]);
}

let hintTimer = 0;
function setHint(text: string, sticky = false) {
  $('#hint').textContent = text;
  clearTimeout(hintTimer);
  if (!sticky) hintTimer = window.setTimeout(() => ($('#hint').textContent = ''), 5000);
}

// ---------------- pointer interaction ----------------
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
  return `t ${(t * FRAME_SEC).toFixed(2)} s · f ${hz >= 1000 ? (hz / 1000).toFixed(2) + ' kHz' : hz.toFixed(0) + ' Hz'} · ${above >= 0 ? '+' : ''}${above.toFixed(0)} dB over floor`;
}

function handleMove(e: PointerEvent) {
  const s = state.session;
  if (!s) return;
  const p = view.pick(e.clientX, e.clientY);
  lastPick = p;
  if (!p) {
    view.showCursor(null, 0);
    if (opts.tool === 'fork') view.showFork(null, 0);
    return;
  }
  setHint(describe(p), true);
  if (opts.tool === 'brush') {
    view.showCursor(p, opts.radius);
    if (dragging) {
      brush(s, view.map, ensureLayer(), p.x, p.z, opts.radius, paintOpts(e.shiftKey));
      view.refresh();
    }
  } else if (opts.tool === 'fork') {
    view.showFork(p, p.k * BIN_HZ);
  } else if ((opts.tool === 'knife' || opts.tool === 'echo') && dragging && dragStart) {
    view.showBox(dragStart, p, opts.tool === 'echo' ? 0xff7ac8 : e.shiftKey ? 0xff5a5a : 0xffffff);
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
  canvas.setPointerCapture(e.pointerId);
  snapshot();
  const li = ensureLayer();
  if (opts.tool === 'brush') {
    dragging = true;
    brush(s, view.map, li, p.x, p.z, opts.radius, paintOpts(e.shiftKey));
    view.refresh();
  } else if (opts.tool === 'fork') {
    const track = trackPitch(s, p.t, p.k * BIN_HZ, {
      minSalience: opts.forkSalience,
      persistence: opts.forkPersistence,
      tolerance: 0.04,
      steady: opts.forkSteady || e.shiftKey,
    });
    if (track.size < 3) {
      toast('The fork found no harmonic strand here. Lower the salience or click the lowest bright line of a call.', 'warn');
      undoStack.pop();
      return;
    }
    applyComb(s, li, track, paintOpts(false));
    view.showFork(p, p.k * BIN_HZ, track);
    const fs = [...track.values()];
    const mean = fs.reduce((a, b) => a + b, 0) / fs.length;
    setHint(`Fork locked: ${track.size} frames (${(track.size * FRAME_SEC).toFixed(2)} s) · mean f0 ${mean.toFixed(0)} Hz`);
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
  if ((opts.tool === 'knife' || opts.tool === 'echo') && dragStart && end) {
    const li = ensureLayer();
    if (opts.tool === 'knife') {
      knife(s, li, dragStart.t, end.t, dragStart.k, end.k, { ...paintOpts(e.shiftKey), strength: e.shiftKey ? 1 : opts.strength });
    } else {
      const r = echo(s, li, dragStart.t, end.t, dragStart.k, end.k, opts.grip, opts.echoThreshold);
      view.showMarkers(r.matches.map((m) => m.t), Math.min(dragStart.k, end.k), Math.max(dragStart.k, end.k));
      if (r.matches.length <= 1) toast('No repeats found. Box exactly one call, or lower the match threshold.', 'warn');
      else
        toast(
          `Echo found <b>${r.matches.length}</b> occurrences${r.periodSec ? ` · rhythm period <b>${r.periodSec.toFixed(2)} s</b> (${(1 / r.periodSec).toFixed(1)} calls/s)` : ''}`,
          'info',
        );
    }
    setTimeout(() => view.showBox(null, null), 600);
  }
  dragStart = null;
  afterEdit();
});

canvas.addEventListener('pointerleave', () => {
  view.showCursor(null, 0);
  $('#hint').textContent = '';
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------------- transport ----------------
function playBuffer(x: Float32Array, tag: string, btnSel: string) {
  if (player.playing === tag) return player.stop();
  player.play(x, tag);
  document.querySelectorAll('.btn.play').forEach((b) => b.classList.remove('on'));
  $(btnSel)?.classList.add('on');
}
$('#play-mix').onclick = () => playBuffer(state.session!.mixture.mix, 'mix', '#play-mix');
$('#play-layer').onclick = () => {
  const s = state.session!;
  if (!s.active) return toast('No active layer.', 'warn');
  playBuffer(s.layerAudio(s.active), 'layer-' + s.active.id, '#play-layer');
};
$('#play-res').onclick = () => playBuffer(state.session!.residualAudio(), 'res', '#play-res');
$('#stop').onclick = () => player.stop();
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

// ---------------- classic DSP assist ----------------
$('#btn-hpss').onclick = () => {
  const s = state.session!;
  snapshot();
  const { percussive } = hpss(s.spec.mag, s.frames);
  let li = s.layers.findIndex((l) => l.cls === 'rain');
  if (li < 0) {
    const prev = s.activeLayer;
    s.addLayer('rain', 'assist', 'Rain (HPSS)');
    li = s.layers.length - 1;
    if (prev >= 0) s.activeLayer = prev;
  }
  const rain = s.layers[li];
  for (let i = 0; i < rain.mask.length; i++) {
    let others = 0;
    for (let j = 0; j < s.layers.length; j++) if (j !== li) others += s.layers[j].mask[i];
    const a = percussive[i] * percussive[i] * Math.max(0, 1 - others);
    rain.mask[i] = Math.max(rain.mask[i], a);
  }
  afterEdit(true);
  toast('HPSS: percussive energy (vertical streaks) moved to a Rain layer. Harmonic calls stay unclaimed for you.', 'info');
};

$('#btn-nmf').onclick = async () => {
  const s = state.session!;
  const box = $('#strands');
  box.innerHTML = '<div class="muted small">Factorising the spectrogram into 10 strands…</div><div class="progress"><div id="nmf-p"></div></div>';
  const btn = $('#btn-nmf') as HTMLButtonElement;
  btn.disabled = true;
  try {
    const r = await runWorker<NmfResult>({ type: 'nmf', mag: s.spec.mag, frames: s.frames, K: 10, iters: 80 }, (m) => {
      const p = document.getElementById('nmf-p');
      if (p) p.style.width = `${m.progress * 100}%`;
    });
    if (state.session !== s) return;
    nmfResult = r;
    renderStrands();
  } finally {
    btn.disabled = false;
  }
};

function renderStrands() {
  const s = state.session!;
  const r = nmfResult;
  const box = $('#strands');
  if (!r) return;
  box.innerHTML = '<div class="muted small">Strands sorted by pitch. ▶ listen, + add to active layer.</div>';
  const order = [...Array(r.K).keys()].sort((a, b) => basisCentroidHz(r, a) - basisCentroidHz(r, b));
  for (const k of order) {
    const row = document.createElement('div');
    row.className = 'strand';
    const cv = document.createElement('canvas');
    cv.width = 120;
    cv.height = 30;
    drawStrand(cv, r, k);
    const hz = basisCentroidHz(r, k);
    let act = 0;
    for (let t = 0; t < r.frames; t++) act += r.H[k * r.frames + t];
    row.appendChild(cv);
    const info = document.createElement('span');
    info.className = 'mono small';
    info.textContent = `~${hz >= 1000 ? (hz / 1000).toFixed(1) + 'k' : hz.toFixed(0)} Hz`;
    row.appendChild(info);
    const acts = document.createElement('span');
    acts.innerHTML = `<button class="icon-btn" data-a="p" title="Listen">▶</button><button class="icon-btn" data-a="a" title="Add to active layer">+</button>`;
    acts.onclick = (e) => {
      const a = (e.target as HTMLElement).closest('[data-a]')?.getAttribute('data-a');
      const mask = nmfComponentMask(r, k);
      if (a === 'p') playBuffer(istft(s.spec, mask, CLIP_LEN), 'nmf-' + k, '#play-layer');
      if (a === 'a') {
        snapshot();
        const li = ensureLayer();
        const L = s.layers[li];
        for (let i = 0; i < mask.length; i++) {
          const v = mask[i];
          L.mask[i] += v * (1 - L.mask[i]);
          if (opts.exclusive) for (let j = 0; j < s.layers.length; j++) if (j !== li) s.layers[j].mask[i] *= 1 - v;
        }
        afterEdit();
      }
    };
    row.appendChild(acts);
    box.appendChild(row);
  }
}

function drawStrand(cv: HTMLCanvasElement, r: NmfResult, k: number) {
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(cv.width, cv.height);
  let max = 0;
  const val = (x: number, y: number) => {
    const t = Math.floor((x / cv.width) * r.frames);
    const f = Math.floor(((cv.height - 1 - y) / cv.height) ** 2 * (N_BINS - 1));
    return r.W[k * N_BINS + f] * r.H[k * r.frames + t];
  };
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) max = Math.max(max, val(x, y));
  for (let y = 0; y < cv.height; y++)
    for (let x = 0; x < cv.width; x++) {
      const v = Math.max(0, 1 + Math.log10(val(x, y) / max + 1e-9) / 3);
      const i = (y * cv.width + x) * 4;
      img.data[i] = 40 + 120 * v;
      img.data[i + 1] = 60 + 190 * v;
      img.data[i + 2] = 70 + 120 * v;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
}

// ---------------- contribute ----------------
$('#btn-contribute').onclick = () => {
  const s = state.session!;
  const masks = s.classMasks((l) => l.origin !== 'ai');
  const useful = MODEL_CLASSES.filter((c) => masks[c]?.some((v) => v > 0.3));
  if (!useful.length) return toast('Nothing to contribute yet: separate at least one frog, hornet, chainsaw or cicada layer.', 'warn');
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
  toast(`Contributed <b>${useful.map((c) => CLASSES[c].label).join(', ')}</b> masks (${s.frames} frames). Open the Edge AI Lab to retrain.`);
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
  toast('The int8 edge model now listens to this clip. Blue-badged layers show what the sensor hears. Adopt and correct them.', 'info', 6000);
}

// ---------------- upload ----------------
($('#upload') as HTMLInputElement).onchange = async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  try {
    const x = await decodeUpload(f);
    player.stop();
    uploadName = f.name;
    fromDevice = false;
    const mixture: Mixture = { mix: x, stems: [], refs: {} };
    startSession(new Session(null, mixture));
    toast(`Loaded ${f.name}: first 5 s, resampled to 16 kHz mono like the edge node.`, 'info');
  } catch (err) {
    toast('Could not decode that file: ' + String(err), 'warn');
  }
  (e.target as HTMLInputElement).value = '';
};

setLabHooks({ deploy: deployToCurrent, refresh: () => renderNodes() });
$('#btn-lab').onclick = () => openLab();
$('#btn-eco').onclick = () => openEco();
// puzzles from the forest listening post (Python backend on port 8000)
mountPuzzles($('#panel'), {
  start: (s, name) => {
    player.stop();
    uploadName = name;
    fromDevice = true;
    startSession(s);
  },
});

// the 3D view changed theme, so layer colours may have changed
window.addEventListener('viz-theme', () => {
  if (!state.session) return;
  renderBrief();
  renderLayers();
  renderScores();
});

// ---------------- keyboard ----------------
window.addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type !== 'range' && (e.target as HTMLInputElement).type !== 'checkbox') return;
  if (!$('#lab').hidden || !$('#eco').hidden || !$('#intro').hidden) {
    if (e.key === 'Escape') ['#lab', '#eco', '#intro'].forEach((s) => ($(s).hidden = true));
    return;
  }
  const s = state.session;
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    return undo();
  }
  const k = e.key.toLowerCase();
  if (k === 'v') setTool('view');
  else if (k === 'b') setTool('brush');
  else if (k === 'f') setTool('fork');
  else if (k === 'k') setTool('knife');
  else if (k === 'e') setTool('echo');
  else if (k === ' ') {
    e.preventDefault();
    $('#play-mix').click();
  } else if (k === 'l') $('#play-layer').click();
  else if (k === 'r') $('#play-res').click();
  else if (k === '[') {
    opts.radius = Math.max(0.1, opts.radius - 0.05);
    renderToolOptions();
  } else if (k === ']') {
    opts.radius = Math.min(1.5, opts.radius + 0.05);
    renderToolOptions();
  } else if (s && /^[1-9]$/.test(k) && +k <= s.layers.length) {
    s.activeLayer = +k - 1;
    renderLayers();
  }
});

// ---------------- boot ----------------
async function boot() {
  const returning = load();
  await loadLevel(0);
  setTool('brush');
  if (!returning) showIntro();
}
boot().catch((err) => {
  console.error(err);
  toast('Failed to start: ' + String(err), 'warn', 10000);
});
