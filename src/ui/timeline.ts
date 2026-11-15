import { SR } from '../dsp/stft';
import type { Transport } from '../audio/transport';

/**
 * DJ-style timeline at the bottom of the stage.
 *
 * The waveform scrolls past a fixed needle in the middle while the clip plays.
 * Press and hold: the recording stops under your hand. Push right to play forward,
 * push left to rewind, like a jog wheel. Let go with a flick and the recording keeps
 * that speed, slows down, and then carries on playing (or rests, when paused).
 */
/** +1: pushing right plays forward and pushing left rewinds (jog wheel). -1 flips it. */
export const JOG_DIRECTION = 1;
/** seconds of audio visible across the timeline */
const VISIBLE_SEC = 3;

export class Timeline {
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private peaks = new Float32Array(0);
  private peaksPerSec = 200;
  private drag: { x: number; pos: number; samples: { t: number; pos: number }[] } | null = null;
  private colors = { wave: '#56c8ff', played: '#9be15d', needle: '#ffffff', tick: 'rgba(255,255,255,0.14)', bg: 'rgba(255,255,255,0.03)' };

  private transport: Transport;

  constructor(host: HTMLElement, transport: Transport) {
    this.transport = transport;
    this.cv = document.createElement('canvas');
    this.cv.className = 'timeline-canvas';
    this.cv.title = 'Hold to stop. Push right to play forward, push left to rewind. Flick to throw.';
    host.appendChild(this.cv);
    this.ctx = this.cv.getContext('2d')!;
    this.cv.addEventListener('pointerdown', (e) => this.down(e));
    this.cv.addEventListener('pointermove', (e) => this.move(e));
    this.cv.addEventListener('pointerup', (e) => this.up(e));
    this.cv.addEventListener('pointercancel', (e) => this.up(e));
    const loop = () => {
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /** New audio to show (peaks are recomputed). */
  setAudio(x: Float32Array) {
    const per = Math.round(SR / this.peaksPerSec);
    const n = Math.ceil(x.length / per);
    const p = new Float32Array(n);
    let max = 1e-6;
    for (let i = 0; i < n; i++) {
      let m = 0;
      for (let j = i * per; j < Math.min(x.length, (i + 1) * per); j++) m = Math.max(m, Math.abs(x[j]));
      p[i] = m;
      max = Math.max(max, m);
    }
    for (let i = 0; i < n; i++) p[i] = Math.sqrt(p[i] / max);
    this.peaks = p;
  }

  setColors(c: Partial<Timeline['colors']>) {
    Object.assign(this.colors, c);
  }

  private pxPerSec() {
    return this.cv.clientWidth / VISIBLE_SEC;
  }

  private down(e: PointerEvent) {
    if (e.button !== 0) return;
    try {
      this.cv.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointers cannot be captured */
    }
    this.transport.hold();
    const pos = this.transport.position;
    this.drag = { x: e.clientX, pos, samples: [{ t: performance.now(), pos }] };
    this.cv.classList.add('held');
  }

  private move(e: PointerEvent) {
    if (!this.drag) return;
    const pos = this.drag.pos + (JOG_DIRECTION * (e.clientX - this.drag.x)) / this.pxPerSec();
    this.transport.drag(pos);
    const s = this.drag.samples;
    s.push({ t: performance.now(), pos: this.transport.position });
    while (s.length > 2 && s[s.length - 1].t - s[0].t > 90) s.shift();
  }

  private up(e: PointerEvent) {
    if (!this.drag) return;
    this.move(e);
    const s = this.drag.samples;
    const a = s[0];
    const b = s[s.length - 1];
    const dt = (b.t - a.t) / 1000;
    // a flick: seconds of audio per second of hand movement
    const speed = dt > 0.012 && performance.now() - b.t < 80 ? (b.pos - a.pos) / dt : this.transport.playing ? 1 : 0;
    this.drag = null;
    this.cv.classList.remove('held');
    this.transport.release(speed);
  }

  private draw() {
    const cv = this.cv;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    const g = this.ctx;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const c = this.colors;
    const pos = this.transport.position;
    const dur = this.transport.duration;
    const pps = this.pxPerSec();
    const mid = w / 2;
    const waveH = h - 12;
    const cy = waveH / 2 + 2;

    // the clip's extent
    const x0 = mid + (0 - pos) * pps;
    const x1 = mid + (dur - pos) * pps;
    g.fillStyle = c.bg;
    g.fillRect(Math.max(0, x0), 2, Math.min(w, x1) - Math.max(0, x0), waveH);

    // waveform, already played in the second colour
    const step = 2;
    for (let x = 0; x < w; x += step) {
      const sec = pos + (x - mid) / pps;
      if (sec < 0 || sec > dur) continue;
      const v = this.peaks[Math.min(this.peaks.length - 1, Math.floor(sec * this.peaksPerSec))] ?? 0;
      const a = Math.max(1, v * (waveH / 2 - 2));
      g.fillStyle = x < mid ? c.played : c.wave;
      g.globalAlpha = x < mid ? 0.55 : 0.9;
      g.fillRect(x, cy - a, step - 0.6, a * 2);
    }
    g.globalAlpha = 1;

    // second marks
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.font = '10px JetBrains Mono, monospace';
    for (let s = Math.ceil(pos - VISIBLE_SEC); s <= pos + VISIBLE_SEC; s++) {
      if (s < 0 || s > dur) continue;
      const x = mid + (s - pos) * pps;
      g.fillRect(x, 2, 1, 5);
      g.fillText(`${s}s`, x + 3, 11);
    }

    // jog ticks under the waveform: they move with the hand
    const tickGap = 14;
    const off = (((JOG_DIRECTION * pos * pps) % tickGap) + tickGap) % tickGap;
    g.fillStyle = c.tick;
    for (let x = off - tickGap; x < w; x += tickGap) g.fillRect(x, h - 8, 2, 6);

    // the needle
    g.fillStyle = c.needle;
    g.fillRect(mid - 1, 0, 2, h);
    g.beginPath();
    g.moveTo(mid - 5, 0);
    g.lineTo(mid + 5, 0);
    g.lineTo(mid, 6);
    g.fill();
  }
}
