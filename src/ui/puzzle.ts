import { BIN_HZ, CLIP_LEN, CLIP_SECONDS, FRAME_SEC, N_BINS, SR } from '../dsp/stft';
import { Backend, type GridInfo, type Puzzle } from '../game/backend';
import { Session } from '../game/session';
import { toast } from './toast';

/**
 * Puzzles from the forest listening post, played in the 3D view.
 *
 * A backend event can be up to 30 s long, the 3D view shows 5 s. The event is
 * cut into 5 s windows that the player switches between. Each window keeps its
 * own painting. On submit, all windows are merged into one mask on the
 * backend's spectrogram grid and sent with the chosen label.
 */
export interface PuzzleHooks {
  /** show this session in the 3D view (name goes on the node card) */
  start(s: Session, name: string): void;
}

interface Win {
  start: number; // seconds into the event
  session: Session;
}

export function mountPuzzles(card: HTMLElement, hooks: PuzzleHooks) {
  const be = new Backend();
  card.classList.add('puzzle-card');

  let online = false;
  let busy = false;
  let puzzle: Puzzle | null = null;
  let grid: GridInfo | null = null;
  let wins: Win[] = [];
  let active = 0;
  let label = '';
  /** one short line for the player: what happened last, never technical details */
  let message = '';
  /** events skipped or answered here, so Skip moves on to a different one */
  const seen = new Set<string>();

  const note = (msg: string) => {
    message = msg;
    render();
  };

  const painted = (s: Session) => s.layers.some((l) => l.mask.some((v) => v > 0.05));

  function render() {
    let body: string;
    if (!puzzle) {
      body = `<p class="muted small">${message || (online ? 'Recordings the listening posts could not recognize are waiting for you.' : 'No recordings to label right now.')}</p>
        <button class="btn primary wide" id="pz-next" ${busy || !online ? 'disabled' : ''}>${busy ? 'Loading…' : 'Next recording'}</button>`;
    } else {
      const chips = wins
        .map((w, i) => `<button class="pz-win ${i === active ? 'on' : ''}" data-win="${i}" title="Show this part of the recording">${painted(w.session) ? '● ' : ''}${w.start.toFixed(0)}–${(w.start + CLIP_SECONDS).toFixed(0)} s</button>`)
        .join('');
      body = `${wins.length > 1 ? `<div class="pz-wins">${chips}</div>` : ''}
        <div class="pz-row"><span>Label</span><select id="pz-label" aria-label="Label">${puzzle.labels.map((l) => `<option ${l === label ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <button class="btn ghost" id="pz-skip" ${busy ? 'disabled' : ''} title="Load the next recording without answering">Skip</button></div>
        <p class="muted small">Paint the sound with any tool. Unpainted means the whole event.</p>
        <button class="btn primary wide" id="pz-send" ${busy ? 'disabled' : ''} title="Send the painted mask of all parts with this label">Send label</button>`;
    }
    card.innerHTML = `<div class="card-head"><h3>Labeling</h3></div>${body}`;
    bind();
  }

  function bind() {
    const q = <T extends HTMLElement>(id: string) => card.querySelector<T>('#' + id);
    const next = q('pz-next');
    if (next) next.onclick = () => void load();
    const skip = q('pz-skip');
    if (skip)
      skip.onclick = () => {
        if (puzzle) seen.add(puzzle.clip_id);
        void load();
      };
    const send = q('pz-send');
    if (send) send.onclick = () => void submit();
    const sel = q<HTMLSelectElement>('pz-label');
    if (sel) sel.onchange = () => (label = sel.value);
    card.querySelectorAll<HTMLButtonElement>('[data-win]').forEach((b) => {
      b.onclick = () => show(+b.dataset.win!);
    });
  }

  function show(i: number) {
    active = i;
    const w = wins[i];
    hooks.start(w.session, `${w.start.toFixed(0)}–${(w.start + CLIP_SECONDS).toFixed(0)} s`);
    render();
  }

  async function load() {
    busy = true;
    render();
    try {
      const p = await be.nextPuzzleExcept(seen);
      if (!p) {
        const skipped = puzzle !== null || seen.size > 0;
        puzzle = null;
        wins = [];
        if (skipped && seen.size) {
          // nothing else is open: start over with the skipped ones
          seen.clear();
          note('No other open puzzles. Press the button again to go back to the skipped ones.');
        } else note('No open puzzles right now. Let the post listen a bit longer.');
        return;
      }
      const [x, g] = await Promise.all([be.audio(p), be.grid(p)]);
      puzzle = p;
      grid = g;
      label = p.labels[0];
      // 5 s windows, the last one aligned to the end of the event
      const dur = x.length / SR;
      const n = Math.max(1, Math.ceil(dur / CLIP_SECONDS - 0.05));
      const starts = Array.from({ length: n }, (_, i) => (i === n - 1 ? Math.max(0, dur - CLIP_SECONDS) : i * CLIP_SECONDS));
      wins = starts.map((start) => {
        const mix = new Float32Array(CLIP_LEN);
        const s0 = Math.round(start * SR);
        mix.set(x.subarray(s0, Math.min(x.length, s0 + CLIP_LEN)));
        let peak = 0;
        for (let i = 0; i < mix.length; i++) peak = Math.max(peak, Math.abs(mix[i]));
        if (peak > 0) for (let i = 0; i < mix.length; i++) mix[i] *= 0.8 / peak;
        return { start, session: new Session(null, { mix, stems: [], refs: {} }) };
      });
      // open on the loudest window, where the sound most likely is
      let best = 0;
      let bestE = -1;
      wins.forEach((w, i) => {
        let e = 0;
        const m = w.session.mixture.mix;
        for (let k = 0; k < m.length; k += 4) e += m[k] * m[k];
        if (e > bestE) {
          bestE = e;
          best = i;
        }
      });
      message = '';
      show(best);
    } catch (e) {
      console.warn('puzzle load failed', e);
      note('This recording could not be loaded. Try the next one.');
    } finally {
      busy = false;
      render();
    }
  }

  /** Merge the painting of every window into one mask on the backend's grid. */
  function buildGrid(): number[][] | null {
    if (!grid) return null;
    const g = grid;
    const out = Array.from({ length: g.rows }, () => new Array<number>(g.cols).fill(0));
    const upper = (arr: number[], v: number) => {
      let lo = 0;
      let hi = arr.length;
      while (lo < hi) {
        const m = (lo + hi) >> 1;
        if (arr[m] <= v) lo = m + 1;
        else hi = m;
      }
      return lo - 1;
    };
    const rowOfBin = Int32Array.from({ length: N_BINS }, (_, k) => upper(g.freqs, k * BIN_HZ));
    let any = false;
    for (const w of wins) {
      const s = w.session;
      for (let t = 0; t < s.frames; t++) {
        const sec = w.start + t * FRAME_SEC;
        if (sec > g.duration_s) break;
        const c = upper(g.times, sec);
        if (c < 0) continue;
        for (let k = 0; k < N_BINS; k++) {
          const r = rowOfBin[k];
          if (r < 0) continue;
          let m = 0;
          for (const l of s.layers) m = Math.max(m, l.mask[t * N_BINS + k]);
          if (m > out[r][c]) {
            out[r][c] = m;
            if (m > 0.05) any = true;
          }
        }
      }
    }
    if (!any) return null;
    return out.map((row) => row.map((v) => Math.round(v * 100) / 100));
  }

  async function submit() {
    if (!puzzle) return;
    busy = true;
    render();
    try {
      const mask = buildGrid();
      const r = await be.submit(puzzle.clip_id, label, mask);
      seen.add(puzzle.clip_id);
      if (r.gold) toast(r.correct ? `Well done. It was <b>${r.true_label}</b>.` : `Good try. This one was <b>${r.true_label}</b>.`, 'info');
      else if (r.accepted) toast(`Thank you. Your label <b>${label}</b> was accepted.`, 'info');
      else toast('Thank you. Your label counts once a few more people agree.', 'info');
      if (!mask) toast('No painting found, so the whole event was sent.', 'info');
      puzzle = null;
      wins = [];
      await load();
    } catch (e) {
      console.warn('label submit failed', e);
      toast('Your label could not be sent. Please try again.', 'warn');
    } finally {
      busy = false;
      render();
    }
  }

  // live status from the backend
  const connect = async () => {
    try {
      await be.stats();
      if (!online) {
        online = true;
        render();
        be.listen((ev) => {
          if (ev.type === 'device_updated') toast('A listening post just learned from your labels.', 'info', 6000);
          if (ev.type === 'clip_received' && !puzzle) note('A new recording is waiting for you.');
        });
      }
    } catch {
      online = false;
      render();
      setTimeout(connect, 5000);
    }
  };
  render();
  void connect();
  return {
    /** load the next live recording (used by the welcome screen) */
    next: () => void load(),
  };
}
