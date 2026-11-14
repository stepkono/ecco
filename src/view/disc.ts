import * as THREE from 'three';
import type { ModeCtx, ModeView, PickCloud } from './modetypes';
import type { Theme } from './themes';

/**
 * Disc display mode. Time runs outward from the centre, frequency goes around
 * the circle (mirrored, so the loop is seamless), amplitude lifts the terrain
 * out of a shallow bowl. Four looks: contour rings, a polar dot grid, parallel
 * ridge lines clipped to a disc, and thin layered walls ("sheets").
 */

export type DiscStyle = 'rings' | 'dots' | 'ridges' | 'sheets';

/** Look parameters, edited by the panel. A change needs a new DiscMode. */
export const DISC = { style: 'rings' as DiscStyle, bowl: 0.35, radius: 7, inner: 0.6 };

/** display height of a full-scale canonical amplitude */
const AMP = 2.4;
/** soft cap on vertices per style */
const BUDGET = 170_000;
const LUT = 256;
const SIN21 = Math.sin((21 * Math.PI) / 180);

export class DiscMode implements ModeView {
  readonly object = new THREE.Group();

  private ctx: ModeCtx;
  private readonly style: DiscStyle;
  private readonly bowl: number;
  private readonly radius: number;
  private readonly inner: number;

  // pooled grid
  private T = 0;
  private N = 0;
  private res = 0;
  private sT = 1;
  private sK = 1;
  private nT = 0;
  private nK = 0;
  private tc = new Float32Array(0); // centre frame per ring
  private kc = new Float32Array(0); // centre bin per row
  private tn = new Float32Array(0); // 0..1 along time per ring
  private fn = new Float32Array(0); // 0..1 along frequency per row
  private h = new Float32Array(0);
  private col = new Float32Array(0);

  // samples per ring
  private A = 0;
  private sj = new Int32Array(0); // sample -> row
  private cs = new Float32Array(0); // cos(theta) per sample
  private sn = new Float32Array(0); // sin(theta) per sample
  /** radial parameter per point (0 centre .. 1 rim), drives the gradient tint */
  private rho = new Float32Array(0);

  private lut = new Float32Array(LUT * 3);
  private lutTheme: Theme | null = null;

  private pick: PickCloud = { pos: new Float32Array(0), t: new Float32Array(0), k: new Float32Array(0), count: 0 };
  private geo: THREE.BufferGeometry | null = null;
  private mesh: THREE.Object3D | null = null;
  private mat: THREE.Material | null = null;

  constructor(ctx: ModeCtx) {
    this.ctx = ctx;
    this.style = DISC.style;
    this.bowl = DISC.bowl;
    this.radius = DISC.radius;
    this.inner = DISC.inner;
    this.object.name = 'disc';
    this.build(ctx);
    this.update(ctx, true);
  }

  private get polar() {
    return this.style !== 'ridges';
  }

  // ---------------- build ----------------

