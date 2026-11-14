import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { BIN_HZ, CLIP_SECONDS, N_BINS, SR } from '../dsp/stft';
import type { Session } from '../game/session';
import type { Mapping } from '../game/tools';

export const WORLD_W = 16; // time axis (x)
export const WORLD_D = 9; // frequency axis (z)
export const WORLD_H = 2.4; // amplitude axis (y)

const hzToMel = (hz: number) => 2595 * Math.log10(1 + hz / 700);
const MEL_MAX = hzToMel(SR / 2);

/** Perceptual (mel) warp so low-frequency animal calls get room on the surface. */
export const zOfHz = (hz: number) => WORLD_D / 2 - (WORLD_D * hzToMel(hz)) / MEL_MAX;

const RAMP = [
  [0.0, [0.02, 0.05, 0.07]],
  [0.22, [0.04, 0.18, 0.24]],
  [0.45, [0.07, 0.42, 0.44]],
  [0.7, [0.45, 0.76, 0.62]],
  [1.0, [0.96, 0.97, 0.84]],
] as const;

function ramp(v: number, out: number[]) {
  for (let i = 1; i < RAMP.length; i++) {
    if (v <= RAMP[i][0] || i === RAMP.length - 1) {
      const [p0, c0] = RAMP[i - 1];
      const [p1, c1] = RAMP[i];
      const f = Math.min(1, Math.max(0, (v - p0) / (p1 - p0)));
      out[0] = c0[0] + (c1[0] - c0[0]) * f;
      out[1] = c0[1] + (c1[1] - c0[1]) * f;
      out[2] = c0[2] + (c1[2] - c0[2]) * f;
      return;
    }
  }
}

export interface Pick {
  x: number;
  z: number;
  y: number;
  t: number; // fractional frame
  k: number; // fractional bin
}

