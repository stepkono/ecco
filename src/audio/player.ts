import { SR } from '../dsp/stft';

/** Minimal Web Audio transport for 16 kHz clips with a playhead callback. */
export class Player {
  private ctx: AudioContext | null = null;
  private node: AudioBufferSourceNode | null = null;
  private startedAt = 0;
  private raf = 0;
  playing: string | null = null;
  onTime: (sec: number | null) => void = () => {};
  onStop: () => void = () => {};

  private context() {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  play(x: Float32Array, tag: string, loop = false) {
    this.stop();
    const ctx = this.context();
    void ctx.resume();
    const buf = ctx.createBuffer(1, x.length, SR);
    buf.copyToChannel(x as Float32Array<ArrayBuffer>, 0);
    const node = ctx.createBufferSource();
    node.buffer = buf;
    node.loop = loop;
    const gain = ctx.createGain();
    gain.gain.value = 0.9;
    node.connect(gain).connect(ctx.destination);
    node.start();
    this.node = node;
    this.playing = tag;
    this.startedAt = ctx.currentTime;
    const dur = x.length / SR;
    const tick = () => {
      if (!this.node) return;
      let t = ctx.currentTime - this.startedAt;
      if (loop) t %= dur;
      this.onTime(Math.min(dur, t));
      this.raf = requestAnimationFrame(tick);
    };
    tick();
    node.onended = () => {
      if (this.node === node) this.stop();
    };
  }

  stop() {
    if (this.node) {
      try {
        this.node.onended = null;
        this.node.stop();
      } catch {
        /* already stopped */
      }
    }
    this.node = null;
    this.playing = null;
    cancelAnimationFrame(this.raf);
    this.onTime(null);
    this.onStop();
  }
}
