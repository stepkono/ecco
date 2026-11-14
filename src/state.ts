import type { DataItem, FloatModel, QuantModel } from './ml/model';
import type { Session } from './game/session';
import type { SourceId } from './game/catalog';

export interface EvalRow {
  round: number;
  level: string;
  cls: string;
  baseline: number;
  ai: number;
  oracle: number;
}

export const state = {
  session: null as Session | null,
  levelIdx: 0,
  dataset: [] as DataItem[],
  model: null as null | { f: FloatModel; q: QuantModel; round: number; trainedOn: { human: number; sim: number } },
  losses: [] as number[],
  evals: [] as EvalRow[],
  unlocked: new Set<SourceId>(),
  completed: new Set<string>(),
};

const KEY = 'biospectra.v1';

// ---- compact persistence for human contributions (uint8 quantised) ----
const b64 = (u: Uint8Array) => {
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function packItem(it: DataItem) {
  const f = Uint8Array.from(it.feat, (v) => Math.max(0, Math.min(255, Math.round(v + 140))));
  const t = Uint8Array.from(it.target, (v) => Math.round(v * 255));
  return { f: b64(f), t: b64(t), n: it.frames, l: it.label };
}

function unpackItem(p: { f: string; t: string; n: number; l: string }): DataItem {
  return {
    feat: Float32Array.from(unb64(p.f), (v) => v - 140),
    target: Float32Array.from(unb64(p.t), (v) => v / 255),
    frames: p.n,
    origin: 'player',
    label: p.l,
  };
}

export function save() {
  try {
    const human = state.dataset.filter((d) => d.origin === 'player').slice(-25).map(packItem);
    localStorage.setItem(
      KEY,
      JSON.stringify({ unlocked: [...state.unlocked], completed: [...state.completed], human }),
    );
  } catch {
    /* storage full or blocked: the session still works */
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    state.unlocked = new Set(d.unlocked ?? []);
    state.completed = new Set(d.completed ?? []);
    state.dataset = (d.human ?? []).map(unpackItem);
    return true;
  } catch {
    return false;
  }
}

export function resetProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
