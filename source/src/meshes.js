// mesh generators: city ground and quays, acropolis and pyramid, water, falls, bridges, terrain
// normals at both ends of each profile segment, averaged unless the corner is sharper than `crease`; solid on the right
const profNormals = (prof, crease = 50) => {
  const cr = cos(crease * DEG), n = prof.length, sn = [], out = [];
  for (let i = 0; i < n - 1; i++) { const a = prof[i + 1][0] - prof[i][0], b = prof[i + 1][1] - prof[i][1], l = hypot(a, b) || 1; sn.push([-b / l, a / l, l]); }
  for (let i = 0; i < n - 1; i++) {
    const e = (k) => { const a = sn[i], b = sn[k]; if (!b || !b[2] || a[0] * b[0] + a[1] * b[1] < cr) return a; const x = a[0] + b[0], y = a[1] + b[1], l = hypot(x, y) || 1; return [x / l, y / l]; };
    out.push([e(i - 1), e(i + 1)]);
  }
  return out;
};
const NT = 1440; // steps around the circle (terrain)
// colours of painted and inlaid stone (M.PAINT, param a; the shader holds the same list)
const PC = { LAPIS: 0, TURQ: 1, CARN: 2, OCHRE: 3, MALA: 4, LINEN: 5, BLACK: 6, GOLDP: 7 };

// outlines
// the ring's inner and outer edges as convex polygons, counter-clockwise in (x, z)
const ringPoly = (f, n = 720) => { const o = []; for (let j = 0; j < n; j++) { const t = j / n * TAU, r = f(t); o.push([r * cos(t), r * sin(t)]); } return o; };
// Sutherland-Hodgman: polygon `s` clipped by the convex counter-clockwise polygon `c`
function clipPoly(s, c) {
  let out = s;
  for (let i = 0; i < c.length && out.length; i++) {
    const a = c[i], b = c[(i + 1) % c.length], inp = out; out = [];
    const side = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    for (let j = 0; j < inp.length; j++) {
      const p = inp[j], q = inp[(j + 1) % inp.length], sp = side(p), sq = side(q);
      if (sp >= 0) out.push(p);
      if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
  }
  return out;
};
const polyArea = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a / 2; };

// solid prism over a convex counter-clockwise outline: walls (wm) from y0 to y1 and a top (tm); ao at the walls' foot
function prism(mb, pts, y0, y1, wm, tm, ao0 = 0.7, top = true) {
  mb.mat = wm;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], l = hypot(dx, dz); if (l < 1e-4) continue;
    const nx = dz / l, nz = -dx / l;
    mb.quad(mb.v(a[0], y0, a[1], nx, 0, nz, ao0), mb.v(b[0], y0, b[1], nx, 0, nz, ao0), mb.v(b[0], y1, b[1], nx, 0, nz), mb.v(a[0], y1, a[1], nx, 0, nz));
  }
  if (top) { mb.mat = tm; mb.poly(pts.map((p) => [p[0], y1, p[1]]), [0, 1, 0]); }
}
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
// quay coping along one edge (outward to the right of a -> b): a stone lip proud of the wall, 0.3 m above the ground
function coping(mb, a, b, top, topB = top) {
  const dx = b[0] - a[0], dz = b[1] - a[1], l = hypot(dx, dz); if (l < 1e-4) return;
  const nx = dz / l, nz = -dx / l, P = (p, o, y, n0, n1, n2) => mb.v(p[0] + nx * o, y + (p === b ? topB - top : 0), p[1] + nz * o, n0, n1, n2);
  mb.mat = M.TRIM;
  mb.quad(P(a, 0.07, top - 0.04, nx, 0, nz), P(b, 0.07, top - 0.04, nx, 0, nz), P(b, 0.07, top + 0.26, nx, 0.3, nz), P(a, 0.07, top + 0.26, nx, 0.3, nz));
  mb.quad(P(a, 0.07, top + 0.3, 0, 1, 0), P(b, 0.07, top + 0.3, 0, 1, 0), P(b, -0.62, top + 0.3, 0, 1, 0), P(a, -0.62, top + 0.3, 0, 1, 0));
  mb.quad(P(a, -0.62, top + 0.3, -nx, 0, -nz), P(b, -0.62, top + 0.3, -nx, 0, -nz), P(b, -0.62, top, -nx, 0, -nz, 0.8), P(a, -0.62, top, -nx, 0, -nz, 0.8));
}

