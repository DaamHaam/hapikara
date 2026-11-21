// Egyptian generators: palms, papyrus, lotus; pylons, sphinxes, obelisks, hypostyle halls, villas, feluccas
// all built along +x (the front) at the origin; world.js and city.js place and turn them

// palm: ringed trunk with a gentle lean, a crown of feathered fronds arching out and down (leaf tile PALM)
function meshPalm(seed, lod) {
  const mb = new MB(4096), rng = RNG(seed * 131 + 7), H = 11 + rng() * 6, lx = (rng() - 0.5) * 0.3, lz = (rng() - 0.5) * 0.3;
  const N = [9, 6, 4, 2, 1][lod], pts = [];
  for (let i = 0; i <= N; i++) { const t = i / N; pts.push([lx * H * t * t, -0.4 + (H + 0.4) * t, lz * H * t * t, 0.3 * (1 - 0.3 * t) + (i === 0 ? 0.1 : 0)]); }
  mb.mat = M.BARK; mb.tube(pts, [8, 6, 5, 4, 3][lod], false);
  const top = pts[N];
  const nF = [24, 15, 10, 7, 5][lod], S = [7, 4, 3, 2, 1][lod], wk = [1, 1.25, 1.5, 1.9, 2.4][lod] * LEAFK;
  for (let f = 0; f < nF; f++) {
    const r = [rng(), rng(), rng(), rng()], az = f / nF * TAU * 2.618 + r[0] * 0.4, el = (62 - 100 * pow(r[1], 0.75)) * DEG, len = (4.3 + 1.3 * r[2]) * (el > 0.6 ? 0.8 : 1);
    let d = [cos(el) * cos(az), sin(el), cos(el) * sin(az)], p = [top[0] + d[0] * 0.3, top[1] + 0.25, top[2] + d[2] * 0.3];
    const side = vnorm([-sin(az), 0, cos(az)]), roll = (r[3] - 0.5) * 0.7;
    for (let i = 0; i < S; i++) {
      const t = (i + 0.5) / S, sl = len / S;
      // the rachis bends down more towards its tip
      d = vnorm([d[0], d[1] - 0.55 * sl / len * (1 + t), d[2]]);
      const c = [p[0] + d[0] * sl / 2, p[1] + d[1] * sl / 2, p[2] + d[2] * sl / 2];
      // two cards crossed along the rachis, each leaning down: the leaflets hang in a shallow V
      const wid = 0.95 * sin(PI * (0.12 + 0.82 * t)) * wk, sp = vnorm(vcross(d, [0, 1, 0])), up = vcross(sp, d);
      const N0 = vnorm([c[0] - top[0], c[1] - top[1] + 1.2, c[2] - top[2]]), ec = rng() * 255 | 0;
      for (const rl of lod < 2 ? [-0.5, 0.5] : [0]) {
        const a = rl + roll * 0.4 - (lod < 2 ? 0 : 0.2), sx = [sp[0] * cos(a) + up[0] * sin(a), sp[1] * cos(a) + up[1] * sin(a) - 0.18, sp[2] * cos(a) + up[2] * sin(a)];
        mb.mat = M.LEAF + LT.PALM; mb.ec = ec;
        mb.card(c, [sx[0] * wid, sx[1] * wid, sx[2] * wid], [d[0] * sl * 0.56, d[1] * sl * 0.56, d[2] * sl * 0.56], N0, (0.55 + 0.45 * t) * (rl < 0 ? 0.85 : 1));
      }
      p = [p[0] + d[0] * sl, p[1] + d[1] * sl, p[2] + d[2] * sl];
    }
  }
  return mb.build();
}
// papyrus clump: thin upright stems, each with a fan umbel
function meshPapyrus(seed, lod) {
  const mb = new MB(1024), rng = RNG(seed * 17 + 3), n = [26, 12, 5][lod], k = [1, 1.5, 2.4][lod];
  for (let i = 0; i < n; i++) {
    const a = rng() * TAU, rr = 0.7 * sqrt(rng()), x = rr * cos(a), z = rr * sin(a), h = 1.4 + rng() * 1.6, lean = 0.15 * rng(), la = rng() * TAU;
    const tx = x + cos(la) * lean * h, tz = z + sin(la) * lean * h, ya = rng() * PI;
    mb.mat = M.LEAF + LT.PALM; mb.ec = rng() * 255 | 0;
    mb.card([(x + tx) / 2, h / 2 - 0.1, (z + tz) / 2], [cos(ya) * 0.035 * k, 0, sin(ya) * 0.035 * k], [(tx - x) / 2, h / 2, (tz - z) / 2], [cos(a), 0.4, sin(a)], 0.6);
    // umbel: a tilted fan
    const s = (0.32 + 0.12 * rng()) * k, u = vnorm([cos(la) * 0.5, 1, sin(la) * 0.5]), rt = vnorm(vcross(u, [cos(ya), 0, sin(ya)]));
    mb.mat = M.LEAF + LT.PINE; mb.ec = rng() * 255 | 0;
    mb.card([tx, h + 0.05, tz], [rt[0] * s, rt[1] * s, rt[2] * s], vcross(rt, u).map((v) => v * s), u, 0.95);
  }
  return mb.build();
}
// water lilies: pads (and a few flowers) floating flat, ~3 m across
function meshLotus(seed) {
  const mb = new MB(256), rng = RNG(seed * 29 + 1);
  for (let i = 0; i < 5; i++) {
    const a = rng() * TAU, r = 1.3 * sqrt(rng()), s = 0.7 + 0.4 * rng(), b = rng() * TAU;
    mb.mat = M.LEAF + LT.LILY; mb.ec = rng() * 255 | 0;
    mb.card([r * cos(a), 0.02 + i * 0.004, r * sin(a)], [cos(b) * s, 0, sin(b) * s], [-sin(b) * s, 0, cos(b) * s], [0, 1, 0], 1);
  }
  return mb.build();
}

