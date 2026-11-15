import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { BIN_HZ, CLIP_SECONDS, N_BINS, SR } from '../dsp/stft';
import type { Session } from '../game/session';
import type { Mapping } from '../game/tools';
import { U, withFog, withMirror, withMirrorLines, withWater } from './shaders';
import { LEVEL_THEME, applyPaint, applyUiTheme, themeById, type Theme } from './themes';
import { CLASSES } from '../game/catalog';
import { pillarGeometry, withPillar } from './pillar';
import { DiscMode } from './disc';
import { FogVolume } from './fogvolume';
import { DISC } from './disc';
import type { ModeCtx, ModeView } from './modetypes';

export const WORLD_W = 16; // time axis (x)
export const WORLD_D = 9; // frequency axis (z)
export const WORLD_H = 2.4; // amplitude axis (y)

const hzToMel = (hz: number) => 2595 * Math.log10(1 + hz / 700);
const MEL_MAX = hzToMel(SR / 2);

/** Perceptual (mel) warp so low-frequency animal calls get room on the surface. */
export const zOfHz = (hz: number) => WORLD_D / 2 - (WORLD_D * hzToMel(hz)) / MEL_MAX;

// ---------------- colour ramp (set by the theme) ----------------

const RAMP_POS = [0, 0.22, 0.45, 0.7, 1];
let RAMP: [number, [number, number, number]][] = [];

function setRamp(t: Theme) {
  RAMP = t.ramp.map((hex, i) => {
    const c = new THREE.Color(hex);
    return [RAMP_POS[i], [c.r, c.g, c.b]];
  });
}

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

export type VizMode = 'surface' | 'rounded' | 'voxel' | 'skyline' | 'drops' | 'disc' | 'spiral' | 'symmetry';

/** Modes offered in the View lab. Surface, rounded, skyline and disc still exist in code (symmetry builds on the surface). */
export const VIZ_MODES: { id: VizMode; label: string }[] = [
  { id: 'voxel', label: 'Voxels' },
  { id: 'drops', label: 'Drop lines' },
  { id: 'spiral', label: 'Spiral' },
  { id: 'symmetry', label: 'Symmetry' },
];

/**
 * Look parameters. Everything here is safe to tweak: the panel edits these
 * values and calls view.rebuildViz() to apply them.
 */
export const VIZ = {
  /** 1 = full data resolution, 0.1 = a tenth of it. One value per mode. */
  res: { surface: 1, rounded: 0.5, voxel: 0.3, skyline: 0.3, drops: 0.5, disc: 0.35, spiral: 0.35, symmetry: 1 } as Record<VizMode, number>,
  /** surface material for Surface, Rounded and the top of Symmetry */
  material: 'matte' as 'matte' | 'water',
  atmosphere: {
    fog: 0.5, // density of the ground fog (0 = off)
    height: 0.35, // fog top as a fraction of the amplitude axis
  },
  rounded: {
    softness: 1, // blur passes on the coarse grid before the curves
    base: 0.35, // depth of the solid below zero
    sub: 3, // curve samples per coarse cell
  },
  voxel: {
    step: 0, // height terraces (0 = smooth heights)
    gap: 0.08, // empty space between columns, as a fraction of the cell (0 = touching)
    round: 0.55, // roundness of the column tops (0 = flat)
  },
  drops: {
    points: true, // dot on top of each line
    glow: false, // additive blending
    fade: 0.08, // brightness at the foot of each line
  },
  spiral: {
    layout: 'wrap' as 'wrap' | 'ribbon', // wrap = amplitude is the distance from the axis, ribbon = round 1 layout
    style: 'rays' as 'dots' | 'rays' | 'surface',
    height: 12, // world height of the time axis at time scale 1
    span: 5, // equal grid length of frequency and amplitude
    turns: 0.6, // full rotations over the clip
    offset: 1.4, // wrap: inner radius, ribbon: distance of the ribbon centre from the axis
    arc: 0.92, // wrap: fraction of the circle used by the frequency axis
    radius: 0.022, // dot radius, equal for all points
  },
  skyline: {
    depth: 0.8, // how far the blocks hang below zero, in amplitude axis lengths
    merge: 0.18, // height difference that still merges neighbours into one bigger block
    gap: 0.1, // space between blocks, as a fraction of the cell
  },
  symmetry: {
    fade: 0.7, // depth (in amplitude axis lengths) where the reflection is gone
    lines: true, // thin lines that take over where the reflection fades
  },
};

/** Canonical (x, y, z) -> display: d = (ox + x*ax, y*ay, z*az). Symmetry renders two of these. */
interface Copy {
  ox: number;
  ax: number;
  ay: number;
  az: number;
}

/** Strided grid over frames and bins. Each cell max-pools a block of sT x sK spectrogram cells. */
interface BinGrid {
  sT: number;
  sK: number;
  nT: number;
  nK: number;
  tc: Float32Array; // centre frame per column
  kc: Float32Array; // centre bin per row
  h: Float32Array;
  col: Float32Array;
}

/** Uniform grid in canonical world space (square-ish cells). */
interface UniGrid {
  NX: number;
  NZ: number;
  cw: number;
  cd: number;
  tLo: Int32Array;
  tHi: Int32Array;
  kLo: Int32Array;
  kHi: Int32Array;
  h: Float32Array; // max
  m: Float32Array; // mean
  col: Float32Array;
}

const stride = (res: number) => Math.max(1, Math.round(1 / res));
const tmpM = new THREE.Matrix4();
const tmpV = new THREE.Vector3();

/** Border of an nx x nz vertex grid (index a * nz + b) as one closed loop. */
function edgeLoop(nx: number, nz: number) {
  const edge: number[] = [];
  for (let a = 0; a < nx; a++) edge.push(a * nz);
  for (let b = 1; b < nz; b++) edge.push((nx - 1) * nz + b);
  for (let a = nx - 2; a >= 0; a--) edge.push(a * nz + nz - 1);
  for (let b = nz - 2; b >= 1; b--) edge.push(b);
  return edge;
}

/** Catmull-Rom weights for the 4 neighbours at fraction f. */
function crw(f: number, out: Float32Array) {
  const f2 = f * f;
  const f3 = f2 * f;
  out[0] = 0.5 * (-f3 + 2 * f2 - f);
  out[1] = 0.5 * (3 * f3 - 5 * f2 + 2);
  out[2] = 0.5 * (-3 * f3 + 4 * f2 + f);
  out[3] = 0.5 * (f3 - f2);
}

export class SpectroView {
  readonly renderer: THREE.WebGLRenderer;
  readonly labels: CSS2DRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
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
  private hemi = new THREE.HemisphereLight(0xcfe9ff, 0x0a1a14, 1.6);
  private sun = new THREE.DirectionalLight(0xffffff, 1.6);
  whiten = false;
  unfold = 0;
  private dirtyHeights = true;
  private container: HTMLElement;
  private clock = new THREE.Clock();
  private hfogDensity = 0.5;
  /** soft drifting fog puffs that fill the space around the model */
  private fogVolume = new FogVolume();

