// populating the world: temples, pylons, sphinxes, obelisks, villas, palms, gardens, papyrus, lilies, boats
// gH: land mesh height. hard (for collide.js): boxes [x0, z0, x1, z1, top] and bridges; wm: extra water surfaces
function populate({ type, put, paint, MAP, balRun, gH, hard, wm }) {
  const rngA = RNG(20261), rngB = RNG(90210); let rng = rngA; const rr = (a, b) => a + (b - a) * rng();
  // leaf tints are square roots (the shader squares them); alpha seeds the flower colour
  const TINT = { olive: [0.55, 0.59, 0.47], plane: [0.38, 0.49, 0.28], bloom: [0.4, 0.49, 0.3], shrub: [0.36, 0.47, 0.28], palm: [0.42, 0.53, 0.27], papyrus: [0.5, 0.62, 0.3], lily: [0.5, 0.66, 0.38] };
  const tintOf = (k, seed) => { const c = TINT[k], v = 0.78 + 0.34 * rng(), w = rng(); return rgb(c[0] * v * (0.92 + 0.22 * w), c[1] * v * (0.94 + 0.1 * rng()), c[2] * v * (1.12 - 0.25 * w), (seed & 255) / 255); };
  // crown reach at scale 1 per variant (the planting spacing)
  const CROWN = { olive: [5.09, 6.61], plane: [6.2, 7.05], bloom: [4.72, 5.05], palm: [5.2, 5.6] };
  const trees = {}, crowns = {}, TL = QL([0, 1, 2, 3], [0, 1, 2, 4], [1, 2, 3, 4]);
  const treeType = (k, v, gen, ...d) => { const t = type(TL.map(gen), K.LEAF, ...d); crowns[t] = CROWN[k][v]; return t; };
  for (const k of ['olive', 'plane', 'bloom']) trees[k] = [0, 1].map((v) => treeType(k, v, (l) => meshTree(k.length * 97 + v * 31 + 5, SPECIES[k], l), ...QL([85, 215, 3400, 0, 0, 330], [110, 280, 3400, 0, 0, 430], [90, 220, 3400, 1500, 0, 500])));
  trees.palm = [0, 1].map((v) => treeType('palm', v, (l) => meshPalm(11 + v * 7, l), ...QL([95, 240, 4000, 0, 0, 380], [120, 300, 4000, 0, 0, 470], [95, 230, 4000, 1500, 0, 520])));
  // crowns may overlap by `lap` of their radii at most
  const CELL = 12, planted = new Map(); let nTree = 0, nPalm = 0, nCityPalm = 0;
  const roomFor = (x, z, r, lap) => {
    const cx = floor(x / CELL), cz = floor(z / CELL), n = ceil((r + 14) * lap / CELL);
    for (let i = cx - n; i <= cx + n; i++) for (let j = cz - n; j <= cz + n; j++) { const c = planted.get(i * 8192 + j); if (c) for (let q = 0; q < c.length; q += 3) if ((x - c[q]) ** 2 + (z - c[q + 1]) ** 2 < ((r + c[q + 2]) * lap) ** 2) return false; }
    const key = cx * 8192 + cz, c = planted.get(key); if (c) c.push(x, z, r); else planted.set(key, [x, z, r]);
    return true;
  };
  // [x, z, radius] claimed by buildings
  const occ = [], free = (x, z, r) => { for (const o of occ) if ((x - o[0]) ** 2 + (z - o[1]) ** 2 < (r + o[2]) ** 2) return false; return true; };
  const tree = (k, x, y, z, s = 1, lap = 0.6, walls = true) => {
    const seed = (rng() * 256) | 0, ty = trees[k][seed & 1], sc = s * rr(0.85, 1.2), q = qYaw(rng() * TAU), tint = tintOf(k, seed), sy = rr(0.9, 1.15);
    if ((walls && !free(x, z, k === 'palm' ? 0.8 : crowns[ty] * sc * 0.45 - 1.2)) || !roomFor(x, z, crowns[ty] * sc * (k === 'palm' ? 0.55 : 1), lap)) return false;
    put(ty, x, y, z, sc, q, tint, sy); nTree++; if(k==='palm'){nPalm++;if(inCity(x,z))nCityPalm++;} return true;
  };
  const shrubDef = [[0.9, 0.8, LT.HYDRANGEA, 40, 0.34, { tile2: LT.BROAD, frac2: 0.5 }], [0.6, 0.55, LT.LAVENDER, 30, 0.34, { up: 1 }], [1.1, 0.9, LT.BLOSSOM, 44, 0.36, { tile2: LT.BROAD, frac2: 0.5 }], [1.0, 1.1, LT.BROAD, 30, 0.46, {}], [0.8, 0.5, LT.BLOSSOM, 30, 0.32, { tile2: LT.LAVENDER, frac2: 0.5 }]];
  const shrubs = shrubDef.map((d, i) => type([meshShrub(11 + i, d[0], d[1], d[2], d[3], d[4] * LEAFK, d[5]), meshShrub(11 + i, d[0], d[1], d[2], ceil(d[3] / 3), d[4] * 1.7 * LEAFK, d[5]), meshShrub(11 + i, d[0], d[1], d[2], 4, d[4] * 3.1 * LEAFK, d[5])], K.LEAF, 120, 290, 1400, 420));
  // flower seeds: jasmine white, blue lotus, bougainvillea magenta, mixed
  const SEEDS = [[4, 4, 3, 1], [2, 6], [0, 5, 5, 7], [4], [5, 4, 0, 0]];
  const shrub = (k, x, y, z, s = 1) => put(shrubs[k], x, y, z, s * rr(0.8, 1.3), qYaw(rng() * TAU), tintOf('shrub', SEEDS[k][(rng() * SEEDS[k].length) | 0]), rr(0.85, 1.2));
  const vines = [[2.8, 2.3, 36, 0.55], [2.8, 2.6, 40, 0.7], [2.6, 1.6, 30, 0.3]].map((d, i) => type([meshVine(71 + i, d[0], d[1], d[2], d[3]), meshVine(71 + i, d[0], d[1], ceil(d[2] / 3), d[3], 1.7), meshVine(71 + i, d[0], d[1], 7, d[3], 3.4)], K.LEAF, 140, 300, 1200, 400));
  // bougainvillea: magenta and rose seeds
  const vine = (x, y, z, yaw, k = (rng() * 3) | 0) => put(vines[k], x, y, z, rr(0.9, 1.25), qYaw(yaw), tintOf('shrub', [0, 5, 0, 7, 0][(rng() * 5) | 0]), rr(0.8, 1.3));
  const tPap = type([meshPapyrus(3, 0), meshPapyrus(3, 1), meshPapyrus(3, 2)], K.LEAF, 70, 200, 900), tLily = type([meshLotus(5)], K.LEAF, 1e9, 1e9, 350);
  const papyrus = (x, y, z) => put(tPap, x, y, z, rr(0.8, 1.3), qYaw(rng() * TAU), tintOf('papyrus', 0), rr(0.8, 1.2));
  const lily = (x, z) => put(tLily, x, WATER, z, rr(0.7, 1.4), qYaw(rng() * TAU), tintOf('lily', [4, 4, 3, 7][(rng() * 4) | 0]));
  const box = (x0, z0, x1, z1, top) => hard.boxes.push(min(x0, x1), min(z0, z1), max(x0, x1), max(z0, z1), top);
  // a box in an instance's own frame (yaw a, scale s at x, y, z) into the world
  const boxAt = (b, x, y, z, a, s = 1) => { const c = round(cos(a)), sn = round(sin(a)), P = (u, v) => [x + (u * c + v * sn) * s, z + (-u * sn + v * c) * s], p = P(b[0], b[1]), q = P(b[2], b[3]); box(p[0], p[1], q[0], q[1], y + b[4] * s); };
  const onBridge = (x, z, m = 2) => { const B = hard.bridges; for (let i = 0; i < B.length; i += 7) if (x > B[i] - m && x < B[i + 2] + m && z > B[i + 1] - m && z < B[i + 3] + m) return true; return false; };

  // monuments
  const tPylon = type([meshPylon(0), meshPylon(1)], K.SOLID, 400, 1e9, 1e9), tSphinx = type([meshSphinx(0), meshSphinx(1)], K.SOLID, 140, 1e9, 2500);
  const tObel = type([meshObelisk(0), meshObelisk(1)], K.SOLID, 300, 1e9, 1e9), tBasin = type([meshBasin()], K.SOLID, 1e9, 1e9, 400);
  const pylon = (x, y, z, a, s) => { put(tPylon, x, y, z, s, qYaw(a)); for (const sd of [-1, 1]) boxAt([-4.8, sd > 0 ? 6.5 : -28, 4.8, sd > 0 ? 28 : -6.5, 31.5], x, y, z, a, s); boxAt([-3.6, -6.5, 3.6, 6.5, 22], x, y, z, a, s); occ.push([x, z, 30 * s]); };
  const sphinx = (x, y, z, a) => { put(tSphinx, x, y, z, 1, qYaw(a)); boxAt([-3.85, -1.4, 3.85, 1.4, 4.9], x, y, z, a); occ.push([x, z, 3.8]); };
  const obelisk = (x, y, z, s) => { put(tObel, x, y, z, s, qYaw(0)); box(x - 2.8 * s, z - 2.8 * s, x + 2.8 * s, z + 2.8 * s, y + 47.5 * s); occ.push([x, z, 4 * s]); };
  // the acropolis: four obelisks in basins, the gate pylon, two colonnades
  const bm = new MB(1 << 12);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * 94, z = sz * 94;
    obelisk(x, T1.y, z, 1);
    for (const [a, b, c, d] of [[-6.6, -6.6, 6.6, -6], [-6.6, 6, 6.6, 6.6], [-6.6, -6, -6, 6], [6, -6, 6.6, 6]]) { bm.mat = M.TRIM; bm.box(x + a, T1.y, z + b, x + c, T1.y + 0.8, z + d, 0.04, false); }
    bm.mat = M.FLOOR; bm.box(x - 6, T1.y, z - 6, x + 6, T1.y + 0.1, z + 6);
    wm.fr = [x, 0, z, 1, 0, 1]; waterSq(wm, 2.85, 6, T1.y + 0.6, 1); wm.fr = null;
  }
  pylon(100, T1.y, 0, 0, 0.8);
  const tHallA = type([meshHall(12, 3, 6, 10, 0), meshHall(12, 3, 6, 10, 1), meshHall(12, 3, 6, 10, 2)], K.SOLID, 160, 500, 1e9);
  for (const sz of [-1, 1]) { put(tHallA, 0, T1.y, sz * 94, 1); box(-37, sz * 94 - 9, 37, sz * 94 + 9, T1.y + 13.5); occ.push([0, sz * 94, 30]); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const k of [0, 1]) tree('palm', sx * (52 + k * 12), T1.y, sz * 101, 0.9, 0.5, false);
  // the temples either side of the avenue, each behind a small pylon
  const tHallT = type([meshHall(8, 6, 7, 13, 0), meshHall(8, 6, 7, 13, 1), meshHall(8, 6, 7, 13, 2)], K.SOLID, 200, 600, 1e9);
  for (const sz of [-1, 1]) {
    put(tHallT, 191, LAND, sz * 64, 1); box(163, sz * 64 - 21, 219, sz * 64 + 21, LAND + 16.5); occ.push([191, sz * 64, 30]);
    pylon(191, LAND, sz * 36, sz * PI / 2, 0.5);
    for (const dx of [-30, 30]) for (const dz of [-14, 0, 14]) tree('palm', 191 + dx, LAND, sz * 64 + dz, 1, 0.5, false);
  }
  // the avenue: sphinxes facing it, a raised water channel either side, palms behind
  const rg = new MB(1 << 13);
  const runs = []; let r0 = null;
  for (let x = 128; x <= 580; x += 1) { const ok = !canalAt(x, 17) && edgeDist(x, 17) > 0.6 && !(x > 495 && x < 516) && !(x > 548 && x < 572); if (ok && r0 === null) r0 = x; if ((!ok || x === 580) && r0 !== null) { if (x - r0 > 6) runs.push([r0 + 0.5, x - 0.5]); r0 = null; } }
  for (const [a, b] of runs) for (const sz of [-1, 1]) {
    const zc = sz * 17;
    rg.mat = M.TRIM; rg.box(a, LAND - 0.1, zc - 0.95, b, LAND + 0.45, zc - 0.65, 0.03); rg.box(a, LAND - 0.1, zc + 0.65, b, LAND + 0.45, zc + 0.95, 0.03);
    rg.box(a - 0.3, LAND - 0.1, zc - 0.95, a, LAND + 0.45, zc + 0.95, 0.03); rg.box(b, LAND - 0.1, zc - 0.95, b + 0.3, LAND + 0.45, zc + 0.95, 0.03);
    rg.mat = M.FLOOR; rg.box(a, LAND - 0.05, zc - 0.65, b, LAND + 0.12, zc + 0.65);
    waterPoly(wm, rect(a, zc - 0.66, b, zc + 0.66), LAND + 0.36, 0);
  }
  for (let x = 146; x <= 578; x += 9) for (const sz of [-1, 1]) {
    const z = sz * 13.6; if (canalAt(x, z) || edgeDist(x, z) < 4.5 || onBridge(x, z, 3.5) || (x > 485 && x < 525) || (x > 552 && x < 568)) continue;
    sphinx(x, LAND, z, sz < 0 ? -PI / 2 : PI / 2);
  }
  for (let x = 150; x <= 530; x += 30) for (const sz of [-1, 1]) { const z = sz * 21; if (canalAt(x, z) || edgeDist(x, z) < 3 || onBridge(x, z, 3) || (x > 488 && x < 522)) continue; tree('palm', x + 4.5, inCity(x, z) ? LAND : gH(x + 4.5, z), z, 1.05, 0.4, false); }
  put(type([rg.build()], K.SOLID, 1e9, 1e9, 1500), 0, 0, 0);

  // the Nile front: plaza, stepped quays down to the water, the great pylon, two obelisks
  const qm = new MB(1 << 14);
  qm.mat = M.PAVE; qm.quad(qm.v(RB.out(0) + 0.66, LAND + 0.03, -24, 0, 1, 0), qm.v(QX0, LAND + 0.03, -24, 0, 1, 0), qm.v(QX0, LAND + 0.03, 24, 0, 1, 0), qm.v(RB.out(0) + 0.66, LAND + 0.03, 24, 0, 1, 0));
  const US = [0, 0.3, 0.5, 0.8, 1], QM = [M.STEP, M.PAVE, M.STEP, M.PAVE];
  for (let z = -QZ; z < QZ; z += 5) {
    const z1 = min(z + 5, QZ), X = (zz, u) => QX0 + (quayX(zz) - QX0) * u;
    for (let k = 0; k < 4; k++) {
      qm.mat = QM[k]; qm.eb = QM[k] === M.STEP ? 255 : 0;
      const ya = quayY(X(z, US[k]) + 1e-3, z), yb = quayY(X(z, US[k + 1]) - 1e-3, z);
      qm.quad(qm.v(X(z, US[k]), ya, z, 0, 1, 0), qm.v(X(z, US[k + 1]), yb, z, 0, 1, 0), qm.v(X(z1, US[k + 1]), yb, z1, 0, 1, 0), qm.v(X(z1, US[k]), ya, z1, 0, 1, 0));
    }
    qm.eb = 0; qm.mat = M.QUAY; const xe = X(z, 1), xf = X(z1, 1); qm.quad(qm.v(xe, 0.9, z, 1, 0, 0), qm.v(xf, 0.9, z1, 1, 0, 0), qm.v(xf, -4, z1, 1, 0, 0, 0.6), qm.v(xe, -4, z, 1, 0, 0, 0.6));
  }
  for (const sz of [-1, 1]) { const z = sz * QZ, pts = [[QX0, LAND + 0.02], ...US.slice(1).map((u) => [QX0 + (quayX(z) - QX0) * u, quayY(QX0 + (quayX(z) - QX0) * u - 1e-3, z)])]; qm.mat = M.QUAY; for (let i = 0; i < pts.length - 1; i++) qm.quad(qm.v(pts[i][0], pts[i][1], z, 0, 0, sz), qm.v(pts[i + 1][0], pts[i + 1][1], z, 0, 0, sz), qm.v(pts[i + 1][0], -4, z, 0, 0, sz, 0.6), qm.v(pts[i][0], -4, z, 0, 0, sz, 0.6)); }
  // A small landing on the opposite bank lets P6 see quays and the south-west sun across the Nile.
  const ex=EAST_QUAY[0];
  prism(qm,rect(ex-21,-250,ex+24,-190),-3,3.6,M.QUAY,M.PAVE,.55);
  box(ex-21,-250,ex+24,-190,3.6);
  for(const [a,b]of [[[ex-21,-250],[ex+24,-250]],[[ex-21,-190],[ex+24,-190]]])coping(qm,a,b,3.6);
  put(type([qm.build()], K.SOLID), 0, 0, 0);
  pylon(505, LAND, 0, 0, 1.1);
  const tPort = type([meshHall(9, 1, 7, 9, 0), meshHall(9, 1, 7, 9, 1), meshHall(9, 1, 7, 9, 2)], K.SOLID, 200, 600, 1e9);
  for (const sz of [-1, 1]) { const zc = sz * 68; put(tPort, QX0 - 7, LAND, zc, 1, qYaw(PI / 2)); box(QX0 - 12, zc - 31, QX0 - 2, zc + 31, LAND + 12); occ.push([QX0 - 7, zc, 32]); }
  obelisk(560, LAND, -40, 0.55); obelisk(560, LAND, 40, 0.55);
  const landingHall=type([meshHall(5,1,6,7,0),meshHall(5,1,6,7,1),meshHall(5,1,6,7,2)],K.SOLID,150,450,1800);
  put(landingHall,601,6.2,-68,1,qYaw(PI/2));
  put(landingHall,ex-14,3.6,-213,1,qYaw(PI/2));
  for(let z=-225;z<=-201;z+=6)box(ex-14.9,z-.9,ex-13.1,z+.9,10.6);
  for(let z=-80;z<=-56;z+=6)box(600.1,z-.9,601.9,z+.9,13.2);
  for (let x = 480; x < QX0 - 6; x += 11) for (let z = -QZ + 6; z <= QZ - 6; z += 11) if (abs(z) > 30 && !(abs(z - 44) < 6 || abs(z + 44) < 6) && rng() < 0.6) tree('palm', x + rr(-2, 2), LAND, z + rr(-2, 2), 1, 0.4, false);
  for (let x = 480; x < QX0 - 4; x += 3) for (const sz of [-1, 1]) if (rng() < 0.3) shrub((rng() * 5) | 0, x, LAND, sz * rr(27, 60), 1.1);

  // garden quarter: villas on a loose grid, gardens, trees along the quays
  // Landmark plazas stay clear of housing and trees.
  const tSanct = type([meshHall(5,4,7,15,0),meshHall(5,4,7,15,1),meshHall(5,4,7,15,2)],K.SOLID,200,600,1e9);
  for(const [x,z,y,s] of [[-207,-191,22,1],[-200,36,16,.8],[190,203,16,.8]]) {
    put(tSanct,x,y,z,s); box(x-18*s,z-15*s,x+18*s,z+15*s,y+18.3*s); occ.push([x,z,32*s]);
    pylon(x+23*s,y,z,0,.62*s);
    for(const sd of [-1,1]) obelisk(x+25*s,y,z+sd*24*s,.58*s);
    paint(x,z,42*s,0,255,2);
  }
  const VAR = 20, villas = [];
  const nearHall=type([meshHall(5,1,6,8,0),meshHall(5,1,6,8,1),meshHall(5,1,6,8,2)],K.SOLID,150,500,2200);
  put(nearHall,333,LAND,151);box(318,145,348,157,LAND+11.3);occ.push([333,151,21]);
  const lionSpout=type([meshLionSpout()],K.SOLID,1e9,1e9,1200),basinFlow=type([meshFountainFlow()],K.CASCADE,1e9,1e9,400);
  for(const [x0,x1,z,y]of BIEFS) {
    bm.mat=M.FLOOR;bm.box(x0,y-.1,z-7,x1,y+.12,z,.02);
    bm.mat=M.SANDST;bm.box(x0-.5,y,z-7.5,x1+.5,y+1,z-7,.05);
    bm.box(x0-.5,y,z-7,x0,y+1,z,.05);bm.box(x1,y,z-7,x1+.5,y+1,z,.05);
    bandRect(bm,x0-.5,z-7.5,x1+.5,z,y+.15,y+.6,PC.CARN,true,.03);
    waterPoly(wm,rect(x0,z-7,x1,z),y+.64,0);
    box(x0-.5,z-7.5,x1+.5,z-7,y+1);box(x0-.5,z-7,x0,z,y+1);box(x1,z-7,x1+.5,z,y+1);
    for(let x=x0+5;x<x1-3;x+=14){put(lionSpout,x,y-.8,z-.82);box(x-.85,z-1.4,x+.85,z+.12,y+1.9);}
    occ.push([(x0+x1)/2,z-3,(x1-x0)/2+3]);
  }
  const civic=[0,1].map(k=>{const a=meshPublic(k,0),b=meshPublic(k,1);return {ty:type([a.mesh,b.mesh],K.SOLID,180,1e9,2600),boxes:a.boxes};});
  for(const [x,z,k] of [[-355,-190,0],[-355,55,1],[-45,190,0],[55,-192,1],[205,320,1],[325,-210,0]]) {
    if(canalAt(x,z) || edgeDist(x,z)<12 || !free(x,z,15)) continue;
    const y=cityH(x,z); put(civic[k].ty,x,y,z);
    for(const b of civic[k].boxes) boxAt(b,x,y,z,0);
    occ.push([x,z,15]); paint(x,z,12,0,255,2);
  }
  for (let v = 0; v < VAR; v++) { const L = [0, 1, 2].map((l) => meshVillaE(v + 1, l)); villas.push({ ty: type(L.map((o) => o.mesh), K.SOLID, 90, 260, 2600), boxes: L[0].boxes }); }
  const VT = [[1,.8,.52],[.98,.86,.64],[.96,.92,.82],[1,.66,.43],[.86,.64,.45],[.97,.88,.72],[.8,.85,.76],[.92,.72,.65]];
  const gar = ringPoly(RB.gar), garden = [];
  for (const b of BLOCKS) {
    const poly = clipPoly(rect(b[0], b[1], b[2], b[3]), gar); if (poly.length < 3 || polyArea(poly) < 400) continue;
    const cx = (b[0] + b[2]) / 2, cz = (b[1] + b[3]) / 2;
    if (abs(cx) < ACRO && abs(cz) < ACRO) continue;
    garden.push(poly);
    if (cx > TEMPLE[0] && cx < TEMPLE[1] && abs(cz) < ACRO) continue;
  }
    for (let x = -430; x < 430; x += 23) for (let z = -360; z < 360; z += 25) {
      const px = x + rr(-5, 5), pz = z + rr(-5, 5), v = (rng() * VAR) | 0, a = ((rng() * 4) | 0) * PI / 2, tint = VT[(rng() * VT.length) | 0], y=cityH(px,pz);
      if (!inCity(px, pz) || edgeDist(px, pz) < 15 || abs(pz) < AVE + 22 || abs(px) < AVE + 16 || (abs(px)<ACRO+12 && abs(pz)<ACRO+12) || !free(px, pz, 13)) continue;
      if(abs(cityH(px-12,pz)-y)>.1 || abs(cityH(px+12,pz)-y)>.1 || abs(cityH(px,pz-12)-y)>.1 || abs(cityH(px,pz+12)-y)>.1) continue;
      put(villas[v].ty, px, y, pz, 1, qYaw(a), rgb(tint[0], tint[1], tint[2]));
      for (const bx of villas[v].boxes) boxAt(bx, px, y, pz, a);
      occ.push([px, pz, 10]);
      paint(px, pz, 7, 0, 150, 3); // a paved yard round the house
      // Continuous low beds and trellises replace empty lawn between separate houses.
      for(let j=0;j<7;j++) {
        const sx=px-7+j*2.1,sz=pz-9;
        if(edgeDist(sx,sz)>2 && abs(cityH(sx,sz)-y)<.1) {shrub(j%3===0?0:2,sx,y,sz,1.2);paint(sx,sz,1.8,1,255,.8);}
      }
      if(rng()<.55) tree(rng()<.5?'bloom':'olive',px-9,y,pz+8,.7,.75,false);
      // bougainvillea over a wall, a tree or two in the garden
      if (rng() < 0.7) { const f = (rng() * 4) | 0, ang = a + f * PI / 2, nx = round(cos(ang)), nz = -round(sin(ang)); vine(px + nx * 4.6, y + 4.2, pz + nz * 4.6, atan2(nx, nz)); }
    }
  // lotus basins with water, on the temple blocks and in the gardens
  const basin = (x, z, y = cityH(x,z)) => { put(tBasin, x, y, z, 1.3, qYaw(rng() * TAU)); put(basinFlow,x,y,z,1.3); const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; pts.push([x + 1.62 * cos(a), z + 1.62 * sin(a)]); } waterPoly(wm, pts, y + 1.3 * 1.62, 1); occ.push([x, z, 2.2]); box(x - 1.8, z - 1.8, x + 1.8, z + 1.8, y + 2.3); };
  for (const sz of [-1, 1]) for (const x of [150, 232]) basin(x, sz * 28);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) basin(sx * 80, sz * 101, T1.y);
  for (let i = 0; i < 40; i++) { const x = rr(-430, 430), z = rr(-360, 360); if (inCity(x, z) && edgeDist(x, z) > 6 && abs(z) > AVE + 8 && abs(x) > AVE + 8 && !(abs(x) < ACRO + 4 && abs(z) < ACRO + 4) && free(x, z, 6)) { basin(x, z); paint(x, z, 5, 0, 230, 1.5); } }
  // garden planting: palms, sycamores, flowering trees, shrubs; paths
  for (const poly of garden) {
    let bx0 = 1e9, bz0 = 1e9, bx1 = -1e9, bz1 = -1e9; for (const p of poly) { bx0 = min(bx0, p[0]); bz0 = min(bz0, p[1]); bx1 = max(bx1, p[0]); bz1 = max(bz1, p[1]); }
    const n = polyArea(poly) / 115;
    for (let i = 0; i < n; i++) {
      const x = rr(bx0, bx1), z = rr(bz0, bz1), k = rng();
      if (!inCity(x, z) || edgeDist(x, z) < 2.5 || abs(z) < AVE + 4 || abs(x) < AVE + 2 || (abs(x) < ACRO + 4 && abs(z) < ACRO + 4)) continue;
      if (cityH(x,z)>LAND || !free(x,z,5)) continue;
      if (k < 0.035) tree('palm', x, cityH(x,z), z, rr(0.8, 1.25), 0.6);
      else if (k < 0.13) tree('plane', x, cityH(x,z), z, 0.8, 0.8);
      else if (k < 0.22) tree('olive', x, cityH(x,z), z, .9, 0.8);
      else if (k < 0.36) tree('bloom', x, cityH(x,z), z, .85, 0.8);
      else if (free(x, z, 1.5)) { shrub((rng() * 5) | 0, x, cityH(x,z), z, 1.5); paint(x, z, 2.2, 1, 255, 1.5); }
    }
    // palms along the quays
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = hypot(b[0] - a[0], b[1] - a[1]), nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L;
      for (let u = 4; u < L - 4; u += rr(8, 12)) { const x = a[0] + (b[0] - a[0]) * u / L - nx * 3.6, z = a[1] + (b[1] - a[1]) * u / L - nz * 3.6; if (onBridge(x, z, 5) || abs(z) < AVE + 4 || abs(x) < AVE + 2) continue; if (!canalAt(x+nx*4,z+nz*4) || cityH(x,z)>LAND) continue; if (rng() < 0.08) tree('palm', x, cityH(x,z), z, rr(0.8, 1.2), 0.6); else if (rng() < 0.6) { shrub((rng() * 5) | 0, x, cityH(x,z), z, 1.5); if(rng()<.5) vine(x+nx*3.5,cityH(x,z)-.6,z+nz*3.5,atan2(nx,nz),0); } }
    }
  }
  // the water: lilies near the quays, papyrus at the edges
  for (let i = 0; i < 2600; i++) {
    const t = rng() * TAU, r = sqrt(rng()) * CITY_A, x = r * cos(t), z = r * sin(t) * CITY_B / CITY_A;
    if (!canalAt(x, z) || onBridge(x, z, 3)) continue;
    const e = -edgeDist(x, z); if (e < 0.6 || e > 3.5) continue;
    if (rng() < 0.65) lily(x, z); else if (rng() < 0.5) papyrus(x, WATER - 0.3, z);
  }
  // pools of lilies round the pyramid
  for (let i = 0; i < 70; i++) { const s = (rng() * 4) | 0, u = rr(-68, 68), o = rr(64.5, 69.5), x = [o, u, -o, u][s], z = [u, o, u, -o][s]; if (s === 0 && abs(u) < 8) continue; put(tLily, x, T2.wy, z, rr(0.6, 1.1), qYaw(rng() * TAU), tintOf('lily', [3, 4][(rng() * 2) | 0])); }
  put(type([bm.build()], K.SOLID), 0, 0, 0);

  // outside the city: the Nile's banks, palm groves, fields, the oasis, boats
  rng = rngB;
  for (let z = -2600; z <= 2600; z += rr(5, 9)) for (const side of [0, 1]) {
    const xb = side ? nileX(z) + NILE_W : nileX(z), sg = side ? 1 : -1;
    if (!side && abs(z) < QZ + 30) continue;
    const xp = xb + sg * rr(1, 6), yp = gH(xp, z); if (yp > -0.6 && yp < 3) papyrus(xp, yp - 0.2, z);
    if (rng() < 0.55) { const xt = xb + sg * rr(14, 40), y = gH(xt, z); if (y > 0.5 && !inCity(xt, z)) tree('palm', xt, y, z, rr(0.9, 1.25), 0.45, false); }
  }
  // palm groves in the wooded parts of the farmland, and palms along the field edges
  for (let x = -760; x <= 2200; x += 14) for (let z = -1500; z <= 1500; z += 14) {
    const px = x + rr(-3, 3), pz = z + rr(-3, 3); if (inCity(px, pz) || nileD(px, pz) < 12 || desertK(px, pz) > 0.25 || hypot(px, pz) - RB.out(atan2(pz, px)) < 30) continue;
    const grove = woodAt(px, pz) > 0.6, d = hypot(px, pz);
    if (grove ? rng() < 0.48 : rng() < 0.04 * (1 - sstep(900, 1500, d))) tree('palm', px, gH(px, pz), pz, rr(0.85, 1.2), 0.5, false);
  }
  // Rock lip connected to the cliff spur; the falling sheet starts at its outer edge.
  const spring=new MB(512),sf=OASIS_FALL,sz=OASIS[1];
  prism(spring,rect(sf.x-42,sz-8,sf.x,sz+8),sf.y-3,sf.y,M.ROCK,M.FLOOR,.65);
  put(type([spring.build()],K.SOLID),0,0,0);box(sf.x-42,sz-8,sf.x,sz+8,sf.y);
  waterPoly(wm,rect(sf.x-42,sz-7,sf.x,sz+7),sf.y+.15,0);
  // the oasis at the cliff's foot: a pool ringed by palms
  { const pts = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; pts.push([OASIS[0] + 72 * cos(a), OASIS[1] + 72 * sin(a)]); } waterPoly(wm, pts, 2.6, 0);
    for (let i = 0; i < 150; i++) { const a = rng() * TAU, r = rr(58, 125), x = OASIS[0] + r * cos(a), z = OASIS[1] + r * sin(a), y=gH(x,z); if(y>3 && y<14 && abs(gH(x+3,z)-gH(x-3,z))<3 && abs(gH(x,z+3)-gH(x,z-3))<3) tree('palm', x, y, z, rr(.8, 1.3), .55, false); }
    for (let i = 0; i < 40; i++) { const a = rng() * TAU, x = OASIS[0] + rr(56, 61) * cos(a), z = OASIS[1] + rr(56, 61) * sin(a); papyrus(x, gH(x, z) - 0.2, z); } }
  // feluccas on the Nile and the ring canal
  const tBoat = type([meshFelucca()], K.SOLID, 1e9, 1e9, 4000);
  put(tBoat,EAST_QUAY[0]-75,.05,-165,1,qYaw(-PI/2));
  for (let i = 0; i < 16; i++) { const z = rr(-1800, 1800), x = nileX(z) + rr(70, NILE_W - 70); put(tBoat, x, 0.05, z, 1, qYaw((rng() < 0.5 ? 1 : -1) * PI / 2 + rr(-0.35, 0.35))); }
  for (let i = 0; i < 6; i++) { const t = rr(0, TAU), r = (RB.gar(t) + RB.out(t)) / 2, x = r * cos(t), z = r * sin(t); if (onBridge(x, z, 12)) continue; put(tBoat, x, WATER + 0.02, z, 0.8, qYaw(-t + PI / 2 * (rng() < 0.5 ? 1 : -1))); }
  if (AUTO) {window.__planting={trees:nTree,palms:nPalm,palmsInCity:nCityPalm};console.log(`${nTree} trees, ${nCityPalm} city palms, ${hard.boxes.length / 5} solid boxes`);}
}