// building helpers
// band round a ring of profile segments [[out, y], ...] about the rectangle x0..x1, z0..z1 (mitred corners)
function ringProf(mb, x0, z0, x1, z1, prof, mat) {
  mb.mat = mat;
  for (let i = 0; i < prof.length - 1; i++) {
    const [o0, y0] = prof[i], [o1, y1] = prof[i + 1], dl = hypot(o1 - o0, y1 - y0) || 1, nu = (y1 - y0) / dl, ny = -(o1 - o0) / dl;
    const C = (o) => [[x0 - o, z0 - o], [x1 + o, z0 - o], [x1 + o, z1 + o], [x0 - o, z1 + o]], A = C(o0), B = C(o1), NS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (let s = 0; s < 4; s++) { const n = NS[s], s1 = (s + 1) % 4; mb.quad(mb.v(A[s][0], y0, A[s][1], n[0] * nu, ny, n[1] * nu), mb.v(A[s1][0], y0, A[s1][1], n[0] * nu, ny, n[1] * nu), mb.v(B[s1][0], y1, B[s1][1], n[0] * nu, ny, n[1] * nu), mb.v(B[s][0], y1, B[s][1], n[0] * nu, ny, n[1] * nu)); }
  }
}
// Egyptian cornice on a rectangle at height y: torus roll, cavetto flaring out, flat top
function cornice(mb, x0, z0, x1, z1, y, f = 0.6, h = 0.9, mat = M.SANDST) {
  ringProf(mb, x0, z0, x1, z1, [[0, y - 0.3], [0.1, y - 0.25], [0.12, y - 0.1], [0.06, y], [0.12 * f, y + 0.25 * h], [0.4 * f, y + 0.6 * h], [f, y + 0.9 * h], [f, y + h]], mat);
  mb.mat = mat; mb.poly([[x0 - f, y + h, z0 - f], [x1 + f, y + h, z0 - f], [x1 + f, y + h, z1 + f], [x0 - f, y + h, z1 + f]], [0, 1, 0]);
}
// battered block: rectangle at the foot, drawn in by `inset` at the top
function battered(mb, x0, z0, x1, z1, y0, y1, inset, mat) { ringProf(mb, x0 + inset, z0 + inset, x1 - inset, z1 - inset, [[inset, y0], [0, y1]], mat); }
// painted band round a rectangle, frieze (symbols) or plain, with gold edges
function bandRect(mb, x0, z0, x1, z1, y0, y1, col, frieze, out = 0.04) {
  mb.mat = M.PAINT; mb.ea = col; mb.eb = frieze ? 255 : 0;
  const NS = [[0, -1], [1, 0], [0, 1], [-1, 0]], C = [[x0 - out, z0 - out], [x1 + out, z0 - out], [x1 + out, z1 + out], [x0 - out, z1 + out]];
  for (let s = 0; s < 4; s++) { const a = C[s], b = C[(s + 1) % 4], n = NS[s]; mb.ec = 0; const i0 = mb.v(a[0], y0, a[1], n[0], 0, n[1]), i1 = mb.v(b[0], y0, b[1], n[0], 0, n[1]); mb.ec = 255; mb.quad(i0, i1, mb.v(b[0], y1, b[1], n[0], 0, n[1]), mb.v(a[0], y1, a[1], n[0], 0, n[1])); }
  mb.ea = mb.eb = mb.ec = 0;
  if (frieze) for (const y of [y0 - 0.1, y1]) ringProf(mb, x0 - out - 0.02, z0 - out - 0.02, x1 + out + 0.02, z1 + out + 0.02, [[0, y], [0, y + 0.1]], M.GOLD);
}
// window: a dark pane in a stone frame on the face with outward normal (nx, nz) through (x, z), centred at u along it
function windowAt(mb, x, z, nx, nz, u, y0, w, h) {
  const tx = -nz, tz = nx, P = (a, y, o) => mb.v(x + tx * (u + a) + nx * o, y, z + tz * (u + a) + nz * o, nx, 0, nz);
  mb.mat = M.WINDOW; mb.quad(P(-w / 2, y0, 0.03), P(w / 2, y0, 0.03), P(w / 2, y0 + h, 0.03), P(-w / 2, y0 + h, 0.03));
  // lattice bars and a sill
  mb.mat = M.TRIM; for (let i = 1; i < 3; i++) { const a = -w / 2 + w * i / 3; mb.quad(P(a - 0.03, y0, 0.05), P(a + 0.03, y0, 0.05), P(a + 0.03, y0 + h, 0.05), P(a - 0.03, y0 + h, 0.05)); }
  mb.quad(P(-w / 2 - 0.12, y0 - 0.12, 0.1), P(w / 2 + 0.12, y0 - 0.12, 0.1), P(w / 2 + 0.12, y0, 0.1), P(-w / 2 - 0.12, y0, 0.1));
}

