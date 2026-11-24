// Static, reusable props: small signs of life, not more simulation.
const SCENERY_ANCHORS=[[-450,-530,0],[-90,-550,0],[245,-490,0],[-430,520,0],[170,560,0],[-850,500,1],[-1150,-370,1],[-1420,380,1]];
function sceneryReserved(x,z){
  if(hypot(x-MECHANISM_SITE[0],z-MECHANISM_SITE[2])<13)return true;
  for(const p of SCENERY_ANCHORS)if(hypot(x-p[0],z-p[1])<24)return true;
  return false;
}
function meshWoodHut(lod=0){
  const m=new MB(2048);m.mat=M.DECOR;m.ea=1;
  m.box(-4,-2,-3,4,3,-2.75,.04);m.box(-4,-2,-2.75,-3.75,3,3,.04);m.box(3.75,-2,-2.75,4,3,3,.04);
  for(const s of [-1,1])m.box(s<0?-4:1.2,-2,2.75,s<0?-1.2:4,3,3,.04);
  for(const s of [-1,1]){const p=[[s*4.5,2.9,-3.5],[s*4.5,2.9,3.5],[0,5,3.5],[0,5,-3.5]];m.poly(p,vnorm([s*2.1,4.5,0]));m.poly([...p].reverse(),vnorm([-s*2.1,-4.5,0]));}
  m.ea=0;m.mat=M.SANDST;m.lathe([[.3,0],[.5,.4],[.5,1],[.25,1.4]],{seg:lod?8:14,cx:5,cz:1});return m.build();
}
function meshMarket(lod=0){
  const m=new MB(4096);m.mat=M.DECOR;m.ea=1;
  for(const x of [-4,4])for(const z of [-3,3])m.box(x-.12,0,z-.12,x+.12,4.5,z+.12,.025);
  m.box(-3.7,0,-2.8,3.7,1.2,-1.5,.06);m.ea=0;
  for(let i=0;i<8;i++){
    const x0=-4.5+i*9/8,x1=x0+9/8,y0=4.4-.4*sin(i*PI/8),y1=4.4-.4*sin((i+1)*PI/8);
    m.mat=M.PAINT;m.ea=i%3?PC.LINEN:PC.MALA;
    const p=[[x0,y0,-3.5],[x1,y1,-3.5],[x1,y1,3.5],[x0,y0,3.5]];m.poly(p,[0,1,0]);m.poly([...p].reverse(),[0,-1,0]);
  }
  m.ea=0;for(const [x,z]of [[-2,-2.1],[0,-2.1],[2,-2.1],[5,1]]){
    const base=x===5?0:1.2;m.mat=M.SANDST;m.lathe([[.3,base],[.6,base+.3],[.65,base+1.1],[.3,base+1.4],[.25,base+1.6]],{seg:lod?8:14,cx:x,cz:z});
  }return m.build();
}
function meshFaience(){
  const m=new MB(16);m.mat=M.GOLD;m.box(-1.4,-1.8,-.035,1.4,1.8,0,.02);
  m.mat=M.DECOR;m.ea=2;m.poly([[-1.3,-1.7,.012],[1.3,-1.7,.012],[1.3,1.7,.012],[-1.3,1.7,.012]],[0,0,1]);m.ea=0;return m.build();
}
function meshInlay(){
  const m=new MB(2048);m.mat=M.DECOR;m.ea=3;m.box(-.95,-.6,-.04,.95,.6,0,.025);m.ea=0;
  m.add(meshScarab(),0,0,.025,0,.6);return m.build();
}
function meshSignature(){
  const m=new MB(1024);m.mat=M.SANDST;m.box(-.65,-.3,-.04,.65,.3,0,.02);m.mat=M.EYE;
  const paths=[[[0,-.18],[0,.18],[.15,.18],[.26,.1],[.26,-.1],[.15,-.18],[0,-.18]],[[0,-.18],[.13,.18],[.26,-.18]],[[.05,-.04],[.21,-.04]],[[0,-.18],[0,.18],[.14,-.03],[.28,.18],[.28,-.18]]];
  for(let i=0;i<paths.length;i++){const offset=i===0?-.54:i<3?-.15:.24;m.tube(paths[i].map(p=>[p[0]+offset,p[1],.006,.009]),5,false);}return m.build();
}
function meshCeremonialBoat(lod=0,pavilion=true){
  const m=new MB(8192),n=lod?14:28,L=14;
  const width=t=>2.9*pow(max(0,1-t*t),.65),rim=t=>1.3+3.2*pow(abs(t),5);
  m.mat=M.DECOR;m.ea=1;
  for(let i=0;i<n;i++){
    const a=-1+2*i/n,b=-1+2*(i+1)/n;
    const P=t=>[[t*L,rim(t),-width(t)],[t*L,-.65*(1-t*t),-width(t)*.65],[t*L,-.85*(1-t*t),0],[t*L,-.65*(1-t*t),width(t)*.65],[t*L,rim(t),width(t)]];
    const p=P(a),q=P(b);for(let j=0;j<4;j++)m.poly([p[j],q[j],q[j+1],p[j+1]],[0,j===1||j===2?-1:.15,j<2?-1:1]);
    m.poly([[a*L,1.05,-width(a)],[b*L,1.05,-width(b)],[b*L,1.05,width(b)],[a*L,1.05,width(a)]],[0,1,0]);
  }m.ea=0;
  for(const s of [-1,1]){
    m.mat=M.GOLD;const ps=[];for(let j=0;j<=n;j++){const t=-1+2*j/n;ps.push([t*L,rim(t),s*width(t),.065]);}m.tube(ps,6,false);
  }
  if(pavilion){
    m.mat=M.PAINT;m.ea=PC.MALA;m.box(-4,1,-2,4,1.4,2,.08);m.ea=0;
    for(const x of [-3.8,3.8])for(const z of [-1.7,1.7]){m.mat=M.GOLD;m.lathe([[.17,1.4],[.14,5.8],[.3,6]],{seg:lod?6:10,cx:x,cz:z});}
    for(const s of [-1,1]){m.mat=M.PAINT;m.ea=PC.LINEN;const p=[[-4.3,6,-s*2.3],[4.3,6,-s*2.3],[4.3,6.7,0],[-4.3,6.7,0]];m.poly(p,[0,1,s*.2]);m.poly([...p].reverse(),[0,-1,-s*.2]);}m.ea=0;
    m.add(meshScarab(),4.03,2.5,0,PI/2,1.1);
  }return m.build();
}
function sceneryUrbanPoint(cx,cz,hard){
  for(const dx of [0,-12,12,-24,24,-36,36])for(const dz of [0,-12,12,-24,24]){
    const x=cx+dx,z=cz+dz,y=cityH(x,z);if(!inCity(x,z)||edgeDist(x,z)<10||(abs(x)<126&&abs(z)<126))continue;
    if(abs(cityH(x+5,z)-y)>.1||abs(cityH(x-5,z)-y)>.1)continue;
    let free=true;for(let i=0;i<hard.boxes.length;i+=5)if(x+6>hard.boxes[i]&&x-6<hard.boxes[i+2]&&z+5>hard.boxes[i+1]&&z-5<hard.boxes[i+3]){free=false;break;}
    if(free)return [x,y,z];
  }return null;
}
function populateScenery({type,put,gH,hard}){
  const reports={huts:[],tents:[],markets:[],faience:[],inlays:[],lotus:[],boats:[],signature:[-119.03,8.3,210]};
  const rigidWood=mesh=>{const bytes=new Uint8Array(mesh.vb);for(let i=0;i<mesh.nv;i++)if(bytes[i*20+16]===M.BARK){bytes[i*20+16]=M.DECOR;bytes[i*20+17]=1;}return mesh;};
  const tentAsset=meshDiscovery(1,0);
  const huts=type([meshWoodHut(),meshWoodHut(1)],K.SOLID,80,1e9,450),tent=type([rigidWood(tentAsset.mesh),rigidWood(meshDiscovery(1,1).mesh)],K.SOLID,100,1e9,500);
  for(const [x,z,kind]of SCENERY_ANCHORS){
    const p=discoveryAt(x,z,gH);if(!p)continue;put(kind?tent:huts,p[0],p[1],p[2]);reports[kind?'tents':'huts'].push(p.slice(0,3));
    if(kind)for(const b of tentAsset.boxes)hard.boxes.push(p[0]+b[0],p[2]+b[1],p[0]+b[2],p[2]+b[3],p[1]+b[4]);
    if(!kind){for(const b of [[-4,-3,4,-2.75],[-4,-2.75,-3.75,3],[3.75,-2.75,4,3],[-4,2.75,-1.2,3],[1.2,2.75,4,3]])hard.boxes.push(p[0]+b[0],p[2]+b[1],p[0]+b[2],p[2]+b[3],p[1]+3);}
  }
  const market=type([meshMarket(),meshMarket(1)],K.SOLID,70,1e9,240);
  for(const [x,z]of [[185,-180],[-190,55],[200,205],[320,310]]){
    const p=sceneryUrbanPoint(x,z,hard);if(!p)continue;put(market,...p);reports.markets.push(p);
    hard.boxes.push(p[0]-3.7,p[2]-2.8,p[0]+3.7,p[2]-1.5,p[1]+1.2);
    for(const dx of [-4,4])for(const dz of [-3,3])hard.boxes.push(p[0]+dx-.13,p[2]+dz-.13,p[0]+dx+.13,p[2]+dz+.13,p[1]+4.5);
  }
  const facade=type([meshFaience()],K.SOLID,1e9,1e9,180);let lastX=-1e9,lastZ=-1e9;
  for(let i=0;i<hard.boxes.length&&reports.faience.length<9;i+=5){
    const b=hard.boxes,x=(b[i]+b[i+2])/2,z=b[i+1],h=b[i+4],y=cityH(x,z),w=b[i+2]-b[i];
    if(!inCity(x,z)||abs(x)<130&&abs(z)<130||h-y<5||h-y>15||w<6||w>18||hypot(x-lastX,z-lastZ)<95)continue;
    put(facade,x,h-2.1,z-.03,1,qYaw(PI));reports.faience.push([x,h-2.1,z-.03]);lastX=x;lastZ=z;
  }
  const inlay=type([meshInlay()],K.SOLID,1e9,1e9,160);
  for(const [x,z,a]of [[140.97,82,-PI/2],[-119.03,196,-PI/2],[256.03,220,PI/2],[-140.97,-195,PI/2]]){put(inlay,x,8.3,z,1,qYaw(a));reports.inlays.push([x,8.3,z]);}
  put(type([meshSignature()],K.SOLID,1e9,1e9,45),...reports.signature,1,qYaw(-PI/2));
  const lotus=type([meshLotus(231)],K.SOLID,1e9,1e9,140,0,NO_SHADOW);
  for(const [x,z]of [[122,70],[138,185],[-138,215],[-122,-175],[262,280],[372,-90],[130,-305],[310,68]])if(canalAt(x,z)){put(lotus,x,WATER+.025,z,.7);reports.lotus.push([x,WATER,z]);}
  const ship=type([meshCeremonialBoat(),meshCeremonialBoat(1)],K.SOLID,120,1e9,700),boat=type([meshCeremonialBoat(1,false)],K.SOLID,1e9,1e9,350);
  const sx=EAST_QUAY[0]-27,sz=EAST_QUAY[1]-20;put(ship,sx,0,sz,1,qYaw(PI/2));reports.boats.push([sx,0,sz]);
  for(const [z,off,a]of [[-115,16,PI/2],[145,20,PI/2],[330,19,.6]]){const x=nileX(z)+off;put(boat,x,0,z,.38,qYaw(a));reports.boats.push([x,0,z]);}
  if(AUTO)window.__scenery=reports;
}
