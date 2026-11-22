// Persistence/import contract and safety of the opaque palm replacement (CPU only).
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=f=>readFileSync(new URL('../src/'+f,import.meta.url),'utf8');
const context=vm.createContext({Float32Array,Number,JSON,localStorage:{},AUTO:false,QP:new URLSearchParams(),URLSearchParams});
vm.runInContext(read('math.js')+'\n'+read('ambiance.js')+`
  if(LOOK.length!==22)throw Error('uniform contract');
  if(readLook({version:2,values:{sun:1.6}}))throw Error('future format accepted');
  if(readLook({version:1,values:{sun:NaN,exposure:'oops'}}))throw Error('invalid number');
  if(!readLook({version:1,values:{sun:999,haze:-4,exposure:.84}}))throw Error('valid import refused');
  if(LOOK[0]!==1.8&&Math.abs(LOOK[0]-1.8)>1e-6)throw Error('maximum');
  if(LOOK[8]!==0||Math.abs(LOOK[4]-.84)>1e-6)throw Error('clamp or import');
  saveLook(); LOOK.fill(0);if(!readLook(JSON.parse(localStorage.hapikaraAmbiance)))throw Error('round trip');
  if(Math.abs(LOOK[4]-.84)>1e-6)throw Error('persistence');
  LOOK_FIELDS.forEach((f,i)=>LOOK[i]=f[6]);
`,context);
const material=read('sh_scene.js').split('// per view')[0];
vm.runInContext(read('layout.js')+'\n'+material+'\nconst LEAFK=1;\n'+read('meshes.js')+'\n'+read('egypt.js')+`
  for(let lod=0;lod<5;lod++){
    const m=meshPalm(11,lod),b=new Uint8Array(m.vb),f=new Float32Array(m.vb);
    if(!m.nv||!m.ib.length)throw Error('empty palm');
    for(let i=0;i<m.nv;i++){
      if(b[i*20+16]!==21&&b[i*20+16]!==22)throw Error('alpha/wind material on palm');
      for(let k=0;k<3;k++)if(!Number.isFinite(f[i*5+k]))throw Error('nonfinite palm');
    }
  }
  for(const [x,z]of COURTYARDS){
    const y=cityH(x,z);
    for(const dx of [-16,0,16])for(const dz of [-16,0,16])
      if(!inCity(x+dx,z+dz)||canalAt(x+dx,z+dz)||cityH(x+dx,z+dz)!==y)throw Error('garden crosses water or ramp');
  }
`,context);
assert.equal(JSON.parse(context.localStorage.hapikaraAmbiance).version,1);
console.log('Ambiance OK: numeric import bounds, persistence round trip, 5 opaque/static palm LODs, 5 dry flat garden sites.');
