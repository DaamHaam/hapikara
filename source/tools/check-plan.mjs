// CPU geometry/plan contract, independent of the GPU. Uses the actual mesh and collision queries.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = f => readFileSync(new URL('../src/'+f,import.meta.url),'utf8');
const source = ['math.js'].map(read).join('\n') + '\nconst LOOK=new Float32Array(27);LOOK[20]=12;LOOK[21]=-44;\n' + ['layout.js','crypt.js'].map(read).join('\n') + '\n' + read('sh_scene.js').split('// per view')[0] + '\nconst LEAFK=1;\n' + ['meshes.js','egypt.js','discoveries.js','aquatics.js','collide.js'].map(read).join('\n');
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
  surfaceAtPoint(x,z,1e6);
  assert(abs(COL[0]-(canalAt(x,z)?FLOOR_Y+CLEAR:cityH(x,z)+CLEAR))<1e-6,'collision height');
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
meshes.push(meshCanalFinds());
meshes.push(meshCrypt(),meshFlame(),meshMosaic(),meshTreasure(0),meshTreasure(1));
for(let k=0;k<3;k++)for(let lod=0;lod<2;lod++)meshes.push(meshFish(k,lod));
for(const [x,z,k]of DISCOVERY_SITES){
 const p=discoveryAt(x,z,terrainH);assert(p,'missing discovery '+k);
 assert(!inCity(p[0],p[2])&&p[1]-p[3]<2.7,'discovery site ground');
 for(let lod=0;lod<2;lod++)meshes.push(meshDiscovery(k,lod).mesh);
}
for(const m of meshes){const f=new Float32Array(m.vb);for(let i=0;i<m.nv;i++)for(let j=0;j<3;j++)assert(Number.isFinite(f[i*5+j]),'non-finite vertex');for(const i of m.ib)assert(i<m.nv,'index outside mesh');}
for(const [x,z,h]of [[-207,-191,22],[-200,36,16],[190,203,16],[345,130,FLOOR_Y]]) {
 surfaceAtPoint(x,z,1e6); assert(abs(COL[0]-(h+CLEAR))<1e-6,'landmark collision');
}
for(const [x,z,h] of [[-200,-145,22.64],[-220,115,16.64],[180,258,16.64]]) {surfaceAtPoint(x,z,1e6);assert(abs(COL[0]-h-CLEAR_W)<1e-6,'bief water height');}
for(const [x,z] of [[88,0],[-88,0],[0,88],[0,-88],[40,0],[0,-40]]){surfaceAtPoint(x,z,1e6);assert(abs(COL[0]-acroStairY(x,z)-CLEAR)<1e-6,'acropolis stair ramp');}
setHard({boxes:[],bridges:[119.6,-10,140.4,10,10.91,0,.6]});
surfaceAtPoint(130,0,20);assert(abs(COL[0]-11.81)<1e-6,'bridge deck hump');
surfaceAtPoint(130,0,8);assert(abs(COL[1]-9.71)<1e-6,'bridge underside');
setHard({boxes:[],bridges:[]});
const F=new Float64Array(16),CX=0,CY=1,CZ=2,VX=3,VY=4,VZ=5;
F.set([155,5,200]);collide(130,5,200);
assert(F[CX]<140.4&&F[CX]>139&&F[CY]===5,'swept submerged quay collision');
F.set([130,0,200]);collide(130,5,200);assert(abs(F[CY]-FLOOR_Y-CLEAR)<1e-6,'solid canal bottom');
F.set([130,9,200]);collide(130,5,200);assert(F[CY]===9,'water surface remains passable');
assert(waterSurfaceAt(130,200)===WATER&&waterSurfaceAt(155,200)<-1e8,'submersion footprint');
// Complete round trip: only a submerged camera can cross the mouth; ramp and bend are traversable.
function go(x,y,z){const px=F[CX],py=F[CY],pz=F[CZ];F[CX]=x;F[CY]=y;F[CZ]=z;collide(px,py,pz);}
F.set([130,4.8,36]);for(let x=129.75;x>=54;x-=.25)go(x,F[CY],36);
assert(abs(F[CX]-54)<.01&&abs(F[CY]-11.7)<.01,'crypt ascent');
for(let z=35.75;z>=0;z-=.25)go(54,F[CY],z);
assert(abs(F[CZ])<.01&&cryptInside(F[CX],F[CY],F[CZ]),'crypt bend');
go(54,100,0);assert(F[CY]<=23.11,'crypt ceiling');
F.set([130,8,36]);for(let x=129.75;x>=110;x-=.25)go(x,8,36);
assert(F[CX]>119.6,'mouth inaccessible above water');
F.set([-17.6,15.8,11]);for(let z=11.25;z<16;z+=.25)go(F[CX],15.8,z);
assert(F[CZ]<12,'sun aperture cannot be traversed');
F.set([54,11.7,0]);for(let z=.25;z<=36;z+=.25)go(54,F[CY],z);
for(let x=54.25;x<=130;x+=.25)go(x,F[CY],36);
assert(F[CX]>129&&F[CY]<5.5,'crypt exit stays submerged');
// Both walls of the ascending gallery, then the bend: pool terrain must never lift us out.
for(const x of [60,70,78,90])for(const side of [-1,1]){
 const y=cryptFloor(1,x)+1.25;F.set([x,y,36]);
 for(let j=0;j<80;j++)go(F[CX],y,F[CZ]+side*.24);
 assert(F[CZ]>=32.7&&F[CZ]<=39.3&&abs(F[CY]-y)<.01,'gallery side wall escape '+x+','+side);
}
for(const side of [-1,1]){
 F.set([54,12.2,25]);for(let j=0;j<80;j++)go(F[CX]+side*.24,12.2,F[CZ]);
 assert(F[CX]>=50.7&&F[CX]<=57.3&&abs(F[CY]-12.2)<.01,'bend side wall escape');
}
F.set([70,9.4,36]);go(40,40,60);assert(cryptInside(F[CX],F[CY],F[CZ]),'fast diagonal stays inside');
// Actual pyramid triangles must leave a clear sun line, not just a painted aperture.
function rayHits(mesh,origin,dir){
 const vdot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
 const f=new Float32Array(mesh.vb);let hits=0;
 for(let k=0;k<mesh.ib.length;k+=3){
  const a=mesh.ib[k]*5,b=mesh.ib[k+1]*5,c=mesh.ib[k+2]*5;
  const e=[f[b]-f[a],f[b+1]-f[a+1],f[b+2]-f[a+2]],v=[f[c]-f[a],f[c+1]-f[a+1],f[c+2]-f[a+2]],h=vcross(dir,v),det=vdot(e,h);
  if(abs(det)<1e-8)continue;const q=origin.map((n,j)=>n-f[a+j]),u=vdot(q,h)/det;if(u<0||u>1)continue;
  const r=vcross(q,e),w=vdot(dir,r)/det,t=vdot(v,r)/det;if(w>=0&&u+w<=1&&t>6&&t<220)hits++;
 }return hits;
}
assert(rayHits(meshPyramid(),CRYPT_TARGET,SUN)===0,'pyramid solar shaft obstructed');
assert(rayHits(meshPyramid(),CRYPT_TARGET.map((v,i)=>v+CRYPT_U[i]*2),SUN)>0,'shaft cut too wide');
assert(rayHits(meshCrypt(),CRYPT_TARGET,SUN)===0,'crypt solar shaft obstructed');
assert(rayHits(meshCrypt(),CRYPT_TARGET.map((v,i)=>v+CRYPT_U[i]*3),SUN)>0,'crypt aperture cut too wide');
// Shoal travel envelopes must stay below the surface and above the riverbed.
let checkLevel=0;const QL=(h,m,l)=>[h,m,l][checkLevel],AUTO=false,K={SOLID:0},NO_SHADOW=4,NO_BAKE=8,NO_MIRROR=2,FISH_SCHOOL=256,Q0=[0,0,0,1],rgb=()=>0;
for(checkLevel=0;checkLevel<3;checkLevel++){
 let types=0,fishN=0;
 populateAquatics({gH:terrainH,type:()=>types++,put:(ty,x,y,z,s)=>{
  if(ty>=3)return;fishN++;
  assert(y+.15+s*.5<-.1,'fish breaches surface');
  for(let j=0;j<24;j++){
   const a=j*TAU/24,xx=x+3.5*sin(a),zz=z+2.5*cos(a);
   for(const [dx,dz]of [[2.3,0],[-2.3,0],[0,2.3],[0,-2.3]])assert(y-.15-s*.5>terrainH(xx+dx,zz+dz),'fish penetrates bed');
  }
 }});
 assert(fishN===[320,240,160][checkLevel],'shoal count by quality');
}
console.log('Plan OK:',BLOCKS.length,'convex cells,',dry,'land and',wet,'water samples;',checked,'rendered tops,',meshes.length,'finite meshes; terrace/bief/stair/bridge collisions agree.');
`, {console});
