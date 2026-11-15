import { SR } from '../dsp/stft';

/**
 * Client for the Python backend (backend/app.py, FastAPI on port 8000).
 * The listening post uploads uncertain sound events there. The game fetches
 * them as puzzles, lets the player carve the sound in 3D, and sends the mask
 * back as a label. The backend turns accepted labels into new prototypes that
 * the post downloads.
 */
export interface Puzzle {
  clip_id: string;
  duration_s: number;
  labels: string[];
  audio_url: string;
  spectrogram_url: string;
}

/** The backend's pooled spectrogram grid. Masks are sent on this grid. */
export interface GridInfo {
  rows: number; // frequency, low to high
  cols: number; // time
  freqs: number[]; // lower edge of each row, Hz
  times: number[]; // start of each column, s
  duration_s: number;
}

export interface LabelResult {
  clip_id: string;
  gold: boolean;
  correct?: boolean;
  true_label?: string;
  accepted?: boolean;
  votes?: Record<string, number>;
  needed?: number;
  learned?: boolean;
  learning_paused?: boolean;
  prototype_version?: number;
}

const PLAYER_KEY = 'biospectra.backend.player';

export function backendUrl() {
  const q = new URLSearchParams(location.search).get('backend');
  if (q) return q.replace(/\/$/, '');
  return `${location.protocol}//${location.hostname}:8000`;
}

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error(`${r.status} ${await r.text().catch(() => '')}`.trim());
  return (await r.json()) as T;
}

export class Backend {
  readonly base = backendUrl();
  playerId: string | null = null;

  async stats() {
    return json<Record<string, unknown>>(await fetch(`${this.base}/stats`));
  }

  /** Reuse the stored player id, or register a new player. */
  async player(nickname = '3d-player') {
    if (this.playerId) return this.playerId;
    let id: string | null = null;
    try {
      id = localStorage.getItem(PLAYER_KEY);
    } catch {
      /* storage blocked */
    }
    if (id) {
      // the backend may have been reset: check the id still works
      const r = await fetch(`${this.base}/puzzles/next?player_id=${encodeURIComponent(id)}`);
      if (r.status === 404) id = null;
    }
    if (!id) {
      const r = await json<{ player_id: string }>(
        await fetch(`${this.base}/players`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname }) }),
      );
      id = r.player_id;
      try {
        localStorage.setItem(PLAYER_KEY, id);
      } catch {
        /* storage blocked */
      }
    }
    this.playerId = id;
    return id;
  }

  /** null when there is no open puzzle. */
  async nextPuzzle(): Promise<Puzzle | null> {
    const id = await this.player();
    const r = await fetch(`${this.base}/puzzles/next?player_id=${encodeURIComponent(id)}`);
    if (r.status === 204) return null;
    return json<Puzzle>(r);
  }

  /**
   * The next open puzzle that is not in `avoid`. The backend always serves the
   * most-heard open event first, so after a skip it would hand out the same one
   * again. Then this falls back to the other open events, newest first.
   */
  async nextPuzzleExcept(avoid: Set<string>): Promise<Puzzle | null> {
    const first = await this.nextPuzzle();
    if (!first || !avoid.has(first.clip_id)) return first;
    const events = await json<{ type: string; clip_id?: string }[]>(await fetch(`${this.base}/events?limit=500`));
    const ids = [...new Set(events.filter((e) => e.type === 'clip_received' && e.clip_id).map((e) => e.clip_id!).reverse())];
    for (const id of ids) {
      if (avoid.has(id)) continue;
      const r = await fetch(`${this.base}/clips/${encodeURIComponent(id)}`);
      if (!r.ok) continue;
      const c = (await r.json()) as { status: string; duration_s: number };
      if (c.status !== 'open') continue;
      return { clip_id: id, duration_s: c.duration_s, labels: first.labels, audio_url: `/clips/${id}/audio`, spectrogram_url: `/clips/${id}/spectrogram` };
    }
    return null;
  }

  /** Clip audio, resampled to the game's 16 kHz mono. */
  async audio(p: Puzzle): Promise<Float32Array> {
    const buf = await (await fetch(this.base + p.audio_url)).arrayBuffer();
    const ctx = new AudioContext();
    const decoded = await ctx.decodeAudioData(buf);
    await ctx.close();
    const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * SR)), SR);
    const node = off.createBufferSource();
    node.buffer = decoded;
    node.connect(off.destination);
    node.start();
    return (await off.startRendering()).getChannelData(0).slice();
  }

  async grid(p: Puzzle): Promise<GridInfo> {
    const g = await json<GridInfo & { db?: unknown }>(await fetch(this.base + p.spectrogram_url));
    delete g.db; // the game computes its own spectrogram
    return g;
  }

  async submit(clipId: string, label: string, grid: number[][] | null): Promise<LabelResult> {
    const id = await this.player();
    return json<LabelResult>(
      await fetch(`${this.base}/clips/${encodeURIComponent(clipId)}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: id, label, mask: grid ? { grid } : null }),
      }),
    );
  }

  /** Live backend events (label_accepted, prototype_published, device_updated, ...). */
  listen(on: (ev: { type: string; [k: string]: unknown }) => void) {
    const es = new EventSource(`${this.base}/events/stream`);
    es.onmessage = (m) => {
      try {
        on(JSON.parse(m.data));
      } catch {
        /* keep-alive or malformed */
      }
    };
    return es;
  }
}
