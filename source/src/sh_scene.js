// shaders 2/4: instancing, GPU culling, materials (G-buffer) and shadow casters
// material ids, shared by mesh generators and shaders
const M = { MARBLE: 0, PAVE: 1, PLASTER: 2, GOLD: 3, QUAY: 4, FLOOR: 5, WINDOW: 6, BARK: 7, ALLOY: 8, TRIM: 9, TERRAIN: 10, CORE: 11, TERRACE: 12, GROUND: 13, STEP: 14, ROCK: 15, FALL: 16, SEA: 17, PAINT: 18, SANDST: 19, GRANITE: 20, PALM: 21, PALMBARK: 22, UWSTONE: 23, FLAME:24, FISH:25, MOSAIC:26, HIERO:27, EYE:28, DOOR:29, LEVER:30, DECOR:31, LEAF: 32 };
// leaf atlas tiles (material = M.LEAF + tile): crowns, then vines (TRAIL fringe, VLEAF / VBLOSSOM carpets)
const LT = { OLIVE: 0, BROAD: 1, PINE: 2, CYPRESS: 3, BLOSSOM: 4, HYDRANGEA: 5, TRAIL: 6, LAVENDER: 7, VLEAF: 8, VBLOSSOM: 9, PALM: 10, LILY: 11 };

// per view, a compute pass frustum-tests each instance, picks its LOD and appends it to that mesh's list, drawn with one
// indirect draw per mesh
const W_INST = /*wgsl*/`
struct Inst { p: vec4f, q: vec4f, tint: u32, ty: u32, rad: f32, sy: f32 }
`;
const W_CULL = W_COMMON + W_INST + /*wgsl*/`
struct MType { slot: vec4u, d: vec4f, e: vec4f } // slots of up to four LODs; d: two switch distances, far limit, thinning start; e.x: third switch distance
struct Args { ic: u32, n: atomic<u32>, fi: u32, bv: u32, first: u32 }
@group(0) @binding(0) var<uniform> view: View;
@group(0) @binding(1) var<storage, read> inst: array<Inst>;
@group(0) @binding(2) var<storage, read> types: array<MType>;
@group(0) @binding(3) var<storage, read_write> args: array<Args>;
@group(0) @binding(4) var<storage, read_write> vis: array<u32>;
const NONE = 0xffffffffu;
fn emit(slot: u32, i: u32, f: f32, inv: u32) {
  if (slot == NONE || f <= 0.) { return; }
  let k = atomicAdd(&args[slot].n, 1u);
  vis[args[slot].first + k] = i | (u32(sat(f) * 127.) << 24u) | (inv << 31u);
}
@compute @workgroup_size(64) fn reset(@builtin(global_invocation_id) id: vec3u) { if (id.x < arrayLength(&args)) { atomicStore(&args[id.x].n, 0u); } }
@compute @workgroup_size(64) fn cull(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x; if (i >= arrayLength(&inst)) { return; }
  let it = inst[i]; let mt = types[it.ty]; let c = it.p.xyz;
  let flags=u32(mt.e.y);
  if(view.look7.x>.5&&(flags&128u)==0u){return;}
  if((flags&256u)!=0u&&(view.look6.y<=0.||fract(f32(i)*.7548777)>=view.look6.y)){return;}
  for (var k = 0; k < 6; k++) { if (dot(view.planes[k].xyz, c) + view.planes[k].w < -it.rad) { return; } }
  let d = max(max(distance(view.lodc.xyz, c) - it.rad * .5, 0.) * view.misc.z, view.lodb.x);
  // gone beyond the far limit; lodc.w removes the level's LOD scale here, so far forests stay on Medium/Low
  var f = sat((mt.d.z - d * view.lodc.w) / (mt.d.z * .08));
  // small things thin out with distance, each by its own threshold (+1: whole until the density drops below it)
  if (mt.d.w > 0.) { let keep = 1. - .8 * sat((d - mt.d.w) / (mt.d.w * 2.5)); let h = fract(f32(i) * .6180339 + .37); f *= sat((keep - h) * 40. + 1.); }
  if (f <= 0.) { return; }
  // LOD and the next switch distance; each instance switches +-13% off, so changes never sweep a grove as one ring
  let dl = d * (.87 + .26 * fract(f32(i) * .7548777));
  var lv = 0; var edge = mt.d.x;
  if (dl >= mt.d.x && mt.slot.y != NONE) { lv = 1; edge = mt.d.y; if (dl >= mt.d.y && mt.slot.z != NONE) { lv = 2; edge = mt.e.x; if (dl >= mt.e.x && mt.slot.w != NONE) { lv = 3; } } }
  let cur = mt.slot[lv]; var nxt = NONE; if (lv < 3) { nxt = mt.slot[lv + 1]; }
  // cross-fade over the last 22% before each switch with complementary dithers (fixed dither in shadow views)
  if (nxt != NONE && dl > edge * .78) { let t = (dl - edge * .78) / (edge * .22); emit(cur, i, min(f, 1. - t), 0u); emit(nxt, i, min(f, t), 1u); }
  else { emit(cur, i, f, 0u); }
}
`;

