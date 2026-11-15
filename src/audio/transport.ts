import { SR } from '../dsp/stft';

/**
 * Audio transport with a variable playback speed, including reverse.
 *
 * A small AudioWorklet reads the clip at a fractional position that moves by
 * `speed` samples per sample (1 = normal, 0 = still, -2 = rewind at double speed).
 * The speed glides to its target, so starting, stopping and scrubbing sound like
 * a record under a hand instead of clicking.
 *
 * Two ways to drive it:
 *  - rate mode: the target speed is set directly (play, pause, inertia after a throw)
 *  - follow mode: the head chases a target position (the hand holds the timeline)
 */
const WORKLET = `
class ScrubHead extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = null; this.pos = 0; this.speed = 0; this.target = 0;
    this.follow = false; this.followPos = 0; this.n = 0;
    this.port.onmessage = (e) => {
      const m = e.data;
      if (m.buf) { this.buf = m.buf; this.pos = Math.min(this.pos, this.buf.length - 1); }
      if (m.seek !== undefined) this.pos = m.seek;
      if (m.rate !== undefined) { this.target = m.rate; this.follow = false; }
      if (m.follow !== undefined) { this.follow = true; this.followPos = m.follow; }
      if (m.jump !== undefined) this.speed = m.jump;
    };
  }
  process(_in, outs) {
    const out = outs[0][0];
    const b = this.buf;
    if (!b) { out.fill(0); return true; }
    const ratio = ${SR} / sampleRate;
    const last = b.length - 1;
    let goal = this.target;
    if (this.follow) {
      // reach the hand's position in about 40 ms, never faster than 12x
      goal = Math.max(-12, Math.min(12, (this.followPos - this.pos) / (${SR} * 0.04)));
      if (Math.abs(this.followPos - this.pos) < 1) goal = 0;
    }
    const glide = this.follow ? 0.004 : 0.0016;
    let ended = false;
    for (let i = 0; i < out.length; i++) {
      this.speed += (goal - this.speed) * glide;
      this.pos += this.speed * ratio;
      if (this.pos >= last) { this.pos = last; if (this.speed > 0) { this.speed = 0; if (!this.follow && this.target > 0) ended = true; } }
      if (this.pos <= 0) { this.pos = 0; if (this.speed < 0) this.speed = 0; }
      const i0 = Math.floor(this.pos), f = this.pos - i0;
      const v = b[i0] + (b[Math.min(last, i0 + 1)] - b[i0]) * f;
      // fade out near standstill, so a resting head is silent
      out[i] = v * Math.min(1, Math.abs(this.speed) * 6) * 0.9;
    }
    if (ended) { this.target = 0; this.port.postMessage({ ended: true }); }
    if ((this.n++ & 1) === 0) this.port.postMessage({ pos: this.pos / ${SR}, speed: this.speed });
    return true;
  }
}
registerProcessor('scrub-head', ScrubHead);
`;

export class Transport {
  private ctx: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private ready: Promise<void> | null = null;
  private buf: Float32Array = new Float32Array(SR);
  /** last position report from the audio thread and when it arrived */
  private rep = { pos: 0, speed: 0, at: 0 };
  /** what the user wants when nobody touches the timeline */
  playing = false;
  /** the timeline is held: the head follows the hand */
  holding = false;
  private holdPos = 0;
  private inertia: { v: number; t0: number; raf: number } | null = null;
  onChange: () => void = () => {};

  get duration() {
    return this.buf.length / SR;
  }

  /** Current head position in seconds, extrapolated between reports. */
  get position() {
    if (this.holding) return this.holdPos;
    const dt = this.ctx ? this.ctx.currentTime - this.rep.at : 0;
    return Math.max(0, Math.min(this.duration, this.rep.pos + this.rep.speed * Math.max(0, Math.min(0.05, dt))));
  }

  private async init() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      this.ctx = new AudioContext();
      const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
      await this.ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      this.node = new AudioWorkletNode(this.ctx, 'scrub-head', { numberOfInputs: 0, outputChannelCount: [1] });
      this.node.connect(this.ctx.destination);
      this.node.port.onmessage = (e) => {
        const m = e.data;
        if (m.ended) {
          this.playing = false;
          this.onChange();
        }
        if (m.pos !== undefined) this.rep = { pos: m.pos, speed: m.speed, at: this.ctx!.currentTime };
      };
      this.node.port.postMessage({ buf: this.buf });
    })();
    return this.ready;
  }

  private send(m: Record<string, unknown>) {
    this.node?.port.postMessage(m);
  }

  /** Swap the audio (mixture, layer or residual) and keep the position. */
  setBuffer(x: Float32Array, resetPosition = false) {
    this.buf = x;
    this.send({ buf: x });
    if (resetPosition) this.seek(0);
  }

  async play() {
    await this.init();
    void this.ctx!.resume();
    if (this.position >= this.duration - 0.02) this.seek(0);
    this.stopInertia();
    this.playing = true;
    this.send({ rate: 1 });
    this.onChange();
  }

  pause() {
    this.stopInertia();
    this.playing = false;
    this.send({ rate: 0 });
    this.onChange();
  }

  toggle() {
    if (this.playing) this.pause();
    else void this.play();
  }

  seek(sec: number) {
    const s = Math.max(0, Math.min(this.duration, sec));
    this.rep = { pos: s, speed: 0, at: this.ctx?.currentTime ?? 0 };
    this.send({ seek: s * SR, jump: 0 });
    this.onChange();
  }

  /** The hand presses the timeline: the head stops under it. */
  hold() {
    this.stopInertia();
    this.holdPos = this.position;
    this.holding = true;
    void this.init().then(() => {
      void this.ctx!.resume();
      this.send({ follow: this.holdPos * SR });
    });
  }

  /** The hand moves the timeline to this position (seconds). */
  drag(sec: number) {
    this.holdPos = Math.max(0, Math.min(this.duration, sec));
    this.send({ follow: this.holdPos * SR });
  }

  /**
   * The hand lets go with a speed in seconds of audio per second.
   * The head keeps that speed and glides back to normal play (or to a stop when paused).
   */
  release(throwSpeed: number) {
    this.holding = false;
    this.rep = { pos: this.holdPos, speed: 0, at: this.ctx?.currentTime ?? 0 };
    const base = this.playing ? 1 : 0;
    if (Math.abs(throwSpeed - base) < 0.3) {
      this.send({ rate: base });
      return;
    }
    const v = Math.max(-10, Math.min(10, throwSpeed));
    this.send({ rate: v, jump: v });
    this.inertia = { v, t0: performance.now(), raf: 0 };
    const tau = 0.55; // seconds until most of the throw is gone
    const step = () => {
      if (!this.inertia) return;
      const t = (performance.now() - this.inertia.t0) / 1000;
      const now = (this.playing ? 1 : 0) + (this.inertia.v - (this.playing ? 1 : 0)) * Math.exp(-t / tau);
      this.send({ rate: now });
      if (t > tau * 5) {
        this.send({ rate: this.playing ? 1 : 0 });
        this.inertia = null;
        return;
      }
      this.inertia.raf = requestAnimationFrame(step);
    };
    this.inertia.raf = requestAnimationFrame(step);
  }

  private stopInertia() {
    if (this.inertia) cancelAnimationFrame(this.inertia.raf);
    this.inertia = null;
  }
}
