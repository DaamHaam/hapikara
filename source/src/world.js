// the world: which meshes exist and where every instance stands
const K = { SOLID: 0, LEAF: 1, CRYSTAL: 2, GLASS: 3, WATER: 4, CASCADE: 5 };
// flags: not in the camera cascade / mirror / any shadow map / baked shadows (moving things); never culled; drawn
// last (ground); thin crystal, drawn after the solid crystals so they show through
const NO_NEAR = 1, NO_MIRROR = 2, NO_SHADOW = 4, NO_BAKE = 8, ALWAYS = 16, DRAW_LAST = 32, THIN = 64;
const Q0 = [0, 0, 0, 1];
const rgb = (r, g, b, a = 1) => (round(clamp(a, 0, 1) * 255) << 24 | round(clamp(b, 0, 1) * 255) << 16 | round(clamp(g, 0, 1) * 255) << 8 | round(clamp(r, 0, 1) * 255)) >>> 0;
// places paved in the city: the acropolis, the avenues, the temple blocks either side of the avenue, the quaysides
const TEMPLE = [138, 244]; // x range of the temple blocks
const pavedAt = (x, z) => cityH(x,z) > LAND || (abs(x) < ACRO && abs(z) < ACRO) || abs(z) < AVE + 5 || abs(x) < AVE + 2 || (x > TEMPLE[0] && x < TEMPLE[1] && abs(z) < ACRO) || edgeDist(x, z) < 3.2;

