// A continuous submerged entrance and a dry crypt, all in world coordinates.
// Rectangles meet at real doorways; the collision query and masonry share this plan.
const CRYPT_ROOMS=[
  [96,32,120,40,3.2,6.3],
  [58,32,96,40,3.2,7.2],
  [50,12,58,40,10.8,16.8],
  [-25,-14,58,12,10.8,24],
];
const CRYPT_TARGET=[-14,14.7,-5];
// Last two values: inward wall normal, shared by bracket and flame placement.
const CRYPT_FIRES=[[78,8,39.2,0,-1],[50.8,14,25,1,0],[36,15,-13.2,0,1],[12,15,11.2,0,-1],[-20,15,-13.2,0,1]];
const cryptFloor=(i,x)=>i===1?3.2+(96-x)*.2:CRYPT_ROOMS[i][4];
const cryptCeil=(i,x)=>i===1?cryptFloor(i,x)+4:CRYPT_ROOMS[i][5];
function cryptZone(x,y,z,footprint=false){
  for(let i=0;i<CRYPT_ROOMS.length;i++){const b=CRYPT_ROOMS[i];if(x>=b[0]&&x<=b[2]&&z>=b[1]&&z<=b[3]&&(footprint||(y>=cryptFloor(i,x)-.15&&y<=cryptCeil(i,x)+.1)))return i;}
  return -1;
}
const cryptInside=(x,y,z)=>x<95.5&&cryptZone(x,y,z)>=0;
const cryptAtMouth=(x,y,z)=>x>=119&&x<=120.75&&y>=3.05&&y<=6.4&&z>=32&&z<=40;
function cryptCameraFits(x,z){
  for(let k=0;k<9;k++){
    const a=(k-1)*TAU/8,xx=x+(k?cos(a)*.72:0),zz=z+(k?sin(a)*.72:0);
    if(cryptZone(xx,0,zz,true)<0&&!(xx>=119&&xx<=141&&zz>=32&&zz<=40))return false;
  }return true;
}
const CRYPT_RECOVERY=new Float64Array(2);
function cryptRecover(x,z){
  let best=1e9;
  for(let i=0;i<=CRYPT_ROOMS.length;i++){
    const b=CRYPT_ROOMS[i],xx=clamp(x,(b?b[0]:119)+.73,(b?b[2]:141)-.73),zz=clamp(z,(b?b[1]:32)+.73,(b?b[3]:40)-.73),d=(xx-x)**2+(zz-z)**2;
    if(d<best&&cryptCameraFits(xx,zz)){best=d;CRYPT_RECOVERY[0]=xx;CRYPT_RECOVERY[1]=zz;}
  }return best<2.25;
}
// Entry of the sunlight at the first wall/roof met along the configured sun direction.
const CRYPT_RAY=(()=>{
  const p=CRYPT_TARGET,b=CRYPT_ROOMS[3];let t=(b[5]-p[1])/max(.001,SUN[1]),side=4;
  for(const [axis,low,high,loSide,hiSide]of [[0,b[0],b[2],0,1],[2,b[1],b[3],2,3]]){
    const v=SUN[axis];if(abs(v)<.001)continue;const q=((v>0?high:low)-p[axis])/v;
    if(q<t){t=q;side=v>0?hiSide:loSide;}
  }return {p:p.map((v,i)=>v+SUN[i]*t),length:t,side};
})();
const CRYPT_SOLIDS=[]; // [x0,z0,x1,z1,top], populated with the rendered furniture
const CRYPT_U=vnorm([SUN[2],0,-SUN[0]]),CRYPT_V=vcross(SUN,CRYPT_U);
const CRYPT_HW=.7,CRYPT_HH=.48;
let CRYPT_EXIT=null;
function cryptShaftExit(){
  if(CRYPT_EXIT)return CRYPT_EXIT;
  let last=CRYPT_RAY.length;
  for(let t=last;t<210;t+=.1){
    const p=CRYPT_TARGET.map((v,i)=>v+SUN[i]*t);
    for(let k=0;k<PYR.n;k++)if(abs(p[0])<=pyrH(k)+.5&&abs(p[2])<=pyrH(k)+.5&&p[1]>=pyrY(k)-.2&&p[1]<=pyrY(k+1)+.1)last=t;
  }
  return CRYPT_EXIT={t:last+.1,p:CRYPT_TARGET.map((v,i)=>v+SUN[i]*(last+.1))};
}
const cryptShaftPoint=(t,u,v)=>CRYPT_TARGET.map((p,i)=>p+SUN[i]*t+CRYPT_U[i]*u+CRYPT_V[i]*v);
// Subtract a convex shaft from actual triangles, once at build time. The outside
// pieces retain interpolated vertex attributes; all rendering/shadow passes see the hole.
function cutCryptShaft(mesh){
  const planes=[[CRYPT_U,CRYPT_HW],[CRYPT_U.map(v=>-v),CRYPT_HW],[CRYPT_V,CRYPT_HH],[CRYPT_V.map(v=>-v),CRYPT_HH],[SUN.map(v=>-v),-6],[SUN,220]];
  const out=new MB(mesh.nv+1024);out.add(mesh);out.ni=0;
  const f=new Float32Array(mesh.vb),b=new Uint8Array(mesh.vb),sb=new Int8Array(mesh.vb);
  const vertex=i=>[f[i*5],f[i*5+1],f[i*5+2],sb[i*20+12],sb[i*20+13],sb[i*20+14],sb[i*20+15]/127,b[i*20+16],b[i*20+17],b[i*20+18],b[i*20+19]];
  const d=(v,p)=>(v[0]-CRYPT_TARGET[0])*p[0][0]+(v[1]-CRYPT_TARGET[1])*p[0][1]+(v[2]-CRYPT_TARGET[2])*p[0][2]-p[1];
  const clip=(poly,p,inside)=>{
    const r=[];for(let i=0;i<poly.length;i++){const a=poly[i],c=poly[(i+1)%poly.length],da=d(a,p),dc=d(c,p),aa=inside?da<=0:da>=0,cc=inside?dc<=0:dc>=0;if(aa)r.push(a);if(aa!==cc){const t=da/(da-dc);r.push(a.map((v,j)=>j===7?v:mix(v,c[j],t)));}}return r;
  };
  const emit=poly=>{if(poly.length<3)return;const ids=poly.map(v=>{out.mat=v[7];out.ea=round(v[8]);out.eb=round(v[9]);out.ec=round(v[10]);return out.v(...v.slice(0,6),v[6]);});for(let i=1;i<ids.length-1;i++)out.tri(ids[0],ids[i],ids[i+1]);};
  for(let i=0;i<mesh.ib.length;i+=3){
    let poly=[vertex(mesh.ib[i]),vertex(mesh.ib[i+1]),vertex(mesh.ib[i+2])];
    if(planes.some(p=>poly.every(v=>d(v,p)>=0))){out.tri(mesh.ib[i],mesh.ib[i+1],mesh.ib[i+2]);continue;}
    for(const p of planes){emit(clip(poly,p,false));poly=clip(poly,p,true);if(poly.length<3)break;}
  }
  return out.build();
}
function meshCryptDuct(){
  const m=new MB(64);m.mat=M.SANDST;
  const end=cryptShaftExit().t+.1;
  const entrance=(u,v)=>{
    const p=cryptShaftPoint(0,u,v),b=CRYPT_ROOMS[3];let t=(b[5]-p[1])/max(SUN[1],.001);
    for(const [axis,lo,hi]of [[0,b[0],b[2]],[2,b[1],b[3]]])if(abs(SUN[axis])>.001)t=min(t,((SUN[axis]>0?hi:lo)-p[axis])/SUN[axis]);
    return cryptShaftPoint(t-.001,u,v);
  };
  const corners=[[-CRYPT_HW,-CRYPT_HH],[CRYPT_HW,-CRYPT_HH],[CRYPT_HW,CRYPT_HH],[-CRYPT_HW,CRYPT_HH]];
  for(let i=0;i<4;i++){const u=corners[i],v=corners[(i+1)%4],ps=[entrance(...u),cryptShaftPoint(end,...u),cryptShaftPoint(end,...v),entrance(...v)];m.poly(ps,vnorm(CRYPT_U.map((q,j)=>-q*(u[0]+v[0])-CRYPT_V[j]*(u[1]+v[1]))));}
  return m.build();
}
function meshCrypt(){
  CRYPT_SOLIDS.length=0;
  const m=new MB(32768);m.mat=M.SANDST;
  const quad=(ps,n)=>m.poly(ps,n);
  // Plane wall in x/z, with optional door/window rectangles [u0,y0,u1,y1].
  const wall=(axis,c,u0,u1,y0,y1,n,holes=[])=>{
    const us=[u0,u1],ys=[y0,y1];for(const h of holes){us.push(max(u0,h[0]),min(u1,h[2]));ys.push(max(y0,h[1]),min(y1,h[3]));}
    us.sort((a,b)=>a-b);ys.sort((a,b)=>a-b);
    const P=(u,y)=>axis===0?[c,y,u]:axis===1?[u,c,y]:[u,y,c];
    for(let i=1;i<us.length;i++)for(let j=1;j<ys.length;j++){
      const a=us[i-1],b=us[i],d=ys[j-1],e=ys[j];if(b-a<.001||e-d<.001)continue;
      if(holes.some(h=>(a+b)/2>h[0]&&(a+b)/2<h[2]&&(d+e)/2>h[1]&&(d+e)/2<h[3]))continue;
      quad([P(a,d),P(b,d),P(b,e),P(a,e)],n);
    }
  };
  for(let i=0;i<CRYPT_ROOMS.length;i++){
    const b=CRYPT_ROOMS[i],[x0,z0,x1,z1]=b,f0=cryptFloor(i,x0),f1=cryptFloor(i,x1),c0=cryptCeil(i,x0),c1=cryptCeil(i,x1);
    m.mat=M.FLOOR;quad([[x0,f0,z0],[x1,f1,z0],[x1,f1,z1],[x0,f0,z1]],vnorm([i===1?.2:0,1,0]));
    m.mat=M.SANDST;
    quad([[x0,c0,z0],[x1,c1,z0],[x1,c1,z1],[x0,c0,z1]],[0,-1,0]);
    if(i===0){wall(2,z0,x0,x1,f0,c0,[0,0,1]);wall(2,z1,x0,x1,f0,c0,[0,0,-1]);}
    if(i===1){
      for(const [z,n]of [[z0,[0,0,1]],[z1,[0,0,-1]]])quad([[x0,f0,z],[x1,f1,z],[x1,c1,z],[x0,c0,z]],n);
      wall(0,x1,z0,z1,6.3,c1,[-1,0,0]);
    }
    if(i===2){wall(0,x0,z0,z1,f0,c0,[1,0,0]);wall(0,x1,z0,z1,f0,c0,[-1,0,0],[[32,10.8,40,14.8]]);wall(2,z1,x0,x1,f0,c0,[0,0,-1]);}
    if(i===3){
      wall(0,x0,z0,z1,f0,c0,[1,0,0]);wall(0,x1,z0,z1,f0,c0,[-1,0,0]);
      wall(2,z0,x0,x1,f0,c0,[0,0,1]);wall(2,z1,x0,x1,f0,c0,[0,0,-1],[[50,10.8,58,16.8]]);
      // Recessed green/gold bands and repeated shallow piers establish the scale.
      for(const z of [z0+.02,z1-.02])for(const x of [-20,-4,12,28,44]){
        m.mat=M.SANDST;m.box(x-.55,f0,z-.2,x+.55,23.6,z+.2,.12);
        bandRect(m,x-.58,z-.24,x+.58,z+.24,15.8,16.6,PC.MALA,true);
      }
      meshCryptTreasure(m);
      // Framed vertical carved panels. Their silhouettes remain simple and static.
      for(const z of [z0+.08,z1-.08])for(const x of [-16,0,16,32,46]){
        m.mat=M.GOLD;m.box(x-1.6,12,z-.04,x+1.6,22,z+.04,.035);
        m.mat=M.HIERO;const n=[0,0,z<0?1:-1],q=z+(z<0?.05:-.05);
        m.poly([[x-1.47,12.15,q],[x+1.47,12.15,q],[x+1.47,21.85,q],[x-1.47,21.85,q]],n);
      }
    }
  }
  // Braziers are fixed; only the flame silhouette and its illumination flicker.
  for(const [x,y,z,nx,nz]of CRYPT_FIRES){
    m.mat=M.GRANITE;m.box(x-nx*.8-.16,y-1.5,z-nz*.8-.16,x-nx*.8+.16,y-.2,z-nz*.8+.16,.04);
    m.mat=M.GOLD;m.tube([[x-nx*.8,y-1.1,z-nz*.8,.12],[x,y-.5,z,.12],[x,y-.2,z,.12]],8,false);
    m.lathe([[.15,y-.5],[.48,y-.25],[.53,y],[.4,y+.06]],{seg:12,cx:x,cz:z});
  }
  const result=new MB(4096);result.add(cutCryptShaft(m.build()));result.add(meshCryptDuct());return result.build();
}
function meshFlame(){const m=new MB(256);m.mat=M.FLAME;m.lathe([[.12,0],[.38,.35],[.25,.75],[.07,1.3],[0,1.6]],{seg:8});return m.build();}

