// CPU geometry/plan contract, independent of the GPU. Uses the actual mesh and collision queries.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = f => readFileSync(new URL('../src/'+f,import.meta.url),'utf8');
const source = ['math.js','layout.js'].map(read).join('\n') + '\n' + read('sh_scene.js').split('// per view')[0] + '\n' + read('meshes.js') + '\n' + read('collide.js');
vm.runInNewContext(source + `
const assert = (b,m) => {if(!b) throw Error(m)};
setHard({boxes:[],bridges:[]}); landY=terrainH;
let dry=0,wet=0;
for(let x=-440.3;x<440;x+=3.7) for(let z=-370.2;z<370;z+=4.1) {
 if(inRing(x,z)||!inCity(x,z)) continue;
 const n=BLOCKS.filter(b=>x>b[0]&&x<b[2]&&z>b[1]&&z<b[3]).length;
 assert(n===(canalAt(x,z)?0:1),'land/water partition '+x+','+z);
 if(canalAt(x,z)) wet++; else dry++;
 if(max(abs(x),abs(z))>140) {
  surfaceAt(x,z,1e6);
  assert(abs(COL[0]-(canalAt(x,z)?WATER+CLEAR_W:cityH(x,z)+CLEAR))<1e-6,'collision height');
 }
}
const mesh=meshCityGround();
assert(mesh.ib.length>0,'empty ground');
for(const [x,z,h]of [[-207,-191,22],[-200,36,16],[190,203,16],[345,130,WATER]]) {
 surfaceAt(x,z,1e6); assert(abs(COL[0]-(h+(h===WATER?CLEAR_W:CLEAR)))<1e-6,'landmark collision');
}
console.log('Plan OK:',BLOCKS.length,'convex cells,',dry,'land and',wet,'water samples; terrace/canal collision heights agree.');
`, {console});