// city ground: blocks between the canals with quay walls and copings, the ring's outer wall, canal floors
function meshCityGround() {
  const mb = new MB(1 << 17), gar = ringPoly(RB.gar), out = ringPoly(RB.out);
  mb.mat = M.FLOOR; mb.poly(out.map((p) => [p[0], FLOOR_Y, p[1]]), [0, 1, 0], 0.8);
  for (const b of BLOCKS) {
    const poly = clipPoly(rect(b[0], b[1], b[2], b[3]), gar); if (poly.length < 3 || polyArea(poly) < 1e-5) continue;
    const cx = (b[0]+b[2])/2, cz = (b[1]+b[3])/2;
    const height = p => cityH(mix(p[0], cx, 1e-5), mix(p[1], cz, 1e-5));
    const elevated = cityH(cx, cz) > LAND + .01;
    mb.mat = elevated ? (cityH(cx, cz) < cityH(b[0]+.01, cz) ? M.STEP : M.PAVE) : M.GROUND;
    mb.eb = elevated && mb.mat === M.STEP ? 255 : 0;
    mb.poly(poly.map(p => [p[0], height(p), p[1]]), [0, 1, 0]); mb.eb = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], q = poly[(i+1)%poly.length], dx=q[0]-a[0], dz=q[1]-a[1], l=hypot(dx,dz), nx=dz/l, nz=-dx/l;
      const mx=(a[0]+q[0])/2+nx*.1, mz=(a[1]+q[1])/2+nz*.1, ya=height(a), yb=height(q);
      if (!canalAt(mx,mz) && cityH(mx,mz) >= (ya+yb)/2-.1) continue;
      mb.mat=M.QUAY;
      if(abs(a[0]-119)<.01&&abs(q[0]-119)<.01&&max(a[1],q[1])>32&&min(a[1],q[1])<40){
        const lo=min(a[1],q[1]),hi=max(a[1],q[1]);
        const panel=(za,zb,y0,y1)=>{if(zb<=za)return;mb.poly([[119,y0,za],[119,y0,zb],[119,y1,zb],[119,y1,za]],[nx,0,nz]);};
        panel(lo,min(32,hi),FLOOR_Y,ya);panel(max(40,lo),hi,FLOOR_Y,ya);
        panel(max(lo,32),min(hi,40),FLOOR_Y,3.2);panel(max(lo,32),min(hi,40),6.3,ya);
      }else mb.quad(mb.v(a[0],FLOOR_Y,a[1],nx,0,nz,.55),mb.v(q[0],FLOOR_Y,q[1],nx,0,nz,.55),mb.v(q[0],yb,q[1],nx,0,nz),mb.v(a[0],ya,a[1],nx,0,nz));
      coping(mb,a,q,ya,yb);
    }
  }
  // the ring's outer wall faces the city
  for (let j = 0; j < out.length; j++) {
    const a = out[(j + 1) % out.length], b = out[j], dx = b[0] - a[0], dz = b[1] - a[1], l = hypot(dx, dz), nx = dz / l, nz = -dx / l;
    mb.mat = M.QUAY; mb.quad(mb.v(a[0], FLOOR_Y, a[1], nx, 0, nz, 0.62), mb.v(b[0], FLOOR_Y, b[1], nx, 0, nz, 0.62), mb.v(b[0], LAND - 0.04, b[1], nx, 0, nz), mb.v(a[0], LAND - 0.04, a[1], nx, 0, nz));
    coping(mb, a, b, LAND);
  }
  return mb.build();
}

