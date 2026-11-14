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
  x: number; // canonical world x (time), independent of the display mode
  z: number; // canonical world z (warped frequency)
  y: number;
  t: number; // fractional frame
  k: number; // fractional bin
}

// ---------------- visualization playground ----------------

export type VizMode = 'surface' | 'voxel' | 'drops' | 'spiral' | 'symmetry';

export const VIZ_MODES: { id: VizMode; label: string; note: string }[] = [
  { id: 'surface', label: 'Surface', note: 'All tools work here.' },
  { id: 'voxel', label: 'Voxels', note: 'All tools work. Picks use the fine height field under the voxels.' },
  { id: 'drops', label: 'Drop lines', note: 'All tools work. Picks hit the tops of the lines.' },
  { id: 'spiral', label: 'Spiral', note: 'All tools work. Picks snap to the nearest sphere.' },
  { id: 'symmetry', label: 'Symmetry', note: 'All tools work on both halves. The mirror is a copy, so paint shows on both.' },
];

/**
 * Look parameters per mode. Everything here is safe to tweak: the panel edits
 * these values and calls view.rebuildViz() to apply them.
 */
export const VIZ = {
  voxel: {
    cell: 0.14, // canonical cell size in world units (x and z)
    step: 0.12, // height quantisation (0 = smooth columns)
    gap: 0.14, // fraction of the cell left empty between columns
    stack: false, // true = column of separate cubes, false = one box per column
  },
  drops: {
    stride: 2, // take every n-th frame and bin
    points: true, // dot on top of each line
    glow: true, // additive blending
    fade: 0.0, // brightness at the base of each line
  },
  spiral: {
    height: 12, // world height of the time axis at time scale 1
    span: 5, // equal grid length of frequency and amplitude
    turns: 1.25, // full rotations over the clip
    offset: 1.2, // distance of the ribbon centre from the time axis
    radius: 0.022, // sphere radius, equal for all points
    tStride: 4, // every n-th frame
    kStride: 3, // every n-th bin
  },
  symmetry: {
    variant: 'amp' as 'amp' | 'time', // amp = mirror below the zero plane, time = palindrome around the time midpoint
  },
};

/** Canonical (x, y, z) -> display: d = (ox + x*ax, y*ay, z*az). Symmetry renders two of these. */
interface Copy {
  ox: number;
  ax: number;
  ay: number;
  az: number;
}

const tmpM = new THREE.Matrix4();
const tmpV = new THREE.Vector3();

export class SpectroView {
  readonly renderer: THREE.WebGLRenderer;
  readonly labels: CSS2DRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  private mesh: THREE.Mesh | null = null;
  private mirrorMesh: THREE.Mesh | null = null;
  private geo: THREE.BufferGeometry | null = null;
  private heights = new Float32Array(0);
  private colors = new Float32Array(0);
  private session: Session | null = null;
  readonly map: Mapping;
  private zLut = new Float32Array(2048); // z -> bin
  private playhead: THREE.Group;
  private playSec: number | null = null;
  private cursor: THREE.Line;
  private forkLines: THREE.LineSegments;
  private boxLine: THREE.Line;
  private markers: THREE.LineSegments;
  private axisGroup = new THREE.Group();
  private grid: THREE.GridHelper;
  private underLight = new THREE.DirectionalLight(0xffffff, 0);
  whiten = false;
  unfold = 0;
  private dirtyHeights = true;
  private surfaceStale = true;
  private container: HTMLElement;

  // playground state
  mode: VizMode = 'surface';
  readonly axis = { t: 1, f: 1, a: 1 };
  /** canonical layout, scaled by the axis sliders (copy 0) */
  private world = new THREE.Group();
  /** second copy for the symmetry mode */
  private mirror = new THREE.Group();
  private mirrorOverlays: THREE.Object3D[] = [];
  private mirrorPlayhead: THREE.Group;
  private symPlane: THREE.Mesh;
  private vox: {
    NX: number; NZ: number; cw: number; cd: number;
    tLo: Int32Array; tHi: Int32Array; kLo: Int32Array; kHi: Int32Array;
    mesh: THREE.InstancedMesh; cap: number;
  } | null = null;
  private drops: { lines: THREE.LineSegments; points: THREE.Points; t: Int32Array; k: Int32Array } | null = null;
  private spiral: { mesh: THREE.InstancedMesh; t: Int32Array; k: Int32Array; pos: Float32Array } | null = null;
  private spiralDeco = new THREE.Group();
  private spiralRing: THREE.Group;
  private spiralLabels: CSS2DObject[] = [];
  private spiralAxis: THREE.Line;

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
    this.controls.maxDistance = 60;

