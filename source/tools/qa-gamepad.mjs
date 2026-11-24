// Build a temporary controller simulation UI around the actual dev bundle.
// No fake controller or QA overlay enters the shipped page. Run after build:dev.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const html=readFileSync(new URL('../../dev.html',import.meta.url),'utf8');
const script=`
if(AUTO){
 const fixture={mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0}))};
 const panel=document.createElement('aside');panel.style='position:absolute;right:12px;top:12px;background:#092d36;padding:12px;z-index:50;max-width:260px;font-size:12px';
 const title=document.createElement('p');title.textContent='Simulation de manette — QA uniquement';panel.append(title);
 const status=document.createElement('p');status.id='pad-qa-status';
 const records=[];
 const save=async(name,data)=>{await fetch('/__qa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stage:'gamepad-browser',name,...data})});};
 const report=label=>{const state={label,menu,choice:padChoice,armed:padArmed,mechanism:mechanismPhase,gate:GATE_OPEN,values:Array.from(PAD)};records.push(state);status.textContent=JSON.stringify(state);};
 for(const [label,index] of [['A',0],['B',1],['Start',9],['Haut',12],['Bas',13],['Gauche',14],['Droite',15]]){
  const b=document.createElement('button');b.textContent='QA '+label;b.onclick=()=>{fixture.buttons[index].value=1;sampleGamepad(1/60,[fixture]);report(label);fixture.buttons[index].value=0;sampleGamepad(1/60,[fixture]);};panel.append(b);
 }
 const exportButton=document.createElement('button');exportButton.textContent='QA Enregistrer';exportButton.onclick=async()=>{await save('report.json',{report:{simulated:true,records,gpuErrors:GPU_ERRORS}});await save('scene.png',{image:canvas.toDataURL('image/png')});status.textContent='QA enregistrée';};panel.append(exportButton,status);document.body.append(panel);
 ui(true);sampleGamepad(1/60,[fixture]);report('neutral');
}
`;
const end=html.lastIndexOf('})().catch(e=>');if(end<0)throw Error('Unexpected dev wrapper');
mkdirSync('/tmp/hapikara-qa',{recursive:true});
writeFileSync('/tmp/hapikara-qa/palm-control.html',html.slice(0,end)+script+html.slice(end));
console.log('Temporary gamepad fixture: /__palm-control.html?auto&lv=1&w=1440&h=900');
