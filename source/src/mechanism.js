// One mechanism, reset on every load. State is shared by rendering and collision.
const MECHANISM_SITE=new Float64Array([EAST_QUAY[0]-7,3.7,EAST_QUAY[1]-11]);
let GATE_OPEN=0,leverTurn=0,mechanismPhase=0,mechanismTime=0,mechanismFade=0;
const mechanismSaved=new Float64Array(5);
let mechanismButton=null,mechanismPrompt=false,mechanismSoundStop=null;
const easeMechanism=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
function mechanismAvailable(){
  if(menu||mechanismPhase||GATE_OPEN>=1)return false;
  const dx=MECHANISM_SITE[0]-F[CX],dy=MECHANISM_SITE[1]+2.7-F[CY],dz=MECHANISM_SITE[2]-F[CZ],d=hypot(dx,dy,dz);
  return d<9&&d>.1&&(dx*sin(F[YAW])*cos(F[PIT])+dy*sin(F[PIT])-dz*cos(F[YAW])*cos(F[PIT]))/d>.4;
}
function updateMechanismPrompt(){
  if(!mechanismButton)return;
  const visible=!menu&&(mechanismPhase>0||mechanismAvailable());
  if(visible!==mechanismPrompt){mechanismPrompt=visible;mechanismButton.hidden=!visible;}
}
function activateMechanism(){
  if(mechanismPhase){finishMechanism();return true;}
  if(!mechanismAvailable())return false;
  mechanismSaved.set(F.subarray(0,5));mechanismPhase=1;mechanismTime=0;
  release();F[VX]=F[VY]=F[VZ]=0;mdx=mdy=lkx=lky=l2x=l2y=0;
  if(mechanismButton)mechanismButton.textContent='Passer';
  playMechanismSound();updateMechanismPrompt();return true;
}
function finishMechanism(){
  if(mechanismSoundStop)mechanismSoundStop();
  GATE_OPEN=leverTurn=1;mechanismPhase=0;mechanismTime=mechanismFade=0;
  F.set(mechanismSaved,0);F[VX]=F[VY]=F[VZ]=0;F[RESET]=1;
  release();mdx=mdy=lkx=lky=l2x=l2y=0;
  if(mechanismButton)mechanismButton.textContent='Actionner';updateMechanismPrompt();
}
function stepMechanism(dt){
  if(menu)return;mechanismTime+=dt;
  if(mechanismPhase===1){
    leverTurn=easeMechanism(mechanismTime/.8);mechanismFade=easeMechanism((mechanismTime-.8)/.4);
    if(mechanismTime>=1.2){mechanismPhase=2;mechanismTime=0;F[CX]=132;F[CY]=5;F[CZ]=36;F[YAW]=-PI/2;F[PIT]=-.01;F[RESET]=1;}
  }else if(mechanismPhase===2){
    GATE_OPEN=easeMechanism((mechanismTime-.5)/2.6);
    mechanismFade=mechanismTime<.4?1-easeMechanism(mechanismTime/.4):easeMechanism((mechanismTime-3.7)/.4);
    if(mechanismTime>=4.1){mechanismPhase=3;mechanismTime=0;F.set(mechanismSaved,0);F[RESET]=1;mechanismFade=1;}
  }else if(mechanismPhase===3){mechanismFade=1-easeMechanism(mechanismTime/.4);if(mechanismTime>=.4)finishMechanism();}
  updateMechanismPrompt();
}
function playMechanismSound(){
  if(AUTO)return;
  try{
    if(localStorage.atlantisMute==='1')return;
    // Independent one-shot effect; music.js, its melody and mix are unchanged.
    const ctx=new AudioContext(),master=ctx.createGain();master.gain.value=.65;master.connect(ctx.destination);
    const now=ctx.currentTime,click=ctx.createGain(),osc=ctx.createOscillator(),clickFilter=ctx.createBiquadFilter();
    clickFilter.type='lowpass';clickFilter.frequency.value=650;osc.type='triangle';
    osc.frequency.setValueAtTime(115,now+.5);osc.frequency.exponentialRampToValueAtTime(35,now+.85);
    click.gain.setValueAtTime(0,now);click.gain.setValueAtTime(.28,now+.5);click.gain.exponentialRampToValueAtTime(.001,now+.95);
    osc.connect(clickFilter);clickFilter.connect(click);click.connect(master);osc.start(now+.5);osc.stop(now+1);
    // A separate envelope prevents the latch click from masking the sliding stone.
    // The low-mid noise remains audible on phone speakers, with a soft bass layer.
    const noise=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=noise.getChannelData(0),rng=RNG(2411);
    for(let i=0;i<data.length;i++)data[i]=(rng()*2-1)*(.7+.3*sin(i*.003));
    const source=ctx.createBufferSource(),rumble=ctx.createGain(),stone=ctx.createBiquadFilter(),bass=ctx.createOscillator(),bassGain=ctx.createGain();
    source.buffer=noise;stone.type='lowpass';stone.frequency.value=420;
    rumble.gain.setValueAtTime(0,now);rumble.gain.setValueAtTime(0,now+1.7);rumble.gain.linearRampToValueAtTime(.42,now+1.95);rumble.gain.setValueAtTime(.42,now+4.1);rumble.gain.linearRampToValueAtTime(0,now+4.6);
    source.connect(stone);stone.connect(rumble);rumble.connect(master);
    bass.type='sine';bass.frequency.setValueAtTime(72,now+1.7);bass.frequency.linearRampToValueAtTime(48,now+4.3);
    bassGain.gain.setValueAtTime(0,now);bassGain.gain.setValueAtTime(0,now+1.7);bassGain.gain.linearRampToValueAtTime(.12,now+2);bassGain.gain.setValueAtTime(.12,now+4.1);bassGain.gain.linearRampToValueAtTime(0,now+4.6);
    bass.connect(bassGain);bassGain.connect(master);bass.start(now+1.7);bass.stop(now+4.7);source.start(now+1.7);source.stop(now+4.7);
    let stopped=false;
    const stop=()=>{if(stopped)return;stopped=true;mechanismSoundStop=null;ctx.close().catch(()=>0);document.removeEventListener('visibilitychange',hidden);removeEventListener('keydown',muteEffect);};
    const hidden=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hidden);source.onended=stop;
    const muteEffect=e=>{if(e.code==='KeyM')try{if(localStorage.atlantisMute==='1')stop();}catch{}};addEventListener('keydown',muteEffect);mechanismSoundStop=stop;
    ctx.resume().catch(stop);
  }catch{} // An unavailable audio device must never stop the interaction.
}
function mechanismKey(e){
  if(e.code==='Escape'&&mechanismPhase){finishMechanism();return;}
  if(e.code!=='Space'||e.repeat||menu||mechanismPhase||e.defaultPrevented)return;
  const tag=e.target?.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||tag==='BUTTON'||e.target?.isContentEditable)return;
  if(mechanismAvailable()){e.preventDefault();activateMechanism();}
}
function initMechanism(){
  mechanismButton=$('action');mechanismButton.onclick=e=>{e.stopPropagation();activateMechanism();};
  addEventListener('keydown',mechanismKey);
}
function meshScarab(){
  const m=new MB(2048);m.mat=M.PAINT;m.ea=PC.MALA;
  cryptEllipsoid(m,[0,0,0],[.3,.4,.065],16,10);m.ea=0;m.mat=M.GOLD;
  m.tube([[0,-.36,.075,.025],[0,.38,.075,.025]],6,false);
  for(const s of [-1,1])for(let j=0;j<3;j++){const y=-.27+j*.22;m.tube([[s*.22,y,.05,.028],[s*.5,y-.1,.04,.028],[s*.65,y+.12,.04,.028]],6,false);}
  const ring=[];for(let j=0;j<=32;j++){const a=j*TAU/32;ring.push([cos(a)*.78,sin(a)*.78,.01,.035]);}m.tube(ring,6,false);
  return m.build();
}
function meshGate(){const m=new MB(256);m.mat=M.DOOR;m.box(118.1,3.1,32.05,118.92,6.35,39.95,.08);return m.build();}
function meshLever(){const m=new MB(256);m.mat=M.LEVER;m.tube([[0,1.7,0,.3],[0,6.8,0,.27]],10,false);m.box(-1.5,6.55,-.36,1.5,7.05,.36,.1);return m.build();}
function populateMechanism({type,put,gH,hard}){
  const x=MECHANISM_SITE[0],z=MECHANISM_SITE[2],y=3.6;MECHANISM_SITE[1]=y+.1;
  const m=new MB(2048);m.mat=M.SANDST;m.box(-4,-3,-4,4,.35,4,.12);m.box(-1,.35,-1,1,1.5,1,.1);
  m.mat=M.GRANITE;m.box(-.65,1.5,-.65,.65,2.2,.65,.08);
  m.add(meshScarab(),0,1.2,1.02,0,1.35);
  put(type([m.build()],K.SOLID,1e9,1e9,400),x,y+.1,z,1,qYaw(-PI/2));hard.boxes.push(x-1,z-1,x+1,z+1,y+2.3);
  put(type([meshLever()],K.SOLID,1e9,1e9,250,0,NO_SHADOW|NO_BAKE|NO_MIRROR),x,y+.1,z,1,qYaw(-PI/2));
  put(type([meshGate()],K.SOLID,1e9,1e9,250,0,INTERIOR|NO_SHADOW|NO_BAKE|NO_MIRROR),0,0,0);
  put(type([meshScarab()],K.SOLID,1e9,1e9,160),119.18,7.9,36,1.7,qYaw(PI/2));
}
