// Small static destinations outside the city. Shared component boxes also drive collisions.
const DISCOVERY_SITES=[[-820,-210,0],[-630,340,1],[OASIS[0]+125,OASIS[1]+105,2],[nileX(510)-85,510,3]];
function meshDiscovery(kind,lod=0){
  const m=new MB(8192),boxes=[];
  const block=(x0,y0,z0,x1,y1,z1,mat=M.SANDST)=>{m.mat=mat;m.box(x0,y0,z0,x1,y1,z1,.09);boxes.push([x0,z0,x1,z1,y1]);};
  const jar=(x,z,s=1)=>{m.mat=M.SANDST;m.lathe([[.3,0],[.55,.3],[.65,1.1],[.4,1.5],[.22,1.7],[.25,1.8]].map(p=>[p[0]*s,p[1]*s]),{seg:lod?8:12,cx:x,cz:z});};
  if(kind===0||kind===2){
    // Forgotten desert shrine / smaller oasis memorial, with an open walkable centre.
    block(-9,-3,-8,9,.35,8);
    for(const x of [-6,6])for(const z of [-5,5]){
      const h=kind===0?(x<0&&z>0?2.1:7.4):(z>0?2.4:5.2);
      block(x-.85,.35,z-.85,x+.85,1,z+.85);
      m.mat=M.SANDST;m.fr=[x,1,z,1,0,1];
      if(h<3.3)m.lathe([[.72,0],[.65,.3],[.6,h-.2],[.47,h],[0,h+.07]],{seg:lod?8:14});
      else column(m,0,0,h,.62,lod,[PC.MALA,PC.GOLDP]);m.fr=null;
      boxes.push([x-.85,z-.85,x+.85,z+.85,h+1.5]);
    }
    const lintel=kind===0?7.8:5.6;
    block(-7,lintel,-5.9,7,lintel+.9,-4.1);bandRect(m,-7,-5.9,7,-4.1,lintel+.2,lintel+.7,PC.MALA,!lod);
    // Intact engraved altar and fallen blocks distinguish the discovery from random rubble.
    block(-1.8,.35,-2,1.8,1.7,1.2);bandRect(m,-1.8,-2,1.8,1.2,.8,1.4,PC.MALA,!lod);
    for(const [x,z]of [[-10,4],[8,9],[3,-10]])block(x,0,z,x+2.2,1.1,z+1.4);
    jar(3,2,.7);
  }else{
    // Canvas shelter on poles; open front, no animation or transparency.
    const hut=kind===3;
    if(hut){block(-4,-2,-3,4,3.5,-2.4);block(-4,-2,-2.4,-3.4,3.5,3);}
    for(const x of [-4,4])for(const z of [-3,3])block(x-.12,-2,z-.12,x+.12,3.7,z+.12,M.BARK);
    m.mat=M.PAINT;m.ea=PC.LINEN;
    for(const sd of [-1,1]){
      const a=[sd*4.5,3.4,-3.6],b=[sd*4.5,3.4,3.6],c=[0,5,3.6],d=[0,5,-3.6];
      m.poly([a,b,c,d],vnorm([sd*1.6,4.5,0]));m.poly([d,c,b,a],vnorm([-sd*1.6,-4.5,0]));
    }
    if(!hut){
      // Linen tent sides and a split entrance; the river shelter stays open.
      for(const sd of [-1,1])m.poly([[sd*4.5,.2,-3.6],[sd*4.5,.2,3.6],[sd*4.5,3.4,3.6],[sd*4.5,3.4,-3.6]],[sd,0,0]);
      m.poly([[-4.5,.2,-3.6],[4.5,.2,-3.6],[4.5,3.4,-3.6],[0,5,-3.6],[-4.5,3.4,-3.6]],[0,0,-1]);
      for(const sd of [-1,1])m.poly([[sd*1.1,.2,3.6],[sd*4.5,.2,3.6],[sd*4.5,3.4,3.6],[0,5,3.6]],[0,0,1]);
    }m.ea=0;
    // Canvas is decorative; only the real walls, poles and crates block movement.
    jar(5,2);jar(6,2,.65);block(4.5,-.1,-2,6.5,.8,-.5,M.BARK);
  }
  return {mesh:m.build(),boxes};
}
function meshCanalFinds(){
  const m=new MB(4096);m.mat=M.UWSTONE;
  for(const [x,z,s]of [[-1.5,.6,1],[.8,-.6,.75],[1.7,.5,.55]])
    m.lathe([[.22,0],[.35,.2],[.42,.7],[.27,1.05],[.13,1.2],[.17,1.3]].map(p=>[p[0]*s,p[1]*s]),{seg:12,cx:x,cz:z});
  m.tube([[-2.5,.55,-1.5,.5],[-.8,.6,-1.3,.55],[.4,.65,-1.1,.47]],12,true);
  m.box(-.8,0,1.1,1.4,.45,2.3,.09);
  // A green incised stone marker makes the find legible through the water.
  m.ea=1;m.box(-.7,.46,1.2,1.3,.49,2.2,.015);m.ea=0;
  return m.build();
}
function discoveryAt(x,z,heightAt){
  let best=null,score=1e9;
  for(const dx of [0,-20,20,-40,40,-60,60])for(const dz of [0,-20,20,-40,40]){
    const px=x+dx,pz=z+dz;if(inCity(px,pz))continue;
    let lo=1e9,hi=-1e9;for(const u of [-12,0,12])for(const v of [-12,0,12]){const y=heightAt(px+u,pz+v);lo=min(lo,y);hi=max(hi,y);}
    const s=hi-lo+hypot(dx,dz)*.005;
    if(lo>3&&hi-lo<2.7&&s<score){best=[px,hi-.25,pz,lo];score=s;}
  }return best;
}
