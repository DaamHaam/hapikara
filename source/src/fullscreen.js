// Fullscreen follows the actual browser state, including Escape or an external exit.
// The button is never locked while a request is pending: some embedded browsers never settle it.
function initFullscreen(){
  const button=$('fullscreen'),note=$('screen-note'),root=document.documentElement;
  if(!root.requestFullscreen||!document.exitFullscreen||document.fullscreenEnabled===false)return;
  button.hidden=false;
  const sync=()=>{
    const active=!!document.fullscreenElement,label=active?'Quitter le plein écran':'Passer en plein écran';
    button.toggleAttribute('data-active',active);button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',label);button.title=label;
    note.textContent='';F[RESET]=1;resize();
  };
  button.onclick=async e=>{
    e.stopPropagation();note.textContent='';
    try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen();}
    catch{note.textContent='Le navigateur refuse le plein écran dans cette fenêtre.';}
  };
  document.addEventListener('fullscreenchange',sync);sync();
}
