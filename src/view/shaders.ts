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
  /** water: x = wave height, rgb tint of the caustics in waterTint */
  water: { value: new THREE.Vector4(0.035, 0, 0, 0) },
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

/** Distance fog plus a soft, coloured ground fog that the terrain rises out of. */
export function withFog<T extends THREE.Material>(mat: T): T {
  addPatch(mat, {
    key: 'hfog',
    last: true,
    fn: (s) => {
      worldPos(s);
      s.uniforms.uHFog = U.hfog;
      s.fragmentShader = s.fragmentShader
        .replace('#include <fog_pars_fragment>', '#include <fog_pars_fragment>\nuniform vec4 uHFog;')
        .replace(
          '#include <fog_fragment>',
          `#ifdef USE_FOG
            #ifdef FOG_EXP2
              float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
            #else
              float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
            #endif
            float hFog = ( 1.0 - smoothstep( uHFog.x, uHFog.y, vWPos.y ) ) * uHFog.z;
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

/** Moving waves and caustic light on a height field. */
export function withWater<T extends THREE.Material>(mat: T): T {
  addPatch(mat, {
    key: 'water',
    fn: (s) => {
      worldPos(s);
      s.uniforms.uTime = U.time;
      s.uniforms.uWater = U.water;
      s.uniforms.uWaterTint = U.waterTint;
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform vec4 uWater;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          transformed.y += uWater.x * ( sin( position.x * 2.3 + uTime * 1.1 ) * cos( position.z * 1.9 - uTime * 0.8 )
                        + 0.5 * sin( ( position.x + position.z ) * 3.1 + uTime * 1.7 ) );`,
        );
      s.fragmentShader = s.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform float uTime;
          uniform vec3 uWaterTint;
          // a web of bright lines from warped, overlapping sine ridges
          float caustic( vec2 p, float t ) {
            float c = 0.0;
            for ( int n = 0; n < 3; n++ ) {
              float fn = float( n );
              vec2 q = p * ( 1.3 + fn * 0.6 ) + vec2( t * 0.31 * ( fn + 1.0 ), -t * 0.23 * ( fn + 1.0 ) );
              q += 0.7 * vec2( sin( q.y * 1.7 + t ), cos( q.x * 1.3 - t * 0.9 ) );
              float v = abs( sin( q.x ) + sin( q.y ) );
              c += pow( 1.0 - min( 1.0, v * 0.55 ), 5.0 );
            }
            return c / 3.0;
          }`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          totalEmissiveRadiance += uWaterTint * caustic( vWPos.xz * 1.1, uTime ) * 0.6;`,
        );
    },
  });
  return mat;
}
