// world layout: shared by the meshes, the planting and the shaders
// metres, +Y up, pyramid at the origin, +X east (the Nile), -X west (the desert), +Z south, -Z north
const WATER = 6.5, LAND = 10; // canal water and city ground; the Nile is at y = 0
const PULSE = 14; // seconds between the flood waves running down the pyramid
const SEA_GROW = 1.034; // each water ring this much wider than the last (meshSea, and the swell's fade in the shader)
const SUN = vnorm([-0.6, 0.55, 0.62]); // towards the sun: 32 degrees up, south-west (afternoon): three-quarter backlight on the views west
const angd = (a, b) => { let d = (a - b) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; };
const bump = (x) => (abs(x) < 1 ? cos(x * PI / 2) ** 2 : 0);

// the city: a rounded rectangle (superellipse) ringed by a canal, crossed by a grid of canals
const CITY_A = 470, CITY_B = 400, RING_W = 22;
const se = (A, B, t) => pow(pow(abs(cos(t)) / A, 5) + pow(abs(sin(t)) / B, 5), -0.2);
const RB = {
  gar: (t) => se(CITY_A - RING_W, CITY_B - RING_W, t), // city ground | ring canal
  out: (t) => se(CITY_A, CITY_B, t), // ring canal | land outside
};
// canals: lines of constant x (running north-south) and constant z (east-west): [position, half width]
const CXL = [[-310, 6], [-190, 6], [-130, 8], [130, 8], [250, 6], [370, 6]];
const CZL = [[-250, 6], [-130, 8], [130, 8], [250, 6]];
const ACRO = 122; // the acropolis block: |x|, |z| < ACRO
const AVE = 10; // half width of the processional avenue (z = 0, east to the Nile) and the north-south way (x = 0)
const FLOOR_Y = 3.0; // canal floors
// on water inside the city (canal or ring), not counting bridges
const inRing = (x, z) => { const r = hypot(x, z), t = atan2(z, x); return r >= RB.gar(t) && r < RB.out(t); };
const inCity = (x, z) => hypot(x, z) < RB.out(atan2(z, x));
const canalAt = (x, z) => {
  const r = hypot(x, z), t = atan2(z, x), g = RB.gar(t);
  if (r >= g) return r < RB.out(t);
  for (const [c, w] of CXL) if (abs(x - c) < w) return true;
  for (const [c, w] of CZL) if (abs(z - c) < w) return true;
  return false;
};
// distance to the nearest canal edge, for things that must keep off quays (negative on water)
const edgeDist = (x, z) => {
  const r = hypot(x, z), t = atan2(z, x), g = RB.gar(t);
  if (r >= g) return r < RB.out(t) ? -1 : r - RB.out(t);
  let d = g - r;
  for (const [c, w] of CXL) d = min(d, abs(x - c) - w);
  for (const [c, w] of CZL) d = min(d, abs(z - c) - w);
  return d;
};
// city blocks between canals, as [x0, z0, x1, z1] before clipping to the ring (meshes.js clips them)
const BLOCKS = (() => {
  const xs = [-1e4, ...CXL.map((c) => c[0]), 1e4], xw = [0, ...CXL.map((c) => c[1]), 0], zs = [-1e4, ...CZL.map((c) => c[0]), 1e4], zw = [0, ...CZL.map((c) => c[1]), 0], out = [];
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) out.push([xs[i] + xw[i], zs[j] + zw[j], xs[i + 1] - xw[i + 1], zs[j + 1] - zw[j + 1]]);
  return out;
})();

// the Nile: west bank along nileX(z), 480 m wide, flowing north
const NILE_W = 480;
const nileX = (z) => 600 + 34 * sin(z / 640 + 0.6) + 18 * sin(z / 230 + 2.1);
// signed distance from the water's edge, positive on land (either bank)
const nileD = (x, z) => { const w = nileX(z); return x < w ? w - x : x > w + NILE_W ? x - w - NILE_W : -min(x - w, w + NILE_W - x); };
// the harbour front: stepped quays where the avenue meets the river (city.js), |z| < QZ
const QZ = 110, QX0 = 585; // quays start at x = QX0 and step down to the water
const quayX = (z) => nileX(z) - 4; // the lowest landing
const quayY = (x, z) => { const x1 = quayX(z), u = (x - QX0) / (x1 - QX0); return u <= 0 ? LAND : u >= 1 ? 0.9 : u < 0.3 ? mix(LAND, 6.2, u / 0.3) : u < 0.5 ? 6.2 : u < 0.8 ? mix(6.2, 2.4, (u - 0.5) / 0.3) : 2.4 - (u - 0.8) / 0.2 * 1.5; };
// how much of the desert a place is (0 green, 1 sand): west of the fields, and far beyond the east bank
const desertK = (x, z) => max(sstep(-470, -640, x + 60 * sin(z / 210) + 30 * sin(z / 77)), sstep(1300, 1700, x - nileX(z) - NILE_W + 80 * sin(z / 300)));
// the cliffs of the western desert, about 2 km out: their foot's x along z
const cliffX = (z) => -2050 + 160 * sin(z / 520 + 1.2) + 70 * sin(z / 170);
// the oasis below the waterfall, at the cliff foot
const OASIS = [-1880, 0, 0]; // x, z set below to the cliff's foot
OASIS[0] = cliffX(OASIS[1]) + 120;

