import { CLIP_LEN, istft } from '../dsp/stft';
import { melFilterbank, melToMask, N_MELS, siSdr } from '../dsp/analysis';
import { CLASSES, MODEL_CLASSES } from '../game/catalog';
import { LEVELS, loadAllSources, mixLevel } from '../game/levels';
import { Session } from '../game/session';
import { runWorker } from '../ml/client';
import { makeItem } from '../ml/dataset';
import {
  exportHeader, INT8_BYTES, MACS_PER_INFERENCE, N_CLS, N_HID, N_IN, N_OUT, PARAM_COUNT, predictClip,
  type DataItem, type FloatModel, type QuantModel,
} from '../ml/model';
import { state, type EvalRow } from '../state';
import { toast } from './toast';

let hooks = { deploy: () => {}, refresh: () => {} };
export const setLabHooks = (h: typeof hooks) => (hooks = h);

let busy: string | null = null;
let progress = 0;
let deployed = false;
let epochs = 12;
const levelSessions = new Map<string, Session>();

const lab = () => document.getElementById('lab')!;

export function openLab() {
  lab().hidden = false;
  render();
}

export function renderLabIfOpen() {
  if (!lab().hidden) render();
}

function counts() {
  const human = state.dataset.filter((d) => d.origin === 'player');
  const sim = state.dataset.filter((d) => d.origin === 'sim');
  const frames = state.dataset.reduce((a, d) => a + d.frames, 0);
  const perClass = MODEL_CLASSES.map((_, c) =>
    state.dataset.filter((d) => {
      const o = c * d.frames * N_MELS;
      for (let i = 0; i < d.frames * N_MELS; i++) if (d.target[o + i] > 0.5) return true;
      return false;
    }).length,
  );
  return { human: human.length, sim: sim.length, frames, perClass };
}

