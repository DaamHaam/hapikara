import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=readFileSync(new URL('../src/fullscreen.js',import.meta.url),'utf8');
function fixture(enabled=true){
 const button={hidden:true,attrs:{},toggleAttribute(k,v){this.attrs[k]=v;},setAttribute(k,v){this.attrs[k]=v;}},note={textContent:''},events={},F=[0];
 let rejected=false,resizes=0;
 const document={fullscreenEnabled:enabled,fullscreenElement:null,documentElement:{async requestFullscreen(){if(rejected)throw Error('denied');document.fullscreenElement=this;events.fullscreenchange();}},async exitFullscreen(){document.fullscreenElement=null;events.fullscreenchange();},addEventListener(n,f){events[n]=f;}};
 vm.runInNewContext(code+';initFullscreen();',{$:id=>id==='fullscreen'?button:note,document,F,RESET:0,resize:()=>resizes++});
 return {button,note,document,events,F,reject:()=>{rejected=true;},get resizes(){return resizes;}};
}
const e={stopPropagation(){}};
const absent=fixture(false);assert(absent.button.hidden,'unsupported API hidden');
const a=fixture();assert(!a.button.hidden);assert.equal(a.button.attrs['aria-pressed'],'false');
await a.button.onclick(e);assert(a.document.fullscreenElement);assert.equal(a.button.attrs['aria-pressed'],'true');assert.equal(a.button.title,'Quitter le plein écran');assert(a.resizes>=2);
await a.button.onclick(e);assert.equal(a.document.fullscreenElement,null);assert.equal(a.button.attrs['aria-pressed'],'false');
await a.button.onclick(e);await a.document.exitFullscreen();assert.equal(a.button.attrs['aria-pressed'],'false','external Escape resynchronises');
a.reject();await a.button.onclick(e);assert(!a.button.disabled,'button stays usable');assert(a.note.textContent.includes('refuse'));assert.equal(a.button.attrs['aria-pressed'],'false','denied request must not pretend fullscreen');
console.log('Fullscreen OK: availability, enter/exit, actual state, resize, external exit and rejected request.');
