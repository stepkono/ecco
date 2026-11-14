import * as THREE from 'three';
import { FOG_LOOP_SECONDS, FOG_NOISE_GLSL } from './shaders';

const N = 5; // sheets
const SIZE = 80; // world units, centred on the origin
const BASE = 0.22; // opacity of the lowest sheet at density 1

const VERT = /* glsl */ `
varying vec2 vP;
varying vec3 vWorld;
varying float vDist;
void main() {
  vP = position.xz;
  vec4 w = modelMatrix * vec4( position, 1.0 );
  vWorld = w.xyz;
  vec4 mv = viewMatrix * w;
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
uniform float uDensity;
uniform float uSeed;
uniform float uWeight;
varying vec2 vP;
varying vec3 vWorld;
varying float vDist;
${FOG_NOISE_GLSL}
void main() {
  float ph = 6.2831853 * uTime / ${FOG_LOOP_SECONDS.toFixed(1)};
  vec2 p = vP * 0.11 + uSeed * 13.7;
  // a light domain warp gives the soft, curling banks
  vec2 w = vec2( fgFbm( p * 0.6, ph, uSeed + 1.0 ), fgFbm( p * 0.6 + 5.2, -ph, uSeed + 2.0 ) );
  float n = fgFbm( p + 1.4 * ( w - 0.5 ), ph, uSeed );
  float shape = smoothstep( 0.25, 0.8, n );
  // fade out towards the far edge of the sheet
  float edge = 1.0 - smoothstep( 0.4, 1.0, length( vP ) / ${(SIZE / 2).toFixed(1)} );
  // seen edge-on a sheet would turn into a line: fade it, and fade it right in front of the camera
  vec3 V = normalize( cameraPosition - vWorld );
  float graze = smoothstep( 0.03, 0.35, abs( V.y ) );
  float near = smoothstep( 0.6, 4.0, vDist );
  float a = uDensity * uWeight * ( 0.25 + 0.75 * shape ) * edge * graze * near;
  gl_FragColor = vec4( uColor, a );
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/**
 * Volumetric looking fog: a stack of large horizontal sheets between `bottom`
 * and `top`, each with its own slowly drifting noise. Low sheets are denser
 * than high ones. The drift loops after FOG_LOOP_SECONDS.
 * Add `group` to the scene and call update() every frame.
 */
export class FogSheets {
  readonly group = new THREE.Group();
  private geo: THREE.PlaneGeometry;
  private mats: THREE.ShaderMaterial[] = [];
  private shared = {
    uColor: { value: new THREE.Color() },
    uTime: { value: 0 },
    uDensity: { value: 0 },
  };

  constructor() {
    this.group.name = 'fog-sheets';
    this.geo = new THREE.PlaneGeometry(SIZE, SIZE, 1, 1);
    this.geo.rotateX(-Math.PI / 2);
    for (let i = 0; i < N; i++) {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          ...this.shared,
          uSeed: { value: 0.37 + i * 1.618 },
          uWeight: { value: BASE * (1 - (0.65 * i) / (N - 1)) },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide,
      });
      this.mats.push(mat);
      const m = new THREE.Mesh(this.geo, mat);
      m.renderOrder = 2;
      this.group.add(m);
    }
  }

  update(o: { color: string; bottom: number; top: number; density: number; time: number }) {
    this.shared.uColor.value.set(o.color);
    this.shared.uTime.value = o.time;
    this.shared.uDensity.value = Math.max(0, o.density);
    this.group.visible = o.density > 0.001;
    const top = Math.max(o.top, o.bottom + 0.01);
    this.group.children.forEach((m, i) => {
      m.position.y = o.bottom + ((top - o.bottom) * (i + 0.5)) / N;
    });
  }

  dispose() {
    this.group.removeFromParent();
    this.geo.dispose();
    this.mats.forEach((m) => m.dispose());
    this.group.clear();
  }
}