function render() {
  const c = counts();
  const m = state.model;
  const steps = [
    ['Edge node', 'Nano 33 BLE Sense records 5 s at 16 kHz', true],
    ['3D spectrogram', 'STFT 512 / hop 128, beamed to the game', true],
    ['Human untangling', `${c.human} clips separated by players`, c.human > 0],
    ['Training set', `${c.human + c.sim} clips · ${c.frames.toLocaleString()} frames`, c.human + c.sim > 0],
    ['Train + int8', m ? `round ${m.round} · ${(INT8_BYTES / 1024).toFixed(1)} KB` : 'not trained yet', !!m],
    ['OTA to sensors', deployed ? 'model listening on the node' : 'waiting for a model', deployed],
  ] as const;
  const evalRounds = [...new Set(state.evals.map((e) => e.round))].sort((a, b) => a - b);
  const lastRounds = evalRounds.slice(-3);
  const evalKeys = [...new Set(state.evals.map((e) => `${e.level}|${e.cls}`))];
  const evalRows = evalKeys
    .map((key) => {
      const [level, cls] = key.split('|');
      const rows = state.evals.filter((e) => e.level === level && e.cls === cls);
      const any = rows[0];
      const cells = lastRounds
        .map((r) => {
          const row = rows.find((x) => x.round === r);
          if (!row) return '<td class="num">–</td>';
          const d = row.ai - row.baseline;
          return `<td class="num ${d > 0 ? 'pos' : 'neg'}">${row.ai.toFixed(1)} <span class="muted">(${d >= 0 ? '+' : ''}${d.toFixed(1)})</span></td>`;
        })
        .join('');
      return `<tr><td>${level}</td><td><span style="color:${CLASSES[cls as keyof typeof CLASSES].color}">●</span> ${CLASSES[cls as keyof typeof CLASSES].label}</td><td class="num">${any.baseline.toFixed(1)}</td>${cells}<td class="num">${any.oracle.toFixed(1)}</td></tr>`;
    })
    .join('');

  lab().innerHTML = `<div class="sheet">
    <button class="btn ghost close" id="lab-close">Close ✕</button>
    <h2>Edge AI Lab</h2>
    <p class="lead">Every untangled spectrogram becomes a ground-truth source-separation mask. Here those masks train a tiny mask-estimation network, which is quantised to int8 and pushed back to the Arduino nodes. The sensor learns to hear rare species through rain and wind.</p>
    <div class="pipeline">${steps.map(([t, d, on]) => `<div class="pipe-step ${on ? 'on' : ''}"><b>${t}</b><span class="muted">${d}</span></div>`).join('')}</div>
    <div class="lab-grid">
      <div class="card">
        <h4>Training set</h4>
        <div class="kv">
          <span>Human-untangled clips (weight 2x)</span><span>${c.human}</span>
          <span>Simulated community clips</span><span>${c.sim}</span>
          <span>Frames (8 ms each)</span><span>${c.frames.toLocaleString()}</span>
          ${MODEL_CLASSES.map((cl, i) => `<span>Clips with ${CLASSES[cl].label.toLowerCase()}</span><span>${c.perClass[i]}</span>`).join('')}
        </div>
        <div class="lab-actions">
          <button class="btn" id="lab-sim" ${busy ? 'disabled' : ''}>+ 40 simulated community clips</button>
          <button class="btn ghost" id="lab-export" ${state.dataset.length ? '' : 'disabled'}>Export dataset (.json)</button>
        </div>
        <p class="muted small">Simulated clips stand in for a crowd of players: random re-mixes of the stems, labelled with imperfect human-like masks (soft-thresholded ideal masks with missed regions).</p>
      </div>
      <div class="card">
        <h4>TinyML model</h4>
        <div class="kv">
          <span>Input</span><span>5 frames × 32 log-mel = ${N_IN}</span>
          <span>Hidden</span><span>${N_HID} ReLU</span>
          <span>Output</span><span>${N_CLS} classes × 32 mel masks = ${N_OUT}</span>
          <span>Parameters</span><span>${PARAM_COUNT.toLocaleString()}</span>
          <span>int8 footprint</span><span>${(INT8_BYTES / 1024).toFixed(1)} KB of 1 MB flash</span>
          <span>MACs per 8 ms frame</span><span>${MACS_PER_INFERENCE.toLocaleString()}</span>
          <span>Trained on</span><span>${m ? `${m.trainedOn.human} human + ${m.trainedOn.sim} sim` : '–'}</span>
        </div>
        <div class="lab-actions">
          <label class="slider">Epochs <input type="range" id="lab-epochs" min="4" max="30" step="1" value="${epochs}"><span class="mono">${epochs}</span></label>
          <button class="btn primary" id="lab-train" ${busy || !state.dataset.length ? 'disabled' : ''}>${m ? 'Retrain' : 'Train'} edge model</button>
        </div>
        <canvas class="loss" id="lab-loss" width="600" height="160"></canvas>
        ${busy ? `<div class="muted small" style="margin-top:6px">${busy}</div><div class="progress"><div style="width:${progress * 100}%"></div></div>` : ''}
      </div>
    </div>
    <div class="card" style="margin-top:14px">
      <div class="card-head"><h4>Does the sensor hear better? SI-SDR (dB) of the int8 model's masks on every node</h4>
        <div class="lab-actions" style="margin:0">
          <button class="btn" id="lab-eval" ${busy || !m ? 'disabled' : ''}>Evaluate on all nodes</button>
          <button class="btn primary" id="lab-deploy" ${!m ? 'disabled' : ''}>Push to current node</button>
          <button class="btn ghost" id="lab-header" ${!m ? 'disabled' : ''}>Download Arduino header</button>
        </div>
      </div>
      ${
        evalRows
          ? `<table class="eval"><thead><tr><th>Node</th><th>Target</th><th class="num">Raw mix</th>${lastRounds.map((r) => `<th class="num">Model round ${r}</th>`).join('')}<th class="num">STFT ceiling</th></tr></thead><tbody>${evalRows}</tbody></table>
             <p class="muted small">Positive numbers in brackets = dB improvement over the raw mixture. The ceiling is the ideal ratio mask at full STFT resolution. The model works on 32 mel bands, so it trades some ceiling for a 19 KB footprint.</p>`
          : '<p class="muted small">Train a model, then evaluate it. Each retraining round adds a column, so you can watch the sensor improve as players contribute.</p>'
      }
    </div>
  </div>`;

  drawLoss();
  const $ = (id: string) => document.getElementById(id) as HTMLButtonElement;
  $('lab-close').onclick = () => (lab().hidden = true);
  $('lab-sim').onclick = simulate;
  $('lab-export').onclick = exportDataset;
  $('lab-train').onclick = trainModel;
  $('lab-eval').onclick = evaluate;
  $('lab-deploy').onclick = () => {
    deployed = true;
    lab().hidden = true;
    hooks.deploy();
  };
  $('lab-header').onclick = downloadHeader;
  const ep = document.getElementById('lab-epochs') as HTMLInputElement;
  ep.oninput = () => {
    epochs = +ep.value;
    (ep.nextElementSibling as HTMLElement).textContent = ep.value;
  };
}

lab().addEventListener('click', (e) => {
  if (e.target === lab()) lab().hidden = true;
});

function drawLoss() {
  const cv = document.getElementById('lab-loss') as HTMLCanvasElement | null;
  if (!cv) return;
  const ctx = cv.getContext('2d')!;
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = '#4a6b78';
  ctx.font = '12px JetBrains Mono, monospace';
  const L = state.losses;
  if (!L.length) {
    ctx.fillText('training loss (binary cross-entropy) appears here', 14, 24);
    return;
  }
  const max = Math.max(...L);
  const min = Math.min(...L);
  ctx.fillText(`BCE loss ${L[L.length - 1].toFixed(4)}`, 14, 20);
  ctx.strokeStyle = '#9be15d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  L.forEach((v, i) => {
    const x = 14 + ((cv.width - 28) * i) / Math.max(1, L.length - 1);
    const y = 34 + (cv.height - 48) * (1 - (v - min) / (max - min || 1));
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.stroke();
}

