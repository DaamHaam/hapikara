// A/B control: current scene/lighting/camera with the pre-change palm geometry, atlas and sway.
// Writes only a temporary test page; never changes source files or the production bundle.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const root = new URL('../../',import.meta.url);
const before = file => execFileSync('git',['show','c9805d8:source/src/'+file],{cwd:root,encoding:'utf8'});
let html=readFileSync(new URL('dev.html',root),'utf8');
const palm=before('egypt.js').match(/function meshPalm\(seed, lod\) \{[\s\S]*?\n}\n/)[0];
if(!process.argv.includes('--lod'))html=html.replace(/function meshPalm\(seed, lod\) \{[\s\S]*?\n}\n/,palm);
const tile=before('sh_base.js').match(/  } else if \(tile == 10\)[\s\S]*?(?=  } else if \(tile == 11\))/)[0];
if(!process.argv.includes('--lod'))html=html.replace(/  } else if \(tile == 10\)[\s\S]*?(?=  } else if \(tile == 11\))/,tile);
if(process.argv.includes('--lod'))html=html.replaceAll('select(ign(px + view.jit.z * 5.588),h21(floor(i.wp.xz*12.)+floor(i.wp.y*12.)*vec2f(.31,.73)),mat==7u||mat==21u||mat==22u||mat>=32u)','ign(px + view.jit.z * 5.588)');
// The current shader retains the 0.2.0 sway for the control's alpha palms.
mkdirSync('/tmp/hapikara-qa',{recursive:true});
writeFileSync('/tmp/hapikara-qa/palm-control.html',html);
console.log('Control page ready at /__palm-control.html (current scene, former palms).');