export class SpectroView {
  readonly renderer: THREE.WebGLRenderer;
  readonly labels: CSS2DRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  private mesh: THREE.Mesh | null = null;
  private geo: THREE.BufferGeometry | null = null;
  private heights = new Float32Array(0);
  private session: Session | null = null;
  readonly map: Mapping;
  private zLut = new Float32Array(2048); // z -> bin
  private playhead: THREE.Group;
  private cursor: THREE.Line;
  private forkLines: THREE.LineSegments;
  private boxLine: THREE.Line;
  private markers: THREE.LineSegments;
  private axisGroup = new THREE.Group();
  whiten = false;
  unfold = 0;
  private dirtyHeights = true;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setClearColor(0x050b10, 1);
    container.appendChild(this.renderer.domElement);
    this.labels = new CSS2DRenderer();
    this.labels.domElement.className = 'labels-layer';
    container.appendChild(this.labels.domElement);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    this.camera.position.set(-2.5, 10.5, 15.5);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.4, 0);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 40;

    this.scene.fog = new THREE.Fog(0x050b10, 22, 48);
    this.scene.add(new THREE.HemisphereLight(0xcfe9ff, 0x0a1a14, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-6, 10, 6);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x66ccff, 0.6);
    rim.position.set(8, 4, -10);
    this.scene.add(rim);

    const grid = new THREE.GridHelper(40, 40, 0x12303a, 0x0b1e26);
    grid.position.y = -0.02;
    this.scene.add(grid);

    // mapping
    const zOfBin = new Float32Array(N_BINS);
    for (let k = 0; k < N_BINS; k++) zOfBin[k] = zOfHz(k * BIN_HZ);
    this.map = { xOfFrame: (t) => -WORLD_W / 2 + (WORLD_W * t) / (this.frames() - 1), zOfBin };
    for (let i = 0; i < this.zLut.length; i++) {
      const z = WORLD_D / 2 - (WORLD_D * i) / (this.zLut.length - 1);
      let k = 0;
      while (k < N_BINS - 1 && zOfBin[k + 1] > z) k++;
      const z0 = zOfBin[k];
      const z1 = zOfBin[Math.min(N_BINS - 1, k + 1)];
      this.zLut[i] = k + (z0 === z1 ? 0 : (z0 - z) / (z0 - z1));
    }

    // playhead
    this.playhead = new THREE.Group();
    const ph = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_D, WORLD_H + 0.6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }),
    );
    ph.rotation.y = Math.PI / 2;
    ph.position.y = (WORLD_H + 0.6) / 2;
    this.playhead.add(ph);
    const phEdge = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, WORLD_H + 0.6, -WORLD_D / 2), new THREE.Vector3(0, WORLD_H + 0.6, WORLD_D / 2)]),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }),
    );
    this.playhead.add(phEdge);
    this.playhead.visible = false;
    this.scene.add(this.playhead);

    const lineMat = (color: number, opacity = 1) =>
      new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthTest: false });
    this.cursor = new THREE.Line(new THREE.BufferGeometry(), lineMat(0xffffff, 0.9));
    this.cursor.renderOrder = 10;
    this.forkLines = new THREE.LineSegments(new THREE.BufferGeometry(), lineMat(0xffe08a, 0.85));
    this.forkLines.renderOrder = 10;
    this.boxLine = new THREE.Line(new THREE.BufferGeometry(), lineMat(0xffffff, 0.9));
    this.boxLine.renderOrder = 10;
    this.markers = new THREE.LineSegments(new THREE.BufferGeometry(), lineMat(0xff7ac8, 0.95));
    this.markers.renderOrder = 10;
    this.scene.add(this.cursor, this.forkLines, this.boxLine, this.markers, this.axisGroup);

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(container);
    this.resize();
    this.buildAxes();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  private frames() {
    return this.session?.frames ?? 626;
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.labels.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private label(text: string, pos: THREE.Vector3, cls = 'axis-label') {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    const o = new CSS2DObject(el);
    o.position.copy(pos);
    this.axisGroup.add(o);
  }

  private buildAxes() {
    const pts: THREE.Vector3[] = [];
    for (const hz of [100, 250, 500, 1000, 2000, 4000, 8000]) {
      const z = zOfHz(hz);
      this.label(hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`, new THREE.Vector3(-WORLD_W / 2 - 0.8, 0, z));
      pts.push(new THREE.Vector3(-WORLD_W / 2, 0, z), new THREE.Vector3(-WORLD_W / 2 - 0.25, 0, z));
    }
    for (let s = 0; s <= CLIP_SECONDS; s++) {
      const x = -WORLD_W / 2 + (WORLD_W * s) / CLIP_SECONDS;
      this.label(`${s}s`, new THREE.Vector3(x, 0, WORLD_D / 2 + 0.6));
      pts.push(new THREE.Vector3(x, 0, WORLD_D / 2), new THREE.Vector3(x, 0, WORLD_D / 2 + 0.25));
    }
    const ticks = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x4a6b78 }));
    this.axisGroup.add(ticks);
    this.label('time', new THREE.Vector3(0, 0, WORLD_D / 2 + 1.3), 'axis-title');
    this.label('frequency', new THREE.Vector3(-WORLD_W / 2 - 2.2, 0, 0), 'axis-title');
  }

  setSession(s: Session) {
    this.session = s;
    const T = s.frames;
    const n = T * N_BINS;
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.geo?.dispose();
    }
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    for (let t = 0; t < T; t++) {
      const x = this.map.xOfFrame(t);
      for (let k = 0; k < N_BINS; k++) {
        const i = t * N_BINS + k;
        pos[i * 3] = x;
        pos[i * 3 + 2] = this.map.zOfBin[k];
      }
    }
    const idx = new Uint32Array((T - 1) * (N_BINS - 1) * 6);
    let p = 0;
    for (let t = 0; t < T - 1; t++) {
      for (let k = 0; k < N_BINS - 1; k++) {
        const a = t * N_BINS + k;
        const b = (t + 1) * N_BINS + k;
        idx[p++] = a; idx[p++] = b; idx[p++] = a + 1;
        idx[p++] = b; idx[p++] = b + 1; idx[p++] = a + 1;
      }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    this.geo = geo;
    this.heights = new Float32Array(n);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);
    this.dirtyHeights = true;
    this.refresh();
    this.clearOverlays();
  }

  private base = new Float32Array(0);
  private shade = new Float32Array(0);

  /**
   * Normalised display height per cell before layer lifting: dB mapped to
   * [0,1], lightly smoothed along time so noise reads as texture rather than
   * spikes, and gamma-shaped so calls rise above the rain bed. Colour uses
   * the value before the gamma curve, for contrast in the top view.
   * Masks and audio always use the unsmoothed spectrogram.
   */
  private computeBase() {
    const s = this.session!;
    const n = s.frames * N_BINS;
    const raw = new Float32Array(n);
    for (let t = 0; t < s.frames; t++)
      for (let k = 0; k < N_BINS; k++) {
        const i = t * N_BINS + k;
        const v = this.whiten ? (s.db[i] - s.floor[k] + 2) / 34 : (s.db[i] - (s.maxDb - 66)) / 66;
        raw[i] = v < 0 ? 0 : v > 1 ? 1 : v;
      }
    if (this.base.length !== n) {
      this.base = new Float32Array(n);
      this.shade = new Float32Array(n);
    }
    // smooth along time only: harmonic combs are just a few bins apart
    for (let t = 0; t < s.frames; t++)
      for (let k = 0; k < N_BINS; k++) {
        const i = t * N_BINS + k;
        const a = raw[Math.max(0, t - 1) * N_BINS + k];
        const b = raw[Math.min(s.frames - 1, t + 1) * N_BINS + k];
        const v = (a + 2 * raw[i] + b) / 4;
        this.shade[i] = v;
        this.base[i] = v ** 1.6;
      }
  }

  markHeightsDirty() {
    this.dirtyHeights = true;
  }

  /** Recompute vertex colours (and heights if needed) from the layer masks. */
  refresh() {
    const s = this.session;
    if (!s || !this.geo) return;
    const pos = this.geo.getAttribute('position') as THREE.BufferAttribute;
    const col = this.geo.getAttribute('color') as THREE.BufferAttribute;
    const P = pos.array as Float32Array;
    const C = col.array as Float32Array;
    const layers = s.layers.filter((l) => l.visible);
    const lc = layers.map((l) => new THREE.Color(l.color));
    const base = [0, 0, 0];
    const lift = this.unfold > 0;
    const heightsChanged = this.dirtyHeights || lift;
    if (this.dirtyHeights || this.base.length !== s.frames * N_BINS) this.computeBase();
    for (let t = 0; t < s.frames; t++) {
      for (let k = 0; k < N_BINS; k++) {
        const i = t * N_BINS + k;
        const h = this.base[i];
        ramp(this.shade[i], base);
        let r = base[0];
        let g = base[1];
        let b = base[2];
        let total = 0;
        let lr = 0;
        let lg = 0;
        let lb = 0;
        let y = h * WORLD_H;
        for (let j = 0; j < layers.length; j++) {
          const m = layers[j].mask[i];
          if (m <= 0.002) continue;
          total += m;
          lr += lc[j].r * m;
          lg += lc[j].g * m;
          lb += lc[j].b * m;
          if (lift) y += m * this.unfold * (1.1 + j * 0.9);
        }
        if (total > 0) {
          const a = Math.min(1, total);
          const bright = 0.6 + 0.6 * h;
          r = r * (1 - a) + (lr / total) * bright * a;
          g = g * (1 - a) + (lg / total) * bright * a;
          b = b * (1 - a) + (lb / total) * bright * a;
        }
        C[i * 3] = r;
        C[i * 3 + 1] = g;
        C[i * 3 + 2] = b;
        if (heightsChanged) {
          P[i * 3 + 1] = y;
          this.heights[i] = y;
        }
      }
    }
    col.needsUpdate = true;
    if (heightsChanged) {
      pos.needsUpdate = true;
      this.geo.computeVertexNormals();
      this.geo.computeBoundingSphere();
      this.dirtyHeights = false;
    }
  }

  binOfZ(z: number) {
    const f = ((WORLD_D / 2 - z) / WORLD_D) * (this.zLut.length - 1);
    const i = Math.max(0, Math.min(this.zLut.length - 1, Math.round(f)));
    return this.zLut[i];
  }

  frameOfX(x: number) {
    return ((x + WORLD_W / 2) / WORLD_W) * (this.frames() - 1);
  }

  heightAt(x: number, z: number) {
    if (!this.session) return 0;
    const t = Math.round(this.frameOfX(x));
    const k = Math.round(this.binOfZ(z));
    if (t < 0 || t >= this.session.frames || k < 0 || k >= N_BINS) return 0;
    return this.heights[t * N_BINS + k];
  }

  private ray = new THREE.Raycaster();

  /** Ray-march the height field (much faster than triangle raycasting on 320k faces). */
  pick(clientX: number, clientY: number): Pick | null {
    if (!this.session) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    const o = this.ray.ray.origin;
    const d = this.ray.ray.direction;
    const maxY = WORLD_H + this.unfold * 6 + 0.1;
    const box = new THREE.Box3(new THREE.Vector3(-WORLD_W / 2, -0.01, -WORLD_D / 2), new THREE.Vector3(WORLD_W / 2, maxY, WORLD_D / 2));
    const hit = new THREE.Vector3();
    if (!this.ray.ray.intersectBox(box, hit)) return null;
    let tRay = hit.distanceTo(o);
    const step = 0.03;
    let prev: THREE.Vector3 | null = null;
    for (let i = 0; i < 2000; i++) {
      const p = o.clone().addScaledVector(d, tRay);
      if (p.x < -WORLD_W / 2 - 0.01 || p.x > WORLD_W / 2 + 0.01 || p.z < -WORLD_D / 2 - 0.01 || p.z > WORLD_D / 2 + 0.01 || p.y < -0.05) {
        if (prev) break;
      }
      const h = this.heightAt(p.x, p.z);
      if (p.y <= h || p.y <= 0) {
        // bisection refine
        let a = tRay - step;
        let b = tRay;
        for (let j = 0; j < 8; j++) {
          const m = (a + b) / 2;
          const q = o.clone().addScaledVector(d, m);
          if (q.y <= this.heightAt(q.x, q.z)) b = m;
          else a = m;
        }
        const q = o.clone().addScaledVector(d, b);
        const x = Math.max(-WORLD_W / 2, Math.min(WORLD_W / 2, q.x));
        const z = Math.max(-WORLD_D / 2, Math.min(WORLD_D / 2, q.z));
        return { x, z, y: q.y, t: this.frameOfX(x), k: this.binOfZ(z) };
      }
      prev = p;
      tRay += step;
    }
    return null;
  }

  // ---------------- overlays ----------------

  showCursor(p: Pick | null, radius: number) {
    if (!p) {
      this.cursor.visible = false;
      return;
    }
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const x = p.x + Math.cos(a) * radius;
      const z = p.z + Math.sin(a) * radius;
      pts.push(new THREE.Vector3(x, this.heightAt(x, z) + 0.04, z));
    }
    this.cursor.geometry.setFromPoints(pts);
    this.cursor.visible = true;
  }

  /** Harmonic preview of the tuning fork: h * f0 strands around the cursor. */
  showFork(p: Pick | null, f0: number, track?: Map<number, number>) {
    if (!p || !this.session) {
      this.forkLines.visible = false;
      return;
    }
    const pts: THREE.Vector3[] = [];
    const frames: [number, number][] = [];
    if (track && track.size) {
      for (const [t, f] of [...track.entries()].sort((a, b) => a[0] - b[0])) frames.push([t, f]);
    } else {
      const t0 = Math.round(p.t);
      for (let t = Math.max(0, t0 - 30); t <= Math.min(this.session.frames - 1, t0 + 30); t++) frames.push([t, f0]);
    }
    for (let h = 1; h <= 40; h++) {
      for (let i = 0; i < frames.length - 1; i++) {
        const [ta, fa] = frames[i];
        const [tb, fb] = frames[i + 1];
        if (tb - ta > 3 || h * fa > 7900) continue;
        const xa = this.map.xOfFrame(ta);
        const xb = this.map.xOfFrame(tb);
        const za = zOfHz(h * fa);
        const zb = zOfHz(h * fb);
        pts.push(new THREE.Vector3(xa, this.heightAt(xa, za) + 0.05, za), new THREE.Vector3(xb, this.heightAt(xb, zb) + 0.05, zb));
      }
    }
    this.forkLines.geometry.setFromPoints(pts);
    this.forkLines.visible = pts.length > 0;
  }

  showBox(a: Pick | null, b: Pick | null, color = 0xffffff) {
    if (!a || !b) {
      this.boxLine.visible = false;
      return;
    }
    (this.boxLine.material as THREE.LineBasicMaterial).color.set(color);
    const corners: [number, number][] = [
      [a.x, a.z], [b.x, a.z], [b.x, b.z], [a.x, b.z], [a.x, a.z],
    ];
    const pts: THREE.Vector3[] = [];
    for (let c = 0; c < 4; c++) {
      const [x0, z0] = corners[c];
      const [x1, z1] = corners[c + 1];
      for (let i = 0; i <= 30; i++) {
        const x = x0 + ((x1 - x0) * i) / 30;
        const z = z0 + ((z1 - z0) * i) / 30;
        pts.push(new THREE.Vector3(x, this.heightAt(x, z) + 0.05, z));
      }
    }
    this.boxLine.geometry.setFromPoints(pts);
    this.boxLine.visible = true;
  }

  showMarkers(frames: number[], kLo: number, kHi: number) {
    const pts: THREE.Vector3[] = [];
    const zLo = this.map.zOfBin[Math.round(kLo)];
    const zHi = this.map.zOfBin[Math.round(kHi)];
    for (const t of frames) {
      const x = this.map.xOfFrame(t);
      pts.push(new THREE.Vector3(x, WORLD_H + 0.3, zLo), new THREE.Vector3(x, WORLD_H + 0.3, zHi));
      pts.push(new THREE.Vector3(x, 0, zLo), new THREE.Vector3(x, WORLD_H + 0.3, zLo));
    }
    this.markers.geometry.setFromPoints(pts);
    this.markers.visible = pts.length > 0;
  }

  clearOverlays() {
    this.cursor.visible = false;
    this.forkLines.visible = false;
    this.boxLine.visible = false;
    this.markers.visible = false;
  }

  setPlayhead(sec: number | null) {
    if (sec === null) {
      this.playhead.visible = false;
      return;
    }
    this.playhead.visible = true;
    this.playhead.position.x = -WORLD_W / 2 + (WORLD_W * sec) / CLIP_SECONDS;
  }

  setViewMode(rotateWithLeft: boolean) {
    this.controls.mouseButtons = {
      LEFT: rotateWithLeft ? THREE.MOUSE.ROTATE : (null as unknown as THREE.MOUSE),
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.ROTATE,
    };
  }

  resetCamera(view: 'perspective' | 'top' | 'side' = 'perspective') {
    if (view === 'top') this.camera.position.set(0, 21, 0.01);
    else if (view === 'side') this.camera.position.set(0, 3, 15);
    else this.camera.position.set(-2.5, 10.5, 15.5);
    this.controls.target.set(0, 0.4, 0);
  }

  private frame() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labels.render(this.scene, this.camera);
  }
}
