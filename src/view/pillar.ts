import * as THREE from 'three';

/**
 * One mesh per voxel column with a rounded (bevelled) top edge.
 *
 * Instances scale the unit column to (cell, height, cell). A plain rounded box
 * would stretch its rounding with the height, so the bevel vertices sit at
 * y = 1 and carry `aBevel`, their drop below the top in units of the cell
 * width. The vertex shader moves them down by aBevel * width / height, so the
 * bevel keeps the same shape at every column height.
 */
export function pillarGeometry(round: number, steps = 4) {
  const R = Math.min(0.49, Math.max(0, round) * 0.45);
  const rings: { half: number; drop: number }[] = [{ half: 0.5, drop: Infinity }]; // bottom ring
  for (let k = 0; k <= steps; k++) {
    const th = (k / steps) * (Math.PI / 2);
    rings.push({ half: 0.5 - R * (1 - Math.cos(th)), drop: R * (1 - Math.sin(th)) });
  }
  const pos: number[] = []; // true shape, for the normals
  const bevel: number[] = [];
  const idx: number[] = [];
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  // four sides, each its own strip, so the corners stay crisp
  for (let s = 0; s < 4; s++) {
    const [ax, az] = corners[s];
    const [bx, bz] = corners[(s + 1) % 4];
    const base = pos.length / 3;
    rings.forEach((r) => {
      const y = r.drop === Infinity ? 0 : 1 - r.drop;
      pos.push(ax * r.half, y, az * r.half, bx * r.half, y, bz * r.half);
      const b = r.drop === Infinity ? -1 : r.drop;
      bevel.push(b, b);
    });
    for (let k = 0; k < rings.length - 1; k++) {
      const a = base + k * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  // flat top
  const top = rings[rings.length - 1].half;
  const t0 = pos.length / 3;
  for (const [cx, cz] of corners) {
    pos.push(cx * top, 1, cz * top);
    bevel.push(0);
  }
  idx.push(t0, t0 + 2, t0 + 1, t0, t0 + 3, t0 + 2);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  // make the winding face outward whatever the corner order produced
  const n = geo.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < n.count; i++) {
    const px = pos[i * 3], pz = pos[i * 3 + 2];
    if (n.getX(i) * px + n.getZ(i) * pz < -1e-4 && n.getY(i) < 0.99) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  }
  // now pin the bevel to the top: the shader drops it by aBevel * width / height
  const P = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < P.count; i++) {
    const b = bevel[i];
    P.setY(i, b < 0 ? 0 : 1);
    bevel[i] = Math.max(0, b);
  }
  geo.setAttribute('aBevel', new THREE.Float32BufferAttribute(bevel, 1));
  return geo;
}

/** Shader side of pillarGeometry, for instanced materials. */
export function withPillar<T extends THREE.Material>(mat: T): T {
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey?.bind(mat);
  mat.onBeforeCompile = (s, r) => {
    prev?.call(mat, s, r);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aBevel;')
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        #ifdef USE_INSTANCING
          // three divides instanced normals by the scale; pre-multiplying keeps the true bevel normal
          objectNormal *= vec3( length( instanceMatrix[0].xyz ), length( instanceMatrix[1].xyz ), length( instanceMatrix[2].xyz ) );
        #endif`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float pW = length( instanceMatrix[0].xyz );
          float pH = max( 1e-4, length( instanceMatrix[1].xyz ) );
          transformed.y = max( 0.0, transformed.y - aBevel * pW / pH );
        #endif`,
      );
  };
  mat.customProgramCacheKey = () => (prevKey ? prevKey() : '') + '+pillar';
  mat.needsUpdate = true;
  return mat;
}
