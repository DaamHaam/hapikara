// shaders 4/4: water, light-liquid, crystal and glass (after the lit opaque scene, which they refract and mirror)
const W_FX = W_SCENE_VS + /*wgsl*/`
@group(1) @binding(0) var tScene: texture_2d<f32>; // lit scene behind (copy)
@group(1) @binding(1) var tDepth: texture_depth_2d; // its depth (copy)
@group(1) @binding(2) var tRefl: texture_2d<f32>; // the scene mirrored in the canals' water plane
@group(1) @binding(3) var tSky: texture_2d<f32>;
@group(1) @binding(4) var tEnv: texture_cube<f32>;
@group(1) @binding(5) var tSh0: texture_depth_2d;
@group(1) @binding(6) var tSh1: texture_depth_2d;
@group(1) @binding(7) var tSh2: texture_depth_2d;
@group(1) @binding(8) var tSh3: texture_depth_2d;
@group(1) @binding(9) var tWater: texture_2d<f32>;
@group(1) @binding(10) var sCmp: sampler_comparison;
` + W_SKY + W_SHADOWLIB + W_SHADE + /*wgsl*/`
fn viewZ(uv: vec2f) -> f32 { return view.fwd.w / max(textureLoad(tDepth, vec2i(clamp(uv, vec2f(0.), vec2f(.9999)) * view.res.xy), 0), 1e-7); }
fn worldAt(uv: vec2f, z: f32) -> vec3f { let ndc = uv * vec2f(2., -2.) + vec2f(-1., 1.) - view.jit.xy; return view.cam.xyz + (view.fwd.xyz + view.right.xyz * ndc.x * view.right.w + view.up.xyz * ndc.y * view.up.w) * z; }
fn toUV(p: vec3f) -> vec3f { let c = view.vp * vec4f(p, 1.); return vec3f(c.x / c.w * .5 + .5, .5 - c.y / c.w * .5, c.w); }
// SSR for water off the mirror plane (ring pool, sea): march in growing steps, refine, fade at screen edges
fn ssr(p: vec3f, r: vec3f, nz: f32) -> vec4f {
  var t = .4; var st = .5 + nz * .5; var hit = false; var q = vec3f(0.);
  for (var k = 0; k < ${SSRN}; k++) {
    t += st; q = toUV(p + r * t);
    if (q.z <= 0. || q.x < 0. || q.x > 1. || q.y < 0. || q.y > 1.) { return vec4f(0.); }
    let d = viewZ(q.xy);
    if (q.z > d + .02) { if (q.z - d < max(st * 2.5, 1.5)) { hit = true; } break; }
    st *= ${QL(1.28, 1.48, 1.48)};
  }
  if (!hit) { return vec4f(0.); }
  var lo = t - st; var hi = t;
  for (var k = 0; k < 5; k++) { let m = (lo + hi) * .5; q = toUV(p + r * m); if (q.z > viewZ(q.xy)) { hi = m; } else { lo = m; } }
  q = toUV(p + r * hi);
  let e = min(min(q.x, 1. - q.x), min(q.y, 1. - q.y));
  return vec4f(textureSampleLevel(tScene, sLin, q.xy, 0.).rgb, ss(0., .08, e));
}
struct FO { @location(0) c: vec4f }
`;
// polished stone: screen-space reflections
// full-screen pass: on smooth surfaces march the mirrored ray and replace the sky reflection with what is there
const W_POLISH = W_COMMON + W_FS + /*wgsl*/`
@group(0) @binding(0) var<uniform> view: View;
@group(0) @binding(1) var sLin: sampler;
@group(0) @binding(2) var tScene: texture_2d<f32>;
@group(0) @binding(3) var tDepth: texture_depth_2d;
@group(0) @binding(4) var tG1: texture_2d<f32>;
@group(0) @binding(5) var tG2: texture_2d<f32>;
@group(0) @binding(6) var tEnv: texture_cube<f32>;
fn viewZ(uv: vec2f) -> f32 { return view.fwd.w / max(textureLoad(tDepth, vec2i(clamp(uv, vec2f(0.), vec2f(.9999)) * view.res.xy), 0), 1e-7); }
fn toUV(p: vec3f) -> vec3f { let c = view.vp * vec4f(p, 1.); return vec3f(c.x / c.w * .5 + .5, .5 - c.y / c.w * .5, c.w); }
@fragment fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  let px = vec2i(fc.xy); let g1 = textureLoad(tG1, px, 0); let dp = textureLoad(tDepth, px, 0);
  if (dp == 0. || g1.a > .32) { return vec4f(0.); }
  let g2 = textureLoad(tG2, px, 0); if (g2.b > 0. || g2.a > .5) { return vec4f(0.); } // not leaves, not window glass (it has its own)
  let ndc = fc.xy * view.res.zw * vec2f(2., -2.) + vec2f(-1., 1.) - view.jit.xy;
  let ray = view.fwd.xyz + view.right.xyz * ndc.x * view.right.w + view.up.xyz * ndc.y * view.up.w; let rd = normalize(ray);
  let z = view.fwd.w / dp; if (z > 400.) { return vec4f(0.); }
  let N = normalize(g1.xyz); let p = view.cam.xyz + ray * z + N * .02; let nv = max(dot(N, -rd), 1e-3);
  // ray spread by roughness; TAA turns it into blur
  let nz = ign(fc.xy + view.jit.z * 5.588); let nz2 = ign(fc.xy + 71. + view.jit.z * 3.17);
  let R = normalize(reflect(rd, N) + (vec3f(nz, nz2, fract(nz * 7.3 + nz2)) - .5) * g1.a * .5);
  var t = .1; var st = .2 + nz * .2; var hit = false; var q = vec3f(0.);
  for (var k = 0; k < ${SSRN}; k++) {
    t += st; q = toUV(p + R * t);
    if (q.z <= 0. || q.x < 0. || q.x > 1. || q.y < 0. || q.y > 1.) { return vec4f(0.); }
    let d = viewZ(q.xy);
    if (q.z > d + .03) { if (q.z - d < max(st * 2.5, 1.)) { hit = true; } break; }
    st *= ${QL(1.3, 1.5, 1.5)};
  }
  if (!hit) { return vec4f(0.); }
  var lo = t - st; var hi = t;
  for (var k = 0; k < 4; k++) { let m = (lo + hi) * .5; q = toUV(p + R * m); if (q.z > viewZ(q.xy)) { hi = m; } else { lo = m; } }
  q = toUV(p + R * hi);
  let e = min(min(q.x, 1. - q.x), min(q.y, 1. - q.y));
  let F = .06 + .94 * pow(1. - nv, 5.);
  let k = F * (1. - g1.a / .32) * ss(0., .08, e) * g2.r;
  return vec4f((min(textureSampleLevel(tScene, sLin, q.xy, 0.).rgb, vec3f(30.)) - textureSampleLevel(tEnv, sLin, R, g1.a * 5.).rgb) * k, 0.);
}
`;
const W_FX2 = /*wgsl*/`

// water
// uv.x: 0 canal water, 1 indigo light-liquid, 2 sea, 3 cascade sheet
@fragment fn fsWater(i: VO) -> FO {
  let kind = u32(i.uv.x * 255. + .5); let p = i.wp; let fc = i.clip.xy; let suv = fc * view.res.zw;
  let dx = dpdx(p.xz); let dy = dpdy(p.xz); let fw = max(length(dx), length(dy));
  let toC = view.cam.xyz - p; let dist = length(toC); let V = toC / dist; let rd = -V;
  let nz = ign(fc + view.jit.z * 5.588); let r = length(p.xz); let L = view.sun.xyz;
  let pl = lum(pulseAt(r));
  // surface slope from the wave texture at two or three scales
  var sl = vec2f(0.); var rough2 = .0006;
  if (kind == 2u) {
    let dx = dx * 3.; let dy = dy * 3.; // softer than one pixel: the open sea must never sizzle
    // three chop layers, turned and scaled so tiles never align, on a long swell
    let r1 = mat2x2f(.8, .6, -.6, .8); let r2 = mat2x2f(.34, -.94, .94, .34); let tm = view.cam.w;
    // large drifting noise tile; lost fine waves become roughness below
    let a = textureSampleGrad(tNoiseN, sRep, p.xz / 173. + vec2f(.0031, .0017) * tm, dx / 173., dy / 173.).ba - .5;
    let b = r1 * (textureSampleGrad(tNoiseN, sRep, (p.xz * r1) / 67. - vec2f(.004, .0022) * tm, (dx * r1) / 67., (dy * r1) / 67.).rg - .5);
    let c = r2 * (textureSampleGrad(tNoiseN, sRep, (p.xz * r2) / 23. + vec2f(.009, -.005) * tm, (dx * r2) / 23., (dy * r2) / 23.).rg - .5);
    let d = textureSampleGrad(tNoiseN, sRep, p.zx / 7.3 + vec2f(-.017, .02) * tm, dx.yx / 7.3, dy.yx / 7.3).gr - .5;
    // the swell (the same trains that move the mesh), each until finer than a pixel
    let sw = seaWave(p.xz, vec4f(1.) / (vec4f(1.) + sq(fw * 1.3) * vec4f(.034, .09, .233, .616)));
    sl = a * .28 + b * .5 + c * .45 + d * .3 + sw.yz;
    // sub-pixel waves become roughness: far water is a silky sheen, not glitter
    rough2 = .004 + .05 * sat(fw / 3.) + .05 * sat(fw / 14.) + .05 * sat(fw / 60.);
  } else {
    let k = select(1., .45, kind == 1u);
    // three wave-tile layers at unrelated scales and angles, pushed by slow noise into calmer and livelier patches
    let n1 = textureSampleGrad(tNoiseA, sRep, p.xz / 71., dx / 71., dy / 71.).r; let n2 = textureSampleGrad(tNoiseA, sRep, p.zx / 53. + .37, dx.yx / 53., dy.yx / 53.).r;
    let q = p.xz + (vec2f(n1, n2) - .5) * 9.;
    let r1 = mat2x2f(.8, .6, -.6, .8); let r2 = mat2x2f(.34, -.94, .94, .34);
    let a = textureSampleGrad(tWater, sRep, q / 11.3, dx / 11.3, dy / 11.3).rg;
    let b = r1 * textureSampleGrad(tWater, sRep, (q * r1) / 5.9 + .31, (dx * r1) / 5.9, (dy * r1) / 5.9).rg;
    let c = r2 * textureSampleGrad(tWater, sRep, (q * r2) / 3.1 + .7, (dx * r2) / 3.1, (dy * r2) / 3.1).rg;
    sl = (a * .5 + b * .34 + c * .2) * k * (.6 + .9 * n2);
    // the pulse sends a soft ring across the water
    let rw = 22. + 60. * view.pulse.x; sl += normalize(p.xz) * sin((r - rw) * .9) * exp(-sq((r - rw) / 9.)) * .05 * exp(-r / 300.);
    rough2 = .0004 + (.006 * sat(fw / .9) + .004 * sat(fw / 2.5)) * k * k;
  }
  let N = normalize(vec3f(-sl.x, 1., -sl.y)); let nv = max(dot(N, V), 1e-3);
  let F = .02 + .98 * pow(1. - nv, 5.);
  // under the surface: the scene behind, bent and coloured by the water depth
  let zs = viewZ(suv); let zw = 1. / i.clip.w; let thick0 = max(zs - zw, 0.); // fragment w is 1 / view depth
  var uv2 = suv + N.xz * vec2f(1., -1.) * .035 * sat(thick0 * .6) / (1. + dist * .02);
  var z2 = viewZ(uv2); if (z2 < zw) { uv2 = suv; z2 = zs; }
  let bed = worldAt(uv2, z2); let path = max(z2 - zw, 0.) * dist / zw; let depth = max(p.y - bed.y, 0.);
  var under = textureSampleLevel(tScene, sLin, uv2, 0.).rgb; var sig: vec3f; var scat: vec3f; var sA = .2;
  let amb = skyLut(vec3f(0., 1., 0.)) * 1.6 + view.sunc.rgb * .12;
  let shw = shadow(p, vec3f(0., 1., 0.));
  if (kind == 0u) { sig = vec3f(.32, .05, .1); scat = vec3f(.0, .042, .028) * amb; sA = .05; }
  else if (kind == 1u) { sig = vec3f(.55, .1, .2); scat = vec3f(.0, .055, .035) * amb; sA = .12; }
  else { sig = vec3f(.42, .12, .17); scat = vec3f(.006, .032, .022) * amb * (1. + 1.4 * sat(p.y * 2. + .15)); sA = .14; } // crests let more light through
  under = under * exp(-sig * (path + depth * .6)) + scat * (1. - exp(-sA * path));
  // what it mirrors
  let R = reflect(rd, N); var refl: vec3f;
  let Rs = normalize(vec3f(R.x, abs(R.y) + .003, R.z));
  if (kind < 2u && abs(p.y - ${WATER}) < .05 && view.misc.y < .5 && view.pulse.w > 0.) {
    let ruv = vec2f(suv.x, 1. - suv.y) + N.xz * vec2f(1., 1.) * (.05 / (1. + dist * .015)) * vec2f(view.res.y / view.res.x, 1.) * 2.;
    refl = textureSampleLevel(tRefl, sLin, ruv, 0.).rgb;
    // pulse.w fades the mirror into the sky's reflection on the way up
    if (view.pulse.w < 1.) { refl = mix(textureSampleLevel(tEnv, sLin, Rs, 1.).rgb, refl, view.pulse.w); }
  } else {
    // sky blurred by sub-pixel waves: far water a calm sheen
    refl = textureSampleLevel(tEnv, sLin, Rs, clamp(sqrt(rough2) * 9., 0., 3.5)).rgb;
    if (LV < 2 && view.misc.y < .5 && fw < 1.5) { let h = ssr(p, Rs, nz); refl = mix(refl, h.rgb, h.a * (1. - ss(.7, 1.5, fw))); }
  }
  
  var col = mix(under, refl, F);
  // dark line where water meets stone
  if (kind < 2u) { col *= mix(.5, 1., ss(0., .35, thick0)); }
  // sun glitter
  let sh = shw;
  let H = normalize(V + L); let a = max(rough2 * 2., .0008);
  col += view.sunc.rgb * sh * min(ggxD(sat(dot(N, H)), sqrt(a)) * ggxV(sat(dot(N, L)), nv, sqrt(a)), select(90., 30., kind == 2u)) * sat(dot(N, L)) * (.02 + .98 * pow(1. - sat(dot(V, H)), 5.));
  if (false) {
    // light-liquid: three layers of violet and rose filaments drifting round the ring at their own speeds, stirred by a
    // swirl, with brightness waves and breathing. Whole-number texture turns around the ring avoid a seam where the angle wraps.
    let nt = select(select(select(82., 56., r < 80.), 46., r < 65.), 25., r < 50.); let an = atan2(p.z, p.x) / (2. * PI); let rv = r / 8.;
    let fdx = vec2f(fw / 30., 0.); let fdy = vec2f(0., fw / 30.); let tm = view.cam.w; let fl = tm * .03;
    let sw = textureSampleGrad(tNoiseA, sRep, vec2f(an * round(nt * .07), rv * .11) + vec2f(fl * .5, tm * .011), fdx, fdy).rg - .5;
    let f1 = textureSampleGrad(tNoiseA, sRep, vec2f(an * round(nt * .13), rv * .27) + vec2f(fl, tm * .004) + sw * .14 + sl * .05, fdx, fdy).b;
    let f2 = textureSampleGrad(tNoiseA, sRep, vec2f(an * round(nt * .21), rv * .43) + vec2f(fl * 1.7, .3 - tm * .009) - sw * .11 - sl * .04, fdx, fdy).b;
    let f3 = textureSampleGrad(tNoiseA, sRep, vec2f(an * round(nt * .47), rv * .93) + vec2f(fl * 2.8, tm * .017) + sw * .2, fdx * 2., fdy * 2.).b;
    let wave = .72 + .28 * sin(r * .22 - tm * 1.5 + sw.x * 5.);
    let glow = (f1 * .9 + f2 * .7 + f3 * .4) * wave * (.4 + 1.6 * exp(-r / 45.) + .35 * view.pulse.y + .8 * view.pulse.z) * (1. + 4. * pl) + pl * 1.2;
    col += mix(vec3f(.5, .28, 1.), vec3f(1., .4, .62), sat(f2 * 1.4)) * glow * .6 * (1. - F);
  } else if (kind == 2u) {
    // thin foam at the shore
    let f = textureSampleGrad(tNoiseA, sRep, p.xz / 5. + vec2f(view.cam.w * .02), dx / 5., dy / 5.);
    let edge = ss(.55, .0, depth + (f.r - .5) * .5 + .12 * sin(view.cam.w * .7 + f.a * 6.)) * ss(.25, .6, f.g + f.a * .5);
    col = mix(col, amb * .55 + view.sunc.rgb * sh * .22, edge * .8);
  } else { col += vec3f(.5, .95, .75) * pl * .2; }
  return FO(vec4f(aerial(col, view.cam.xyz, rd, dist), 1.));
}
// podium falls: sheet, foam, mist (uv.x = 3, 4, 5; see meshCascades)
@fragment fn fsCascade(i: VO) -> FO {
  let kind = u32(i.uv.x * 255. + .5); let p = i.wp; let fc = i.clip.xy; let toC = view.cam.xyz - p; let dist = length(toC); let V = toC / dist; let r = length(p.xz);
  // whole-number texture turns around the tier: no seam where the angle wraps
  let an = atan2(p.z, p.x) / (2. * PI); let cir = 8. * round(max(abs(p.x), abs(p.z)) / 7.) * 7.; let t = view.cam.w;
  let dq = vec2f(length(dpdx(p)), length(dpdy(p)));
  var N = normalize(i.n); if (dot(N, V) < 0.) { N = -N; }
  let sh = shadow(p, N); let pl = lum(pulseAt(r)); let live = .4 + 1.6 * exp(-r / 45.) + .35 * view.pulse.y + .8 * view.pulse.z;
  // froth and mist: droplets, pale lilac in sky and sun light, with a little of the liquid's glow
  let froth = vec3f(.75, .82, .8) * (skyLut(vec3f(0., 1., 0.)) * .8 + view.sunc.rgb * (.03 + .09 * sh)) * (1. + 1.5 * pl);
  var col: vec3f; var al: f32;
  if (kind == 3u || kind == 6u) {
    let span=select(16.,192.,kind==6u);
    let h = i.uv.z * span; let hb = i.uv.y * span; // metres fallen from the lip, metres left to the pool
    // falling liquid speeds up: patterns laid out in (angle, tau = sqrt(h)) slide along tau, fine and slow at the lip,
    // long and fast at the foot
    let tau = sqrt(h + .06); let gv = dq.y * .5 / tau;
    let a = textureSampleGrad(tNoiseA, sRep, vec2f(an * round(cir / 3.3), tau * .21 - t * .13), vec2f(dq.x / 3.3, 0.), vec2f(0., gv * .21));
    let b = textureSampleGrad(tNoiseA, sRep, vec2f(an * round(cir / .8), tau * .5 - t * .3), vec2f(dq.x / .8, 0.), vec2f(0., gv * .5));
    // strands the sheet gathers into, fixed across the fall
    let s1 = textureSampleGrad(tNoiseA, sRep, vec2f(an * round(cir / 1.7), tau * .035 - t * .02), vec2f(dq.x / 1.7, 0.), vec2f(0., gv * .035));
    // the moat's filaments, drawn out and sliding down
    let f1 = textureSampleGrad(tNoiseA, sRep, vec2f(an * round(cir / 16.), tau * .07 - t * .045), vec2f(dq.x / 16., 0.), vec2f(0., gv * .07)).b;
    let f2 = textureSampleGrad(tNoiseA, sRep, vec2f(an * round(cir / 9.5) + .3, tau * .12 - t * .08), vec2f(dq.x / 9.5, 0.), vec2f(0., gv * .12)).b;
    // a smooth dark film at the lip; falling, it breaks into glowing frothy ropes with thin dark film between
    let grow = ss(.15, 3.5, h); let rope = ss(.42, .7, s1.r + (b.r - .5) * .35) * grow; let thin = ss(.55, .3, s1.r + (a.r - .5) * .3) * grow;
    let tg = normalize(vec3f(-N.z, 0., N.x)); N = normalize(N + tg * ((a.r - .5) * .3 + (b.a - .5) * (.12 + .75 * grow)) + vec3f(0., (b.r - .5) * .25 * grow, 0.));
    let nv = max(dot(N, V), 1e-3); let F = .03 + .97 * pow(1. - nv, 5.);
    // clear water over stone: the stone behind shows green through the thin sheet, white where it gathers into ropes
    var behind = vec3f(.6, .56, .46) * (view.sunc.rgb * .1 * sh + skyLut(vec3f(0., 1., 0.)) * .6);
    if(view.misc.y<.5) {behind=textureSampleLevel(tScene,sLin,clamp(fc*view.res.zw+vec2f((a.r-.5)*.0015,0.),vec2f(.001),vec2f(.999)),0.).rgb;}
    col = mix(behind * vec3f(.72, .96, .86), froth * (.6 + .5 * b.r), rope * .5 + thin * .08) * (.95 + .1 * a.r);
    col = col * (1. - F) + sky(reflect(-V, N), false) * min(F, .6);
    col += view.sunc.rgb * sh * sunBRDF(N, V, vec3f(.02), vec3f(.02), mix(.08, .3, rope)) * .35;
    col += vec3f(.6, 1., .8) * pl * .4;
    // the last stretch before the pool churns to froth
    let foot = ss(min(2.4, .28 * (h + hb)) * (.55 + .9 * a.r), 0., hb) * (.72 + .2 * rope + .28 * b.a);
    col = mix(col, froth * (.7 + .5 * b.r), sat(foot));
    // one continuous sheet hiding the marble (a tenth of sunlit marble showing turns it pale); clear only at the slot
    al = (.38 + .4 * rope + .08 * a.r) * mix(.7, 1., ss(0., .12, h));
    if(kind==6u){col=mix(col,froth*(.9+.25*b.r),.6);al=max(al,.85);}
  } else if (kind == 4u) {
    // foam: thick where the sheet lands, torn into patches further out
    let tv = i.uv.z; let gr = dq.x / 4.;
    let n1 = textureSampleGrad(tNoiseA, sRep, vec2f(an * round(cir / 1.9), tv * .7 - t * .09), vec2f(dq.x / 1.9, 0.), vec2f(0., gr * .7));
    let n2 = textureSampleGrad(tNoiseA, sRep, vec2f(an * round(cir / .6) + .3, tv * 2.2 - t * .23), vec2f(dq.x / .6, 0.), vec2f(0., gr * 2.2));
    let dens = sq(1. - tv); let cov = n1.r * .65 + n2.a * .45 + .12 * sin(t * 1.7 + n1.a * 9.) * dens;
    al = ss(.66 - .6 * dens, .8 - .45 * dens, cov) * ss(1., .8, tv) * (.55 + .45 * i.uv.y) * .9;
    col = froth * (.75 + .5 * n2.r) * (.8 + .3 * dens);
  } else {
    // mist: billows rising and thinning; soft against stone, gone where a shell is seen edge-on
    let tv = i.uv.z;
    let m1 = textureSampleGrad(tNoiseA, sRep, vec2f(an * round(cir / 6.), tv * .5 - t * .05), vec2f(dq.x / 6., 0.), vec2f(0., dq.y * .12)).r;
    let m2 = textureSampleGrad(tNoiseA, sRep, vec2f(an * round(cir / 2.3) + .4, tv * 1.1 - t * .11), vec2f(dq.x / 2.3, 0.), vec2f(0., dq.y * .3)).r;
    var soft = 1.; if (view.misc.y < .5) { soft = sat((viewZ(fc * view.res.zw) - 1. / i.clip.w) / .8); }
    al = ss(.2 + .75 * tv, .7 + .55 * tv, m1 * .75 + m2 * .65 + .1) * (1. - tv * tv) * ss(.08, .5, abs(dot(N, V))) * soft * (.3 + .3 * i.uv.y);
    col = froth * (.8 + .4 * m2);
  }
  return FO(vec4f(aerial(col, view.cam.xyz, -V, dist) * al, al));
}

// crystal
// clear quartz: refracted in, across and out (or mirrored inside), so each facet shows a shifted piece of the
// world behind. uv.x: 0 prism, 1 petal or panel.
const HEXN = array<vec2f, 6>(vec2f(1., 0.), vec2f(.5, .866), vec2f(-.5, .866), vec2f(-1., 0.), vec2f(-.5, -.866), vec2f(.5, -.866));
fn behind(pe: vec3f, d: vec3f, zf: f32, disp: f32, far: f32) -> vec3f {
  let env = textureSampleLevel(tEnv, sLin, d, 0.).rgb;
  if (view.misc.y > .5) { return env; }
  let q = toUV(pe + d * far); let s0 = toUV(pe);
  if (q.z <= 0.) { return env; }
  let e = min(min(q.x, 1. - q.x), min(q.y, 1. - q.y)); if (e <= 0.) { return env; }
  if (viewZ(q.xy) < zf - .5) { return env; }
  // red and blue leave at slightly different angles: spectral fringes
  var o = q.xy - s0.xy; o = o / max(length(o), 1e-4) * min(length(o), .05) * disp;
  let c = vec3f(textureSampleLevel(tScene, sLin, q.xy - o, 0.).r, textureSampleLevel(tScene, sLin, q.xy, 0.).g, textureSampleLevel(tScene, sLin, q.xy + o, 0.).b);
  return mix(env, c, ss(0., .06, e));
}
// Exact exit intersection for the square pyramid, not the former hexagonal crystal.
@fragment fn fsCrystal(i: VO) -> FO {
  let p=i.wp; let delta=view.cam.xyz-p; let dist=length(delta); let V=delta/dist; let rd=-V;
  var N=normalize(i.n); if(dot(N,V)<0.) { N=-N; }
  let nv=max(dot(N,V),.001); let F=.045+.955*pow(1.-nv,5.);
  let qc=vec4f(-i.q.xyz,i.q.w); let o=i.lp*i.sc.xyz;
  let d1=refract(rd,N,1./1.57); let dl=qrot(qc,d1);
  let slope=${PDN.h / PDN.H}; let baseH=${PDN.h}.;
  let planes=array<vec4f,5>(vec4f(1.,slope,0.,baseH),vec4f(-1.,slope,0.,baseH),vec4f(0.,slope,1.,baseH),vec4f(0.,slope,-1.,baseH),vec4f(0.,-1.,0.,0.));
  var travel=1e5; var ne=-qrot(qc,N);
  for(var k=0;k<5;k++) {
    let plane=planes[k]; let dn=dot(dl,plane.xyz);
    if(dn>.0001) { let t=(plane.w-dot(o,plane.xyz))/dn; if(t>.001 && t<travel) {travel=t;ne=normalize(plane.xyz);} }
  }
  travel=min(travel,60.); let pe=p+d1*travel; let exitN=qrot(i.q,ne);
  var d2=refract(d1,-exitN,1.57); var tir=false;
  if(dot(d2,d2)<.5) {d2=reflect(d1,-exitN);tir=true;}
  let absorption=exp(-travel*vec3f(.135,.008,.065));
  var bg=behind(pe,d2,1./i.clip.w,.0015,65.)*absorption*vec3f(.52,1.,.72);
  if(tir) {bg=textureSampleLevel(tEnv,sLin,d2,.3).rgb*absorption*vec3f(.38,.86,.57);}
  // Quiet static cleavage planes, illuminated only by sky and sun.
  let hp=o+dl*travel*.45;
  let veins=textureSampleLevel(tNoiseA,sRep,(hp.xy+hp.zz*vec2f(.37,.21))*.09,1.5).r;
  bg*=.88+.18*veins;
  // Intersected cleavage veils reflect a different part of the world, with quiet dark inclusions.
  for(var k=0;k<3;k++) {
    let pn=normalize(vec3f(.61+f32(k)*.09,.43,-.59+f32(k)*.47));
    let q=dot(hp,pn)/4.7+f32(k)*.31;let cell=floor(q);let edge=fract(q);
    let weight=ss(.12,.38,edge)*ss(.98,.72,edge)*(.035+.11*h11(cell+f32(k)*13.));
    let reflected=textureSampleLevel(tEnv,sLin,qrot(i.q,reflect(dl,pn)),.5).rgb*absorption*vec3f(.4,.92,.6);
    bg=mix(bg,reflected,weight);
    bg*=1.-.13*ss(.66,.73,veins+sin(q*2.3)*.08);
  }
  bg+=skyLut(vec3f(0.,1.,0.))*vec3f(.04,.12,.065)*ss(.62,.78,veins);
  let R=reflect(rd,N); let sh=shadow(p,N); let H=normalize(V+view.sun.xyz);
  var col=textureSampleLevel(tEnv,sLin,R,.35).rgb*F;
  col+=view.sunc.rgb*sh*min(ggxD(sat(dot(N,H)),.018),120.)*.12*sat(dot(N,view.sun.xyz))*F;
  col+=bg*(1.-F);
  return FO(vec4f(aerial(col,view.cam.xyz,rd,dist),1.));
}
// thin glass (domes): mirror at grazing angles, clear face-on
@fragment fn fsGlass(i: VO) -> FO {
  let p = i.wp; let toC = view.cam.xyz - p; let dist = length(toC); let V = toC / dist;
  var N = normalize(i.n); if (dot(N, V) < 0.) { N = -N; }
  let nv = max(dot(N, V), 1e-3); let F = .13 + .87 * pow(1. - nv, 4.);
  let R = reflect(-V, N);
  var refl = textureSampleLevel(tEnv, sLin, R, .3).rgb * (.8 + .5 * h21(floor(i.lp.xz * .7) + floor(i.lp.yy * .5)));
  // faint thin-film colour
  refl *= 1. + .07 * cos(7. * nv + vec3f(0., 2.1, 4.2));
  let sh = shadow(p, N); let H = normalize(V + view.sun.xyz);
  var col = refl * F + view.sunc.rgb * sh * min(ggxD(sat(dot(N, H)), .012), 200.) * .25 * sat(dot(N, view.sun.xyz)) * F;
  col += vec3f(.55, .8, .78) * .02 * view.sunc.g;
  let al = sat(F + .1); let fa = f32(i.mi.y & 127u) / 127.; // fa: this LOD's share during a cross-fade
  return FO(vec4f(aerial(col / al, view.cam.xyz, -V, dist) * al, al) * fa);
}
`;
