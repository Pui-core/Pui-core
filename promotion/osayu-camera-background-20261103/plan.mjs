export const width=1080,height=1920,fps=30,duration=19;
export const revision='v08';
export const compName='Osayu curved studio '+revision;
export const characterBoxes=v=>v==='solo'?[{id:'osayu',x:410,y:990,w:260,h:520,sw:905,sh:1810}]:[{id:'osayu',x:285,y:1020,w:220,h:440,sw:905,sh:1810},{id:'collaborator',x:575,y:1020,w:220,h:440,sw:2000,sh:4000}];
const content={
 date:['11/3','チュートリアルバトル','おさゆ、挑戦。'],
 teacher:['セラ先輩','先生は セラ・ネージュ','尊敬する先輩と。'],
 resolve:['頑張ります！','緊張してるけど','おさゆの挑戦'],
 cheer:['応援、待ってます！','みんなと一緒に','プロフィールから配信へ'],
 return:['11/3','チュートリアルバトル','プロフィールから配信へ']
};
export function scenesFor(v){
 const ids=v==='solo'?['date','teacher','resolve','cheer','return']:['date','resolve','teacher','cheer','return'];
 const times=v==='solo'?[0,3.2,7.2,11.1,14.8,19]:[0,3.0,6.5,10.8,14.8,19];
 const centers=v==='solo'?[[500,810],[590,800],[470,835],[580,815],[540,820]]:[[590,805],[470,830],[605,800],[475,810],[540,820]];
 return ids.map((id,i)=>({id,from:times[i],to:times[i+1],heading:content[id][0],sub:content[id][1],note:content[id][2],center:centers[i]}));
}
// Each row: seconds, focus X/Y, zoom, perspective yaw/pitch. Holds and fast
// reversals are deliberately unequal and tied to the next piece of information.
export const cameraKeys={
 solo:[
  [0,650,1090,.94,-16,7],[.48,505,955,1.37,-5,2],[1.08,490,960,1.42,-2,0],
  [1.65,490,960,1.42,-2,0],[2.02,555,1030,.96,12,-5],[2.67,545,1025,.99,8,-2],
  [3.2,650,1040,1.04,14,5],[3.78,590,945,1.36,2,1],[4.55,570,950,1.38,-2,0],
  [4.95,570,950,1.38,-2,0],[5.30,605,1010,1.02,-12,-6],[6.4,575,1010,1.07,-6,-2],
  [7.2,400,1090,.98,-16,5],[7.68,470,990,1.30,-5,1],[8.3,470,990,1.30,-5,1],
  [8.55,465,960,1.44,4,0],[9.12,465,960,1.44,4,0],[9.52,540,1045,1.00,12,-5],
  [10.65,535,1025,1.04,7,-2],[11.1,665,1040,1.00,14,6],[11.72,580,960,1.30,2,1],
  [12.18,580,960,1.30,2,1],[12.68,555,990,1.20,-6,-2],[13.45,555,990,1.20,-6,-2],
  [14.2,540,1040,.98,-12,-5],[14.8,540,1020,1.01,-10,4],[15.35,540,970,1.28,-2,0],
  [16.05,540,970,1.28,-2,0],[16.6,540,1020,1.04,0,0],[19,540,1020,1.04,0,0]
 ],
 collab:[
  [0,435,1100,.97,17,-7],[.32,590,975,1.29,5,-1],[.86,605,970,1.34,0,0],
  [1.35,605,970,1.34,0,0],[1.69,520,1080,.93,-15,7],[2.35,525,1050,1.02,-9,3],
  [3.0,390,1030,1.04,-16,5],[3.42,470,980,1.28,-4,0],[4.1,470,980,1.28,-4,0],
  [4.37,470,960,1.39,5,-1],[4.83,470,960,1.39,5,-1],[5.20,535,1070,.98,14,-5],
  [6.0,540,1040,1.03,8,-2],[6.5,680,1040,1.00,18,6],[7.18,605,955,1.32,3,0],
  [7.92,605,955,1.32,3,0],[8.50,550,1035,1.02,-10,-3],[9.0,550,1035,1.02,-10,-3],
  [9.38,595,980,1.23,-3,0],[10.1,595,980,1.23,-3,0],[10.8,405,1050,1.01,-15,5],
  [11.24,475,965,1.27,-3,0],[12.2,475,965,1.27,-3,0],[12.65,535,1060,.96,12,-5],
  [13.2,535,1060,.96,12,-5],[13.8,500,1000,1.15,3,-1],[14.8,540,1050,.99,10,3],
  [15.18,540,970,1.25,1,0],[16.1,540,970,1.25,1,0],[16.72,540,1020,1.03,0,0],[19,540,1020,1.03,0,0]
 ]
};
// Pull-back beats change height as well as distance; the final date/CTA settles.
for(const keys of Object.values(cameraKeys))for(const k of keys){
 if(k[0]<14.8&&k[3]<=1.07)k[2]=960+(k[2]-960)*2.1;
}
export function cameraAt(t,v){
 const keys=cameraKeys[v];if(!keys)throw Error('variant');
 const i=Math.max(0,keys.findIndex((k,n)=>n===keys.length-1||t<keys[n+1][0]));
 const a=keys[i],b=keys[Math.min(i+1,keys.length-1)],u=b[0]===a[0]?0:Math.max(0,Math.min(1,(t-a[0])/(b[0]-a[0]))),e=u*u*(3-2*u);
 // Keep the outgoing pose until the next information scene, then cut to its
 // distinct incoming framing. Never reset cut length by splitting equal frames.
 const boundary=scenesFor(v).slice(1).some(scene=>scene.from===b[0]);
 const q=a.slice(1).map((x,j)=>x+(b[j+1]-x)*(boundary?0:e)),[x,y,s,yaw,pitch]=q;
 return {target:[x,y],zoom:s,position:[540+(540-x)*s,960+(960-y)*s,0],scale:[s*100,s*100,100],yaw,pitch};
}