function cryptEllipsoid(m,c,r,seg=20,rows=12){
  const P=(i,j)=>{const a=i*PI/rows,b=j*TAU/seg,n=[sin(a)*cos(b),cos(a),sin(a)*sin(b)];return m.v(c[0]+r[0]*n[0],c[1]+r[1]*n[1],c[2]+r[2]*n[2],n[0]/r[0],n[1]/r[1],n[2]/r[2]);};
  for(let i=0;i<rows;i++)for(let j=0;j<seg;j++)m.quad(P(i,j),P(i,j+1),P(i+1,j+1),P(i+1,j));
}
function meshRoyalCoffin(m){
  m.mat=M.GOLD;
  const profile=[[-4.3,.15,.2],[-3.8,1.15,.8],[-2.8,1.6,1.05],[-1.65,2.05,1.1],[-.4,1.7,1],[1.4,1.35,.85],[3.7,1,.65],[4.5,.8,.6],[4.7,.12,.15]];
  for(let i=1;i<profile.length;i++)for(let j=0;j<24;j++){
    const P=(p,k)=>{const a=k*TAU/24;return m.v(p[1]*cos(a),1.25+p[2]*sin(a),p[0],cos(a)/p[1],sin(a)/p[2],0);};
    m.quad(P(profile[i-1],j),P(profile[i-1],j+1),P(profile[i],j+1),P(profile[i],j));
  }
  // Malachite panels and raised golden ribs follow the tapered closed shell.
  const section=z=>{let i=1;while(i<profile.length-1&&profile[i][0]<z)i++;const a=profile[i-1],b=profile[i],t=(z-a[0])/(b[0]-a[0]);return [mix(a[1],b[1],t),mix(a[2],b[2],t)];};
  for(let k=0;k<8;k++){
    const z=-1.3+k*.71,P=(zz,a)=>{const [w,h]=section(zz);return [w*cos(a)*1.008,1.25+h*sin(a)*1.012,zz];};
    m.mat=M.PAINT;m.ea=PC.MALA;
    for(let j=0;j<24;j++){const a=(.03+j*.94/24)*PI,b=(.03+(j+1)*.94/24)*PI;m.poly([P(z,a),P(z+.55,a),P(z+.55,b),P(z,b)],[cos((a+b)/2),sin((a+b)/2),0]);}m.ea=0;
    m.mat=M.GOLD;const ps=[];for(let j=0;j<=24;j++){const p=P(z,j*PI/24);ps.push([...p,.045]);}m.tube(ps,6,false);
  }
  // Striped nemes, serene mask, eyes, nose, lips, ceremonial beard and crossed arms.
  m.mat=M.PAINT;m.ea=PC.MALA;cryptEllipsoid(m,[0,2.03,-2.9],[1.55,.65,1.36]);m.ea=0;
  m.mat=M.GOLD;
  for(let k=0;k<11;k++){
    const z=-4+k*.22,rr=sqrt(max(.02,1-((z+2.9)/1.36)**2)),ps=[];
    for(let j=0;j<=16;j++){const a=j*PI/16;ps.push([cos(a)*1.56*rr,2.03+sin(a)*.66*rr,z,.045]);}m.tube(ps,5,false);
  }
  cryptEllipsoid(m,[0,2.35,-2.77],[.8,.5,1.02]);
  for(const x of [-.88,.88])cryptEllipsoid(m,[x,2.34,-2.66],[.15,.19,.31],12,8);
  m.mat=M.EYE;for(const x of [-.34,.34])cryptEllipsoid(m,[x,2.81,-3.04],[.23,.033,.09],16,6);
  m.mat=M.GOLD;cryptEllipsoid(m,[0,2.86,-2.73],[.12,.19,.32],16,8);
  for(const s of [-1,1])m.tube([[s*.13,2.9,-3.17,.04],[s*.34,2.9,-3.22,.04],[s*.57,2.8,-3.17,.04]],8,false);
  m.tube([[-.26,2.78,-2.27,.04],[0,2.8,-2.24,.04],[.26,2.78,-2.27,.04]],8,false);
  m.tube([[0,2.68,-1.97,.14],[0,2.55,-1.57,.13],[0,2.46,-1.31,.09]],10,false);
  for(const s of [-1,1]){
    m.tube([[s*1.28,2.36,-.15,.25],[s*.45,2.58,-.85,.23],[-s*.45,2.6,-1.35,.19]],12,false);
    cryptEllipsoid(m,[-s*.5,2.61,-1.36],[.24,.13,.35],12,8);
  }
  m.mat=M.PAINT;m.ea=PC.MALA;cryptEllipsoid(m,[0,2.75,-3.58],[.12,.13,.15],12,8);m.ea=0;
  m.mat=M.GOLD;m.tube([[0,2.8,-3.62,.055],[0,3.12,-3.58,.07],[0,3.23,-3.72,.08]],8,false);
}
function meshCryptTreasure(m){
  m.mat=M.GRANITE;m.box(-18,10.8,-10,-10,11.3,.4,.12);m.box(-17.4,11.3,-9.6,-10.6,11.7,0,.1);
  CRYPT_SOLIDS.push([-18,-10,-10,.4,11.7]);
  m.fr=[-14,11.7,-5,1,0,1];meshRoyalCoffin(m);m.fr=null;
  CRYPT_SOLIDS.push([-16.1,-9.4,-11.9,-.2,14.9]);
  // Side displays keep the approach to the sarcophagus open.
  for(const [x,z,kind]of [[-13,6,0],[-21,4,0],[-4,-10,0]]){
    m.mat=M.GRANITE;m.box(x-2.7,10.8,z-1.8,x+2.7,11.55,z+1.8,.1);
    m.add(meshTreasure(kind),x,11.55,z,PI/2,1.2);CRYPT_SOLIDS.push([x-2.7,z-1.8,x+2.7,z+1.8,13.9]);
    for(const dx of [-1.7,1.5]){m.mat=M.GOLD;m.lathe([[.35,11.55],[.27,11.8],[.65,12.05],[.9,12.4],[.85,12.45],[.74,12.15]],{seg:20,cx:x+dx,cz:z+1.1});}
  }
  // Four canopic jars with stylised sculpted heads; no animated characters.
  for(let k=0;k<4;k++){
    const x=-21,z=-10+k*2.1;
    m.mat=M.SANDST;m.lathe([[.48,10.8],[.65,11.1],[.67,12.4],[.45,12.75],[.42,12.9]],{seg:20,cx:x,cz:z});
    m.mat=M.PAINT;m.ea=PC.MALA;cryptEllipsoid(m,[x,13.22,z],[.5,.46,k%2?.65:.45],16,10);m.ea=0;
    m.mat=M.GOLD;m.lathe([[.44,12.8],[.5,12.95],[.45,13.05]],{seg:20,cx:x,cz:z});
    CRYPT_SOLIDS.push([x-.65,z-.7,x+.65,z+.7,13.95]);
    if(k%2)for(const dx of [-.27,.27])cryptEllipsoid(m,[x+dx,13.63,z-.1],[.12,.3,.15],10,8);
  }
  // A patterned pectoral and gold coin stacks provide distinct close discoveries.
  m.fr=[-12,12.7,6.5,1,0,1];
  for(let k=0;k<5;k++){m.mat=M.GOLD;m.lathe([[.2,0],[.2,.12+k*.09]],{seg:12,cx:k*.45,cz:.1});}
  for(let k=0;k<17;k++){const a=k*PI/16;m.mat=k%3?M.GOLD:M.PAINT;m.ea=PC.MALA;cryptEllipsoid(m,[cos(a)*1.15,.2,sin(a)*.65],[.13,.08,.18],10,6);}m.ea=0;m.fr=null;
}