function buildWorld() {
  const meshes = [], types = [];
  let IB = new ArrayBuffer(48 << 14), IF = new Float32Array(IB), IU = new Uint32Array(IB), nI = 0;
  // up to four LODs switched at d01, d12, d23, gone beyond dmax; thin > 0: distance where instances start thinning out
  const type = (lods, kind, d01 = 1e9, d12 = 1e9, dmax = 1e9, thin = 0, flags = 0, d23 = 1e9) => { types.push({ lods: lods.map((m) => meshes.push(m) - 1), kind, d: [d01, d12, dmax, thin], d23, flags, n: 0 }); return types.length - 1; };
  const put = (ty, x, y, z, s = 1, q = Q0, tint = 0xffffffff, sy = 1) => {
    if ((nI + 1) * 48 > IB.byteLength) { const n = new ArrayBuffer(IB.byteLength * 2); new Uint8Array(n).set(new Uint8Array(IB)); IB = n; IF = new Float32Array(n); IU = new Uint32Array(n); }
    const o = nI++ * 12; IF[o] = x; IF[o + 1] = y; IF[o + 2] = z; IF[o + 3] = s; IF[o + 4] = q[0]; IF[o + 5] = q[1]; IF[o + 6] = q[2]; IF[o + 7] = q[3];
    IU[o + 8] = tint; IU[o + 9] = ty; IF[o + 10] = types[ty].flags & ALWAYS ? 1e6 : meshes[types[ty].lods[0]].rad * s * max(1, sy); IF[o + 11] = sy; types[ty].n++;
  };
  // ground masks, 1 m/texel over +-1024 m. City: r paved, g planting bed, b worn path. Farmed land: r track, g wide-row
  // crop, b parcel verge, a tilled field; LANDMAP there: crop colour (sqrt) and in alpha the earth between rows.
  const MAP = new Uint8Array(2048 * 2048 * 4), LANDMAP = new Uint8Array(2048 * 2048 * 4);
  const CROP = [null, [0.45, 0.36, 0.13, 0.3, 0], [0.13, 0.24, 0.12, 0.85, 1], [0.1, 0.19, 0.055, 0.9, 1], null, [0.2, 0.145, 0.095, 0.5, 0], [0.085, 0.21, 0.06, 0.22, 0]];
  const paint = (x, z, rad, ch, val, soft = 1.5) => {
    const x0 = max(0, floor(x + 1024 - rad - soft)), x1 = min(2047, ceil(x + 1024 + rad + soft)), z0 = max(0, floor(z + 1024 - rad - soft)), z1 = min(2047, ceil(z + 1024 + rad + soft));
    for (let j = z0; j <= z1; j++) for (let i = x0; i <= x1; i++) { const d = hypot(i + 0.5 - 1024 - x, j + 0.5 - 1024 - z), k = clamp((rad + soft - d) / soft, 0, 1), o = (j * 2048 + i) * 4 + ch; MAP[o] = MAP[o] + (val - MAP[o]) * k; }
  };
  for (let j = 0; j < 2048; j++) for (let i = 0; i < 2048; i++) {
    const x = i + 0.5 - 1024, z = j + 0.5 - 1024, o = (j * 2048 + i) * 4;
    if (inCity(x, z)) { MAP[o] = pavedAt(x, z) ? 255 : 0; continue; }
    LANDMAP[o] = 140; LANDMAP[o + 1] = 162; LANDMAP[o + 2] = 115;
    const r = hypot(x, z), t = atan2(z, x), zone = sstep(20, 50, r - RB.out(t)) * sstep(30, 70, nileD(x, z)) * (1 - sstep(0.02, 0.15, desertK(x, z))) * (1 - sstep(0.57, 0.62, woodAt(x, z)));
    if (zone > 0) {
      const pa = parcelAt(x, z), use = parcelUse(pa.b, pa.s), C = CROP[use.kind], tone = 0.8 + 0.4 * use.id;
      if (use.farm) MAP[o + 2] = 255 * zone * (1 - sstep(1, 3.2, pa.edge));
      if (C) { MAP[o + 3] = 255 * zone * sstep(1.4, 3.4, pa.edge); MAP[o + 1] = 255 * C[4]; for (let k = 0; k < 3; k++) LANDMAP[o + k] = 255 * sqrt(min(1, C[k] * tone)); LANDMAP[o + 3] = 255 * C[3]; }
    }
  }

  // ground, acropolis, pyramid, terrain
  put(type([meshCityGround()], K.SOLID, 1e9, 1e9, 1e9, 0, DRAW_LAST), 0, 0, 0);
  put(type([meshAcropolis()], K.SOLID), 0, 0, 0);
  put(type([meshPyramid()], K.SOLID), 0, 0, 0);
  put(type([meshPyramidion()], K.CRYSTAL), 0, PYR_TOP + 1.5, 0);
  put(type([meshLattice()], K.SOLID), 0, 0, 0);
  const land = meshTerrain();
  for (const ch of land.chunks) { put(type(ch.lods, K.SOLID, QL(1e9, 650, 500), QL(1e9, 1950, 1500), 1e9, 0, NO_NEAR | DRAW_LAST), ch.c[0], ch.c[1], ch.c[2]); if (LV) IF[(nI - 1) * 12 + 10] *= 2; }

  // bridges and their balustrades
  const tPost = type([meshBalPost(0), meshBalPost(1)], K.SOLID, 130, 1e9, 700), tPanel = type([meshBalPanel(0), meshBalPanel(1)], K.SOLID, 130, 1e9, 420);
  const balRun = (a, b) => {
    const L = hypot(b[0] - a[0], b[2] - a[2]), n = max(1, round(L / BAL)), k = L / n / BAL, q = qYaw(-atan2(b[2] - a[2], b[0] - a[0]));
    for (let i = 0; i < n; i++) { const t = i / n, x = mix(a[0], b[0], t), y = mix(a[1], b[1], t), z = mix(a[2], b[2], t); put(tPost, x, y, z, k, q, 0xffffffff, 1 / k); put(tPanel, x, y, z, k, q, 0xffffffff, 1 / k); }
  };
  const hard = { boxes: [], bridges: [] };
  const brm = new MB(1 << 16), DECK = LAND + 0.31;
  const span = (x0, z0, x1, z1, hw, hump, arches) => {
    if (!canalAt((x0+x1)/2,(z0+z1)/2)) return;
    // No deck at a junction or into an elevated quay: these crossings stay open for boats.
    if (canalAt(x0,z0) || canalAt(x1,z1) || cityH(x0,z0) > LAND || cityH(x1,z1) > LAND) return;
    const b = bridge(brm, x0, z0, x1, z1, hw, DECK, DECK, hump, arches, FLOOR_Y), S = max(2, round(b.L / 7.8));
    for (const sd of [-1, 1]) for (let i = 0; i < S; i++) {
      const u0 = b.L * i / S, u1 = b.L * (i + 1) / S, v = sd * (hw - 0.3), P = (u) => [x0 + b.ux * u + b.vx * v, b.top(u) + 0.34, z0 + b.uz * u + b.vz * v];
      balRun(P(u0), P(u1));
    }
    hard.bridges.push(min(x0, x1) - (x0 === x1 ? hw : 0), min(z0, z1) - (z0 === z1 ? hw : 0), max(x0, x1) + (x0 === x1 ? hw : 0), max(z0, z1) + (z0 === z1 ? hw : 0), DECK + hump, x0 === x1 ? 1 : 0, hump);
  };
  // the avenues over every canal they cross (east, west, north, south), and the ring
  const ringAt = (t) => [RB.gar(t) - 0.4, RB.out(t) + 0.4];
  for (const [c, w] of CXL) span(c - w - 0.4, 0, c + w + 0.4, 0, AVE, 0.6, abs(c) === 130 ? 3 : 1);
  for (const [c, w] of CZL) span(0, c - w - 0.4, 0, c + w + 0.4, AVE, 0.6, abs(c) === 130 ? 3 : 1);
  for (const t of [0, PI / 2, PI, -PI / 2]) { const [a, b] = ringAt(t), c = round(cos(t)), s = round(sin(t)); span(a * c, a * s, b * c, b * s, AVE, 0.9, 3); }
  // footbridges half way along every canal stretch between crossings
  const xs = [-CITY_A, ...CXL.map((c) => c[0]), CITY_A], zs = [-CITY_B, ...CZL.map((c) => c[0]), CITY_B];
  for (const [c, w] of CXL) for (let j = 0; j < zs.length - 1; j++) { const m = (zs[j] + zs[j + 1]) / 2; if (abs(m) > 40 && inCity(c, m) && !inRing(c, m) && !inRing(c, m - 20) && !inRing(c, m + 20)) span(c - w - 0.4, m, c + w + 0.4, m, 3.2, 0.9, 1); }
  for (const [c, w] of CZL) for (let i = 0; i < xs.length - 1; i++) { const m = (xs[i] + xs[i + 1]) / 2; if (abs(m) > 40 && inCity(m, c) && !inRing(m, c) && !inRing(m - 20, c) && !inRing(m + 20, c)) span(m, c - w - 0.4, m, c + w + 0.4, 3.2, 0.9, 1); }
  put(type([brm.build()], K.SOLID), 0, 0, 0);

  // water
  const wm = new MB(1 << 14);
  put(type([meshCityWater()], K.WATER), 0, 0, 0);
  put(type([meshSea()], K.WATER), 0, 0, 0);
  put(type([meshCascades()], K.CASCADE), 0, 0, 0);

  populate({ type, put, paint, MAP, balRun, gH: land.heightAt, hard, wm });
  put(type([wm.build()], K.WATER), 0, 0, 0);
  return { meshes, types, inst: IB.slice(0, nI * 48), nI, MAP, LANDMAP, ground: land.drawnAt, hard };
}