// height of the land outside the city
const terrainH = (x, z) => {
  const nd = nileD(x, z), east = x > nileX(z) + NILE_W / 2;
  // river bed
  if (nd < 0) return -2.5 - 7 * sstep(0, 120, -nd) + (fbm(x / 40, z / 40, 2) - 0.5) * 1.5;
  let h;
  if (!east) {
    // west: fields at the city's level, falling to the bank; dunes rising west of them, then the cliffs
    const und = (fbm(x / 260 + 3, z / 260 + 7, 3) - 0.5) * 2;
    h = LAND + und * 0.8 - (1 - sstep(0, 70, nd)) * (LAND + 1.2);
    const dk = desertK(x, z);
    if (dk > 0) {
      // dunes: long crests running north-south, sharper with distance into the desert
      const q = x * 0.9 + z * 0.35 + 90 * fbm(x / 400, z / 400, 2), crest = 1 - abs(sin(q / 95 + fbm(x / 160 + 4, z / 160, 2) * 2));
      const dune = pow(crest, 1.6) * (6 + 22 * sstep(-600, -1400, x)) + fbm(x / 70 + 2, z / 70 + 5, 3) * 6;
      h += dk * (sstep(-480, -1300, x) * 18 + dune);
      // the cliffs: a bedded plateau 170-230 m up, its face cut back in bays
      const cx = cliffX(z) + (fbm(x / 120 + 7, z / 120 + 1, 3) - 0.5) * 140;
      const face = sstep(cx + 40, cx - 60, x);
      if (face > 0) {
        let p = 190 + 40 * fbm(x / 600 + 2, z / 600 + 6, 3) + (ridge(x / 300 + 1, z / 300 + 4, 4) - 0.4) * 50;
        const k = p / 34, bench = (floor(k) + sstep(0.25, 0.55, k - floor(k))) * 34; p = mix(p, bench, 0.7);
        h = mix(h, p, pow(face, 0.7));
      }
      // the oasis: a hollow at the cliff's foot holding a pool (city.js puts its water at y = 6)
      const od = hypot(x - OASIS[0], z - OASIS[1]);
      if (od < 260) h = mix(h, 4 - 6 * (1 - sstep(0, 70, od)), 1 - sstep(80, 260, od));
    }
  } else {
    // east bank: fields, then low desert hills
    const und = (fbm(x / 300 + 1, z / 300 + 2, 3) - 0.5) * 2;
    h = 2.5 + 4 * sstep(0, 200, nd) + und * 1.2 - (1 - sstep(0, 25, nd)) * 3.5;
    const dk = desertK(x, z); if (dk > 0) h += dk * (12 + 60 * fbm(x / 900 + 3, z / 900 + 1, 4) + ridge(x / 400, z / 400 + 2, 3) * 30);
  }
  // level ground under the harbour's quays (built in city.js) and the land between city and river
  if (abs(z) < QZ + 40 && x > QX0 - 40 && !east) { const k = sstep(QZ + 40, QZ, abs(z)); h = mix(h, min(h, quayY(x, z) - 0.4), k * sstep(QX0 - 40, QX0, x)); if (x < QX0) h = mix(h, LAND, k); }
  // the land meets the city's ring at its quay coping
  const r = hypot(x, z), t = atan2(z, x), ro = RB.out(t);
  h = mix(LAND, h, sstep(ro + 4, ro + 60, r));
  return h;
};
// river-level water there, or none (for collision and planting)
const riverDist = (x, z) => max(0, nileD(x, z)); // distance to the Nile's water (0 on it)
const RIV_GAP = 0, RIV_SHELF = 14;
const woodAt = (x, z) => fbm(x / 95 + 7, z / 95 + 3, 3); // > 0.62: palm grove