// vertex stage shared by all instanced geometry
const W_SCENE_VS = W_COMMON + W_INST + /*wgsl*/`
@group(0) @binding(0) var<uniform> view: View;
@group(0) @binding(1) var sRep: sampler;
@group(0) @binding(2) var sLin: sampler;
@group(0) @binding(3) var<storage, read> inst: array<Inst>;
@group(0) @binding(4) var<storage, read> vis: array<u32>;
@group(0) @binding(5) var tNoiseA: texture_2d<f32>;
@group(0) @binding(6) var tNoiseN: texture_2d<f32>;
@group(0) @binding(7) var tLeaf: texture_2d<f32>;
@group(0) @binding(8) var tMap: texture_2d<f32>;
@group(0) @binding(9) var tLand: texture_2d<f32>;
struct VI { @location(0) pos: vec3f, @location(1) nrm: vec4f, @location(2) ext: vec4f, @builtin(instance_index) ii: u32 }
struct VO {
  ${INV}@builtin(position) clip: vec4f, @location(0) wp: vec3f, @location(1) n: vec3f, @location(2) uv: vec3f, @location(3) ao: f32,
  @location(4) tint: vec4f, @location(5) @interpolate(flat) mi: vec2u, @location(6) lp: vec3f, @location(7) @interpolate(flat) q: vec4f, @location(8) @interpolate(flat) sc: vec4f,
}
// gentle west breeze: plants lean in slow waves that travel across the city
fn sway(wp: vec3f, h: f32, ph: f32, leaf: bool) -> vec3f {
  let t = view.cam.w; let g = dot(wp.xz, vec2f(.05, .021)) - t * .55;
  let b = sq(min(abs(h), 22.) / 13.) * (.16 + .13 * sin(g) + .06 * sin(g * 2.3 + 1.7));
  var o = vec3f(b * .94, -b * b * .04, b * .34);
  if (leaf) { let f = sin(t * 2.6 + ph * 43. + wp.x * .9 + wp.z * .7) * .022 * sat(abs(h) * .4); o += vec3f(f, f * .6, -f * .7); }
  return o * view.misc.w;
}
// sea swell: four trains from the south-west (xy wave vector, z height, w angular speed), each faded where the mesh
// (vertex) or pixel (fragment) can't resolve it. Returns height and slope.
const SEAW = array<vec4f, 4>(vec4f(.159, -.092, .2, 1.34), vec4f(.15, -.26, .12, 1.72), vec4f(.473, .082, .065, 2.17), vec4f(.157, -.77, .035, 2.77));
fn seaWave(p: vec2f, fade: vec4f) -> vec3f {
  var o = vec3f(0.); let t = view.cam.w; let calm = .1; // a river: barely a swell
  for (var k = 0; k < 4; k++) { let w = SEAW[k]; let ph = dot(w.xy, p) - w.w * t; let a = w.z * fade[k] * calm; o += vec3f(a * sin(ph), w.xy * (a * cos(ph))); }
  return o;
}
fn transform(v: VI) -> VO {
  let e = vis[v.ii]; let it = inst[e & 0xffffffu];
  let mat = u32(v.ext.x * 255. + .5);
  let s = vec3f(it.p.w, it.p.w * it.sy, it.p.w);
  var lp = v.pos * s;
  var q = it.q; var org = it.p.xyz;
  if(mat==29u){org.y+=view.look7.y*3.4;}
  if(mat==30u){let a=-.95*view.look7.z;lp.y-=2.1;q=qmul(q,vec4f(0.,0.,sin(a*.5),cos(a*.5)));org+=qrot(it.q,vec3f(0.,2.1,0.));}
  if(mat==25u){
    let sd=f32(it.tint>>24u)/255.;let t=view.cam.w;let a=t*.22+floor(it.p.z/80.)*.9;
    org+=vec3f(3.5*sin(a),.15*sin(t*.8+sd*6.),2.5*cos(a));
    let yaw=atan2(5.*sin(a),7.*cos(a));q=vec4f(0.,sin(yaw*.5),0.,cos(yaw*.5));
    lp.z+=sin(t*7.+sd*6.-v.pos.x*4.)*(.05+.16*sat(-v.pos.x))*it.p.w;
  }
  if(mat==24u){let t=view.cam.w;lp.x+=sin(t*4.+org.x)*lp.y*.08;lp.z+=cos(t*3.3+org.z)*lp.y*.07;lp.y*=.85+.15*sin(t*8.+org.x);}
  if (mat == 0u && v.ext.w > .99) {
    // podium crystals hover and turn on their own slow clocks (misc.w = 0 while baking shadows: middle height)
    let ph = org.x * .37 + org.z * .61; let t = view.cam.w * view.misc.w; let h = (t * .11 + ph) * .5;
    org.y += .85 + .5 * sin(t * .8 + ph) * view.misc.w; q = qmul(q, vec4f(0., sin(h), 0., cos(h)));
  }
  var wp = org + qrot(q, lp);
  if (mat == 17u) {
    // the sea's rings follow the camera; each train fades where the rings get too coarse
    wp = vec3f(lp.x + view.lodc.x, 0., lp.z + view.lodc.z);
    wp.y = seaWave(wp.xz, clamp(vec4f(2.) - length(lp.xz) * ${((SEA_GROW - 1) * SEAK).toFixed(4)} * vec4f(.1765, .2857, .4615, .75), vec4f(0.), vec4f(1.))).x;
  }
  if (mat == 7u || mat == 11u || mat >= 32u) { wp += sway(wp, lp.y, v.ext.w, mat >= 32u) * select(1., .28, mat == 42u); }
  var n = qrot(q, v.nrm.xyz / s);
  if (mat == 8u) {
    // hovering craft loop around the rings; moored ones only bob
    let sd = f32(it.tint >> 24u) / 255.; let r = length(it.p.xz); let t = view.cam.w;
    if (r < 450.) { let a = t * (5. + 5. * sd) / r * (1. + .3 * sin(t * .05 + sd * 20.)) * view.misc.w; let c = cos(a); let sn = sin(a); wp = vec3f(wp.x * c - wp.z * sn, wp.y, wp.x * sn + wp.z * c); n = vec3f(n.x * c - n.z * sn, n.y, n.x * sn + n.z * c); }
    wp.y += sin(t * .7 + sd * 40.) * .22 * view.misc.w;
  }
  var o: VO;
  o.clip = view.vp * vec4f(wp, 1.);if(mat==23u&&view.look5.x<.5){o.clip=vec4f(2.,2.,2.,1.);} o.wp = wp; o.n = n; o.uv = v.ext.yzw; o.ao = v.nrm.w;
  o.tint = unpack4x8unorm(it.tint); o.mi = vec2u(mat, e >> 24u); o.lp = v.pos; o.q = q; o.sc = vec4f(s, it.rad);
  // Low: LODs swap at mid-fade instead of dissolving; the hidden one collapses to a point here, so no fragment shader
  // needs a discard (phone GPUs only reject hidden fragments early for shaders that never discard)
  if (LV > 1) { if (((e >> 24u) & 127u) < 64u) { o.clip = vec4f(2., 2., 2., 1.); } o.mi.y = 127u; }
  return o;
}
@vertex fn vs(v: VI) -> VO { return transform(v); }
// is this a vine tile (foliage lying on a surface)?
fn onWall(tile: u32) -> bool { return tile == 6u || tile == 8u || tile == 9u; }
// how much of a leaf card counts at uv: crowns fade over the outer quarter, vines all but a thin margin
fn cardRim(uv: vec2f, tile: u32) -> f32 { let q = abs(uv - .5) * 2.; return 1. - ss(select(.72, .95, onWall(tile) || tile >= 10u), 1., max(q.x, q.y)); }
// card uv in the atlas (4 x 3 tiles with a thin margin)
fn atlasUV(tile: u32, uv: vec2f) -> vec2f { return (vec2f(f32(tile % 4u), f32(tile / 4u)) + uv * .98 + .01) / vec2f(4., 3.); }
`;

// shadow casters (depth only)
const W_SHADOW = W_SCENE_VS + /*wgsl*/`
// foliage casts by coverage: the atlas is read near the mip matching the shadow texel, so the cutout becomes the
// sprig's soft shape and doesn't crawl in the wind
@fragment fn fsLeaf(i: VO) {
  let tile = max(i.mi.x, 32u) - 32u;
  // mip chosen by hand for one trilinear tap (the shared sampler is anisotropic, wasted here)
  let lv = max(log2(max(length(dpdx(i.uv.xy)), length(dpdy(i.uv.xy))) * ${502 * LEAFPX / 512}.) - .7, 0.);
  let a = textureSampleLevel(tLeaf, sLin, atlasUV(tile, i.uv.xy), lv).a * cardRim(i.uv.xy, tile);
  if (i.mi.x >= 32u && a < select(.27, .36, onWall(tile))) { discard; }
  // LOD cross-fade with the G-buffer's dither, fixed to map texels so the filter blends it
  let fb = i.mi.y;
  if ((fb & 127u) != 127u) { let f = f32(fb & 127u) / 127.; let d = fract(dot(floor(i.clip.xy), vec2f(.7548777, .5698403))); if ((fb & 128u) != 0u) { if (d < 1. - f) { discard; } } else if (d >= f) { discard; } }
}
// crystal and glass cast a checkerboard the soft filter turns into a pale shadow
@fragment fn fsCrystal(i: VO) { let p = vec2u(i.clip.xy); if (((p.x + p.y) & 1u) == 0u) { discard; } }
@fragment fn fsGlass(i: VO) { let p = vec2u(i.clip.xy); if ((p.x & 1u) + (p.y & 1u) != 0u) { discard; } }
`;

