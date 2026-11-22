// collision: what the camera cannot fly into
// solid: land, canal bottoms, city ground and quays, terraces, pyramid and pyramidion, bridge decks (passable under their
// openings), the Nile quays, and the buildings city.js lists as boxes. Trees, shrubs, papyrus and boats are not.
// surfaceAt(x, z, y): the floor and ceiling (under a bridge) the camera must keep between. Runs every frame; no allocation.
const CLEAR = 0.9, CLEAR_W = 0.55; // clearance above solid ground, and above water
const COL = new Float64Array(3); // last query: floor, ceiling, 1 where the floor is natural ground or water
let landY = null; // set by main.js once the world is built
// boxes [x0, z0, x1, z1, top] in a grid of 16 m cells; bridges [x0, z0, x1, z1, deck, along z, hump]
let HB = null, HR = null, GRID = null; const GC = 16, GN = 256, GO = 2048;
function setHard(h) {
  HB = new Float64Array(h.boxes); HR = new Float64Array(h.bridges);
  const cells = new Map();
  for (let i = 0; i < HB.length; i += 5) for (let a = floor((HB[i] + GO) / GC); a <= floor((HB[i + 2] + GO) / GC); a++) for (let b = floor((HB[i + 1] + GO) / GC); b <= floor((HB[i + 3] + GO) / GC); b++) { const k = a * GN + b, c = cells.get(k); if (c) c.push(i); else cells.set(k, [i]); }
  GRID = new Map(); for (const [k, v] of cells) GRID.set(k, new Int32Array(v));
}
// top of the boxes covering a place, or -1e9
function builtY(x, z) {
  const c = GRID.get(floor((x + GO) / GC) * GN + floor((z + GO) / GC)); let y = -1e9;
  if (c) for (let j = 0; j < c.length; j++) { const i = c[j]; if (x > HB[i] && x < HB[i + 2] && z > HB[i + 1] && z < HB[i + 3] && HB[i + 4] > y) y = HB[i + 4]; }
  return y;
}
// deck over open water: on it or under it, decided by last frame's height so a long step can't pass through
function deck(top, under, y0) { if (y0 >= top - 0.1) { COL[0] = top + CLEAR; COL[1] = 1e9; } else { COL[0] = under + CLEAR_W; COL[1] = top - 1.2; } COL[2] = 0; }
// acropolis and pyramid: height of the built ground at max(|x|, |z|) = m (0 if not on it)
function acroY(m) {
  if (m >= T1.h) return 0;
  if (m >= T2.h) return T1.y;
  if (m >= T2.pool) return T2.y;
  if (m >= PYR.h0) return -1; // the pool
  if (m < PDN.h + 0.5) return PYR_TOP + 1.5 + PDN.H * max(0, 1 - m / PDN.h);
  return pyrY(min(PYR.n, floor((PYR.h0 - m) / PYR.step) + 1));
}
// Same four stair ramps as meshAcropolis/meshPyramid, including the pool causeways.
function acroStairY(x,z) {
  const ax=abs(x),az=abs(z),r=max(ax,az),v=min(ax,az),east=ax>=az&&x>0;
  const run1=(T1.y-LAND)/.18*.34,run2=(T2.y-T1.y)/.18*.34;
  if(r>=T1.h&&r<=T1.h+run1&&v<(east?10:7))return mix(T1.y,LAND,(r-T1.h)/run1);
  if(r>=T2.h&&r<=T2.h+run2&&v<(east?8:6))return mix(T2.y,T1.y,(r-T2.h)/run2);
  const sl=PYR.rise/PYR.step,xa=PYR.h0+(pyrY(1)-T2.y)/sl,xb=pyrH(PYR.n-1);
  if(r>=xb&&r<=xa&&v<3.4)return mix(PYR_TOP,T2.y,(r-xb)/(xa-xb));
  return -1e9;
}
function surfaceAtPoint(x, z, y0) {
  COL[1] = 1e9; COL[2] = 0;
  for (let i = 0; i < HR.length; i += 7) if (x > HR[i] && x < HR[i + 2] && z > HR[i + 1] && z < HR[i + 3]) {
    const u = HR[i + 5] ? (z - HR[i + 1]) / (HR[i + 3] - HR[i + 1]) : (x - HR[i]) / (HR[i + 2] - HR[i]);
    deck(HR[i+4] + HR[i+6] * (sin(PI*u)-1), FLOOR_Y+CLEAR-CLEAR_W, y0); return;
  }
  if (inCity(x, z)) {
    const qs=quayStepY(x,z); if(qs>-1e8){COL[0]=qs+CLEAR;return;}
    for(let i=0;i<BIEFS.length;i++){const b=BIEFS[i];if(x>b[0]&&x<b[1]&&z>b[2]-7&&z<b[2]){COL[0]=max(b[3]+.64+CLEAR_W,builtY(x,z)+CLEAR);return;}}
    if (canalAt(x, z)) { COL[0] = max(FLOOR_Y,builtY(x,z)) + CLEAR; return; }
    let f = cityH(x, z); const m = max(abs(x), abs(z));
    const ramp=acroStairY(x,z);
    if(ramp>-1e8) {COL[0]=max(ramp,builtY(x,z))+CLEAR;return;}
    if (m < T1.h) { const a = acroY(m); if (a < 0) { if (abs(z) < 6.5 && x > 0) f = T2.y; else { COL[0] = T2.wy + CLEAR_W; COL[2] = 1; return; } } else f = a; }
    const b = builtY(x, z); if (b > f) f = b;
    COL[0] = f + CLEAR; return;
  }
  // outside the city: land mesh, the quays, what is built on it, and the water over it
  let h = landY(x, z), nat = 1;
  if (abs(z) < QZ && x >= QX0 && x <= quayX(z) + 0.5) { h = quayY(x, z); nat = 0; }
  const b = builtY(x, z); if (b > h) { h = b; nat = 0; }
  let w = 0; if (oasisD(x,z) < 58) w = 2.6;
  COL[0] = h + CLEAR; COL[2] = h < w ? 0 : nat;
}
// Water access is limited to real wet footprints; shallow temple bowls remain above-water.
function waterSurfaceAt(x,z){
  if(inCity(x,z))return canalAt(x,z)?WATER:-1e9;
  if(oasisD(x,z)<58&&landY&&landY(x,z)<2.6)return 2.6;
  return landY&&landY(x,z)<0?0:-1e9;
}
// A camera has volume: keep its near plane away from quay/building faces.
function surfaceAt(x,z,y0){
  surfaceAtPoint(x,z,y0);let f=COL[0],ceiling=COL[1],nat=COL[2];
  for(let k=0;k<4;k++){
    surfaceAtPoint(x+(k===0?.7:k===1?-.7:0),z+(k===2?.7:k===3?-.7:0),y0);
    if(COL[0]>f){f=COL[0];nat=COL[2];}ceiling=min(ceiling,COL[1]);
  }
  COL[0]=f;COL[1]=ceiling;COL[2]=nat;
}
// move the camera from (px, py, pz) towards F[CX..CZ] (velocity F[VX..VZ]), correcting both in place. Natural ground
// lifts it; anything built higher than a stair step is a wall it slides along per axis. Long steps go in <= .7 m pieces.
function collide(px, py, pz) {
  if (!landY) return;
  const tx = F[CX], ty = F[CY], tz = F[CZ], n = min(128, ceil(hypot(tx - px, tz - pz) / .7));
  if (n < 2) { collide1(px, py, pz); return; }
  let cx = px, cy = py, cz = pz, dx = (tx - px) / n, dz = (tz - pz) / n; const dy = (ty - py) / n;
  for (let i = 0; i < n; i++) {
    F[CX] = cx + dx; F[CY] = cy + dy; F[CZ] = cz + dz; collide1(cx, cy, cz);
    if (F[CX] === cx) dx = 0; if (F[CZ] === cz) dz = 0;
    cx = F[CX]; cy = F[CY]; cz = F[CZ];
  }
}
function collide1(px, py, pz) {
  let x = F[CX], y = F[CY], z = F[CZ];
  const lift = 0.5 + 1.5 * hypot(x - px, z - pz);
  surfaceAt(x, z, py);
  if (COL[2] < 0.5 && COL[0] - y > lift) {
    surfaceAt(x, pz, py);
    if (COL[2] > 0.5 || COL[0] - y <= lift) { z = pz; F[VZ] = 0; }
    else {
      surfaceAt(px, z, py);
      if (COL[2] > 0.5 || COL[0] - y <= lift) { x = px; F[VX] = 0; }
      else { x = px; z = pz; F[VX] = 0; F[VZ] = 0; surfaceAt(x, z, py); }
    }
  }
  if (y < COL[0]) { y = COL[0]; if (F[VY] < 0) F[VY] = 0; } else if (y > COL[1]) { y = COL[1]; if (F[VY] > 0) F[VY] = 0; }
  F[CX] = x; F[CY] = y; F[CZ] = z;
}
