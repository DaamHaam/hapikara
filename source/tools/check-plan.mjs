// CPU geometry/plan contract, independent of the GPU. Uses the actual mesh and collision queries.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = f => readFileSync(new URL('../src/'+f,import.meta.url),'utf8');
const source = ['math.js','layout.js'].map(read).join('\n') + '\n' + read('sh_scene.js').split('// per view')[0] + '\nconst LEAFK=1;\n' + ['meshes.js','egypt.js','collide.js'].map(read).join('\n');
vm.runInNewContext(source + `
const assert = (b,m) => {if(!b) throw Error(m)};
setHard({boxes:[],bridges:[]}); landY=terrainH;
let dry=0,wet=0;
for(let x=-440.3;x<440;x+=3.7) for(let z=-370.2;z<370;z+=4.1) {
 if(inRing(x,z)||!inCity(x,z)) continue;
 const n=BLOCKS.filter(b=>x>b[0]&&x<b[2]&&z>b[1]&&z<b[3]).length;
 assert(n===(canalAt(x,z)?0:1),'land/water partition '+x+','+z);
 if(canalAt(x,z)) wet++; else dry++;
 if(max(abs(x),abs(z))>140 && quayStepY(x,z)<-1e8 && !BIEFS.some(b=>x>b[0]&&x<b[1]&&z>b[2]-7&&z<b[2])) {
  surfaceAt(x,z,1e6);
  assert(abs(COL[0]-(canalAt(x,z)?WATER+CLEAR_W:cityH(x,z)+CLEAR))<1e-6,'collision height');
 }
}
const mesh=meshCityGround();
assert(mesh.ib.length>0,'empty ground');
const f=new Float32Array(mesh.vb), bytes=new Uint8Array(mesh.vb);
let checked=0;
for(const b of BLOCKS) {
 const x=(b[0]+b[2])/2,z=(b[1]+b[3])/2;
 if(!inCity(x,z)||inRing(x,z))continue;
 let found=false;
 for(let i=0;i<mesh.ib.length;i+=3){
  const ia=mesh.ib[i],ib=mesh.ib[i+1],ic=mesh.ib[i+2],mat=bytes[ia*20+16];
  if(mat!==M.GROUND&&mat!==M.PAVE&&mat!==M.STEP)continue;
  const a=ia*5,c=ic*5,d=ib*5,ax=f[a],az=f[a+2],ux=f[d]-ax,uz=f[d+2]-az,vx=f[c]-ax,vz=f[c+2]-az,det=ux*vz-uz*vx;
  if(abs(det)<1e-6)continue;
  const u=((x-ax)*vz-(z-az)*vx)/det,v=(ux*(z-az)-uz*(x-ax))/det;
  if(u<-.00001||v<-.00001||u+v>1.00001)continue;
  const y=f[a+1]+u*(f[d+1]-f[a+1])+v*(f[c+1]-f[a+1]);
  assert(abs(y-cityH(x,z))<.003,'rendered top and collision differ'); found=true;break;
 }
 assert(found,'dry cell has no rendered top '+x+','+z);checked++;
}
const meshes=[mesh,meshPyramid(),meshAcropolis(),meshCascades(),meshSphinx(0),meshSphinx(1),meshPublic(0,0).mesh,meshPublic(1,0).mesh];
for(let v=1;v<=20;v++)meshes.push(meshVillaE(v,0).mesh);
for(let l=0;l<5;l++)meshes.push(meshPalm(11,l));
for(const m of meshes){const f=new Float32Array(m.vb);for(let i=0;i<m.nv;i++)for(let j=0;j<3;j++)assert(Number.isFinite(f[i*5+j]),'non-finite vertex');for(const i of m.ib)assert(i<m.nv,'index outside mesh');}
for(const [x,z,h]of [[-207,-191,22],[-200,36,16],[190,203,16],[345,130,WATER]]) {
 surfaceAt(x,z,1e6); assert(abs(COL[0]-(h+(h===WATER?CLEAR_W:CLEAR)))<1e-6,'landmark collision');
}
for(const [x,z,h] of [[-200,-145,22.64],[-220,115,16.64],[180,258,16.64]]) {surfaceAt(x,z,1e6);assert(abs(COL[0]-h-CLEAR_W)<1e-6,'bief water height');}
for(const [x,z] of [[88,0],[-88,0],[0,88],[0,-88],[40,0],[0,-40]]){surfaceAt(x,z,1e6);assert(abs(COL[0]-acroStairY(x,z)-CLEAR)<1e-6,'acropolis stair ramp');}
setHard({boxes:[],bridges:[119.6,-10,140.4,10,10.91,0,.6]});
surfaceAt(130,0,20);assert(abs(COL[0]-11.81)<1e-6,'bridge deck hump');
surfaceAt(130,0,8);assert(abs(COL[1]-9.71)<1e-6,'bridge underside');
console.log('Plan OK:',BLOCKS.length,'convex cells,',dry,'land and',wet,'water samples;',checked,'rendered tops,',meshes.length,'finite meshes; terrace/bief/stair/bridge collisions agree.');
`, {console});
