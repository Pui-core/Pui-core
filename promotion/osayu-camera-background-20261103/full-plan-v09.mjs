import {previewCamera} from './preview-plan-v09.mjs';
export const width=1080,height=1920,fps=30,revision='v09-r02';
export const compName='Osayu v09 full music edition';
export const sourceIn=46.0755,sourceSHA256='38b7b571b93b0df53b4f3f6832f9432c0a32906383a5de1c0e9db33b22ed3156';
export const framesFor=v=>v==='solo'?563:591;
export const durationFor=v=>framesFor(v)/fps;
export const cutFramesFor=v=>v==='solo'?[0,85,197,338,478,563]:[0,85,225,338,478,591];
export const characterBoxes=v=>v==='solo'?[{id:'osayu',x:385,y:1000,w:310,h:620,sw:905,sh:1810}]:[{id:'osayu',x:270,y:1060,w:250,h:500,sw:905,sh:1810},{id:'collaborator',x:560,y:1060,w:250,h:500,sw:2000,sh:4000}];
const content={date:['11/3','チュートリアルバトル','おさゆ、挑戦。'],teacher:['セラ先輩','先生は セラ・ネージュ','尊敬する先輩と。'],resolve:['頑張ります！','緊張してるけど','おさゆの挑戦'],cheer:['応援、待ってます！','みんなと一緒に','プロフィールから配信へ'],return:['11/3','チュートリアルバトル','プロフィールから配信へ']};
export function scenesFor(v){
 const ids=v==='solo'?['date','resolve','teacher','cheer','return']:['date','teacher','resolve','cheer','return'];
 const centers=v==='solo'?[[515,760],[500,770],[590,760],[500,780],[540,760]]:[[585,760],[590,760],[470,780],[605,770],[540,760]],cuts=cutFramesFor(v);
 const entries=v==='solo'?[[400,220],[-420,70],[450,-100],[-90,300],[0,-200]]:[[-420,180],[430,-120],[-60,180],[200,280],[0,-170]];
 const exits=v==='solo'?[[-180,-220],[190,170],[-320,30],[120,-200],[0,0]]:[[180,-190],[-250,90],[200,180],[-160,-200],[0,0]];
 return ids.map((id,i)=>({id,fromFrame:cuts[i],toFrame:cuts[i+1],heading:content[id][0],sub:content[id][1],note:content[id][2],center:centers[i],entry:entries[i],exit:exits[i],pop:id==='resolve'?'punch':id==='teacher'?'reply':id==='cheer'?'rise':id==='return'?'focus':'diagonal',readFrom:cuts[i]+20,readTo:i===4?cuts[i+1]:cuts[i+1]-10}));
}
export const cameraKeys={
 solo:[...previewCamera.solo,[182,540,1030,.98,4,0],[196,540,1030,.98,4,0],
 [197,680,1080,.96,18,6],[211,590,970,1.18,3,0],[241,590,970,1.18,3,0],[253,560,1100,.94,-12,-5],[270,560,1080,.98,-8,-2],[281,590,950,1.28,1,0],[309,590,950,1.28,1,0],[324,550,1070,.98,10,-4],[337,550,1070,.98,10,-4],
 [338,385,1080,.97,-16,5],[366,500,980,1.12,-2,0],[404,500,980,1.12,-2,0],[422,540,1070,1.02,9,-3],[450,540,1070,1.02,9,-3],[462,510,1010,1.08,3,0],[477,510,1010,1.08,3,0],
 [478,540,1100,.96,-10,5],[492,540,950,1.20,0,0],[520,540,950,1.20,0,0],[534,540,1040,1.03,0,0],[562,540,1040,1.03,0,0]],
 collab:[...previewCamera.collab,[183,600,965,1.16,2,0],[197,600,965,1.16,2,0],[211,530,1080,.94,-12,-4],[224,530,1080,.94,-12,-4],
 [225,400,1100,.98,-16,6],[239,470,940,1.25,-2,0],[267,470,940,1.25,-2,0],[281,480,960,1.30,5,0],[309,480,960,1.30,5,0],[324,535,1080,.96,14,-5],[337,535,1080,.96,14,-5],
 [338,690,1050,1.04,15,5],[366,605,960,1.14,2,0],[393,605,960,1.14,2,0],[408,550,1080,.95,-12,-4],[436,550,1080,.95,-12,-4],[450,590,1000,1.10,-2,0],[477,590,1000,1.10,-2,0],
 [478,540,1080,.96,12,4],[492,540,950,1.22,0,0],[520,540,950,1.22,0,0],[534,540,1040,1.01,0,0],[565,540,1040,1.01,0,0],[576,540,1020,1.04,0,0],[590,540,1020,1.04,0,0]]
};
export function cameraAtFrame(f,v){
 const keys=cameraKeys[v];let i=0;while(i<keys.length-1&&f>=keys[i+1][0])i++;
 const a=keys[i],b=keys[Math.min(i+1,keys.length-1)],u=Math.max(0,Math.min(1,b[0]===a[0]?0:(f-a[0])/(b[0]-a[0]))),e=u*u*(3-2*u),jump=cutFramesFor(v).includes(b[0]);
 const [x,y,z,yaw,pitch]=a.slice(1).map((n,j)=>n+(b[j+1]-n)*(jump?0:e));return {frame:f,t:f/30,target:[x,y],position:[540+(540-x)*z,960+(960-y)*z,0],scale:[z*100,z*100,100],zoom:z,yaw,pitch};
}
export const cameraAt=(t,v)=>cameraAtFrame(Math.round(t*30),v);
export function popupAtFrame(f,s){
 const q=f-s.fromFrame,n=s.toFrame-s.fromFrame,[cx,cy]=s.center;let dx=0,dy=0,z=100;
 if(s.pop==='punch'){
  if(q<8){const e=1-Math.pow(1-q/8,3);dx=s.entry[0]*(1-e);dy=s.entry[1]*(1-e);z=55+54*e;}
  else if(q<16){const u=(q-8)/8,e=u*u*(3-2*u);z=109-9*e;}
 }else if(s.pop==='reply'){
  if(q<10){const e=1-Math.pow(1-q/10,3);dx=s.entry[0]*(1-e)-Math.sign(s.entry[0])*22*e;dy=s.entry[1]*(1-e);z=95+5*e;}
  else if(q<16){const u=(q-10)/6,e=u*u*(3-2*u);dx=-Math.sign(s.entry[0])*22*(1-e);}
 }else{
  if(q<10){const e=1-Math.pow(1-q/10,3);dx=s.entry[0]*(1-e);dy=s.entry[1]*(1-e);z=(s.pop==='focus'?118:78)+(s.pop==='focus'?-15:25)*e;}
  else if(q<14){const u=(q-10)/4,e=u*u*(3-2*u);z=103-3*e;}
 }
 if(s.id!=='return'&&q>=n-10){const u=(q-(n-10))/9;dx=s.exit[0]*u*u;dy=s.exit[1]*u*u;z=100+(s.pop==='punch'?12:-12)*u*u;}
 return {position:[cx+dx,cy+dy,0],scale:[z,z,100]};
}
