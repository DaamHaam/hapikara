// Standard Gamepad mapping: Xbox / PlayStation as normalised by the browser.
// Reuse our state; navigator.getGamepads() supplies the browser-owned snapshot.
const PAD=new Float32Array(6); // forward, right, up, yaw, pitch, fast
let padIndex=-1,padPrevious=0,padArmed=false,padNav=0,padChoice=0,padWasMenu=false,padOwned=false;
let padHint=null,padOptions=null,padAudio=()=>{};
function padButton(p,i){const b=p.buttons[i];return b?clamp(Number.isFinite(b.value)?b.value:b.pressed?1:0,0,1):0;}
function padStick(p,offset,out){
  let x=p.axes[offset],y=p.axes[offset+1];x=Number.isFinite(x)?clamp(x,-1,1):0;y=Number.isFinite(y)?clamp(y,-1,1):0;
  const length=hypot(x,y),strength=clamp((length-.18)/.82,0,1),scale=length>0?strength/length:0;
  PAD[out]=x*scale;PAD[out+1]=y*scale;
}
function padFocus(){
  if(!padOptions)return;
  for(let i=0;i<4;i++)padOptions[i].toggleAttribute('data-pad-focus',i===padChoice&&menu&&padOwned);
  if(menu&&padOwned)padOptions[padChoice].focus({preventScroll:true});
}
function padSuspend(){
  PAD.fill(0);padArmed=false;padPrevious=0;padNav=0;
  if(padOwned){F[VX]=F[VY]=F[VZ]=0;mdx=mdy=lkx=lky=l2x=l2y=0;ui(true);}
}
function padVisit(){
  release();F[VX]=F[VY]=F[VZ]=0;ui(false);$('d').textContent='Reprendre la visite';
  document.activeElement?.blur();padFocus();
}
function sampleGamepad(dt,pads){
  PAD.fill(0);
  let p=padIndex>=0?pads[padIndex]:null;
  if(!p||p.connected===false||p.mapping!=='standard'){
    if(padIndex>=0){padSuspend();padIndex=-1;padOwned=false;padFocus();}
    let unknown=false;
    for(let i=0;i<pads.length;i++)if(pads[i]&&pads[i].connected!==false){if(pads[i].mapping==='standard'){p=pads[i];padIndex=i;break;}unknown=true;}
    if(padIndex<0){
      if(padHint){const message=unknown?'Manette sans disposition standard : utilisez le clavier ou la souris.':'';if(padHint.textContent!==message)padHint.textContent=message;if(padHint.hidden===unknown)padHint.hidden=!unknown;}
      return;
    }
    padArmed=false;padPrevious=0;padNav=0;
    if(padHint){padHint.hidden=false;padHint.textContent='Manette : A / ✕ valider · croix directionnelle : menus · Start / Options : accueil. En visite : sticks déplacer / regarder · gâchette droite accélérer.';}
  }
  let mask=0;for(let i=0;i<min(17,p.buttons.length);i++)if(padButton(p,i)>.5||p.buttons[i]?.pressed)mask|=1<<i;
  padStick(p,0,1); // right / forward (negated below)
  const right=PAD[1],forward=-PAD[2];
  padStick(p,2,3);
  const up=0; // triggers no longer climb: right trigger boosts, so sticks stay free while running
  const quiet=!mask&&!right&&!forward&&!PAD[3]&&!PAD[4]&&!up;
  if(!padArmed){PAD.fill(0);padPrevious=mask;if(quiet)padArmed=true;return;}
  const pressed=mask&~padPrevious;padPrevious=mask;
  // Workshop remains a keyboard/mouse tool. Consume buttons without activating home behind it.
  if(document.documentElement.dataset.look==='open'){PAD.fill(0);return;}
  if(pressed){padOwned=true;padAudio();}
  if(pressed&(1<<9)){
    if(menu)padVisit();else{ui(true);document.exitPointerLock?.();}
    PAD.fill(0);padNav=0;padWasMenu=menu;padChoice=0;padFocus();return;
  }
  if(menu){
    if(!padWasMenu){padChoice=0;padNav=0;}padWasMenu=true;
    const nav=mask&(1<<12)?1:mask&(1<<13)?2:mask&(1<<14)?3:mask&(1<<15)?4:forward>.55?1:forward<-.55?2:right<-.55?3:right>.55?4:0;
    if(nav&&nav!==padNav){padOwned=true;if(nav===1)padChoice=0;else if(nav===2)padChoice=padChoice||3-LV;else padChoice=padChoice?clamp(padChoice+(nav===3?-1:1),1,3):3-LV;padFocus();}
    padNav=nav;
    if(pressed&1){if(padChoice===0)padVisit();else padOptions[padChoice].click();}
    PAD.fill(0);return;
  }
  padWasMenu=false;padNav=0;
  if(pressed&1)activateMechanism(); // same action / skip as the contextual button
  if(menu||mechanismPhase){PAD.fill(0);return;}
  if(right||forward||up||PAD[3]||PAD[4])padOwned=true;
  PAD[0]=forward;PAD[1]=right;PAD[2]=up;PAD[5]=mask&(1<<7)?1:0;
  // Angular velocity, independent of refresh rate; positive stick Y looks down.
  lkx+=PAD[3]*1.8*dt;lky+=PAD[4]*1.4*dt;
}
function pollGamepad(dt){
  if(!navigator.getGamepads||!document.hasFocus()){if(padArmed)padSuspend();return;}
  try{sampleGamepad(dt,navigator.getGamepads());}catch{PAD.fill(0);if(padIndex>=0)padSuspend();}
}
function initGamepad(){
  padHint=$('pad-help');padOptions=[$('d'),...$('q').querySelectorAll('button')];
  addEventListener('blur',padSuspend);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)padSuspend();});
  const manual=()=>{if(padOwned){padOwned=false;padFocus();}};
  addEventListener('pointerdown',manual);addEventListener('keydown',manual);
}
