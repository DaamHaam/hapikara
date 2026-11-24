// development tools: dev.html only (npm run build:dev)
// F: fly the scripted 60 s path; B: the same flight as a benchmark; F, B or 1-6 stop a flight
// for tools/shot.mjs (?auto=1): __shot() stills and fly-through frames, __bench() benchmark, __stats() GPU time per stage
{
  const LOGN = 1 << 16, logFrame = new Float32Array(LOGN), logGpu = new Float32Array(LOGN);
  let flying = false, bench = false, nFrame = 0, nGpu = 0, seenGpu = 0, tPrev = 0, finish = null, late = '';
  const stop = () => { flying = bench = false; };
  const st = (a, n) => { const s = Array.from(a.subarray(0, n)).sort((x, y) => x - y); let sum = 0; for (const v of s) sum += v; return `avg ${(sum / n).toFixed(2)}  p99 ${s[min(n - 1, floor(n * 0.99))].toFixed(2)}  max ${s[n - 1].toFixed(2)} ms`; };
  const report = () => {
    const over = Array.from(logFrame.subarray(0, nFrame)).filter((v) => v > 16.7).length;
    const s = `Fly-through ${W}x${H}, ${nFrame} frames in ${FLYT} s (${(1000 * nFrame / logFrame.subarray(0,nFrame).reduce((a,b)=>a+b,0)).toFixed(1)} fps)\nframe  ${st(logFrame, nFrame)}  ·  frames over 16.7 ms: ${over}${late}  ·  long main-thread tasks: ${longN} (max ${longMax.toFixed(0)} ms)\nGPU  ${nGpu ? st(logGpu, nGpu) : benchTS ? 'timestamp-query unavailable' : 'readback disabled (?nots); see per-view timings'}`;
    info.textContent = s; if (finish) { finish(s); finish = null; }
  };
  // main-thread tasks over 50 ms during a benchmark: own stalls vs frames the browser delivered late
  let longN = 0, longMax = 0;
  try { new PerformanceObserver((l) => { if (bench) for (const e of l.getEntries()) { longN++; longMax = max(longMax, e.duration); } }).observe({ entryTypes: ['longtask'] }); } catch {}
  const draw = render;
  render = () => {
    if (flying) {
      const now = performance.now(), dtr = now - tPrev; tPrev = now;
      F[FLT] += F[DT]; flyAt(); F[VX] = F[VY] = F[VZ] = 0;
      if (bench && F[FLT] > 0.5) { if (dtr > 33) late += ` ${dtr.toFixed(1)} ms at ${F[FLT].toFixed(1)} s;`; if (nFrame < LOGN) logFrame[nFrame++] = dtr; if (benchTS && gpuN !== seenGpu && nGpu < LOGN) { seenGpu = gpuN; logGpu[nGpu++] = gpuMs[NP]; } }
      if (soak) { if (nSoak++ > 30 && now - soakT0 > 3000 && dtr > soakMs) { performance.mark('stall'); soakLog.push(`${dtr.toFixed(0)} ms at ${((now - soakT0) / 1000).toFixed(1)} s (path ${F[FLT].toFixed(1)} s, camera ${F[CX].toFixed(0)},${F[CY].toFixed(0)},${F[CZ].toFixed(0)})`); } if (F[FLT] >= FLYT) { F[FLT] = 0; F[RESET] = 1; } }
      else if (F[FLT] >= FLYT) { if (bench) report(); stop(); }
    }
    draw();
  };
  // soak (tools/soak.mjs): the flight looped for o.s seconds; frames later than o.ms are listed and performance.mark'ed
  let soak = false, soakMs = 25, soakT0 = 0, nSoak = 0, looping = false; const soakLog = [];
  window.__stalls = () => soakLog.length; window.__stallList = () => soakLog.join('; ');
  // toggle the stats text and the GPU timing readback separately, to tell which causes a stall
  window.__panel = (text, timings) => { hud = !!text; tsOn = !!timings && hasTS; info.textContent = ''; return `text ${hud} · timings ${tsOn}`; };
  window.__soak = (o) => new Promise((res) => {
    soakMs = o.ms || 25; soakLog.length = 0; nSoak = 0; soakT0 = performance.now(); menu = false; hud = false; tsOn = hasTS && !!o.ts;
    flying = soak = true; bench = false; F[FLT] = 0; F[RESET] = 1; tPrev = soakT0;
    if (!looping) { looping = true; requestAnimationFrame((t) => { F[LAST] = t; requestAnimationFrame(frame); }); }
    setTimeout(() => { soak = flying = false; res(`soak ${o.s} s at ${W}x${H}: ${nSoak} frames (${(nSoak / o.s).toFixed(1)} fps), ${soakLog.length} over ${soakMs} ms${soakLog.length ? ': ' + soakLog.join('; ') : ''}`); }, o.s * 1000);
  });
  const start = (b) => { flying = true; bench = b; F[FLT] = 0; F[RESET] = 1; nFrame = nGpu = 0; late = ''; tPrev = performance.now(); if (b) { hud = false; tsOn = hasTS && benchTS; info.textContent = ''; } };
  let benchTS = !QP.has('nots'); // ?nots: benchmark without reading GPU timings back
  addEventListener('keydown', (e) => {
    if (menu || e.repeat) return;
    if (e.code === 'KeyF' || e.code === 'KeyB') { if (flying) stop(); else start(e.code === 'KeyB'); } else if (/Digit[1-6]/.test(e.code)) stop();
  });
  const c2 = document.createElement('canvas');
  const grab = (crop) => {
    if (!crop) return canvas.toDataURL('image/png');
    c2.width = crop[2]; c2.height = crop[3]; c2.getContext('2d').drawImage(canvas, crop[0], crop[1], crop[2], crop[3], 0, 0, crop[2], crop[3]);
    return c2.toDataURL('image/png');
  };
  window.__shot = async (o) => {
    const out = [], dt = o.dt || 1 / 60, n = o.frames || 40;
    if (o.time !== undefined) F[TIME] = o.time;
    if (o.fly !== undefined) {
      // approach along the path so the history matches a real flight
      for (let i = n; i >= 0; i--) { F[FLT] = o.fly - i * dt; flyAt(); F[TIME] += dt; if (i === n) F[RESET] = 1; draw(); if (i && i % 8 === 0) await Q.onSubmittedWorkDone(); }
      out.push(grab(o.crop));
      if (o.pair) { F[FLT] = o.fly + dt; flyAt(); F[TIME] += dt; draw(); out.push(grab(o.crop)); }
    } else {
      if (o.pose !== undefined) lookAt(...POSES[o.pose]); else if (o.cam) lookAt(...o.cam);
      for (let i = 0; i < n; i++) { F[TIME] += dt; draw(); if (i < n - 1 && i % 8 === 7) await Q.onSubmittedWorkDone(); }
      out.push(grab(o.crop));
    }
    await Q.onSubmittedWorkDone();
    return out;
  };
  // temporal stability: the camera creeps along o.move per frame at 180 fps; returns mean green-channel change per pixel,
  // the share changing by > 6 levels (visible shimmer), and a map of them (white = 24+ levels)
  window.__flicker = async (o) => {
    const dt = o.dt || 1 / 180, mv = o.move || [0.01, 0, 0.004], n = o.frames || 90, N = W * H, acc = new Float32Array(N), K = 10;
    if (o.time !== undefined) F[TIME] = o.time;
    if (o.pose !== undefined) lookAt(...POSES[o.pose]); else lookAt(...o.cam);
    const step = () => { F[CX] += mv[0]; F[CY] += mv[1]; F[CZ] += mv[2]; F[TIME] += dt; draw(); };
    for (let i = 0; i < n; i++) { step(); if (i % 8 === 7) await Q.onSubmittedWorkDone(); }
    c2.width = W; c2.height = H; const g = c2.getContext('2d', { willReadFrequently: true }); let prev = null;
    for (let k = 0; k <= K; k++) { step(); g.drawImage(canvas, 0, 0); const d = g.getImageData(0, 0, W, H).data; if (prev) for (let i = 0; i < N; i++) acc[i] += abs(d[i * 4 + 1] - prev[i * 4 + 1]); prev = d; }
    let sum = 0, hot = 0, counted=0; const im = g.createImageData(W, H), area=o.area||[0,0,W,H];
    for (let i = 0; i < N; i++) { const x=i%W,y=floor(i/W);if(x<area[0]||x>=area[2]||y<area[1]||y>=area[3])continue;counted++;const a = acc[i] / K; sum += a; if (a > 6) hot++; const v = min(255, a * 10.6); im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
    g.putImageData(im, 0, 0);
    return [`mean ${(sum / max(counted,1)).toFixed(3)}  hot ${(hot / max(counted,1) * 100).toFixed(2)}%`, c2.toDataURL('image/png')];
  };
  // starts after 2 s of ordinary frames, like a session already running
  window.__bench = () => new Promise((res) => { finish = res; menu = false; F[FLT] = 0; flyAt(); requestAnimationFrame((t) => { F[LAST] = t; requestAnimationFrame(frame); }); setTimeout(() => start(true), 2000); });
  // peak speed and turn rate of the path (limits: 80 m/s, 40 deg/s), and its lowest clearance over ground or water
  // (bridges, buildings, trees not counted)
  const groundY = (x, z) => { if (inCity(x, z)) { const m = max(abs(x), abs(z)); return canalAt(x, z) ? WATER : m < T1.h ? max(T1.y, acroY(m)) : cityH(x,z); } return max(terrainH(x, z), 0); };
  window.__path = () => {
    let vm = 0, wm = 0, px = 0, py = 0, pz = 0, pa = 0, lo = 1e9, lt = 0;
    for (let i = 0; i <= 3600; i++) {
      F[FLT] = i / 60; flyAt(); if (i) { vm = max(vm, hypot(F[CX] - px, F[CY] - py, F[CZ] - pz) * 60); wm = max(wm, abs(angd(F[YAW], pa)) * 60 / DEG); } px = F[CX]; py = F[CY]; pz = F[CZ]; pa = F[YAW];
      const c = py - groundY(px, pz); if (c < lo) { lo = c; lt = i / 60; }
    }
    return `path: peak speed ${vm.toFixed(1)} m/s, peak yaw rate ${wm.toFixed(1)} deg/s, lowest ${lo.toFixed(1)} m above ground or water (at ${lt.toFixed(1)} s)`;
  };
  // leaf atlas as the materials see it, over a wall colour (best at --w 2048 --h 1536)
  window.__atlas = () => {
    const m = mod(W_FS + /*wgsl*/`@group(0) @binding(0) var t: texture_2d<f32>; @group(0) @binding(1) var s: sampler;
@fragment fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  let uv = fc.xy / vec2f(${W}., ${H}.); let c = textureSampleLevel(t, s, uv, 0.); let g = fract(uv * vec2f(4., 3.));
  var bg = vec3f(.78, .76, .7); if (min(g.x, g.y) < .004) { bg = vec3f(.3); }
  var col = mix(vec3f(.36, .5, .14), vec3f(.16, .36, .2), c.b) * (.45 + .75 * c.r); if (c.g > .5) { col = vec3f(.85, .3, .55) * (.6 + .5 * c.r); }
  return vec4f(mix(bg, col, step(.5, c.a)), 1.);
}`, 'atlas'), e = device.createCommandEncoder();
    const r = e.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store' }] });
    r.setPipeline(fsPipe(m, lBlit, FMT)); r.setBindGroup(0, blitBG(mipView(tLeaf, 0))); r.draw(3); r.end(); Q.submit([e.finish()]);
    return canvas.toDataURL('image/png');
  };
  // per view, what the last frame drew: instances and triangles by kind, and the heaviest (type, LOD) slots,
  // read back from the cull pass's indirect draw arguments
  window.__count = async () => {
    const KN = ['solid', 'leaf', 'crystal', 'glass', 'water', 'cascade'], out = [];
    for (const [v, name, skip] of [[V_MAIN, 'main', 0], [V_MIR, 'mirror', NO_MIRROR], [V_SH, 'shadow', NO_NEAR | NO_SHADOW]]) {
      const rb = device.createBuffer({ size: argData.byteLength, usage: BU.MAP_READ | BU.COPY_DST }), e = device.createCommandEncoder();
      e.copyBufferToBuffer(bArgs[v], 0, rb, 0, argData.byteLength); Q.submit([e.finish()]); await rb.mapAsync(GPUMapMode.READ);
      const a = new Uint32Array(rb.getMappedRange()), by = {}, top = []; let tot = 0;
      slots.forEach((s, i) => { if (s.flags & skip || (v === V_SH && s.kind > K.LEAF)) return; const n = a[i * 5 + 1], t = n * s.mesh.ni / 3, k = KN[s.kind]; by[k] = by[k] || [0, 0]; by[k][0] += n; by[k][1] += t; tot += t; if (n) top.push([t, `${n}x${s.mesh.ni / 3}(${k[0]}${s.lod})`]); });
      top.sort((p, q) => q[0] - p[0]);
      out.push(`${name}: ${(tot / 1e6).toFixed(2)} M tris · ` + Object.entries(by).map(([k, c]) => `${k} ${c[0]} inst ${(c[1] / 1e6).toFixed(2)} M`).join(' · ') + '\n   top: ' + top.slice(0, +QP.get('top') || 9).map((t) => t[1]).join('  '));
      rb.unmap(); rb.destroy();
    }
    return out.join('\n');
  };
  // collision tests. __surf("x,z,y;..."): floor and ceiling there (y decides on or under a bridge).
  // __ram("x,y,z,dx,dy,dz,speed,seconds;..."): push the camera at 180 steps/s; where it ends and the floor there.
  // __hard(): the first domes, halls and villas the collision knows
  window.__hard = () => `boxes ${HB.length / 5} | bridges ${HR.length / 7}`;
  window.__surf = (s) => s.split(';').map((p) => { const [x, z, y] = p.split(',').map(Number); surfaceAt(x, z, y === undefined ? 1e9 : y); return `floor ${COL[0].toFixed(2)}${COL[1] < 1e8 ? ' ceiling ' + COL[1].toFixed(2) : ''}${COL[2] ? ' natural' : ''}`; }).join(' | ');
  window.__ram = (s) => s.split(';').map((p) => {
    const [x, y, z, dx, dy, dz, sp, secs] = p.split(',').map(Number), l = hypot(dx, dy, dz), n = round(secs * 180), dt = 1 / 180;
    F[CX] = x; F[CY] = y; F[CZ] = z; const t0 = performance.now();
    for (let i = 0; i < n; i++) { const px = F[CX], py = F[CY], pz = F[CZ]; F[VX] = dx / l * sp; F[VY] = dy / l * sp; F[VZ] = dz / l * sp; F[CX] += F[VX] * dt; F[CY] += F[VY] * dt; F[CZ] += F[VZ] * dt; collide(px, py, pz); }
    const us = (performance.now() - t0) * 1000 / n; surfaceAt(F[CX], F[CZ], F[CY]);
    return `-> ${F[CX].toFixed(1)}, ${F[CY].toFixed(2)}, ${F[CZ].toFixed(1)} · moved ${hypot(F[CX] - x, F[CZ] - z).toFixed(1)} m of ${(sp * secs * hypot(dx, dz) / l).toFixed(1)} · floor there ${COL[0].toFixed(2)} · ${us.toFixed(2)} us a step`;
  }).join('\n');
  // land height under "x,z;x,z;..."
  window.__ground = (s) => s.split(';').map((p) => { const [x, z] = p.split(',').map(Number); return terrainH(x, z).toFixed(1); }).join(' ');
  window.__stats = () => PASSES.map((p, i) => `${p} ${gpuMs[i].toFixed(2)}`).join('  ') + `  | total ${gpuMs[NP].toFixed(2)} ms`;
  if (AUTO) tsOn = hasTS;
  window.__ready = true;
  // Reproducible local QA, opt-in and dev-only. No render loop between captures.
  if (QP.has('qa')) setTimeout(async () => {
    const stage = QP.get('qa'), send = async data => {
      const response = await fetch('/__qa', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({stage,...data})});
      if (!response.ok) throw Error('QA capture sink: '+response.status);
    };
    try {
      const adapterInfo = adapter.info;
      const report = {environment:{browser:navigator.userAgent,visibility:document.visibilityState,width:W,height:H,level:LVN[LV],timestamps:hasTS},gpu: {vendor:adapterInfo.vendor, architecture:adapterInfo.architecture, device:adapterInfo.device, description:adapterInfo.description}, path:window.__path(),planting:window.__planting, views:[]};
      for (let pose=0;pose<6;pose++) {
        const shots=await window.__shot({pose,frames:48,time:10});
        await send({name:`P${pose+1}.png`,image:shots[0]});
        report.views.push({pose,stats:window.__stats(),count:await window.__count()});
      }
      if(!QP.has('smoke')){
      const flicker=await window.__flicker({pose:4,time:10});
      const palmCam=[169,21,39,154.5,25,21];
      await send({name:'palms.png',image:(await window.__shot({cam:palmCam,time:10}))[0]});
      const palmFlicker=await window.__flicker({cam:palmCam,time:10});report.palmFlicker=palmFlicker[0];await send({name:'palms-flicker.png',image:palmFlicker[1]});
      const palmStill=await window.__flicker({cam:palmCam,time:10,move:[0,0,0],dt:1/60});report.palmStill=palmStill[0];await send({name:'palms-still.png',image:palmStill[1]});
      await send({name:'garden.png',image:(await window.__shot({cam:[240,17,-188,220,12,-215],time:10}))[0]});
      report.palmCrownArea=[560,330,900,620];const crown=await window.__flicker({cam:palmCam,time:10,move:[0,0,0],dt:1/60,area:[560*W/1440,330*H/900,900*W/1440,620*H/900]});report.palmCrownStill=crown[0];await send({name:'palms-crown-still.png',image:crown[1]});
      report.flicker=flicker[0]; await send({name:'flicker.png',image:flicker[1]});
      await send({name:'oasis.png',image:(await window.__shot({cam:[OASIS[0]+300,110,40,OASIS[0]-55,100,0]}))[0]});
      for (const fly of [28,40,52]) {
        const shots=await window.__shot({fly,pair:true});
        for(let k=0;k<shots.length;k++) await send({name:`fly-${fly}-${k}.png`,image:shots[k]});
      }
      }
      if(QP.has('looks'))for(const [name,preset]of Object.entries(LOOK_PRESETS)){LOOK_ACTIVE.set(LOOK);for(let i=0;i<20;i++)if(preset[LOOK_FIELDS[i][0]]!==undefined)LOOK_ACTIVE[i]=preset[LOOK_FIELDS[i][0]];syncLook();F[RESET]=1;await send({name:'look-'+name+'.png',image:(await window.__shot({pose:2,time:10}))[0]});}LOOK_ACTIVE.set(LOOK);syncLook();F[RESET]=1;
      for(let level=0;level<4;level++){LOOK_ACTIVE[22]=level;syncLook();F[RESET]=1;await send({name:'underwater-'+level+'.png',image:(await window.__shot({cam:[130,4.8,180,130,4.6,155],time:10}))[0]});report.views.push({underwater:level,stats:window.__stats()});}LOOK_ACTIVE.set(LOOK);syncLook();F[RESET]=1;
      if(QP.has('materials')){
        report.materials=[];
        for(const [grain,relief]of [[0,0],[1,0],[1,1]]){
          LOOK_ACTIVE[25]=grain;LOOK_ACTIVE[26]=relief;syncLook();F[RESET]=1;
          const cam=[342,8.2,123,343,8,118];
          await send({name:'stone-'+grain+'-'+relief+'.png',image:(await window.__shot({cam,time:10}))[0]});
          let sum=0,peak=0;for(let j=0;j<24;j++){draw();await Q.onSubmittedWorkDone();sum+=gpuMs[NP];peak=max(peak,gpuMs[NP]);}
          report.materials.push({grain,relief,gpuMean:sum/24,gpuPeak:peak});
        }
        LOOK_ACTIVE.set(LOOK);syncLook();F[RESET]=1;
        report.discoveries=window.__discoveries;
        for(const d of window.__discoveries.outside){
          await send({name:'discovery-'+d.kind+'.png',image:(await window.__shot({cam:[d.x+27,d.y+12,d.z+28,d.x,d.y+3,d.z],time:10}))[0]});
        }
        await send({name:'pyramid-detail.png',image:(await window.__shot({cam:[110,62,100,0,65,0],time:10}))[0]});
      }
      if(QP.has('bench')) report.benchmark=await window.__bench();
      if(GPU_ERRORS.length)throw Error(GPU_ERRORS.join('\n'));
      await send({name:'report.json',report});
      document.getElementById('s').textContent='QA complete'; console.log('QA complete',report);
    } catch(e) { await send({name:'error.json',report:{error:e.stack}}); console.error(e); }
  },0);
}
