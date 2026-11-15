import * as THREE from 'three';

/**
 * Environmental fog: a cloud of large, soft, slowly drifting puffs filling a
 * box around the model. The puffs are depth tested, so fog in front of the
 * model veils it and fog behind it is hidden, which reads as a volume rather
 * than a layer painted on top. All motion uses whole cycles of a 60 s loop,
 * so a 60 s video loops without a seam.
 */
const LOOP_SECONDS = 60;

export class FogVolume {
  readonly object: THREE.Points;
  private mat: THREE.ShaderMaterial;

  constructor(count = 480) {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count * 4);
    let r = 12345;
    const rnd = () => ((r = (r * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = rnd() * 2 - 1;
      pos[i * 3 + 1] = rnd() ** 1.8; // denser near the ground
      pos[i * 3 + 2] = rnd() * 2 - 1;
      for (let k = 0; k < 4; k++) seed[i * 4 + k] = rnd();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color() },
        uCenter: { value: new THREE.Vector3() },
        uHalf: { value: new THREE.Vector3(10, 2, 10) },
        uBottom: { value: 0 },
        uAlpha: { value: 0.1 },
        uSize: { value: 4 },
        uPhase: { value: 0 },
        uScale: { value: 500 },
      },
      vertexShader: /* glsl */ `
        attribute vec4 aSeed;
        uniform vec3 uCenter;
        uniform vec3 uHalf;
        uniform float uBottom;
        uniform float uSize;
        uniform float uPhase;
        uniform float uScale;
        varying float vAlpha;
        void main() {
          vec3 p = vec3( position.x * uHalf.x, uBottom + position.y * uHalf.y * 2.0, position.z * uHalf.z ) + vec3( uCenter.x, 0.0, uCenter.z );
          // slow drift on closed loops (whole cycles per loop, so the motion repeats seamlessly)
          float a = uPhase * ( 1.0 + floor( aSeed.x * 2.0 ) ) + aSeed.y * 6.2832;
          p += vec3( cos( a ) * 1.6, sin( a * 2.0 ) * 0.15, sin( a ) * 1.6 ) * ( 0.5 + aSeed.z );
          vec4 mv = modelViewMatrix * vec4( p, 1.0 );
          gl_Position = projectionMatrix * mv;
          float dist = -mv.z;
          gl_PointSize = min( 700.0, uSize * ( 0.6 + aSeed.w ) * uScale / max( dist, 0.1 ) );
          // breathe a little, and fade puffs that come too close to the camera
          vAlpha = ( 0.75 + 0.25 * sin( uPhase * 3.0 + aSeed.x * 6.2832 ) ) * smoothstep( 1.5, 6.0, dist );
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uAlpha;
        varying float vAlpha;
        void main() {
          float d = length( gl_PointCoord - 0.5 ) * 2.0;
          if ( d > 1.0 ) discard;
          float soft = ( 1.0 - d * d );
          gl_FragColor = vec4( uColor, soft * soft * uAlpha * vAlpha );
          #include <colorspace_fragment>
        }`,
    });
    this.object = new THREE.Points(geo, this.mat);
    this.object.frustumCulled = false;
    this.object.renderOrder = 5;
  }

  /** half = half extents of the box (x, height, z), bottom = lowest y. */
  update(o: { color: string; center: THREE.Vector3; half: THREE.Vector3; bottom: number; density: number; time: number; viewportHeight: number; fovDeg: number }) {
    const u = this.mat.uniforms;
    (u.uColor.value as THREE.Color).set(o.color);
    (u.uCenter.value as THREE.Vector3).copy(o.center);
    (u.uHalf.value as THREE.Vector3).copy(o.half);
    u.uBottom.value = o.bottom;
    u.uAlpha.value = 0.16 * o.density;
    u.uSize.value = Math.max(o.half.x, o.half.z) * 0.22;
    u.uPhase.value = ((o.time % LOOP_SECONDS) / LOOP_SECONDS) * Math.PI * 2;
    // pixels per world unit at distance 1
    u.uScale.value = o.viewportHeight / (2 * Math.tan((o.fovDeg * Math.PI) / 360));
    this.object.visible = o.density > 0.001;
  }

  dispose() {
    this.object.parent?.remove(this.object);
    this.object.geometry.dispose();
    this.mat.dispose();
  }
}
