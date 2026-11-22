// Atlas and lighting workshop. All DOM work happens on interaction, never inside render().
if (!AUTO) {
  const panel=$('look-panel'),status=$('look-status'),data=$('look-data');
  let comparing=false,returnFocus=null;
  const sliders=[],outputs=[];
  const sunPending=()=>abs(LOOK[20]-LOOK_BASE[20])>.01||abs(LOOK[21]-LOOK_BASE[21])>.01;
  const refresh=()=>{
    for(let i=0;i<LOOK_FIELDS.length;i++){sliders[i].value=LOOK[i];outputs[i].value=LOOK[i].toFixed(i>=20?1:2);}
    $('sun-apply').disabled=!sunPending();
    $('look-compare').setAttribute('aria-pressed',String(comparing));
    $('look-compare').textContent=comparing?'Revenir à mes essais':'Comparer à l’ouverture';
  };
  const apply=()=>{
    comparing=false;LOOK_ACTIVE.set(LOOK);syncLook();F[RESET]=1;saveLook();refresh();
    status.textContent=sunPending()?'Position du soleil en attente : appliquez-la ci-dessus.':'Réglages enregistrés sur cet appareil.';
  };
  let fieldset;const groups=new Map();
  LOOK_FIELDS.forEach((f,i)=>{
    if(!groups.has(f[1])){fieldset=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent=f[1];fieldset.append(legend);$('look-fields').append(fieldset);groups.set(f[1],fieldset);}else fieldset=groups.get(f[1]);
    const label=document.createElement('label'),name=document.createElement('span'),out=document.createElement('output'),input=document.createElement('input');
    label.className='slider-label';label.htmlFor='look-'+f[0];name.textContent=f[2];out.htmlFor=label.htmlFor;label.append(name,out);
    input.type='range';input.id=label.htmlFor;input.min=f[3];input.max=f[4];input.step=f[5];input.value=LOOK[i];
    input.oninput=()=>{LOOK[i]=+input.value;apply();};sliders.push(input);outputs.push(out);fieldset.append(label,input);
  });
  const sunHelp=document.createElement('p');sunHelp.textContent='La position du soleil recharge la cité pour accorder le ciel, les reflets et les ombres.';
  const sunApply=document.createElement('button');sunApply.id='sun-apply';sunApply.textContent='Appliquer la position du soleil';
  fieldset.append(sunHelp,sunApply);
  sunApply.onclick=()=>{
    saveLook();try{sessionStorage.hapikaraCamera=JSON.stringify(Array.from(F.slice(0,5)));sessionStorage.hapikaraOpenLook='1';}catch{}
    const url=new URL(location.href);url.searchParams.delete('lookDefault');location.href=url.href;
  };
  const show=(open)=>{
    if(open){returnFocus=document.activeElement;ui(true);document.exitPointerLock?.();panel.hidden=false;document.documentElement.dataset.look='open';$('look-close').focus();}
    else{panel.hidden=true;delete document.documentElement.dataset.look;if(comparing){comparing=false;LOOK_ACTIVE.set(LOOK);syncLook();F[RESET]=1;refresh();}returnFocus?.focus();}
    $('look-open').setAttribute('aria-expanded',String(open));
  };
  $('home-look').onclick=$('look-open').onclick=()=>show(panel.hidden);
  $('look-close').onclick=()=>show(false);
  $('o').onclick=()=>{show(false);ui(true);};
  $('d').addEventListener('click',()=>{if(!panel.hidden)show(false);});
  document.querySelectorAll('[data-look]').forEach(b=>b.onclick=()=>{
    for(let i=0;i<20;i++)LOOK[i]=LOOK_FIELDS[i][6];
    const preset=LOOK_PRESETS[b.dataset.look];for(let i=0;i<20;i++)if(preset[LOOK_FIELDS[i][0]]!==undefined)LOOK[i]=preset[LOOK_FIELDS[i][0]];
    apply();
  });
  $('look-compare').onclick=()=>{comparing=!comparing;LOOK_ACTIVE.set(comparing?LOOK_BASE:LOOK);syncLook();F[RESET]=1;refresh();status.textContent=comparing?'Ambiance présente à l’ouverture. La position du soleil reste celle de cette visite.':'Vos essais sont affichés.';};
  $('look-reset').onclick=()=>{LOOK_FIELDS.forEach((f,i)=>LOOK[i]=f[6]);apply();};
  $('water-reset').onclick=()=>{for(const i of [13,14])LOOK[i]=LOOK_FIELDS[i][6];apply();};
  $('look-copy').onclick=async()=>{
    data.hidden=false;data.value=JSON.stringify(lookPayload(),null,2);data.focus();data.select();
    try{await navigator.clipboard.writeText(data.value);status.textContent='Réglages copiés. Vous pouvez les coller dans le chat.';}catch{status.textContent='Sélection prête : copiez ce texte avec le menu de votre appareil.';}
  };
  $('look-import').onclick=()=>{
    if(data.hidden){data.hidden=false;data.value='';data.placeholder='Collez ici les réglages copiés, puis cliquez à nouveau sur Importer.';data.focus();status.textContent='Collez les valeurs, puis cliquez à nouveau sur Importer.';return;}
    try{if(!readLook(JSON.parse(data.value)))throw Error();apply();}catch{status.textContent='Format de réglages non reconnu. Aucune valeur n’a été importée.';}
  };
  const stats=()=>{hud=!hud;tsOn=hud&&hasTS;info.textContent='';$('stats-toggle').setAttribute('aria-pressed',String(hud));};
  $('stats-toggle').onclick=stats;
  // full screen (Chrome, Edge, Firefox; hidden where the page cannot go full screen, as in Safari on iPhone)
  const fsb=$('fs-toggle'),fsOn=()=>!!document.fullscreenElement;
  if(!document.fullscreenEnabled)fsb.hidden=true;
  fsb.onclick=()=>{(fsOn()?document.exitFullscreen():document.documentElement.requestFullscreen({navigationUI:'hide'})).catch(()=>{});};
  document.addEventListener('fullscreenchange',()=>{fsb.textContent=fsOn()?'Quitter le plein écran':'Plein écran';fsb.setAttribute('aria-pressed',String(fsOn()));});
  addEventListener('keydown',e=>{
    if(e.code==='Escape'&&!panel.hidden){e.preventDefault();show(false);return;}
    if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
    if(e.code==='KeyL'&&!e.repeat){e.preventDefault();show(panel.hidden);}
    if(e.code==='KeyH')$('stats-toggle').setAttribute('aria-pressed',String(hud));
  });
  // Actual canal rectangles and terrace footprints; no hand-drawn substitute for the city.
  const path=ringPoly(RB.out,96).map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(1)).join(',')).join('')+'Z';
  const rectSvg=(b,cls)=>'<rect class="'+cls+'" x="'+b[0]+'" y="'+b[1]+'" width="'+(b[2]-b[0])+'" height="'+(b[3]-b[1])+'"/>';
  let svg='<defs><clipPath id="city-clip"><path d="'+path+'"/></clipPath></defs><path class="map-water" d="'+path+'"/><g clip-path="url(#city-clip)"><path class="map-land" d="'+ringPoly(RB.gar,96).map((p,i)=>(i?'L':'M')+p.join(',')).join('')+'Z"/>';
  for(const b of CHANNELS)svg+=rectSvg(b,'map-channel');
  for(const b of TERRACES)svg+=rectSvg(b,'map-terrace');
  svg+='<path stroke="#e3cb8e" stroke-width="9" d="M125 0H510M0 -395V395"/><path class="map-monument" d="M-75 -75H75V75H-75Z"/><path fill="#73bea0" d="M0 -30L30 20H-30Z"/>';
  for(const p of COURTYARDS)svg+='<circle fill="#40775c" cx="'+p[0]+'" cy="'+p[1]+'" r="13"/>';
  svg+='</g>';
  const places=['Vue d’ensemble','Allée des sphinx','Canal aux lotus','Pyramidion','Jardins du nord','Quai du Nil'];
  const dots=[[440,355],[420,0],[345,130],[30,29],[281,-225],[535,-244]];
  for(let i=0;i<6;i++){
    const [x,z]=dots[i];svg+='<g><circle class="map-point" cx="'+x+'" cy="'+z+'" r="22"/><text class="map-number" x="'+x+'" y="'+z+'">'+(i+1)+'</text></g>';
    const b=document.createElement('button');b.innerHTML='<b>'+(i+1)+'</b> '+places[i];b.setAttribute('aria-pressed',String(i===4));
    b.onclick=()=>{lookAt(...POSES[i]);F[VX]=F[VY]=F[VZ]=0;F[RESET]=1;$('map-places').querySelectorAll('button').forEach((a,k)=>{a.classList.toggle('on',i===k);a.setAttribute('aria-pressed',String(i===k));});$('d').textContent='Explorer · '+places[i];};
    b.classList.toggle('on',i===4);$('map-places').append(b);
  }
  $('atlas').innerHTML=svg;
  try{
    const saved=JSON.parse(sessionStorage.hapikaraCamera||'null');
    if(Array.isArray(saved)&&saved.length===5&&saved.every(Number.isFinite)){F.set(saved,0);F[RESET]=1;}
    sessionStorage.removeItem('hapikaraCamera');
    if(sessionStorage.hapikaraOpenLook){sessionStorage.removeItem('hapikaraOpenLook');show(true);}
  }catch{}
  refresh();
}
