// User-adjustable look. Loaded before layout so a new sun also rebuilds sky and baked shadows.
// Array indices are the GPU uniform contract (five vec4s), then the two sun angles.
const LOOK_FIELDS = [
  ['sun','Soleil','Intensité',.3,1.8,.01,1],
  ['sunWarm','Soleil','Chaleur',-1,1,.01,0],
  ['ambient','Ombres','Lumière dans les ombres',.25,1.5,.01,1],
  ['ao','Ombres','Ombres de contact',.3,2,.01,1],
  ['exposure','Couleurs','Exposition',.4,1.5,.01,.72],
  ['contrast','Couleurs','Contraste',.7,1.5,.01,1],
  ['saturation','Couleurs','Saturation',.3,1.6,.01,1],
  ['temperature','Couleurs','Chaud / froid',-1,1,.01,0],
  ['haze','Atmosphère','Brume lointaine',0,3,.01,1],
  ['hazeHeight','Atmosphère','Hauteur de brume',80,1200,10,650],
  ['rays','Atmosphère','Rayons de lumière',0,2,.01,1],
  ['clouds','Ciel','Couverture nuageuse',0,1,.01,.2],
  ['cloudDensity','Ciel','Densité des nuages',0,1,.01,.65],
  ['refraction','Eau et cristal','Déformation sous l’eau',0,1.8,.01,1],
  ['reflection','Eau et cristal','Reflets de l’eau',.3,1.6,.01,1],
  ['crystal','Eau et cristal','Couleur de l’émeraude',.2,2,.01,1],
  ['wind','Végétation','Vent des autres plantes',0,1,.01,1],
  ['sharpness','Finition','Netteté',0,.6,.01,.3],
  ['bloom','Finition','Halo lumineux',0,.15,.005,.04],
  ['shadowCool','Ombres','Fraîcheur des ombres',0,1,.01,0],
  ['sunElevation','Position du soleil','Hauteur',12,70,.1,32.5],
  ['sunAzimuth','Position du soleil','Direction',-180,180,.1,-44],
  ['underwater','Sous l’eau','Niveau : simple · fonds · caustiques · rayons',0,3,1,0],
  ['waterFog','Sous l’eau','Densité de l’eau',.03,.25,.005,.085],
  ['waterRays','Sous l’eau','Intensité des rayons',0,2,.05,1],
];
const LOOK = new Float32Array(LOOK_FIELDS.map(f=>f[6]));
const readLook = value => { if(!value || value.version!==1 || !value.values || typeof value.values!=='object') return false;
  let found=false; for(let i=0;i<LOOK_FIELDS.length;i++){const f=LOOK_FIELDS[i],v=value.values[f[0]];if(typeof v==='number'&&Number.isFinite(v)){LOOK[i]=clamp(v,f[3],f[4]);found=true;}}return found; };
// Normal visits always use the agreed default; no persistent user look.
let LOOK_BASE, LOOK_ACTIVE, LOOK_DEFAULT;
const lookPayload = () => ({version:1,values:Object.fromEntries(LOOK_FIELDS.map((f,i)=>[f[0],+LOOK[i].toFixed(3)]))});
const LOOK_PRESETS = {
  royal:{sun:1.08,sunWarm:.22,ambient:.73,ao:1.15,contrast:1.08,saturation:1.06,temperature:.12,haze:.8,shadowCool:.3,clouds:.22},
  gardens:{sun:1,sunWarm:.08,ambient:.88,ao:1.08,contrast:1.03,saturation:1.08,temperature:.02,haze:1,shadowCool:.22,clouds:.3},
  sanctuary:{sun:.9,sunWarm:.3,ambient:.7,ao:1.2,contrast:1.08,saturation:.92,temperature:.12,haze:1.65,hazeHeight:330,rays:1.5,clouds:.56,cloudDensity:.82,shadowCool:.45},
};
for(let i=0;i<LOOK_FIELDS.length;i++){const v=LOOK_PRESETS.sanctuary[LOOK_FIELDS[i][0]];if(v!==undefined)LOOK[i]=v;}
LOOK_DEFAULT=new Float32Array(LOOK);
if(!AUTO)try{const carry=sessionStorage.hapikaraPendingLook;sessionStorage.removeItem('hapikaraPendingLook');if(carry)readLook(JSON.parse(carry));}catch{}
LOOK_BASE=new Float32Array(LOOK);LOOK_ACTIVE=new Float32Array(LOOK);
