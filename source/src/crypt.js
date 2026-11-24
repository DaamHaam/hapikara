// A continuous submerged entrance and a dry crypt, all in world coordinates.
// Rectangles meet at real doorways; the collision query and masonry share this plan.
const CRYPT_ROOMS=[
  [96,32,120,40,3.2,6.3],
  [58,32,96,40,3.2,7.2],
  [50,12,58,40,10.8,16.8],
  [-25,-14,58,12,10.8,24],
];
const CRYPT_TARGET=[-6,12.3,0];
const CRYPT_FIRES=[[78,10,38.8],[54,14,25],[36,14,-12.8],[12,14,10.8],[-20,14,-12.8]];
const cryptFloor=(i,x)=>i===1?3.2+(96-x)*.2:CRYPT_ROOMS[i][4];
const cryptCeil=(i,x)=>i===1?cryptFloor(i,x)+4:CRYPT_ROOMS[i][5];
function cryptZone(x,y,z,footprint=false){
  for(let i=0;i<CRYPT_ROOMS.length;i++){const b=CRYPT_ROOMS[i];if(x>=b[0]&&x<=b[2]&&z>=b[1]&&z<=b[3]&&(footprint||(y>=cryptFloor(i,x)-.15&&y<=cryptCeil(i,x)+.1)))return i;}
  return -1;
}
const cryptInside=(x,y,z)=>x<95.5&&cryptZone(x,y,z)>=0;
// Entry of the sunlight at the first wall/roof met along the configured sun direction.
const CRYPT_RAY=(()=>{
  const p=CRYPT_TARGET,b=CRYPT_ROOMS[3];let t=(b[5]-p[1])/max(.001,SUN[1]),side=4;
  for(const [axis,low,high,loSide,hiSide]of [[0,b[0],b[2],0,1],[2,b[1],b[3],2,3]]){
    const v=SUN[axis];if(abs(v)<.001)continue;const q=((v>0?high:low)-p[axis])/v;
    if(q<t){t=q;side=v>0?hiSide:loSide;}
  }return {p:p.map((v,i)=>v+SUN[i]*t),length:t,side};
})();
const CRYPT_SOLIDS=[]; // [x0,z0,x1,z1,top], populated with the rendered furniture
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
    if(i===3&&CRYPT_RAY.side===4){const p=CRYPT_RAY.p;wall(1,c0,x0,x1,z0,z1,[0,-1,0],[[p[0]-.35,p[2]-.35,p[0]+.35,p[2]+.35]]);}
    else quad([[x0,c0,z0],[x1,c1,z0],[x1,c1,z1],[x0,c0,z1]],[0,-1,0]);
    if(i===0){wall(2,z0,x0,x1,f0,c0,[0,0,1]);wall(2,z1,x0,x1,f0,c0,[0,0,-1]);}
    if(i===1){
      for(const [z,n]of [[z0,[0,0,1]],[z1,[0,0,-1]]])quad([[x0,f0,z],[x1,f1,z],[x1,c1,z],[x0,c0,z]],n);
    }
    if(i===2){wall(0,x0,z0,z1,f0,c0,[1,0,0]);wall(0,x1,z0,z1,f0,c0,[-1,0,0],[[32,10.8,40,14.8]]);wall(2,z1,x0,x1,f0,c0,[0,0,-1]);}
    if(i===3){
      const p=CRYPT_RAY.p,s=CRYPT_RAY.side;
      wall(0,x0,z0,z1,f0,c0,[1,0,0],s===0?[[p[2]-.35,p[1]-.22,p[2]+.35,p[1]+.22]]:[]);
      wall(0,x1,z0,z1,f0,c0,[-1,0,0],s===1?[[p[2]-.35,p[1]-.22,p[2]+.35,p[1]+.22]]:[]);
      wall(2,z0,x0,x1,f0,c0,[0,0,1],s===2?[[p[0]-.35,p[1]-.22,p[0]+.35,p[1]+.22]]:[]);
      const openings=[[50,10.8,58,16.8]];if(s===3)openings.push([p[0]-.35,p[1]-.22,p[0]+.35,p[1]+.22]);
      wall(2,z1,x0,x1,f0,c0,[0,0,-1],openings);
      // Recessed green/gold bands and repeated shallow piers establish the scale.
      for(const z of [z0+.02,z1-.02])for(const x of [-20,-4,12,28,44]){
        m.mat=M.SANDST;m.box(x-.55,f0,z-.2,x+.55,23.6,z+.2,.12);
        bandRect(m,x-.58,z-.24,x+.58,z+.24,15.8,16.6,PC.MALA,true);
      }
      m.mat=M.GRANITE;m.box(-10,10.8,-4,-2,11.5,4,.2);CRYPT_SOLIDS.push([-10,-4,-2,4,11.5]);
      sarcophagus(m,-6,11.5,0,1.2);CRYPT_SOLIDS.push([-7.9,-3.3,-4.1,3.3,13]);
      for(const [x,z]of [[3,-8],[24,8]]){m.mat=M.GOLD;m.lathe([[.8,10.8],[.7,11.2],[.9,12],[.55,12.3]],{seg:12,cx:x,cz:z});}
    }
  }
  // Braziers are fixed; only the flame silhouette and its illumination flicker.
  for(const [x,y,z]of CRYPT_FIRES){m.mat=M.GOLD;m.lathe([[.25,y-1.8],[.17,y-.55],[.65,y-.4],[.58,y]],{seg:10,cx:x,cz:z});}
  return m.build();
}
function meshFlame(){const m=new MB(256);m.mat=M.FLAME;m.lathe([[.12,0],[.38,.35],[.25,.75],[.07,1.3],[0,1.6]],{seg:8});return m.build();}