// materials: fills the G-buffer
const W_GBUF =W_SCENE_VS + /*wgsl*/`
override REFL = false; // the mirror view drops everything below the water
struct GO { @location(0) a: vec4f, @location(1) n: vec4f, @location(2) m: vec4f }
struct Mt { alb: vec3f, rough: f32, metal: f32, inlay: f32, nb: vec3f, trans: f32 }
// triplanar noise: seamless on any wall, detail fades with the mips
fn triW(n: vec3f) -> vec3f { var w = pow(abs(n), vec3f(6.)); return w / (w.x + w.y + w.z); }
fn tri(t: texture_2d<f32>, p: vec3f, dx: vec3f, dy: vec3f, w: vec3f, s: f32) -> vec4f {
  var c = vec4f(0.);
  if (w.x > .02) { c += w.x * textureSampleGrad(t, sRep, p.zy * s, dx.zy * s, dy.zy * s); }
  if (w.y > .02) { c += w.y * textureSampleGrad(t, sRep, p.xz * s, dx.xz * s, dy.xz * s); }
  if (w.z > .02) { c += w.z * textureSampleGrad(t, sRep, p.xy * s, dx.xy * s, dy.xy * s); }
  return c;
}
// bump from the slope texture (rg or ba) as a world-space tilt
fn triN(p: vec3f, dx: vec3f, dy: vec3f, w: vec3f, s: f32, rock: bool) -> vec3f {
  var o = vec3f(0.);
  if (w.x > .02) { let c = textureSampleGrad(tNoiseN, sRep, p.zy * s, dx.zy * s, dy.zy * s); let g = select(c.rg, c.ba, rock) - .5; o += w.x * vec3f(0., g.y, g.x); }
  if (w.y > .02) { let c = textureSampleGrad(tNoiseN, sRep, p.xz * s, dx.xz * s, dy.xz * s); let g = select(c.rg, c.ba, rock) - .5; o += w.y * vec3f(g.x, 0., g.y); }
  if (w.z > .02) { let c = textureSampleGrad(tNoiseN, sRep, p.xy * s, dx.xy * s, dy.xy * s); let g = select(c.rg, c.ba, rock) - .5; o += w.z * vec3f(g.x, g.y, 0.); }
  return o;
}
// coverage of a line (half width hw, distance d) for a pixel fw wide: thin lines fade instead of aliasing
fn line(d: f32, hw: f32, fw: f32) -> f32 { return sat((min(d + fw * .5, hw) - max(d - fw * .5, -hw)) / fw); }
const MARB = vec3f(.88, .83, .74);
var<private> gVein: f32; // how veined the last marble() sample was
fn marble(p: vec3f, dx: vec3f, dy: vec3f, w: vec3f, off: vec3f) -> vec4f { // rgb colour factor, a grain
  let A = tri(tNoiseA, p + off, dx, dy, w, .21); let B = tri(tNoiseA, p, dx, dy, w, 1.9); let C = tri(tNoiseA, p + off.zxy, dx, dy, w, .047);
  let v = A.b * .85 + .15 * ss(.5, .75, B.b); gVein = v;
  var c = vec3f(1. - .07 * (C.r - .5) - .05 * (A.r - .5) - .03 * (B.a - .5));
  c = mix(c, vec3f(.62, .65, .7), v * .4);
  c *= mix(vec3f(1.), vec3f(1.03, 1., .95), ss(.4, .65, C.r)); // warm and cool drifts
  return vec4f(c, B.a);
}
// polished paving, 2 m modules in a grid; inlay: gold squares round the pyramid, lapis bands edged with gold along the
// avenues
fn pave(p: vec3f, dx: vec3f, dy: vec3f, fw: f32, n: vec3f) -> Mt {
  let g = p.xz / 2.; let f = min(fract(g), 1. - fract(g)) * 2.; let jd = min(f.x, f.y); let cell = floor(g);
  let hs = h22(cell + 3.);
  let w = triW(n); let m = marble(p, dx, dy, w, vec3f(hs.x, 0., hs.y) * 40.);
  var o: Mt; o.alb = vec3f(.87, .78, .63) * m.rgb * (.93 + .14 * hs.x); o.rough = .14 + .12 * m.a + .08 * hs.y; o.metal = 0.; o.trans = 0.;
  o.nb = triN(p, dx, dy, w, 2.3, false) * .035;
  o.alb = mix(o.alb, o.alb * vec3f(.78, .72, .66), gVein * .4);
  let j = line(jd, .005, fw); o.alb *= 1. - .5 * j; o.rough = mix(o.rough, .7, j);
  let ax = abs(p.x); let az = abs(p.z); let sq = max(ax, az); var il = 0.; var lap = 0.;
  if (sq < 110.) { il = max(il, line(min(abs(sq - 84.), abs(sq - 103.)), .07, fw)); il = max(il, line(abs(sq - 75.5), .05, fw)); }
  let ew = az < 10.6 && ax > 104.; let ns = ax < 10.6 && az > 104.;
  if (ew || ns) {
    let lat = select(ax, az, ew); il = max(il, line(min(min(abs(lat - 3.05), abs(lat - 4.95)), lat), .06, fw));
    lap = ss(3.1, 3.2, lat) * (1. - ss(4.8, 4.9, lat));
    // a lotus in the band every 2 m
    let al = select(az, ax, ew); let u = fract(al / 2.) - .5; let q = vec2f(u * 2., (lat - 4.) / .8);
    let pet = length(q) - .55 * (.5 + .5 * abs(cos(2.5 * atan2(q.y, q.x)))); il = max(il, lap * (1. - ss(-fw, fw, pet)) * sat(1. - fw / .1));
  }
  o.alb = mix(o.alb, vec3f(.05, .08, .3) * (.85 + .3 * m.a), lap * (1. - il)); o.rough = mix(o.rough, .2, lap);
  o.inlay = il; o.alb = mix(o.alb, vec3f(.95, .68, .25), il); o.metal = il * .45; o.rough = mix(o.rough, .34, il);
  return o;
}
// city ground: paving where the map says, else lawn, beds and flagstone paths
fn ground(p: vec3f, dx: vec3f, dy: vec3f, fw: f32, n: vec3f) -> Mt {
  let muv = p.xz / 2048. + .5; let mp = textureSampleGrad(tMap, sLin, muv, dx.xz / 2048., dy.xz / 2048.);
  let w = vec3f(0., 1., 0.);
  let A = tri(tNoiseA, p, dx, dy, w, .45); let B = tri(tNoiseA, p, dx, dy, w, 2.7);
  let edge = (A.r - .5) * .5 + (B.a - .5) * .25;
  if (mp.r + edge * .3 > .5) { return pave(p, dx, dy, fw, n); }
  var o: Mt; o.metal = 0.; o.inlay = 0.; o.trans = 0.;
  let C = tri(tNoiseA, p, dx, dy, w, .06);
  o.alb = mix(vec3f(.07, .115, .035), vec3f(.15, .18, .06), ss(.3, .7, C.r + (A.g - .3) * .4)) * (.7 + .6 * B.a) * (.85 + .3 * A.a); o.rough = .85;
  o.nb = triN(p, dx, dy, w, 1.4, true) * .5;
  // planting beds: dark soil
  let bed = ss(.42, .58, mp.g + edge); o.alb = mix(o.alb, mix(vec3f(.15, .11, .075), vec3f(.07, .11, .04), ss(.4, .6, A.r)) * (.6 + .8 * B.a), bed);
  // paths: pale flagstones, grass in the gaps
  let path = ss(.3, .7, mp.b + edge * 1.1);
  if (path > 0.) {
    let cl = tri(tNoiseA, p, dx, dy, w, .9).g; let st = ss(.035, .09, cl) ; let m = marble(p, dx, dy, w, vec3f(0.));
    let stone = vec3f(.7, .66, .58) * m.rgb * (.85 + .3 * A.r);
    o.alb = mix(o.alb, mix(o.alb * .8, stone, st), path); o.rough = mix(o.rough, mix(.9, .5, st), path); o.nb = mix(o.nb, o.nb * .3, path * st);
  }
  return o;
}
// land beyond the canals: pasture, fields, tracks, limestone, forest floor, river banks, beaches, sea bed.
// tv (meshTerrain): steepness, river proximity, hollow or crest.
fn terrain(p: vec3f, dx: vec3f, dy: vec3f, fw: f32, n: vec3f, tv: vec3f) -> Mt {
  var o: Mt; o.metal = 0.; o.inlay = 0.; o.trans = 0.;
  let w = triW(n); let r = length(p.xz); let th = atan2(p.z, p.x); let h = p.y; let up = vec3f(0., 1., 0.);
  // noise at five scales: R 80 m, L 20 m, M 5 m, A 1 m, B grain
  let R = tri(tNoiseA, p, dx, dy, up, .0031); let L = tri(tNoiseA, p, dx, dy, up, .011); let M = tri(tNoiseA, p, dx, dy, up, .047);
  let A = tri(tNoiseA, p, dx, dy, w, .19); let B = tri(tNoiseA, p, dx, dy, w, 1.6);
  let nlx = 600. + 34. * sin(p.z / 640. + .6) + 18. * sin(p.z / 230. + 2.1); let north = 0.;
  let dk = max(ss(-470., -640., p.x + 60. * sin(p.z / 210.) + 30. * sin(p.z / 77.)), ss(1300., 1700., p.x - nlx - 480. + 80. * sin(p.z / 300.)));
  let steep = tv.x * .64; let wet = tv.y; let hollow = tv.z * 2. - 1.;
  // limestone: pale, bedded (broad layers far, finer close), cracked, water-stained, ochre in places
  let st = mix(.5, sin(h * .23 + A.r * 5. + L.r * 14.) * .5 + .5, sat(1. - fw / 2.5) * .7);
  let beds = sin(h * .085 + L.r * 7. + L.g * 3.) * .5 + .5; let bed2 = ss(.35, .65, sin(h * .31 + L.r * 11. + A.r * 2.) * .5 + .5);
  let sq3 = vec3f(1., .13, 1.); let stain = tri(tNoiseA, p * sq3, dx * sq3, dy * sq3, w, .21).r;
  var rock = vec3f(.74, .5, .37) * (.72 + .08 * st + .16 * beds + .06 * bed2 + .2 * (A.b - .3)) * (.85 + .3 * B.a);
  rock = mix(rock, vec3f(.42, .26, .18), .32 * ss(.5, .72, stain + (M.r - .5) * .3) * ss(.25, .45, 1. - n.y) * ss(.35, .6, L.r + R.g * .4));
  rock = mix(rock, vec3f(.84, .6, .38), .14 * ss(.5, .8, L.g + R.r * .5));
  rock *= 1. - .35 * ss(.5, .8, A.b) * sat(1. - fw / 1.5);
  // finer bedding: ledges ~1 m apart with shade lines (and their tilt, below)
  let ledge = h * .9 + L.r * 9. + A.r * 1.2; let lk = sat(1. - fw / 2.5); rock *= 1. - .12 * ss(.55, .95, sin(ledge) * .5 + .5) * lk;
  // relief from three sizes of fractured rock (up to 14 m) and the ledges: a face's crags
  let rn = triN(p, dx, dy, w, .07, true) * 1.7 + triN(p, dx, dy, w, .33, true) * 1.6 + triN(p, dx, dy, w, 2.1, true) * .5 + vec3f(0., cos(ledge) * .4 * lk, 0.);
  // grass: lush in hollows and by the river, dry gold on crests, tussock patches, worn earth, flowers up close
  let dry = sat(.5 + (R.r - .5) * 1.8 + (L.r - .5) * .9 + (M.r - .5) * .35 - hollow * .5 - wet * .7);
  var grass = mix(vec3f(.055, .115, .03), vec3f(.21, .2, .075), dry);
  grass = mix(grass, vec3f(.04, .085, .028), ss(.38, .8, M.r + (L.g - .35) * .6 + (A.r - .5) * .4) * .4);
  grass *= (.7 + .6 * A.a) * (.72 + .56 * B.a);
  grass = mix(grass, vec3f(.21, .16, .105) * (.7 + .6 * B.a), ss(.66, .82, M.b + (A.r - .5) * .35) * (.2 + .5 * dry));
  grass = mix(grass, mix(vec3f(.72, .7, .62), vec3f(.75, .58, .12), step(.5, B.r)), ss(.15, .08, A.g) * ss(.5, .68, M.r + (L.g - .3) * .5) * sat(1. - fw / .05));
  grass = mix(grass, vec3f(.26, .25, .13), ss(240., 520., h + L.r * 200.) * .7);
  // farmland from the load-time maps (world.js): tMap r track, g wide rows, b verge, a tilled; tLand rgb crop colour,
  // a earth between rows. Rows follow the rings; far away they average out.
  let muv = p.xz / 2048. + .5; var mp = vec4f(0.); var crop = vec4f(.3, .4, .2, 0.);
  if (max(abs(muv.x - .5), abs(muv.y - .5)) < .5) { mp = textureSampleGrad(tMap, sLin, muv, dx.xz / 2048., dy.xz / 2048.); crop = textureSampleGrad(tLand, sLin, muv, dx.xz / 2048., dy.xz / 2048.); }
  let field = ss(.35, .6, mp.a + (A.r - .5) * .25) * (1. - ss(.1, .2, steep));
  let wob = L.r * 2.5 + (A.r - .5) * .35;
  let row = mix(mix(.5, ss(.3, .7, sin(r * 4.488 + wob) * .5 + .5 + (B.r - .5) * .5), sat(1. - fw / .45)), mix(.5, ss(.3, .7, sin(r * 2.244 + wob) * .5 + .5 + (B.r - .5) * .4), sat(1. - fw / .9)), mp.g);
  let earth = vec3f(.24, .175, .115) * (.72 + .56 * B.a) * (.85 + .3 * A.a);
  let plant = crop.rgb * crop.rgb * (.74 + .52 * A.a) * (.8 + .4 * B.a) * (.9 + .2 * M.r);
  o.alb = mix(grass, mix(plant, earth, crop.a * (1. - row)), field); o.rough = .88; o.nb = triN(p, dx, dy, w, 1.4, true) * .5;
  // verge: rank darker grass; track: pale trodden earth
  o.alb = mix(o.alb, grass * vec3f(.66, .78, .62), mp.b * .8);
  let track = ss(.35, .6, mp.r + (A.r - .5) * .4 + (M.r - .5) * .2);
  o.alb = mix(o.alb, mix(vec3f(.43, .37, .28), vec3f(.52, .49, .43), ss(.2, .1, B.g)) * (.72 + .5 * B.a) * (.85 + .3 * A.a), track * .9);
  // forest floor under the mountain woods
  let wood = north * ss(25., 60., h) * (1. - ss(260., 430., h + L.r * 160.)) * ss(.3, .5, L.r + A.r * .3);
  o.alb = mix(o.alb, vec3f(.035, .07, .028) * (.6 + .8 * B.a), wood * .9);
  // gravel and pebbles by and in the river
  o.alb = mix(o.alb, mix(vec3f(.17, .15, .08), vec3f(.05, .1, .03), ss(.34, .14, A.g)) * (.7 + .5 * B.a), ss(.6, .82, wet + (A.r - .5) * .35 + (M.r - .5) * .25));
  // rock where steep or above the grass line, with an edge ragged at every scale (a soft gradient reads as haze)
  let mtn = ss(60., 200., h); let edge = mix(.2, .3, mtn);
  let rq = steep + (A.r - .5) * .15 + (M.r - .5) * .2 + (L.r - .5) * .22 * mtn + (B.a - .5) * .05 - hollow * .04;
  let rk = max(ss(edge - .02, edge + .02, rq), ss(360., 600., h + L.r * 220.) * .8);
  // scree on nearly-steep slopes
  let scree = ss(edge - .09, edge - .03, rq) * (1. - rk) * ss(.4, .2, A.g) * mtn;
  o.alb = mix(o.alb, vec3f(.5, .47, .41) * (.7 + .5 * B.a), scree * .8);
  o.alb = mix(o.alb, rock, rk); o.rough = mix(o.rough, .8, rk); o.nb = mix(o.nb, rn, rk);
  // the desert: fine sand with ripples, pale on crests, warmer in hollows; sandstone where steep
  if (dk > 0.) {
    let ph = (p.x * .9 + p.z * .38) * 2.6 + M.r * 6. + A.r * 2.; let rf = sat(1. - fw / .4);
    var sand = mix(vec3f(.48, .29, .14), vec3f(.66, .45, .25), ss(.3, .8, L.r + (R.g - .5) * .6 - hollow * .3)) * (.9 + .12 * B.a);
    sand *= 1. + .05 * sin(ph) * rf;
    let sk = dk * (1. - rk);
    o.alb = mix(o.alb, sand, sk); o.rough = mix(o.rough, .92, sk);
    o.nb = mix(o.nb, vec3f(.9, 0., .35) * cos(ph) * .1 * rf + triN(p, dx, dy, w, 1.4, true) * .12, sk);
  }
  // shore: wet rock and sand, then the sea bed with weed
  let sand = vec3f(.6, .56, .46) * (.8 + .4 * B.a);
  let shore = 1. - ss(.3, 2.2, h + (A.r - .5) * 1.5);
  o.alb = mix(o.alb, mix(sand, rock * .8, ss(.4, .62, A.g + L.r * .6 + rk)), shore * (1. - wet));
  if (h < .3) { let dk = ss(.3, -.4, h); o.alb *= mix(1., .62, dk); o.rough = mix(o.rough, .3, dk * ss(-.5, .3, h)); o.alb = mix(o.alb, vec3f(.05, .09, .05), ss(.5, .75, L.g * .5 + A.r) * ss(-.5, -3., h) * .8); }
  return o;
}
// six Egyptian signs as signed distances in a unit cell (q in -.5..5): ankh, djed, eye, sun disc, scarab, lotus
fn glyphD(q: vec2f, k: u32) -> f32 {
  var d = 1e3;
  if (k == 0u) { d = min(abs(length(vec2f(q.x, (q.y - .2) * 1.3)) - .1) - .035, max(abs(q.x) - .035, abs(q.y + .12) - .22)); d = min(d, max(abs(q.y - .07) - .035, abs(q.x) - .16)); } // ankh
  else if (k == 1u) { d = max(abs(q.x) - .06, abs(q.y) - .34); d = min(d, max(max(abs(q.x) - .17, abs(q.y - .22) - .12), .25 - abs(fract(q.y * 14.) - .5) * 1.)); } // djed
  else if (k == 2u) { d = abs(length(q * vec2f(1., 2.6)) - .26) - .03; d = min(d, length(q) - .07); d = min(d, max(abs(q.x + .08) - .03, abs(q.y + .2) - .1)); } // eye
  else if (k == 3u) { d = length(q - vec2f(0., .05)) - .17; d = min(d, max(abs(q.y + .2) - .03, abs(q.x) - .3)); } // sun disc
  else if (k == 4u) { d = length(q * vec2f(1.9, 1.25)) - .26; d = max(d, -max(abs(q.x) - .012, abs(q.y) - .3)); d = min(d, max(abs(q.y + .02) - .02, abs(q.x) - .3)); } // scarab
  else { let pq = vec2f(q.x, q.y + .1); d = length(pq) - .3 * (.4 + .6 * abs(sin(atan2(pq.y, pq.x) * 1.5))); d = max(d, -q.y - .3); } // lotus
  return d;
}
const PAINTC = array<vec3f, 8>(vec3f(.045, .075, .3), vec3f(.07, .4, .38), vec3f(.42, .1, .05), vec3f(.6, .4, .14), vec3f(.04, .26, .13), vec3f(.82, .79, .72), vec3f(.03, .03, .03), vec3f(.86, .6, .22));
const FLOWERS = array<vec3f, 8>(vec3f(.52, .08, .24), vec3f(.8, .36, .5), vec3f(.42, .3, .66), vec3f(.26, .32, .66), vec3f(.7, .68, .62), vec3f(.6, .12, .34), vec3f(.52, .4, .72), vec3f(.84, .5, .58));
@fragment fn fs(i: VO) -> GO {
  // all derivatives first, while control flow is uniform
  let p = i.wp; let dx = dpdx(p); let dy = dpdy(p); let fw = max(length(dx), length(dy));
  var N = normalize(i.n); let mat = i.mi.x; let w = triW(N);
  let dnx = dpdx(N); let dny = dpdy(N);
  let tile = max(mat, 32u) - 32u; let luv = atlasUV(tile, i.uv.xy);
  // lux, luy: card uv per pixel in quarter tiles; lg converts to the atlas (three tiles high); lq keeps the cutout
  // distance rule tuned for a 2:1 atlas
  let uvx = dpdx(i.uv.xy); let uvy = dpdy(i.uv.xy);
  let lux = uvx * .245; let luy = uvy * .245; let lq = vec2f(1., 2.); let lg = vec2f(1., 4. / 3.);
  let px = i.clip.xy; let fb = i.mi.y; let nz = select(ign(px + view.jit.z * 5.588),h21(floor(i.wp.xz*12.)+floor(i.wp.y*12.)*vec2f(.31,.73)),mat==7u||mat==21u||mat==22u||mat>=32u);
  if ((fb & 127u) != 127u) { let f = f32(fb & 127u) / 127.; if ((fb & 128u) != 0u) { if (nz < 1. - f) { discard; } } else if (nz >= f) { discard; } }
  if (REFL && i.wp.y < view.jit.w) { discard; }
  var o: Mt; o.metal = 0.; o.inlay = 0.; o.trans = 0.; o.nb = vec3f(0.); o.rough = .5; o.alb = vec3f(.8);
  var ao = i.ao; var glass = 0.;
  if (mat >= 32u) {
    // leaves: crisp atlas cutout (TAA smooths the edges), threshold dropping with distance so far crowns keep density.
    // Nothing may depend on view angle: edge-on fades made whole sprays vanish.
    let c = textureSampleGrad(tLeaf, sLin, luv, lux * lg, luy * lg);
    let v = i.uv.z; let tn = i.tint.rgb * i.tint.rgb; var petal: vec3f;
    if (onWall(tile)) {
      // vine; the distance rule takes the finer screen direction (a slanted card is not a far one)
      let lod = max(0., .5 * log2(min(dot(lux * lq, lux * lq), dot(luy * lq, luy * lq)) * 4194304.));
      if (c.a * cardRim(i.uv.xy, tile) < .5 - .05 * min(lod, 4.)) { discard; }
      // tone and tilt per leaf (atlas b), not per card, or dense cards show as flat plates
      o.alb = tn * (.4 + .9 * c.r) * mix(vec3f(1.16, 1.05, .78), vec3f(.8, .94, 1.03), c.b) * (.92 + .16 * fract(v * 7.31));
      petal = FLOWERS[u32(i.tint.a * 255. + .5) & 7u] * (.75 + .6 * c.r) * (.82 + .36 * c.b); o.rough = .42;
      // the plant's normal gives volume; each leaf tips out of the card plane its own way, so sun and sheen pick out leaves
      let gl = cross(dx, dy); var gn = gl * inverseSqrt(max(dot(gl, gl), 1e-24)); if (dot(gn, N) < 0.) { gn = -gn; }
      let t1 = normalize(cross(gn, vec3f(.31, .9, .29)) + vec3f(1e-4, 0., 0.)); let t2 = cross(gn, t1); let la = c.b * 25.;
      o.nb = -(.2 * gn + .34 * (t1 * cos(la) + t2 * sin(la)));
    } else {
      // crown: one tone per card, shaded with the crown's normal
      let lod = max(0., .5 * log2(max(dot(lux * lq, lux * lq), dot(luy * lq, luy * lq)) * 4194304.));
      if (c.a * cardRim(i.uv.xy, tile) < .5 - .05 * min(lod, 4.) - ${LEAFT}) { discard; }
      o.alb = tn * (.55 + .75 * c.r) * mix(vec3f(1.12, 1.03, .85), vec3f(.85, .97, 1.02), v);
      petal = FLOWERS[u32(i.tint.a * 255. + .5) & 7u] * (.75 + .6 * c.r) * (.85 + .3 * v); o.rough = .5;
    }
    if (c.g > .5) { o.alb = petal; o.trans = .4; } else { o.trans = .75; }
  } else if(mat==24u){o.alb=vec3f(1.,.35,.035);o.rough=1.;glass=1.;}
  else if(mat==25u){
    let stripe=.85+.15*sin(i.lp.x*14.+i.uv.x*255.);
    o.alb=i.tint.rgb*i.tint.rgb*stripe*mix(vec3f(.8,.88,.8),vec3f(1.25,1.2,1.1),sat(N.y*.5+.5));
    if(i.uv.y>.5){o.alb=vec3f(.006);}
    o.metal=.25;o.rough=.42;
  }else if(mat==26u){
    let q=i.lp.xz;let r=length(q);let a=atan2(q.y,q.x);
    let lotus=abs(r-(1.55+.35*cos(a*8.)));let ring=abs(r-2.55);
    let motif=1.-ss(.04,.08+fw,min(lotus,ring));
    let tiles=min(fract(q.x*5.),fract(q.y*5.));let grout=ss(.02,.07,tiles);
    o.alb=mix(vec3f(.09,.38,.28),vec3f(.84,.65,.25),motif)*(.72+.28*grout);o.rough=.55;
  }else if(mat==31u){
    let kind=u32(i.uv.x*255.+.5);let A=tri(tNoiseA,p,dx,dy,w,1.2);
    if(kind==1u){let along=select(p.x,p.z,abs(N.x)>.5);let seam=1.-ss(.015,.045,min(fract(along/.6),1.-fract(along/.6))*.6);o.alb=vec3f(.19,.105,.045)*(.8+.4*A.g)*(1.-.45*seam);o.rough=.83;}
    else if(kind==2u){let q=fract(i.lp.xy*3.)-.5;let edge=max(abs(q.x),abs(q.y));let diamond=1.-ss(.27,.31,abs(q.x)+abs(q.y));o.alb=mix(vec3f(.045,.25,.18),vec3f(.58,.72,.57),diamond);o.alb*=.65+.35*(1.-ss(.44,.49,edge));o.rough=.28;o.metal=.12;}
    else{o.alb=mix(vec3f(.4,.22,.09),vec3f(.06,.24,.17),ss(.35,.7,A.g));o.metal=.7;o.rough=.6;}
  }else if(mat==29u){o.alb=vec3f(.64,.47,.28)*(.92+.08*sin(p.y*8.));o.rough=.8;}
  else if(mat==30u){o.alb=vec3f(.55,.34,.09);o.metal=.7;o.rough=.4;}
  else if(mat==28u){o.alb=vec3f(.003,.006,.005);o.rough=.4;}
  else if(mat==27u){
    let u=select(p.z,p.x,abs(N.z)>.5)/1.45;let v=p.y/1.65;
    let q=vec2f(fract(u)-.5,fract(v)-.5);let k=u32(h21(vec2f(floor(u),floor(v)))*6.);
    let d=glyphD(q,k);let aa=max(fw,.008);let mark=1.-ss(-aa,aa,d);
    o.alb=mix(vec3f(.53,.4,.24),vec3f(.34,.22,.075),mark);
    o.alb*=1.-.4*(1.-ss(.005,.04,abs(d)));o.metal=.12+.45*mark;o.rough=.68-.28*mark;
  }else if (mat == 21u) {
    // Broad continuous leaf; veins are shading only, derivative filtered, never holes.
    let q=i.uv.xy; let v=q.y*10.+abs(q.x-.5)*3.; let fwv=max((abs(uvx.y)+abs(uvy.y))*10.+(abs(uvx.x)+abs(uvy.x))*3.,.02);
    let vein=1.-ss(.03,.03+fwv,abs(fract(v)-.5));
    let ridge=1.-ss(.015,.05+abs(uvx.x)+abs(uvy.x),abs(q.x-.5));
    o.alb=i.tint.rgb*i.tint.rgb*(.68+.3*q.y+.08*i.uv.z)*mix(vec3f(.9,1.,.72),vec3f(1.05,1.,.8),q.y)*(1.-.12*vein+.09*ridge);
    o.rough=.82;o.trans=.25;
  } else if(mat==23u){
    let A=tri(tNoiseA,p,dx,dy,w,2.);let marker=i.uv.x>.002;
    o.alb=select(vec3f(.29,.32,.19),vec3f(.08,.28,.17),marker)*(.75+.45*A.r);o.rough=.88;
    if(marker&&N.y>.5){let q=vec2f((i.lp.x-.3)/.75,(i.lp.z-1.7)/.8);let cut=1.-ss(-fw,fw,glyphD(q,0u));o.alb*=1.-.45*cut;}
  }
  else if (mat == 0u || mat == 4u || mat == 9u) {
    // marble: honed walls in courses, smooth trim, quay walls with a waterline
    let m = marble(p, dx, dy, w, vec3f(0.));
    o.alb = MARB * m.rgb; o.rough = select(.47, .3, mat == 9u) + .12 * (m.a - .5); o.nb = triN(p, dx, dy, w, 2.3, false) * .06;
    if (mat != 9u) {
      let wall = 1. - abs(N.y); let cy = p.y / .62; let j = line(min(fract(cy), 1. - fract(cy)) * .62, .004, fw) * wall;
      let ax = select(p.x, p.z, w.x > w.z) / 1.3 + h11(floor(cy)) * 7.; let vj = line(min(fract(ax), 1. - fract(ax)) * 1.3, .004, fw) * wall * ss(.6, .9, max(w.x, w.z));
      o.alb *= (1. - .32 * max(j, vj)) * (.975 + .05 * h21(vec2f(floor(cy), floor(ax))));
    }
    if (mat == 4u) {
      o.alb *= vec3f(.97, .86, .68);
      let d = p.y - select(${WATER}, 0., i.uv.x > .5); let B = tri(tNoiseA, p, dx, dy, w, .8);
      let wet = 1. - ss(.02, .3 + .25 * B.r, d);
      let moss = ss(.5, .0, d - B.r * .5) * ss(.35, .6, B.r * .7 + B.a * .4 + .12 * ss(.3, -.3, d));
      o.alb = mix(o.alb, o.alb * vec3f(.5, .56, .5), wet); o.rough = mix(o.rough, .2, wet);
      o.alb = mix(o.alb, vec3f(.07, .1, .03) * (.6 + .8 * B.a), moss * .85); o.rough = mix(o.rough, .7, moss);
      o.alb = mix(o.alb, vec3f(.2, .25, .19), ss(-.2, -2.5, d) * .6);
    }
  } else if (mat == 1u || mat == 14u) {
    o = pave(p, dx, dy, fw, N);
    if (mat == 14u) {
      o.inlay = 0.;
      // a flight drawn as a ramp (uv.y): a faint line per step, fading below a pixel
      if (i.uv.y > .5) { let sy = p.y / .18; o.alb *= 1. - .3 * line(min(fract(sy), 1. - fract(sy)) * .18, .014, fw * .6); o.rough = max(o.rough, .34); }
    }
  }
  else if (mat == 13u) { o = ground(p, dx, dy, fw, N); }
  else if (mat == 10u) { o = terrain(p, dx, dy, fw, N, i.uv); }
  else if (mat == 2u) {
    let A = tri(tNoiseA, p, dx, dy, w, .33); let B = tri(tNoiseA, p, dx, dy, w, 3.1);
    o.alb = mix(vec3f(.79, .76, .7), i.tint.rgb, .85) * (1. - .08 * (A.r - .5) - .05 * (B.a - .5)); o.rough = .78; o.nb = triN(p, dx, dy, w, 3.3, false) * .2;
  } else if (mat == 3u) { o.alb = vec3f(.86, .6, .22); o.metal = 1.; o.rough = .33; o.inlay = .14; } // gold answers the pulse a little
  else if (mat == 5u) {
    let g = p.xz / 1.5; let f = min(fract(g), 1. - fract(g)) * 1.5; let A = tri(tNoiseA, p, dx, dy, w, .31); let B = tri(tNoiseA, p, dx, dy, w, 1.7);
    // canal floor slabs barely differ, or their grid shows through the water
    o.alb = mix(vec3f(.66, .64, .57), vec3f(.74, .7, .58), A.r) * (.82 + .3 * B.a) * (1. - .16 * line(min(f.x, f.y), .015, fw)) * (.98 + .04 * h21(floor(g))); o.rough = .6; o.nb = triN(p, dx, dy, w, 1.1, true) * .35;
  } else if (mat == 6u) {
    // window glass: the dim warm room behind; the lighting pass adds the Fresnel reflection (last G-buffer channel = glass)
    glass = 1.; o.rough = .05; o.alb = vec3f(.05, .046, .042);
    if (i.uv.z > .002) {
      // a wall window's pane has its own uv (0-1) and random (uv.z); the room is a box behind it, ray-traced in the
      // pane's frame, so it shifts with the camera
      let u = i.uv.xy; let T = normalize(cross(vec3f(0., 1., 0.), N) + vec3f(1e-5, 0., 0.));
      let sg = sign(dot(dx, T) * uvx.x + dot(dy, T) * uvy.x + 1e-12); // which way u runs along the wall
      let E = normalize(p - view.cam.xyz); let ez = max(-dot(E, N), .2);
      let sl = vec2f(dot(E, T) * sg * 1.4, E.y * 1.1) / ez; // ray drift across the room, in pane sizes (the room is deeper than wide)
      var t = 1.; var side = 0; // 0 back wall, 1 side wall, 2 floor or ceiling
      if (abs(sl.x) > 1e-4) { let ts = (select(-.6, 1.6, sl.x > 0.) - u.x) / sl.x; if (ts < t) { t = ts; side = 1; } }
      if (abs(sl.y) > 1e-4) { let tf = (select(-.45, 1.25, sl.y > 0.) - u.y) / sl.y; if (tf < t) { t = tf; side = 2; } }
      let q = u + sl * t; let r = h21(vec2f(floor(i.uv.z * 255. + .5), dot(i.q, vec4f(13.1, 71.7, 31.3, 47.9)))); // rounded: interpolation leaves the number slightly off
      // warm grey walls, darker up and in the corners; a paler floor
      var room = vec3f(.17, .15, .125) * (.55 + .45 * sat(1. - q.y)) * mix(.8, 1.15, r);
      if (side == 1) { room *= .7; } else if (side == 2) { room = select(vec3f(.065, .06, .054), vec3f(.27, .22, .16) * (1.3 - t), sl.y < 0.); }
      else {
        // back wall: a doorway or a picture, by the window's number
        let dq = abs(q - vec2f(.2 + .6 * fract(r * 5.3), .1)); if (r < .45 && dq.x < .16 && dq.y < .62) { room *= .35; }
        let pq = abs(q - vec2f(.25 + .5 * fract(r * 9.1), .62)); if (r > .6 && pq.x < .17 && pq.y < .13) { room = vec3f(.2, .16, .1) * (.6 + .8 * fract(r * 31.)); }
      }
      o.alb = room * (1. - .45 * t);
      // some windows have a half-drawn curtain (folds fade before aliasing)
      let fu = max(abs(uvx.x), abs(uvy.x));
      if (r > .42) {
        let cu = select(u.x, 1. - u.x, fract(r * 3.7) > .5); let cw = (.2 + .22 * fract(r * 13.3)) * (1. + .05 * sin(u.y * 7. + r * 20.) * u.y);
        let fold = .5 + .5 * sin(cu / cw * 16. + r * 40.);
        let cur = vec3f(.5, .46, .4) * mix(vec3f(1.), vec3f(.85, .92, 1.05), fract(r * 23.)) * mix(.8, .62 + .36 * fold, sat(1. - fu / (cw * .12)));
        o.alb = mix(o.alb, cur, 1. - ss(cw - fu, cw + fu, cu));
      }
    }
  } else if (mat == 7u || mat == 22u) {
    let s = vec3f(1., .22, 1.); let A = tri(tNoiseA, i.lp * s, dx * s, dy * s, w, 1.3); let B = tri(tNoiseA, p, dx, dy, w, 4.);
    o.alb = mix(vec3f(.13, .1, .075), vec3f(.3, .27, .22), A.r * A.r * 1.6) * (.6 + .7 * B.a) * (.5 + .5 * i.tint.g); o.rough = .9; o.nb = triN(i.lp * s, dx * s, dy * s, w, 2.2, true) * 1.4;
  } else if (mat == 8u) { o.alb = vec3f(.84, .86, .88); o.metal = 1.; o.rough = .2; }
  else if (mat == 11u) { o.alb = i.tint.rgb * i.tint.rgb * .22; o.rough = .9; o.trans = .2; } // cypress core, planter soil
  else if (mat == 12u) {
    let g = p.xz / .9; let f = min(fract(g), 1. - fract(g)) * .9; let m = marble(p, dx, dy, w, vec3f(0.));
    o.alb = vec3f(.76, .72, .64) * m.rgb * (.95 + .1 * h21(floor(g))) * (1. - .4 * line(min(f.x, f.y), .006, fw)); o.rough = .42; o.nb = triN(p, dx, dy, w, 2.3, false) * .05;
  } else if (mat == 15u) {
    let A = tri(tNoiseA, p, dx, dy, w, .5); let B = tri(tNoiseA, p, dx, dy, w, 2.4);
    o.alb = vec3f(.6, .57, .51) * i.tint.rgb * (.7 + .5 * A.r) * (.8 + .4 * B.a); o.rough = .8; o.nb = triN(p, dx, dy, w, .6, true) * 1.5 + triN(p, dx, dy, w, 3., true) * .5;
    let d = p.y; let wet = 1. - ss(.0, .5, d); o.alb = mix(o.alb, o.alb * .5, wet); o.rough = mix(o.rough, .25, wet); o.alb = mix(o.alb, vec3f(.06, .09, .04), ss(.5, .7, A.g + B.a * .4) * ss(.9, -.2, d));
  } else if (mat == 18u) {
    // painted and inlaid stone: glazed colour, a frieze of symbols (uv.y 1), a star ceiling (.5), stripes (.78)
    let ci = min(u32(i.uv.x * 255. + .5), 7u); let A = tri(tNoiseA, p, dx, dy, w, .7); let B = tri(tNoiseA, p, dx, dy, w, 3.);
    o.alb = PAINTC[ci] * (.9 + .15 * A.r) * (.93 + .1 * B.a); o.rough = .38 + .14 * A.g; o.nb = triN(p, dx, dy, w, 2.3, false) * .03;
    if (ci == 7u) { o.metal = 1.; o.rough = .33; }
    let fl = i.uv.y; var gm = 0.;
    if (fl > .9) {
      let along = select(p.z, p.x, abs(N.z) > abs(N.x)); let u = fract(along / .9); let id = floor(along / .9); let v = i.uv.z;
      let q = vec2f(u - .5, v - .5); let k = u32(h11(id + 7.) * 6.); let aa = fw * 1.6 / .9;
      var d = glyphD(q, k);
      d = min(d, abs(u - .02) * 1.2 - .006);
      gm = (1. - ss(-aa, aa, d)) * ss(.1, .16, v) * ss(.9, .84, v) * sat(1.5 - fw / .06);
    } else if (fl > .7) { gm = ss(.4, .6, abs(fract(p.y * 2.2) - .5) * 2.) * sat(1. - fw / .15); }
    else if (fl > .4) {
      let g = p.xz / .9; let q = fract(g) - .5; let r = length(q); let st = r - .1 * (.55 + .45 * cos(5. * atan2(q.y, q.x) + h21(floor(g)) * 6.));
      gm = (1. - ss(-fw, fw, st * .9)) * sat(1. - fw / .1);
    }
    o.alb = mix(o.alb, vec3f(.95, .7, .28), gm); o.metal = mix(o.metal, .9, gm); o.rough = mix(o.rough, .3, gm);
  } else if (mat == 19u) {
    // golden sandstone in courses, with fine bedding; tinted per instance
    let A = tri(tNoiseA, p, dx, dy, w, .3); let B = tri(tNoiseA, p, dx, dy, w, 2.6); let C = tri(tNoiseA, p, dx, dy, w, .05);
    let bed = sin(p.y * 9. + A.r * 4. + C.r * 9.) * .5 + .5;
    o.alb = vec3f(.8, .64, .43) * i.tint.rgb * (.86 + .14 * bed * sat(1. - fw / .1)) * (.9 + .16 * A.g) * (.9 + .12 * B.a) * mix(vec3f(1.), vec3f(1.04, .97, .9), ss(.4, .7, C.g));
    o.rough = .74; o.nb = triN(p, dx, dy, w, 2.6, true) * .18;
    let wall = 1. - abs(N.y); let cy = p.y / .9; let jy = line(min(fract(cy), 1. - fract(cy)) * .9, .006, fw) * wall;
    let ax = select(p.x, p.z, w.x > w.z) / 1.6 + h11(floor(cy)) * 7.; let jx = line(min(fract(ax), 1. - fract(ax)) * 1.6, .006, fw) * wall * ss(.6, .9, max(w.x, w.z));
    o.alb *= 1. - .3 * max(jy, jx);
    // Slight block-to-block tone and rounded joint shoulders, using the existing course coordinates.
    let blockTone=h21(vec2f(floor(ax),floor(cy)));
    o.alb*=1.+(blockTone-.5)*.13*(1.-ss(.25,1.,fw));
    let vx=fract(ax);let vy=fract(cy);
    let bx=(1.-ss(.012,.08,min(vx,1.-vx)*1.6))*sign(vx-.5);
    let by=(1.-ss(.012,.08,min(vy,1.-vy)*.9))*sign(vy-.5);
    let tangent=select(vec3f(1.,0.,0.),vec3f(0.,0.,1.),w.x>w.z);
    o.nb+=(tangent*bx+vec3f(0.,by,0.))*.16*view.look6.x*wall*(1.-ss(.06,.2,fw));
    if (i.uv.y > .9 && wall > .5) {
      // pylon towers: columns of signs cut into the stone, every 3 m, shaded deeper than the joints
      let la = select(i.lp.z, i.lp.x, abs(N.z) > abs(N.x)); let cu = fract(la / 3.) * 3.; let sc = max(i.sc.x, .2);
      if (cu < .95 && i.lp.y > 2. && i.lp.y < 24.) {
        let cy = i.lp.y / .95; let gq = vec2f(cu / .95 - .5, fract(cy) - .5); let gk = u32(h11(floor(cy) * 1.7 + floor(la / 3.) * 9.1) * 6.);
        let aa = fw * 1.6 / .95 / sc; let gm = (1. - ss(-aa, aa, glyphD(gq, gk))) * sat(1.5 - fw / (.05 * sc));
        o.alb *= 1. - .42 * gm; o.nb += vec3f(0., .25 * gm, 0.);
      }
    }
  } else if (mat == 20u) {
    // pink granite, polished: speckled with dark mica and pale feldspar
    let A = tri(tNoiseA, p, dx, dy, w, 1.1); let B = tri(tNoiseA, p, dx, dy, w, 6.); let C = tri(tNoiseA, p, dx, dy, w, .2);
    var c = vec3f(.6, .36, .31) * (.85 + .3 * C.r);
    c = mix(c, vec3f(.12, .1, .1), ss(.62, .72, B.r) * sat(1. - fw / .03) * .8); c = mix(c, vec3f(.82, .72, .66), ss(.66, .76, B.g) * sat(1. - fw / .03) * .6);
    o.alb = c * (.92 + .16 * A.a); o.rough = .22 + .1 * A.r; o.nb = triN(p, dx, dy, w, 4., false) * .02;
    // a column of incised signs down the middle of each face, filled with gold
    let al = select(i.lp.z, i.lp.x, abs(N.z) > abs(N.x));
    if (abs(al) < .5 && i.lp.y > 4. && i.lp.y < 40.) {
      let cy = i.lp.y / .9; let gq = vec2f(al / .9, fract(cy) - .5); let gk = u32(h11(floor(cy) + 3.) * 6.); let aa = fw * 1.6 / .9 / max(i.sc.x, .2);
      let gm = (1. - ss(-aa, aa, glyphD(gq, gk))) * sat(1.5 - fw / (.05 * max(i.sc.x, .2)));
      o.alb = mix(o.alb, vec3f(.92, .66, .26), gm); o.metal = gm * .9; o.rough = mix(o.rough, .32, gm);
    }
  } else {
    // mountain stream and fall (uv.x across, uv.y bed steepness): white and streaked when falling, glassy with threads
    // when running; ragged edges move with the flow
    let ac = abs(i.uv.x * 2. - 1.); let stp = i.uv.y; let tm = view.cam.w;
    let A = tri(tNoiseA, vec3f(p.x, p.y * .2 + tm * (.35 + .9 * stp), p.z), dx, dy, w, .4); let B = tri(tNoiseA, vec3f(p.x, p.y * .45 + tm * (.8 + 1.6 * stp), p.z), dx, dy, w, 1.5);
    if (ac + (A.r - .5) * .55 + (B.a - .5) * .3 > .84) { discard; }
    let foam = ss(.3, .62, stp * 1.2 + (A.r - .5) * .9 + (B.r - .5) * .4 + ss(.45, .9, ac) * .35);
    o.alb = mix(vec3f(.1, .2, .19), mix(vec3f(.4, .5, .53), vec3f(.88, .9, .92), ss(.3, .72, A.r * .7 + B.a * .6)), foam); o.rough = mix(.1, .6, foam);
  }
  // Stone detail is world anchored and filtered; fine grain disappears before it aliases.
  let stone=mat==0u||mat==1u||mat==4u||mat==5u||mat==9u||mat==12u||mat==13u||mat==14u||mat==19u||mat==20u||mat==23u;
  if(stone){
    let amount=view.look6.x;let near=1.-ss(.025,.12,fw);
    o.nb*=1.+amount*.55;
    if(amount>0.&&near>.001){
      let gr=tri(tNoiseA,p,dx,dy,w,7.);
      o.alb*=1.+(gr.a-.5)*.16*amount*near;
      o.rough=clamp(o.rough+(gr.g-.5)*.12*amount*near,.12,.96);
      o.nb+=triN(p,dx,dy,w,7.,true)*.14*amount*near;
    }
  }
  N = normalize(N - o.nb);
  // specular AA: in-pixel curvature widens the highlight instead of sparkling
  let kr = min(2. * (dot(dnx, dnx) + dot(dny, dny)) * .25, .18);
  let rough = sqrt(sat(sq(o.rough) + kr));
  var g: GO; g.a = vec4f(sqrt(sat3(o.alb)), o.inlay); g.n = vec4f(N, max(rough, .045)); g.m = vec4f(ao, o.metal, o.trans, glass);
  return g;
}
// depth-only pass for plants (High/Medium), then fs runs with depth "equal", so the material is shaded once per
// pixel, not per card layer. EVERY discard in fs reachable by a plant must be mirrored here exactly (LOD dither, mirror
// clip, leaf cutout), or there are holes.
@fragment fn fsDepth(i: VO) {
  let mat = i.mi.x; let tile = max(mat, 32u) - 32u; let luv = atlasUV(tile, i.uv.xy);
  let uvx = dpdx(i.uv.xy); let uvy = dpdy(i.uv.xy);
  let lux = uvx * .245; let luy = uvy * .245; let lq = vec2f(1., 2.); let lg = vec2f(1., 4. / 3.);
  let px = i.clip.xy; let fb = i.mi.y; let nz = select(ign(px + view.jit.z * 5.588),h21(floor(i.wp.xz*12.)+floor(i.wp.y*12.)*vec2f(.31,.73)),mat==7u||mat==21u||mat==22u||mat>=32u);
  if ((fb & 127u) != 127u) { let f = f32(fb & 127u) / 127.; if ((fb & 128u) != 0u) { if (nz < 1. - f) { discard; } } else if (nz >= f) { discard; } }
  if (REFL && i.wp.y < view.jit.w) { discard; }
  if (mat >= 32u) {
    let c = textureSampleGrad(tLeaf, sLin, luv, lux * lg, luy * lg);
    if (onWall(tile)) {
      let lod = max(0., .5 * log2(min(dot(lux * lq, lux * lq), dot(luy * lq, luy * lq)) * 4194304.));
      if (c.a * cardRim(i.uv.xy, tile) < .5 - .05 * min(lod, 4.)) { discard; }
    } else {
      let lod = max(0., .5 * log2(max(dot(lux * lq, lux * lq), dot(luy * lq, luy * lq)) * 4194304.));
      if (c.a * cardRim(i.uv.xy, tile) < .5 - .05 * min(lod, 4.) - ${LEAFT}) { discard; }
    }
  }
}
`;
// Low (phones): tile GPUs only skip hidden fragments for shaders without discard. So all discards are stripped (LODs
// hard-switch in the vertex stage, streams lose ragged edges, no mirror), and leaves are drawn twice: depth cut out by
// fsPre, then colour where the depth is theirs by fsLeafLow (plainer, never discards). Both must agree on depth exactly:
// the invariant position (INV in quality.js).
const W_GBUF_LOW = W_GBUF.replace(/discard;/g, '') + /*wgsl*/`
@fragment fn fsPre(i: VO) {
  let tile = max(i.mi.x, 32u) - 32u; let uvx = dpdx(i.uv.xy) * .245; let uvy = dpdy(i.uv.xy) * .245; let lq = vec2f(1., 2.);
  let c = textureSample(tLeaf, sLin, atlasUV(tile, i.uv.xy));
  if (i.mi.x >= 32u) {
    let wall = onWall(tile); let ex = dot(uvx * lq, uvx * lq); let ey = dot(uvy * lq, uvy * lq);
    let lod = max(0., .5 * log2(select(max(ex, ey), min(ex, ey), wall) * 4194304.));
    if (c.a * cardRim(i.uv.xy, tile) < .5 - .05 * min(lod, 4.) - select(${LEAFT}, 0., wall)) { discard; }
  }
}
@fragment fn fsLeafLow(i: VO) -> GO {
  let mat = i.mi.x; let tile = max(mat, 32u) - 32u; let c = textureSample(tLeaf, sLin, atlasUV(tile, i.uv.xy));
  let tn = i.tint.rgb * i.tint.rgb; let v = i.uv.z; var alb = tn * .22; var rough = .9; var trans = .2;
  if (mat == 7u || mat == 22u) { alb = vec3f(.19, .16, .125) * (.5 + .5 * i.tint.g); trans = 0.; }
  else if(mat==21u){alb=tn*(.68+.3*i.uv.y+.08*v)*vec3f(.95,1.,.76);rough=.82;trans=.25;}
  else if (mat >= 32u) {
    var petal: vec3f; trans = .75;
    if (onWall(tile)) { alb = tn * (.4 + .9 * c.r) * mix(vec3f(1.16, 1.05, .78), vec3f(.8, .94, 1.03), c.b) * (.92 + .16 * fract(v * 7.31)); petal = FLOWERS[u32(i.tint.a * 255. + .5) & 7u] * (.75 + .6 * c.r) * (.82 + .36 * c.b); rough = .42; }
    else { alb = tn * (.55 + .75 * c.r) * mix(vec3f(1.12, 1.03, .85), vec3f(.85, .97, 1.02), v); petal = FLOWERS[u32(i.tint.a * 255. + .5) & 7u] * (.75 + .6 * c.r) * (.85 + .3 * v); rough = .5; }
    if (c.g > .5) { alb = petal; trans = .4; }
  }
  var g: GO; g.a = vec4f(sqrt(sat3(alb)), 0.); g.n = vec4f(normalize(i.n), rough); g.m = vec4f(i.ao, 0., trans, 0.);
  return g;
}
`;
