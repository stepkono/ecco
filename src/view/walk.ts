import * as THREE from 'three';
import { BIN_HZ, FRAME_SEC, SR } from '../dsp/stft';
import type { SpectroView } from './scene';

/**
 * Rough first-person prototype: the height map becomes a landscape you walk on.
 * The clip plays as a loop around the time under your feet, with the
 * frequency band under your feet lifted, so nearby sound regions are louder.
 * Painting works with the normal tools: the pick ray goes through the screen centre.
 */
export class Walker {
  active = false;
  onChange: (active: boolean) => void = () => {};
  private keys = new Set<string>();
  private yaw = -Math.PI / 2; // looking along +x (time runs forward)
  private pitch = -0.12;
  private pos = new THREE.Vector3();
  private eyeY = 0;
  private saved: { pos: THREE.Vector3; target: THREE.Vector3; near: number } | null = null;
  private audio: { ctx: AudioContext; buf: AudioBuffer; band: BiquadFilterNode; out: GainNode; next: number } | null = null;
  readonly eye = 0.55; // display units above the ground
  speed = 2.2; // display units per second

  private view: SpectroView;

  constructor(view: SpectroView) {
    this.view = view;
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      if ((e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type === 'text') return;
      this.keys.add(e.key.toLowerCase());
      if (e.key === 'Escape') this.exit();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    document.addEventListener('mousemove', (e) => {
      if (!this.active || document.pointerLockElement !== view.renderer.domElement) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch - e.movementY * 0.0022));
    });
    view.renderer.domElement.addEventListener('click', () => {
      if (this.active && document.pointerLockElement !== view.renderer.domElement) this.lock();
    });
  }

  private lock() {
    try {
      const r = this.view.renderer.domElement.requestPointerLock() as unknown as Promise<void> | undefined;
      r?.catch?.(() => {});
    } catch {
      /* pointer lock unavailable: arrow keys still turn */
    }
  }

  enter() {
    if (this.active) return;
    const cam = this.view.camera;
    this.saved = { pos: cam.position.clone(), target: this.view.controls.target.clone(), near: cam.near };
    this.view.walkLook(true);
    this.view.controls.enabled = false;
    cam.near = 0.02;
    cam.updateProjectionMatrix();
    cam.rotation.order = 'YXZ';
    const start = this.view.toDisplay(-7.2, 0, 0);
    this.pos.set(start.x, 0, start.z);
    this.eyeY = this.groundY() + this.eye;
    this.yaw = -Math.PI / 2;
    this.pitch = -0.12;
    this.active = true;
    this.lock();
    this.startAudio();
    this.onChange(true);
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    this.keys.clear();
    if (document.pointerLockElement) document.exitPointerLock();
    const cam = this.view.camera;
    if (this.saved) {
      cam.position.copy(this.saved.pos);
      cam.near = this.saved.near;
      cam.updateProjectionMatrix();
      this.view.controls.target.copy(this.saved.target);
    }
    this.view.controls.enabled = true;
    this.view.walkLook(false);
    this.stopAudio();
    this.onChange(false);
  }

  private groundY() {
    const c = this.view.toCanonical(this.pos.x, this.pos.z);
    return this.view.toDisplay(c.x, this.view.dispH(c.x, c.z), c.z).y;
  }

  update(dt: number) {
    const k = this.keys;
    if (k.has('arrowleft')) this.yaw += dt * 1.8;
    if (k.has('arrowright')) this.yaw -= dt * 1.8;
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const mv = new THREE.Vector3();
    if (k.has('w') || k.has('arrowup')) mv.add(fwd);
    if (k.has('s') || k.has('arrowdown')) mv.sub(fwd);
    if (k.has('d')) mv.add(right);
    if (k.has('a')) mv.sub(right);
    if (mv.lengthSq() > 0) this.pos.addScaledVector(mv.normalize(), this.speed * (k.has('shift') ? 2.2 : 1) * dt);
    // stay on the terrain
    const lo = this.view.toDisplay(-8, 0, -4.5);
    const hi = this.view.toDisplay(8, 0, 4.5);
    this.pos.x = Math.max(Math.min(lo.x, hi.x), Math.min(Math.max(lo.x, hi.x), this.pos.x));
    this.pos.z = Math.max(Math.min(lo.z, hi.z), Math.min(Math.max(lo.z, hi.z), this.pos.z));
    const target = this.groundY() + this.eye;
    this.eyeY += (target - this.eyeY) * Math.min(1, dt * 8);
    const cam = this.view.camera;
    cam.position.set(this.pos.x, this.eyeY, this.pos.z);
    cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    this.updateAudio();
  }

  // ---------------- spatial audio ----------------
  // Granular: short overlapping grains taken from the time under your feet,
  // band-passed to the frequency under your feet and scaled by the local
  // loudness. You only hear the patch of sound you stand on, never the whole clip.

  private startAudio() {
    const s = this.view.currentSession;
    if (!s) return;
    const ctx = new AudioContext();
    const buf = ctx.createBuffer(1, s.mixture.mix.length, SR);
    buf.copyToChannel(s.mixture.mix as Float32Array<ArrayBuffer>, 0);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 4;
    const out = ctx.createGain();
    out.gain.value = 0;
    band.connect(out).connect(ctx.destination);
    void ctx.resume();
    this.audio = { ctx, buf, band, out, next: ctx.currentTime + 0.05 };
    this.updateAudio();
  }

  private updateAudio() {
    const a = this.audio;
    if (!a) return;
    const c = this.view.toCanonical(this.pos.x, this.pos.z);
    const sec = this.view.frameOfX(c.x) * FRAME_SEC;
    const hz = Math.max(60, Math.min(7800, this.view.binOfZ(c.z) * BIN_HZ));
    const loud = Math.min(1, this.view.heightAt(c.x, c.z) / 2.4);
    const now = a.ctx.currentTime;
    a.band.frequency.setTargetAtTime(hz, now, 0.05);
    a.out.gain.setTargetAtTime(0.15 + 2.2 * loud * loud, now, 0.08);
    // keep about 0.15 s of grains scheduled ahead
    const grain = 0.14;
    while (a.next < now + 0.15) {
      const src = a.ctx.createBufferSource();
      src.buffer = a.buf;
      const env = a.ctx.createGain();
      env.gain.setValueAtTime(0, a.next);
      env.gain.linearRampToValueAtTime(1, a.next + grain * 0.4);
      env.gain.linearRampToValueAtTime(0, a.next + grain);
      src.connect(env).connect(a.band);
      const offset = Math.max(0, Math.min(a.buf.duration - grain, sec + (Math.random() - 0.5) * 0.08));
      src.start(Math.max(now, a.next), offset, grain);
      a.next += grain * 0.5;
    }
  }

  private stopAudio() {
    if (!this.audio) return;
    void this.audio.ctx.close();
    this.audio = null;
  }
}