// pylon: two battered towers either side of a gate, cavetto cornices, winged sun over the lintel, flagpoles with
// linen banners. Front +x, gate on z = 0, 30 m tall, 60 m wide.
function meshPylon(lod) {
  const mb = new MB(1 << 14), T = 30, G = 6.5;
  for (const sd of [-1, 1]) {
    const z0 = sd > 0 ? G : -28, z1 = sd > 0 ? 28 : -G;
    battered(mb, -4.8, z0, 4.8, z1, 0, T, 1.6, M.SANDST);
    cornice(mb, -3.2, z0 + 1.6, 3.2, z1 - 1.6, T, 0.9, 1.4);
    bandRect(mb, -3.6, z0 + 1.2, 3.6, z1 - 1.2, T - 4.2, T - 1.2, PC.LAPIS, true, 0.02);
    // banner poles in front of the towers
    for (const zc of [sd * 11, sd * 22]) {
      mb.mat = M.TRIM; mb.tube([[5.6, 0, zc, 0.22], [5.6, T + 6, zc, 0.15]], lod ? 4 : 6, false);
      mb.mat = M.GOLD; mb.lathe([[0.25, T + 6], [0, T + 7.2]], { seg: 6, cx: 5.6, cz: zc });
      mb.mat = M.PAINT; mb.ea = PC.LINEN; mb.box(5.85, T - 9, zc - 1, 5.95, T + 4.5, zc + 1, 0); mb.ea = 0;
    }
  }
  // the gate: jambs and lintel, a painted portal
  mb.mat = M.SANDST; mb.box(-3.6, 0, -G, 3.6, 21, -3.2, 0.05); mb.box(-3.6, 0, 3.2, 3.6, 21, G, 0.05); mb.box(-3.6, 15.5, -3.2, 3.6, 21, 3.2, 0.05);
  cornice(mb, -3.6, -G, 3.6, G, 21, 0.6, 0.9);
  // winged sun disc
  mb.mat = M.GOLD; mb.lathe([[0.01, -1], [0.7, -0.75], [1, 0], [0.7, 0.75], [0.01, 1]].map(([r, y]) => [r, 18.2 + y]), { seg: 12, cx: 3.65 });
  for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { mb.mat = M.PAINT; mb.ea = [PC.LAPIS, PC.TURQ, PC.CARN, PC.LAPIS][i]; const y = 18.6 - i * 0.32, z0 = sd * 1.1, z1 = sd * (5.6 - i * 0.6); mb.box(3.62, y - 0.28, min(z0, z1), 3.72, y, max(z0, z1), 0); }
  mb.ea = 0;
  return mb.build();
}
// recumbent sphinx on a painted plinth, facing +x, ~7.5 m long
function meshSphinx(lod) {
  const mb = new MB(4096), b = lod ? 0 : 1;
  mb.mat = M.SANDST; mb.box(-3.7, 0, -1.25, 3.7, 1.7, 1.25, 0.06 * b, false);
  mb.box(-3.85, 1.5, -1.4, 3.85, 1.75, 1.4, 0.05 * b);
  if (!lod) bandRect(mb, -3.7, -1.25, 3.7, 1.25, 0.35, 1.25, PC.LAPIS, true, 0.02);
  mb.mat = M.SANDST; const y = 1.75;
  mb.box(-3.1, y, -0.85, -1.5, y + 1.55, 0.85, 0.45 * b); // haunches
  mb.box(-2.6, y, -0.78, 1.0, y + 1.3, 0.78, 0.35 * b); // body
  mb.box(0.55, y, -0.74, 1.75, y + 2.0, 0.74, 0.3 * b); // chest
  for (const sd of [-1, 1]) mb.box(0.9, y, sd * 0.2, 3.35, y + 0.45, sd * 0.72, 0.15 * b); // forelegs
  for (const sd of [-1, 1]) mb.box(-2.9, y, sd * 0.55, -1.3, y + 0.35, sd * 1.0, 0.12 * b); // hind legs
  mb.box(1.15, y + 1.85, -0.42, 2.0, y + 2.85, 0.42, 0.2 * b); // head
  if (!lod) { mb.box(1.98, y + 2.15, -0.09, 2.12, y + 2.5, 0.09, 0.04); mb.box(1.85, y + 1.45, -0.13, 2.05, y + 1.9, 0.13, 0.05); mb.mat = M.GOLD; mb.box(1.9, y + 2.85, -0.07, 2.08, y + 3.2, 0.07, 0.03); mb.mat = M.SANDST; } // nose, beard, uraeus
  // nemes: headcloth and lappets, striped lapis and gold
  mb.mat = M.PAINT; mb.ea = PC.LAPIS;
  mb.box(0.95, y + 2.6, -0.56, 1.85, y + 3.05, 0.56, 0.18 * b);
  for (const sd of [-1, 1]) mb.box(1.05, y + 1.2, sd * 0.42, 1.75, y + 2.75, sd * 0.78, 0.08 * b);
  mb.ea = 0;
  if (!lod) { mb.mat = M.GOLD; for (const yy of [y + 1.55, y + 1.95, y + 2.35]) for (const sd of [-1, 1]) mb.box(1.04, yy, sd * 0.41, 1.76, yy + 0.1, sd * 0.79, 0); mb.box(1.0, y + 2.6, -0.57, 1.86, y + 2.68, 0.57, 0); }
  mb.mat = M.SANDST; if (!lod) mb.tube([[-3.0, y + 0.3, 0.9, 0.12], [-1.5, y + 0.15, 1.05, 0.1], [0, y + 0.1, 0.95, 0.08]], 5);
  return mb.build();
}
// obelisk: pink granite on a painted pedestal, gold point, 47 m
const OBE = { h0: 1.6, base: 1.65, top: 1.05, H: 44 };
function meshObelisk(lod) {
  const mb = new MB(1024);
  mb.mat = M.SANDST; mb.box(-2.8, 0, -2.8, 2.8, OBE.h0, 2.8, 0.05, false);
  bandRect(mb, -2.8, -2.8, 2.8, 2.8, 0.3, 1.25, PC.LAPIS, !lod, 0.02);
  battered(mb, -OBE.base, -OBE.base, OBE.base, OBE.base, OBE.h0, OBE.H, OBE.base - OBE.top, M.GRANITE);
  mb.mat = M.GOLD; mb.lathe([[OBE.top * SQRT2, OBE.H], [0, OBE.H + 3.4]], { seg: 4, flat: true, a0: PI / 4, a1: PI / 4 + TAU });
  return mb.build();
}
// papyrus column: base, swelling shaft, painted bands, open bell capital, abacus; H to the top of the abacus
function column(mb, x, z, H, R, lod, cols) {
  const seg = [14, 8, 6][lod], o = { seg, cx: x, cz: z };
  mb.mat = M.SANDST; mb.lathe([[R * 1.35, 0], [R * 1.35, 0.35], [R * 1.2, 0.45], [R, 0.45], [R * 1.08, H * 0.25], [R * 1.02, H * 0.55], [R * 0.86, H - 3.3]], o);
  const bands = [[H - 3.3, H - 2.9], [H - 2.9, H - 2.6], [H - 2.6, H - 2.4]];
  bands.forEach(([a, c], i) => { mb.mat = M.PAINT; mb.ea = cols[i % cols.length]; mb.lathe([[R * 0.87, a], [R * 0.87, c]], o); });
  mb.mat = M.PAINT; mb.ea = cols[0]; mb.eb = 200; mb.lathe([[R * 0.86, H - 2.4], [R * 1.05, H - 1.7], [R * 1.5, H - 1.0], [R * 1.75, H - 0.62]], o); mb.eb = 0;
  mb.mat = M.GOLD; mb.lathe([[R * 1.75, H - 0.62], [R * 1.77, H - 0.55], [R * 0.9, H - 0.55]], o);
  mb.ea = 0; mb.mat = M.SANDST; mb.box(x - R * 1.05, H - 0.6, z - R * 1.05, x + R * 1.05, H, z + R * 1.05, 0.04);
}
// open hypostyle hall: nx x nz columns at spacing sp, architraves, a roof with painted star ceiling, cornice
function meshHall(nx, nz, sp, H, lod) {
  const mb = new MB(1 << 15), X = (nx - 1) * sp / 2, Z = (nz - 1) * sp / 2, R = 0.9;
  const cols = [[PC.TURQ, PC.CARN, PC.LAPIS], [PC.LAPIS, PC.OCHRE, PC.TURQ]];
  mb.mat = M.PAVE; mb.box(-X - 3, -0.4, -Z - 3, X + 3, 0.5, Z + 3, 0.05, false);
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) column(mb, -X + i * sp, -Z + j * sp, H, R, lod, cols[(i + j) % 2]);
  mb.mat = M.SANDST;
  for (let j = 0; j < nz; j++) mb.box(-X - 1.2, H, -Z + j * sp - 0.8, X + 1.2, H + 1.4, -Z + j * sp + 0.8, 0.04);
  bandRect(mb, -X - 1.25, -Z - 0.85, X + 1.25, Z + 0.85, H + 0.2, H + 1.2, PC.LAPIS, true, 0.03);
  // roof over the middle rows only: light falls between the outer columns
  const rz = max(Z - sp, sp * 0.6);
  mb.mat = M.SANDST; mb.box(-X - 1.2, H + 1.4, -rz - 0.8, X + 1.2, H + 2.3, rz + 0.8, 0.04);
  mb.mat = M.PAINT; mb.ea = PC.LAPIS; mb.eb = 128; mb.quad(mb.v(-X - 1.2, H + 1.39, -rz - 0.8, 0, -1, 0), mb.v(X + 1.2, H + 1.39, -rz - 0.8, 0, -1, 0), mb.v(X + 1.2, H + 1.39, rz + 0.8, 0, -1, 0), mb.v(-X - 1.2, H + 1.39, rz + 0.8, 0, -1, 0)); mb.ea = mb.eb = 0;
  cornice(mb, -X - 1.2, -rz - 0.8, X + 1.2, rz + 0.8, H + 2.3, 0.7, 1.0);
  return mb.build();
}
// villa of plastered mud brick: main block (one or two storeys), a lower wing, roof terraces with parapets, a linen
// pergola, painted frieze under the cornice, latticed windows. Returns the mesh and its solid boxes [x0, z0, x1, z1, top]
// in its own frame. Tinted per instance (M.PLASTER).
function meshVillaE(seed, lod) {
  const mb = new MB(1 << 13), rng = RNG(seed * 991 + 17), W = 9 + rng() * 5, D = 8 + rng() * 4, two = rng() < 0.6, H1 = 4.2, H = two ? 8 : H1;
  const boxes = [];
  const block = (x0, z0, x1, z1, h, fr) => {
    prism(mb, rect(x0, z0, x1, z1), -0.4, h, M.PLASTER, M.TERRACE, 0.7);
    if (lod < 2) bandRect(mb, x0, z0, x1, z1, h - 0.9, h - 0.35, fr, lod === 0, 0.02);
    cornice(mb, x0, z0, x1, z1, h, 0.32, 0.5, M.PLASTER);
    // parapet round the roof terrace
    if (lod < 2) { mb.mat = M.PLASTER; for (const [a, b, c, d] of [[x0 - 0.3, z0 - 0.3, x1 + 0.3, z0], [x0 - 0.3, z1, x1 + 0.3, z1 + 0.3], [x0 - 0.3, z0, x0, z1], [x1, z0, x1 + 0.3, z1]]) mb.box(a, h + 0.5, b, c, h + 1.4, d, 0.04, false); }
    boxes.push([x0 - 0.35, z0 - 0.35, x1 + 0.35, z1 + 0.35, h + 1.4]);
  };
  const fr = [PC.TURQ, PC.LAPIS, PC.OCHRE, PC.MALA][(rng() * 4) | 0];
  block(-W / 2, -D / 2, W / 2, D / 2, H, fr);
  // the wing, to one side
  const ws = rng() < 0.5 ? -1 : 1, WW = 4 + rng() * 3, WD = D * (0.5 + 0.3 * rng());
  block(ws > 0 ? W / 2 : -W / 2 - WW, -WD / 2, ws > 0 ? W / 2 + WW : -W / 2, WD / 2, H1 - 0.6, fr);
  // windows (two rows when two storeys) and a door on the front (+x)
  if (lod < 2) {
    const faces = [[W / 2, 0, 1, 0, D], [-W / 2, 0, -1, 0, D], [0, D / 2, 0, 1, W], [0, -D / 2, 0, -1, W]];
    for (const [x, z, nx, nz, L] of faces) {
      const n = max(1, floor(L / 3.2));
      for (let i = 0; i < n; i++) { const u = (i - (n - 1) / 2) * L / n; if (nx > 0 && abs(u) < 1.6) continue; windowAt(mb, x, z, nx, nz, u, 2.0, 0.9, 1.1); if (two) windowAt(mb, x, z, nx, nz, u, H1 + 1.6, 0.9, 1.2); }
    }
    mb.mat = M.WINDOW; mb.quad(mb.v(W / 2 + 0.03, -0.1, -0.8, 1, 0, 0), mb.v(W / 2 + 0.03, -0.1, 0.8, 1, 0, 0), mb.v(W / 2 + 0.03, 2.5, 0.8, 1, 0, 0), mb.v(W / 2 + 0.03, 2.5, -0.8, 1, 0, 0));
    mb.mat = M.SANDST; mb.box(W / 2, -0.1, -1.15, W / 2 + 0.2, 2.9, -0.8); mb.box(W / 2, -0.1, 0.8, W / 2 + 0.2, 2.9, 1.15); mb.box(W / 2, 2.5, -1.3, W / 2 + 0.25, 3.1, 1.3, 0.03);
  }
  // pergola on the main roof: posts, beams, a linen awning
  if (lod < 2 && rng() < 0.8) {
    const px0 = -W / 2 + 0.8, px1 = px0 + min(W - 1.6, 4 + rng() * 3), pz0 = -D / 2 + 0.8, pz1 = pz0 + min(D - 1.6, 3 + rng() * 2), py = H + 0.5;
    mb.mat = M.TRIM; for (const [x, z] of [[px0, pz0], [px1, pz0], [px0, pz1], [px1, pz1]]) mb.box(x - 0.1, py, z - 0.1, x + 0.1, py + 2.4, z + 0.1);
    mb.box(px0 - 0.2, py + 2.4, pz0 - 0.08, px1 + 0.2, py + 2.55, pz0 + 0.08); mb.box(px0 - 0.2, py + 2.4, pz1 - 0.08, px1 + 0.2, py + 2.55, pz1 + 0.08);
    mb.mat = M.PAINT; mb.ea = PC.LINEN; mb.box(px0, py + 2.56, pz0, px1, py + 2.6, pz1); mb.ea = 0;
  }
  return { mesh: mb.build(), boxes };
}
// felucca: a wooden hull, a short mast and a tall lateen sail; bow +x, ~10 m
function meshFelucca() {
  const mb = new MB(2048), S = 12, L = 5, w = (t) => 1.45 * pow(max(0, 1 - t * t), 0.6), sh = (t) => 0.7 + 0.5 * t * t;
  const sec = (t) => { const ww = w(t), s = sh(t); return [[-ww, s], [-ww * 0.82, 0.05], [0, -0.5 * (1 - t * t)], [ww * 0.82, 0.05], [ww, s]]; };
  mb.mat = M.PAINT; mb.ea = PC.OCHRE;
  let prev = null;
  for (let i = 0; i <= S; i++) {
    const t = -1 + 2 * i / S, x = t * L, s = sec(t), ring = s.map(([z, y], j) => { const nz = j < 2 ? -1 : j > 2 ? 1 : 0; return mb.v(x, y, z, 0, j === 2 ? -1 : 0.2, nz); });
    if (prev) for (let j = 0; j < 4; j++) mb.quad(prev[j], ring[j], ring[j + 1], prev[j + 1]);
    prev = ring;
  }
  mb.ea = PC.LAPIS; for (let i = 0; i < S; i++) { const t0 = -1 + 2 * i / S, t1 = -1 + 2 * (i + 1) / S; for (const sd of [-1, 1]) mb.quad(mb.v(t0 * L, sh(t0) - 0.25, sd * w(t0) * 1.005, 0, 0, sd), mb.v(t1 * L, sh(t1) - 0.25, sd * w(t1) * 1.005, 0, 0, sd), mb.v(t1 * L, sh(t1), sd * w(t1) * 1.005, 0, 0, sd), mb.v(t0 * L, sh(t0), sd * w(t0) * 1.005, 0, 0, sd)); }
  mb.ea = 0; mb.mat = M.TERRACE; mb.quad(mb.v(-L * 0.95, 0.6, -0.2, 0, 1, 0), mb.v(L * 0.95, 0.6, -0.2, 0, 1, 0), mb.v(L * 0.95, 0.6, 0.2, 0, 1, 0), mb.v(-L * 0.95, 0.6, 0.2, 0, 1, 0));
  for (let i = 0; i < S; i++) { const t0 = -1 + 2 * i / S, t1 = -1 + 2 * (i + 1) / S; mb.quad(mb.v(t0 * L, 0.62, -w(t0) * 0.95, 0, 1, 0), mb.v(t1 * L, 0.62, -w(t1) * 0.95, 0, 1, 0), mb.v(t1 * L, 0.62, w(t1) * 0.95, 0, 1, 0), mb.v(t0 * L, 0.62, w(t0) * 0.95, 0, 1, 0)); }
  // mast, yard, sail (both faces)
  mb.mat = M.TRIM; mb.tube([[1.2, 0.5, 0, 0.12], [1.2, 7.5, 0, 0.08]], 5, false); mb.tube([[-4.2, 1.6, 0.25, 0.08], [1.2, 7.2, 0.25, 0.1], [4.6, 14, 0.25, 0.05]], 5, false);
  mb.mat = M.PAINT; mb.ea = PC.LINEN;
  const A = [-4.1, 1.7, 0.4], B = [4.5, 13.8, 0.4], C = [3.8, 1.4, 0.4], n = vnorm(vcross([B[0] - A[0], B[1] - A[1], 0], [C[0] - A[0], C[1] - A[1], 0.6]));
  for (const sg of [1, -1]) { const o = sg * 0.02; mb.tri(mb.v(A[0], A[1], A[2] + o, n[0] * sg, n[1] * sg, n[2] * sg), mb.v(B[0], B[1], B[2] + o, n[0] * sg, n[1] * sg, n[2] * sg), mb.v(C[0], C[1], C[2] + 0.6 + o, n[0] * sg, n[1] * sg, n[2] * sg)); }
  mb.ea = 0;
  return mb.build();
}
// lotus fountain basin: a turquoise faience bowl on a stand, ~2.4 m across
function meshBasin() {
  const mb = new MB(1024);
  mb.mat = M.SANDST; mb.lathe([[1.0, 0], [1.0, 0.25], [0.45, 0.4], [0.35, 0.9]], { seg: 12 });
  mb.mat = M.PAINT; mb.ea = PC.TURQ; mb.eb = 200; mb.lathe([[0.35, 0.9], [0.9, 1.05], [1.25, 1.35], [1.38, 1.7], [1.3, 1.72], [1.15, 1.45]], { seg: 16 }); mb.eb = 0;
  mb.mat = M.GOLD; mb.lathe([[1.4, 1.68], [1.4, 1.76], [1.3, 1.76]], { seg: 16 }); mb.ea = 0;
  return mb.build();
}
