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
  /** show this session in the 3D view */
  start(s: Session, name: string): void;
  /** go to the next challenge of the list the player picked from */
  next(): void;
  /** practice clips: add the painted layers to the training set */
  contribute(): void;
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
  /** practice clip on screen (no live recording): its title */
  let practice: string | null = null;
  let labelOptions: string[] | null = null;

  const note = (msg: string) => {
    message = msg;
    render();
  };

  const painted = (s: Session) => s.layers.some((l) => l.mask.some((v) => v > 0.05));

  function render() {
    let body: string;
    let title = 'Labeling';
    if (practice !== null && !puzzle) {
      // practice clips have known answers: no label to send, the painting itself is the contribution
      title = 'Practice';
      body = `<p class="muted small">A practice clip with a known answer. Paint each sound into its own layer, then contribute it. The score below shows how clean your separation is.</p>
        <button class="btn primary wide" id="pz-contrib" title="Your painted layers become training examples for the model">Contribute to training set</button>
        <button class="btn wide" id="pz-next-ch">Next challenge →</button>`;
    } else if (!puzzle) {
      body = `<p class="muted small">${busy ? 'Loading the recording…' : message || 'Pick a recording on the challenges page.'}</p>`;
    } else {
      const chips = wins
        .map((w, i) => `<button class="pz-win ${i === active ? 'on' : ''}" data-win="${i}" title="Show seconds ${w.start.toFixed(0)} to ${(w.start + CLIP_SECONDS).toFixed(0)} of the recording. Each part keeps its own painting.">${painted(w.session) ? '● ' : ''}Part ${i + 1} · ${w.start.toFixed(0)}–${(w.start + CLIP_SECONDS).toFixed(0)} s</button>`)
        .join('');
      const total = puzzle.duration_s;
      body = `${wins.length > 1 ? `<p class="muted small">This recording is ${total.toFixed(0)} s long. The landscape shows ${CLIP_SECONDS.toFixed(0)} s at a time, so it comes in ${wins.length} parts.</p><div class="pz-wins">${chips}</div>` : ''}
        <div class="pz-row"><span>Label</span><select id="pz-label" aria-label="Label">${puzzle.labels.map((l) => `<option ${l === label ? 'selected' : ''}>${l}</option>`).join('')}</select>
</div>
        <p class="muted small">Paint the sound with any tool. Unpainted means the whole recording.</p>
        <button class="btn primary wide" id="pz-send" ${busy ? 'disabled' : ''} title="Send the painted part of all parts with this label">Send label</button>
        <button class="btn wide" id="pz-skip" ${busy ? 'disabled' : ''} title="Leave this one without an answer and open the next in your list">Next recording →</button>`;
    }
    card.innerHTML = `<div class="card-head"><h3>${title}</h3></div>${body}`;
    bind();
  }

  function bind() {
    const q = <T extends HTMLElement>(id: string) => card.querySelector<T>('#' + id);
    const skip = q('pz-skip');
    if (skip) skip.onclick = () => hooks.next();
    const nextCh = q('pz-next-ch');
    if (nextCh) nextCh.onclick = () => hooks.next();
    const contrib = q('pz-contrib');
    if (contrib) contrib.onclick = () => hooks.contribute();
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

  /** Open exactly this live recording. */
  async function open(clipId: string) {
    practice = null;
    puzzle = null;
    wins = [];
    busy = true;
    render();
    try {
      if (!labelOptions) labelOptions = ((await be.stats()) as { label_options?: string[] }).label_options ?? ['other'];
      const info = await (await fetch(`${be.base}/clips/${encodeURIComponent(clipId)}`)).json() as { duration_s: number | null };
      const opts = [...labelOptions.filter((l) => l !== 'other'), 'noise', 'other'].filter((l, i, a) => a.indexOf(l) === i);
      const p: Puzzle = { clip_id: clipId, duration_s: info.duration_s ?? 5, labels: opts, audio_url: `/clips/${clipId}/audio`, spectrogram_url: `/clips/${clipId}/spectrogram` };
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
      console.warn('recording load failed', e);
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
      if (r.gold) toast(r.correct ? `Well done. It was <b>${r.true_label}</b>.` : `Good try. This one was <b>${r.true_label}</b>.`, 'info');
      else if (r.accepted) toast(`Thank you. Your label <b>${label}</b> was accepted.`, 'info');
      else toast('Thank you. Your label counts once a few more people agree.', 'info');
      if (!mask) toast('No painting found, so the whole event was sent.', 'info');
      puzzle = null;
      wins = [];
      hooks.next();
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
          if (ev.type === 'clip_received') toast('A listening post sent a new recording. You find it on the challenges page.', 'info');
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
    open: (clipId: string) => void open(clipId),
    /** a practice clip is on screen: show its actions instead of a live recording */
    practice(title: string) {
      practice = title;
      puzzle = null;
      wins = [];
      render();
    },
  };
}
