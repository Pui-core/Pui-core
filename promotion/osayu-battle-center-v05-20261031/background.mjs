// Original native shapes only: no footage, third-party artwork, or character references.
export const backdrop={width:2400,height:3400};
export function studioShapes(variant){
 if(!['solo','collab'].includes(variant))throw Error('UNKNOWN_VARIANT');
 const out=[],r=(name,w,h,x,y,color,from=0,to=19,kind='rect')=>out.push({name,w,h,x,y,color,from,to,kind});
 const blend=(a,b,t)=>'#'+[0,2,4].map(i=>Math.round(parseInt(a.slice(i+1,i+3),16)*(1-t)+parseInt(b.slice(i+1,i+3),16)*t).toString(16).padStart(2,'0')).join('');
 const glow=(name,x,y,w,h,outer,inner,n=18)=>{for(let i=0;i<n;i++){const t=i/(n-1);r(name+' '+i,w*(1-.86*t),h*(1-.86*t),x,y,blend(outer,inner,t),0,19,'ellipse');}};
 const pill=(name,x,y,w,h,color)=>{const d=Math.min(w,h);if(w>=h){if(w>d)r(name+' middle',w-d,h,x,y,color);r(name+' left',d,d,x-(w-d)/2,y,color,0,19,'ellipse');r(name+' right',d,d,x+(w-d)/2,y,color,0,19,'ellipse');}else{r(name+' middle',w,h-d,x,y,color);r(name+' top',d,d,x,y-(h-d)/2,color,0,19,'ellipse');r(name+' bottom',d,d,x,y+(h-d)/2,color,0,19,'ellipse');}};
 r('STUDIO BACKDROP',2400,3400,540,960,'#101B31');
 glow('AMBIENT MINT',115,620,1350,2050,'#111d31','#315c68');
 glow('AMBIENT ROSE',970,740,1350,2050,'#111d31','#68445e');
 glow('CENTRAL SPOTLIGHT',540,1030,1020,1720,'#192c40','#395d66',22);
 pill('BACK WALL OUTER',540,1040,1160,1520,'#355361');pill('BACK WALL INNER',540,1040,1125,1485,'#182d40');
 glow('INNER HALO',540,1110,880,1300,'#182d40','#34555b',18);
 if(variant==='solo'){
  pill('SOLO FRAME MINT',210,1030,250,1420,'#69d5c8');pill('SOLO FRAME MINT INSET',210,1030,230,1398,'#213b4a');
  pill('SOLO FRAME ROSE',870,1030,250,1420,'#e291b9');pill('SOLO FRAME ROSE INSET',870,1030,230,1398,'#3d3045');
  glow('SOLO STAGE SPOT',540,1160,690,940,'#1b3344','#486a67',14);
  pill('SOLO OVERHEAD',540,390,780,44,'#8de5d5');pill('SOLO OVERHEAD INNER',540,390,700,16,'#e5f9f4');
 }else{
  pill('DUO FRAME MINT',295,1050,470,1200,'#69d5c8');pill('DUO FRAME MINT INSET',295,1050,442,1170,'#214653');
  pill('DUO FRAME ROSE',785,1050,470,1200,'#e997c0');pill('DUO FRAME ROSE INSET',785,1050,442,1170,'#4a3046');
  glow('DUO LEFT SPOT',295,1120,390,870,'#214653','#3e6569',12);glow('DUO RIGHT SPOT',785,1120,390,870,'#4a3046','#725065',12);
  pill('DUO OVERHEAD LEFT',285,405,400,34,'#9af1df');pill('DUO OVERHEAD RIGHT',795,405,400,34,'#ffd0e4');
 }
 pill('STAGE SHADOW',540,1640,1250,270,'#101a2d');pill('STAGE EDGE',540,1590,1110,210,'#557884');pill('STAGE SURFACE',540,1565,1070,175,'#294652');pill('STAGE HIGHLIGHT',540,1505,850,20,'#b3efe5');
 for(const [id,color,from,to] of [['DATE','#80ead4',0,3.2],['TEACHER','#f6a5cc',3.2,7.2],['RESOLVE','#ebd387',7.2,11.1],['CHEER','#a9a9f5',11.1,14.8],['RETURN','#80ead4',14.8,19]])r('SCENE '+id+' LIGHT',1020,10,540,570,color,from,to);
 return out;
}