  private build(ctx: ModeCtx) {
    this.clearMesh();
    const T = (this.T = ctx.frames);
    const N = (this.N = ctx.nBins);
    this.res = ctx.res;
    const res = Math.max(0.05, Math.min(1, ctx.res));
    const sT = (this.sT = Math.max(1, Math.round(1.2 / res)));
    const nT = (this.nT = Math.ceil(T / sT));

    // frequency stride: dense for lines and sheets, coarser for dots, then fit the budget
    let sK = this.style === 'dots' ? Math.max(1, Math.round(1 / res)) : 1;
    const verts = (s: number) => {
      const nK = Math.ceil(N / s);
      const A = this.polar ? 2 * (nK - 1) : nK;
      return nT * A * (this.style === 'sheets' ? 2 : 1);
    };
    while (sK < 16 && verts(sK) > BUDGET) sK++;
    this.sK = sK;
    const nK = (this.nK = Math.ceil(N / sK));

    this.tc = new Float32Array(nT);
    this.kc = new Float32Array(nK);
    this.tn = new Float32Array(nT);
    this.fn = new Float32Array(nK);
    const W = ctx.WORLD_W;
    const D = ctx.WORLD_D;
    for (let i = 0; i < nT; i++) {
      this.tc[i] = Math.min(T - 1, i * sT + (sT - 1) / 2);
      this.tn[i] = clamp01((ctx.xOfFrame(this.tc[i]) + W / 2) / W);
    }
    for (let j = 0; j < nK; j++) {
      this.kc[j] = Math.min(N - 1, j * sK + (sK - 1) / 2);
      this.fn[j] = clamp01((D / 2 - ctx.zOfHz(this.kc[j] * ctx.BIN_HZ)) / D);
    }
    this.h = new Float32Array(nT * nK);
    this.col = new Float32Array(nT * nK * 3);

    // samples around a ring: rows 0..nK-1 on the first half, then back down on the mirror
    const A = (this.A = this.polar ? Math.max(1, 2 * (nK - 1)) : nK);
    this.sj = new Int32Array(A);
    this.cs = new Float32Array(A);
    this.sn = new Float32Array(A);
    for (let s = 0; s < A; s++) {
      const first = s < nK;
      const j = first ? s : 2 * nK - 2 - s;
      this.sj[s] = j;
      const th = first ? this.fn[j] * Math.PI : 2 * Math.PI - this.fn[j] * Math.PI;
      this.cs[s] = Math.cos(th);
      this.sn[s] = Math.sin(th);
    }

    const P = nT * A;
    this.rho = new Float32Array(P);
    const pt = new Float32Array(P);
    const pk = new Float32Array(P);
    for (let i = 0; i < nT; i++)
      for (let s = 0; s < A; s++) {
        pt[i * A + s] = this.tc[i];
        pk[i * A + s] = this.kc[this.sj[s]];
      }
    this.pick = { pos: new Float32Array(P * 3), t: pt, k: pk, count: P };

    // geometry
    const nv = this.style === 'sheets' ? 2 * P : P;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    let obj: THREE.Object3D;
    let mat: THREE.Material;
    if (this.style === 'dots') {
      mat = ctx.fog(new THREE.PointsMaterial({ vertexColors: true, size: 2.5, sizeAttenuation: false }));
      obj = new THREE.Points(geo, mat);
    } else if (this.style === 'sheets') {
      const idx = new Uint32Array(nT * A * 6);
      let q = 0;
      for (let i = 0; i < nT; i++)
        for (let s = 0; s < A; s++) {
          const o0 = i * A + s;
          const o1 = i * A + ((s + 1) % A);
          const b0 = 2 * o0, t0 = b0 + 1, b1 = 2 * o1, t1 = b1 + 1;
          idx[q++] = b0; idx[q++] = b1; idx[q++] = t0;
          idx[q++] = t0; idx[q++] = b1; idx[q++] = t1;
        }
      geo.setIndex(new THREE.BufferAttribute(idx, 1));
      mat = ctx.fog(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.05, side: THREE.DoubleSide }));
      obj = new THREE.Mesh(geo, mat);
    } else {
      // rings: closed loops, ridges: open lines
      const closed = this.style === 'rings';
      const segs = closed ? A : A - 1;
      const idx = new Uint32Array(nT * segs * 2);
      let q = 0;
      for (let i = 0; i < nT; i++)
        for (let s = 0; s < segs; s++) {
          idx[q++] = i * A + s;
          idx[q++] = i * A + ((s + 1) % A);
        }
      geo.setIndex(new THREE.BufferAttribute(idx, 1));
      mat = ctx.fog(new THREE.LineBasicMaterial({ vertexColors: true }));
      obj = new THREE.LineSegments(geo, mat);
    }
    obj.frustumCulled = false;
    this.object.add(obj);
    this.geo = geo;
    this.mesh = obj;
    this.mat = mat;
  }

  private clearMesh() {
    if (this.mesh) this.object.remove(this.mesh);
    this.geo?.dispose();
    this.mat?.dispose();
    this.geo = null;
    this.mesh = null;
    this.mat = null;
  }

  // ---------------- data ----------------

  /** Max-pool heights and height-weighted mean colour over each stride block. */
  private pool(ctx: ModeCtx, geom: boolean) {
    const { heights: H, colors: C } = ctx;
    const N = this.N;
    for (let i = 0; i < this.nT; i++) {
      const t0 = i * this.sT;
      const t1 = Math.min(this.T, t0 + this.sT);
      for (let j = 0; j < this.nK; j++) {
        const k0 = j * this.sK;
        const k1 = Math.min(N, k0 + this.sK);
        let hMax = 0;
        let wr = 0, wg = 0, wb = 0, ws = 0;
        for (let t = t0; t < t1; t++)
          for (let k = k0; k < k1; k++) {
            const idx = t * N + k;
            const hv = H[idx];
            if (hv > hMax) hMax = hv;
            const w = hv + 0.05;
            wr += C[idx * 3] * w;
            wg += C[idx * 3 + 1] * w;
            wb += C[idx * 3 + 2] * w;
            ws += w;
          }
        const o = i * this.nK + j;
        if (geom) this.h[o] = hMax;
        const inv = ws > 0 ? 1 / ws : 0;
        this.col[o * 3] = wr * inv;
        this.col[o * 3 + 1] = wg * inv;
        this.col[o * 3 + 2] = wb * inv;
      }
    }
  }

  /** Theme ramp as a linear RGB lookup table, rebuilt when the theme changes. */
  private ensureLut(theme: Theme) {
    if (this.lutTheme === theme) return;
    this.lutTheme = theme;
    const stops = theme.ramp.map((c) => new THREE.Color(c));
    for (let n = 0; n < LUT; n++) {
      const q = (n / (LUT - 1)) * (stops.length - 1);
      const a = Math.min(stops.length - 2, Math.floor(q));
      const f = q - a;
      const c0 = stops[a], c1 = stops[a + 1];
      this.lut[n * 3] = c0.r + (c1.r - c0.r) * f;
      this.lut[n * 3 + 1] = c0.g + (c1.g - c0.g) * f;
      this.lut[n * 3 + 2] = c0.b + (c1.b - c0.b) * f;
    }
  }

  /** Display position of a disc point. tn, fn in 0..1, s = ring sample index or -1. */
  private place(tn: number, fn: number, cy: number, s: number, out: THREE.Vector3) {
    const ax = this.ctx.axis;
    const amp = (cy / this.ctx.WORLD_H) * AMP * ax.a;
    if (this.polar) {
      const r = this.inner + tn * this.radius * ax.t;
      const b = r / (this.inner + this.radius);
      const y = amp + this.bowl * this.radius * b * b;
      if (s >= 0) return out.set(r * this.cs[s], y, r * this.sn[s]);
      const th = fn * Math.PI;
      return out.set(r * Math.cos(th), y, r * Math.sin(th));
    }
    const u = 2 * tn - 1;
    const v = 2 * fn - 1;
    const x = u * Math.sqrt(Math.max(0, 1 - (v * v) / 2)) * this.radius * ax.t;
    const z = -v * Math.sqrt(Math.max(0, 1 - (u * u) / 2)) * this.radius * ax.f;
    const b = Math.hypot(x, z) / this.radius;
    return out.set(x, amp + this.bowl * this.radius * b * b, z);
  }

  update(ctx: ModeCtx, geom: boolean): void {
    this.ctx = ctx;
    if (ctx.frames !== this.T || ctx.nBins !== this.N || ctx.res !== this.res) {
      this.build(ctx);
      geom = true;
    }
    if (!this.geo) return;
    this.pool(ctx, geom);
    this.ensureLut(ctx.theme);

    const A = this.A;
    const nK = this.nK;
    const sheets = this.style === 'sheets';
    const PA = this.geo.getAttribute('position') as THREE.BufferAttribute;
    const CA = this.geo.getAttribute('color') as THREE.BufferAttribute;
    const Pos = PA.array as Float32Array;
    const Col = CA.array as Float32Array;
    const pick = this.pick.pos;
    const rho = this.rho;

    if (geom) {
      const v = tmpV;
      const ax = ctx.axis;
      const rMax = this.polar ? this.inner + this.radius * ax.t : this.radius * Math.max(ax.t, ax.f, 1e-3);
      for (let i = 0; i < this.nT; i++) {
        const tn = this.tn[i];
        for (let s = 0; s < A; s++) {
          const j = this.sj[s];
          const o = i * A + s;
          this.place(tn, this.fn[j], this.h[i * nK + j], this.polar ? s : -1, v);
          pick[o * 3] = v.x;
          pick[o * 3 + 1] = v.y;
          pick[o * 3 + 2] = v.z;
          rho[o] = this.polar ? tn : Math.min(1, Math.hypot(v.x, v.z) / rMax);
          if (sheets) {
            // base on the bowl curve, top on the terrain
            const base = this.place(tn, this.fn[j], 0, s, tmpB).y;
            Pos[o * 6] = v.x;
            Pos[o * 6 + 1] = base;
            Pos[o * 6 + 2] = v.z;
            Pos[o * 6 + 3] = v.x;
            Pos[o * 6 + 4] = v.y;
            Pos[o * 6 + 5] = v.z;
          } else {
            Pos[o * 3] = v.x;
            Pos[o * 3 + 1] = v.y;
            Pos[o * 3 + 2] = v.z;
          }
        }
      }
      PA.needsUpdate = true;
      if (sheets) this.geo.computeVertexNormals();
    }

    // colours: data colour with a gentle centre-to-rim gradient from the theme ramp
    const L = this.lut;
    const w = sheets ? 0.22 : 0.3;
    for (let i = 0; i < this.nT; i++)
      for (let s = 0; s < A; s++) {
        const o = i * A + s;
        const c = (i * nK + this.sj[s]) * 3;
        const n = Math.round(clamp01(0.82 - 0.55 * rho[o]) * (LUT - 1)) * 3;
        const r = this.col[c] * (1 - w) + L[n] * w;
        const g = this.col[c + 1] * (1 - w) + L[n + 1] * w;
        const b = this.col[c + 2] * (1 - w) + L[n + 2] * w;
        if (sheets) {
          Col[o * 6] = r * 0.28;
          Col[o * 6 + 1] = g * 0.28;
          Col[o * 6 + 2] = b * 0.28;
          Col[o * 6 + 3] = r;
          Col[o * 6 + 4] = g;
          Col[o * 6 + 5] = b;
        } else {
          Col[o * 3] = r;
          Col[o * 3 + 1] = g;
          Col[o * 3 + 2] = b;
        }
      }
    CA.needsUpdate = true;
  }

  toDisplay(cx: number, cy: number, cz: number, out: THREE.Vector3): THREE.Vector3 {
    const c = this.ctx;
    const tn = clamp01((cx + c.WORLD_W / 2) / c.WORLD_W);
    const fn = clamp01((c.WORLD_D / 2 - cz) / c.WORLD_D);
    return this.place(tn, fn, cy, -1, out);
  }

  pickCloud(): PickCloud {
    return this.pick;
  }

  frame(): { target: THREE.Vector3; distance: number } {
    const ax = this.ctx.axis;
    let R: number;
    let rim: number;
    if (this.polar) {
      R = this.inner + this.radius * ax.t;
      const b = R / (this.inner + this.radius);
      rim = this.bowl * this.radius * b * b;
    } else {
      R = this.radius * Math.max(ax.t, ax.f);
      const b = R / this.radius;
      rim = this.bowl * this.radius * b * b;
    }
    const top = Math.max(rim, AMP * ax.a * 0.6) + 0.2;
    const Rb = Math.hypot(R, top / 2);
    return { target: new THREE.Vector3(0, top * 0.35, 0), distance: (Rb / SIN21) * 0.95 };
  }

  dispose(): void {
    this.clearMesh();
    this.object.removeFromParent();
  }
}

const tmpV = new THREE.Vector3();
const tmpB = new THREE.Vector3();

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