// the acropolis: two terraces, a pool round the pyramid's foot, stairways; the pyramid with its painted bands
const T1 = { h: 108, y: 15 }, T2 = { h: 80, y: 20, pool: 71, wy: 19.7 }, PYR = { y0: 18.8, h0: 63, step: 7, rise: 13, n: 7 };
const pyrH = (k) => PYR.h0 - PYR.step * k; // half size of step k
const pyrY = (k) => PYR.y0 + PYR.rise * k; // foot of step k (top of the pyramid: pyrY(7))
const PYR_TOP = pyrY(PYR.n);
// stairway along +x (rotate with yaw): foot at (xa, ya), top at (xb, yb), half width hw; ramp drawn with step lines
function stair(mb, yaw, xa, ya, xb, yb, hw, cheek = true, ox = 0, oz = 0) {
  const c = cos(yaw), s = sin(yaw); mb.fr = [ox, 0, oz, c, s, 1];
  const dx = xb - xa, dy = yb - ya, l = hypot(dx, dy), nx = -dy / l, ny = dx / l;
  mb.mat = M.STEP; mb.eb = 255;
  mb.quad(mb.v(xa, ya, -hw, 0, 1, 0, 0.85), mb.v(xa, ya, hw, 0, 1, 0, 0.85), mb.v(xb, yb, hw, 0, 1, 0), mb.v(xb, yb, -hw, 0, 1, 0)); mb.eb = 0;
  if (cheek) for (const sg of [-1, 1]) {
    // a sloping balustrade wall either side
    const z0 = sg * hw, z1 = sg * (hw + 0.7), h = 1.0; mb.mat = M.TRIM;
    mb.quad(mb.v(xa, ya + h, z0, nx * 0.3, ny, 0), mb.v(xb, yb + h, z0, nx * 0.3, ny, 0), mb.v(xb, yb + h, z1, nx * 0.3, ny, 0), mb.v(xa, ya + h, z1, nx * 0.3, ny, 0));
    mb.quad(mb.v(xa, ya + h, z0, 0, 0, -sg), mb.v(xb, yb + h, z0, 0, 0, -sg), mb.v(xb, yb, z0, 0, 0, -sg, 0.7), mb.v(xa, ya, z0, 0, 0, -sg, 0.7));
    mb.mat = M.MARBLE;
    mb.quad(mb.v(xa, ya + h, z1, 0, 0, sg), mb.v(xb, yb + h, z1, 0, 0, sg), mb.v(xb, min(ya, yb) - 0.5, z1, 0, 0, sg, 0.7), mb.v(xa, min(ya, yb) - 0.5, z1, 0, 0, sg, 0.7));
  }
  mb.fr = null;
}
// band of painted stone round a square of half size h, from y0 to y1, proud by `out`; frieze: symbols (shader)
function bandSq(mb, h, y0, y1, out, col, frieze) {
  const H = h + out; mb.mat = M.PAINT; mb.ea = col; mb.eb = frieze ? 255 : 0;
  for (const [nx, nz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
    const tx = -nz, tz = nx, P = (u, y, e) => { mb.ec = e; return mb.v(nx * H + tx * u, y, nz * H + tz * u, nx, 0, nz); };
    mb.quad(P(-H, y0, 0), P(H, y0, 0), P(H, y1, 255), P(-H, y1, 255));
  }
  mb.ea = mb.eb = mb.ec = 0;
  // gold edges
  mb.mat = M.GOLD;
  for (const y of [y0, y1 - 0.12]) for (const [nx, nz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
    const tx = -nz, tz = nx, G = H + 0.03, P = (u, yy, o) => mb.v(nx * (G + o) + tx * u, yy, nz * (G + o) + tz * u, nx, 0, nz);
    mb.quad(P(-G, y, 0), P(G, y, 0), P(G, y + 0.12, 0), P(-G, y + 0.12, 0));
  }
}
function meshAcropolis() {
  const mb = new MB(1 << 16);
  // terrace 1: walls of courses, paved top, a cornice; terrace 2: a frame round the pool
  prism(mb, rect(-T1.h, -T1.h, T1.h, T1.h), LAND - 0.05, T1.y, M.MARBLE, M.PAVE, 0.65);
  bandSq(mb, T1.h, T1.y - 1.1, T1.y - 0.25, 0.04, PC.LAPIS, true);
  prism(mb, rect(-T2.pool, -T2.pool, T2.pool, T2.pool), T1.y - 0.1, PYR.y0, M.MARBLE, M.FLOOR, 0.65, true);
  for (const [x0, z0, x1, z1] of [[-T2.h, -T2.h, T2.h, -T2.pool], [-T2.h, T2.pool, T2.h, T2.h], [-T2.h, -T2.pool, -T2.pool, T2.pool], [T2.pool, -T2.pool, T2.h, T2.pool]]) prism(mb, rect(x0, z0, x1, z1), T1.y - 0.1, T2.y, M.MARBLE, M.PAVE, 0.7);
  bandSq(mb, T2.h, T2.y - 1.1, T2.y - 0.25, 0.04, PC.TURQ, true);
  // causeway over the pool on the east, to the pyramid's stair
  prism(mb, rect(PYR.h0 - 1, -6.5, T2.pool + 0.5, 6.5), PYR.y0, T2.y, M.MARBLE, M.PAVE, 0.7);
  // stairways: ground to terrace 1 on four sides, terrace 1 to 2 on four sides
  for (let k = 0; k < 4; k++) {
    const yaw = k * PI / 2, run1 = (T1.y - LAND) / 0.18 * 0.34, run2 = (T2.y - T1.y) / 0.18 * 0.34;
    stair(mb, yaw, T1.h + run1, LAND, T1.h, T1.y, k ? 7 : 10);
    stair(mb, yaw, T2.h + run2, T1.y, T2.h, T2.y, k ? 6 : 8);
  }
  return mb.build();
}
function meshPyramid() {
  const mb = new MB(1 << 15);
  for (let k = 0; k < PYR.n; k++) {
    const h = pyrH(k), y0 = pyrY(k), y1 = pyrY(k + 1);
    mb.mat = M.SANDST; mb.box(-h, y0 - (k ? 0.2 : 0.5), -h, h, y1, h, 0.08, false);
    // Carved crown on each tier, below the existing wet tread. No new wall of primary colours.
    ringProf(mb,-h,-h,h,h,[[0,y1-1.15],[.12,y1-1.02],[.18,y1-.85],[.1,y1-.68],[.28,y1-.36],[.42,y1-.12],[.42,y1-.03]],M.SANDST);
    bandSq(mb,h+.43,y1-.3,y1-.17,.015,PC.GOLDP,false);
    if(k===0||k===3||k===6)bandSq(mb,h,y0+.65,y0+1.15,.09,PC.MALA,false);
    // Paired green votive panels, with gold lotus/solar medallions; leave the stairs free.
    for(let side=0;side<4;side++){
      const a=side*PI/2;mb.fr=[0,0,0,cos(a),sin(a),1];
      for(const sd of [-1,1]){
        const butt=sd*h*.82;
        // Shallow engaged piers break the long flat face, without changing the tier outline.
        mb.mat=M.SANDST;mb.box(butt-.65,y0+.35,-h-.36,butt+.65,y1-1.2,-h+.08,.13);
        const x=sd*h*.48,ym=(y0+y1)/2,ww=k>3?1.6:2.2,hh=(y1-y0)*.27;
        mb.mat=M.SANDST;mb.box(x-ww-.35,ym-hh-.35,-h-.32,x+ww+.35,ym+hh+.4,-h+.08,.12);
        mb.mat=M.PAINT;mb.ea=PC.MALA;mb.box(x-ww,ym-hh,-h-.37,x+ww,ym+hh,-h-.33,.035);mb.ea=0;
        mb.mat=M.GOLD;
        const outline=[];for(let j=0;j<=24;j++){const t=j*TAU/24,shape=k===1||k===4?pow(abs(cos(t)),.6)*Math.sign(cos(t)):cos(t);outline.push([x+shape*ww*.75,ym+sin(t)*hh*(k===2?.5:.73),-h-.43,.065]);}mb.tube(outline,5,false);
        for(const petal of [-1,0,1]){const ps=[];for(let j=0;j<=12;j++){const t=j*PI/12;ps.push([x+sin(t)*(petal*.65+sin(t)*.35),ym-hh*.45+(1-cos(t))*hh*.5,-h-.45,.055]);}mb.tube(ps,5,false);}
      }
      mb.fr=null;
    }
  }
  // the east stair: up through the corners of the steps
  const sl = PYR.rise / PYR.step, xa = pyrH(0) + (pyrY(1) - T2.y) / sl;
  for(let side=0;side<4;side++) stair(mb,side*PI/2,xa,T2.y,pyrH(PYR.n-1),PYR_TOP,3.4);
  // Four small open crown kiosks frame, rather than conceal, the emerald.
  for(const sx of [-1]) for(const sz of [-1,1]) {
    const x=sx*16,z=sz*16;
    for(const dx of [-1.7,1.7]) for(const dz of [-1.7,1.7]) {mb.fr=[x+dx,PYR_TOP+.1,z+dz,1,0,1];column(mb,0,0,4.8,.3,1,[PC.MALA,PC.GOLDP,PC.OCHRE]);mb.fr=null;}
    mb.mat=M.SANDST;mb.box(x-2.4,PYR_TOP+4.9,z-2.4,x+2.4,PYR_TOP+5.5,z+2.4,.06);
  }
  // gold socle under the pyramidion
  mb.mat = M.GOLD; mb.box(-PDN.h - 0.5, PYR_TOP - 0.1, -PDN.h - 0.5, PDN.h + 0.5, PYR_TOP + 0.6, PDN.h + 0.5, 0.05, false);
  bandSq(mb, PDN.h + 0.5, PYR_TOP + 0.6, PYR_TOP + 1.5, 0.02, PC.MALA, true);
  return cutCryptShaft(mb.build());
}
// pyramidion: a square gem on the gold socle (K.CRYSTAL), and its gold lattice
function meshPyramidion() { const mb = new MB(256); mb.lathe([[PDN.h * SQRT2, 0], [PDN.h * SQRT2 * 0.98, 0.5], [0, PDN.H]], { seg: 4, flat: true, a0: PI / 4, a1: PI / 4 + TAU }); return mb.build(); }
function meshLattice() {
  const mb = new MB(1 << 12), h = PDN.h, H = PDN.H, y0 = PYR_TOP + 1.5; mb.mat = M.GOLD;
  const at = (u, v, t) => [u * h * (1 - t) * 1.004, y0 + t * H, v * h * (1 - t) * 1.004]; // u, v in -1..1, t up the height
  for (const [u, v] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const p = []; for (let i = 0; i <= 6; i++) { const q = at(u, v, i / 6 * 0.97); p.push([...q, 0.16]); } mb.tube(p, 5, false); }
  for (const t of [0, 0.33, 0.62, 0.84]) { const p = []; for (const [u, v] of [[1, 1], [1, -1], [-1, -1], [-1, 1], [1, 1]]) p.push([...at(u, v, t), 0.1]); mb.tube(p, 4, false); }
  for (const [u, v] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const p = []; for (let i = 0; i <= 4; i++) p.push([...at(u, v, i / 4 * 0.84), 0.08]); mb.tube(p, 4, false); }
  // the cap
  mb.lathe([[0.9, y0 + H * 0.94], [0, y0 + H + 0.6]], { seg: 4, flat: true, a0: PI / 4, a1: PI / 4 + TAU });
  return mb.build();
}

// water surfaces; param a: 0 canal water, 1 sacred pool (deep emerald), 2 river
function waterPoly(mb, pts, y, kind) { mb.mat = 0; mb.ea = kind; mb.poly(pts.map((p) => [p[0], y, p[1]]), [0, 1, 0]); mb.ea = 0; }
// square ring between half sizes a < b
function waterSq(mb, a, b, y, kind) { mb.mat = 0; mb.ea = kind; const P = (x, z) => mb.v(x, y, z, 0, 1, 0); for (const [sx, sz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const tx = -sz, tz = sx; mb.quad(P(sx * a + tx * a, sz * a + tz * a), P(sx * b + tx * b, sz * b + tz * b), P(sx * b - tx * b, sz * b - tz * b), P(sx * a - tx * a, sz * a - tz * a)); } mb.ea = 0; }
function meshCityWater() {
  const mb = new MB(1 << 12);
  waterPoly(mb, ringPoly(RB.out, 360), WATER, 0);
  // the pool round the pyramid, the films on its treads and round the pyramidion
  waterSq(mb, PYR.h0 - 0.2, T2.pool, T2.wy, 1);
  for (let k = 1; k <= PYR.n; k++) waterSq(mb, k < PYR.n ? pyrH(k) - 0.3 : PDN.h + 0.55, pyrH(k - 1) - 0.25, pyrY(k) + 0.06, 1);
  return cutCryptShaft(mb.build());
}
// open water out to the horizon (the Nile where the land dips below 0): rings that follow the camera (the vertex shader
// adds its position and the swell), each SEA_GROW wider so cells stay near-square. Low: SEAK = 2.
function meshSea() {
  const mb = new MB(1 << 16); mb.mat = M.SEA; mb.ea = 2;
  const n = 192 / SEAK, c = mb.v(0, 0, 0, 0, 1, 0); let prev = null;
  for (let r = 1.5; r < 95000; r *= SEA_GROW ** SEAK) {
    const ring = []; for (let j = 0; j <= n; j++) { const t = j / n * TAU; ring.push(mb.v(r * cos(t), 0, r * sin(t), 0, 1, 0)); }
    for (let j = 0; j < n; j++) { if (prev) mb.quad(prev[j], prev[j + 1], ring[j + 1], ring[j]); else mb.tri(c, ring[j], ring[j + 1]); }
    prev = ring;
  }
  return mb.build();
}
// falls over the pyramid's steps: sheet, foam, mist in one mesh (blended, unsorted). Param a: 3 sheet, 4 foam, 5 mist.
// Sheet: b, c = height above the pool and drop below the lip (in 16 m x 255); foam and mist: b strength, c 0-1 out / up.
function meshCascades() {
  const mb = new MB(1 << 15); mb.mat = 0;
  // band of section [offset from the wall, y, b, c] swept along the lip from a to b, outward normal n
  const sweep = (sec, ax, az, bx, bz, nx, nz) => {
    const S = max(2, ceil(hypot(bx - ax, bz - az) / 1.6)); let prev = null;
    for (let i = 0; i <= S; i++) {
      const u = i / S, px = mix(ax, bx, u), pz = mix(az, bz, u), ring = sec.map((q, j) => {
        const p0 = sec[max(j - 1, 0)], p1 = sec[min(j + 1, sec.length - 1)], dr = p1[0] - p0[0], dy = p1[1] - p0[1];
        mb.eb = round(clamp(q[2], 0, 1) * 255); mb.ec = round(clamp(q[3], 0, 1) * 255);
        return mb.v(px + nx * q[0], q[1], pz + nz * q[0], -dy * nx, dr, -dy * nz);
      });
      if (prev) for (let j = 0; j < sec.length - 1; j++) mb.quad(prev[j], ring[j], ring[j + 1], prev[j + 1]);
      prev = ring;
    }
  };
  const fall = (ax, az, bx, bz, nx, nz, y1, y0, pool, scale = 16, kind = 3) => {
    const H = y1 - y0, big = min(1, H / 10), reach = 0.15 + 0.35 * big, mh = 0.5 + 2.9 * big;
    const sec = [[-0.24, y1 + 0.02], [-0.1, y1 + 0.03], [0, y1 - 0.02], [0.05, y1 - 0.15]];
    for (let j = 1; j <= 6; j++) { const t = j / 6; sec.push([0.05 + reach * sqrt(t), y1 - 0.15 - (H - 0.15) * t]); }
    mb.ea = kind; sweep(sec.map((q) => [q[0], q[1], (q[1] - y0) / scale, (y1 + 0.03 - q[1]) / scale]), ax, az, bx, bz, nx, nz);
    mb.ea = 4; sweep([0, 0.3, 0.65, 1].map((t) => [-0.05 + (reach + pool) * t, y0 + 0.05, big, t]), ax, az, bx, bz, nx, nz);
    mb.ea = 5; for (const j of [0, 1]) sweep([0, 0.25, 0.6, 1].map((t) => [reach * 0.5 + j * 0.45 + (0.8 + j * 0.9) * big * t * (0.6 + 0.4 * t) + 0.25 * t, y0 + 0.03 + mh * (0.75 + 0.25 * j) * t, big, t]), ax, az, bx, bz, nx, nz);
  };
  // on each face of each step, falls a few metres wide with dry stone between, staggered from step to step (none
  // over the east stair)
  for (let k = 0; k < PYR.n; k++) {
    const h = pyrH(k) + 0.02, y1 = pyrY(k + 1) + 0.06, y0 = k ? pyrY(k) + 0.06 : T2.wy, pool = k ? 2.2 : 4.5;
    const n = max(1, round(2 * h / 30)), w = min(2 * h / n * 0.5, 8);
    for (const [nx, nz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) for (let i = 0; i < n; i++) {
      const c = -h + (i + 0.5 + (k % 2 ? 0.25 : -0.25) * (n > 1 ? 1 : 0)) * 2 * h / n, a = c - w / 2, b = c + w / 2;
      if (a < 5 && b > -5) continue;
      const tx = -nz, tz = nx;
      fall(nx * h + tx * a, nz * h + tz * a, nx * h + tx * b, nz * h + tz * b, nx, nz, y1, y0, pool);
    }
  }
  // High biefs overflow into the low network; foam lands on actual canal water.
  for(const [x0,x1,z,y] of BIEFS) for(let x=x0+5;x<x1-3;x+=28) fall(x-1.6,z+.12,x+1.6,z+.12,0,1,y+.64,WATER,3);
  // A single vertical drop stands in front of the cliff spur, with its toe inside the oasis.
  const f=OASIS_FALL,z=OASIS[1];
  fall(f.x,z-f.w/2,f.x,z+f.w/2,1,0,f.y+.15,2.6,7,192,6);
  mb.ea = mb.eb = mb.ec = 0;
  return mb.build();
}

// balustrade: stone posts and rails, a low panel between
const BAL = 2.6; // module length
function meshBalPost(lod) {
  const mb = new MB(512); mb.mat = M.TRIM; const b = lod ? 0 : 0.035;
  mb.box(-0.24, 0, -0.24, 0.24, 1.0, 0.24, b, false); mb.box(-0.3, 1.0, -0.3, 0.3, 1.12, 0.3, b * 0.8);
  if (!lod) { mb.mat = M.GOLD; mb.box(-0.2, 1.12, -0.2, 0.2, 1.2, 0.2, 0.03); mb.mat = M.TRIM; mb.box(-0.28, 0, -0.28, 0.28, 0.16, 0.28, 0.03, false); }
  mb.box(0.24, 0.86, -0.1, BAL - 0.24, 0.98, 0.1, b * 0.7);
  return mb.build();
}
// panel: papyrus-stem balusters in the gaps (a row of thin shafts)
function meshBalPanel(lod) {
  const mb = new MB(512); mb.mat = M.TRIM;
  mb.box(0.24, 0, -0.12, BAL - 0.24, 0.16, 0.12, 0.02, false);
  const n = lod ? 2 : 6;
  for (let i = 0; i < n; i++) { const x = mix(0.42, BAL - 0.42, n > 1 ? i / (n - 1) : 0.5); if (lod) mb.box(x - 0.06, 0.16, -0.06, x + 0.06, 0.86, 0.06); else mb.lathe([[0.05, 0.16], [0.06, 0.6], [0.09, 0.74], [0.04, 0.86]], { seg: 6, cx: x }); }
  return mb.build();
}

// bridges
// stone deck (x0, z0) -> (x1, z1) over `arches`, heights ya -> yb with a hump, half width hw, piers to `floor`
function bridge(mb, x0, z0, x1, z1, hw, ya, yb, hump, arches, floor, sea = 0) {
  const L = hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L, vx = -uz, vz = ux;
  const top = (u) => mix(ya, yb, u / L) + hump * sin(PI * u / L), pier = min(1.5, L * 0.06), span = (L - pier * (arches + 1)) / arches, wl = sea ? 0 : WATER;
  const spring = wl + 0.5;
  // lower outline (u, y): piers to the floor, flat-topped openings (no round arches in Egypt: a corbelled slot)
  const low = [[0, floor]];
  for (let k = 0; k < arches; k++) {
    const a = pier + k * (span + pier), rise = min(top(a + span / 2) - 0.75 - spring, span * 0.5), cb = min(0.5, span * 0.1);
    low.push([a, floor], [a, spring], [a, spring + rise - cb], [a + cb, spring + rise], [a + span - cb, spring + rise], [a + span, spring + rise - cb], [a + span, spring], [a + span, floor]);
  }
  low.push([L, floor]);
  const P = (u, v, y, nx, ny, nz, ao) => mb.v(x0 + ux * u + vx * v, y, z0 + uz * u + vz * v, ux * nx + vx * nz, ny, uz * nx + vz * nz, ao);
  const ln = profNormals(low.map((p) => [p[0], -p[1]]), 40);
  for (let i = 0; i < low.length - 1; i++) {
    const a = low[i], b = low[i + 1], n0 = ln[i][0], n1 = ln[i][1];
    mb.mat = M.QUAY; mb.ea = sea ? 255 : 0;
    if (hypot(a[0] - b[0], a[1] - b[1]) > 1e-4 && (a[1] > floor + 0.01 || b[1] > floor + 0.01)) mb.quad(P(a[0], -hw, a[1], n0[0], -n0[1], 0, 0.5), P(a[0], hw, a[1], n0[0], -n0[1], 0, 0.5), P(b[0], hw, b[1], n1[0], -n1[1], 0, 0.5), P(b[0], -hw, b[1], n1[0], -n1[1], 0, 0.5));
    if (abs(a[0] - b[0]) > 1e-4) for (const sd of [-1, 1]) mb.quad(P(a[0], sd * hw, a[1], 0, 0, sd, 0.85), P(b[0], sd * hw, b[1], 0, 0, sd, 0.85), P(b[0], sd * hw, top(b[0]) - 0.34, 0, 0, sd, 0.95), P(a[0], sd * hw, top(a[0]) - 0.34, 0, 0, sd, 0.95));
  }
  mb.ea = 0;
  const S = max(8, round(L / 2.5)), EDGE = [[-0.5, 0], [-0.5, 0.3], [-0.46, 0.34], [0.08, 0.34], [0.12, 0.3], [0.12, -0.02], [0.06, -0.1], [0, -0.34]], EN = profNormals(EDGE);
  for (let i = 0; i < S; i++) {
    const a = L * i / S, b = L * (i + 1) / S, ta = top(a), tb = top(b);
    mb.mat = M.PAVE; mb.quad(P(a, -hw + 0.5, ta, 0, 1, 0), P(a, hw - 0.5, ta, 0, 1, 0), P(b, hw - 0.5, tb, 0, 1, 0), P(b, -hw + 0.5, tb, 0, 1, 0));
    mb.mat = M.TRIM;
    for (const sd of [-1, 1]) for (let k = 0; k < EDGE.length - 1; k++) {
      const p = EDGE[k], q = EDGE[k + 1], n0 = EN[k][0], n1 = EN[k][1];
      mb.quad(P(a, sd * (hw + p[0]), ta + p[1], 0, n0[1], sd * n0[0]), P(b, sd * (hw + p[0]), tb + p[1], 0, n0[1], sd * n0[0]), P(b, sd * (hw + q[0]), tb + q[1], 0, n1[1], sd * n1[0]), P(a, sd * (hw + q[0]), ta + q[1], 0, n1[1], sd * n1[0]));
    }
  }
  return { L, ux, uz, vx, vz, top };
}

// terrain: fields, the Nile's banks and bed, the desert, the cliffs
// polar grid from the ring's outer coping to 14 km (~3.4 m cells near the city, 9 m out to the cliffs, then growing),
// cut into 16 sectors x 6 bands [{ mesh, c }] for culling. Vertex params a, b, c: steepness averaged over a few cells,
// river proximity, hollow or crest. heightAt(x, z) is the mesh's own height, which anything standing on the land must use.
function meshTerrain() {
  const radii = [0]; let step = 3.4;
  while (radii[radii.length - 1] < 14000) { const r = radii[radii.length - 1]; radii.push(r + step); step = r < 3150 ? min(step * 1.013, 9) : step * 1.07; }
  const NR = radii.length, NA = NT, W1 = NA + 1, P = new Float32Array(NR * W1 * 3), N = new Float32Array(NR * W1 * 3), E = new Uint8Array(NR * W1 * 3);
  for (let j = 0; j <= NA; j++) {
    const t = (j % NA) / NA * TAU, c = cos(t), s = sin(t), r0 = RB.out(t) + 0.66;
    for (let i = 0; i < NR; i++) {
      const r = r0 + radii[i], o = (i * W1 + j) * 3, x = r * c, z = r * s, rd = r < 6000 ? riverDist(x, z) : 1e9; P[o] = x; P[o + 2] = z;
      P[o + 1] = i === 0 ? LAND : terrainH(x, z); E[o + 1] = 255 * (1 - sstep(RIV_SHELF - 10, RIV_SHELF + 30, rd));
    }
  }
  const S = new Float32Array(NR * W1), S2 = new Float32Array(NR * W1), at = (i, j) => clamp(i, 0, NR - 1) * W1 + (j + NA) % NA;
  for (let i = 0; i < NR; i++) for (let j = 0; j <= NA; j++) {
    const o = (i * W1 + j) * 3, a = (min(i + 1, NR - 1) * W1 + j) * 3, b = (max(i - 1, 0) * W1 + j) * 3, c = (i * W1 + (j + 1) % NA) * 3, d = (i * W1 + (j + NA - 1) % NA) * 3;
    const ux = P[a] - P[b], uy = P[a + 1] - P[b + 1], uz = P[a + 2] - P[b + 2], vx = P[c] - P[d], vy = P[c + 1] - P[d + 1], vz = P[c + 2] - P[d + 2];
    N[o] = vy * uz - vz * uy; N[o + 1] = vz * ux - vx * uz; N[o + 2] = vx * uy - vy * ux;
    S[i * W1 + j] = 1 - abs(N[o + 1]) / (hypot(N[o], N[o + 1], N[o + 2]) || 1);
    E[o + 2] = clamp(128 + ((P[at(i + 2, j) * 3 + 1] + P[at(i - 2, j) * 3 + 1] + P[at(i, j + 2) * 3 + 1] + P[at(i, j - 2) * 3 + 1]) / 4 - P[o + 1]) * 22, 0, 255);
  }
  for (const [A, B] of [[S, S2], [S2, S]]) for (let i = 0; i < NR; i++) for (let j = 0; j <= NA; j++) { let s = 0; for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) s += A[at(i + di, j + dj)]; B[i * W1 + j] = s / 9; }
  for (let i = 0; i < NR * W1; i++) E[i * 3] = clamp(S[i] * 400, 0, 255);
  // Medium/Low: chunks from every k-th vertex; by the river a kept vertex takes the lowest height around, so the water is
  // never buried; a skirt runs down and outwards from each edge to hide cracks between levels
  const hk = (i, j, k) => {
    let y = P[(i * W1 + j % NA) * 3 + 1];
    if (k > 1 && i > 0 && radii[i] < 6000) { let wet = false, lo = y; for (let a = -k + 1; a < k; a++) for (let b = -k + 1; b < k; b++) { const q = at(i + a, j + b) * 3; if (E[q + 1] > 12) wet = true; if (P[q + 1] < lo) lo = P[q + 1]; } if (wet) y = lo; }
    return y;
  };
  const coarse = (i0, i1, j0, j1, c, k) => {
    const is = [], js = []; for (let i = i0; i < i1; i += k) is.push(i); is.push(i1); for (let j = j0; j < j1; j += k) js.push(j); js.push(j1);
    const mb = new MB((is.length + 2) * (js.length + 2)), drop = k * 2.5; mb.mat = M.TERRAIN;
    const V = (i, j, di = 0, dj = 0) => {
      const o = (i * W1 + j % NA) * 3; let y = hk(i, j, k), x = P[o], z = P[o + 2];
      if (di || dj) { const q = (clamp(i - di, 0, NR - 1) * W1 + (j - dj + NA) % NA) * 3, ox = x - P[q], oz = z - P[q + 2], l = hypot(ox, oz) || 1; x += ox / l * drop; z += oz / l * drop; y -= drop; }
      mb.ea = E[o]; mb.eb = E[o + 1]; mb.ec = E[o + 2];
      return mb.v(x - c[0], y - c[1], z - c[2], N[o], N[o + 1], N[o + 2], 1 - 0.3 * clamp((E[o + 2] - 128) / 90, 0, 1));
    };
    const g = is.map((i) => js.map((j) => V(i, j))), ni = is.length, nj = js.length;
    for (let a = 0; a < ni - 1; a++) for (let b = 0; b < nj - 1; b++) mb.quad(g[a][b], g[a][b + 1], g[a + 1][b + 1], g[a + 1][b]);
    for (const [a, di] of [[0, -1], [ni - 1, 1]]) { if (is[a] === 0) continue; let p = V(is[a], js[0], di, 0); for (let b = 1; b < nj; b++) { const q = V(is[a], js[b], di, 0); mb.quad(g[a][b - 1], g[a][b], q, p); p = q; } }
    for (const [b, dj] of [[0, -1], [nj - 1, 1]]) { let p = V(is[0], js[b], 0, dj); for (let a = 1; a < ni; a++) { const q = V(is[a], js[b], 0, dj); mb.quad(g[a - 1][b], g[a][b], q, p); p = q; } }
    return mb.build();
  };
  const out = [], CA = 16, cuts = [0, 150, 420, 900, 1700, 3200, 1e9].map((d) => { let i = 0; while (i < NR - 1 && radii[i] < d) i++; return i; });
  for (let b = 0; b < cuts.length - 1; b++) for (let k = 0; k < CA; k++) {
    const i0 = cuts[b], i1 = cuts[b + 1], j0 = k * NA / CA, j1 = (k + 1) * NA / CA, nj = j1 - j0 + 1; if (i1 <= i0) continue;
    const co = (((i0 + i1) >> 1) * W1 + ((j0 + j1) >> 1)) * 3, c = [P[co], P[co + 1], P[co + 2]];
    if (LV) { out.push({ lods: (LV > 1 ? [2, 4, 8] : [1, 2, 4]).map((k) => coarse(i0, i1, j0, j1, c, k)), c }); continue; }
    const mb = new MB((i1 - i0 + 1) * nj + 4);
    mb.mat = M.TERRAIN;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const o = (i * W1 + j) * 3; mb.ea = E[o]; mb.eb = E[o + 1]; mb.ec = E[o + 2]; mb.v(P[o] - c[0], P[o + 1] - c[1], P[o + 2] - c[2], N[o], N[o + 1], N[o + 2], 1 - 0.3 * clamp((E[o + 2] - 128) / 90, 0, 1)); }
    for (let i = 0; i < i1 - i0; i++) for (let j = 0; j < nj - 1; j++) { const a = i * nj + j; mb.quad(a, a + 1, a + nj + 1, a + nj); }
    out.push({ lods: [mb.build()], c });
  }
  const heightAt = (x, z) => {
    let t = atan2(z, x); if (t < 0) t += TAU;
    const fj = t / TAU * NA, j = min(floor(fj), NA - 1), a = fj - j, rel = hypot(x, z) - RB.out(t) - 0.66; if (rel <= 0) return LAND;
    let lo = 0, hi = NR - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (radii[m] <= rel) lo = m; else hi = m; }
    const b = clamp((rel - radii[lo]) / (radii[hi] - radii[lo]), 0, 1), o0 = (lo * W1 + j) * 3 + 1, o1 = (hi * W1 + j) * 3 + 1, h00 = P[o0], h01 = P[o0 + 3], h10 = P[o1], h11 = P[o1 + 3];
    return a >= b ? h00 + a * (h01 - h00) + b * (h11 - h01) : h00 + b * (h10 - h00) + a * (h11 - h10);
  };
  const SJ = NA / CA, drawnK = (x, z, k) => {
    let t = atan2(z, x); if (t < 0) t += TAU;
    const fj = t / TAU * NA, j = min(floor(fj), NA - 1), rel = hypot(x, z) - RB.out(t) - 0.66; if (rel <= 0) return LAND;
    let lo = 0, hi = NR - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (radii[m] <= rel) lo = m; else hi = m; }
    let b = 0; while (b < cuts.length - 2 && cuts[b + 1] <= lo) b++;
    const i0 = cuts[b], i1 = cuts[b + 1], ia = i0 + floor((lo - i0) / k) * k, ib = min(ia + k, i1), j0 = floor(j / SJ) * SJ, ja = j0 + floor((j - j0) / k) * k, jb = min(ja + k, j0 + SJ);
    const a = (fj - ja) / (jb - ja), q = clamp((rel - radii[ia]) / (radii[ib] - radii[ia]), 0, 1), h00 = hk(ia, ja, k), h01 = hk(ia, jb, k), h10 = hk(ib, ja, k), h11 = hk(ib, jb, k);
    return a >= q ? h00 + a * (h01 - h00) + q * (h11 - h01) : h00 + q * (h10 - h00) + a * (h11 - h10);
  };
  return { chunks: out, heightAt, drawnAt: LV > 1 ? (x, z) => drawnK(x, z, 2) : heightAt };
}
