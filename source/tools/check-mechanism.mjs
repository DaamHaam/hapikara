import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=f=>readFileSync(new URL('../src/'+f,import.meta.url),'utf8');
const source=read('math.js')+'\nconst LOOK=new Float32Array(27);LOOK[20]=12;LOOK[21]=-44;\n'+read('layout.js')+'\n'+read('crypt.js')+'\n'+read('mechanism.js');
const harness=`
const F=new Float64Array(16),CX=0,CY=1,CZ=2,YAW=3,PIT=4,VX=5,VY=6,VZ=7,RESET=13,AUTO=true;
let menu=false,mdx=0,mdy=0,lkx=0,lky=0,l2x=0,l2y=0;const release=()=>{};
const assert=(ok,m)=>{if(!ok)throw Error(m);};
assert(GATE_OPEN===0,'fresh visit must be closed');
F.set([MECHANISM_SITE[0]-5,1,MECHANISM_SITE[2],PI/2,.12]);
const saved=Array.from(F.slice(0,5));
assert(mechanismAvailable()&&activateMechanism(),'nearby facing interaction');
assert(mechanismPhase===1,'lever phase');
menu=true;stepMechanism(2);assert(mechanismTime===0,'menu pauses sequence');menu=false;
let sawDoor=false;for(let i=0;i<800;i++){stepMechanism(.01);if(mechanismPhase===2)sawDoor=true;}
assert(sawDoor&&mechanismPhase===0&&GATE_OPEN===1&&leverTurn===1,'complete sequence opens once');
assert(saved.every((v,i)=>F[i]===v)&&mechanismFade===0,'exact position and orientation restored');
assert(!activateMechanism(),'no repeated activation');
GATE_OPEN=0;assert(activateMechanism(),'restart fixture');stepMechanism(.5);finishMechanism();
assert(GATE_OPEN===1&&mechanismPhase===0&&saved.every((v,i)=>F[i]===v),'skip restores player and leaves door open');
GATE_OPEN=leverTurn=0;
const press=(extra={})=>{const e={code:'Space',repeat:false,defaultPrevented:false,target:{tagName:'CANVAS'},preventDefault(){this.defaultPrevented=true;},...extra};mechanismKey(e);return e;};
assert(!press({repeat:true}).defaultPrevented&&mechanismPhase===0,'held Space ignored');
for(const target of [{tagName:'INPUT'},{tagName:'TEXTAREA'},{tagName:'SELECT'},{tagName:'BUTTON'},{isContentEditable:true}]){press({target});assert(mechanismPhase===0,'Space must not hijack form controls');}
menu=true;press();assert(mechanismPhase===0,'Space ignored in menu');menu=false;
F[CX]-=30;press();assert(mechanismPhase===0,'no distant Space activation');F[CX]+=30;
assert(press().defaultPrevented&&mechanismPhase===1,'Space activates nearby lever and prevents scrolling');
press();assert(mechanismPhase===1,'Space does not skip or reactivate the running sequence');finishMechanism();
assert(MECHANISM_SITE[0]>EAST_QUAY[0]-17&&MECHANISM_SITE[0]<EAST_QUAY[0]+20&&MECHANISM_SITE[2]>-246&&MECHANISM_SITE[2]<-194,'lever stands on landing with clearance');

`;
vm.runInNewContext(source+harness,{console});
vm.runInNewContext(source+"\nif(GATE_OPEN!==0||mechanismPhase!==0)throw Error('reload state leaked');",{console});
console.log('Mechanism OK: proximity, pause, one opening, fade, exact return, skip, contextual Space, landing clearance and fresh-visit reset.');
