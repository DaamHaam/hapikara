initMechanism();
initGamepad();
initFullscreen();
// Lighting workshop. All DOM work happens on interaction, never inside render().
if (!AUTO && !mob) {
  const panel=$('look-panel'),status=$('look-status'),data=$('look-data');
  let comparing=false,returnFocus=null,wasMenu=true;
  const sliders=[],outputs=[];
  const sunPending=()=>abs(LOOK[20]-LOOK_BASE[20])>.01||abs(LOOK[21]-LOOK_BASE[21])>.01;
  const refresh=()=>{
    for(let i=0;i<LOOK_FIELDS.length;i++){sliders[i].value=LOOK[i];outputs[i].value=LOOK[i].toFixed(i===22?0:i===23?3:i===20||i===21?1:2);}
    $('sun-apply').disabled=!sunPending();
    $('look-compare').setAttribute('aria-pressed',String(comparing));
    $('look-compare').textContent=comparing?'Revenir à mes essais':'Comparer à l’ouverture';
  };
  const apply=()=>{
    comparing=false;LOOK_ACTIVE.set(LOOK);syncLook();F[RESET]=1;scheduleEnvironment();refresh();
    status.textContent=sunPending()?'Position du soleil en attente : appliquez-la ci-dessus.':'Essai pour cette visite. Les valeurs par défaut reviennent à la prochaine ouverture.';
  };
  let fieldset;const groups=new Map();
  LOOK_FIELDS.forEach((f,i)=>{
    if(!groups.has(f[1])){fieldset=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent=f[1];fieldset.append(legend);$('look-fields').append(fieldset);groups.set(f[1],fieldset);}else fieldset=groups.get(f[1]);
    const label=document.createElement('label'),name=document.createElement('span'),out=document.createElement('output'),input=document.createElement('input');
    label.className='slider-label';label.htmlFor='look-'+f[0];name.textContent=f[2];out.htmlFor=label.htmlFor;label.append(name,out);
    input.type='range';input.id=label.htmlFor;input.min=f[3];input.max=f[4];input.step=f[5];input.value=LOOK[i];
    input.oninput=()=>{LOOK[i]=+input.value;apply();};sliders.push(input);outputs.push(out);fieldset.append(label,input);
  });
  // New experiments first; preserve LOOK indices shared with the shaders and imports.
  const fields=$('look-fields');
  fields.prepend(groups.get('Pierre'),groups.get('Vie sous-marine'),groups.get('Sous l’eau'));
  const sunHelp=document.createElement('p');sunHelp.textContent='La position du soleil recharge la cité pour accorder le ciel, les reflets et les ombres.';
  const sunApply=document.createElement('button');sunApply.id='sun-apply';sunApply.textContent='Appliquer la position du soleil';
  groups.get('Position du soleil').append(sunHelp,sunApply);
  sunApply.onclick=()=>{
    try{sessionStorage.hapikaraPendingLook=JSON.stringify(lookPayload());sessionStorage.hapikaraCamera=JSON.stringify(Array.from(F.slice(0,5)));sessionStorage.hapikaraPendingGate=GATE_OPEN>=1?'1':'0';sessionStorage.hapikaraOpenLook='1';}catch{}
    const url=new URL(location.href);url.searchParams.delete('lookDefault');location.href=url.href;
  };
  const show=(open)=>{
    if(open){wasMenu=menu;returnFocus=document.activeElement;ui(true);document.exitPointerLock?.();panel.hidden=false;document.documentElement.dataset.look='open';$('look-close').focus();}
    else{panel.hidden=true;delete document.documentElement.dataset.look;if(comparing){comparing=false;LOOK_ACTIVE.set(LOOK);syncLook();F[RESET]=1;scheduleEnvironment();refresh();}ui(wasMenu);if(!wasMenu)capture();else returnFocus?.focus();}

  };

  $('look-close').onclick=()=>show(false);
  $('o').onclick=()=>{if(!panel.hidden)show(false);ui(true);};
  $('d').addEventListener('click',()=>{if(!panel.hidden)show(false);});
  document.querySelectorAll('[data-look]').forEach(b=>b.onclick=()=>{
    for(let i=0;i<20;i++)LOOK[i]=LOOK_FIELDS[i][6];
    const preset=LOOK_PRESETS[b.dataset.look];for(let i=0;i<20;i++)if(preset[LOOK_FIELDS[i][0]]!==undefined)LOOK[i]=preset[LOOK_FIELDS[i][0]];
    apply();
  });
  $('look-compare').onclick=()=>{comparing=!comparing;LOOK_ACTIVE.set(comparing?LOOK_BASE:LOOK);syncLook();F[RESET]=1;scheduleEnvironment();refresh();status.textContent=comparing?'Ambiance présente à l’ouverture. La position du soleil reste celle de cette visite.':'Vos essais sont affichés.';};
  $('look-reset').onclick=()=>{LOOK.set(LOOK_DEFAULT);apply();};
  $('water-reset').onclick=()=>{for(const i of [13,14,22,23,24])LOOK[i]=LOOK_DEFAULT[i];apply();};
  $('look-copy').onclick=async()=>{
    data.hidden=false;data.value=JSON.stringify(lookPayload(),null,2);data.focus();data.select();
    try{await navigator.clipboard.writeText(data.value);status.textContent='Réglages copiés. Vous pouvez les coller dans le chat.';}catch{status.textContent='Sélection prête : copiez ce texte avec le menu de votre appareil.';}
  };
  $('look-import').onclick=()=>{
    if(data.hidden){data.hidden=false;data.value='';data.placeholder='Collez ici les réglages copiés, puis cliquez à nouveau sur Importer.';data.focus();status.textContent='Collez les valeurs, puis cliquez à nouveau sur Importer.';return;}
    try{if(!readLook(JSON.parse(data.value)))throw Error();apply();}catch{status.textContent='Format de réglages non reconnu. Aucune valeur n’a été importée.';}
  };
  addEventListener('keydown',e=>{
    if(e.code==='Escape'&&!panel.hidden){e.preventDefault();show(false);return;}
    if(e.target instanceof HTMLTextAreaElement)return;
    if(e.code==='KeyL'&&!e.repeat){e.preventDefault();show(panel.hidden);}

  });
  try{
    const saved=JSON.parse(sessionStorage.hapikaraCamera||'null');
    const gateCarry=sessionStorage.hapikaraPendingGate;sessionStorage.removeItem('hapikaraPendingGate');
    if(Array.isArray(saved)&&saved.length===5&&saved.every(Number.isFinite)){F.set(saved,0);if(gateCarry==='1')GATE_OPEN=leverTurn=1;F[RESET]=1;}
    sessionStorage.removeItem('hapikaraCamera');
    if(sessionStorage.hapikaraOpenLook){sessionStorage.removeItem('hapikaraOpenLook');show(true);}
  }catch{}
  refresh();
}
