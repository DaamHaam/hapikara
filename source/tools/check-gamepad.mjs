import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync(new URL('../src/math.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../src/gamepad.js',import.meta.url),'utf8');
vm.runInNewContext(code+`
const assert=(b,m)=>{if(!b)throw Error(m);};
let menu=true,mechanismPhase=0,lkx=0,lky=0,mdx=0,mdy=0,l2x=0,l2y=0,actions=0,starts=0,focused=true;
const LV=1,F=new Float32Array(6),VX=0,VY=1,VZ=2;
const document={documentElement:{dataset:{}},activeElement:{blur(){}},hasFocus:()=>focused,exitPointerLock(){},addEventListener(){}};
const ui=m=>{menu=m;},release=()=>{PAD.fill(0);},activateMechanism=()=>{actions++;mechanismPhase=mechanismPhase?0:1;};
const option=()=>({textContent:'',hidden:true,focus(){},toggleAttribute(){},click(){this.clicks=(this.clicks||0)+1;}});
const options=[option(),option(),option(),option()],hint=option();
const $=id=>id==='pad-help'?hint:id==='d'?options[0]:{querySelectorAll:()=>options.slice(1)};
const addEventListener=()=>{};initGamepad();padAudio=()=>{starts++;};
const pad={mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};
let devices=[pad];const navigator={getGamepads:()=>devices};
const tick=()=>pollGamepad(1/60),neutral=()=>{pad.axes.fill(0);for(const b of pad.buttons){b.value=0;b.pressed=false;}tick();};
const down=i=>{pad.buttons[i].value=1;tick();},up=i=>{pad.buttons[i].value=0;tick();};
// A held during connection must not start a visit, including after a quality reload.
pad.buttons[0].value=1;tick();tick();assert(menu&&starts===0,'held connection button ignored');neutral();
down(0);assert(!menu&&starts===1,'A starts without pointer lock');tick();assert(actions===0,'held A does not trigger action after starting');up(0);
pad.axes[0]=.1;pad.axes[1]=-.12;tick();assert(PAD[0]===0&&PAD[1]===0,'radial dead zone');
pad.axes[0]=1;pad.axes[1]=-1;tick();assert(abs(hypot(PAD[0],PAD[1])-1)<1e-6&&PAD[0]>0&&PAD[1]>0,'normalised diagonal movement');
neutral();pad.axes[2]=1;pad.axes[3]=1;lkx=lky=0;sampleGamepad(1/60,devices);const yaw60=lkx;lkx=lky=0;sampleGamepad(1/120,devices);sampleGamepad(1/120,devices);assert(abs(lkx-yaw60)<1e-8&&lky>0,'look refresh independent with correct vertical sign');neutral();
pad.buttons[7].value=.8;tick();assert(PAD[5]===1&&PAD[2]===0,'right trigger accelerates without climbing');pad.buttons[7].value=0;tick();assert(PAD[5]===0,'trigger release ends boost');neutral();down(1);assert(PAD[5]===0,'B no longer accelerates');up(1);
down(0);assert(actions===1&&PAD.every(v=>v===0),'A acts and suppresses movement during sequence');tick();assert(actions===1,'held A does not skip');up(0);down(0);assert(actions===2,'fresh A can skip');up(0);
down(9);assert(menu,'Start opens menu');tick();assert(menu,'held Start does not toggle');up(9);
down(13);up(13);assert(padChoice===2,'down selects current middle quality row');down(15);up(15);assert(padChoice===3,'right selects detailed quality');down(0);up(0);assert(options[3].clicks===1&&menu,'A invokes quality button');down(12);up(12);down(0);up(0);assert(!menu,'up then A resumes');
document.documentElement.dataset.look='open';down(9);assert(!menu&&PAD.every(v=>v===0),'developer workshop protected');delete document.documentElement.dataset.look;up(9);
pad.axes[1]=-1;tick();F[VX]=9;devices=[];tick();assert(menu&&PAD.every(v=>v===0)&&F[VX]===0,'disconnect stops motion and pauses');
devices=[pad];tick();assert(!padArmed,'reconnection requires neutral sticks');neutral();assert(padArmed,'neutral rearms');down(9);up(9);assert(!menu,'Start resumes after reconnection');
pad.axes[1]=-1;tick();focused=false;tick();assert(menu&&!padArmed&&PAD.every(v=>v===0),'focus loss pauses and disarms');focused=true;neutral();
devices=[{...pad,mapping:''}];tick();assert(padIndex===-1&&PAD.every(v=>v===0)&&hint.textContent.includes('sans disposition standard'),'unknown mapping rejected safely');
`,{console});
console.log('Gamepad OK: neutral arming, dead zone, proportional movement, look timing, triggers, held/edge buttons, menus/quality, workshop, disconnect and focus loss.');

// Exercise the actual production frame(), not a second implementation of camera motion.
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const frame=main.slice(main.indexOf('function frame(now)'),main.indexOf('// input and menu'));
vm.runInNewContext(code+frame+`
const assert=(b,m)=>{if(!b)throw Error(m);};
const CX=0,CY=1,CZ=2,YAW=3,PIT=4,VX=5,VY=6,VZ=7,LAST=8,TIME=9,DT=10,HUDT=11;
const F=new Float64Array(16),document={hidden:false,hasFocus:()=>true,documentElement:{dataset:{}},activeElement:{blur(){}}};
const p={mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0}))};
const navigator={getGamepads:()=>[p]},requestAnimationFrame=()=>{},render=()=>{},render0=()=>{},release=()=>{},ui=m=>{menu=m;},activateMechanism=()=>false;
let dead=false,lookBaking=false,menu=false,mechanismPhase=0,mdx=0,mdy=0,lkx=0,lky=0,l2x=0,l2y=0,kf=0,kb=0,kl=0,kr=0,ku=0,kd=0,ks=0,tId=-1,tN=0,spd=1,solid=true,hud=false,collisions=0;
const FPS=0,DYN=false,SLOW=1,waterSurfaceAt=()=>-1e9,collide=()=>{collisions++;},updateMechanismPrompt=()=>{};
const step=()=>frame(F[LAST]+1000/60);step();p.axes[1]=-1;
for(let i=0;i<60;i++)step();assert(F[CZ]<-10&&abs(F[CX])<.001&&collisions>50,'left stick advances through real collision path');
const normal=-F[CZ];F.fill(0);p.buttons[7].value=1;for(let i=0;i<60;i++)step();assert(-F[CZ]>normal*5,'right trigger changes real movement speed');
p.axes[1]=0;F.fill(0);for(let i=0;i<60;i++)step();assert(abs(F[CY])<1e-9,'right trigger alone does not climb');p.buttons[7].value=0;
p.buttons[7].value=0;p.axes[2]=1;F.fill(0);for(let i=0;i<60;i++)step();assert(F[YAW]>1,'right stick rotates real camera');
menu=true;F[VX]=30;const x=F[CX];step();assert(F[CX]===x,'menu does not drift with residual velocity');
`,{console});
console.log('Gamepad frame integration OK: translation, collision path, boost, ascent, look and paused camera.');
