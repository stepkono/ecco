import * as THREE from 'three';

/**
 * Small shader patches on top of the built-in three.js materials, so lighting,
 * instancing and vertex colours keep working. Patches compose: a material can
 * have fog + water, or fog + mirror.
 */

/** Uniforms shared by every patched material. */
export const U = {
  time: { value: 0 },
  /** height fog: x = bottom y, y = top y, z = density at and below the bottom */
  hfog: { value: new THREE.Vector4(-0.05, 1, 0.5, 0) },
  /** mirror: x = depth where the reflection is gone, y = depth where the lines are gone, z = stripe density */
  mirror: { value: new THREE.Vector3(1.6, 3.2, 9) },
  /** water: x = wave height, y = world height of the crests (full light cyan), z = how much the water blues cover the paint (0..1). Caustic tint in waterTint */
  water: { value: new THREE.Vector4(0.035, 1.2, 0.5, 0) },
  waterTint: { value: new THREE.Color(0xffffff) },
};

type Patch = { key: string; fn: (s: THREE.WebGLProgramParametersWithUniforms) => void; last?: boolean };

function addPatch(mat: THREE.Material, p: Patch) {
  const list: Patch[] = (mat.userData.patches ??= []);
  if (list.some((x) => x.key === p.key)) return mat;
  list.push(p);
  // the fog patch rewrites <fog_fragment>, so it must run after the patches that wrap it
  list.sort((a, b) => Number(!!a.last) - Number(!!b.last));
  mat.onBeforeCompile = (s) => list.forEach((x) => x.fn(s));
  mat.customProgramCacheKey = () => list.map((x) => x.key).join('+');
  mat.needsUpdate = true;
  return mat;
}

const WPOS_VERT = `
{
  vec4 wpFog = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
    wpFog = instanceMatrix * wpFog;
  #endif
  vWPos = ( modelMatrix * wpFog ).xyz;
}`;

function worldPos(s: THREE.WebGLProgramParametersWithUniforms) {
  if (s.vertexShader.includes('varying vec3 vWPos;')) return;
  s.vertexShader = s.vertexShader
    .replace('#include <fog_pars_vertex>', '#include <fog_pars_vertex>\nvarying vec3 vWPos;')
    .replace('#include <fog_vertex>', '#include <fog_vertex>\n' + WPOS_VERT);
  s.fragmentShader = s.fragmentShader.replace('#include <fog_pars_fragment>', '#include <fog_pars_fragment>\nvarying vec3 vWPos;');
}

/** Seconds after which the fog drift repeats exactly (a multiple of WATER_LOOP_SECONDS). */
export const FOG_LOOP_SECONDS = 60;
/** Seconds after which the water waves and caustics repeat exactly. */
export const WATER_LOOP_SECONDS = 12;

/**
 * Cheap value noise and a 3 octave fbm whose drift loops: every octave moves on
 * a small circle driven by an integer multiple of the phase, so the fog breathes
 * and morphs instead of sliding away, and repeats after FOG_LOOP_SECONDS.
 */
export const FOG_NOISE_GLSL = `
float fgHash( vec2 p ) {
  vec3 p3 = fract( vec3( p.xyx ) * 0.1031 );
  p3 += dot( p3, p3.yzx + 33.33 );
  return fract( ( p3.x + p3.y ) * p3.z );
}
float fgNoise( vec2 p ) {
  vec2 i = floor( p );
  vec2 f = fract( p );
  vec2 u = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( fgHash( i ), fgHash( i + vec2( 1.0, 0.0 ) ), u.x ),
              mix( fgHash( i + vec2( 0.0, 1.0 ) ), fgHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y );
}
float fgFbm( vec2 p, float ph, float seed ) {
  vec2 o1 = 0.9 * vec2( cos( ph + seed ), sin( ph + seed ) );
  vec2 o2 = 0.7 * vec2( cos( -ph + seed * 1.7 ), sin( -ph + seed * 1.7 ) );
  vec2 o3 = 0.5 * vec2( cos( 2.0 * ph + seed * 2.3 ), sin( 2.0 * ph + seed * 2.3 ) );
  float a = 0.55 * fgNoise( p + o1 + seed * 7.13 );
  a += 0.30 * fgNoise( p * 2.03 + o2 + 3.7 );
  a += 0.15 * fgNoise( p * 4.11 + o3 + 9.2 );
  return a;
}
`;

/**
 * Distance fog plus a soft, coloured ground fog that the terrain rises out of.
 * The ground fog is broken up by slowly drifting noise, so its top edge and its
 * density vary softly over the scene, and the distance fog gets a faint shimmer.
 */
export function withFog<T extends THREE.Material>(mat: T): T {
  addPatch(mat, {
    key: 'hfog',
    last: true,
    fn: (s) => {
      worldPos(s);
      s.uniforms.uHFog = U.hfog;
      s.uniforms.uFogT = U.time;
      s.fragmentShader = s.fragmentShader
        .replace('#include <fog_pars_fragment>', '#include <fog_pars_fragment>\nuniform vec4 uHFog;\nuniform float uFogT;\n' + FOG_NOISE_GLSL)
        .replace(
          '#include <fog_fragment>',
          `#ifdef USE_FOG
            #ifdef FOG_EXP2
              float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
            #else
              float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
            #endif
            float fgPh = 6.2831853 * uFogT / ${FOG_LOOP_SECONDS.toFixed(1)};
            float fgN = fgFbm( vWPos.xz * 0.22 + vWPos.y * vec2( 0.45, -0.3 ), fgPh, 0.0 );
            float fgTop = max( uHFog.y * ( 0.7 + 0.7 * fgN ), uHFog.x + 0.02 );
            float hFog = ( 1.0 - smoothstep( uHFog.x, fgTop, vWPos.y ) ) * uHFog.z * ( 0.6 + 0.8 * fgN );
            fogFactor += ( fgN - 0.5 ) * 0.8 * fogFactor * ( 1.0 - fogFactor );
            fogFactor = clamp( max( fogFactor, hFog ), 0.0, 1.0 );
            gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
          #endif`,
        );
    },
  });
  return mat;
}