    this.scene.fog = new THREE.Fog(0x050b10, 22, 60);
    this.scene.add(new THREE.HemisphereLight(0xcfe9ff, 0x0a1a14, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-6, 10, 6);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x66ccff, 0.6);
    rim.position.set(8, 4, -10);
    this.scene.add(rim);
    // lights the underside of the mirror copy in the symmetry mode
    this.underLight.position.set(-6, -10, 6);
    this.scene.add(this.underLight);

    this.grid = new THREE.GridHelper(40, 40, 0x12303a, 0x0b1e26);
    this.grid.position.y = -0.02;
    this.scene.add(this.grid);

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

    const lineMat = (color: number, opacity = 1) =>
      new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthTest: false });
    this.cursor = new THREE.Line(new THREE.BufferGeometry(), lineMat(0xffffff, 0.9));
    this.forkLines = new THREE.LineSegments(new THREE.BufferGeometry(), lineMat(0xffe08a, 0.85));
    this.boxLine = new THREE.Line(new THREE.BufferGeometry(), lineMat(0xffffff, 0.9));
    this.markers = new THREE.LineSegments(new THREE.BufferGeometry(), lineMat(0xff7ac8, 0.95));
    for (const o of this.overlays()) {
      o.renderOrder = 10;
      o.visible = false;
    }
    this.world.add(this.playhead, ...this.overlays(), this.axisGroup);
    this.scene.add(this.world, this.mirror);

    // mirror copies share geometry and material with the originals
    this.mirrorPlayhead = this.playhead.clone();
    this.mirrorOverlays = this.overlays().map((o) => {
      const c = o instanceof THREE.LineSegments ? new THREE.LineSegments(o.geometry, o.material) : new THREE.Line(o.geometry, o.material);
      c.renderOrder = 10;
      return c;
    });
    this.mirror.add(this.mirrorPlayhead, ...this.mirrorOverlays);

    this.symPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0x56c8ff, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }),
    );
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)), new THREE.LineBasicMaterial({ color: 0x56c8ff, transparent: true, opacity: 0.5 }));
    this.symPlane.add(edge);
    this.scene.add(this.symPlane);

    // spiral decoration: time axis, second labels and a playhead ring
    this.spiralAxis = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x4a6b78 }));
    const ringPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) ringPts.push(new THREE.Vector3(Math.cos((i / 64) * Math.PI * 2), 0, Math.sin((i / 64) * Math.PI * 2)));
    this.spiralRing = new THREE.Group();
    this.spiralRing.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })),
      new THREE.Mesh(
        new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }),
      ),
    );
    this.spiralRing.visible = false;
    this.spiralDeco.add(this.spiralAxis, this.spiralRing);
    for (let s = 0; s <= CLIP_SECONDS; s++) {
      const el = document.createElement('div');
      el.className = 'axis-label';
      el.textContent = `${s}s`;
      const o = new CSS2DObject(el);
      this.spiralLabels.push(o);
      this.spiralDeco.add(o);
    }
    this.scene.add(this.spiralDeco);

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(container);
    this.resize();
    this.buildAxes();
    this.applyLayout();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  private overlays() {
    return [this.cursor, this.forkLines, this.boxLine, this.markers];
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
      this.world.remove(this.mesh);
      if (this.mirrorMesh) this.mirror.remove(this.mirrorMesh);
      this.geo?.dispose();
    }
    this.disposeModes();
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
    this.colors = new Float32Array(n * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    this.geo = geo;
    this.heights = new Float32Array(n);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mirrorMesh = new THREE.Mesh(geo, mat);
    this.world.add(this.mesh);
    this.mirror.add(this.mirrorMesh);
    this.dirtyHeights = true;
    this.surfaceStale = true;
    this.applyLayout();
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

  /** Recompute colours (and heights if needed) from the layer masks, then update the active mode. */
  refresh() {
    const s = this.session;
    if (!s || !this.geo) return;
    const C = this.colors;
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
        if (heightsChanged) this.heights[i] = y;
      }
    }
    if (heightsChanged) {
      this.dirtyHeights = false;
      this.surfaceStale = true;
    }
    this.updateMode(heightsChanged);
  }

  // ---------------- modes ----------------

  setMode(m: VizMode) {
    if (m === this.mode) return;
    this.mode = m;
    this.applyLayout();
    this.updateMode(true);
    this.resetCamera('perspective');
  }

  setAxis(t: number, f: number, a: number) {
    this.axis.t = t;
    this.axis.f = f;
    this.axis.a = a;
    this.applyLayout();
    if (this.mode === 'spiral') this.updateMode(true);
  }

  /** Throw away the per-mode objects so they are rebuilt with the current VIZ parameters. */
  rebuildViz() {
    this.disposeModes();
    this.applyLayout();
    this.updateMode(true);
  }

  private disposeModes() {
    if (this.vox) {
      this.world.remove(this.vox.mesh);
      this.vox.mesh.geometry.dispose();
      this.vox.mesh.dispose();
      this.vox = null;
    }
    if (this.drops) {
      this.world.remove(this.drops.lines, this.drops.points);
      this.drops.lines.geometry.dispose();
      this.drops.points.geometry.dispose();
      this.drops = null;
    }
    if (this.spiral) {
      this.world.remove(this.spiral.mesh);
      this.spiral.mesh.geometry.dispose();
      this.spiral.mesh.dispose();
      this.spiral = null;
    }
  }

  private copies(): Copy[] {
    const { t: sx, a: sy, f: sz } = this.axis;
    if (this.mode === 'spiral') return [{ ox: 0, ax: 1, ay: 1, az: 1 }];
    if (this.mode === 'symmetry') {
      if (VIZ.symmetry.variant === 'amp')
        return [
          { ox: 0, ax: sx, ay: sy, az: sz },
          { ox: 0, ax: sx, ay: -sy, az: sz },
        ];
      return [
        { ox: (-WORLD_W / 4) * sx, ax: sx / 2, ay: sy, az: sz },
        { ox: (WORLD_W / 4) * sx, ax: -sx / 2, ay: sy, az: sz },
      ];
    }
    return [{ ox: 0, ax: sx, ay: sy, az: sz }];
  }

  /** Group transforms, visibility and helper geometry for the current mode and axis scales. */
  private applyLayout() {
    const m = this.mode;
    const cs = this.copies();
    const set = (g: THREE.Object3D, c: Copy) => {
      g.position.set(c.ox, 0, 0);
      g.scale.set(c.ax, c.ay, c.az);
    };
    set(this.world, cs[0]);
    this.mirror.visible = cs.length > 1;
    if (cs.length > 1) set(this.mirror, cs[1]);

    const surf = m === 'surface' || m === 'symmetry';
    if (this.mesh) this.mesh.visible = surf;
    if (this.mirrorMesh) this.mirrorMesh.visible = m === 'symmetry';
    this.axisGroup.visible = m !== 'spiral';
    this.spiralDeco.visible = m === 'spiral';
    this.playhead.visible = m !== 'spiral' && this.playSec !== null;

    // symmetry plane and floor
    const { t: sx, a: sy, f: sz } = this.axis;
    this.symPlane.visible = m === 'symmetry';
    this.grid.position.y = -0.02;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.underLight.intensity = 0;
    if (m === 'symmetry') {
      if (VIZ.symmetry.variant === 'amp') {
        this.symPlane.rotation.set(-Math.PI / 2, 0, 0);
        this.symPlane.scale.set(WORLD_W * sx + 0.6, WORLD_D * sz + 0.6, 1);
        this.symPlane.position.set(0, 0, 0);
        this.grid.position.y = -(WORLD_H + this.unfold * 3) * sy - 0.8;
        this.controls.maxPolarAngle = Math.PI * 0.95;
        this.underLight.intensity = 1.6;
      } else {
        this.symPlane.rotation.set(0, Math.PI / 2, 0);
        this.symPlane.scale.set(WORLD_D * sz + 0.6, (WORLD_H + 0.6) * sy, 1);
        this.symPlane.position.set(0, ((WORLD_H + 0.6) * sy) / 2, 0);
      }
    }

    // spiral time axis, labels and playhead ring
    if (m === 'spiral') {
      const S = VIZ.spiral;
      const H = S.height * sx;
      this.spiralAxis.geometry.dispose();
      this.spiralAxis.geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, H, 0)]);
      this.spiralLabels.forEach((o, s) => o.position.set(0.25, (H * s) / CLIP_SECONDS, 0));
      const r = S.offset + (S.span / 2) * Math.max(sz, sy) + 0.3;
      this.spiralRing.scale.set(r, 1, r);
      this.spiralRing.visible = this.playSec !== null;
      if (this.playSec !== null) this.spiralRing.position.y = (H * this.playSec) / CLIP_SECONDS;
    }
  }

  private updateMode(geom: boolean) {
    if (!this.session || !this.geo) return;
    const m = this.mode;
    if (m === 'surface' || m === 'symmetry') this.updateSurface();
    if (this.vox) this.vox.mesh.visible = m === 'voxel';
    if (this.drops) this.drops.lines.visible = this.drops.points.visible = m === 'drops';
    if (this.spiral) this.spiral.mesh.visible = m === 'spiral';
    if (m === 'voxel') this.updateVoxel();
    else if (m === 'drops') this.updateDrops(geom);
    else if (m === 'spiral') this.updateSpiral(geom);
  }

  private updateSurface() {
    const geo = this.geo!;
    (geo.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
    if (!this.surfaceStale) return;
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const P = pos.array as Float32Array;
    for (let i = 0; i < this.heights.length; i++) P[i * 3 + 1] = this.heights[i];
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    this.surfaceStale = false;
  }

  // ---- voxel landscape ----

  private buildVoxel() {
    const c = VIZ.voxel.cell;
    const NX = Math.max(8, Math.round(WORLD_W / c));
    const NZ = Math.max(4, Math.round(WORLD_D / c));
    const cw = WORLD_W / NX;
    const cd = WORLD_D / NZ;
    const T = this.frames();
    const clampT = (v: number) => Math.max(0, Math.min(T - 1, v));
    const clampK = (v: number) => Math.max(0, Math.min(N_BINS - 1, v));
    const tLo = new Int32Array(NX);
    const tHi = new Int32Array(NX);
    for (let i = 0; i < NX; i++) {
      const x0 = -WORLD_W / 2 + i * cw;
      tLo[i] = clampT(Math.round(this.frameOfX(x0)));
      tHi[i] = Math.max(tLo[i], clampT(Math.round(this.frameOfX(x0 + cw)) - 1));
    }
    const kLo = new Int32Array(NZ);
    const kHi = new Int32Array(NZ);
    for (let j = 0; j < NZ; j++) {
      const z0 = WORLD_D / 2 - j * cd; // low-frequency edge
      kLo[j] = clampK(Math.round(this.binOfZ(z0)));
      kHi[j] = Math.max(kLo[j], clampK(Math.round(this.binOfZ(z0 - cd)) - 1));
    }
    const cap = NX * NZ * (VIZ.voxel.stack ? 4 : 1);
    const mesh = this.voxelMesh(cap);
    this.vox = { NX, NZ, cw, cd, tLo, tHi, kLo, kHi, mesh, cap };
  }

  private voxelMesh(cap: number) {
    const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 });
    const mesh = new THREE.InstancedMesh(geo, mat, cap);
    mesh.setColorAt(0, new THREE.Color());
    mesh.frustumCulled = false;
    this.world.add(mesh);
    return mesh;
  }

  private updateVoxel() {
    if (!this.vox) this.buildVoxel();
    const v = this.vox!;
    const { NX, NZ, cw, cd } = v;
    const { step, gap, stack } = VIZ.voxel;
    const H = this.heights;
    const C = this.colors;
    const cells = new Float32Array(NX * NZ * 4); // h, r, g, b
    let need = 0;
    for (let i = 0; i < NX; i++)
      for (let j = 0; j < NZ; j++) {
        let hMax = 0;
        let wr = 0, wg = 0, wb = 0, ws = 0;
        for (let t = v.tLo[i]; t <= v.tHi[i]; t++)
          for (let k = v.kLo[j]; k <= v.kHi[j]; k++) {
            const idx = t * N_BINS + k;
            const h = H[idx];
            if (h > hMax) hMax = h;
            const w = h + 0.05;
            wr += C[idx * 3] * w;
            wg += C[idx * 3 + 1] * w;
            wb += C[idx * 3 + 2] * w;
            ws += w;
          }
        const o = (i * NZ + j) * 4;
        cells[o] = hMax;
        cells[o + 1] = wr / ws;
        cells[o + 2] = wg / ws;
        cells[o + 3] = wb / ws;
        need += stack && step > 0 ? Math.max(1, Math.round(hMax / step)) : 1;
      }
    if (need > v.cap) {
      this.world.remove(v.mesh);
      v.mesh.geometry.dispose();
      v.mesh.dispose();
      v.cap = Math.ceil(need * 1.3);
      v.mesh = this.voxelMesh(v.cap);
    }
    const mesh = v.mesh;
    const IC = mesh.instanceColor!.array as Float32Array;
    const sxz = 1 - gap;
    let n = 0;
    for (let i = 0; i < NX; i++) {
      const cx = -WORLD_W / 2 + (i + 0.5) * cw;
      for (let j = 0; j < NZ; j++) {
        const cz = WORLD_D / 2 - (j + 0.5) * cd;
        const o = (i * NZ + j) * 4;
        const h = cells[o];
        if (stack && step > 0) {
          const levels = Math.max(1, Math.round(h / step));
          for (let l = 0; l < levels; l++) {
            const top = h < step * 0.5;
            tmpM.makeScale(cw * sxz, top ? 0.02 : step * (1 - gap), cd * sxz);
            tmpM.setPosition(cx, l * step, cz);
            mesh.setMatrixAt(n, tmpM);
            const f = top ? 1 : 0.4 + (0.6 * (l + 1)) / levels;
            IC[n * 3] = cells[o + 1] * f;
            IC[n * 3 + 1] = cells[o + 2] * f;
            IC[n * 3 + 2] = cells[o + 3] * f;
            n++;
          }
        } else {
          const hq = Math.max(0.02, step > 0 ? Math.round(h / step) * step : h);
          tmpM.makeScale(cw * sxz, hq, cd * sxz);
          tmpM.setPosition(cx, 0, cz);
          mesh.setMatrixAt(n, tmpM);
          IC[n * 3] = cells[o + 1];
          IC[n * 3 + 1] = cells[o + 2];
          IC[n * 3 + 2] = cells[o + 3];
          n++;
        }
      }
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
    mesh.visible = true;
  }

  // ---- drop lines ----

  private buildDrops() {
    const st = Math.max(1, Math.round(VIZ.drops.stride));
    const T = this.frames();
    const ts: number[] = [];
    const ks: number[] = [];
    for (let t = 0; t < T; t += st) for (let k = 0; k < N_BINS; k += st) {
      ts.push(t);
      ks.push(k);
    }
    const n = ts.length;
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3));
    lg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 6), 3));
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    pg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const blending = VIZ.drops.glow ? THREE.AdditiveBlending : THREE.NormalBlending;
    const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: VIZ.drops.glow ? 0.22 : 0.9, blending, depthWrite: !VIZ.drops.glow }));
    const points = new THREE.Points(pg, new THREE.PointsMaterial({ vertexColors: true, size: 2.2, sizeAttenuation: false, transparent: true, opacity: VIZ.drops.glow ? 0.55 : 0.95, blending, depthWrite: !VIZ.drops.glow }));
    lines.frustumCulled = points.frustumCulled = false;
    points.visible = VIZ.drops.points;
    this.world.add(lines, points);
    this.drops = { lines, points, t: Int32Array.from(ts), k: Int32Array.from(ks) };
  }

  private updateDrops(geom: boolean) {
    if (!this.drops) {
      this.buildDrops();
      geom = true;
    }
    const d = this.drops!;
    const LP = d.lines.geometry.getAttribute('position') as THREE.BufferAttribute;
    const LC = d.lines.geometry.getAttribute('color') as THREE.BufferAttribute;
    const PP = d.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const PC = d.points.geometry.getAttribute('color') as THREE.BufferAttribute;
    const lp = LP.array as Float32Array, lc = LC.array as Float32Array, pp = PP.array as Float32Array, pc = PC.array as Float32Array;
    const fade = VIZ.drops.fade;
    for (let j = 0; j < d.t.length; j++) {
      const t = d.t[j];
      const k = d.k[j];
      const i = t * N_BINS + k;
      const r = this.colors[i * 3], g = this.colors[i * 3 + 1], b = this.colors[i * 3 + 2];
      if (geom) {
        const x = this.map.xOfFrame(t);
        const z = this.map.zOfBin[k];
        const y = this.heights[i];
        lp.set([x, 0, z, x, y, z], j * 6);
        pp.set([x, y, z], j * 3);
      }
      lc.set([r * fade, g * fade, b * fade, r, g, b], j * 6);
      pc.set([r, g, b], j * 3);
    }
    if (geom) LP.needsUpdate = PP.needsUpdate = true;
    LC.needsUpdate = PC.needsUpdate = true;
    d.points.visible = VIZ.drops.points;
  }

  // ---- spiral ----

  /** Canonical (x, y, z) -> spiral display position. Time rises along y, (amplitude, frequency) rotate around it. */
  private spiralPos(cx: number, cy: number, cz: number, out: THREE.Vector3) {
    const S = VIZ.spiral;
    const { t: sx, a: sy, f: sz } = this.axis;
    const tn = (cx + WORLD_W / 2) / WORLD_W;
    const u = ((WORLD_D / 2 - cz) / WORLD_D - 0.5) * S.span * sz; // frequency, centred
    const v = (cy / WORLD_H) * S.span * sy; // amplitude
    const th = tn * S.turns * Math.PI * 2;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const r = S.offset + u;
    return out.set(r * c - v * s, tn * S.height * sx, r * s + v * c);
  }

  private buildSpiral() {
    const S = VIZ.spiral;
    const T = this.frames();
    const ts: number[] = [];
    const ks: number[] = [];
    for (let t = 0; t < T; t += S.tStride) for (let k = 0; k < N_BINS; k += S.kStride) {
      ts.push(t);
      ks.push(k);
    }
    const n = ts.length;
    const mesh = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(S.radius, 1),
      new THREE.MeshLambertMaterial(),
      n,
    );
    mesh.setColorAt(0, new THREE.Color());
    mesh.frustumCulled = false;
    this.world.add(mesh);
    this.spiral = { mesh, t: Int32Array.from(ts), k: Int32Array.from(ks), pos: new Float32Array(n * 3) };
  }

  private updateSpiral(geom: boolean) {
    if (!this.spiral) {
      this.buildSpiral();
      geom = true;
    }
    const sp = this.spiral!;
    const IC = sp.mesh.instanceColor!.array as Float32Array;
    for (let j = 0; j < sp.t.length; j++) {
      const i = sp.t[j] * N_BINS + sp.k[j];
      IC[j * 3] = this.colors[i * 3];
      IC[j * 3 + 1] = this.colors[i * 3 + 1];
      IC[j * 3 + 2] = this.colors[i * 3 + 2];
      if (geom) {
        this.spiralPos(this.map.xOfFrame(sp.t[j]), this.heights[i], this.map.zOfBin[sp.k[j]], tmpV);
        sp.pos[j * 3] = tmpV.x;
        sp.pos[j * 3 + 1] = tmpV.y;
        sp.pos[j * 3 + 2] = tmpV.z;
        tmpM.makeTranslation(tmpV.x, tmpV.y, tmpV.z);
        sp.mesh.setMatrixAt(j, tmpM);
      }
    }
    if (geom) sp.mesh.instanceMatrix.needsUpdate = true;
    sp.mesh.instanceColor!.needsUpdate = true;
  }

  // ---------------- picking ----------------

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

  /** Returns a pick in canonical coordinates, whatever the display mode, so the game tools stay unchanged. */
  pick(clientX: number, clientY: number): Pick | null {
    if (!this.session) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    const o = this.ray.ray.origin;
    const d = this.ray.ray.direction;
    if (this.mode === 'spiral') return this.pickSpiral(o, d);
    let best: Pick | null = null;
    let bestDist = Infinity;
    for (const c of this.copies()) {
      const oc = new THREE.Vector3((o.x - c.ox) / c.ax, o.y / c.ay, o.z / c.az);
      const dc = new THREE.Vector3(d.x / c.ax, d.y / c.ay, d.z / c.az).normalize();
      const p = this.marchCanonical(oc, dc);
      if (!p) continue;
      const dist = tmpV.set(c.ox + p.x * c.ax, p.y * c.ay, p.z * c.az).distanceTo(o);
      if (dist < bestDist) {
        bestDist = dist;
        best = p;
      }
    }
    return best;
  }

  /** Ray-march the canonical height field (much faster than triangle raycasting on 320k faces). */
  private marchCanonical(o: THREE.Vector3, d: THREE.Vector3): Pick | null {
    const maxY = WORLD_H + this.unfold * 6 + 0.1;
    const box = new THREE.Box3(new THREE.Vector3(-WORLD_W / 2, -0.01, -WORLD_D / 2), new THREE.Vector3(WORLD_W / 2, maxY, WORLD_D / 2));
    const r = new THREE.Ray(o, d);
    const hit = new THREE.Vector3();
    if (!r.intersectBox(box, hit)) return null;
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

  /** Nearest sphere along the ray. Falls back to the closest sphere near the ray so hovering feels forgiving. */
  private pickSpiral(o: THREE.Vector3, d: THREE.Vector3): Pick | null {
    const sp = this.spiral;
    if (!sp) return null;
    const R = VIZ.spiral.radius;
    const hitR2 = (R * 1.6) ** 2;
    const nearR2 = (R * 6) ** 2;
    let best = -1;
    let bestS = Infinity;
    let near = -1;
    let nearD = Infinity;
    const P = sp.pos;
    for (let j = 0; j < sp.t.length; j++) {
      const wx = P[j * 3] - o.x, wy = P[j * 3 + 1] - o.y, wz = P[j * 3 + 2] - o.z;
      const s = wx * d.x + wy * d.y + wz * d.z;
      if (s <= 0) continue;
      const d2 = wx * wx + wy * wy + wz * wz - s * s;
      if (d2 < hitR2 && s < bestS) {
        bestS = s;
        best = j;
      } else if (d2 < nearR2 && d2 < nearD) {
        nearD = d2;
        near = j;
      }
    }
    const j = best >= 0 ? best : near;
    if (j < 0) return null;
    const t = sp.t[j];
    const k = sp.k[j];
    return { x: this.map.xOfFrame(t), z: this.map.zOfBin[k], y: this.heights[t * N_BINS + k], t, k };
  }

  // ---------------- overlays ----------------

  /** Canonical point -> the overlay's local space (identity, except in the spiral). */
  private ov(x: number, y: number, z: number) {
    const v = new THREE.Vector3(x, y, z);
    return this.mode === 'spiral' ? this.spiralPos(x, y, z, v) : v;
  }

  /** Set line points, growing the buffer when needed (setFromPoints never grows an existing buffer). */
  private setLine(o: THREE.Line, pts: THREE.Vector3[]) {
    let attr = o.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!attr || attr.count < pts.length) {
      o.geometry.dispose();
      o.geometry = new THREE.BufferGeometry();
      attr = new THREE.BufferAttribute(new Float32Array(Math.max(pts.length, 64) * 3), 3);
      o.geometry.setAttribute('position', attr);
    }
    const a = attr.array as Float32Array;
    pts.forEach((p, i) => a.set([p.x, p.y, p.z], i * 3));
    attr.needsUpdate = true;
    o.geometry.setDrawRange(0, pts.length);
    o.geometry.computeBoundingSphere();
  }

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
      pts.push(this.ov(x, this.heightAt(x, z) + 0.04, z));
    }
    this.setLine(this.cursor, pts);
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
        pts.push(this.ov(xa, this.heightAt(xa, za) + 0.05, za), this.ov(xb, this.heightAt(xb, zb) + 0.05, zb));
      }
    }
    this.setLine(this.forkLines, pts);
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
        pts.push(this.ov(x, this.heightAt(x, z) + 0.05, z));
      }
    }
    this.setLine(this.boxLine, pts);
    this.boxLine.visible = true;
  }

  showMarkers(frames: number[], kLo: number, kHi: number) {
    const pts: THREE.Vector3[] = [];
    const zLo = this.map.zOfBin[Math.round(kLo)];
    const zHi = this.map.zOfBin[Math.round(kHi)];
    for (const t of frames) {
      const x = this.map.xOfFrame(t);
      pts.push(this.ov(x, WORLD_H + 0.3, zLo), this.ov(x, WORLD_H + 0.3, zHi));
      pts.push(this.ov(x, 0, zLo), this.ov(x, WORLD_H + 0.3, zLo));
    }
    this.setLine(this.markers, pts);
    this.markers.visible = pts.length > 0;
  }

  clearOverlays() {
    this.cursor.visible = false;
    this.forkLines.visible = false;
    this.boxLine.visible = false;
    this.markers.visible = false;
  }

  setPlayhead(sec: number | null) {
    this.playSec = sec;
    if (sec === null) {
      this.playhead.visible = false;
      this.spiralRing.visible = false;
      return;
    }
    if (this.mode === 'spiral') {
      this.spiralRing.visible = true;
      this.spiralRing.position.y = (VIZ.spiral.height * this.axis.t * sec) / CLIP_SECONDS;
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
    const { t: sx, a: sy } = this.axis;
    if (this.mode === 'spiral') {
      const H = VIZ.spiral.height * sx;
      const D = Math.max(18, H * 1.9);
      this.controls.target.set(0, H / 2, 0);
      if (view === 'top') this.camera.position.set(0, H + D, 0.01);
      else if (view === 'side') this.camera.position.set(0, H / 2, D);
      else this.camera.position.set(D * 0.7, H / 2 + D * 0.25, D * 0.7);
      return;
    }
    const mirrored = this.mode === 'symmetry' && VIZ.symmetry.variant === 'amp';
    const ty = mirrored ? 0 : 0.4 * sy;
    this.controls.target.set(0, ty, 0);
    const zoom = Math.max(1, sx * 0.85);
    if (view === 'top') this.camera.position.set(0, 21 * zoom, 0.01);
    else if (view === 'side') this.camera.position.set(0, ty + 3, 15 * zoom);
    else if (mirrored) this.camera.position.set(-4 * zoom, 3.5, 17 * zoom);
    else this.camera.position.set(-2.5 * zoom, 10.5 * zoom, 15.5 * zoom);
  }

  private frame() {
    // the mirror overlays share material with the originals but must follow geometry swaps and visibility
    if (this.mirror.visible) {
      this.overlays().forEach((o, i) => {
        const c = this.mirrorOverlays[i] as THREE.Line;
        c.geometry = o.geometry;
        c.visible = o.visible;
      });
      this.mirrorPlayhead.visible = this.playhead.visible;
      this.mirrorPlayhead.position.copy(this.playhead.position);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labels.render(this.scene, this.camera);
  }
}