// farmland: parcels in bands around the city, as in the old plan. parcelAt: band, sector, distance to the nearest
// boundary and coordinates u, v; parcelPt is the inverse. Used by world.js and city.js.
const PB = 62;
const parcelW = (x, z) => [(fbm(x / 190 + 1.3, z / 190 + 5.1, 2) - 0.5) * 0.9, (fbm(x / 140 + 9.7, z / 140 + 2.2, 2) - 0.5) * 0.7];
const parcelN = (b) => { const rb = 440 + (b + 0.5) * PB; return max(6, round(TAU * rb / (70 + 50 * h2(b, 7)))); };
const parcelAt = (x, z) => {
  const r = hypot(x, z), t = atan2(z, x), w = parcelW(x, z), u = (r - RB.out(t) - 24) / PB + w[0], b = floor(u), n = parcelN(b);
  const v = (t / TAU + 1) * n + h2(b, 3) + w[1], s = floor(v);
  return { b, s: ((s % n) + n) % n, u, v, edge: min(min(u - b, 1 - u + b) * PB, min(v - s, 1 - v + s) * TAU * (440 + (b + 0.5) * PB) / n) };
};
const parcelPt = (u, v, b) => {
  const n = parcelN(b); let t = ((v - h2(b, 3)) / n - 1) * TAU, r = 440 + u * PB, x = r * cos(t), z = r * sin(t);
  for (let i = 0; i < 4; i++) { const w = parcelW(x, z); t = ((v - h2(b, 3) - w[1]) / n - 1) * TAU; r = RB.out(t) + 24 + (u - w[0]) * PB; x = r * cos(t); z = r * sin(t); }
  return [x, z];
};
// parcel use: 0 pasture, 1 wheat, 2 flax (blue), 3 vines, 4 orchard, 5 ploughed, 6 green crop
const PKIND = [1, 1, 2, 3, 6, 5, 6, 4, 1, 6], parcels = new Map();
const parcelUse = (b, s) => {
  const key = b * 4096 + s; let p = parcels.get(key);
  if (!p) {
    const [x, z] = parcelPt(b + 0.5, s + 0.5, b), id = h2(b * 31 + 5, s);
    const farm = b >= 0 && desertK(x, z) < 0.05 && nileD(x, z) > 45 && !(abs(z) < QZ + 60 && x > 300) && woodAt(x, z) < 0.6 && hypot(x, z) < 1500;
    parcels.set(key, p = { kind: farm ? PKIND[floor(h2(s * 17 + 3, b * 7 + 1) * 10)] : 0, id, x, z, farm });
  }
  return p;
};

// camera: review shots and the scripted fly-through
// position + look-at; keys 1-6
const POSES = [
  [950, 330, 430, 0, 30, 0],
  [430, 24, 0, 0, 62, 0],
  [310, 8.4, 130, 140, 14, 126],
  [27, 111.4, 26, 0, 121, 0],
  [300, 46, -330, 0, 46, 0],
  [1060, 13, -230, 640, 22, 120],
];
// 60 s path: position + look-at every 2.5 s on one Catmull-Rom spline (<= 150 m between points)
const FLY = new Float32Array([
  880, 8, 640, 0, 40, 0, //       0 s  low over the Nile, coming up the river
  870, 12, 500, 0, 42, 0,
  860, 20, 360, 0, 46, 0,
  850, 34, 220, 0, 50, 0,
  820, 48, 110, 0, 54, 0, //      10 s  quays, avenue and pyramid revealed
  700, 52, 55, 0, 60, 0,
  570, 46, 14, 0, 64, 0, //              over the great pylon (top ~36 m)
  440, 30, 0, 0, 68, 0,
  310, 22, 0, 0, 72, 0, //       20 s  along the avenue of sphinxes
  190, 34, 0, 0, 84, 0,
  110, 62, 35, 0, 100, 0,
  45, 108, 62, 0, 122, 0,
  -25, 124, 58, 0, 124, 0, //    30 s  around the pyramidion
  -64, 130, -5, -40, 100, -120,
  -110, 80, -95, -300, 14, -250,
  -190, 36, -190, -360, 10, -250,
  -290, 14, -250, -460, 12, -250, // 40 s  low along a canal, west
  -400, 17, -250, -700, 30, -200,
  -520, 36, -200, -1900, 120, -50,
  -640, 66, -120, -2000, 140, -20,
  -700, 100, -40, -2000, 150, 0, //  50 s  towards the desert cliffs, then back
  -640, 140, 40, -660, 60, 520,
  -540, 190, 120, 0, 40, 0,
  -420, 240, 200, 0, 35, 0,
  -300, 280, 270, 0, 30, 0, //     60 s  the whole city from over the desert's edge
]);