async function simulate() {
  busy = 'Mixing stems and labelling 40 community clips…';
  progress = 0;
  render();
  try {
    const sources = await loadAllSources();
    const items = await runWorker<DataItem[]>({ type: 'simulate', sources, n: 40, seed: (Date.now() & 0xffff) + state.dataset.length }, (m) => {
      progress = m.progress;
      render();
    });
    state.dataset.push(...items);
    toast(`Added ${items.length} simulated community clips.`, 'info');
  } catch (e) {
    toast('Simulation failed: ' + String(e), 'warn');
  }
  busy = null;
  hooks.refresh();
  render();
}

async function trainModel() {
  busy = 'Training in a Web Worker…';
  progress = 0;
  state.losses = [];
  render();
  try {
    const human = state.dataset.filter((d) => d.origin === 'player').length;
    const sim = state.dataset.length - human;
    const r = await runWorker<{ model: FloatModel; quant: QuantModel }>({ type: 'train', items: state.dataset, epochs }, (msg) => {
      progress = msg.progress;
      if (msg.loss !== undefined) state.losses.push(msg.loss);
      busy = `Epoch ${msg.epoch}/${epochs}`;
      render();
    });
    const round = (state.model?.round ?? 0) + 1;
    state.model = { f: r.model, q: r.quant, round, trainedOn: { human, sim } };
    busy = null;
    toast(`Model round ${round} trained and quantised to int8. Evaluating on all nodes…`, 'info');
    await evaluate();
  } catch (e) {
    busy = null;
    toast('Training failed: ' + String(e), 'warn');
  }
  render();
}

async function levelSession(id: string) {
  let s = levelSessions.get(id);
  if (!s) {
    const level = LEVELS.find((l) => l.id === id)!;
    s = new Session(level, await mixLevel(level));
    levelSessions.set(id, s);
  }
  return s;
}

/** Normalised linear-bin masks per class from the int8 model. */
export function modelMasks(s: Session, q: QuantModel) {
  const fb = melFilterbank();
  const feat = makeItem(s.spec.mag, s.frames, {}, 'player', '').feat;
  const out = predictClip(feat, s.frames, { q });
  const masks = MODEL_CLASSES.map((_, c) => melToMask(out.subarray(c * s.frames * N_MELS, (c + 1) * s.frames * N_MELS), s.frames, fb));
  const n = masks[0].length;
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (const m of masks) sum += m[i];
    if (sum > 1) for (const m of masks) m[i] /= sum;
  }
  return masks;
}

async function evaluate() {
  const m = state.model;
  if (!m) return;
  busy = 'Evaluating on every node…';
  render();
  state.evals = state.evals.filter((e) => e.round !== m.round);
  for (const level of LEVELS) {
    const s = await levelSession(level.id);
    const masks = modelMasks(s, m.q);
    const base = s.scores(() => false);
    for (const sc of base) {
      const c = MODEL_CLASSES.indexOf(sc.cls);
      if (c < 0) continue;
      const est = istft(s.spec, masks[c], CLIP_LEN);
      const row: EvalRow = { round: m.round, level: `${level.node} ${level.title}`, cls: sc.cls, baseline: sc.baseline, ai: siSdr(est, s.mixture.refs[sc.cls]!), oracle: sc.oracle };
      state.evals.push(row);
    }
    await new Promise((r) => setTimeout(r, 0));
  }
  busy = null;
  render();
}

function download(name: string, text: string, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function downloadHeader() {
  const m = state.model;
  if (!m) return;
  const frames = state.dataset.reduce((a, d) => a + d.frames, 0);
  download('biospectra_model.h', exportHeader(m.q, MODEL_CLASSES, { samples: frames, clips: state.dataset.length }));
}

function exportDataset() {
  const enc = (a: Float32Array, scale: number, offset: number) => {
    const u = Uint8Array.from(a, (v) => Math.max(0, Math.min(255, Math.round((v + offset) * scale))));
    let s = '';
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const payload = {
    format: 'biospectra-masks/1',
    sample_rate: 16000,
    stft: { n_fft: 512, hop: 128, window: 'hann' },
    mel: { n_mels: N_MELS, fmin: 50, fmax: 8000 },
    classes: MODEL_CLASSES,
    encoding: { features: 'uint8 = round(dB + 140)', masks: 'uint8 = round(mask * 255), class-major [class][frame][mel]' },
    items: state.dataset.map((d) => ({ label: d.label, origin: d.origin, frames: d.frames, features: enc(d.feat, 1, 140), masks: enc(d.target, 255, 0) })),
  };
  download('biospectra_dataset.json', JSON.stringify(payload), 'application/json');
}