  // playground state
  mode: VizMode = 'voxel';
  readonly axis = { t: 1, f: WORLD_W / WORLD_D, a: 1 };
  /** near-isometric camera: very narrow field of view from far away */
  iso = false;
  theme: Theme;
  themeChoice = 'auto';
  onThemeChange: () => void = () => {};
  /** canonical layout, scaled by the axis sliders (copy 0) */
  private world = new THREE.Group();
  /** reflection for the symmetry mode */
  private mirror = new THREE.Group();
  private mirrorOverlays: THREE.Object3D[] = [];
  private mirrorPlayhead: THREE.Group;
  private symPlane: THREE.Mesh;
  private surf: {
    s: number; g: BinGrid; geo: THREE.BufferGeometry; mesh: THREE.Mesh; mirror: THREE.Mesh; matte: THREE.Material; water: THREE.Material; skirt: Int32Array;
  } | null = null;
  private rnd: {
    g: UniGrid; nx: number; nz: number; G: Float32Array; GC: Float32Array;
    geo: THREE.BufferGeometry; mesh: THREE.Mesh; matte: THREE.Material; water: THREE.Material; nTop: number; skirt: Int32Array;
  } | null = null;
  private vox: { g: UniGrid; body: THREE.InstancedMesh; top: Float32Array } | null = null;
  private sky: { g: UniGrid; mesh: THREE.InstancedMesh; top: Float32Array } | null = null;
  private disc: ModeView | null = null;
  private drops: { g: BinGrid; lines: THREE.LineSegments; points: THREE.Points } | null = null;
  private symLines: { g: BinGrid; lines: THREE.LineSegments } | null = null;
  private spiral: { g: BinGrid; pos: Float32Array; obj: THREE.Object3D } | null = null;
  private spiralDeco = new THREE.Group();
  private spiralRing: THREE.Group;
  private spiralLabels: CSS2DObject[] = [];
  private spiralAxis: THREE.Line;
  private morph: { from: VizMode; to: VizMode; t0: number; dur: number } | null = null;
  private clipTarget = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  private clipSource = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  private sweep: THREE.Mesh;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setClearColor(0x050b10, 1);
    this.renderer.localClippingEnabled = true;
    container.appendChild(this.renderer.domElement);
    this.labels = new CSS2DRenderer();
    this.labels.domElement.className = 'labels-layer';
    container.appendChild(this.labels.domElement);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 900);
    this.camera.position.set(-2.5, 10.5, 15.5);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.4, 0);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 60;

    this.scene.fog = new THREE.Fog(0x050b10, 22, 60);
    this.scene.add(this.hemi);
    const sun = this.sun;
    sun.position.set(-6, 10, 6);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x66ccff, 0.6);
    rim.position.set(8, 4, -10);
    this.scene.add(rim);
    // lights the underside of the reflection in the symmetry mode
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
      new THREE.MeshBasicMaterial({ color: 0x56c8ff, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }),
    );
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)), new THREE.LineBasicMaterial({ color: 0x56c8ff, transparent: true, opacity: 0.35 }));
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

    // the build sweep: a soft glowing wall that turns drop lines into a solid
    this.sweep = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.sweep.visible = false;
    this.scene.add(this.sweep);
    this.scene.add(this.fogVolume.object);

    this.theme = themeById('lagoon');

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(container);
    this.resize();
    this.buildAxes();
    this.setTheme('auto');
    this.applyLayout();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  private overlays() {
    return [this.cursor, this.forkLines, this.boxLine, this.markers];
  }

  private frames() {
    return this.session?.frames ?? 626;
  }

  get currentSession() {
    return this.session;
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
    this.axisGroup.add(this.ampAxis);
    this.buildAmpAxis();
  }

  /**
   * Amplitude scale at the far corner. Seen from the side it stands upright. The more the
   * camera looks down, the more it leans outward, so from above it lies flat like a ruler
   * and the dB values stay readable.
   */
  private ampAxis = new THREE.Group();
  private ampAxisWhiten: boolean | null = null;
  private ampTicks: { h: number; label: CSS2DObject }[] = [];
  private ampTitle: CSS2DObject | null = null;
  private ampLine: THREE.LineSegments | null = null;
  private ampLean = -1;
  private buildAmpAxis() {
    if (this.ampAxisWhiten === this.whiten) return;
    this.ampAxisWhiten = this.whiten;
    for (const c of [...this.ampAxis.children]) {
      this.ampAxis.remove(c);
      if (c instanceof CSS2DObject) c.element.remove();
      if (c instanceof THREE.LineSegments) c.geometry.dispose();
    }
    // the same mapping as the heights: v = share of the scale, height = v^1.6 of the full height
    const ticks: [number, string][] = this.whiten
      ? [0, 8, 16, 24, 32].map((d) => [(d + 2) / 34, d === 0 ? 'background' : `+${d} dB`])
      : [0, 12, 24, 36, 48].map((d) => [1 - d / 66, d === 0 ? '0 dB' : `-${d} dB`]);
    const mk = (text: string, cls: string) => {
      const el = document.createElement('div');
      el.className = cls;
      el.textContent = text;
      const o = new CSS2DObject(el);
      this.ampAxis.add(o);
      return o;
    };
    this.ampTicks = ticks.map(([v, text]) => ({ h: Math.max(0, v) ** 1.6 * WORLD_H, label: mk(text, 'axis-label') }));
    this.ampTitle = mk(this.whiten ? 'above background' : 'amplitude', 'axis-title');
    this.ampLine = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x4a6b78 }));
    this.ampAxis.add(this.ampLine);
    this.ampLean = -1;
    this.placeAmpAxis(this.lastLean);
  }

  private lastLean = 0;
  /** lean 0 = upright, 1 = lying flat and pointing away from the landscape */
  private placeAmpAxis(lean: number) {
    if (!this.ampLine || Math.abs(lean - this.ampLean) < 0.005) return;
    this.ampLean = lean;
    const x0 = WORLD_W / 2;
    const z0 = -WORLD_D / 2;
    // the axis group is stretched like the landscape (time by axis.t, frequency by axis.f, height by axis.a),
    // so directions are given in screen-true (world) units and divided by that stretch
    const { t: ax, f: az, a: ay } = this.axis;
    const world = (x: number, z: number) => new THREE.Vector3(x / ax, 0, z / az);
    const out = world(Math.SQRT1_2, -Math.SQRT1_2); // exactly 45 degrees, away from the landscape
    const at = (h: number) => new THREE.Vector3(x0, h * (1 - lean), z0).addScaledVector(out, h * ay * lean * 1.25);
    const pts = [at(0), at(WORLD_H)];
    // tick marks and labels sit beside the axis, on the side away from the landscape
    const side = world(Math.SQRT1_2, Math.SQRT1_2).multiplyScalar(lean).add(world(1 - lean, 0));
    for (const t of this.ampTicks) {
      const p = at(t.h);
      pts.push(p, p.clone().addScaledVector(side, 0.25));
      t.label.position.copy(p).addScaledVector(side, 0.85);
    }
    this.ampTitle!.position.copy(at(WORLD_H)).addScaledVector(out, 0.5).add(new THREE.Vector3(0, 0.45 * (1 - lean), 0));
    this.ampLine.geometry.setFromPoints(pts);
  }

  // ---------------- reveal when a landscape opens ----------------

  private revealStart = -1;
  /** seconds the reveal takes */
  static REVEAL_SECONDS = 0.75;

  /** Build the landscape up along the time axis, from 0 s to the end, with a slight spring. */
  reveal() {
    this.revealStart = performance.now();
    this.stepReveal();
  }

  private stepReveal() {
    if (this.revealStart < 0) return;
    const p = (performance.now() - this.revealStart) / 1000 / SpectroView.REVEAL_SECONDS;
    if (p >= 1) {
      this.revealStart = -1;
      U.reveal.value.w = 0;
      return;
    }
    // the front decelerates softly; each slice then springs up on its own
    const ease = 1 - (1 - p) ** 2;
    if (this.mode === 'spiral') {
      const h = VIZ.spiral.height * this.axis.t;
      U.reveal.value.set(1, -0.5 + (h + 1) * ease, 1, 1);
      return;
    }
    const half = (WORLD_W * this.axis.t) / 2;
    const zone = WORLD_W * this.axis.t * 0.3;
    U.reveal.value.set(0, -half + (2 * half + zone) * ease, zone, 1);
  }

  /** Called every frame: lean the amplitude axis by how much the camera looks down. */
  private updateAmpLean() {
    const d = tmpV.copy(this.camera.position).sub(this.controls.target).normalize();
    const l = THREE.MathUtils.smoothstep(d.y, 0.72, 0.97);
    this.lastLean = l;
    this.placeAmpAxis(l);
  }

  // ---------------- theme ----------------

  /** 'auto' follows the level. */
  setTheme(choice: string) {
    this.themeChoice = choice;
    const id = choice === 'auto' ? LEVEL_THEME[this.session?.level?.id ?? ''] ?? 'glacier' : choice;
    const t = themeById(id);
    this.theme = t;
    setRamp(t);
    applyUiTheme(t);
    // brush and layer colours come from the theme too
    applyPaint(t, this.session?.level?.targets ?? []);
    for (const l of this.session?.layers ?? []) l.color = CLASSES[l.cls].color;
    // sky: a subtle tint at the top that melts into the fog colour at the horizon
    const cv = document.createElement('canvas');
    cv.width = 2;
    cv.height = 256;
    const ctx = cv.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    for (const [at, c] of t.sky ?? [[0, t.bg], [0.55, t.bg], [1, t.fog]] as [number, string][]) grad.addColorStop(at, c);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    (this.scene.background as THREE.Texture | null)?.dispose?.();
    this.scene.background = tex;
    (this.scene.fog as THREE.Fog).color.set(t.fog);
    U.waterTint.value.set(t.accent2);
    // light tinted by the theme: a soft coloured sky above, the fog colour bouncing from below
    this.hemi.color.set(0xffffff).lerp(new THREE.Color(t.accent2), 0.25);
    this.hemi.groundColor.set(t.fog);
    this.sun.color.set(0xffffff).lerp(new THREE.Color(t.accent), 0.15);
    const gm = this.grid.material as THREE.LineBasicMaterial;
    gm.vertexColors = false;
    gm.color.set(t.fog).multiplyScalar(t.light ? 0.82 : 1.4);
    this.container.classList.toggle('light-theme', t.light);
    gm.transparent = true;
    gm.opacity = 0.35;
    (this.symPlane.material as THREE.MeshBasicMaterial).color.set(t.accent2);
    (this.symPlane.children[0] as THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>).material.color.set(t.accent2);
    if (this.session) this.refresh();
    this.onThemeChange();
    window.dispatchEvent(new Event('viz-theme'));
  }

  setSession(s: Session) {
    this.session = s;
    this.heights = new Float32Array(s.frames * N_BINS);
    this.colors = new Float32Array(s.frames * N_BINS * 3);
    this.disposeModes();
    this.dirtyHeights = true;
    if (this.themeChoice === 'auto') this.setTheme('auto');
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
    // colour contrast: stretch the shade between two percentiles, so the theme
    // gradient runs from the valleys to the peaks instead of sitting in the middle
    const sample = new Float32Array(Math.min(n, 20000));
    for (let i = 0; i < sample.length; i++) sample[i] = this.shade[Math.floor((i * n) / sample.length)];
    sample.sort();
    const lo = sample[Math.floor(sample.length * 0.15)];
    const hi = sample[Math.floor(sample.length * 0.997)];
    const span = Math.max(0.05, hi - lo);
    for (let i = 0; i < n; i++) {
      const v = (this.shade[i] - lo) / span;
      this.shade[i] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  }

  markHeightsDirty() {
    this.dirtyHeights = true;
    this.buildAmpAxis();
  }

  /** Recompute colours (and heights if needed) from the layer masks, then update the active mode. */
  refresh() {
    const s = this.session;
    if (!s) return;
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
    if (heightsChanged) this.dirtyHeights = false;
    this.updateMode(heightsChanged);
  }

  // ---------------- grids ----------------

  private binGrid(sT: number, sK: number): BinGrid {
    const T = this.frames();
    const nT = Math.ceil(T / sT);
    const nK = Math.ceil(N_BINS / sK);
    const tc = new Float32Array(nT);
    const kc = new Float32Array(nK);
    for (let i = 0; i < nT; i++) tc[i] = Math.min(T - 1, i * sT + (sT - 1) / 2);
    for (let j = 0; j < nK; j++) kc[j] = Math.min(N_BINS - 1, j * sK + (sK - 1) / 2);
    return { sT, sK, nT, nK, tc, kc, h: new Float32Array(nT * nK), col: new Float32Array(nT * nK * 3) };
  }

  private poolBin(g: BinGrid, geom: boolean) {
    const T = this.frames();
    const H = this.heights;
    const C = this.colors;
    for (let i = 0; i < g.nT; i++) {
      const t0 = i * g.sT;
      const t1 = Math.min(T, t0 + g.sT);
      for (let j = 0; j < g.nK; j++) {
        const k0 = j * g.sK;
        const k1 = Math.min(N_BINS, k0 + g.sK);
        const o = i * g.nK + j;
        let hMax = 0;
        let wr = 0, wg = 0, wb = 0, ws = 0;
        for (let t = t0; t < t1; t++)
          for (let k = k0; k < k1; k++) {
            const idx = t * N_BINS + k;
            const h = H[idx];
            if (h > hMax) hMax = h;
            const w = h + 0.05;
            wr += C[idx * 3] * w;
            wg += C[idx * 3 + 1] * w;
            wb += C[idx * 3 + 2] * w;
            ws += w;
          }
        if (geom) g.h[o] = hMax;
        g.col[o * 3] = wr / ws;
        g.col[o * 3 + 1] = wg / ws;
        g.col[o * 3 + 2] = wb / ws;
      }
    }
  }

  private binX(g: BinGrid, i: number) {
    return this.map.xOfFrame(g.tc[i]);
  }

  private binZ(g: BinGrid, j: number) {
    return zOfHz(g.kc[j] * BIN_HZ);
  }

  /** Nearest pooled height of a bin grid at canonical (x, z). */
  private binH(g: BinGrid, x: number, z: number) {
    const i = Math.round((this.frameOfX(x) - (g.sT - 1) / 2) / g.sT);
    const j = Math.round((this.binOfZ(z) - (g.sK - 1) / 2) / g.sK);
    if (i < 0 || i >= g.nT || j < 0 || j >= g.nK) return 0;
    return g.h[i * g.nK + j];
  }

  /** Uniform grid whose cells are square on screen: `cell` is the displayed size, so the axis sliders are taken into account. */
  private uniGrid(cell: number): UniGrid {
    const NX = Math.max(8, Math.round((WORLD_W * this.axis.t) / cell));
    const NZ = Math.max(4, Math.round((WORLD_D * this.axis.f) / cell));
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
    const n = NX * NZ;
    return { NX, NZ, cw, cd, tLo, tHi, kLo, kHi, h: new Float32Array(n), m: new Float32Array(n), col: new Float32Array(n * 3) };
  }

  private poolUni(g: UniGrid, geom: boolean) {
    const H = this.heights;
    const C = this.colors;
    for (let i = 0; i < g.NX; i++)
      for (let j = 0; j < g.NZ; j++) {
        let hMax = 0;
        let hSum = 0;
        let wr = 0, wg = 0, wb = 0, ws = 0, n = 0;
        for (let t = g.tLo[i]; t <= g.tHi[i]; t++)
          for (let k = g.kLo[j]; k <= g.kHi[j]; k++) {
            const idx = t * N_BINS + k;
            const h = H[idx];
            if (h > hMax) hMax = h;
            hSum += h;
            n++;
            const w = h + 0.05;
            wr += C[idx * 3] * w;
            wg += C[idx * 3 + 1] * w;
            wb += C[idx * 3 + 2] * w;
            ws += w;
          }
        const o = i * g.NZ + j;
        if (geom) {
          g.h[o] = hMax;
          g.m[o] = hSum / n;
        }
        g.col[o * 3] = wr / ws;
        g.col[o * 3 + 1] = wg / ws;
        g.col[o * 3 + 2] = wb / ws;
      }
  }

  // ---------------- modes ----------------

  setMode(m: VizMode, keepCamera = false) {
    this.endMorph();
    if (m === this.mode) return;
    this.mode = m;
    this.applyLayout();
    this.updateMode(true);
    if (!keepCamera) this.resetCamera('perspective');
  }

  setAxis(t: number, f: number, a: number) {
    this.ampLean = -1; // the amplitude axis follows the new stretch
    const footprint = t !== this.axis.t || f !== this.axis.f;
    this.axis.t = t;
    this.axis.f = f;
    this.axis.a = a;
    // grid modes keep square cells on screen, so a new footprint means a new grid
    if (footprint && (this.mode === 'voxel' || this.mode === 'rounded' || this.mode === 'skyline')) this.disposeModes();
    if (this.disc) this.disposeDisc();
    this.applyLayout();
    if (this.mode === 'spiral' || this.mode === 'disc' || footprint) this.updateMode(true);
  }

  /** Throw away the per-mode objects so they are rebuilt with the current VIZ parameters. */
  rebuildViz() {
    this.disposeModes();
    this.applyLayout();
    this.updateMode(true);
  }

  private disposeObj(o: THREE.Object3D | null | undefined) {
    if (!o) return;
    o.parent?.remove(o);
    o.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if ((c as THREE.InstancedMesh).isInstancedMesh) (c as THREE.InstancedMesh).dispose();
    });
  }

  private disposeModes() {
    this.endMorph();
    if (this.surf) {
      this.disposeObj(this.surf.mesh);
      this.mirror.remove(this.surf.mirror);
      this.surf = null;
    }
    if (this.rnd) this.disposeObj(this.rnd.mesh);
    this.rnd = null;
    if (this.vox) this.disposeObj(this.vox.body);
    this.vox = null;
    if (this.drops) {
      this.disposeObj(this.drops.lines);
      this.disposeObj(this.drops.points);
    }
    this.drops = null;
    if (this.symLines) this.disposeObj(this.symLines.lines);
    this.symLines = null;
    if (this.spiral) this.disposeObj(this.spiral.obj);
    this.spiral = null;
    if (this.sky) this.disposeObj(this.sky.mesh);
    this.sky = null;
    this.disposeDisc();
  }

  private disposeDisc() {
    this.disc?.dispose();
    this.disc = null;
  }

  copies(): Copy[] {
    const { t: sx, a: sy, f: sz } = this.axis;
    if (this.mode === 'spiral' || this.mode === 'disc') return [{ ox: 0, ax: 1, ay: 1, az: 1 }];
    if (this.mode === 'symmetry')
      return [
        { ox: 0, ax: sx, ay: sy, az: sz },
        { ox: 0, ax: sx, ay: -sy, az: sz },
      ];
    return [{ ox: 0, ax: sx, ay: sy, az: sz }];
  }

  /** Canonical -> display (copy 0). */
  toDisplay(x: number, y: number, z: number) {
    const c = this.copies()[0];
    return new THREE.Vector3(c.ox + x * c.ax, y * c.ay, z * c.az);
  }

  /** Display (x, z) -> canonical (copy 0). */
  toCanonical(x: number, z: number) {
    const c = this.copies()[0];
    return { x: (x - c.ox) / c.ax, z: z / c.az };
  }

  /** Group transforms, visibility, fog and helper geometry for the current mode and axis scales. */
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
    this.axisGroup.visible = m !== 'spiral' && m !== 'disc';
    this.spiralDeco.visible = m === 'spiral';
    this.playhead.visible = m !== 'spiral' && m !== 'disc' && this.playSec !== null;

    const { t: sx, a: sy, f: sz } = this.axis;
    this.symPlane.visible = m === 'symmetry';
    this.grid.position.y = -0.02;
    this.grid.visible = m !== 'rounded';
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.underLight.intensity = 0;
    // ground fog: the terrain rises out of it
    const A = VIZ.atmosphere;
    U.hfog.value.set(-0.05, Math.max(0.05, A.height * WORLD_H * sy), A.fog, 0);
    U.water.value.y = 0.5 * WORLD_H * sy; // crest height for the water colours
    if (m === 'spiral') U.hfog.value.z = 0;
    if (m === 'rounded') U.hfog.value.x = -VIZ.rounded.base * sy;
    if (m === 'skyline') {
      // the hanging undersides dissolve into the fog
      U.hfog.value.set(-VIZ.skyline.depth * WORLD_H * sy, 0.15 * WORLD_H * sy, Math.max(A.fog, 0.85), 0);
    }
    if (m === 'symmetry') {
      const fade = VIZ.symmetry.fade * WORLD_H * sy;
      U.mirror.value.set(fade, fade * 2.2, 6 / sx);
      U.hfog.value.set(-fade * 2, 0.05 * WORLD_H * sy, Math.max(A.fog, 0.6), 0);
      this.symPlane.rotation.set(-Math.PI / 2, 0, 0);
      this.symPlane.scale.set(WORLD_W * sx + 0.6, WORLD_D * sz + 0.6, 1);
      this.symPlane.position.set(0, 0, 0);
      this.grid.position.y = -(WORLD_H + this.unfold * 3) * sy * 2 - 0.8;
      this.controls.maxPolarAngle = Math.PI * 0.95;
      this.underLight.intensity = 1.2;
    }

    this.hfogDensity = U.hfog.value.z;

    // spiral time axis, labels and playhead ring
    if (m === 'spiral') {
      const S = VIZ.spiral;
      const H = S.height * sx;
      this.spiralAxis.geometry.dispose();
      this.spiralAxis.geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, H, 0)]);
      this.spiralLabels.forEach((o, s) => o.position.set(0.25, (H * s) / CLIP_SECONDS, 0));
      const r = S.layout === 'wrap' ? S.offset * sz + S.span * 0.8 * sy + 0.3 : S.offset + (S.span / 2) * Math.max(sz, sy) + 0.3;
      this.spiralRing.scale.set(r, 1, r);
      this.spiralRing.visible = this.playSec !== null;
      if (this.playSec !== null) this.spiralRing.position.y = (H * this.playSec) / CLIP_SECONDS;
    }
  }

  private updateMode(geom: boolean) {
    if (!this.session) return;
    const m = this.mode;
    const morphFrom = this.morph?.from;
    if (this.surf) this.surf.mesh.visible = m === 'surface' || m === 'symmetry';
    if (this.surf) this.surf.mirror.visible = m === 'symmetry';
    if (this.rnd) this.rnd.mesh.visible = m === 'rounded';
    if (this.vox) this.vox.body.visible = m === 'voxel';
    if (this.drops) this.drops.lines.visible = this.drops.points.visible = m === 'drops' || morphFrom === 'drops';
    if (this.symLines) this.symLines.lines.visible = m === 'symmetry' && VIZ.symmetry.lines;
    if (this.spiral) this.spiral.obj.visible = m === 'spiral';
    if (this.sky) this.sky.mesh.visible = m === 'skyline';
    if (this.disc) this.disc.object.visible = m === 'disc';
    if (m === 'surface' || m === 'symmetry') this.updateSurface(geom);
    if (m === 'skyline') this.updateSkyline(geom);
    if (m === 'disc') this.updateDisc(geom);
    if (m === 'symmetry' && VIZ.symmetry.lines) this.updateSymLines(geom);
    if (m === 'rounded') this.updateRounded(geom);
    if (m === 'voxel') this.updateVoxel(geom);
    if (m === 'drops' || morphFrom === 'drops') this.updateDrops(geom);
    if (m === 'spiral') this.updateSpiral(geom);
  }

  // ---- surface (also the top of the symmetry mode) ----

  private surfaceMaterials() {
    const matte = withFog(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide }));
    const water = withFog(
      withWater(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.94, emissive: 0x000000 })),
    );
    return { matte, water };
  }

  private updateSurface(geom: boolean) {
    const s = stride(VIZ.res[this.mode]);
    if (this.surf && this.surf.s !== s) {
      this.disposeObj(this.surf.mesh);
      this.mirror.remove(this.surf.mirror);
      this.surf = null;
    }
    if (!this.surf) {
      const g = this.binGrid(s, s);
      const n = g.nT * g.nK;
      // walls down to the zero plane make the surface read as one solid object
      const skirt = Int32Array.from(edgeLoop(g.nT, g.nK));
      const ne = skirt.length;
      const pos = new Float32Array((n + ne * 2) * 3);
      for (let i = 0; i < g.nT; i++)
        for (let j = 0; j < g.nK; j++) {
          const o = i * g.nK + j;
          pos[o * 3] = this.binX(g, i);
          pos[o * 3 + 2] = this.binZ(g, j);
        }
      const idx = new Uint32Array((g.nT - 1) * (g.nK - 1) * 6 + ne * 6);
      let p = 0;
      for (let i = 0; i < g.nT - 1; i++)
        for (let j = 0; j < g.nK - 1; j++) {
          const a = i * g.nK + j;
          const b = (i + 1) * g.nK + j;
          idx[p++] = a; idx[p++] = b; idx[p++] = a + 1;
          idx[p++] = b; idx[p++] = b + 1; idx[p++] = a + 1;
        }
      for (let e = 0; e < ne; e++) {
        const top = n + e * 2;
        const top2 = n + ((e + 1) % ne) * 2;
        idx[p++] = top; idx[p++] = top + 1; idx[p++] = top2;
        idx[p++] = top2; idx[p++] = top + 1; idx[p++] = top2 + 1;
      }
      for (let e = 0; e < ne; e++) {
        const src = skirt[e];
        for (const v of [n + e * 2, n + e * 2 + 1]) {
          pos[v * 3] = pos[src * 3];
          pos[v * 3 + 2] = pos[src * 3 + 2];
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array((n + ne * 2) * 3), 3));
      geo.setIndex(new THREE.BufferAttribute(idx, 1));
      const { matte, water } = this.surfaceMaterials();
      const mesh = new THREE.Mesh(geo, VIZ.material === 'water' ? water : matte);
      const mirror = new THREE.Mesh(geo, withFog(withMirror(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.05, side: THREE.DoubleSide, depthWrite: false }))));
      mirror.renderOrder = 2;
      this.world.add(mesh);
      this.mirror.add(mirror);
      this.surf = { s, g, geo, mesh, mirror, matte, water, skirt };
      geom = true;
    }
    const sf = this.surf;
    sf.mesh.material = VIZ.material === 'water' ? sf.water : sf.matte;
    this.poolBin(sf.g, geom);
    const colA = sf.geo.getAttribute('color') as THREE.BufferAttribute;
    const CC = colA.array as Float32Array;
    CC.set(sf.g.col);
    const n = sf.g.h.length;
    for (let e = 0; e < sf.skirt.length; e++) {
      const src = sf.skirt[e];
      for (const [v, f] of [[n + e * 2, 0.75], [n + e * 2 + 1, 0.3]]) {
        CC[v * 3] = sf.g.col[src * 3] * f;
        CC[v * 3 + 1] = sf.g.col[src * 3 + 1] * f;
        CC[v * 3 + 2] = sf.g.col[src * 3 + 2] * f;
      }
    }
    colA.needsUpdate = true;
    if (geom) {
      const pos = sf.geo.getAttribute('position') as THREE.BufferAttribute;
      const P = pos.array as Float32Array;
      for (let i = 0; i < n; i++) P[i * 3 + 1] = sf.g.h[i];
      for (let e = 0; e < sf.skirt.length; e++) {
        P[(n + e * 2) * 3 + 1] = sf.g.h[sf.skirt[e]];
        P[(n + e * 2 + 1) * 3 + 1] = 0;
      }
      pos.needsUpdate = true;
      sf.geo.computeVertexNormals();
      sf.geo.computeBoundingSphere();
    }
    sf.mesh.visible = true;
    sf.mirror.visible = this.mode === 'symmetry';
  }

  // ---- rounded solid ----

  private updateRounded(geom: boolean) {
    if (!this.rnd) {
      const g = this.uniGrid(0.07 / VIZ.res.rounded);
      const sub = Math.max(1, Math.round(VIZ.rounded.sub));
      const nx = (g.NX - 1) * sub + 1;
      const nz = (g.NZ - 1) * sub + 1;
      const nTop = nx * nz;
      // skirt: every edge vertex gets a top copy (own normals) and a base vertex
      const edge: number[] = [];
      for (let a = 0; a < nx; a++) edge.push(a * nz); // high-z edge
      for (let b = 1; b < nz; b++) edge.push((nx - 1) * nz + b); // end of time
      for (let a = nx - 2; a >= 0; a--) edge.push(a * nz + nz - 1); // low-z edge
      for (let b = nz - 2; b >= 1; b--) edge.push(b); // start of time
      const ne = edge.length;
      const nv = nTop + ne * 2 + 4;
      const pos = new Float32Array(nv * 3);
      const col = new Float32Array(nv * 3);
      const x0 = -WORLD_W / 2 + g.cw / 2;
      const z0 = WORLD_D / 2 - g.cd / 2;
      for (let a = 0; a < nx; a++)
        for (let b = 0; b < nz; b++) {
          const v = a * nz + b;
          pos[v * 3] = x0 + (a / sub) * g.cw;
          pos[v * 3 + 2] = z0 - (b / sub) * g.cd;
        }
      const idx: number[] = [];
      for (let a = 0; a < nx - 1; a++)
        for (let b = 0; b < nz - 1; b++) {
          const p = a * nz + b;
          const q = (a + 1) * nz + b;
          idx.push(p, q, p + 1, q, q + 1, p + 1);
        }
      for (let e = 0; e < ne; e++) {
        const top = nTop + e * 2;
        const e2 = (e + 1) % ne;
        const top2 = nTop + e2 * 2;
        idx.push(top, top + 1, top2, top2, top + 1, top2 + 1);
      }
      // bottom
      const bc = nTop + ne * 2;
      const xs = [x0, x0 + ((nx - 1) / sub) * g.cw];
      const zs = [z0, z0 - ((nz - 1) / sub) * g.cd];
      [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([ix, iz], c) => {
        pos[(bc + c) * 3] = xs[ix];
        pos[(bc + c) * 3 + 2] = zs[iz];
      });
      idx.push(bc, bc + 1, bc + 2, bc, bc + 2, bc + 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.setIndex(idx);
      const { matte, water } = this.surfaceMaterials();
      (matte as THREE.MeshStandardMaterial).roughness = 0.78;
      const mesh = new THREE.Mesh(geo, VIZ.material === 'water' ? water : matte);
      this.world.add(mesh);
      this.rnd = { g, nx, nz, G: new Float32Array(g.NX * g.NZ), GC: new Float32Array(g.NX * g.NZ * 3), geo, mesh, matte, water, nTop, skirt: Int32Array.from(edge) };
      geom = true;
    }
    const r = this.rnd;
    r.mesh.material = VIZ.material === 'water' ? r.water : r.matte;
    const g = r.g;
    this.poolUni(g, geom);
    const NX = g.NX;
    const NZ = g.NZ;
    if (geom) {
      // soft hills: between the mean and the peak, then a few gentle blur passes
      const G = r.G;
      for (let i = 0; i < G.length; i++) G[i] = 0.5 * g.h[i] + 0.5 * g.m[i];
      const tmp = new Float32Array(G.length);
      for (let pass = 0; pass < VIZ.rounded.softness; pass++) {
        for (let i = 0; i < NX; i++)
          for (let j = 0; j < NZ; j++) {
            const a = G[Math.max(0, i - 1) * NZ + j];
            const b = G[Math.min(NX - 1, i + 1) * NZ + j];
            tmp[i * NZ + j] = (a + 2 * G[i * NZ + j] + b) / 4;
          }
        for (let i = 0; i < NX; i++)
          for (let j = 0; j < NZ; j++) {
            const a = tmp[i * NZ + Math.max(0, j - 1)];
            const b = tmp[i * NZ + Math.min(NZ - 1, j + 1)];
            G[i * NZ + j] = (a + 2 * tmp[i * NZ + j] + b) / 4;
          }
      }
    }
    r.GC.set(g.col);
    // Catmull-Rom upsampling of heights and colours
    const sub = (r.nx - 1) / (NX - 1);
    const W = Array.from({ length: sub + 1 }, (_, s) => {
      const w = new Float32Array(4);
      crw(s / sub, w);
      return w;
    });
    const pos = r.geo.getAttribute('position') as THREE.BufferAttribute;
    const colA = r.geo.getAttribute('color') as THREE.BufferAttribute;
    const P = pos.array as Float32Array;
    const CC = colA.array as Float32Array;
    const G = r.G;
    const GC = r.GC;
    for (let a = 0; a < r.nx; a++) {
      let i0 = Math.floor(a / sub);
      let fa = a - i0 * sub;
      if (i0 >= NX - 1) {
        i0 = NX - 2;
        fa = sub;
      }
      const wa = W[fa];
      for (let b = 0; b < r.nz; b++) {
        let j0 = Math.floor(b / sub);
        let fb = b - j0 * sub;
        if (j0 >= NZ - 1) {
          j0 = NZ - 2;
          fb = sub;
        }
        const wb = W[fb];
        let h = 0, cr = 0, cg = 0, cb = 0;
        for (let di = 0; di < 4; di++) {
          const ii = Math.min(NX - 1, Math.max(0, i0 + di - 1));
          for (let dj = 0; dj < 4; dj++) {
            const jj = Math.min(NZ - 1, Math.max(0, j0 + dj - 1));
            const w = wa[di] * wb[dj];
            const o = ii * NZ + jj;
            h += w * G[o];
            cr += w * GC[o * 3];
            cg += w * GC[o * 3 + 1];
            cb += w * GC[o * 3 + 2];
          }
        }
        const v = a * r.nz + b;
        if (geom) P[v * 3 + 1] = Math.max(0, h);
        CC[v * 3] = Math.max(0, cr);
        CC[v * 3 + 1] = Math.max(0, cg);
        CC[v * 3 + 2] = Math.max(0, cb);
      }
    }
    // skirt and bottom
    const baseY = -VIZ.rounded.base;
    for (let e = 0; e < r.skirt.length; e++) {
      const src = r.skirt[e];
      const top = r.nTop + e * 2;
      for (const [v, y, f] of [[top, P[src * 3 + 1], 0.78], [top + 1, baseY, 0.32]] as const) {
        P[v * 3] = P[src * 3];
        P[v * 3 + 1] = y;
        P[v * 3 + 2] = P[src * 3 + 2];
        CC[v * 3] = CC[src * 3] * f;
        CC[v * 3 + 1] = CC[src * 3 + 1] * f;
        CC[v * 3 + 2] = CC[src * 3 + 2] * f;
      }
    }
    const bc = r.nTop + r.skirt.length * 2;
    for (let c = 0; c < 4; c++) P[(bc + c) * 3 + 1] = baseY;
    colA.needsUpdate = true;
    if (geom) {
      pos.needsUpdate = true;
      r.geo.computeVertexNormals();
      r.geo.computeBoundingSphere();
    }
    r.mesh.visible = true;
  }

  /** Height of the rounded solid at canonical (x, z), using the same curves as the mesh. */
  private roundedH(x: number, z: number) {
    const r = this.rnd;
    if (!r) return 0;
    const { NX, NZ, cw, cd } = r.g;
    const fx = (x - (-WORLD_W / 2 + cw / 2)) / cw;
    const fz = (WORLD_D / 2 - cd / 2 - z) / cd;
    const i0 = Math.min(NX - 2, Math.max(0, Math.floor(fx)));
    const j0 = Math.min(NZ - 2, Math.max(0, Math.floor(fz)));
    const wa = new Float32Array(4);
    const wb = new Float32Array(4);
    crw(Math.min(1, Math.max(0, fx - i0)), wa);
    crw(Math.min(1, Math.max(0, fz - j0)), wb);
    let h = 0;
    for (let di = 0; di < 4; di++) {
      const ii = Math.min(NX - 1, Math.max(0, i0 + di - 1));
      for (let dj = 0; dj < 4; dj++) {
        const jj = Math.min(NZ - 1, Math.max(0, j0 + dj - 1));
        h += wa[di] * wb[dj] * r.G[ii * NZ + jj];
      }
    }
    return Math.max(0, h);
  }

  // ---- voxel landscape ----

  private updateVoxel(geom: boolean) {
    if (!this.vox) {
      const g = this.uniGrid(0.05 / VIZ.res.voxel);
      const n = g.NX * g.NZ;
      // one mesh per column: the rounded top is part of the column, not a second piece
      const mat = withPillar(withFog(new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide })));
      const body = new THREE.InstancedMesh(pillarGeometry(VIZ.voxel.round), mat, n);
      body.setColorAt(0, new THREE.Color());
      body.frustumCulled = false;
      this.world.add(body);
      this.vox = { g, body, top: new Float32Array(n) };
      geom = true;
    }
    const v = this.vox;
    const g = v.g;
    this.poolUni(g, geom);
    const { step, gap } = VIZ.voxel;
    const BC = v.body.instanceColor!.array as Float32Array;
    const w = g.cw * (1 - gap);
    const d = g.cd * (1 - gap);
    for (let i = 0; i < g.NX; i++) {
      const cx = -WORLD_W / 2 + (i + 0.5) * g.cw;
      for (let j = 0; j < g.NZ; j++) {
        const cz = WORLD_D / 2 - (j + 0.5) * g.cd;
        const o = i * g.NZ + j;
        if (geom) {
          const hq = Math.max(0.03, step > 0 ? Math.round(g.h[o] / step) * step : g.h[o]);
          v.top[o] = hq;
          tmpM.makeScale(w, hq, d).setPosition(cx, 0, cz);
          v.body.setMatrixAt(o, tmpM);
        }
        BC[o * 3] = g.col[o * 3];
        BC[o * 3 + 1] = g.col[o * 3 + 1];
        BC[o * 3 + 2] = g.col[o * 3 + 2];
      }
    }
    v.body.count = g.NX * g.NZ;
    if (geom) v.body.instanceMatrix.needsUpdate = true;
    v.body.instanceColor!.needsUpdate = true;
    v.body.visible = true;
  }

  private voxelH(x: number, z: number) {
    const v = this.vox;
    if (!v) return 0;
    const i = Math.floor((x + WORLD_W / 2) / v.g.cw);
    const j = Math.floor((WORLD_D / 2 - z) / v.g.cd);
    if (i < 0 || i >= v.g.NX || j < 0 || j >= v.g.NZ) return 0;
    return v.top[i * v.g.NZ + j];
  }

  // ---- skyline: floating blocks of mixed sizes ----

  private updateSkyline(geom: boolean) {
    if (!this.sky) {
      const g = this.uniGrid(0.05 / VIZ.res.skyline);
      const n = g.NX * g.NZ;
      const mesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
        withFog(new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.05, flatShading: true })),
        n,
      );
      mesh.setColorAt(0, new THREE.Color());
      mesh.frustumCulled = false;
      this.world.add(mesh);
      this.sky = { g, mesh, top: new Float32Array(n) };
      geom = true;
    }
    const sk = this.sky;
    const g = sk.g;
    this.poolUni(g, geom);
    const { NX, NZ, cw, cd } = g;
    const S = VIZ.skyline;
    const hash = (i: number, j: number) => {
      const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
      return h - Math.floor(h);
    };
    // quadtree merge: even areas become big blocks, busy areas stay fine
    const owner = new Int32Array(NX * NZ).fill(-1);
    const blocks: { i: number; j: number; s: number }[] = [];
    const flat = (i0: number, j0: number, size: number, tol: number) => {
      if (i0 + size > NX || j0 + size > NZ) return false;
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = i0; i < i0 + size; i++)
        for (let j = j0; j < j0 + size; j++) {
          if (owner[i * NZ + j] >= 0) return false;
          const h = g.h[i * NZ + j];
          lo = Math.min(lo, h);
          hi = Math.max(hi, h);
        }
      return hi - lo < tol;
    };
    const claim = (i0: number, j0: number, size: number) => {
      const id = blocks.length;
      blocks.push({ i: i0, j: j0, s: size });
      for (let i = i0; i < i0 + size; i++) for (let j = j0; j < j0 + size; j++) owner[i * NZ + j] = id;
    };
    for (let i = 0; i < NX; i += 4)
      for (let j = 0; j < NZ; j += 4) {
        if (hash(i, j) > 0.35 && flat(i, j, 4, S.merge * 0.6)) {
          claim(i, j, 4);
          continue;
        }
        for (let a = i; a < i + 4; a += 2)
          for (let b = j; b < j + 4; b += 2) {
            if (hash(a, b) > 0.3 && flat(a, b, 2, S.merge)) claim(a, b, 2);
            else for (let x = a; x < Math.min(NX, a + 2); x++) for (let z = b; z < Math.min(NZ, b + 2); z++) if (owner[x * NZ + z] < 0) claim(x, z, 1);
          }
      }
    const IC = sk.mesh.instanceColor!.array as Float32Array;
    const gap = 1 - S.gap;
    const drop = S.depth * WORLD_H;
    blocks.forEach((bk, n) => {
      let h = 0;
      let r = 0, gg = 0, b = 0, w = 0;
      for (let i = bk.i; i < bk.i + bk.s; i++)
        for (let j = bk.j; j < bk.j + bk.s; j++) {
          const o = i * NZ + j;
          h = Math.max(h, g.h[o]);
          const ww = g.h[o] + 0.05;
          r += g.col[o * 3] * ww;
          gg += g.col[o * 3 + 1] * ww;
          b += g.col[o * 3 + 2] * ww;
          w += ww;
        }
      h = Math.max(0.04, h);
      for (let i = bk.i; i < bk.i + bk.s; i++) for (let j = bk.j; j < bk.j + bk.s; j++) sk.top[i * NZ + j] = h;
      const under = drop * (0.25 + 0.75 * hash(bk.i + 0.5, bk.j + 0.5)) * (0.4 + h / WORLD_H);
      const cx = -WORLD_W / 2 + (bk.i + bk.s / 2) * cw;
      const cz = WORLD_D / 2 - (bk.j + bk.s / 2) * cd;
      tmpM.makeScale(bk.s * cw * gap, h + under, bk.s * cd * gap).setPosition(cx, -under, cz);
      sk.mesh.setMatrixAt(n, tmpM);
      IC[n * 3] = r / w;
      IC[n * 3 + 1] = gg / w;
      IC[n * 3 + 2] = b / w;
    });
    sk.mesh.count = blocks.length;
    sk.mesh.instanceMatrix.needsUpdate = true;
    sk.mesh.instanceColor!.needsUpdate = true;
    sk.mesh.visible = true;
  }

  private skylineH(x: number, z: number) {
    const sk = this.sky;
    if (!sk) return 0;
    const i = Math.floor((x + WORLD_W / 2) / sk.g.cw);
    const j = Math.floor((WORLD_D / 2 - z) / sk.g.cd);
    if (i < 0 || i >= sk.g.NX || j < 0 || j >= sk.g.NZ) return 0;
    return sk.top[i * sk.g.NZ + j];
  }

  // ---- disc (own module, see disc.ts) ----

  private modeCtx(): ModeCtx {
    return {
      frames: this.frames(),
      nBins: N_BINS,
      BIN_HZ,
      WORLD_W,
      WORLD_D,
      WORLD_H,
      heights: this.heights,
      colors: this.colors,
      xOfFrame: (t) => this.map.xOfFrame(t),
      zOfHz,
      axis: this.axis,
      res: VIZ.res[this.mode],
      theme: this.theme,
      fog: (m) => withFog(m),
    };
  }

  private updateDisc(geom: boolean) {
    const ctx = this.modeCtx();
    let d = this.disc;
    if (!d) {
      d = new DiscMode(ctx) as ModeView;
      this.disc = d;
      this.scene.add(d.object);
      geom = true;
    }
    d.update(ctx, geom);
    d.object.visible = true;
  }

  // ---- drop lines ----

  private dropLines(g: BinGrid, mirror: boolean) {
    const n = g.nT * g.nK;
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3));
    lg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 6), 3));
    const glow = VIZ.drops.glow && !mirror;
    const blending = glow ? THREE.AdditiveBlending : THREE.NormalBlending;
    let lm: THREE.Material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: glow ? 0.16 : 0.85, blending, depthWrite: !glow });
    lm = mirror ? withFog(withMirrorLines(lm)) : withFog(lm);
    const lines = new THREE.LineSegments(lg, lm);
    lines.frustumCulled = false;
    return lines;
  }

  private fillDrops(g: BinGrid, lines: THREE.LineSegments, points: THREE.Points | null, geom: boolean, fade: number) {
    this.poolBin(g, geom);
    const LP = lines.geometry.getAttribute('position') as THREE.BufferAttribute;
    const LC = lines.geometry.getAttribute('color') as THREE.BufferAttribute;
    const lp = LP.array as Float32Array, lc = LC.array as Float32Array;
    const PP = points?.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    const PC = points?.geometry.getAttribute('color') as THREE.BufferAttribute | undefined;
    const pp = PP?.array as Float32Array | undefined, pc = PC?.array as Float32Array | undefined;
    for (let i = 0; i < g.nT; i++) {
      const x = this.binX(g, i);
      for (let j = 0; j < g.nK; j++) {
        const o = i * g.nK + j;
        const r = g.col[o * 3], gg = g.col[o * 3 + 1], b = g.col[o * 3 + 2];
        if (geom) {
          const z = this.binZ(g, j);
          const y = g.h[o];
          lp.set([x, 0, z, x, y, z], o * 6);
          pp?.set([x, y, z], o * 3);
        }
        lc.set([r * fade, gg * fade, b * fade, r, gg, b], o * 6);
        pc?.set([r, gg, b], o * 3);
      }
    }
    if (geom) {
      LP.needsUpdate = true;
      if (PP) PP.needsUpdate = true;
    }
    LC.needsUpdate = true;
    if (PC) PC.needsUpdate = true;
  }

  private updateDrops(geom: boolean) {
    if (!this.drops) {
      const s = stride(VIZ.res.drops);
      const g = this.binGrid(s, s);
      const lines = this.dropLines(g, false);
      const n = g.nT * g.nK;
      const pg = new THREE.BufferGeometry();
      pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      pg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const glow = VIZ.drops.glow;
      const points = new THREE.Points(
        pg,
        withFog(new THREE.PointsMaterial({ vertexColors: true, size: 2.2, sizeAttenuation: false, transparent: true, opacity: glow ? 0.5 : 0.95, blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !glow })),
      );
      points.frustumCulled = false;
      this.world.add(lines, points);
      this.drops = { g, lines, points };
      geom = true;
    }
    const d = this.drops;
    this.fillDrops(d.g, d.lines, d.points, geom, VIZ.drops.fade);
    d.lines.visible = true;
    d.points.visible = VIZ.drops.points;
  }

  private updateSymLines(geom: boolean) {
    if (!this.symLines) {
      const s = Math.max(2, stride(VIZ.res.symmetry) * 2);
      const g = this.binGrid(s, s);
      const lines = this.dropLines(g, true);
      this.mirror.add(lines);
      this.symLines = { g, lines };
      geom = true;
    }
    this.fillDrops(this.symLines.g, this.symLines.lines, null, geom, 0.25);
  }

  // ---- morph: drop lines turn into a solid while the model is built ----

  /** Sweep from drop lines into `to` (voxel or rounded) over `seconds`. */
  morphTo(to: 'voxel' | 'rounded', seconds = 3.2) {
    if (!this.session) return;
    if (this.mode !== 'drops') this.setMode('drops');
    this.endMorph();
    this.mode = to;
    this.morph = { from: 'drops', to, t0: performance.now(), dur: seconds * 1000 };
    this.applyLayout();
    this.updateMode(true);
    this.setClipping(true);
  }

  private setClipping(on: boolean) {
    const target: THREE.Material[] = [];
    if (this.vox) target.push(this.vox.body.material as THREE.Material);
    if (this.rnd) target.push(this.rnd.matte, this.rnd.water);
    for (const m of target) m.clippingPlanes = on ? [this.clipTarget] : [];
    if (this.drops) for (const m of [this.drops.lines.material, this.drops.points.material] as THREE.Material[]) m.clippingPlanes = on ? [this.clipSource] : [];
    this.sweep.visible = on;
  }

  private endMorph() {
    if (!this.morph) return;
    this.morph = null;
    this.setClipping(false);
    if (this.drops) this.drops.lines.visible = this.drops.points.visible = this.mode === 'drops';
  }

  private stepMorph() {
    const mo = this.morph;
    if (!mo) return;
    const p = Math.min(1, (performance.now() - mo.t0) / mo.dur);
    const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
    const { t: sx, a: sy, f: sz } = this.axis;
    const X = (-WORLD_W / 2 - 0.3 + (WORLD_W + 0.6) * e) * sx;
    this.clipTarget.constant = X;
    this.clipSource.constant = -X;
    this.sweep.position.set(X, ((WORLD_H + 0.6) * sy) / 2, 0);
    this.sweep.scale.set(1, (WORLD_H + 0.6) * sy, WORLD_D * sz);
    (this.sweep.material as THREE.MeshBasicMaterial).color.set(this.theme.accent2);
    if (p >= 1) this.endMorph();
  }

  // ---- spiral ----

  /** Canonical (x, y, z) -> spiral display position. Time rises along y. */
  private spiralPos(cx: number, cy: number, cz: number, out: THREE.Vector3) {
    const S = VIZ.spiral;
    const { t: sx, a: sy, f: sz } = this.axis;
    const tn = (cx + WORLD_W / 2) / WORLD_W;
    const fn = (WORLD_D / 2 - cz) / WORLD_D; // 0 = low frequency
    const amp = (cy / WORLD_H) * S.span * sy;
    const y = tn * S.height * sx;
    if (S.layout === 'wrap') {
      // frequency goes around the axis, amplitude is the distance from it
      const th = fn * S.arc * Math.PI * 2 + tn * S.turns * Math.PI * 2;
      const r = S.offset * sz + amp * 0.8;
      return out.set(r * Math.cos(th), y, r * Math.sin(th));
    }
    const u = (fn - 0.5) * S.span * sz;
    const th = tn * S.turns * Math.PI * 2;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const r = S.offset + u;
    return out.set(r * c - amp * s, y, r * s + amp * c);
  }

  private updateSpiral(geom: boolean) {
    const S = VIZ.spiral;
    if (!this.spiral) {
      const res = VIZ.res.spiral;
      const g = this.binGrid(Math.max(1, Math.round(1.4 / res)), Math.max(1, Math.round(1 / res)));
      const n = g.nT * g.nK;
      let obj: THREE.Object3D;
      if (S.style === 'dots') {
        const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(S.radius, 1), withFog(new THREE.MeshLambertMaterial()), n);
        m.setColorAt(0, new THREE.Color());
        obj = m;
      } else if (S.style === 'rays') {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 6), 3));
        obj = new THREE.LineSegments(geo, withFog(new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7 })));
      } else {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        const idx: number[] = [];
        for (let i = 0; i < g.nT - 1; i++)
          for (let j = 0; j < g.nK - 1; j++) {
            const a = i * g.nK + j;
            const b = (i + 1) * g.nK + j;
            idx.push(a, b, a + 1, b, b + 1, a + 1);
          }
        geo.setIndex(idx);
        obj = new THREE.Mesh(geo, withFog(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.05, side: THREE.DoubleSide, transparent: true, opacity: 0.45, depthWrite: false })));
      }
      obj.frustumCulled = false;
      this.world.add(obj);
      this.spiral = { g, pos: new Float32Array(n * 3), obj };
      geom = true;
    }
    const sp = this.spiral;
    const g = sp.g;
    this.poolBin(g, geom);
    // gradient: amplitude ramp, drifting from one theme accent to the other along time
    const ca = new THREE.Color(this.theme.accent);
    const cb = new THREE.Color(this.theme.accent2);
    const col = new Float32Array(g.nT * g.nK * 3);
    for (let i = 0; i < g.nT; i++) {
      const tn = i / Math.max(1, g.nT - 1);
      const tr = ca.r + (cb.r - ca.r) * tn, tg = ca.g + (cb.g - ca.g) * tn, tb = ca.b + (cb.b - ca.b) * tn;
      for (let j = 0; j < g.nK; j++) {
        const o = i * g.nK + j;
        const r = g.col[o * 3], gg = g.col[o * 3 + 1], b = g.col[o * 3 + 2];
        const lum = Math.min(1, 0.3 * r + 0.55 * gg + 0.15 * b + 0.15);
        col[o * 3] = r * 0.6 + tr * lum * 0.55;
        col[o * 3 + 1] = gg * 0.6 + tg * lum * 0.55;
        col[o * 3 + 2] = b * 0.6 + tb * lum * 0.55;
      }
    }
    if (geom)
      for (let i = 0; i < g.nT; i++) {
        const x = this.binX(g, i);
        for (let j = 0; j < g.nK; j++) {
          const o = i * g.nK + j;
          this.spiralPos(x, g.h[o], this.binZ(g, j), tmpV);
          sp.pos[o * 3] = tmpV.x;
          sp.pos[o * 3 + 1] = tmpV.y;
          sp.pos[o * 3 + 2] = tmpV.z;
        }
      }
    const n = g.nT * g.nK;
    if (sp.obj instanceof THREE.InstancedMesh) {
      const IC = sp.obj.instanceColor!.array as Float32Array;
      IC.set(col);
      if (geom) {
        for (let o = 0; o < n; o++) {
          tmpM.makeTranslation(sp.pos[o * 3], sp.pos[o * 3 + 1], sp.pos[o * 3 + 2]);
          sp.obj.setMatrixAt(o, tmpM);
        }
        sp.obj.instanceMatrix.needsUpdate = true;
      }
      sp.obj.instanceColor!.needsUpdate = true;
    } else if (sp.obj instanceof THREE.LineSegments) {
      const PA = sp.obj.geometry.getAttribute('position') as THREE.BufferAttribute;
      const CA = sp.obj.geometry.getAttribute('color') as THREE.BufferAttribute;
      const P = PA.array as Float32Array;
      const C = CA.array as Float32Array;
      for (let o = 0; o < n; o++) {
        if (geom) P.set([0, sp.pos[o * 3 + 1], 0, sp.pos[o * 3], sp.pos[o * 3 + 1], sp.pos[o * 3 + 2]], o * 6);
        C.set([col[o * 3] * 0.05, col[o * 3 + 1] * 0.05, col[o * 3 + 2] * 0.05, col[o * 3], col[o * 3 + 1], col[o * 3 + 2]], o * 6);
      }
      if (geom) PA.needsUpdate = true;
      CA.needsUpdate = true;
    } else {
      const mesh = sp.obj as THREE.Mesh;
      const PA = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const CA = mesh.geometry.getAttribute('color') as THREE.BufferAttribute;
      (CA.array as Float32Array).set(col);
      CA.needsUpdate = true;
      if (geom) {
        (PA.array as Float32Array).set(sp.pos);
        PA.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
      }
    }
    sp.obj.visible = true;
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

  /** Raw spectrogram height at canonical (x, z). */
  heightAt(x: number, z: number) {
    if (!this.session) return 0;
    const t = Math.round(this.frameOfX(x));
    const k = Math.round(this.binOfZ(z));
    if (t < 0 || t >= this.session.frames || k < 0 || k >= N_BINS) return 0;
    return this.heights[t * N_BINS + k];
  }

  /** Height of what is drawn at canonical (x, z) in the current mode. Overlays and picks follow it. */
  dispH(x: number, z: number) {
    switch (this.mode) {
      case 'rounded':
        return this.roundedH(x, z);
      case 'voxel':
        return this.voxelH(x, z);
      case 'skyline':
        return this.skylineH(x, z);
      case 'drops':
        return this.drops ? this.binH(this.drops.g, x, z) : this.heightAt(x, z);
      case 'surface':
      case 'symmetry':
        return this.surf && this.surf.s > 1 ? this.binH(this.surf.g, x, z) : this.heightAt(x, z);
      default:
        return this.heightAt(x, z);
    }
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
    if (this.mode === 'disc') return this.pickDisc(o, d);
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

  /** Ray-march the displayed height field in canonical space (much faster than triangle raycasting). */
  private marchCanonical(o: THREE.Vector3, d: THREE.Vector3): Pick | null {
    const maxY = WORLD_H + this.unfold * 6 + 0.1;
    const box = new THREE.Box3(new THREE.Vector3(-WORLD_W / 2, -0.01, -WORLD_D / 2), new THREE.Vector3(WORLD_W / 2, maxY, WORLD_D / 2));
    const r = new THREE.Ray(o, d);
    const hit = new THREE.Vector3();
    const inside = box.containsPoint(o);
    if (!inside && !r.intersectBox(box, hit)) return null;
    let tRay = inside ? 0 : hit.distanceTo(o);
    const step = 0.03;
    let prev: THREE.Vector3 | null = null;
    for (let i = 0; i < 2000; i++) {
      const p = o.clone().addScaledVector(d, tRay);
      if (p.x < -WORLD_W / 2 - 0.01 || p.x > WORLD_W / 2 + 0.01 || p.z < -WORLD_D / 2 - 0.01 || p.z > WORLD_D / 2 + 0.01 || p.y < -0.05) {
        if (prev) break;
      }
      const h = this.dispH(p.x, p.z);
      if (p.y <= h || p.y <= 0) {
        // bisection refine
        let a = tRay - step;
        let b = tRay;
        for (let j = 0; j < 8; j++) {
          const m = (a + b) / 2;
          const q = o.clone().addScaledVector(d, m);
          if (q.y <= this.dispH(q.x, q.z)) b = m;
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

  /** Nearest data point along the ray. Falls back to the closest point near the ray so hovering feels forgiving. */
  private pickSpiral(o: THREE.Vector3, d: THREE.Vector3): Pick | null {
    const sp = this.spiral;
    if (!sp) return null;
    const hitR2 = (VIZ.spiral.style === 'dots' ? VIZ.spiral.radius * 1.6 : 0.07) ** 2;
    const nearR2 = 0.3 ** 2;
    let best = -1;
    let bestS = Infinity;
    let near = -1;
    let nearD = Infinity;
    const P = sp.pos;
    const n = sp.g.nT * sp.g.nK;
    for (let j = 0; j < n; j++) {
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
    const g = sp.g;
    const t = g.tc[Math.floor(j / g.nK)];
    const k = g.kc[j % g.nK];
    const x = this.map.xOfFrame(t);
    const z = zOfHz(k * BIN_HZ);
    return { x, z, y: this.heightAt(x, z), t, k };
  }

  private pickDisc(o: THREE.Vector3, d: THREE.Vector3): Pick | null {
    if (!this.disc) return null;
    const c = this.disc.pickCloud();
    const hitR2 = 0.06 ** 2;
    const nearR2 = 0.3 ** 2;
    let best = -1, bestS = Infinity, near = -1, nearD = Infinity;
    for (let j = 0; j < c.count; j++) {
      const wx = c.pos[j * 3] - o.x, wy = c.pos[j * 3 + 1] - o.y, wz = c.pos[j * 3 + 2] - o.z;
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
    const x = this.map.xOfFrame(c.t[j]);
    const z = zOfHz(c.k[j] * BIN_HZ);
    return { x, z, y: this.heightAt(x, z), t: c.t[j], k: c.k[j] };
  }

  // ---------------- overlays ----------------

  /** Canonical point -> the overlay's local space (identity, except in the spiral). */
  private ov(x: number, y: number, z: number) {
    const v = new THREE.Vector3(x, y, z);
    if (this.mode === 'disc' && this.disc) return this.disc.toDisplay(x, y, z, v);
    return this.mode === 'spiral' ? this.spiralPos(x, y, z, v) : v;
  }

  private ovH(x: number, z: number) {
    return this.mode === 'spiral' || this.mode === 'disc' ? this.heightAt(x, z) : this.dispH(x, z);
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
      pts.push(this.ov(x, this.ovH(x, z) + 0.04, z));
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
        pts.push(this.ov(xa, this.ovH(xa, za) + 0.05, za), this.ov(xb, this.ovH(xb, zb) + 0.05, zb));
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
        pts.push(this.ov(x, this.ovH(x, z) + 0.05, z));
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
      U.play.value.z = 0;
      return;
    }
    if (this.mode === 'spiral') {
      this.spiralRing.visible = true;
      this.spiralRing.position.y = (VIZ.spiral.height * this.axis.t * sec) / CLIP_SECONDS;
      this.spiralRing.getWorldPosition(tmpV);
      U.play.value.set(1, tmpV.y, 1, 0.15);
      return;
    }
    this.playhead.visible = true;
    this.playhead.position.x = -WORLD_W / 2 + (WORLD_W * sec) / CLIP_SECONDS;
    this.playhead.getWorldPosition(tmpV);
    U.play.value.set(0, tmpV.x, this.mode === 'disc' ? 0 : 1, 0.12);
  }

  setViewMode(rotateWithLeft: boolean) {
    this.controls.mouseButtons = {
      LEFT: rotateWithLeft ? THREE.MOUSE.ROTATE : (null as unknown as THREE.MOUSE),
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.ROTATE,
    };
  }

  // ---------------- navigation that works with every tool ----------------

  /** World units per screen pixel at the orbit target, for perspective and the narrow iso lens alike. */
  private worldPerPixel() {
    const dist = this.camera.position.distanceTo(this.controls.target);
    return (2 * dist * Math.tan((this.camera.fov * Math.PI) / 360)) / Math.max(1, this.renderer.domElement.clientHeight);
  }

  private moveBy(v: THREE.Vector3) {
    this.camera.position.add(v);
    this.controls.target.add(v);
  }

  /** Slide the view over the ground plane. dx, dy in screen pixels (drag right moves the landscape right). */
  panGround(dxPx: number, dyPx: number) {
    const k = this.worldPerPixel();
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    fwd.y = 0;
    if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1);
    fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    // the landscape follows the pointer, so the camera moves the other way
    this.moveBy(right.multiplyScalar(-dxPx * k).addScaledVector(fwd, dyPx * k * 1.4));
  }

  /** Move the view up or down. dy in screen pixels (drag down moves the landscape down). */
  panVertical(dyPx: number) {
    this.moveBy(new THREE.Vector3(0, dyPx * this.worldPerPixel(), 0));
  }

  /** Orbit around the target by angles in radians. */
  orbitBy(dAzimuth: number, dPolar: number) {
    const off = this.camera.position.clone().sub(this.controls.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    sph.theta -= dAzimuth;
    sph.phi = Math.min(this.controls.maxPolarAngle, Math.max(0.05, sph.phi - dPolar));
    off.setFromSpherical(sph);
    this.camera.position.copy(this.controls.target).add(off);
  }

  /** Keys held down right now (WASD move, arrows orbit, Q/Z up and down). Set by the app. */
  readonly keys = new Set<string>();

  private stepKeys(dt: number) {
    if (!this.keys.size) return;
    const h = this.renderer.domElement.clientHeight;
    const speed = 0.9 * h * dt; // pixels per frame: about one screen height per second
    let dx = 0;
    let dy = 0;
    if (this.keys.has('a')) dx += speed;
    if (this.keys.has('d')) dx -= speed;
    if (this.keys.has('w')) dy += speed;
    if (this.keys.has('s')) dy -= speed;
    if (dx || dy) this.panGround(dx, dy);
    const rot = 1.4 * dt;
    if (this.keys.has('arrowleft')) this.orbitBy(-rot, 0);
    if (this.keys.has('arrowright')) this.orbitBy(rot, 0);
    if (this.keys.has('arrowup')) this.orbitBy(0, rot * 0.6);
    if (this.keys.has('arrowdown')) this.orbitBy(0, -rot * 0.6);
  }

  /** Near-isometric look (Monument Valley style): a very narrow lens from far away. */
  setIso(on: boolean) {
    this.iso = on;
    this.camera.fov = on ? 9 : 42;
    this.camera.updateProjectionMatrix();
    this.controls.maxDistance = on ? 400 : 60;
    this.resetCamera('perspective');
  }

  resetCamera(view: 'perspective' | 'top' | 'side' = 'perspective') {
    const { t: sx, a: sy, f: sz } = this.axis;
    const target = new THREE.Vector3();
    const pos = new THREE.Vector3();
    if (this.mode === 'spiral') {
      const H = VIZ.spiral.height * sx;
      const D = Math.max(18, H * 1.9);
      target.set(0, H / 2, 0);
      if (view === 'top') pos.set(0, H + D, 0.01);
      else if (view === 'side') pos.set(0, H / 2, D);
      else pos.set(D * 0.7, H / 2 + D * 0.25, D * 0.7);
    } else if (this.mode === 'disc' && this.disc) {
      const f = this.disc.frame();
      target.copy(f.target);
      const D = f.distance;
      if (view === 'top') pos.set(0, D, 0.01).add(target);
      else if (view === 'side') pos.set(0, D * 0.25, D).add(target);
      else pos.set(-D * 0.25, D * 0.6, D * 0.75).add(target);
    } else {
      const mirrored = this.mode === 'symmetry';
      const ty = mirrored ? -0.3 * sy : 0.4 * sy;
      target.set(0, ty, 0);
      // fit the larger of the two footprint sides (the default field is a square tile)
      const zoom = Math.max(1, sx * 0.85, (sz * WORLD_D * 1.25) / WORLD_W);
      if (view === 'top') pos.set(0, 21 * zoom, 0.01);
      else if (view === 'side') pos.set(0, ty + 3, 15 * zoom);
      else if (mirrored) pos.set(-4 * zoom, 3.5, 17 * zoom);
      else pos.set(-2.5 * zoom, 10.5 * zoom, 15.5 * zoom);
    }
    if (this.iso) {
      // same framing through a narrow lens: push the camera back by the ratio of the lens widths
      // a little extra room, so the landscape and its axes sit between the floating panels
      const dist = pos.distanceTo(target) * (Math.tan((21 * Math.PI) / 180) / Math.tan((3.9 * Math.PI) / 180)) * 1.2;
      const dir = view === 'perspective' ? new THREE.Vector3(-1, 0.85, 1).normalize() : pos.clone().sub(target).normalize();
      pos.copy(target).addScaledVector(dir, dist);
    }
    this.controls.target.copy(target);
    this.camera.position.copy(pos);
  }

  /**
   * The landscape seen straight from above, as a compressed JPEG: the picture on a sound stamp.
   * Renders once into the canvas at a small size and puts everything back in the same task,
   * so nothing flickers on screen. Helpers, playhead and the played/unplayed tint stay out.
   */
  topSnapshot(size = 360, quality = 0.8): string {
    const r = this.renderer;
    const cam = this.camera;
    const fog = this.scene.fog as THREE.Fog;
    const keep = {
      pos: cam.position.clone(), target: this.controls.target.clone(), aspect: cam.aspect,
      size: r.getSize(new THREE.Vector2()), ratio: r.getPixelRatio(),
      play: U.play.value.clone(), reveal: U.reveal.value.clone(), near: fog.near, far: fog.far,
    };
    const hide = [this.playhead, ...this.overlays(), ...this.mirrorOverlays, this.mirrorPlayhead, this.axisGroup, this.grid, this.fogVolume.object, this.sweep, this.spiralRing];
    const vis = hide.map((o) => o.visible);
    hide.forEach((o) => (o.visible = false));
    U.play.value.z = 0;
    U.reveal.value.w = 0;
    fog.near = 1e4;
    fog.far = 1e5;
    // frame the footprint tightly from straight above
    cam.aspect = 1;
    if (this.mode === 'spiral' || this.mode === 'disc') {
      this.resetCamera('top');
    } else {
      const { t: sx, a: sy, f: sz } = this.axis;
      const half = (Math.max(WORLD_W * sx, WORLD_D * sz) / 2) * 1.02;
      const ty = this.mode === 'symmetry' ? 0 : 0.2 * sy;
      const dist = half / Math.tan((cam.fov * Math.PI) / 360) + WORLD_H * sy;
      this.controls.target.set(0, ty, 0);
      cam.position.set(0, ty + dist, 0.001);
    }
    cam.lookAt(this.controls.target);
    cam.updateProjectionMatrix();
    r.setPixelRatio(1);
    r.setSize(size, size, false);
    r.render(this.scene, cam);
    const out = document.createElement('canvas');
    out.width = out.height = size;
    out.getContext('2d')!.drawImage(r.domElement, 0, 0);
    // put everything back and draw the normal frame again before the browser shows anything
    hide.forEach((o, i) => (o.visible = vis[i]));
    U.play.value.copy(keep.play);
    U.reveal.value.copy(keep.reveal);
    fog.near = keep.near;
    fog.far = keep.far;
    r.setPixelRatio(keep.ratio);
    r.setSize(keep.size.x, keep.size.y, false);
    cam.aspect = keep.aspect;
    cam.position.copy(keep.pos);
    this.controls.target.copy(keep.target);
    cam.lookAt(keep.target);
    cam.updateProjectionMatrix();
    r.render(this.scene, cam);
    return out.toDataURL('image/jpeg', quality);
  }

  private frame() {
    const dt = Math.min(0.1, this.clock.getDelta());
    U.time.value += dt;
    this.stepMorph();
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
    // distance fog follows the zoom, so depth reads the same at every distance
    const fog = this.scene.fog as THREE.Fog;
    this.stepKeys(dt);
    this.updateAmpLean();
    this.stepReveal();
    U.hfog.value.z = this.hfogDensity;
    this.controls.update();
    const dist = this.camera.position.distanceTo(this.controls.target);
    fog.near = dist * 0.75;
    fog.far = dist * 2.6;
    const sy = this.axis.a;
    const A = VIZ.atmosphere;
    // the fog box wraps whatever the current mode draws, with room around it
    const fogBox = new THREE.Vector3();
    let bottom = -0.3;
    if (this.mode === 'spiral') {
      const r = VIZ.spiral.offset * this.axis.f + VIZ.spiral.span * 0.8 * sy + 3;
      fogBox.set(r + 4, VIZ.spiral.height * this.axis.t * 0.5 + 1, r + 4);
      bottom = -0.5;
    } else if (this.mode === 'disc') {
      const r = DISC.radius * this.axis.t + DISC.inner + 4;
      fogBox.set(r, 1.2 + DISC.bowl * DISC.radius * 0.5, r);
    } else {
      fogBox.set((WORLD_W * this.axis.t) / 2 + 5, Math.max(0.8, A.height * WORLD_H * sy * 1.5), (WORLD_D * this.axis.f) / 2 + 5);
      if (this.mode === 'symmetry') bottom = -WORLD_H * sy * 1.2;
      if (this.mode === 'skyline') bottom = -VIZ.skyline.depth * WORLD_H * sy;
      fogBox.y += -bottom / 2;
    }
    this.fogVolume.update({
      color: this.theme.fog,
      center: new THREE.Vector3(),
      half: fogBox,
      bottom,
      density: A.fog,
      time: U.time.value,
      viewportHeight: this.renderer.domElement.height,
      fovDeg: this.camera.fov,
    });
    this.renderer.render(this.scene, this.camera);
    this.labels.render(this.scene, this.camera);
  }
}
