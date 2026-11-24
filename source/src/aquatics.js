// Shared, low-poly fish. Motion is entirely in the vertex shader, not a JS simulation.
function meshFish(species,lod=0){
  const m=new MB(512),long=species===2?1.45:1,tall=species===1?.48:.24,wide=species===1?.13:.2;
  m.mat=M.FISH;m.ea=species;
  const rings=lod?4:7,sides=lod?6:10;
  for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){
    const P=(u,v)=>{const a=PI*(.035+.93*u),t=v*TAU,x=-cos(a)*long,r=sin(a);return m.v(x,r*cos(t)*tall,r*sin(t)*wide,x/(long*long),r*cos(t)/tall,r*sin(t)/wide);};
    m.quad(P(i/rings,j/sides),P((i+1)/rings,j/sides),P((i+1)/rings,(j+1)/sides),P(i/rings,(j+1)/sides));
  }
  const fin=(ps,n)=>{m.poly(ps,n);m.poly([...ps].reverse(),n.map(v=>-v));};
  fin([[-long*.85,0,0],[-long*1.5,tall*1.2,0],[-long*1.4,-tall*1.2,0]],[0,0,1]);
  fin([[-.3,tall*.75,0],[.15,tall*1.65,0],[.5,tall*.6,0]],[0,0,1]);
  m.eb=255;for(const sd of [-1,1]){const ps=[];for(let j=0;j<8;j++){const a=j*TAU/8;ps.push([long*.65+cos(a)*.045,tall*.32+sin(a)*.045,sd*wide*.8]);}m.poly(ps,[0,0,sd]);}m.eb=0;
  const mesh=m.build();mesh.rad+=40;return mesh;
}
function sarcophagus(m,x,y,z,s=1){
  m.fr=[x,y,z,1,0,s];
  m.mat=M.SANDST;m.box(-1.35,0,-2.65,1.35,.23,2.65,.16);
  m.mat=M.GRANITE;m.box(-1.08,.24,-2.35,1.08,.27,2.35,.04);
  for(const [a,b,c,d]of [[-1.35,-2.65,-1.05,2.65],[1.05,-2.65,1.35,2.65],[-1.05,-2.65,1.05,-2.35],[-1.05,2.35,1.05,2.65]]){
    m.mat=M.SANDST;m.box(a,.23,b,c,1,d,.08);bandRect(m,a,b,c,d,.75,.95,PC.MALA,true);
  }
  m.mat=M.GOLD;ringProf(m,-1.35,-2.65,1.35,2.65,[[0,1],[.06,1.08],[0,1.13]],M.GOLD);m.fr=null;
}
function meshTreasure(kind){
  const m=new MB(4096);
  if(kind===1)sarcophagus(m,0,0,0,1);
  else{
    m.mat=M.BARK;m.box(-1.4,0,-.8,1.4,.7,.8,.08);
    m.box(-1.4,.7,-1,1.4,1.9,-.8,.06);bandRect(m,-1.42,-.82,1.42,.82,.15,.28,PC.GOLDP,false);
    m.mat=M.GOLD;for(let j=0;j<18;j++){const a=j*2.4,r=.15+sqrt(j)*.21;m.lathe([[.15,.72],[.15,.77]],{seg:8,cx:cos(a)*r,cz:sin(a)*r*.55});}
    m.lathe([[.3,0],[.38,.1],[.4,.55],[.65,.7]],{seg:12,cx:2,cz:.3});
  }return m.build();
}
function meshMosaic(){const m=new MB(4);m.mat=M.MOSAIC;m.poly([[-3,0,-3],[3,0,-3],[3,0,3],[-3,0,3]],[0,1,0]);return m.build();}
function populateAquatics({type,put,gH}){
  const rng=RNG(713541),fish=[0,1,2].map(k=>type([meshFish(k,0),meshFish(k,1)],K.SOLID,45,1e9,200,0,NO_SHADOW|NO_BAKE|NO_MIRROR|FISH_SCHOOL));
  const counts=QL(60,40,20),sites=[];
  for(let k=0;k<4;k++){
    const z=-190+k*125,x=nileX(z)+65+k*12,y=min(-1.6,max(gH(x,z)+2,-4.3));sites.push([x,y,z]);
    for(let j=0;j<counts;j++){
      const px=x+(rng()-.5)*13,pz=z+(rng()-.5)*13,py=min(-.8,max(gH(px,pz)+1.1,y+(rng()-.5)*1.5));
      put(fish[(k+j)%3],px,py,pz,.3+rng()*.4,Q0,rgb(.48+rng()*.3,.59+rng()*.25,.38+rng()*.35,rng()));
    }
  }
  const treasure=[0,1].map(k=>type([meshTreasure(k)],K.SOLID,1e9,1e9,180));
  for(const [z,off,k]of [[-160,22,0],[-20,30,1],[135,26,0],[275,35,1]]){const x=nileX(z)+off;put(treasure[k],x,gH(x,z)+.12,z,1,qYaw(z*.13));}
  const mosaic=type([meshMosaic()],K.SOLID,1e9,1e9,150);
  for(const [x,z]of [[130,36],[130,90],[-130,-200],[266,200]])if(canalAt(x,z))put(mosaic,x,FLOOR_Y+.035,z);
  if(AUTO)window.__aquatics={schools:sites,fish:4*counts,treasures:4,mosaics:4};
}