/** The reflection below zero amplitude: fades out with depth and breaks up into thin slices along time. */
export function withMirror<T extends THREE.Material>(mat: T): T {
  mat.transparent = true;
  addPatch(mat, {
    key: 'mirror',
    fn: (s) => {
      worldPos(s);
      s.uniforms.uMirror = U.mirror;
      s.fragmentShader = s.fragmentShader
        .replace('#include <fog_pars_fragment>', '#include <fog_pars_fragment>\nuniform vec3 uMirror;')
        .replace(
          '#include <fog_fragment>',
          `{
            float dep = max( 0.0, -vWPos.y );
            float k = smoothstep( 0.0, uMirror.x, dep );
            if ( fract( vWPos.x * uMirror.z ) > mix( 1.01, 0.12, k ) ) discard;
            gl_FragColor.a *= ( 1.0 - k ) * 0.85;
          }
          #include <fog_fragment>`,
        );
    },
  });
  return mat;
}

/** Thin lines that take over where the reflection fades out, then fade themselves. */
export function withMirrorLines<T extends THREE.Material>(mat: T): T {
  mat.transparent = true;
  addPatch(mat, {
    key: 'mirrorLines',
    fn: (s) => {
      worldPos(s);
      s.uniforms.uMirror = U.mirror;
      s.fragmentShader = s.fragmentShader
        .replace('#include <fog_pars_fragment>', '#include <fog_pars_fragment>\nuniform vec3 uMirror;')
        .replace(
          '#include <fog_fragment>',
          `{
            float dep = max( 0.0, -vWPos.y );
            gl_FragColor.a *= smoothstep( 0.0, uMirror.x * 0.6, dep ) * ( 1.0 - smoothstep( uMirror.x * 0.5, uMirror.y, dep ) );
          }
          #include <fog_fragment>`,
        );
    },
  });
  return mat;
}

/**
 * Calm water on a height field: deep blue in the valleys, light cyan on the
 * crests (mixed over the painted colours by U.water.z), small slow waves and a
 * soft caustic web. Everything runs on a phase of period WATER_LOOP_SECONDS
 * (sin / cos of integer multiples, circular offsets), so a recorded loop of
 * that length, or any multiple, has no seam.
 */
export function withWater<T extends THREE.Material>(mat: T): T {
  addPatch(mat, {
    key: 'water',
    fn: (s) => {
      worldPos(s);
      s.uniforms.uTime = U.time;
      s.uniforms.uWater = U.water;
      s.uniforms.uWaterTint = U.waterTint;
      const PH = `( 6.2831853 * uTime / ${WATER_LOOP_SECONDS.toFixed(1)} )`;
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform vec4 uWater;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          {
            float wPh = ${PH};
            transformed.y += uWater.x * 0.45 * ( sin( position.x * 1.7 + wPh ) * cos( position.z * 1.3 - wPh )
                          + 0.4 * sin( ( position.x - position.z ) * 2.6 + 2.0 * wPh ) );
          }`,
        );
      s.fragmentShader = s.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform float uTime;
          uniform vec4 uWater;
          uniform vec3 uWaterTint;
          // a soft web of light from warped, overlapping sine ridges, each layer circling once per period
          float caustic( vec2 p, float ph ) {
            float c = 0.0;
            for ( int n = 0; n < 3; n++ ) {
              float fn = float( n );
              float dir = n == 1 ? -1.0 : 1.0;
              vec2 q = p * ( 1.2 + fn * 0.55 ) + 0.6 * vec2( cos( dir * ph + fn * 2.1 ), sin( dir * ph + fn * 2.1 ) );
              q += 0.55 * vec2( sin( q.y * 1.5 + ph ), cos( q.x * 1.2 - ph ) );
              float v = abs( sin( q.x ) + sin( q.y ) );
              c += pow( 1.0 - min( 1.0, v * 0.6 ), 3.0 );
            }
            return c / 3.0;
          }`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          {
            // water blues in linear space: deep blue #123f7a in the valleys, light cyan #9fe3ef on the crests
            float crest = smoothstep( 0.0, max( uWater.y, 0.01 ), vWPos.y );
            vec3 wCol = mix( vec3( 0.0065, 0.050, 0.195 ), vec3( 0.347, 0.768, 0.863 ), crest );
            diffuseColor.rgb = mix( diffuseColor.rgb, wCol, clamp( uWater.z, 0.0, 1.0 ) );
          }`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          {
            float cs = caustic( vWPos.xz * 1.1, ${PH} );
            vec3 cCol = mix( vec3( 0.85, 0.97, 1.0 ), uWaterTint, 0.3 );
            totalEmissiveRadiance += cCol * cs * ( 0.18 + 0.12 * smoothstep( 0.0, max( uWater.y, 0.01 ), vWPos.y ) );
          }`,
        );
    },
  });
  return mat;
}
